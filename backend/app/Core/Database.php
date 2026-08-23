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
            $envFile = getenv('APP_ENV') === 'testing' ? '.env.testing' : '.env';
            $env = parse_ini_file(__DIR__ . '/../../' . $envFile);
            $host = $env['DB_HOST'];
            $port = $env['DB_PORT'];
            $dbname = $env['DB_NAME'];
            $user = $env['DB_USER'];
            $pass = $env['DB_PASS'];
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
