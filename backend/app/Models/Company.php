<?php

namespace App\Models;

use App\Core\Model;

class Company extends Model
{
    protected string $table = 'companies';

    private function buildWhere(?string $search, ?string $industry): array
    {
        $sql = " WHERE 1=1";
        $params = [];

        if ($search !== null && $search !== '') {
            $sql .= " AND name LIKE :search";
            $params['search'] = '%' . $search . '%';
        }

        if ($industry !== null && $industry !== '') {
            $sql .= " AND industry = :industry";
            $params['industry'] = $industry;
        }

        return [$sql, $params];
    }

    public function search(?string $search, ?string $sort = null, ?string $industry = null, int $page = 1, int $limit = 10): array
    {
        [$whereSql, $params] = $this->buildWhere($search, $industry);

        $sql = "SELECT * FROM {$this->table}" . $whereSql;

        $sql .= match ($sort) {
            'name' => " ORDER BY name ASC",
            default => " ORDER BY created_at DESC",
        };

        $page = max(1, $page);
        $limit = max(1, min(1000, $limit));
        $offset = ($page - 1) * $limit;

        $sql .= " LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function count(?string $search, ?string $industry): int
    {
        [$whereSql, $params] = $this->buildWhere($search, $industry);

        $sql = "SELECT COUNT(*) FROM {$this->table}" . $whereSql;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    public function customers(int $companyId): array
    {
        $sql = "SELECT * FROM customers WHERE company_id = :company_id ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['company_id' => $companyId]);

        return $stmt->fetchAll();
    }
}