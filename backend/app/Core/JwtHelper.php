<?php

namespace App\Core;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtHelper
{
    private static function getSecret(): string
    {
        $env = parse_ini_file(__DIR__ . '/../../.env');
        return $env['JWT_SECRET'];
    }

    public static function generate(array $payload, int $expiresInSeconds = 3600): string
    {
        $issuedAt = time();
        $payload['iat'] = $issuedAt;
        $payload['exp'] = $issuedAt + $expiresInSeconds;

        return JWT::encode($payload, self::getSecret(), 'HS256');
    }

    public static function decode(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::getSecret(), 'HS256'));
            return (array) $decoded;
        } catch (\Exception $e) {
            return null;
        }
    }
}