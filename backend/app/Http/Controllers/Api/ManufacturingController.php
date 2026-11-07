<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillOfMaterial;
use App\Models\Godown;
use App\Models\ProductionOrder;
use App\Models\StockBalance;
use App\Models\StockTransfer;
use App\Services\ManufacturingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ManufacturingController extends Controller
{
    protected ManufacturingService $mfgService;

    public function __construct(ManufacturingService $mfgService)
    {
        $this->mfgService = $mfgService;
    }

    /**
     * Tenant isolation check helper.
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
     * List Godowns / Warehouses.
     */
    public function godowns(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $godowns = Godown::where('business_id', $validated['business_id'])
            ->withCount('stockBalances')
            ->orderBy('code')
            ->get();

        return response()->json($godowns);
    }

    /**
     * Create Godown / Warehouse.
     */
    public function storeGodown(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'state_code' => 'nullable|string|size:2',
            'state_name' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:6',
            'is_primary' => 'nullable|boolean',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        if (!empty($validated['is_primary']) && $validated['is_primary']) {
            Godown::where('business_id', $validated['business_id'])->update(['is_primary' => false]);
        }

        $godown = Godown::create([
            'business_id' => $validated['business_id'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'state_code' => $validated['state_code'] ?? null,
            'state_name' => $validated['state_name'] ?? null,
            'pincode' => $validated['pincode'] ?? null,
            'is_primary' => $validated['is_primary'] ?? false,
            'status' => 'active',
        ]);

        return response()->json($godown, 201);
    }

    /**
     * Get stock inventory for a Godown.
     */
    public function godownStock(Request $request, string $id)
    {
        $godown = Godown::findOrFail($id);
        $this->authorizeBusiness($request, $godown->business_id);

        $stock = StockBalance::where('godown_id', $godown->id)
            ->with('product')
            ->orderBy('product_id')
            ->get();

        return response()->json([
            'godown' => $godown,
            'inventory' => $stock,
        ]);
    }

    /**
     * List Bills of Materials (BOM).
     */
    public function boms(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $boms = BillOfMaterial::where('business_id', $validated['business_id'])
            ->with(['finishedGood', 'items.rawMaterial'])
            ->latest()
            ->paginate(20);

        return response()->json($boms);
    }

    /**
     * Create Bill of Materials.
     */
    public function storeBom(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'finished_good_id' => 'required|uuid|exists:products,id',
            'name' => 'required|string|max:255',
            'output_quantity' => 'required|numeric|min:0.0001',
            'output_unit' => 'required|string|max:10',
            'estimated_labor_cost' => 'nullable|numeric|min:0',
            'estimated_overhead_cost' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.raw_material_id' => 'required|uuid|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit' => 'nullable|string|max:10',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.estimated_wastage_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $bom = $this->mfgService->createBOM(
            businessId: $validated['business_id'],
            finishedGoodId: $validated['finished_good_id'],
            name: $validated['name'],
            outputQuantity: (string) $validated['output_quantity'],
            outputUnit: $validated['output_unit'],
            items: $validated['items'],
            estimatedLabor: (string) ($validated['estimated_labor_cost'] ?? '0.00'),
            estimatedOverhead: (string) ($validated['estimated_overhead_cost'] ?? '0.00'),
            description: $validated['description'] ?? null
        );

        return response()->json($bom, 201);
    }

    /**
     * Calculate BOM costing breakdown.
     */
    public function bomCosting(Request $request, string $id)
    {
        $bom = BillOfMaterial::findOrFail($id);
        $this->authorizeBusiness($request, $bom->business_id);

        $costing = $this->mfgService->calculateBomCost($id);

        return response()->json($costing);
    }

    /**
     * List Production Orders.
     */
    public function productionOrders(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'status' => 'nullable|string|in:draft,in_progress,completed,cancelled',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $query = ProductionOrder::where('business_id', $validated['business_id'])
            ->with(['finishedGood', 'bom', 'sourceGodown', 'targetGodown'])
            ->latest();

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Create Production Order.
     */
    public function storeProductionOrder(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'bom_id' => 'required|uuid|exists:bill_of_materials,id',
            'source_godown_id' => 'required|uuid|exists:godowns,id',
            'target_godown_id' => 'required|uuid|exists:godowns,id',
            'planned_quantity' => 'required|numeric|min:0.0001',
            'start_date' => 'required|date',
            'batch_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $order = $this->mfgService->createProductionOrder(
            businessId: $validated['business_id'],
            bomId: $validated['bom_id'],
            sourceGodownId: $validated['source_godown_id'],
            targetGodownId: $validated['target_godown_id'],
            plannedQuantity: (string) $validated['planned_quantity'],
            startDate: $validated['start_date'],
            batchNumber: $validated['batch_number'] ?? null,
            notes: $validated['notes'] ?? null
        );

        return response()->json($order, 201);
    }

    /**
     * Start Production Order (Issue materials).
     */
    public function startProductionOrder(Request $request, string $id)
    {
        $order = ProductionOrder::with('items')->findOrFail($id);
        $this->authorizeBusiness($request, $order->business_id);

        $updated = $this->mfgService->startProductionOrder($order);

        return response()->json($updated);
    }

    /**
     * Complete Production Order (Receive finished goods, calculate total manufacturing cost).
     */
    public function completeProductionOrder(Request $request, string $id)
    {
        $order = ProductionOrder::with('items')->findOrFail($id);
        $this->authorizeBusiness($request, $order->business_id);

        $validated = $request->validate([
            'completed_quantity' => 'required|numeric|min:0.0001',
            'wasted_quantity' => 'nullable|numeric|min:0',
            'actual_labor_cost' => 'nullable|numeric|min:0',
            'actual_overhead_cost' => 'nullable|numeric|min:0',
            'completion_date' => 'nullable|date',
        ]);

        $completed = $this->mfgService->completeProductionOrder(
            order: $order,
            completedQuantity: (string) $validated['completed_quantity'],
            wastedQuantity: (string) ($validated['wasted_quantity'] ?? '0.0000'),
            actualLaborCost: (string) ($validated['actual_labor_cost'] ?? '0.00'),
            actualOverheadCost: (string) ($validated['actual_overhead_cost'] ?? '0.00'),
            completionDate: $validated['completion_date'] ?? null
        );

        return response()->json($completed);
    }

    /**
     * List Stock Transfers.
     */
    public function stockTransfers(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $transfers = StockTransfer::where('business_id', $validated['business_id'])
            ->with(['sourceGodown', 'destinationGodown', 'items.product'])
            ->latest()
            ->paginate(20);

        return response()->json($transfers);
    }

    /**
     * Execute Stock Transfer (generates GST Rule 55 Delivery Challan).
     */
    public function storeStockTransfer(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'source_godown_id' => 'required|uuid|exists:godowns,id',
            'destination_godown_id' => 'required|uuid|exists:godowns,id|different:source_godown_id',
            'transfer_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit' => 'nullable|string|max:10',
            'notes' => 'nullable|string|max:500',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $transfer = $this->mfgService->transferStock(
            businessId: $validated['business_id'],
            sourceGodownId: $validated['source_godown_id'],
            destinationGodownId: $validated['destination_godown_id'],
            transferDate: $validated['transfer_date'],
            items: $validated['items'],
            notes: $validated['notes'] ?? null
        );

        return response()->json($transfer, 201);
    }
}

