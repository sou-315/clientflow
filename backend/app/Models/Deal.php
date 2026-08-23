<?php

namespace App\Models;

use App\Core\Model;

class Deal extends Model
{
    protected string $table = 'deals';

    private function buildWhere(?string $status, ?string $search): array
    {
        $sql = " WHERE 1=1";
        $params = [];

        if ($status !== null && $status !== '') {
            $sql .= " AND deals.status = :status";
            $params['status'] = $status;
        }

        if ($search !== null && $search !== '') {
            $sql .= " AND deals.title LIKE :search";
            $params['search'] = '%' . $search . '%';
        }

        return [$sql, $params];
    }

    public function search(?string $status, ?string $search, ?string $sort = null, int $page = 1, int $limit = 10): array
    {
        [$whereSql, $params] = $this->buildWhere($status, $search);

        $sql = "SELECT deals.*, customers.name AS customer_name
                FROM {$this->table}
                LEFT JOIN customers ON deals.customer_id = customers.id"
                . $whereSql;

        $sql .= match ($sort) {
            'value' => " ORDER BY deals.value DESC",
            'close_date' => " ORDER BY deals.expected_close_date ASC",
            default => " ORDER BY deals.created_at DESC",
        };

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;

        $sql .= " LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function count(?string $status, ?string $search): int
    {
        [$whereSql, $params] = $this->buildWhere($status, $search);

        $sql = "SELECT COUNT(*) FROM {$this->table} deals" . $whereSql;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    public function findWithCustomer(int $id): ?array
    {
        $sql = "SELECT deals.*, customers.name AS customer_name
                FROM {$this->table}
                JOIN customers ON deals.customer_id = customers.id
                WHERE deals.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();

        return $result ?: null;
    }
}