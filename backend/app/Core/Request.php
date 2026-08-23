<?php

namespace App\Core;

class Request
{
    public function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public function allQuery(): array
    {
        return $_GET;
    }

    public function body(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    public function input(string $key, mixed $default = null): mixed
    {
        $body = $this->body();
        return $body[$key] ?? $default;
    }

    public function method(): string
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    public function header(string $name): ?string
    {
        $headerKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$headerKey] ?? null;
    }
}