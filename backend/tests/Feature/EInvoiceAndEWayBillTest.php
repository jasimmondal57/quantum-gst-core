<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Customer;
use App\Models\Godown;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Organization;
use App\Models\StockTransfer;
use App\Models\User;
use App\Modules\GSTEngine\Services\EInvoiceService;
use App\Modules\GSTEngine\Services\EWayBillService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class EInvoiceAndEWayBillTest extends TestCase
{
    use RefreshDatabase;

    protected function setupEnvironment(): array
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Bharat Heavy Engineering', 'slug' => 'bharat-heavy']);
        $org->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $org->id,
            'legal_name' => 'Bharat Heavy Engineering Limited',
        ]);

        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27AAACB1234D1Z2',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Bharat Heavy Engineering Limited',
            'address_line1' => 'MIDC Industrial Area, Pune',
            'pincode' => '411018',
            'is_primary' => true,
            'status' => 'active',
        ]);

        $customer = Customer::create([
            'business_id' => $business->id,
            'customer_type' => 'b2b',
            'name' => 'Larsen Infrastructure Mumbai',
            'company_name' => 'Larsen Infrastructure Ltd',
            'gstin' => '27AABCL5678E1Z9',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'billing_address' => 'Powai Business Hub',
            'billing_pincode' => '400076',
        ]);

        $invoice = Invoice::create([
            'organization_id' => $org->id,
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'customer_id' => $customer->id,
            'invoice_number' => 'BHE/2026-27/0100',
            'invoice_date' => '2026-11-06',
            'invoice_type' => 'tax_invoice',
            'place_of_supply_state_code' => '27',
            'is_interstate' => false,
            'total_taxable_value' => '100000.00',
            'total_cgst' => '9000.00',
            'total_sgst' => '9000.00',
            'total_igst' => '0.00',
            'total_tax_amount' => '18000.00',
            'grand_total' => '118000.00',
            'status' => 'finalized',
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'item_name' => 'Heavy Turbine Casting 500kg',
            'hsn_sac' => '84109000',
            'quantity' => 2,
            'unit' => 'NOS',
            'unit_price' => '50000.00',
            'taxable_value' => '100000.00',
            'cgst_rate' => 9.00,
            'cgst_amount' => '9000.00',
            'sgst_rate' => 9.00,
            'sgst_amount' => '9000.00',
            'igst_rate' => 0.00,
            'igst_amount' => '0.00',
            'total_amount' => '118000.00',
        ]);

        return [$user, $org, $business, $gstin, $customer, $invoice];
    }

    public function test_can_generate_statutory_einvoice_irn_and_qr_code()
    {
        [$user, , , , , $invoice] = $this->setupEnvironment();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/einvoice/generate', [
            'invoice_id' => $invoice->id,
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertTrue($data['success']);
        $this->assertEquals(64, strlen($data['irn'])); // 64-char SHA256 IRN
        $this->assertNotEmpty($data['ack_no']);
        $this->assertNotEmpty($data['signed_qr_code']);
        $this->assertEquals('generated', $data['einvoice_status']);

        // Verify persisted on invoice
        $fresh = $invoice->fresh();
        $this->assertEquals($data['irn'], $fresh->irn);
        $this->assertEquals('generated', $fresh->einvoice_status);
    }

    public function test_can_inspect_gstn_schema_v1_payload()
    {
        [$user, , , , , $invoice] = $this->setupEnvironment();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/v1/einvoice/{$invoice->id}/json");

        $response->assertStatus(200);
        $payload = $response->json();

        $this->assertEquals('1.1', $payload['Version']);
        $this->assertEquals('B2B', $payload['TranDtls']['SupTyp']);
        $this->assertEquals('INV', $payload['DocDtls']['Typ']);
        $this->assertEquals('BHE/2026-27/0100', $payload['DocDtls']['No']);
        $this->assertEquals('27AAACB1234D1Z2', $payload['SellerDtls']['Gstin']);
        $this->assertEquals('27AABCL5678E1Z9', $payload['BuyerDtls']['Gstin']);
        $this->assertEquals(100000.0, $payload['ValDtls']['AssVal']);
        $this->assertEquals(118000.0, $payload['ValDtls']['TotInvVal']);
        $this->assertCount(1, $payload['ItemList']);
        $this->assertEquals('84109000', $payload['ItemList'][0]['HsnCd']);
    }

    public function test_can_cancel_einvoice_irn()
    {
        [$user, , , , , $invoice] = $this->setupEnvironment();

        // 1. Generate first
        $eInvoiceService = app(EInvoiceService::class);
        $eInvoiceService->generateEInvoice($invoice);

        // 2. Cancel with reason code 2 (Data Entry mistake)
        $cancelRes = $this->actingAs($user, 'sanctum')->postJson("/api/v1/einvoice/{$invoice->id}/cancel", [
            'reason_code' => '2',
            'remarks' => 'Typo in line item specification',
        ]);

        $cancelRes->assertStatus(200);
        $this->assertEquals('cancelled', $cancelRes->json('einvoice_status'));
        $this->assertEquals('Data Entry Mistake', $cancelRes->json('cancel_reason'));
    }

    public function test_can_generate_eway_bill_with_rule_138_validity()
    {
        [$user, , , , , $invoice] = $this->setupEnvironment();

        // Distance 450 km -> ceil(450 / 200) = 3 days * 24h = 72 hours
        $payload = [
            'invoice_id' => $invoice->id,
            'distance_km' => 450,
            'transport_mode' => 'road',
            'vehicle_number' => 'MH-12-AB-1234',
            'vehicle_type' => 'regular',
            'transporter_name' => 'VRL Logistics Limited',
        ];

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/v1/eway/generate', $payload);
        $res->assertStatus(201);
        $eway = $res->json();

        $this->assertStringStartsWith('27', $eway['eway_bill_no']); // 27 = Maharashtra
        $this->assertEquals(12, strlen($eway['eway_bill_no']));
        $this->assertEquals('MH12AB1234', $eway['vehicle_number']);
        $this->assertEquals('active', $eway['status']);
        $this->assertEquals('118000.00', $eway['total_value']);

        // Check validity: roughly 72 hours ahead
        $created = \Carbon\Carbon::parse($eway['eway_bill_date']);
        $validUntil = \Carbon\Carbon::parse($eway['valid_until']);
        $this->assertEquals(72, $created->diffInHours($validUntil));

        // Invoice synced
        $this->assertEquals('generated', $invoice->fresh()->eway_status);
        $this->assertEquals($eway['eway_bill_no'], $invoice->fresh()->eway_bill_no);
    }

    public function test_can_update_vehicle_part_b_and_cancel_eway_bill()
    {
        [$user, , , , , $invoice] = $this->setupEnvironment();

        $ewayService = app(EWayBillService::class);
        $eway = $ewayService->generateForInvoice(
            invoice: $invoice,
            distanceKm: 150,
            vehicleNumber: 'MH12AA1111'
        );

        // Update Vehicle (Part-B)
        $updateRes = $this->actingAs($user, 'sanctum')->postJson("/api/v1/eway/{$eway->id}/update-vehicle", [
            'vehicle_number' => 'MH-14-ZZ-9999',
            'reason' => 'Truck breakdown at expressway junction',
        ]);

        $updateRes->assertStatus(200);
        $this->assertEquals('MH14ZZ9999', $updateRes->json('vehicle_number'));

        // Cancel E-Way Bill
        $cancelRes = $this->actingAs($user, 'sanctum')->postJson("/api/v1/eway/{$eway->id}/cancel", [
            'reason' => 'Order postponed by client',
        ]);

        $cancelRes->assertStatus(200);
        $this->assertEquals('cancelled', $cancelRes->json('status'));
        $this->assertEquals('cancelled', $invoice->fresh()->eway_status);
    }

    public function test_can_generate_eway_bill_for_stock_transfer()
    {
        [$user, , $business, $gstin] = $this->setupEnvironment();

        $g1 = Godown::create([
            'business_id' => $business->id,
            'code' => 'PUNE-PLANT',
            'name' => 'Pune Foundry Plant',
            'pincode' => '411018',
            'state_code' => '27',
        ]);

        $g2 = Godown::create([
            'business_id' => $business->id,
            'code' => 'NAGPUR-DEPOT',
            'name' => 'Nagpur Central Depot',
            'pincode' => '440001',
            'state_code' => '27',
        ]);

        $transfer = StockTransfer::create([
            'business_id' => $business->id,
            'transfer_number' => 'TRF/2026-27/0010',
            'source_godown_id' => $g1->id,
            'destination_godown_id' => $g2->id,
            'transfer_date' => '2026-11-07',
            'delivery_challan_number' => 'DC/2026-27/0010',
            'status' => 'dispatched',
        ]);

        $payload = [
            'stock_transfer_id' => $transfer->id,
            'distance_km' => 700,
            'vehicle_number' => 'MH31AB5555',
            'transporter_name' => 'Central India Cargo',
        ];

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/v1/eway/generate-transfer', $payload);
        $res->assertStatus(201);
        $eway = $res->json();

        $this->assertEquals('delivery_challan', $eway['doc_type']);
        $this->assertEquals('for_own_use', $eway['sub_supply_type']);
        $this->assertEquals('DC/2026-27/0010', $eway['doc_number']);
        $this->assertEquals('MH31AB5555', $eway['vehicle_number']);
    }
}
