<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'organization_name' => 'required|string|max:255',
            'business_legal_name' => 'required|string|max:255',
            'gstin' => 'nullable|string|size:15',
            'state_code' => 'nullable|string|size:2',
            'state_name' => 'nullable|string|max:100',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $organization = Organization::create([
            'name' => $validated['organization_name'],
            'slug' => Str::slug($validated['organization_name']) . '-' . Str::random(5),
            'status' => 'active',
        ]);

        $organization->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $organization->id,
            'legal_name' => $validated['business_legal_name'],
            'trade_name' => $validated['business_legal_name'],
            'email' => $validated['email'],
        ]);

        if (!empty($validated['gstin']) && !empty($validated['state_code'])) {
            BusinessGstin::create([
                'business_id' => $business->id,
                'gstin' => strtoupper($validated['gstin']),
                'state_code' => $validated['state_code'],
                'state_name' => $validated['state_name'] ?? 'State',
                'legal_name' => $validated['business_legal_name'],
                'is_primary' => true,
                'status' => 'active',
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'organization' => $organization,
            'business' => $business,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials provided.'],
            ]);
        }

        $organization = $user->organizations()->first();
        $business = $organization ? $organization->businesses()->first() : null;
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'organization' => $organization,
            'business' => $business,
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $organizations = $user->organizations()->with('businesses.gstins')->get();

        return response()->json([
            'user' => $user,
            'organizations' => $organizations,
        ]);
    }
}
