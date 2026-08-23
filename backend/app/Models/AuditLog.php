<?php

namespace App\Models;

use App\Core\Model;
use App\Core\Auth;

class AuditLog extends Model
{
    protected string $table = 'audit_logs';

    public function log(string $action, string $entityType, int $entityId, array $details = []): void
    {
        $this->create([
            'user_id' => Auth::id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => json_encode($details),
        ]);
    }

    private function buildWhere(
        ?string $action,
        ?string $entityType,
        ?int $userId,
        ?string $from,
        ?string $to
    ): array {
        $sql = " WHERE 1=1";
        $params = [];

        if ($action !== null && $action !== '') {
            $sql .= " AND audit_logs.action = :action";
            $params['action'] = $action;
        }

        if ($entityType !== null && $entityType !== '') {
            $sql .= " AND audit_logs.entity_type = :entity_type";
            $params['entity_type'] = $entityType;
        }

        if ($userId !== null) {
            $sql .= " AND audit_logs.user_id = :user_id";
            $params['user_id'] = $userId;
        }

        if ($from !== null && $from !== '') {
            $sql .= " AND audit_logs.created_at >= :from";
            $params['from'] = $from . ' 00:00:00';
        }

        if ($to !== null && $to !== '') {
            $sql .= " AND audit_logs.created_at <= :to";
            $params['to'] = $to . ' 23:59:59';
        }

        return [$sql, $params];
    }

    public function search(
        ?string $action = null,
        ?string $entityType = null,
        ?int $userId = null,
        ?string $from = null,
        ?string $to = null,
        int $page = 1,
        int $limit = 20
    ): array {
        [$whereSql, $params] = $this->buildWhere($action, $entityType, $userId, $from, $to);

        $sql = "SELECT audit_logs.*, users.name AS user_name
                FROM {$this->table}
                LEFT JOIN users ON audit_logs.user_id = users.id"
                . $whereSql
                . " ORDER BY audit_logs.created_at DESC";

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;

        $sql .= " LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function count(
        ?string $action = null,
        ?string $entityType = null,
        ?int $userId = null,
        ?string $from = null,
        ?string $to = null
    ): int {
        [$whereSql, $params] = $this->buildWhere($action, $entityType, $userId, $from, $to);

        $sql = "SELECT COUNT(*) FROM {$this->table} audit_logs" . $whereSql;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }
}