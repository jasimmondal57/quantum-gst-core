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
            'organization_name' => 'nullable|string|max:255',
            'business_legal_name' => 'nullable|string|max:255',
            'gstin' => 'nullable|string|size:15',
            'state_code' => 'nullable|string|size:2',
            'state_name' => 'nullable|string|max:100',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $orgName = !empty($validated['organization_name'])
            ? $validated['organization_name']
            : ($validated['name'] . ' Enterprises');

        $bizName = !empty($validated['business_legal_name'])
            ? $validated['business_legal_name']
            : $orgName;

        $organization = Organization::create([
            'name' => $orgName,
            'slug' => Str::slug($orgName) . '-' . Str::random(5),
            'status' => 'active',
        ]);

        $organization->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $organization->id,
            'legal_name' => $bizName,
            'trade_name' => $bizName,
            'email' => $validated['email'],
        ]);

        if (!empty($validated['gstin'])) {
            $gstinUpper = strtoupper($validated['gstin']);
            $derivedStateCode = !empty($validated['state_code']) ? $validated['state_code'] : substr($gstinUpper, 0, 2);
            $derivedStateName = !empty($validated['state_name']) ? $validated['state_name'] : 'State (' . $derivedStateCode . ')';

            BusinessGstin::create([
                'business_id' => $business->id,
                'gstin' => $gstinUpper,
                'state_code' => $derivedStateCode,
                'state_name' => $derivedStateName,
                'legal_name' => $bizName,
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
                'email' => ['Invalid email or password provided.'],
            ]);
        }

        $organization = $user->organizations()->with('businesses.gstins')->first();
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
        $primaryOrg = $organizations->first();
        $primaryBusiness = $primaryOrg ? $primaryOrg->businesses->first() : null;

        return response()->json([
            'user' => $user,
            'organizations' => $organizations,
            'organization' => $primaryOrg,
            'business' => $primaryBusiness,
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user() && $request->user()->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
