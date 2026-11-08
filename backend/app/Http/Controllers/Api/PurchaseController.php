<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessGstin;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use App\Modules\GSTEngine\Services\GSTCalculationEngine;
use App\Services\AccountingEngineService;
use App\Services\ManufacturingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    protected GSTCalculationEngine $gstEngine;
    protected AccountingEngineService $accountingService;
    protected ManufacturingService $mfgService;

    public function __construct(
        GSTCalculationEngine $gstEngine,
        AccountingEngineService $accountingService,
        ManufacturingService $mfgService
    ) {
        $this->gstEngine = $gstEngine;
        $this->accountingService = $accountingService;
        $this->mfgService = $mfgService;
    }

    /**
     * Tenant verification helper.
     */
    protected function authorizeBusiness(Request $request, string $businessId): void
    {
        $user = $request->user('sanctum') ?? $request->user();
        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $allowed = DB::table('businesses')
                ->where('id', $businessId)
                ->whereIn('organization_id', $userOrgIds)
                ->exists();

            if (!$allowed) {
                abort(403, 'Unauthorized: Business does not belong to your organization.');
            }
        }
    }

    /**
     * List Inward Purchase Bills.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'status' => 'nullable|string|in:received,paid,partially_paid,cancelled',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $query = PurchaseBill::where('business_id', $validated['business_id'])
            ->with(['supplier', 'businessGstin', 'godown'])
            ->latest('bill_date');

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store Inward Purchase Bill (records bill, posts double-entry, adds to godown stock).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'business_gstin_id' => 'required|uuid|exists:business_gstins,id',
            'supplier_id' => 'required|uuid|exists:customers,id',
            'godown_id' => 'nullable|uuid|exists:godowns,id',
            'bill_number' => 'required|string|max:50',
            'bill_date' => 'required|date',
            'due_date' => 'nullable|date',
            'place_of_supply_state_code' => 'required|string|size:2',
            'reverse_charge' => 'nullable|boolean',
            'itc_eligibility' => 'nullable|string|in:inputs,capital_goods,input_services,ineligible',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|uuid|exists:products,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.hsn_sac' => 'required|string|max:8',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit' => 'nullable|string|max:10',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.gst_rate' => 'required|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        // Multi-Tenant Isolation: Ensure all foreign-key entities strictly belong to this business
        $businessGstin = BusinessGstin::where('business_id', $validated['business_id'])
            ->findOrFail($validated['business_gstin_id']);

        \App\Models\Customer::where('business_id', $validated['business_id'])
            ->findOrFail($validated['supplier_id']);

        if (!empty($validated['godown_id'])) {
            \App\Models\Godown::where('business_id', $validated['business_id'])
                ->findOrFail($validated['godown_id']);
        }

        $isInterstate = $this->gstEngine->isInterstate(
            $businessGstin->state_code,
            $validated['place_of_supply_state_code']
        );

        return DB::transaction(function () use ($validated, $isInterstate) {
            $calculatedItems = [];
            foreach ($validated['items'] as $item) {
                $qty = (string) $item['quantity'];
                $price = (string) $item['unit_price'];
                $discount = (string) ($item['discount_amount'] ?? '0.00');

                $gross = bcmul($qty, $price, 4);
                $taxable = bcsub($gross, $discount, 4);

                $taxSplit = $this->gstEngine->calculateItemTaxes(
                    taxableValue: $taxable,
                    gstRate: (string) $item['gst_rate'],
                    isInterstate: $isInterstate
                );

                $calculatedItems[] = array_merge($item, $taxSplit, [
                    'taxable_value' => bcdiv($taxable, '1', 2),
                    'discount_amount' => bcdiv($discount, '1', 2),
                ]);
            }

            $totals = $this->gstEngine->calculateDocumentTotals($calculatedItems);

            $bill = PurchaseBill::create([
                'business_id' => $validated['business_id'],
                'business_gstin_id' => $validated['business_gstin_id'],
                'supplier_id' => $validated['supplier_id'],
                'godown_id' => $validated['godown_id'] ?? null,
                'bill_number' => $validated['bill_number'],
                'bill_date' => $validated['bill_date'],
                'due_date' => $validated['due_date'] ?? null,
                'place_of_supply_state_code' => $validated['place_of_supply_state_code'],
                'is_interstate' => $isInterstate,
                'reverse_charge' => $validated['reverse_charge'] ?? false,
                'itc_eligibility' => $validated['itc_eligibility'] ?? 'inputs',
                'total_taxable_value' => $totals['total_taxable_value'],
                'total_cgst' => $totals['total_cgst'],
                'total_sgst' => $totals['total_sgst'],
                'total_igst' => $totals['total_igst'],
                'total_cess' => $totals['total_cess'],
                'total_tax_amount' => $totals['total_tax_amount'],
                'round_off' => $totals['round_off'],
                'grand_total' => $totals['grand_total'],
                'paid_amount' => '0.00',
                'status' => 'received',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($calculatedItems as $calc) {
                PurchaseBillItem::create([
                    'purchase_bill_id' => $bill->id,
                    'product_id' => $calc['product_id'] ?? null,
                    'item_name' => $calc['item_name'],
                    'hsn_sac' => $calc['hsn_sac'],
                    'quantity' => (string) $calc['quantity'],
                    'unit' => $calc['unit'] ?? 'NOS',
                    'unit_price' => (string) $calc['unit_price'],
                    'discount_amount' => (string) $calc['discount_amount'],
                    'taxable_value' => (string) $calc['taxable_value'],
                    'cgst_rate' => (string) $calc['cgst_rate'],
                    'cgst_amount' => (string) $calc['cgst_amount'],
                    'sgst_rate' => (string) $calc['sgst_rate'],
                    'sgst_amount' => (string) $calc['sgst_amount'],
                    'igst_rate' => (string) $calc['igst_rate'],
                    'igst_amount' => (string) $calc['igst_amount'],
                    'total_amount' => (string) $calc['item_total'],
                ]);

                // If product is linked and godown is provided, add to stock!
                if (!empty($calc['product_id']) && !empty($validated['godown_id'])) {
                    $this->mfgService->adjustStock(
                        businessId: $validated['business_id'],
                        godownId: $validated['godown_id'],
                        productId: $calc['product_id'],
                        quantityDelta: (string) $calc['quantity'],
                        unitCost: (string) $calc['unit_price']
                    );
                }
            }

            // Post double-entry to General Ledger
            $this->accountingService->postPurchaseBill($bill);

            return response()->json($bill->load(['items', 'supplier']), 201);
        });
    }

    /**
     * Show Purchase Bill.
     */
    public function show(Request $request, string $id)
    {
        $bill = PurchaseBill::with(['items', 'supplier', 'businessGstin', 'godown'])->findOrFail($id);
        $this->authorizeBusiness($request, $bill->business_id);

        return response()->json($bill);
    }
}

