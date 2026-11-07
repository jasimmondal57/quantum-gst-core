<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Invoice;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditDebitNoteTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_issue_statutory_credit_note_against_invoice()
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

        // Create an existing tax invoice
        $invoice = Invoice::create([
            'organization_id' => $org->id,
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'invoice_number' => 'INV/2026-27/0042',
            'invoice_date' => '2026-10-25',
            'invoice_type' => 'tax_invoice',
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

        // Issue Credit Note for Sales Return
        $payload = [
            'business_id' => $business->id,
            'original_invoice_id' => $invoice->id,
            'note_type' => 'credit_note',
            'note_date' => '2026-10-28',
            'reason_code' => '01', // Sales Return
            'taxable_value' => '2000.00',
            'cgst_amount' => '180.00',
            'sgst_amount' => '180.00',
            'igst_amount' => '0.00',
            'notes' => 'Customer returned defective units',
        ];

        $response = $this->actingAs($user)->postJson('/api/v1/credit-debit-notes', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'note_type' => 'credit_note',
                     'taxable_value' => '2000.00',
                     'cgst_amount' => '180.00',
                     'sgst_amount' => '180.00',
                     'igst_amount' => '0.00',
                     'total_amount' => '2360.00',
                     'status' => 'finalized',
                 ]);

        $this->assertDatabaseHas('credit_debit_notes', [
            'original_invoice_id' => $invoice->id,
            'note_type' => 'credit_note',
            'reason' => '01 - Sales Return',
            'total_amount' => '2360.00',
        ]);
    }
}
