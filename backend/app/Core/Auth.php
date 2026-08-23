<?php

namespace App\Core;

class Auth
{
    private static ?array $user = null;

    public static function setUser(array $user): void
    {
        self::$user = $user;
    }

    public static function user(): ?array
    {
        return self::$user;
    }

    public static function id(): ?int
    {
        return self::$user['user_id'] ?? null;
    }

    public static function role(): ?string
    {
        return self::$user['role'] ?? null;
    }
}