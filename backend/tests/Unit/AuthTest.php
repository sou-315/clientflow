<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Core\Auth;

class AuthTest extends TestCase
{
    protected function setUp(): void
    {
        // Reset static state before every test so tests don't leak into each other.
        Auth::setUser([]);
    }

    public function testIdReturnsNullWhenNoUserSet(): void
    {
        $this->assertNull(Auth::id());
    }

    public function testRoleReturnsNullWhenNoUserSet(): void
    {
        $this->assertNull(Auth::role());
    }

    public function testIdReturnsUserIdAfterSetUser(): void
    {
        Auth::setUser(['user_id' => 7, 'role' => 'Admin']);

        $this->assertEquals(7, Auth::id());
    }

    public function testRoleReturnsRoleAfterSetUser(): void
    {
        Auth::setUser(['user_id' => 7, 'role' => 'Admin']);

        $this->assertEquals('Admin', Auth::role());
    }

    public function testUserReturnsFullArray(): void
    {
        $userData = ['user_id' => 3, 'role' => 'Employee'];
        Auth::setUser($userData);

        $this->assertEquals($userData, Auth::user());
    }
}
