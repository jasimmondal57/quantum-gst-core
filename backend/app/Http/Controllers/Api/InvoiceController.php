<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessGstin;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceSequence;
use App\Modules\GSTEngine\Services\GSTCalculationEngine;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    protected GSTCalculationEngine $gstEngine;

    public function __construct(GSTCalculationEngine $gstEngine)
    {
        $this->gstEngine = $gstEngine;
    }

    public function index(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $businessId = $request->query('business_id');

        $query = Invoice::with(['items', 'customer', 'businessGstin']);
        if ($businessId) {
            $query->where('business_id', $businessId);
        } elseif ($user) {
            $orgIds = $user->organizations()->pluck('organizations.id');
            $query->whereIn('organization_id', $orgIds);
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|uuid|exists:organizations,id',
            'business_id' => 'required|uuid|exists:businesses,id',
            'business_gstin_id' => 'nullable|uuid|exists:business_gstins,id',
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'invoice_date' => 'required|date',
            'place_of_supply_state_code' => 'required|string|size:2',
            'reverse_charge' => 'nullable|boolean',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|uuid|exists:products,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.hsn_sac' => 'required|string|max:8',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit' => 'nullable|string|max:10',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.gst_rate' => 'required|numeric|min:0|max:100',
            'items.*.cess_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        return DB::transaction(function () use ($validated) {
            if (empty($validated['business_gstin_id'])) {
                $existingGstin = BusinessGstin::where('business_id', $validated['business_id'])->first();
                if (!$existingGstin) {
                    $bizName = DB::table('businesses')->where('id', $validated['business_id'])->value('legal_name') ?? 'Business';
                    $existingGstin = BusinessGstin::create([
                        'business_id' => $validated['business_id'],
                        'gstin' => '27' . strtoupper(substr(md5($validated['business_id']), 0, 10)) . '1Z5',
                        'state_code' => '27',
                        'state_name' => 'Maharashtra',
                        'legal_name' => $bizName,
                        'is_primary' => true,
                        'status' => 'active',
                    ]);
                }
                $validated['business_gstin_id'] = $existingGstin->id;
            }

            $gstin = BusinessGstin::findOrFail($validated['business_gstin_id']);
            $isInterstate = $this->gstEngine->isInterstate(
                $gstin->state_code,
                $validated['place_of_supply_state_code']
            );

            // 1. Process items through GST Engine
            $calculatedItems = [];
            foreach ($validated['items'] as $item) {
                $qty = (string) $item['quantity'];
                $unitPrice = (string) $item['unit_price'];
                $taxable = bcmul($qty, $unitPrice, 4);

                $taxBreakdown = $this->gstEngine->calculateItemTaxes(
                    $taxable,
                    (string) $item['gst_rate'],
                    $isInterstate,
                    (string) ($item['cess_rate'] ?? '0')
                );

                $calculatedItems[] = array_merge($item, $taxBreakdown);
            }

            // 2. Calculate document statutory totals
            $totals = $this->gstEngine->calculateDocumentTotals($calculatedItems);

            // 3. Generate sequential invoice number for the financial year
            $invDate = Carbon::parse($validated['invoice_date']);
            $fyStart = $invDate->month >= 4 ? $invDate->year : $invDate->year - 1;
            $fyString = $fyStart . '-' . substr((string) ($fyStart + 1), -2);

            $sequence = InvoiceSequence::firstOrCreate(
                [
                    'business_id' => $validated['business_id'],
                    'business_gstin_id' => $validated['business_gstin_id'],
                    'document_type' => 'invoice',
                    'financial_year' => $fyString,
                ],
                [
                    'prefix' => 'INV/',
                    'next_number' => 1,
                ]
            );

            $invoiceNumber = $sequence->prefix . $fyString . '/' . str_pad((string) $sequence->next_number, 4, '0', STR_PAD_LEFT);
            $sequence->increment('next_number');

            // 4. Create Invoice Record
            $invoice = Invoice::create([
                'organization_id' => $validated['organization_id'],
                'business_id' => $validated['business_id'],
                'business_gstin_id' => $validated['business_gstin_id'],
                'customer_id' => $validated['customer_id'] ?? null,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $validated['invoice_date'],
                'invoice_type' => 'tax_invoice',
                'status' => 'finalized',
                'place_of_supply_state_code' => $validated['place_of_supply_state_code'],
                'is_interstate' => $isInterstate,
                'reverse_charge' => $validated['reverse_charge'] ?? false,
                'total_taxable_value' => $totals['total_taxable_value'],
                'total_cgst' => $totals['total_cgst'],
                'total_sgst' => $totals['total_sgst'],
                'total_igst' => $totals['total_igst'],
                'total_cess' => $totals['total_cess'],
                'total_tax_amount' => $totals['total_tax_amount'],
                'round_off' => $totals['round_off'],
                'grand_total' => $totals['grand_total'],
                'source' => 'manual',
            ]);

            // 5. Create Line Items
            foreach ($calculatedItems as $calcItem) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $calcItem['product_id'] ?? null,
                    'item_name' => $calcItem['item_name'],
                    'hsn_sac' => $calcItem['hsn_sac'],
                    'quantity' => $calcItem['quantity'],
                    'unit' => $calcItem['unit'] ?? 'NOS',
                    'unit_price' => $calcItem['unit_price'],
                    'taxable_value' => $calcItem['taxable_value'],
                    'cgst_rate' => $calcItem['cgst_rate'],
                    'cgst_amount' => $calcItem['cgst_amount'],
                    'sgst_rate' => $calcItem['sgst_rate'],
                    'sgst_amount' => $calcItem['sgst_amount'],
                    'igst_rate' => $calcItem['igst_rate'],
                    'igst_amount' => $calcItem['igst_amount'],
                    'cess_rate' => $calcItem['cess_rate'],
                    'cess_amount' => $calcItem['cess_amount'],
                    'total_amount' => $calcItem['item_total'],
                ]);
            }

            return response()->json($invoice->load('items', 'customer'), 201);
        });
    }

    public function show(string $id)
    {
        $invoice = Invoice::with(['items', 'customer', 'businessGstin', 'business'])->findOrFail($id);
        return response()->json($invoice);
    }

    public function downloadPdf(string $id)
    {
        $invoice = Invoice::with(['items', 'customer', 'businessGstin', 'business'])->findOrFail($id);
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('invoices.tax_invoice', compact('invoice'))
            ->setPaper('a4', 'portrait');

        $cleanNumber = str_replace(['/', '\\'], '-', $invoice->invoice_number);
        return $pdf->download("Tax_Invoice_{$cleanNumber}.pdf");
    }
}
