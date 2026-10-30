<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusinessController extends Controller
{
    /**
     * List all businesses / companies belonging to the authenticated user's organization(s).
     */
    public function index(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $orgIds = $user->organizations()->pluck('organizations.id');
        $businesses = Business::with('gstins')
            ->whereIn('organization_id', $orgIds)
            ->latest()
            ->get();

        return response()->json([
            'data' => $businesses,
        ]);
    }

    /**
     * Create a new business / company for the authenticated user.
     */
    public function store(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'organization_id' => 'nullable|uuid|exists:organizations,id',
            'legal_name' => 'required|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'pan' => 'nullable|string|max:10',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'gstin' => 'nullable|string|max:15',
            'state_code' => 'nullable|string|max:2',
            'state_name' => 'nullable|string|max:100',
        ]);

        $orgId = $validated['organization_id'] ?? null;
        if (! $orgId) {
            $primaryOrg = $user->organizations()->first();
            if (! $primaryOrg) {
                $primaryOrg = Organization::create([
                    'name' => $validated['legal_name'],
                    'slug' => strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $validated['legal_name'])) . '-' . substr(md5(uniqid()), 0, 5),
                    'status' => 'active',
                    'timezone' => 'Asia/Kolkata',
                ]);
                $primaryOrg->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);
            }
            $orgId = $primaryOrg->id;
        }

        return DB::transaction(function () use ($validated, $orgId, $user) {
            $tradeName = ! empty($validated['trade_name']) ? $validated['trade_name'] : $validated['legal_name'];
            $email = ! empty($validated['email']) ? $validated['email'] : $user->email;

            $business = Business::create([
                'organization_id' => $orgId,
                'legal_name' => $validated['legal_name'],
                'trade_name' => $tradeName,
                'pan' => $validated['pan'] ?? null,
                'email' => $email,
                'phone' => $validated['phone'] ?? null,
                'currency' => 'INR',
                'status' => 'active',
            ]);

            if (! empty($validated['gstin'])) {
                $gstinUpper = strtoupper(trim($validated['gstin']));
                $derivedStateCode = ! empty($validated['state_code']) ? $validated['state_code'] : substr($gstinUpper, 0, 2);
                $derivedStateName = ! empty($validated['state_name']) ? $validated['state_name'] : 'State (' . $derivedStateCode . ')';

                BusinessGstin::create([
                    'business_id' => $business->id,
                    'gstin' => $gstinUpper,
                    'state_code' => $derivedStateCode,
                    'state_name' => $derivedStateName,
                    'legal_name' => $validated['legal_name'],
                    'is_primary' => true,
                    'status' => 'active',
                ]);
            }

            $business->load('gstins');

            return response()->json([
                'message' => 'Company created successfully',
                'business' => $business,
            ], 201);
        });
    }
}
