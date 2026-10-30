<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_successfully()
    {
        $payload = [
            'name' => 'Jasim Mondal',
            'email' => 'jasim@quantumgst.in',
            'password' => 'secretPassword123',
            'organization_name' => 'Quantum Tech Global',
            'business_legal_name' => 'Quantum Tech Pvt Ltd',
            'gstin' => '27AAACQ1234F1Z5',
            'state_code' => '27',
            'state_name' => 'Maharashtra'
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'token',
                     'user' => ['id', 'name', 'email'],
                     'organization' => ['id', 'name', 'slug'],
                     'business' => ['id', 'legal_name', 'trade_name']
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'jasim@quantumgst.in',
            'name' => 'Jasim Mondal'
        ]);
        $this->assertDatabaseHas('organizations', [
            'name' => 'Quantum Tech Global'
        ]);
        $this->assertDatabaseHas('businesses', [
            'legal_name' => 'Quantum Tech Pvt Ltd'
        ]);
        $this->assertDatabaseHas('business_gstins', [
            'gstin' => '27AAACQ1234F1Z5'
        ]);
    }

    public function test_user_can_login_with_valid_credentials()
    {
        $registerPayload = [
            'name' => 'Test User',
            'email' => 'test@quantumgst.in',
            'password' => 'securePass123',
            'organization_name' => 'Test Organization',
            'business_legal_name' => 'Test Business'
        ];

        $this->postJson('/api/v1/auth/register', $registerPayload);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@quantumgst.in',
            'password' => 'securePass123'
        ]);

        $loginResponse->assertStatus(200)
                      ->assertJsonStructure([
                          'token',
                          'user' => ['id', 'name', 'email'],
                          'organization',
                          'business'
                      ]);
    }

    public function test_user_cannot_login_with_invalid_password()
    {
        $user = User::create([
            'name' => 'Existing User',
            'email' => 'existing@quantumgst.in',
            'password' => bcrypt('correctPassword')
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'existing@quantumgst.in',
            'password' => 'wrongPassword'
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_access_me_and_logout()
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                           ->getJson('/api/v1/auth/me');

        $meResponse->assertStatus(200)
                   ->assertJsonPath('user.email', $user->email);

        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                               ->postJson('/api/v1/auth/logout');

        $logoutResponse->assertStatus(200)
                       ->assertJson([
                           'message' => 'Logged out successfully'
                       ]);
    }
}

