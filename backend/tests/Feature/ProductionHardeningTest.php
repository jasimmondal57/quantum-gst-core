<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\BillOfMaterial;
use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Customer;
use App\Models\Godown;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\JournalEntry;
use App\Models\Organization;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\StockBalance;
use App\Models\User;
use App\Services\AccountingEngineService;
use App\Services\ManufacturingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProductionHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setupEnvironment(): array
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Bharat Forge Engineering', 'slug' => 'bharat-forge']);
        $org->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $org->id,
            'legal_name' => 'Bharat Forge Engineering Pvt Ltd',
            'trade_name' => 'Bharat Forge',
        ]);

        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27AAACB9999F1Z9',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Bharat Forge Engineering Pvt Ltd',
            'is_primary' => true,
            'status' => 'active',
        ]);

        $customer = Customer::create([
            'business_id' => $business->id,
            'customer_type' => 'b2b',
            'name' => 'Mahindra Auto Components',
            'company_name' => 'Mahindra Auto',
            'gstin' => '27AAACM4444F1Z3',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
        ]);

        return compact('user', 'org', 'business', 'gstin', 'customer');
    }

    public function test_posted_journal_entries_are_immutable(): void
    {
        $env = $this->setupEnvironment();
        $accounting = app(AccountingEngineService::class);
        $accounting->ensureStandardChartOfAccounts($env['business']->id);

        $arAccount = Account::where('business_id', $env['business']->id)->where('code', '1030')->first();
        $salesAccount = Account::where('business_id', $env['business']->id)->where('code', '4010')->first();

        // 1. Post a balanced JV
        $entry = $accounting->postJournalEntry(
            businessId: $env['business']->id,
            entryDate: '2026-11-08',
            narration: 'Initial opening ledger',
            lines: [
                ['account_id' => $arAccount->id, 'debit' => '5000.00', 'credit' => '0.00'],
                ['account_id' => $salesAccount->id, 'debit' => '0.00', 'credit' => '5000.00'],
            ]
        );

        $this->assertEquals('posted', $entry->status);
        $this->assertEquals('5000.00', (string) $entry->total_debit);
        $this->assertEquals('5000.00', (string) $entry->total_credit);

        // 2. Attempting to modify posted entry must throw RuntimeException
        $this->expectException(\RuntimeException::class);
        $entry->total_debit = '6000.00';
        $entry->save();
    }

    public function test_posted_journal_entry_lines_cannot_be_deleted(): void
    {
        $env = $this->setupEnvironment();
        $accounting = app(AccountingEngineService::class);
        $accounting->ensureStandardChartOfAccounts($env['business']->id);

        $arAccount = Account::where('business_id', $env['business']->id)->where('code', '1030')->first();
        $salesAccount = Account::where('business_id', $env['business']->id)->where('code', '4010')->first();

        $entry = $accounting->postJournalEntry(
            businessId: $env['business']->id,
            entryDate: '2026-11-08',
            narration: 'Statutory entry',
            lines: [
                ['account_id' => $arAccount->id, 'debit' => '2500.00', 'credit' => '0.00'],
                ['account_id' => $salesAccount->id, 'debit' => '0.00', 'credit' => '2500.00'],
            ]
        );

        $line = $entry->lines()->first();

        $this->expectException(\RuntimeException::class);
        $line->delete();
    }

    public function test_invoice_cancellation_generates_balanced_reversal_entry(): void
    {
        $env = $this->setupEnvironment();
        $accounting = app(AccountingEngineService::class);
        $accounting->ensureStandardChartOfAccounts($env['business']->id);

        $invoice = Invoice::create([
            'organization_id' => $env['org']->id,
            'business_id' => $env['business']->id,
            'business_gstin_id' => $env['gstin']->id,
            'customer_id' => $env['customer']->id,
            'invoice_number' => 'INV-2026-REV-01',
            'invoice_date' => '2026-11-08',
            'place_of_supply_state_code' => '27',
            'is_interstate' => false,
            'total_taxable_value' => '10000.00',
            'total_cgst' => '900.00',
            'total_sgst' => '900.00',
            'total_igst' => '0.00',
            'total_tax_amount' => '1800.00',
            'grand_total' => '11800.00',
            'status' => 'finalized',
        ]);

        // Post original invoice
        $accounting->postInvoice($invoice);

        // Cancel invoice via API
        $response = $this->actingAs($env['user'], 'sanctum')
            ->postJson("/api/v1/invoices/{$invoice->id}/cancel", [
                'reason' => 'Customer order cancelled prior to dispatch',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $invoice->fresh()->status);

        // Verify reversal entry
        $reversal = JournalEntry::where('reference_type', 'invoice_cancellation')
            ->where('reference_id', $invoice->id)
            ->first();

        $this->assertNotNull($reversal);
        $this->assertEquals('11800.00', (string) $reversal->total_debit);
        $this->assertEquals('11800.00', (string) $reversal->total_credit);

        // Check Party running ledger closing balance is back to 0.00
        $ledger = $accounting->generatePartyLedger($env['business']->id, 'customer', $env['customer']->id);
        $this->assertEquals('0.00', $ledger['closing_balance']);
    }

    public function test_manufacturing_cannot_consume_unavailable_raw_materials(): void
    {
        $env = $this->setupEnvironment();
        $mfg = app(ManufacturingService::class);

        $godown = Godown::create([
            'business_id' => $env['business']->id,
            'code' => 'GDN-01',
            'name' => 'Central Godown',
            'status' => 'active',
        ]);

        $targetGodown = Godown::create([
            'business_id' => $env['business']->id,
            'code' => 'GDN-02',
            'name' => 'Assembly Godown',
            'status' => 'active',
        ]);

        $rawSteel = Product::create([
            'business_id' => $env['business']->id,
            'name' => 'Cold Rolled Steel Sheet',
            'hsn_sac' => '72091500',
            'unit' => 'KGS',
            'purchase_price' => '85.00',
            'status' => 'active',
        ]);

        $finishedChassis = Product::create([
            'business_id' => $env['business']->id,
            'name' => 'Automotive Sub-Frame Chassis',
            'hsn_sac' => '87082900',
            'unit' => 'NOS',
            'sale_price' => '12000.00',
            'status' => 'active',
        ]);

        // BOM requiring 50 KGS of steel per chassis
        $bom = $mfg->createBOM(
            businessId: $env['business']->id,
            finishedGoodId: $finishedChassis->id,
            name: 'Standard Sub-Frame BOM',
            outputQuantity: '1.0000',
            outputUnit: 'NOS',
            items: [
                ['raw_material_id' => $rawSteel->id, 'quantity' => '50.0000', 'unit_cost' => '85.00'],
            ]
        );

        // Create Production Order for 10 chassis (needs 500 KGS of raw steel)
        $order = $mfg->createProductionOrder(
            businessId: $env['business']->id,
            bomId: $bom->id,
            sourceGodownId: $godown->id,
            targetGodownId: $targetGodown->id,
            plannedQuantity: '10.0000',
            startDate: '2026-11-08'
        );

        // Attempting to start production with 0 stock in Godown MUST throw InvalidArgumentException
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/Insufficient stock in Godown/');
        $mfg->startProductionOrder($order);
    }

    public function test_stock_transfer_cannot_create_negative_stock(): void
    {
        $env = $this->setupEnvironment();
        $mfg = app(ManufacturingService::class);

        $src = Godown::create([
            'business_id' => $env['business']->id,
            'code' => 'WH-A',
            'name' => 'Warehouse Alpha',
            'status' => 'active',
        ]);

        $dst = Godown::create([
            'business_id' => $env['business']->id,
            'code' => 'WH-B',
            'name' => 'Warehouse Beta',
            'status' => 'active',
        ]);

        $item = Product::create([
            'business_id' => $env['business']->id,
            'name' => 'Precision Bearing 6205',
            'hsn_sac' => '84821010',
            'unit' => 'PCS',
            'sale_price' => '450.00',
            'status' => 'active',
        ]);

        // Put 10 PCS in Warehouse A
        $mfg->adjustStock($env['business']->id, $src->id, $item->id, '10.0000', '300.00');

        // Transferring 25 PCS (exceeding available 10 PCS) MUST throw exception
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/Insufficient stock in Godown/');
        $mfg->transferStock(
            businessId: $env['business']->id,
            sourceGodownId: $src->id,
            destinationGodownId: $dst->id,
            transferDate: '2026-11-08',
            items: [
                ['product_id' => $item->id, 'quantity' => '25.0000', 'unit' => 'PCS'],
            ]
        );
    }

    public function test_shopify_webhook_signature_and_concurrency_protection(): void
    {
        $env = $this->setupEnvironment();
        config(['services.shopify.webhook_secret' => 'super_secret_shopify_key_123']);

        $orderPayload = [
            'id' => 9928172635,
            'order_number' => 'SPF-1099',
            'email' => 'buyer@example.com',
            'phone' => '+919876543210',
            'created_at' => '2026-11-08T10:00:00Z',
            'total_price' => '1180.00',
            'line_items' => [
                [
                    'id' => 101,
                    'title' => 'Machined Valve Cap',
                    'sku' => 'MVC-01',
                    'quantity' => 1,
                    'price' => '1180.00',
                    'tax_lines' => [
                        ['rate' => 0.18, 'title' => 'IGST', 'price' => '180.00'],
                    ],
                ],
            ],
            'shipping_address' => [
                'name' => 'Kunal Joshi',
                'address1' => 'Plot 44, Hadapsar',
                'city' => 'Pune',
                'province' => 'Maharashtra',
                'province_code' => 'MH',
                'zip' => '411028',
                'country_code' => 'IN',
            ],
        ];

        $content = json_encode($orderPayload);
        $validHmac = base64_encode(hash_hmac('sha256', $content, 'super_secret_shopify_key_123', true));

        // 1. Missing HMAC Header fails with 401
        $resMissing = $this->call(
            'POST',
            "/api/v1/webhooks/shopify/orders-create?business_id={$env['business']->id}",
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            $content
        );
        $resMissing->assertStatus(401);

        // 2. Invalid signature fails with 401
        $resInvalid = $this->call(
            'POST',
            "/api/v1/webhooks/shopify/orders-create?business_id={$env['business']->id}",
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_SHOPIFY_HMAC_SHA256' => 'invalid_signature_hash',
            ],
            $content
        );
        $resInvalid->assertStatus(401);

        // 3. Valid signature succeeds and creates invoice
        $resValid = $this->call(
            'POST',
            "/api/v1/webhooks/shopify/orders-create?business_id={$env['business']->id}",
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_SHOPIFY_HMAC_SHA256' => $validHmac,
            ],
            $content
        );
        $resValid->assertStatus(201);
        $this->assertTrue($resValid->json('success'));

        // 4. Duplicate / replayed webhook returns idempotent 200
        $resDuplicate = $this->call(
            'POST',
            "/api/v1/webhooks/shopify/orders-create?business_id={$env['business']->id}",
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_SHOPIFY_HMAC_SHA256' => $validHmac,
            ],
            $content
        );
        $resDuplicate->assertStatus(200);
        $this->assertTrue($resDuplicate->json('idempotent'));
        $this->assertEquals($resValid->json('invoice_id'), $resDuplicate->json('invoice_id'));
    }
}
