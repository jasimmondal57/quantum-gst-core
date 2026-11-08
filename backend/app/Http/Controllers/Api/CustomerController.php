<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
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

        $query = Customer::where('business_id', $businessId);

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'customer_type' => 'required|string|in:b2b,b2c,export,sez,supplier',
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'gstin' => 'nullable|string|size:15',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'state_code' => 'required|string|size:2',
            'state_name' => 'required|string',
            'billing_address' => 'nullable|string',
            'billing_pincode' => 'nullable|string|size:6',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        if (!empty($validated['gstin'])) {
            $validated['gstin'] = strtoupper($validated['gstin']);
        }

        $customer = Customer::create($validated);

        return response()->json($customer, 201);
    }
}
