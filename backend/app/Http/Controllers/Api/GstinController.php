<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessGstin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GstinController extends Controller
{
    /**
     * Tenant verification helper.
     */
    protected function authorizeBusiness(Request $request, string $businessId): void
    {
        $user = $request->user('sanctum') ?? $request->user();
        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $allowed = DB::table('businesses')
                ->where('id', $businessId)
                ->whereIn('organization_id', $userOrgIds)
                ->exists();

            if (!$allowed) {
                abort(403, 'Unauthorized: Business does not belong to your organization.');
            }
        }
    }

    public function index(Request $request)
    {
        $businessId = $request->query('business_id');

        if (!$businessId) {
            abort(400, 'business_id query parameter is required.');
        }

        $this->authorizeBusiness($request, $businessId);

        $query = BusinessGstin::where('business_id', $businessId);

        return response()->json($query->orderByDesc('is_primary')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'gstin' => 'required|string|size:15',
            'state_code' => 'required|string|size:2',
            'state_name' => 'required|string|max:100',
            'legal_name' => 'required|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'registration_type' => 'nullable|string|in:regular,composition,sez,isd',
            'address_line1' => 'nullable|string',
            'city' => 'nullable|string',
            'pincode' => 'nullable|string|size:6',
            'is_primary' => 'nullable|boolean',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $validated['gstin'] = strtoupper($validated['gstin']);

        $gstin = BusinessGstin::create($validated);

        return response()->json($gstin, 201);
    }
}
