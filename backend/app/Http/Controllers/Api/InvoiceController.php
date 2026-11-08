<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessGstin;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceSequence;
use App\Modules\GSTEngine\Services\GSTCalculationEngine;
use App\Services\AccountingEngineService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    protected GSTCalculationEngine $gstEngine;
    protected AccountingEngineService $accountingService;

    public function __construct(GSTCalculationEngine $gstEngine, AccountingEngineService $accountingService)
    {
        $this->gstEngine = $gstEngine;
        $this->accountingService = $accountingService;
    }

    /**
     * List invoices scoped strictly to the authenticated tenant.
     */
    public function index(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $query = Invoice::with(['items', 'customer', 'businessGstin']);

        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $query->whereIn('organization_id', $userOrgIds);
        }

        if ($request->filled('business_id')) {
            $query->where('business_id', $request->query('business_id'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'ilike', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'ilike', "%{$search}%")
                         ->orWhere('gstin', 'ilike', "%{$search}%");
                  });
            });
        }

        return response()->json($query->latest()->paginate(20));
    }

    /**
     * Create statutory GST invoice with full tenant verification and without synthetic GSTIN generation.
     */
    public function store(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        $validated = $request->validate([
            'organization_id' => 'required|uuid|exists:organizations,id',
            'business_id' => 'required|uuid|exists:businesses,id',
            'business_gstin_id' => 'nullable|uuid|exists:business_gstins,id',
            'customer_id' => 'nullable|uuid|exists:customers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date',
            'invoice_type' => 'nullable|string|in:tax_invoice,bill_of_supply,export,reverse_charge',
            'supply_type' => 'nullable|string',
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
            'items.*.cess_specific' => 'nullable|numeric|min:0',
        ]);

        // Multi-Tenant Isolation Check: Ensure the user belongs to the target organization
        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            if (!in_array($validated['organization_id'], $userOrgIds, true)) {
                return response()->json(['message' => 'Unauthorized: You do not have access to this organization.'], 403);
            }

            // Ensure the target business belongs to this organization
            $bizBelongs = DB::table('businesses')
                ->where('id', $validated['business_id'])
                ->where('organization_id', $validated['organization_id'])
                ->exists();

            if (!$bizBelongs) {
                return response()->json(['message' => 'Selected business does not belong to the target organization.'], 403);
            }
        }

        return DB::transaction(function () use ($validated) {
            // Statutory GSTIN Resolution: Never synthesize a fake GSTIN
            if (empty($validated['business_gstin_id'])) {
                $primaryGstin = BusinessGstin::where('business_id', $validated['business_id'])
                    ->where('status', 'active')
                    ->orderByDesc('is_primary')
                    ->first();

                if (!$primaryGstin) {
                    return response()->json([
                        'message' => 'Statutory Compliance Error: No active GSTIN is registered for this business. Please register or select a verified GSTIN before issuing a GST Tax Invoice.'
                    ], 422);
                }

                $validated['business_gstin_id'] = $primaryGstin->id;
            }

            // Verify that the specified GSTIN strictly belongs to this business
            $gstin = BusinessGstin::where('business_id', $validated['business_id'])
                ->where('id', $validated['business_gstin_id'])
                ->firstOrFail();

            $supplyType = $validated['supply_type'] ?? GSTCalculationEngine::SUPPLY_REGULAR;

            $isInterstate = $this->gstEngine->isInterstate(
                $gstin->state_code,
                $validated['place_of_supply_state_code'],
                $supplyType
            );

            $isUtgst = $this->gstEngine->isUtgst($gstin->state_code);

            // 1. Process line items through pure BCMath GST Engine
            $calculatedItems = [];
            foreach ($validated['items'] as $item) {
                $qty = (string) $item['quantity'];
                $unitPrice = (string) $item['unit_price'];
                $taxable = bcmul($qty, $unitPrice, 4);

                $taxBreakdown = $this->gstEngine->calculateItemTaxes(
                    taxableValue: $taxable,
                    gstRate: (string) $item['gst_rate'],
                    isInterstate: $isInterstate,
                    isUtgst: $isUtgst,
                    cessRate: (string) ($item['cess_rate'] ?? '0'),
                    cessSpecific: (string) ($item['cess_specific'] ?? '0'),
                    supplyType: $supplyType,
                    isReverseCharge: (bool) ($validated['reverse_charge'] ?? false)
                );

                $calculatedItems[] = array_merge($item, $taxBreakdown);
            }

            // 2. Calculate document statutory totals
            $totals = $this->gstEngine->calculateDocumentTotals($calculatedItems);

            // 3. Sequential invoice numbering with financial year
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
                'due_date' => $validated['due_date'] ?? null,
                'invoice_type' => $validated['invoice_type'] ?? 'tax_invoice',
                'status' => 'finalized',
                'place_of_supply_state_code' => $validated['place_of_supply_state_code'],
                'is_interstate' => $isInterstate,
                'reverse_charge' => $validated['reverse_charge'] ?? false,
                'total_taxable_value' => $totals['total_taxable_value'],
                'total_cgst' => $totals['total_cgst'],
                'total_sgst' => $isUtgst ? $totals['total_utgst'] : $totals['total_sgst'],
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
                    'sgst_rate' => $isUtgst ? $calcItem['utgst_rate'] : $calcItem['sgst_rate'],
                    'sgst_amount' => $isUtgst ? $calcItem['utgst_amount'] : $calcItem['sgst_amount'],
                    'igst_rate' => $calcItem['igst_rate'],
                    'igst_amount' => $calcItem['igst_amount'],
                    'cess_rate' => $calcItem['cess_rate'],
                    'cess_amount' => $calcItem['cess_amount'],
                    'total_amount' => $calcItem['item_total'],
                ]);
            }

            // 6. Automatically post double-entry ledger records
            $this->accountingService->postInvoice($invoice);

            return response()->json($invoice->load('items', 'customer'), 201);
        });
    }

    /**
     * Show invoice scoped to authenticated tenant organizations.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $query = Invoice::with(['items', 'customer', 'businessGstin', 'business']);

        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $query->whereIn('organization_id', $userOrgIds);
        }

        $invoice = $query->findOrFail($id);
        return response()->json($invoice);
    }

    /**
     * Download statutory PDF scoped to authenticated tenant organizations.
     */
    public function downloadPdf(Request $request, string $id)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $query = Invoice::with(['items', 'customer', 'businessGstin', 'business']);

        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $query->whereIn('organization_id', $userOrgIds);
        }

        $invoice = $query->findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('invoices.tax_invoice', compact('invoice'))
            ->setPaper('a4', 'portrait');

        $cleanNumber = str_replace(['/', '\\'], '-', $invoice->invoice_number);
        return $pdf->download("Tax_Invoice_{$cleanNumber}.pdf");
    }

    /**
     * Cancel an issued invoice and post statutory double-entry reversal.
     */
    public function cancel(Request $request, string $id)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $query = Invoice::with(['items', 'customer', 'businessGstin']);

        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $query->whereIn('organization_id', $userOrgIds);
        }

        $invoice = $query->findOrFail($id);

        if ($invoice->status === 'cancelled') {
            return response()->json(['message' => 'Invoice is already cancelled.'], 400);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        return DB::transaction(function () use ($invoice, $validated) {
            $invoice->status = 'cancelled';
            $invoice->notes = ($invoice->notes ? $invoice->notes . "\n" : "") . "Cancelled on " . now()->toDateTimeString() . " - Reason: " . $validated['reason'];
            $invoice->save();

            // Post double-entry reversal
            $reversalEntry = $this->accountingService->reverseInvoice($invoice, $validated['reason']);

            return response()->json([
                'success' => true,
                'message' => 'Invoice cancelled and general ledger reversal entry posted.',
                'invoice' => $invoice,
                'reversal_entry' => $reversalEntry,
            ]);
        });
    }
}
