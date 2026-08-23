<?php

namespace App\Core;

class Controller
{
    protected function json(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
    }

    protected function success(array $data = [], int $statusCode = 200): void
    {
        $this->json($data, $statusCode);
    }

    protected function error(string $message, int $statusCode = 400): void
    {
        $this->json(['error' => $message], $statusCode);
    }

    protected function getRequestBody(): array
    {
        $body = file_get_contents('php://input');
        $decoded = json_decode($body, true);
        return is_array($decoded) ? $decoded : [];
    }
}