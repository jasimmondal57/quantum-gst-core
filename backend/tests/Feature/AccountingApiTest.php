<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Customer;
use App\Models\Organization;
use App\Models\Product;
use App\Models\User;
use App\Services\AccountingEngineService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setupTenantEnvironment(): array
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Quantum Enterprises', 'slug' => 'quantum-enterprises']);
        $org->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $org->id,
            'legal_name' => 'Quantum Core Private Limited',
        ]);

        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27ABCDE1234F1Z5',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Quantum Core Private Limited',
            'is_primary' => true,
            'status' => 'active',
        ]);

        $customer = Customer::create([
            'business_id' => $business->id,
            'customer_type' => 'b2b',
            'name' => 'Apex Retailers Mumbai',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'gstin' => '27AAACP0123M1Z9',
        ]);

        $product = Product::create([
            'business_id' => $business->id,
            'name' => 'Industrial Valve Type-A',
            'hsn_sac' => '84818030',
            'sale_price' => '1000.00',
            'type' => 'goods',
        ]);

        return [$user, $org, $business, $gstin, $customer, $product];
    }

    public function test_standard_chart_of_accounts_auto_provisions_and_retrieves()
    {
        [$user, $org, $business] = $this->setupTenantEnvironment();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/v1/accounting/accounts?business_id={$business->id}");

        $response->assertStatus(200);
        $accounts = $response->json();
        $this->assertNotEmpty($accounts);

        $codes = collect($accounts)->pluck('code')->toArray();
        $this->assertContains('1010', $codes); // Cash
        $this->assertContains('1020', $codes); // Bank
        $this->assertContains('1030', $codes); // Sundry Debtors
        $this->assertContains('2020', $codes); // Output CGST
        $this->assertContains('2021', $codes); // Output SGST
        $this->assertContains('4010', $codes); // Sales Revenue
    }

    public function test_invoice_creation_automatically_posts_double_entry_journal()
    {
        [$user, $org, $business, $gstin, $customer, $product] = $this->setupTenantEnvironment();

        $invoicePayload = [
            'organization_id' => $org->id,
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'customer_id' => $customer->id,
            'place_of_supply_state_code' => '27',
            'invoice_date' => '2026-11-01',
            'items' => [
                [
                    'product_id' => $product->id,
                    'item_name' => 'Industrial Valve Type-A',
                    'hsn_sac' => '84818030',
                    'quantity' => 10,
                    'unit' => 'NOS',
                    'unit_price' => '1000.00',
                    'discount_amount' => '0.00',
                    'gst_rate' => 18.00,
                ]
            ]
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/invoices', $invoicePayload);
        $response->assertStatus(201);
        $invoiceId = $response->json('id');

        // Verify Journal Entry was created
        $this->assertDatabaseHas('journal_entries', [
            'business_id' => $business->id,
            'reference_type' => 'invoice',
            'reference_id' => $invoiceId,
            'total_debit' => '11800.00',
            'total_credit' => '11800.00',
            'status' => 'posted',
        ]);

        // Check Trial Balance is in balance
        $tbResponse = $this->actingAs($user, 'sanctum')->getJson("/api/v1/accounting/trial-balance?business_id={$business->id}");
        $tbResponse->assertStatus(200);
        $tb = $tbResponse->json();
        $this->assertTrue($tb['is_balanced']);
        $this->assertEquals('11800.00', $tb['total_debit']);
        $this->assertEquals('11800.00', $tb['total_credit']);
        $this->assertEquals('0.00', $tb['difference']);
    }

    public function test_payment_voucher_receipt_settles_invoice_and_balances_ledger()
    {
        [$user, $org, $business, $gstin, $customer, $product] = $this->setupTenantEnvironment();

        // 1. Create Invoice
        $invRes = $this->actingAs($user, 'sanctum')->postJson('/api/v1/invoices', [
            'organization_id' => $org->id,
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'customer_id' => $customer->id,
            'place_of_supply_state_code' => '27',
            'invoice_date' => '2026-11-01',
            'items' => [
                [
                    'product_id' => $product->id,
                    'item_name' => 'Industrial Valve Type-A',
                    'hsn_sac' => '84818030',
                    'quantity' => 5,
                    'unit' => 'NOS',
                    'unit_price' => '1000.00',
                    'discount_amount' => '0.00',
                    'gst_rate' => 18.00,
                ]
            ]
        ]);
        $invRes->assertStatus(201);
        $invoice = $invRes->json();
        $invoiceId = $invoice['id']; // grand total = 5900.00

        // Get Bank & Debtors accounts
        $accountingService = app(AccountingEngineService::class);
        $bankAccount = $accountingService->getAccount($business->id, '1020');
        $debtorAccount = $accountingService->getAccount($business->id, '1030');

        // 2. Post Payment Receipt Voucher for the full amount (5900.00)
        $paymentPayload = [
            'business_id' => $business->id,
            'voucher_type' => 'receipt',
            'voucher_date' => '2026-11-03',
            'bank_cash_account_id' => $bankAccount->id,
            'party_account_id' => $debtorAccount->id,
            'party_type' => 'customer',
            'party_id' => $customer->id,
            'amount' => '5900.00',
            'payment_mode' => 'bank_transfer',
            'reference_number' => 'NEFT99881122',
            'reference_invoice_id' => $invoiceId,
            'narration' => 'Full payment against invoice received via HDFC bank',
        ];

        $payRes = $this->actingAs($user, 'sanctum')->postJson('/api/v1/accounting/payments', $paymentPayload);
        $payRes->assertStatus(201);

        // Verify Invoice status changed to paid
        $this->assertDatabaseHas('invoices', [
            'id' => $invoiceId,
            'paid_amount' => '5900.00',
            'status' => 'paid',
        ]);

        // Verify Journal Entry for payment exists
        $this->assertDatabaseHas('journal_entries', [
            'business_id' => $business->id,
            'reference_type' => 'payment',
            'total_debit' => '5900.00',
            'total_credit' => '5900.00',
        ]);

        // Verify Party Ledger: Net Outstanding is 0.00
        $ledgerRes = $this->actingAs($user, 'sanctum')->getJson("/api/v1/accounting/ledgers?business_id={$business->id}&party_type=customer&party_id={$customer->id}");
        $ledgerRes->assertStatus(200);
        $ledger = $ledgerRes->json();
        $this->assertEquals('5900.00', $ledger['total_debit']); // Invoice
        $this->assertEquals('5900.00', $ledger['total_credit']); // Payment
        $this->assertEquals('0.00', $ledger['closing_balance']); // Fully settled

        // Verify Balance Sheet
        $bsRes = $this->actingAs($user, 'sanctum')->getJson("/api/v1/accounting/balance-sheet?business_id={$business->id}");
        $bsRes->assertStatus(200);
        $bs = $bsRes->json();
        $this->assertTrue($bs['is_balanced']);
        $this->assertEquals('5900.00', $bs['total_assets']); // Bank cash has 5900.00
    }
}
