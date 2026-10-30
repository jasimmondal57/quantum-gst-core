<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\InvoiceSequence;
use App\Models\Organization;
use App\Models\Product;
use App\Models\TaxCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OnboardingController extends Controller
{
    /**
     * Check if the instance is already initialized or needs initial setup.
     */
    public function checkStatus(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        if ($user) {
            $organization = $user->organizations()->with('businesses.gstins')->first();
            $business = $organization ? $organization->businesses->first() : null;

            return response()->json([
                'is_initialized' => $business !== null,
                'business' => $business,
                'organization' => $organization,
                'user' => $user,
            ]);
        }

        return response()->json([
            'is_initialized' => false,
            'business' => null,
            'organization' => null,
        ]);
    }

    /**
     * Complete Onboarding Setup Flow (Organization, Business, Multi-GSTIN, Invoice Sequence, Default Catalog).
     */
    public function completeSetup(Request $request)
    {
        $validated = $request->validate([
            // Admin User (if not logged in)
            'admin_name' => 'nullable|string|max:255',
            'admin_email' => 'nullable|email',
            'admin_password' => 'nullable|string|min:8',

            // Company Profile
            'legal_name' => 'required|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'pan' => 'required|string|size:10',
            'business_type' => 'required|string|in:proprietorship,partnership,llp,pvt_ltd,public_ltd,individual',
            'email' => 'required|email',
            'phone' => 'required|string|max:15',

            // Primary GSTIN & Place of Supply
            'gstin' => 'required|string|size:15',
            'state_code' => 'required|string|size:2',
            'state_name' => 'required|string|max:100',
            'registration_type' => 'nullable|string|in:regular,composition,sez,isd',
            'address_line1' => 'required|string',
            'city' => 'required|string',
            'pincode' => 'required|string|size:6',

            // Invoice Sequence Preferences
            'invoice_prefix' => 'nullable|string|max:10',
            'default_payment_terms' => 'nullable|string|max:50',

            // Selected Sales Channels
            'enabled_channels' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $user = $request->user();

            if (! $user) {
                $user = User::create([
                    'name' => $validated['admin_name'] ?? 'Admin',
                    'email' => $validated['admin_email'] ?? $validated['email'],
                    'password' => Hash::make($validated['admin_password'] ?? 'Quantum@2026!'),
                ]);
            }

            // 1. Organization
            $organization = Organization::create([
                'name' => $validated['trade_name'] ?? $validated['legal_name'],
                'slug' => Str::slug($validated['legal_name']) . '-' . Str::random(5),
                'status' => 'active',
                'timezone' => 'Asia/Kolkata',
            ]);

            $organization->users()->attach($user->id, [
                'id' => (string) Str::uuid(),
                'role' => 'owner',
                'status' => 'active',
            ]);

            // 2. Business Entity
            $business = Business::create([
                'organization_id' => $organization->id,
                'legal_name' => $validated['legal_name'],
                'trade_name' => $validated['trade_name'] ?? $validated['legal_name'],
                'pan' => strtoupper($validated['pan']),
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'currency' => 'INR',
                'status' => 'active',
            ]);

            // 3. Primary State GSTIN
            $gstin = BusinessGstin::create([
                'business_id' => $business->id,
                'gstin' => strtoupper($validated['gstin']),
                'state_code' => $validated['state_code'],
                'state_name' => $validated['state_name'],
                'legal_name' => $validated['legal_name'],
                'trade_name' => $validated['trade_name'] ?? $validated['legal_name'],
                'registration_type' => $validated['registration_type'] ?? 'regular',
                'address_line1' => $validated['address_line1'],
                'city' => $validated['city'],
                'pincode' => $validated['pincode'],
                'is_primary' => true,
                'status' => 'active',
            ]);

            // 4. Default Financial Year Invoice Sequence
            $now = Carbon::now();
            $fyStart = $now->month >= 4 ? $now->year : $now->year - 1;
            $fyString = $fyStart . '-' . substr((string) ($fyStart + 1), -2);

            InvoiceSequence::create([
                'business_id' => $business->id,
                'business_gstin_id' => $gstin->id,
                'document_type' => 'invoice',
                'prefix' => $validated['invoice_prefix'] ?? 'INV/',
                'financial_year' => $fyString,
                'next_number' => 1,
            ]);

            // 5. Seed standard GST Tax Categories
            $tax18 = TaxCategory::firstOrCreate(
                ['name' => 'Standard GST 18%'],
                ['cgst_rate' => 9.0, 'sgst_rate' => 9.0, 'igst_rate' => 18.0, 'supply_type' => 'taxable', 'is_system' => true]
            );

            // 6. Seed initial sample Product/Service
            Product::create([
                'business_id' => $business->id,
                'type' => 'goods',
                'sku' => 'PROD-001',
                'name' => 'Standard Goods / General Merchandise',
                'hsn_sac' => '84713010',
                'tax_category_id' => $tax18->id,
                'unit' => 'NOS',
                'sale_price' => 1000.00,
                'status' => 'active',
            ]);

            $token = $user->createToken('onboarding_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Onboarding and company profile setup successfully completed.',
                'token' => $token,
                'user' => $user,
                'organization' => $organization,
                'business' => $business->load('gstins'),
            ], 201);
        });
    }
}
