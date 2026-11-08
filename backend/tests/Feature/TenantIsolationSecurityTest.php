<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Customer;
use App\Models\Godown;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Organization;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantIsolationSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected array $tenantA;
    protected array $tenantB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantA = $this->createTenant('Tenant Alpha Corp', 'alpha-corp', '27AAAAA1111A1Z1');
        $this->tenantB = $this->createTenant('Tenant Beta Ltd', 'beta-ltd', '29BBBBB2222B1Z2');
    }

    protected function createTenant(string $name, string $slug, string $gstinCode): array
    {
        $user = User::factory()->create();
        $org = Organization::create([
            'name' => $name,
            'slug' => $slug . '-' . Str::random(5),
            'status' => 'active',
        ]);
        $org->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $org->id,
            'legal_name' => $name,
            'trade_name' => $name,
            'currency' => 'INR',
            'status' => 'active',
        ]);

        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => $gstinCode,
            'state_code' => substr($gstinCode, 0, 2),
            'state_name' => substr($gstinCode, 0, 2) === '27' ? 'Maharashtra' : 'Karnataka',
            'legal_name' => $name,
            'is_primary' => true,
            'status' => 'active',
        ]);

        $customer = Customer::create([
            'business_id' => $business->id,
            'customer_type' => 'b2b',
            'name' => "Customer of {$name}",
            'company_name' => "Customer Company {$name}",
            'gstin' => substr($gstinCode, 0, 2) . 'ZZZZZ0000Z1Z9',
            'state_code' => substr($gstinCode, 0, 2),
            'state_name' => substr($gstinCode, 0, 2) === '27' ? 'Maharashtra' : 'Karnataka',
        ]);

        $product = Product::create([
            'business_id' => $business->id,
            'type' => 'goods',
            'name' => "Product of {$name}",
            'sku' => "SKU-" . Str::random(6),
            'hsn_sac' => '84713010',
            'unit' => 'NOS',
            'sale_price' => '1000.00',
            'purchase_price' => '800.00',
            'status' => 'active',
        ]);

        $godown = Godown::create([
            'business_id' => $business->id,
            'code' => 'GDN-' . Str::random(4),
            'name' => "Godown of {$name}",
            'state_code' => substr($gstinCode, 0, 2),
            'is_primary' => true,
            'status' => 'active',
        ]);

        $invoice = Invoice::create([
            'organization_id' => $org->id,
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'customer_id' => $customer->id,
            'invoice_number' => 'INV/' . Str::random(8),
            'invoice_date' => now()->toDateString(),
            'invoice_type' => 'tax_invoice',
            'status' => 'finalized',
            'place_of_supply_state_code' => substr($gstinCode, 0, 2),
            'is_interstate' => false,
            'total_taxable_value' => '1000.00',
            'total_cgst' => '90.00',
            'total_sgst' => '90.00',
            'total_igst' => '0.00',
            'total_tax_amount' => '180.00',
            'round_off' => '0.00',
            'grand_total' => '1180.00',
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'product_id' => $product->id,
            'item_name' => $product->name,
            'hsn_sac' => $product->hsn_sac,
            'quantity' => '1.00',
            'unit' => 'NOS',
            'unit_price' => '1000.00',
            'taxable_value' => '1000.00',
            'cgst_rate' => '9.00',
            'cgst_amount' => '90.00',
            'sgst_rate' => '9.00',
            'sgst_amount' => '90.00',
            'igst_rate' => '0.00',
            'igst_amount' => '0.00',
            'total_amount' => '1180.00',
        ]);

        $purchase = PurchaseBill::create([
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'supplier_id' => $customer->id,
            'bill_number' => 'PB-' . Str::random(6),
            'bill_date' => now()->toDateString(),
            'place_of_supply_state_code' => substr($gstinCode, 0, 2),
            'total_taxable_value' => '500.00',
            'total_cgst' => '45.00',
            'total_sgst' => '45.00',
            'total_igst' => '0.00',
            'total_tax_amount' => '90.00',
            'grand_total' => '590.00',
            'status' => 'received',
        ]);

        return compact('user', 'org', 'business', 'gstin', 'customer', 'product', 'godown', 'invoice', 'purchase');
    }

    public function test_user_a_cannot_view_or_cancel_user_b_invoice(): void
    {
        Sanctum::actingAs($this->tenantA['user']);

        // Cannot view tenant B invoice
        $response = $this->getJson("/api/v1/invoices/{$this->tenantB['invoice']->id}");
        $response->assertStatus(404);

        // Cannot download tenant B invoice PDF
        $responsePdf = $this->getJson("/api/v1/invoices/{$this->tenantB['invoice']->id}/pdf");
        $responsePdf->assertStatus(404);

        // Cannot cancel tenant B invoice
        $responseCancel = $this->postJson("/api/v1/invoices/{$this->tenantB['invoice']->id}/cancel", [
            'reason' => 'Malicious cancellation attempt',
        ]);
        $responseCancel->assertStatus(404);
    }

    public function test_user_a_cannot_create_invoice_for_user_b_business(): void
    {
        Sanctum::actingAs($this->tenantA['user']);

        // Attempting to create invoice for Tenant B organization
        $response = $this->postJson('/api/v1/invoices', [
            'organization_id' => $this->tenantB['org']->id,
            'business_id' => $this->tenantB['business']->id,
            'business_gstin_id' => $this->tenantB['gstin']->id,
            'invoice_date' => now()->toDateString(),
            'place_of_supply_state_code' => '29',
            'items' => [
                [
                    'item_name' => 'Unauthorized Item',
                    'hsn_sac' => '8471',
                    'quantity' => 1,
                    'unit_price' => 100,
                    'gst_rate' => 18,
                ],
            ],
        ]);
        $response->assertStatus(403);
    }

    public function test_user_a_cannot_access_user_b_master_records(): void
    {
        Sanctum::actingAs($this->tenantA['user']);

        // Customer Master
        $this->getJson("/api/v1/customers?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->postJson('/api/v1/customers', [
            'business_id' => $this->tenantB['business']->id,
            'customer_type' => 'b2c',
            'name' => 'Intruder Party',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
        ])->assertStatus(403);

        // Product Master
        $this->getJson("/api/v1/products?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->postJson('/api/v1/products', [
            'business_id' => $this->tenantB['business']->id,
            'type' => 'goods',
            'name' => 'Intruder Widget',
            'sku' => 'INTRUDER-1',
            'hsn_sac' => '8471',
            'sale_price' => 50,
        ])->assertStatus(403);

        // GSTIN Registrations
        $this->getJson("/api/v1/gstins?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->postJson('/api/v1/gstins', [
            'business_id' => $this->tenantB['business']->id,
            'gstin' => '29XXXXX0000X1Z5',
            'state_code' => '29',
            'state_name' => 'Karnataka',
            'legal_name' => 'Hacked GSTIN',
        ])->assertStatus(403);
    }

    public function test_user_a_cannot_access_user_b_purchases_and_reports(): void
    {
        Sanctum::actingAs($this->tenantA['user']);

        // Purchases
        $this->getJson("/api/v1/purchases?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->getJson("/api/v1/purchases/{$this->tenantB['purchase']->id}")
            ->assertStatus(403);

        // GST Reports
        $this->getJson("/api/v1/reports/gstr1?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->getJson("/api/v1/reports/gstr3b?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->postJson('/api/v1/reports/gstr2b-reconcile', [
            'business_id' => $this->tenantB['business']->id,
            'return_period' => '2026-11',
            'gstr2b_data' => [],
        ])->assertStatus(403);

        $this->getJson("/api/v1/reports/gstr9?business_id={$this->tenantB['business']->id}&financial_year=2026-27")
            ->assertStatus(403);
    }

    public function test_user_a_cannot_access_user_b_accounting_and_financials(): void
    {
        Sanctum::actingAs($this->tenantA['user']);

        // Accounts
        $this->getJson("/api/v1/accounting/accounts?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->postJson('/api/v1/accounting/accounts', [
            'business_id' => $this->tenantB['business']->id,
            'code' => '9999',
            'name' => 'Illicit Account',
            'type' => 'asset',
            'sub_type' => 'Bank',
        ])->assertStatus(403);

        // Journal Entries
        $this->getJson("/api/v1/accounting/journal-entries?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->postJson('/api/v1/accounting/journal-entries', [
            'business_id' => $this->tenantB['business']->id,
            'entry_date' => now()->toDateString(),
            'narration' => 'Unauthorized journal voucher',
            'lines' => [
                ['account_id' => (string) Str::uuid(), 'debit' => 100, 'credit' => 0],
                ['account_id' => (string) Str::uuid(), 'debit' => 0, 'credit' => 100],
            ],
        ])->assertStatus(403);

        // Payments
        $this->getJson("/api/v1/accounting/payments?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        // Financial Statements
        $this->getJson("/api/v1/accounting/trial-balance?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->getJson("/api/v1/accounting/profit-loss?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->getJson("/api/v1/accounting/balance-sheet?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);
    }

    public function test_user_a_cannot_access_user_b_manufacturing(): void
    {
        Sanctum::actingAs($this->tenantA['user']);

        // Godowns
        $this->getJson("/api/v1/manufacturing/godowns?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->getJson("/api/v1/manufacturing/godowns/{$this->tenantB['godown']->id}/stock")
            ->assertStatus(403);

        $this->postJson('/api/v1/manufacturing/godowns', [
            'business_id' => $this->tenantB['business']->id,
            'code' => 'GDN-HACK',
            'name' => 'Intruder Godown',
        ])->assertStatus(403);

        // BOMs
        $this->getJson("/api/v1/manufacturing/boms?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        // Production Orders
        $this->getJson("/api/v1/manufacturing/production-orders?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        // Stock Transfers
        $this->getJson("/api/v1/manufacturing/stock-transfers?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);
    }

    public function test_user_a_cannot_access_user_b_einvoicing_and_eway(): void
    {
        Sanctum::actingAs($this->tenantA['user']);

        // e-Invoice
        $this->postJson('/api/v1/einvoice/generate', [
            'invoice_id' => $this->tenantB['invoice']->id,
        ])->assertStatus(403);

        $this->getJson("/api/v1/einvoice/{$this->tenantB['invoice']->id}/json")
            ->assertStatus(403);

        $this->postJson("/api/v1/einvoice/{$this->tenantB['invoice']->id}/cancel", [
            'reason_code' => '1',
        ])->assertStatus(403);

        // E-Way Bill
        $this->getJson("/api/v1/eway?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->postJson('/api/v1/eway/generate', [
            'invoice_id' => $this->tenantB['invoice']->id,
            'distance_km' => 100,
        ])->assertStatus(403);
    }

    public function test_user_a_cannot_export_user_b_tally_data(): void
    {
        Sanctum::actingAs($this->tenantA['user']);

        $this->getJson("/api/v1/export/tally-xml?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);

        $this->postJson('/api/v1/marketplace/import', [
            'business_id' => $this->tenantB['business']->id,
            'channel' => 'amazon',
            'file_content' => 'dummy-content',
        ])->assertStatus(403);

        $this->getJson("/api/v1/marketplace/reconciliation?business_id={$this->tenantB['business']->id}")
            ->assertStatus(403);
    }
}
