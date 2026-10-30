<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->query('business_id');

        $query = Product::with('taxCategory');
        if ($businessId) {
            $query->where('business_id', $businessId);
        }

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

        $product = Product::create($validated);

        return response()->json($product, 201);
    }
}
