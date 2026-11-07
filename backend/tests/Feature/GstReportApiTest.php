<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\CreditDebitNote;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GstReportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_generate_statutory_gstr1_and_gstr3b_returns()
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Acme Corp', 'slug' => 'acme-corp']);
        $org->users()->attach($user->id, [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create(['organization_id' => $org->id, 'legal_name' => 'Acme Technologies']);
        
        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27AAACA1234A1Z5',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Acme Technologies',
            'is_primary' => true,
            'status' => 'active',
        ]);

        $b2bCustomer = Customer::create([
            'business_id' => $business->id,
            'name' => 'Enterprise Buyer Ltd',
            'gstin' => '29BBBCB5678C1Z2',
            'state_code' => '29',
            'state_name' => 'Karnataka',
        ]);

        // 1. Create B2B Invoice
        $b2bInvoice = Invoice::create([
            'organization_id' => $org->id,
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'customer_id' => $b2bCustomer->id,
            'invoice_number' => 'INV/2026-27/0001',
            'invoice_date' => '2026-10-15',
            'invoice_type' => 'tax_invoice',
            'place_of_supply_state_code' => '29',
            'is_interstate' => true,
            'total_taxable_value' => '50000.00',
            'total_cgst' => '0.00',
            'total_sgst' => '0.00',
            'total_igst' => '9000.00',
            'total_tax_amount' => '9000.00',
            'grand_total' => '59000.00',
            'status' => 'finalized',
        ]);

        InvoiceItem::create([
            'invoice_id' => $b2bInvoice->id,
            'item_name' => 'Cloud Router',
            'hsn_sac' => '851762',
            'quantity' => 1,
            'unit' => 'NOS',
            'unit_price' => '50000.00',
            'taxable_value' => '50000.00',
            'igst_rate' => '18.00',
            'igst_amount' => '9000.00',
            'total_amount' => '59000.00',
        ]);

        // 2. Issue a Credit Note against the B2B invoice
        CreditDebitNote::create([
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'original_invoice_id' => $b2bInvoice->id,
            'note_type' => 'credit_note',
            'note_number' => 'CRN/2026-27/0001',
            'note_date' => '2026-10-20',
            'reason' => '01 - Sales Return',
            'taxable_value' => '5000.00',
            'cgst_amount' => '0.00',
            'sgst_amount' => '0.00',
            'igst_amount' => '900.00',
            'total_amount' => '5900.00',
            'status' => 'finalized',
        ]);

        // 3. Test GSTR-1 Return API
        $gstr1Response = $this->actingAs($user)->getJson("/api/v1/reports/gstr1?business_id={$business->id}&month=10&year=2026");

        $gstr1Response->assertStatus(200)
                      ->assertJson([
                          'statutory_return' => 'GSTR-1',
                          'meta' => [
                              'total_invoices' => 1,
                              'b2b_count' => 1,
                              'cdnr_count' => 1,
                          ],
                          'totals' => [
                              'total_taxable_value' => '50000.00',
                              'total_igst' => '9000.00',
                              'grand_total' => '59000.00',
                          ],
                      ]);

        // 4. Test GSTR-3B Return API
        $gstr3bResponse = $this->actingAs($user)->getJson("/api/v1/reports/gstr3b?business_id={$business->id}&month=10&year=2026");

        $gstr3bResponse->assertStatus(200)
                       ->assertJson([
                           'statutory_return' => 'GSTR-3B',
                           'table_3_1' => [
                               '3_1_a_outward_taxable' => [
                                   'taxable_value' => '50000.00',
                                   'igst' => '9000.00',
                               ],
                           ],
                       ]);
    }
}
