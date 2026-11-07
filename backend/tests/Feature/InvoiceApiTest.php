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
        $org->users()->attach($user->id, [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create(['organization_id' => $org->id, 'legal_name' => 'Acme Technologies']);
        
        // Origin state 27 (Maharashtra)
        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27AAACA1234A1Z5',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Acme Technologies',
            'is_primary' => true,
            'status' => 'active',
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

    public function test_user_cannot_create_invoice_for_another_tenant()
    {
        $user = User::factory()->create();
        $userOrg = Organization::create(['name' => 'My Org', 'slug' => 'my-org']);
        $userOrg->users()->attach($user->id, [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        // Another tenant's organization and business
        $otherOrg = Organization::create(['name' => 'Other Corp', 'slug' => 'other-corp']);
        $otherBusiness = Business::create(['organization_id' => $otherOrg->id, 'legal_name' => 'Other Tech']);
        $otherGstin = BusinessGstin::create([
            'business_id' => $otherBusiness->id,
            'gstin' => '29AAACA9999Z1Z1',
            'state_code' => '29',
            'state_name' => 'Karnataka',
            'legal_name' => 'Other Tech',
            'is_primary' => true,
            'status' => 'active',
        ]);

        $payload = [
            'organization_id' => $otherOrg->id, // Attempting to inject into other tenant
            'business_id' => $otherBusiness->id,
            'business_gstin_id' => $otherGstin->id,
            'invoice_date' => '2026-10-30',
            'place_of_supply_state_code' => '29',
            'items' => [
                [
                    'item_name' => 'Unauthorized Item',
                    'hsn_sac' => '998313',
                    'quantity' => 1,
                    'unit_price' => 1000,
                    'gst_rate' => 18,
                ]
            ]
        ];

        $response = $this->actingAs($user)->postJson('/api/v1/invoices', $payload);

        // Multi-tenant security check must reject with 403 Forbidden
        $response->assertStatus(403);
    }

    public function test_invoice_creation_fails_when_no_active_gstin_registered()
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'New Org', 'slug' => 'new-org']);
        $org->users()->attach($user->id, [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create(['organization_id' => $org->id, 'legal_name' => 'New Biz']);
        // Notice: NO BusinessGstin created for this business

        $payload = [
            'organization_id' => $org->id,
            'business_id' => $business->id,
            'invoice_date' => '2026-10-30',
            'place_of_supply_state_code' => '19',
            'items' => [
                [
                    'item_name' => 'Consulting Services',
                    'hsn_sac' => '998311',
                    'quantity' => 1,
                    'unit_price' => 5000,
                    'gst_rate' => 18,
                ]
            ]
        ];

        $response = $this->actingAs($user)->postJson('/api/v1/invoices', $payload);

        // Synthetic GSTIN must NEVER be auto-generated; must fail with 422
        $response->assertStatus(422)
                 ->assertJsonFragment([
                     'message' => 'Statutory Compliance Error: No active GSTIN is registered for this business. Please register or select a verified GSTIN before issuing a GST Tax Invoice.'
                 ]);
    }
}
