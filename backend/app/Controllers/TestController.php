<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;

class TestController extends Controller
{
    public function ping(): void
    {
        $queryReceived = $_GET['check'] ?? null;

        $db = Database::getConnection();
        $stmt = $db->query('SELECT COUNT(*) AS count FROM users');
        $userCount = (int) $stmt->fetch()['count'];

        $this->json([
            'status' => 'ok',
            'query_received' => $queryReceived,
            'user_count' => $userCount,
        ]);
    }

    public function break(): void
    {
        throw new \Exception('Intentional test exception for error handler verification');
    }
}