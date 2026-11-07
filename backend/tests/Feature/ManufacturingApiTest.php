<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Godown;
use App\Models\Organization;
use App\Models\Product;
use App\Models\User;
use App\Services\ManufacturingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ManufacturingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setupManufacturingEnvironment(): array
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Tata Steel Fabrication', 'slug' => 'tata-steel-fab']);
        $org->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $org->id,
            'legal_name' => 'Tata Steel Fabrication Pvt Ltd',
        ]);

        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27AAACT1234F1Z9',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Tata Steel Fabrication Pvt Ltd',
            'is_primary' => true,
            'status' => 'active',
        ]);

        // Raw Materials
        $rawSteel = Product::create([
            'business_id' => $business->id,
            'name' => 'High-Grade Steel Rod 20mm',
            'hsn_sac' => '72142090',
            'type' => 'goods',
            'unit' => 'KGS',
            'sale_price' => '85.00',
            'purchase_price' => '60.00',
        ]);

        $rawFastener = Product::create([
            'business_id' => $business->id,
            'name' => 'M12 Industrial Fasteners',
            'hsn_sac' => '73181500',
            'type' => 'goods',
            'unit' => 'PCS',
            'sale_price' => '15.00',
            'purchase_price' => '8.00',
        ]);

        // Finished Good
        $finishedAssembly = Product::create([
            'business_id' => $business->id,
            'name' => 'Heavy Duty Flange Assembly',
            'hsn_sac' => '73079100',
            'type' => 'goods',
            'unit' => 'NOS',
            'sale_price' => '1200.00',
            'purchase_price' => '750.00',
        ]);

        // Godowns
        $rawGodown = Godown::create([
            'business_id' => $business->id,
            'code' => 'GDN-RM-01',
            'name' => 'Raw Material Yard Pune',
            'is_primary' => true,
            'status' => 'active',
        ]);

        $fgGodown = Godown::create([
            'business_id' => $business->id,
            'code' => 'GDN-FG-01',
            'name' => 'Finished Goods Godown Mumbai',
            'is_primary' => false,
            'status' => 'active',
        ]);

        return [$user, $org, $business, $gstin, $rawSteel, $rawFastener, $finishedAssembly, $rawGodown, $fgGodown];
    }

    public function test_can_create_godown_and_query_inventory()
    {
        [$user, $org, $business, $gstin, $rawSteel, , , $rawGodown] = $this->setupManufacturingEnvironment();

        // Seed initial raw material stock in godown
        $mfg = app(ManufacturingService::class);
        $mfg->adjustStock(
            businessId: $business->id,
            godownId: $rawGodown->id,
            productId: $rawSteel->id,
            quantityDelta: '500.0000',
            unitCost: '60.00'
        );

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/v1/manufacturing/godowns/{$rawGodown->id}/stock");

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals($rawGodown->id, $data['godown']['id']);
        $this->assertCount(1, $data['inventory']);
        $this->assertEquals('500.0000', $data['inventory'][0]['quantity']);
        $this->assertEquals('60.00', $data['inventory'][0]['unit_cost']);
    }

    public function test_can_create_bom_and_calculate_accurate_statutory_costing()
    {
        [$user, $org, $business, $gstin, $rawSteel, $rawFastener, $finishedAssembly] = $this->setupManufacturingEnvironment();

        $bomPayload = [
            'business_id' => $business->id,
            'finished_good_id' => $finishedAssembly->id,
            'name' => 'BOM for Heavy Duty Flange Assembly Standard',
            'output_quantity' => 1,
            'output_unit' => 'NOS',
            'estimated_labor_cost' => '150.00',
            'estimated_overhead_cost' => '50.00',
            'description' => 'Precision engineering standard',
            'items' => [
                [
                    'raw_material_id' => $rawSteel->id,
                    'quantity' => 5, // 5 kgs @ 60 = 300, 5% scrap = 15 => 315
                    'unit' => 'KGS',
                    'unit_cost' => '60.00',
                    'estimated_wastage_percent' => 5.00,
                ],
                [
                    'raw_material_id' => $rawFastener->id,
                    'quantity' => 4, // 4 pcs @ 8 = 32, 0% scrap => 32
                    'unit' => 'PCS',
                    'unit_cost' => '8.00',
                    'estimated_wastage_percent' => 0.00,
                ],
            ],
        ];

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/v1/manufacturing/boms', $bomPayload);
        $res->assertStatus(201);
        $bomId = $res->json('id');

        // Check costing endpoint
        $costRes = $this->actingAs($user, 'sanctum')->getJson("/api/v1/manufacturing/boms/{$bomId}/costing");
        $costRes->assertStatus(200);
        $costing = $costRes->json();

        // 315 (steel + wastage) + 32 (fasteners) = 347 material cost
        $this->assertEquals('347.00', $costing['total_material_cost']);
        // 347 material + 150 labor + 50 overhead = 547 total cost
        $this->assertEquals('547.00', $costing['total_estimated_cost']);
        $this->assertEquals('547.00', $costing['cost_per_unit']);
    }

    public function test_complete_production_order_lifecycle_consumes_materials_and_produces_finished_goods()
    {
        [$user, $org, $business, $gstin, $rawSteel, $rawFastener, $finishedAssembly, $rawGodown, $fgGodown] = $this->setupManufacturingEnvironment();

        $mfg = app(ManufacturingService::class);

        // 1. Seed raw material stock
        $mfg->adjustStock($business->id, $rawGodown->id, $rawSteel->id, '1000.0000', '60.00');
        $mfg->adjustStock($business->id, $rawGodown->id, $rawFastener->id, '500.0000', '8.00');

        // 2. Create BOM
        $bom = $mfg->createBOM(
            businessId: $business->id,
            finishedGoodId: $finishedAssembly->id,
            name: 'Standard Flange BOM',
            outputQuantity: '1.0000',
            outputUnit: 'NOS',
            items: [
                ['raw_material_id' => $rawSteel->id, 'quantity' => '5.0000', 'unit_cost' => '60.00'],
                ['raw_material_id' => $rawFastener->id, 'quantity' => '4.0000', 'unit_cost' => '8.00'],
            ],
            estimatedLabor: '150.00',
            estimatedOverhead: '50.00'
        );

        // 3. Create Production Order for 10 units
        $orderRes = $this->actingAs($user, 'sanctum')->postJson('/api/v1/manufacturing/production-orders', [
            'business_id' => $business->id,
            'bom_id' => $bom->id,
            'source_godown_id' => $rawGodown->id,
            'target_godown_id' => $fgGodown->id,
            'planned_quantity' => 10,
            'start_date' => '2026-11-05',
            'batch_number' => 'BATCH/2026/001',
            'notes' => 'Urgent batch for client order',
        ]);

        $orderRes->assertStatus(201);
        $orderId = $orderRes->json('id');

        // 4. Start Production (Issues raw materials: 50 kgs steel, 40 fasteners)
        $startRes = $this->actingAs($user, 'sanctum')->postJson("/api/v1/manufacturing/production-orders/{$orderId}/start");
        $startRes->assertStatus(200);
        $this->assertEquals('in_progress', $startRes->json('status'));

        // Verify RM godown stock was decremented:
        // Steel: 1000 - 50 = 950
        // Fasteners: 500 - 40 = 460
        $steelBalance = \App\Models\StockBalance::where('godown_id', $rawGodown->id)->where('product_id', $rawSteel->id)->first();
        $this->assertEquals('950.0000', $steelBalance->quantity);
        $fastenerBalance = \App\Models\StockBalance::where('godown_id', $rawGodown->id)->where('product_id', $rawFastener->id)->first();
        $this->assertEquals('460.0000', $fastenerBalance->quantity);

        // 5. Complete Production (Produced 10 finished assemblies, 0 wasted)
        $compRes = $this->actingAs($user, 'sanctum')->postJson("/api/v1/manufacturing/production-orders/{$orderId}/complete", [
            'completed_quantity' => 10,
            'wasted_quantity' => 0,
            'actual_labor_cost' => '1500.00', // 150 * 10
            'actual_overhead_cost' => '500.00', // 50 * 10
            'completion_date' => '2026-11-07',
        ]);

        $compRes->assertStatus(200);
        $this->assertEquals('completed', $compRes->json('status'));
        // Material = (50 * 60) + (40 * 8) = 3000 + 320 = 3320
        // Total = 3320 + 1500 + 500 = 5320.00
        $this->assertEquals('5320.00', $compRes->json('total_production_cost'));

        // Verify Finished Goods stock was added in target FG godown (10 NOS)
        $fgBalance = \App\Models\StockBalance::where('godown_id', $fgGodown->id)->where('product_id', $finishedAssembly->id)->first();
        $this->assertNotNull($fgBalance);
        $this->assertEquals('10.0000', $fgBalance->quantity);
        $this->assertEquals('532.00', $fgBalance->unit_cost); // 5320 / 10 = 532.00 unit cost!
    }

    public function test_inter_godown_stock_transfer_issues_gst_delivery_challan()
    {
        [$user, $org, $business, $gstin, $rawSteel, , , $rawGodown, $fgGodown] = $this->setupManufacturingEnvironment();

        $mfg = app(ManufacturingService::class);
        $mfg->adjustStock($business->id, $rawGodown->id, $rawSteel->id, '200.0000', '60.00');

        $payload = [
            'business_id' => $business->id,
            'source_godown_id' => $rawGodown->id,
            'destination_godown_id' => $fgGodown->id,
            'transfer_date' => '2026-11-08',
            'notes' => 'Transfer to assembly plant under GST Rule 55',
            'items' => [
                [
                    'product_id' => $rawSteel->id,
                    'quantity' => 50,
                    'unit' => 'KGS',
                ]
            ]
        ];

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/v1/manufacturing/stock-transfers', $payload);
        $res->assertStatus(201);
        $transfer = $res->json();

        $this->assertNotEmpty($transfer['delivery_challan_number']);
        $this->assertStringStartsWith('DC/', $transfer['delivery_challan_number']);
        $this->assertEquals('received', $transfer['status']);

        // Check source stock reduced to 150
        $srcBal = \App\Models\StockBalance::where('godown_id', $rawGodown->id)->where('product_id', $rawSteel->id)->first();
        $this->assertEquals('150.0000', $srcBal->quantity);

        // Check dest stock increased to 50
        $destBal = \App\Models\StockBalance::where('godown_id', $fgGodown->id)->where('product_id', $rawSteel->id)->first();
        $this->assertEquals('50.0000', $destBal->quantity);
    }
}

