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

    public function test_can_create_product_with_persisted_gst_rate_and_tax_category()
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Acme Corp', 'slug' => 'acme-corp']);
        $org->users()->attach($user->id, [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);
        $business = Business::create(['organization_id' => $org->id, 'legal_name' => 'Acme Tech']);

        $payload = [
            'business_id' => $business->id,
            'type' => 'goods',
            'name' => 'Precision Sensor Device',
            'hsn_sac' => '9031',
            'unit' => 'NOS',
            'sale_price' => 12500.00,
            'tax_inclusive' => false,
            'gst_rate' => 18,
        ];

        $response = $this->actingAs($user)->postJson('/api/v1/products', $payload);

        $response->assertStatus(201);
        $data = $response->json();
        $this->assertEquals(18.0, (float) $data['gst_rate']);
        $this->assertNotEmpty($data['tax_category_id']);
        $this->assertEquals(18.0, (float) $data['tax_category']['igst_rate']);
    }

    public function test_can_create_customer_and_supplier_parties()
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Acme Corp', 'slug' => 'acme-corp']);
        $org->users()->attach($user->id, [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);
        $business = Business::create(['organization_id' => $org->id, 'legal_name' => 'Acme Tech']);

        // 1. Create B2B Customer
        $custPayload = [
            'business_id' => $business->id,
            'customer_type' => 'b2b',
            'name' => 'Tata Consultancy Services',
            'gstin' => '27AAACT2727Q1ZW',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'billing_pincode' => '400001',
        ];

        $custResp = $this->actingAs($user)->postJson('/api/v1/customers', $custPayload);
        $custResp->assertStatus(201);
        $this->assertEquals('27AAACT2727Q1ZW', $custResp->json('gstin'));

        // 2. Create Supplier / Vendor (Unregistered without GSTIN)
        $suppPayload = [
            'business_id' => $business->id,
            'customer_type' => 'supplier',
            'name' => 'Local Artisan Handcrafts (Unregistered)',
            'state_code' => '33',
            'state_name' => 'Tamil Nadu',
            'billing_pincode' => '600001',
        ];

        $suppResp = $this->actingAs($user)->postJson('/api/v1/customers', $suppPayload);
        $suppResp->assertStatus(201);
        $this->assertEquals('supplier', $suppResp->json('customer_type'));
        $this->assertNull($suppResp->json('gstin'));

        // 3. Create Overseas Export Party (Without Indian GSTIN, state 99)
        $exportPayload = [
            'business_id' => $business->id,
            'customer_type' => 'export',
            'name' => 'Acme International LLC (Dubai UAE)',
            'state_code' => '99',
            'state_name' => 'Other Territory / Overseas',
        ];

        $exportResp = $this->actingAs($user)->postJson('/api/v1/customers', $exportPayload);
        $exportResp->assertStatus(201);
        $this->assertEquals('export', $exportResp->json('customer_type'));
        $this->assertEquals('99', $exportResp->json('state_code'));
    }

    public function test_product_without_tax_category_does_not_silently_fallback_to_18_percent()
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Acme Corp', 'slug' => 'acme-corp']);
        $org->users()->attach($user->id, [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);
        $business = Business::create(['organization_id' => $org->id, 'legal_name' => 'Acme Tech']);

        // Create product without tax category
        $product = \App\Models\Product::create([
            'business_id' => $business->id,
            'type' => 'goods',
            'name' => 'Uncategorized Raw Mineral',
            'hsn_sac' => '2501',
            'sale_price' => 500,
        ]);

        // Accessor must return null, NOT 18.0!
        $this->assertNull($product->gst_rate);
    }
}
