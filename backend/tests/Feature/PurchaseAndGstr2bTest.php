<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Customer;
use App\Models\Godown;
use App\Models\Invoice;
use App\Models\Organization;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PurchaseAndGstr2bTest extends TestCase
{
    use RefreshDatabase;

    protected function setupEnvironment(): array
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Kirloskar Heavy Machining', 'slug' => 'kirloskar-heavy']);
        $org->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $org->id,
            'legal_name' => 'Kirloskar Heavy Machining Pvt Ltd',
        ]);

        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27AAACK5555F1Z1',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Kirloskar Heavy Machining Pvt Ltd',
            'is_primary' => true,
            'status' => 'active',
        ]);

        // Vendor / Supplier
        $supplier = Customer::create([
            'business_id' => $business->id,
            'customer_type' => 'b2b',
            'name' => 'Jindal Steel & Power Limited',
            'company_name' => 'Jindal Steel & Power Limited',
            'gstin' => '27AAACJ8888K1Z5',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
        ]);

        // Product
        $rawSteel = Product::create([
            'business_id' => $business->id,
            'name' => 'Mild Steel Plate Grade 250',
            'hsn_sac' => '72083940',
            'type' => 'goods',
            'unit' => 'KGS',
            'sale_price' => '90.00',
            'purchase_price' => '70.00',
        ]);

        // Godown
        $godown = Godown::create([
            'business_id' => $business->id,
            'code' => 'PUNE-YARD',
            'name' => 'Pune Raw Yard',
            'is_primary' => true,
        ]);

        return [$user, $org, $business, $gstin, $supplier, $rawSteel, $godown];
    }

    public function test_can_record_purchase_bill_posts_double_entry_and_increments_inventory()
    {
        [$user, $org, $business, $gstin, $supplier, $rawSteel, $godown] = $this->setupEnvironment();

        $payload = [
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'supplier_id' => $supplier->id,
            'godown_id' => $godown->id,
            'bill_number' => 'JSPL/2026/0491',
            'bill_date' => '2026-11-04',
            'place_of_supply_state_code' => '27',
            'itc_eligibility' => 'inputs',
            'items' => [
                [
                    'product_id' => $rawSteel->id,
                    'item_name' => 'Mild Steel Plate Grade 250',
                    'hsn_sac' => '72083940',
                    'quantity' => 100, // 100 kgs @ 70 = 7000
                    'unit' => 'KGS',
                    'unit_price' => 70,
                    'gst_rate' => 18, // 18% = 1260 (630 CGST + 630 SGST)
                ]
            ]
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/purchases', $payload);

        $response->assertStatus(201);
        $bill = $response->json();

        $this->assertEquals('7000.00', $bill['total_taxable_value']);
        $this->assertEquals('630.00', $bill['total_cgst']);
        $this->assertEquals('630.00', $bill['total_sgst']);
        $this->assertEquals('8260.00', $bill['grand_total']);

        // Verify Double-Entry Journal Entry exists
        $this->assertDatabaseHas('journal_entries', [
            'business_id' => $business->id,
            'reference_type' => 'purchase_bill',
            'reference_id' => $bill['id'],
            'total_debit' => '8260.00',
            'total_credit' => '8260.00',
        ]);

        // Verify Trial Balance is 100% balanced
        $tbRes = $this->actingAs($user, 'sanctum')->getJson("/api/v1/accounting/trial-balance?business_id={$business->id}");
        $tbRes->assertStatus(200);
        $this->assertTrue($tbRes->json('is_balanced'));

        // Verify Stock in Godown was automatically incremented (100 KGS)
        $stock = \App\Models\StockBalance::where('godown_id', $godown->id)->where('product_id', $rawSteel->id)->first();
        $this->assertNotNull($stock);
        $this->assertEquals('100.0000', $stock->quantity);
        $this->assertEquals('70.00', $stock->unit_cost);
    }

    public function test_gstr2b_reconciliation_identifies_matched_missing_and_ineligible_itc()
    {
        [$user, $org, $business, $gstin, $supplier, $rawSteel] = $this->setupEnvironment();

        // 1. Bill in Books that matches portal
        PurchaseBill::create([
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'supplier_id' => $supplier->id,
            'bill_number' => 'INV-MATCH-01',
            'bill_date' => '2026-11-03',
            'place_of_supply_state_code' => '27',
            'total_taxable_value' => '10000.00',
            'total_cgst' => '900.00',
            'total_sgst' => '900.00',
            'total_tax_amount' => '1800.00',
            'grand_total' => '11800.00',
            'itc_eligibility' => 'inputs',
            'status' => 'received',
        ]);

        // 2. Bill in Books missing in GSTR-2B (Supplier hasn't filed GSTR-1)
        PurchaseBill::create([
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'supplier_id' => $supplier->id,
            'bill_number' => 'INV-UNFILED-02',
            'bill_date' => '2026-11-05',
            'place_of_supply_state_code' => '27',
            'total_taxable_value' => '5000.00',
            'total_cgst' => '450.00',
            'total_sgst' => '450.00',
            'total_tax_amount' => '900.00',
            'grand_total' => '5900.00',
            'itc_eligibility' => 'inputs',
            'status' => 'received',
        ]);

        // 3. Bill in Books with Section 17(5) Blocked Credit
        PurchaseBill::create([
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'supplier_id' => $supplier->id,
            'bill_number' => 'INV-BLOCKED-03',
            'bill_date' => '2026-11-06',
            'place_of_supply_state_code' => '27',
            'total_taxable_value' => '20000.00',
            'total_cgst' => '2800.00',
            'total_sgst' => '2800.00',
            'total_tax_amount' => '5600.00',
            'grand_total' => '25600.00',
            'itc_eligibility' => 'ineligible', // 17(5)
            'status' => 'received',
        ]);

        // Simulated Portal GSTR-2B JSON:
        // Contains INV-MATCH-01 AND contains a new invoice from supplier (INV-NEW-99) missing in books
        $portalJson = [
            'b2b' => [
                [
                    'ctin' => '27AAACJ8888K1Z5',
                    'inv' => [
                        [
                            'inum' => 'INV-MATCH-01',
                            'dt' => '03-11-2026',
                            'val' => 11800.00,
                            'taxable' => 10000.00,
                            'cgst' => 900.00,
                            'sgst' => 900.00,
                            'itcavl' => 'Y',
                        ],
                        [
                            'inum' => 'INV-NEW-99',
                            'dt' => '08-11-2026',
                            'val' => 2360.00,
                            'taxable' => 2000.00,
                            'cgst' => 180.00,
                            'sgst' => 180.00,
                            'itcavl' => 'Y',
                        ],
                    ]
                ]
            ]
        ];

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/v1/reports/gstr2b-reconcile', [
            'business_id' => $business->id,
            'return_period' => '2026-11',
            'gstr2b_data' => $portalJson,
        ]);

        $res->assertStatus(200);
        $summary = $res->json('summary');

        $this->assertEquals(1, $summary['matched_count']); // INV-MATCH-01
        $this->assertEquals(1, $summary['missing_in_portal_count']); // INV-UNFILED-02
        $this->assertEquals(1, $summary['missing_in_books_count']); // INV-NEW-99
        $this->assertEquals(1, $summary['ineligible_itc_count']); // INV-BLOCKED-03
        $this->assertEquals('1800.00', $summary['total_eligible_itc_confirmed']);
    }

    public function test_can_compile_gstr9_annual_return()
    {
        [$user, , $business, $gstin, $supplier] = $this->setupEnvironment();

        // Create a regular sales invoice in FY 2026-27
        Invoice::create([
            'organization_id' => $business->organization_id,
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'customer_id' => $supplier->id,
            'invoice_number' => 'INV/2026-27/0001',
            'invoice_date' => '2026-10-15',
            'invoice_type' => 'tax_invoice',
            'place_of_supply_state_code' => '27',
            'total_taxable_value' => '50000.00',
            'total_cgst' => '4500.00',
            'total_sgst' => '4500.00',
            'total_tax_amount' => '9000.00',
            'grand_total' => '59000.00',
            'status' => 'finalized',
        ]);

        $res = $this->actingAs($user, 'sanctum')->getJson("/api/v1/reports/gstr9?business_id={$business->id}&financial_year=2026-27");

        $res->assertStatus(200);
        $gstr9 = $res->json();

        $this->assertEquals('2026-27', $gstr9['financial_year']);
        $this->assertEquals('50000.00', $gstr9['table_4_outward_taxable']['b2b']['txval']);
        $this->assertEquals('4500.00', $gstr9['table_4_outward_taxable']['b2b']['camt']);
        $this->assertEquals('4500.00', $gstr9['table_4_outward_taxable']['b2b']['samt']);
    }
}
