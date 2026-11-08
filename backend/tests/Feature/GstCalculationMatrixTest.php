<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GstCalculationMatrixTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Organization $org;
    private Business $business;
    private BusinessGstin $gstin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->org = Organization::create(['name' => 'Apex Enterprises', 'slug' => 'apex-ent']);
        $this->org->users()->attach($this->user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $this->business = Business::create([
            'organization_id' => $this->org->id,
            'legal_name' => 'Apex Retail & Solutions',
        ]);

        // Maharashtra Origin (27)
        $this->gstin = BusinessGstin::create([
            'business_id' => $this->business->id,
            'gstin' => '27AAACA1234A1Z5',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Apex Retail & Solutions',
            'is_primary' => true,
            'status' => 'active',
        ]);
    }

    /**
     * Test 1: Tax-inclusive pricing correctly reverse-extracts taxable base
     * Item: 1 qty @ ₹666.00 gross (inclusive of 5% GST).
     * Taxable = 666 * 100 / 105 = 634.29.
     * Tax = 31.71 (CGST 15.86 + SGST 15.85).
     * Grand Total = ₹666.00.
     */
    public function test_tax_inclusive_invoice_reverse_extracts_base_taxable()
    {
        $payload = [
            'organization_id' => $this->org->id,
            'business_id' => $this->business->id,
            'business_gstin_id' => $this->gstin->id,
            'invoice_date' => '2026-11-09',
            'place_of_supply_state_code' => '27', // Intra-state
            'items' => [
                [
                    'item_name' => 'Cotton Garment (Tax-Inclusive)',
                    'hsn_sac' => '6203',
                    'quantity' => 1,
                    'unit' => 'PCS',
                    'unit_price' => 666.00,
                    'gst_rate' => 5,
                    'tax_inclusive' => true,
                ],
            ],
        ];

        $res = $this->actingAs($this->user)->postJson('/api/v1/invoices', $payload);

        $res->assertStatus(201);
        $res->assertJson([
            'total_taxable_value' => '634.29',
            'total_cgst' => '15.85',
            'total_sgst' => '15.85',
            'total_igst' => '0.00',
            'total_tax_amount' => '31.71',
            'round_off' => '0.00',
            'grand_total' => '666.00',
        ]);
    }

    /**
     * Test 2: Proportional Invoice-Level Discount Allocation under Section 15(3) of CGST Act.
     * Two lines:
     * Line 1: ₹1,000 base @ 18% GST (Intra-state)
     * Line 2: ₹1,000 base @ 12% GST (Intra-state)
     * Invoice Discount: ₹200 fixed (allocated ₹100 to Line 1, ₹100 to Line 2).
     * Net Taxable:
     * Line 1: ₹900 @ 18% -> CGST ₹81, SGST ₹81 (Total tax ₹162).
     * Line 2: ₹900 @ 12% -> CGST ₹54, SGST ₹54 (Total tax ₹108).
     * Total Taxable = ₹1,800.00.
     * Total CGST = ₹135.00, Total SGST = ₹135.00, Total Tax = ₹270.00.
     * Grand Total = ₹2,070.00.
     */
    public function test_proportional_invoice_discount_reduces_taxable_base_and_taxes()
    {
        $payload = [
            'organization_id' => $this->org->id,
            'business_id' => $this->business->id,
            'business_gstin_id' => $this->gstin->id,
            'invoice_date' => '2026-11-09',
            'place_of_supply_state_code' => '27',
            'invoice_discount_type' => 'fixed',
            'invoice_discount_value' => 200,
            'items' => [
                [
                    'item_name' => 'Standard Item 18%',
                    'hsn_sac' => '8471',
                    'quantity' => 1,
                    'unit_price' => 1000,
                    'gst_rate' => 18,
                ],
                [
                    'item_name' => 'Processed Good 12%',
                    'hsn_sac' => '2106',
                    'quantity' => 1,
                    'unit_price' => 1000,
                    'gst_rate' => 12,
                ],
            ],
        ];

        $res = $this->actingAs($this->user)->postJson('/api/v1/invoices', $payload);

        $res->assertStatus(201);
        $res->assertJson([
            'total_taxable_value' => '1800.00',
            'total_cgst' => '135.00',
            'total_sgst' => '135.00',
            'total_igst' => '0.00',
            'total_tax_amount' => '270.00',
            'grand_total' => '2070.00',
        ]);
    }

    /**
     * Test 3: Reverse Charge Mechanism (RCM - Sec 9(3)/9(4)).
     * Statutory taxes must be computed for reporting in GSTR-1 Table 4B / GSTR-3B Table 3.1(d),
     * but customer payable grand_total must NOT charge the tax to the customer.
     * Taxable: ₹5,000 @ 18% IGST (Inter-state to Gujarat, 24).
     * IGST: ₹900.00.
     * Customer Grand Total = ₹5,000.00 (Customer pays ₹900 directly to GST department).
     */
    public function test_reverse_charge_records_statutory_tax_but_excludes_it_from_customer_grand_total()
    {
        $payload = [
            'organization_id' => $this->org->id,
            'business_id' => $this->business->id,
            'business_gstin_id' => $this->gstin->id,
            'invoice_date' => '2026-11-09',
            'place_of_supply_state_code' => '24', // Gujarat (Inter-state)
            'reverse_charge' => true,
            'items' => [
                [
                    'item_name' => 'Legal Advisory Services under RCM',
                    'hsn_sac' => '9982',
                    'quantity' => 1,
                    'unit_price' => 5000,
                    'gst_rate' => 18,
                ],
            ],
        ];

        $res = $this->actingAs($this->user)->postJson('/api/v1/invoices', $payload);

        $res->assertStatus(201);
        $res->assertJson([
            'reverse_charge' => true,
            'is_interstate' => true,
            'total_taxable_value' => '5000.00',
            'total_cgst' => '0.00',
            'total_sgst' => '0.00',
            'total_igst' => '900.00',
            'total_tax_amount' => '900.00',
            'grand_total' => '5000.00', // Excludes ₹900 RCM tax
        ]);
    }

    /**
     * Test 4: Mixed Cart with Ad-valorem Cess and Rupee Rounding.
     * Motor vehicle line: ₹10,000 @ 28% IGST + 12% Cess.
     * IGST = ₹2,800.00, Cess = ₹1,200.00. Total item = ₹14,000.00.
     */
    public function test_mixed_cart_with_ad_valorem_cess()
    {
        $payload = [
            'organization_id' => $this->org->id,
            'business_id' => $this->business->id,
            'business_gstin_id' => $this->gstin->id,
            'invoice_date' => '2026-11-09',
            'place_of_supply_state_code' => '29', // Inter-state
            'items' => [
                [
                    'item_name' => 'Automotive Component',
                    'hsn_sac' => '8708',
                    'quantity' => 1,
                    'unit_price' => 10000,
                    'gst_rate' => 28,
                    'cess_rate' => 12,
                ],
            ],
        ];

        $res = $this->actingAs($this->user)->postJson('/api/v1/invoices', $payload);

        $res->assertStatus(201);
        $res->assertJson([
            'total_taxable_value' => '10000.00',
            'total_igst' => '2800.00',
            'total_cess' => '1200.00',
            'total_tax_amount' => '4000.00',
            'grand_total' => '14000.00',
        ]);
    }

    /**
     * Test 5: Export supply without payment of tax under LUT / Bond.
     * Taxable: $10,000 INR.
     * Tax must be strictly 0.00. Grand total = Taxable.
     */
    public function test_export_without_payment_of_tax()
    {
        $payload = [
            'organization_id' => $this->org->id,
            'business_id' => $this->business->id,
            'business_gstin_id' => $this->gstin->id,
            'invoice_date' => '2026-11-09',
            'supply_type' => 'EXPORT_WITHOUT_PAYMENT',
            'place_of_supply_state_code' => '99', // Overseas
            'items' => [
                [
                    'item_name' => 'Custom Software Export',
                    'hsn_sac' => '998314',
                    'quantity' => 1,
                    'unit_price' => 50000,
                    'gst_rate' => 18,
                ],
            ],
        ];

        $res = $this->actingAs($this->user)->postJson('/api/v1/invoices', $payload);

        $res->assertStatus(201);
        $res->assertJson([
            'is_interstate' => true,
            'total_taxable_value' => '50000.00',
            'total_cgst' => '0.00',
            'total_sgst' => '0.00',
            'total_igst' => '0.00',
            'total_tax_amount' => '0.00',
            'grand_total' => '50000.00',
        ]);
    }
}
