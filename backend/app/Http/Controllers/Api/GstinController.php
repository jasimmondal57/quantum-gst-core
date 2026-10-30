<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessGstin;
use Illuminate\Http\Request;

class GstinController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->query('business_id');

        $query = BusinessGstin::query();
        if ($businessId) {
            $query->where('business_id', $businessId);
        }

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

        $validated['gstin'] = strtoupper($validated['gstin']);

        $gstin = BusinessGstin::create($validated);

        return response()->json($gstin, 201);
    }
}
