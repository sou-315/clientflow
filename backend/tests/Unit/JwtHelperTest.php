<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Core\JwtHelper;

class JwtHelperTest extends TestCase
{
    public function testGenerateAndDecodeReturnsOriginalPayload(): void
    {
        $token = JwtHelper::generate(['user_id' => 42, 'role' => 'Employee']);
        $decoded = JwtHelper::decode($token);

        $this->assertNotNull($decoded);
        $this->assertEquals(42, $decoded['user_id']);
        $this->assertEquals('Employee', $decoded['role']);
    }

    public function testGeneratedTokenIncludesIssuedAtAndExpiry(): void
    {
        $token = JwtHelper::generate(['user_id' => 1], 3600);
        $decoded = JwtHelper::decode($token);

        $this->assertArrayHasKey('iat', $decoded);
        $this->assertArrayHasKey('exp', $decoded);
        $this->assertEquals(3600, $decoded['exp'] - $decoded['iat']);
    }

    public function testExpiredTokenReturnsNull(): void
    {
        $token = JwtHelper::generate(['user_id' => 1], -10);
        $decoded = JwtHelper::decode($token);

        $this->assertNull($decoded);
    }

    public function testGarbageTokenReturnsNull(): void
    {
        $decoded = JwtHelper::decode('not.a.real.token');

        $this->assertNull($decoded);
    }

    public function testTamperedTokenReturnsNull(): void
    {
        $token = JwtHelper::generate(['user_id' => 1]);
        $tampered = substr($token, 0, -3) . 'xyz';

        $decoded = JwtHelper::decode($tampered);

        $this->assertNull($decoded);
    }
}
