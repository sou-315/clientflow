<?php

namespace App\Models;

use App\Core\Model;

class Lead extends Model
{
    protected string $table = 'leads';

    private function buildWhere(?string $status, ?string $search, ?string $from, ?string $to): array
    {
        $sql = " WHERE 1=1";
        $params = [];

        if ($status !== null && $status !== '') {
            $sql .= " AND status = :status";
            $params['status'] = $status;
        }

        if ($search !== null && $search !== '') {
            $sql .= " AND (name LIKE :search OR email LIKE :search)";
            $params['search'] = '%' . $search . '%';
        }

        if ($from !== null && $from !== '') {
            $sql .= " AND created_at >= :from";
            $params['from'] = $from . ' 00:00:00';
        }

        if ($to !== null && $to !== '') {
            $sql .= " AND created_at <= :to";
            $params['to'] = $to . ' 23:59:59';
        }

        return [$sql, $params];
    }

    public function search(
        ?string $status,
        ?string $search,
        ?string $sort = null,
        ?string $from = null,
        ?string $to = null,
        int $page = 1,
        int $limit = 10
    ): array {
        [$whereSql, $params] = $this->buildWhere($status, $search, $from, $to);

        $sql = "SELECT * FROM {$this->table}" . $whereSql;

        $sql .= match ($sort) {
            'name' => " ORDER BY name ASC",
            'status' => " ORDER BY status ASC",
            default => " ORDER BY created_at DESC",
        };

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;

        // LIMIT/OFFSET are cast to int above, safe to inline directly (not user-controlled strings).
        $sql .= " LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function count(?string $status, ?string $search, ?string $from = null, ?string $to = null): int
    {
        [$whereSql, $params] = $this->buildWhere($status, $search, $from, $to);

        $sql = "SELECT COUNT(*) FROM {$this->table}" . $whereSql;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }
}