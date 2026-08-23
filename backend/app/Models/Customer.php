<?php

namespace App\Models;

use App\Core\Model;

class Customer extends Model
{
    protected string $table = 'customers';

    private function buildWhere(?string $search): array
    {
        $sql = " WHERE 1=1";
        $params = [];

        if ($search !== null && $search !== '') {
            $sql .= " AND (name LIKE :search OR email LIKE :search)";
            $params['search'] = '%' . $search . '%';
        }

        return [$sql, $params];
    }

    public function search(?string $search, ?string $sort = null, int $page = 1, int $limit = 10): array
    {
        [$whereSql, $params] = $this->buildWhere($search);

        $sql = "SELECT * FROM {$this->table}" . $whereSql;

        $sql .= match ($sort) {
            'name' => " ORDER BY name ASC",
            default => " ORDER BY created_at DESC",
        };

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;

        $sql .= " LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function count(?string $search): int
    {
        [$whereSql, $params] = $this->buildWhere($search);

        $sql = "SELECT COUNT(*) FROM {$this->table}" . $whereSql;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    public function findWithCompany(int $id): ?array
    {
        $sql = "SELECT customers.*, companies.name AS company_name
                FROM {$this->table}
                LEFT JOIN companies ON customers.company_id = companies.id
                WHERE customers.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();

        return $result ?: null;
    }
}