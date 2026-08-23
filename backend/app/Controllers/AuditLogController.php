<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    public function index(): void
    {
        $request = new Request();
        $action = $request->query('action');
        $entityType = $request->query('entity_type');
        $userId = $request->query('user_id');
        $from = $request->query('from');
        $to = $request->query('to');
        $page = (int) ($request->query('page') ?? 1);
        $limit = (int) ($request->query('limit') ?? 20);

        $userIdInt = $userId !== null && $userId !== '' ? (int) $userId : null;

        $auditLogModel = new AuditLog();
        $logs = $auditLogModel->search($action, $entityType, $userIdInt, $from, $to, $page, $limit);
        $total = $auditLogModel->count($action, $entityType, $userIdInt, $from, $to);

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));

        $this->success([
            'logs' => $logs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => $limit > 0 ? (int) ceil($total / $limit) : 0,
            ],
        ]);
    }
}