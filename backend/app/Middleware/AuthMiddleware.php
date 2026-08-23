<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\JwtHelper;
use App\Core\Auth;

class AuthMiddleware implements MiddlewareInterface
{
    public function handle(): bool
    {
        $request = new Request();
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            $this->unauthorized('Missing or invalid Authorization header.');
            return false;
        }

        $token = substr($authHeader, 7); // remove "Bearer " prefix

        $payload = JwtHelper::decode($token);

        if ($payload === null) {
            $this->unauthorized('Invalid or expired token.');
            return false;
        }

        Auth::setUser($payload);

        return true;
    }

    private function unauthorized(string $message): void
    {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => $message]);
    }
}