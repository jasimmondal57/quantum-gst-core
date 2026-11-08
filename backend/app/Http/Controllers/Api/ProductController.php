<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
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

        $query = Product::with('taxCategory')->where('business_id', $businessId);

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'type' => 'required|string|in:goods,service',
            'sku' => 'nullable|string|max:50',
            'name' => 'required|string|max:255',
            'hsn_sac' => 'required|string|max:8',
            'unit' => 'nullable|string|max:10',
            'sale_price' => 'required|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'tax_inclusive' => 'nullable|boolean',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $product = Product::create($validated);

        return response()->json($product, 201);
    }
}
