<?php

namespace App\Services;

use App\Models\BillOfMaterial;
use App\Models\BomItem;
use App\Models\Godown;
use App\Models\InvoiceSequence;
use App\Models\ProductionOrder;
use App\Models\ProductionOrderItem;
use App\Models\StockBalance;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ManufacturingService
{
    /**
     * Atomically adjust stock balance in a godown.
     */
    public function adjustStock(
        string $businessId,
        string $godownId,
        string $productId,
        string $quantityDelta, // positive for addition, negative for deduction
        string $unitCost = '0.00',
        ?string $batchNumber = null
    ): StockBalance {
        return DB::transaction(function () use ($businessId, $godownId, $productId, $quantityDelta, $unitCost, $batchNumber) {
            $balance = StockBalance::firstOrCreate(
                [
                    'business_id' => $businessId,
                    'godown_id' => $godownId,
                    'product_id' => $productId,
                    'batch_number' => $batchNumber,
                ],
                [
                    'quantity' => '0.0000',
                    'unit_cost' => $unitCost,
                    'valuation_method' => 'weighted_average',
                ]
            );

            $currentQty = (string) $balance->quantity;
            $newQty = bcadd($currentQty, $quantityDelta, 4);

            // Calculate weighted average unit cost if incoming stock
            if (bccomp($quantityDelta, '0.0000', 4) > 0 && bccomp($unitCost, '0.00', 2) > 0) {
                $currentTotalVal = bcmul($currentQty, (string) $balance->unit_cost, 4);
                $incomingVal = bcmul($quantityDelta, $unitCost, 4);
                $combinedVal = bcadd($currentTotalVal, $incomingVal, 4);
                if (bccomp($newQty, '0.0000', 4) > 0) {
                    $balance->unit_cost = bcdiv($combinedVal, $newQty, 2);
                }
            }

            $balance->quantity = $newQty;
            $balance->save();

            return $balance;
        });
    }

    /**
     * Create Bill of Materials.
     */
    public function createBOM(
        string $businessId,
        string $finishedGoodId,
        string $name,
        string $outputQuantity,
        string $outputUnit,
        array $items,
        string $estimatedLabor = '0.00',
        string $estimatedOverhead = '0.00',
        ?string $description = null
    ): BillOfMaterial {
        return DB::transaction(function () use (
            $businessId,
            $finishedGoodId,
            $name,
            $outputQuantity,
            $outputUnit,
            $items,
            $estimatedLabor,
            $estimatedOverhead,
            $description
        ) {
            $count = BillOfMaterial::where('business_id', $businessId)->count() + 1;
            $bomNumber = 'BOM/' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);

            $bom = BillOfMaterial::create([
                'business_id' => $businessId,
                'finished_good_id' => $finishedGoodId,
                'bom_number' => $bomNumber,
                'name' => $name,
                'description' => $description,
                'output_quantity' => $outputQuantity,
                'output_unit' => $outputUnit,
                'estimated_labor_cost' => $estimatedLabor,
                'estimated_overhead_cost' => $estimatedOverhead,
                'status' => 'active',
            ]);

            foreach ($items as $item) {
                BomItem::create([
                    'bom_id' => $bom->id,
                    'raw_material_id' => $item['raw_material_id'],
                    'quantity' => (string) $item['quantity'],
                    'unit' => $item['unit'] ?? 'NOS',
                    'unit_cost' => (string) ($item['unit_cost'] ?? '0.00'),
                    'estimated_wastage_percent' => (string) ($item['estimated_wastage_percent'] ?? '0.00'),
                ]);
            }

            return $bom->load('items.rawMaterial');
        });
    }

    /**
     * Calculate cost breakdown for a Bill of Materials.
     */
    public function calculateBomCost(string $bomId): array
    {
        $bom = BillOfMaterial::with('items.rawMaterial')->findOrFail($bomId);

        $totalMaterialCost = '0.00';
        $itemBreakdowns = [];

        foreach ($bom->items as $item) {
            $baseCost = bcmul((string) $item->quantity, (string) $item->unit_cost, 4);
            $wastageFactor = bcdiv((string) $item->estimated_wastage_percent, '100', 4);
            $wastageCost = bcmul($baseCost, $wastageFactor, 4);
            $lineTotal = bcadd($baseCost, $wastageCost, 2);

            $totalMaterialCost = bcadd($totalMaterialCost, $lineTotal, 2);

            $itemBreakdowns[] = [
                'raw_material_id' => $item->raw_material_id,
                'raw_material_name' => $item->rawMaterial?->name,
                'quantity' => (string) $item->quantity,
                'unit' => $item->unit,
                'unit_cost' => (string) $item->unit_cost,
                'wastage_percent' => (string) $item->estimated_wastage_percent,
                'line_total' => $lineTotal,
            ];
        }

        $totalCost = bcadd($totalMaterialCost, (string) $bom->estimated_labor_cost, 2);
        $totalCost = bcadd($totalCost, (string) $bom->estimated_overhead_cost, 2);

        $costPerOutputUnit = bccomp((string) $bom->output_quantity, '0.0000', 4) > 0
            ? bcdiv($totalCost, (string) $bom->output_quantity, 2)
            : '0.00';

        return [
            'bom_id' => $bom->id,
            'bom_number' => $bom->bom_number,
            'output_quantity' => (string) $bom->output_quantity,
            'output_unit' => $bom->output_unit,
            'total_material_cost' => $totalMaterialCost,
            'labor_cost' => (string) $bom->estimated_labor_cost,
            'overhead_cost' => (string) $bom->estimated_overhead_cost,
            'total_estimated_cost' => $totalCost,
            'cost_per_unit' => $costPerOutputUnit,
            'components' => $itemBreakdowns,
        ];
    }

    /**
     * Create a Production Order scheduled for manufacturing.
     */
    public function createProductionOrder(
        string $businessId,
        string $bomId,
        string $sourceGodownId,
        string $targetGodownId,
        string $plannedQuantity,
        string $startDate,
        ?string $batchNumber = null,
        ?string $notes = null
    ): ProductionOrder {
        $bom = BillOfMaterial::with('items')->findOrFail($bomId);

        return DB::transaction(function () use (
            $businessId,
            $bom,
            $sourceGodownId,
            $targetGodownId,
            $plannedQuantity,
            $startDate,
            $batchNumber,
            $notes
        ) {
            $date = Carbon::parse($startDate);
            $fyStart = $date->month >= 4 ? $date->year : $date->year - 1;
            $fyString = $fyStart . '-' . substr((string) ($fyStart + 1), -2);

            $primaryGstinId = DB::table('business_gstins')
                ->where('business_id', $businessId)
                ->where('is_primary', true)
                ->value('id')
                ?? DB::table('business_gstins')->where('business_id', $businessId)->value('id');

            $query = [
                'business_id' => $businessId,
                'document_type' => 'production_order',
                'financial_year' => $fyString,
            ];
            if ($primaryGstinId) {
                $query['business_gstin_id'] = $primaryGstinId;
            }

            $seq = InvoiceSequence::firstOrCreate(
                $query,
                [
                    'business_gstin_id' => $primaryGstinId,
                    'prefix' => 'PRD/',
                    'next_number' => 1,
                ]
            );

            $orderNumber = $seq->prefix . $fyString . '/' . str_pad((string) $seq->next_number, 4, '0', STR_PAD_LEFT);
            $seq->increment('next_number');

            $order = ProductionOrder::create([
                'business_id' => $businessId,
                'bom_id' => $bom->id,
                'finished_good_id' => $bom->finished_good_id,
                'order_number' => $orderNumber,
                'source_godown_id' => $sourceGodownId,
                'target_godown_id' => $targetGodownId,
                'planned_quantity' => $plannedQuantity,
                'batch_number' => $batchNumber ?? 'BAT/' . date('Ymd') . '/' . substr(md5(uniqid()), 0, 5),
                'start_date' => $startDate,
                'status' => 'draft',
                'notes' => $notes,
            ]);

            // Plan components based on BOM ratio
            $multiplier = bcdiv($plannedQuantity, (string) $bom->output_quantity, 4);

            foreach ($bom->items as $item) {
                $componentPlanned = bcmul((string) $item->quantity, $multiplier, 4);
                ProductionOrderItem::create([
                    'production_order_id' => $order->id,
                    'raw_material_id' => $item->raw_material_id,
                    'planned_quantity' => $componentPlanned,
                    'consumed_quantity' => '0.0000',
                    'scrap_quantity' => '0.0000',
                    'unit_cost' => (string) $item->unit_cost,
                ]);
            }

            return $order->load(['bom', 'finishedGood', 'items.rawMaterial']);
        });
    }

    /**
     * Start Production: Issues raw materials from source godown.
     */
    public function startProductionOrder(ProductionOrder $order): ProductionOrder
    {
        if ($order->status !== 'draft') {
            throw new InvalidArgumentException("Order #{$order->order_number} cannot be started from status '{$order->status}'.");
        }

        return DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                // Deduct planned raw material from source godown
                $deductQty = '-' . (string) $item->planned_quantity;
                $this->adjustStock(
                    businessId: $order->business_id,
                    godownId: $order->source_godown_id,
                    productId: $item->raw_material_id,
                    quantityDelta: $deductQty
                );

                $item->consumed_quantity = $item->planned_quantity;
                $item->save();
            }

            $order->status = 'in_progress';
            $order->save();

            return $order->load(['items.rawMaterial']);
        });
    }

    /**
     * Complete Production: Records finished goods output, scrap, and computes actual cost.
     */
    public function completeProductionOrder(
        ProductionOrder $order,
        string $completedQuantity,
        string $wastedQuantity = '0.0000',
        string $actualLaborCost = '0.00',
        string $actualOverheadCost = '0.00',
        ?string $completionDate = null
    ): ProductionOrder {
        if ($order->status !== 'in_progress') {
            throw new InvalidArgumentException("Production Order must be in progress to be completed.");
        }

        return DB::transaction(function () use (
            $order,
            $completedQuantity,
            $wastedQuantity,
            $actualLaborCost,
            $actualOverheadCost,
            $completionDate
        ) {
            $totalMaterialCost = '0.00';
            foreach ($order->items as $item) {
                $matCost = bcmul((string) $item->consumed_quantity, (string) $item->unit_cost, 2);
                $totalMaterialCost = bcadd($totalMaterialCost, $matCost, 2);
            }

            $totalCost = bcadd($totalMaterialCost, $actualLaborCost, 2);
            $totalCost = bcadd($totalCost, $actualOverheadCost, 2);

            $unitCost = bccomp($completedQuantity, '0.0000', 4) > 0
                ? bcdiv($totalCost, $completedQuantity, 2)
                : '0.00';

            // Add finished goods to target godown
            $this->adjustStock(
                businessId: $order->business_id,
                godownId: $order->target_godown_id,
                productId: $order->finished_good_id,
                quantityDelta: $completedQuantity,
                unitCost: $unitCost,
                batchNumber: $order->batch_number
            );

            $order->completed_quantity = $completedQuantity;
            $order->wasted_quantity = $wastedQuantity;
            $order->actual_labor_cost = $actualLaborCost;
            $order->actual_overhead_cost = $actualOverheadCost;
            $order->total_production_cost = $totalCost;
            $order->completion_date = $completionDate ?? now()->format('Y-m-d');
            $order->status = 'completed';
            $order->save();

            return $order->load(['finishedGood', 'items.rawMaterial']);
        });
    }

    /**
     * Inter-Godown Stock Transfer with Statutory GST Delivery Challan (Rule 55).
     */
    public function transferStock(
        string $businessId,
        string $sourceGodownId,
        string $destinationGodownId,
        string $transferDate,
        array $items,
        ?string $notes = null
    ): StockTransfer {
        return DB::transaction(function () use (
            $businessId,
            $sourceGodownId,
            $destinationGodownId,
            $transferDate,
            $items,
            $notes
        ) {
            $date = Carbon::parse($transferDate);
            $fyStart = $date->month >= 4 ? $date->year : $date->year - 1;
            $fyString = $fyStart . '-' . substr((string) ($fyStart + 1), -2);

            $primaryGstinId = DB::table('business_gstins')
                ->where('business_id', $businessId)
                ->where('is_primary', true)
                ->value('id')
                ?? DB::table('business_gstins')->where('business_id', $businessId)->value('id');

            $query = [
                'business_id' => $businessId,
                'document_type' => 'stock_transfer',
                'financial_year' => $fyString,
            ];
            if ($primaryGstinId) {
                $query['business_gstin_id'] = $primaryGstinId;
            }

            $seq = InvoiceSequence::firstOrCreate(
                $query,
                [
                    'business_gstin_id' => $primaryGstinId,
                    'prefix' => 'TRF/',
                    'next_number' => 1,
                ]
            );

            $transferNumber = $seq->prefix . $fyString . '/' . str_pad((string) $seq->next_number, 4, '0', STR_PAD_LEFT);
            $seq->increment('next_number');

            $challanNumber = 'DC/' . $fyString . '/' . str_pad((string) $seq->next_number, 4, '0', STR_PAD_LEFT);

            $transfer = StockTransfer::create([
                'business_id' => $businessId,
                'transfer_number' => $transferNumber,
                'source_godown_id' => $sourceGodownId,
                'destination_godown_id' => $destinationGodownId,
                'transfer_date' => $transferDate,
                'delivery_challan_number' => $challanNumber,
                'status' => 'received',
                'notes' => $notes,
            ]);

            foreach ($items as $item) {
                $qty = (string) $item['quantity'];

                // Deduct from source godown
                $this->adjustStock(
                    businessId: $businessId,
                    godownId: $sourceGodownId,
                    productId: $item['product_id'],
                    quantityDelta: '-' . $qty
                );

                // Add to destination godown
                $this->adjustStock(
                    businessId: $businessId,
                    godownId: $destinationGodownId,
                    productId: $item['product_id'],
                    quantityDelta: $qty
                );

                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $qty,
                    'unit' => $item['unit'] ?? 'NOS',
                ]);
            }

            return $transfer->load(['items.product', 'sourceGodown', 'destinationGodown']);
        });
    }
}

