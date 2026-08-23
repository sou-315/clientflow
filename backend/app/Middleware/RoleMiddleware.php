<?php

namespace App\Middleware;

use App\Core\Auth;

class RoleMiddleware implements MiddlewareInterface
{
    private array $allowedRoles;

    public function __construct(array $allowedRoles)
    {
        $this->allowedRoles = $allowedRoles;
    }

    public function handle(): bool
    {
        $role = Auth::role();

        if ($role === null || !in_array($role, $this->allowedRoles, true)) {
            $this->forbidden('You do not have permission to perform this action.');
            return false;
        }

        return true;
    }

    private function forbidden(string $message): void
    {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => $message]);
    }
}