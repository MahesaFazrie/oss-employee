<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class HealthEndpointTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test health endpoint returns success response.
     */
    public function test_health_endpoint_returns_success(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'status',
                    'database',
                    'timestamp',
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'healthy',
                    'database' => 'connected',
                ],
            ]);
    }

    /**
     * Test health endpoint follows standard API response format.
     */
    public function test_health_endpoint_follows_api_format(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);

        $data = $response->json();

        $this->assertArrayHasKey('success', $data);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('message', $data);
        $this->assertIsBool($data['success']);
    }

    /**
     * Test 404 returns standard API error format.
     */
    public function test_not_found_returns_standard_error_format(): void
    {
        $response = $this->getJson('/api/nonexistent-endpoint');

        $response->assertStatus(404)
            ->assertJsonStructure([
                'success',
                'data',
                'message',
                'errors',
            ])
            ->assertJson([
                'success' => false,
                'data' => null,
            ]);
    }
}
