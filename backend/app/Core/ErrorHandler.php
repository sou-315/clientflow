<?php

namespace App\Core;

use Throwable;

class ErrorHandler
{
    public static function register(): void
    {
        set_exception_handler([self::class, 'handleException']);
        set_error_handler([self::class, 'handleError']);
    }

    public static function handleException(Throwable $e): void
    {
        self::log($e->getMessage(), $e->getFile(), $e->getLine(), $e->getTraceAsString());

        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Internal server error']);
    }

    public static function handleError(int $severity, string $message, string $file, int $line): bool
    {
        self::log($message, $file, $line, '');

        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Internal server error']);
        exit;
    }

    private static function log(string $message, string $file, int $line, string $trace): void
    {
        $logDir = __DIR__ . '/../../storage/logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $entry = sprintf(
            "[%s] %s in %s:%d\n%s\n\n",
            date('Y-m-d H:i:s'),
            $message,
            $file,
            $line,
            $trace
        );

        file_put_contents($logDir . '/error.log', $entry, FILE_APPEND);
    }
}