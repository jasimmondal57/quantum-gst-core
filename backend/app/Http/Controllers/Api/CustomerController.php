<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->query('business_id');

        $query = Customer::query();
        if ($businessId) {
            $query->where('business_id', $businessId);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'customer_type' => 'required|string|in:b2b,b2c,export,sez',
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

        if (!empty($validated['gstin'])) {
            $validated['gstin'] = strtoupper($validated['gstin']);
        }

        $customer = Customer::create($validated);

        return response()->json($customer, 201);
    }
}
