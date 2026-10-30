<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_statutory_gst_invoice_via_api()
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Acme Corp', 'slug' => 'acme-corp']);
        $business = Business::create(['organization_id' => $org->id, 'legal_name' => 'Acme Technologies']);
        
        // Origin state 27 (Maharashtra)
        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27AAACA1234A1Z5',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Acme Technologies',
            'is_primary' => true,
        ]);

        $payload = [
            'organization_id' => $org->id,
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'invoice_date' => '2026-10-30',
            // Inter-state supply to state 29 (Karnataka) -> IGST
            'place_of_supply_state_code' => '29',
            'items' => [
                [
                    'item_name' => 'Enterprise Cloud License',
                    'hsn_sac' => '998313',
                    'quantity' => 2,
                    'unit' => 'NOS',
                    'unit_price' => 50000,
                    'gst_rate' => 18,
                ]
            ]
        ];

        $response = $this->actingAs($user)->postJson('/api/v1/invoices', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'is_interstate' => true,
                     'total_taxable_value' => '100000.00',
                     'total_cgst' => '0.00',
                     'total_sgst' => '0.00',
                     'total_igst' => '18000.00',
                     'grand_total' => '118000.00',
                 ]);
    }
}

