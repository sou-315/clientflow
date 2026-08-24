<?php
namespace App\Core;
use PDO;
use PDOException;
class Database
{
    private static ?PDO $instance = null;
    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            // Try real environment variables first (used in production, e.g. Render).
            $host = getenv('DB_HOST');
            $port = getenv('DB_PORT');
            $dbname = getenv('DB_NAME');
            $user = getenv('DB_USER');
            $pass = getenv('DB_PASS');

            // Fall back to a local .env file if any of the above aren't set (local development).
            if (!$host || !$port || !$dbname || !$user || $pass === false) {
                $envFile = getenv('APP_ENV') === 'testing' ? '.env.testing' : '.env';
                $env = parse_ini_file(__DIR__ . '/../../' . $envFile);
                $host = $env['DB_HOST'] ?? $host;
                $port = $env['DB_PORT'] ?? $port;
                $dbname = $env['DB_NAME'] ?? $dbname;
                $user = $env['DB_USER'] ?? $user;
                $pass = $env['DB_PASS'] ?? $pass;
            }

            try {
                self::$instance = new PDO(
                    "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
                    $user,
                    $pass
                );
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
            }
        }
        return self::$instance;
    }
    public static function reset(): void
    {
        self::$instance = null;
    }
}