<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Invoice;
use App\Models\Organization;
use App\Models\User;
use App\Modules\Marketplace\Services\FlipkartSettlementParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MarketplaceHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setupTenant(): array
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Marketplace Retailers India', 'slug' => 'mkt-retailers']);
        $org->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $org->id,
            'legal_name' => 'Marketplace Retailers India Private Limited',
        ]);

        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27AAECM1234F1Z8',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Marketplace Retailers India Private Limited',
            'is_primary' => true,
            'status' => 'active',
        ]);

        return [$user, $org, $business, $gstin];
    }

    public function test_flipkart_settlement_parser_extracts_taxes_fees_tcs_and_net()
    {
        $csv = "Order ID,Invoice Number,Order Date,Customer State,FSN,Quantity,Taxable Value,Total Tax,Order Amount,Commission Fee,Shipping Fee,TCS Amount,TDS Amount,Bank Settlement Amount\n" .
               "OD123456789,INV-FK-001,2026-11-01,29,FSN998877,2,2000.00,360.00,2360.00,236.00,70.00,23.60,20.00,2010.40";

        $parser = new FlipkartSettlementParser();
        $records = $parser->parseCsv($csv);

        $this->assertCount(1, $records);
        $row = $records[0];
        $this->assertEquals('flipkart', $row['channel']);
        $this->assertEquals('OD123456789', $row['channel_order_id']);
        $this->assertEquals('2360.00', $row['order_total']);
        $this->assertEquals('236.00', $row['commission']);
        $this->assertEquals('70.00', $row['shipping_fee']);
        $this->assertEquals('23.60', $row['tcs_amount']);
        $this->assertEquals('20.00', $row['tds_amount']);
        $this->assertEquals('2010.40', $row['settlement_amount']);
    }

    public function test_can_import_flipkart_report_and_reconcile()
    {
        [$user, $org, $business] = $this->setupTenant();

        $csv = "Order ID,Invoice Number,Order Date,Customer State,FSN,Quantity,Taxable Value,Total Tax,Order Amount,Commission Fee,Shipping Fee,TCS Amount,TDS Amount,Bank Settlement Amount\n" .
               "OD987654321,INV-FK-99,2026-11-02,27,FSN112233,1,1000.00,180.00,1180.00,118.00,50.00,11.80,10.00,990.20";

        // Import Flipkart CSV
        $importRes = $this->actingAs($user, 'sanctum')->postJson('/api/v1/marketplace/import', [
            'business_id' => $business->id,
            'channel' => 'flipkart',
            'file_content' => $csv,
        ]);

        $importRes->assertStatus(200);
        $this->assertEquals(1, $importRes->json('imported_count'));

        // Query Reconciliation
        $reconRes = $this->actingAs($user, 'sanctum')->getJson("/api/v1/marketplace/reconciliation?business_id={$business->id}&channel=flipkart");
        $reconRes->assertStatus(200);
        $recon = $reconRes->json();

        $this->assertEquals(1, $recon['summary']['total_orders_count']);
        $this->assertEquals('1180.00', $recon['summary']['total_gross_sales']);
        $this->assertEquals('168.00', $recon['summary']['total_marketplace_fees']); // 118 comm + 50 shipping
        $this->assertEquals('11.80', $recon['summary']['total_tcs_collected']);
        $this->assertEquals('10.00', $recon['summary']['total_tds_deducted']);
        $this->assertEquals('990.20', $recon['summary']['expected_net_settlement']);
    }

    public function test_shopify_webhook_idempotency_prevents_duplicate_invoices()
    {
        [$user, $org, $business, $gstin] = $this->setupTenant();

        $shopifyPayload = [
            'id' => 9911882233,
            'order_number' => 1042,
            'email' => 'rahul.sharma@example.com',
            'phone' => '+919876543210',
            'shipping_address' => [
                'name' => 'Rahul Sharma',
                'address1' => 'Flat 402, Sea Breeze Apts',
                'city' => 'Mumbai',
                'province' => 'Maharashtra',
                'zip' => '400001',
            ],
            'line_items' => [
                [
                    'name' => 'Wireless Ergonomic Keyboard',
                    'sku' => 'KB-ERG-01',
                    'quantity' => 1,
                    'price' => '2360.00', // Inclusive of 18% GST (Taxable 2000 + 360 GST)
                    'tax_lines' => [
                        [
                            'rate' => 0.18,
                            'title' => 'GST',
                        ]
                    ]
                ]
            ]
        ];

        // 1. First Webhook Post -> Invoiced (201 Created)
        $firstRes = $this->postJson("/api/v1/webhooks/shopify/orders-create?business_id={$business->id}", $shopifyPayload);
        $firstRes->assertStatus(201);
        $firstInvoiceId = $firstRes->json('invoice_id');
        $this->assertNotEmpty($firstInvoiceId);

        // Verify only 1 invoice exists
        $this->assertEquals(1, Invoice::where('business_id', $business->id)->count());

        // 2. Second Duplicate Webhook Post -> Idempotent response (200 OK)
        $secondRes = $this->postJson("/api/v1/webhooks/shopify/orders-create?business_id={$business->id}", $shopifyPayload);
        $secondRes->assertStatus(200);
        $this->assertTrue($secondRes->json('idempotent'));
        $this->assertEquals($firstInvoiceId, $secondRes->json('invoice_id'));

        // Verify still only 1 invoice exists (no duplicate)
        $this->assertEquals(1, Invoice::where('business_id', $business->id)->count());
    }

    public function test_shopify_webhook_validates_hmac_signature()
    {
        [$user, $org, $business, $gstin] = $this->setupTenant();

        // Configure secret
        config(['services.shopify.webhook_secret' => 'test_secret_key_12345']);

        $payload = [
            'id' => 888777666,
            'order_number' => 5001,
            'email' => 'buyer@test.com',
            'shipping_address' => [
                'name' => 'Test Buyer',
                'province' => 'Maharashtra',
            ],
            'line_items' => [
                [
                    'name' => 'Test Item',
                    'quantity' => 1,
                    'price' => '100.00',
                ]
            ]
        ];

        $rawBody = json_encode($payload);

        // 1. Attempt with invalid HMAC header -> 401 Unauthorized
        $invalidRes = $this->call(
            'POST',
            "/api/v1/webhooks/shopify/orders-create?business_id={$business->id}",
            [],
            [],
            [],
            [
                'HTTP_X_SHOPIFY_HMAC_SHA256' => 'invalid_signature_base64',
                'CONTENT_TYPE' => 'application/json',
            ],
            $rawBody
        );
        $invalidRes->assertStatus(401);

        // 2. Attempt with genuine calculated HMAC -> 201 Created
        $validHmac = base64_encode(hash_hmac('sha256', $rawBody, 'test_secret_key_12345', true));
        $validRes = $this->call(
            'POST',
            "/api/v1/webhooks/shopify/orders-create?business_id={$business->id}",
            [],
            [],
            [],
            [
                'HTTP_X_SHOPIFY_HMAC_SHA256' => $validHmac,
                'CONTENT_TYPE' => 'application/json',
            ],
            $rawBody
        );
        $validRes->assertStatus(201);
    }
}
