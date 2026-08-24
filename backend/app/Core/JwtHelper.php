<?php
namespace App\Core;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
class JwtHelper
{
    private static function getSecret(): string
    {
        // Try a real environment variable first (used in production, e.g. Render).
        $secret = getenv('JWT_SECRET');

        // Fall back to a local .env file if it's not set (local development).
        if (!$secret) {
            $envFile = getenv('APP_ENV') === 'testing' ? '.env.testing' : '.env';
            $env = parse_ini_file(__DIR__ . '/../../' . $envFile);
            $secret = $env['JWT_SECRET'] ?? null;
        }

        if (!$secret) {
            throw new \RuntimeException('JWT_SECRET is not configured.');
        }

        return $secret;
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
