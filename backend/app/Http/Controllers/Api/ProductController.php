<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\TaxCategory;
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
            'gst_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $gstRate = isset($validated['gst_rate']) ? (float) $validated['gst_rate'] : 18.0;
        $halfRate = round($gstRate / 2, 3);
        $taxCategory = TaxCategory::firstOrCreate(
            ['igst_rate' => $gstRate],
            [
                'name' => "GST {$gstRate}%",
                'cgst_rate' => $halfRate,
                'sgst_rate' => $halfRate,
                'supply_type' => $gstRate == 0.0 ? 'exempt' : 'taxable',
                'is_system' => true,
            ]
        );
        $validated['tax_category_id'] = $taxCategory->id;
        unset($validated['gst_rate']);

        $product = Product::create($validated);
        $product->load('taxCategory');

        return response()->json($product, 201);
    }
}
