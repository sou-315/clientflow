<?php

namespace App\Models;

use App\Core\Model;

class Activity extends Model
{
    protected string $table = 'activities';

    private function buildWhere(
        ?string $type,
        ?int $leadId,
        ?int $customerId,
        ?int $dealId,
        ?string $search
    ): array {
        $sql = " WHERE 1=1";
        $params = [];

        if ($type !== null && $type !== '') {
            $sql .= " AND activities.type = :type";
            $params['type'] = $type;
        }

        if ($leadId !== null) {
            $sql .= " AND activities.lead_id = :lead_id";
            $params['lead_id'] = $leadId;
        }

        if ($customerId !== null) {
            $sql .= " AND activities.customer_id = :customer_id";
            $params['customer_id'] = $customerId;
        }

        if ($dealId !== null) {
            $sql .= " AND activities.deal_id = :deal_id";
            $params['deal_id'] = $dealId;
        }

        if ($search !== null && $search !== '') {
            $sql .= " AND activities.notes LIKE :search";
            $params['search'] = '%' . $search . '%';
        }

        return [$sql, $params];
    }

    public function search(
        ?string $type = null,
        ?int $leadId = null,
        ?int $customerId = null,
        ?int $dealId = null,
        ?string $search = null,
        ?string $sort = null,
        int $page = 1,
        int $limit = 10
    ): array {
        [$whereSql, $params] = $this->buildWhere($type, $leadId, $customerId, $dealId, $search);

        $sql = "SELECT activities.*,
                       leads.name AS lead_name,
                       customers.name AS customer_name,
                       deals.title AS deal_title
                FROM {$this->table}
                LEFT JOIN leads ON activities.lead_id = leads.id
                LEFT JOIN customers ON activities.customer_id = customers.id
                LEFT JOIN deals ON activities.deal_id = deals.id"
                . $whereSql;

        $sql .= match ($sort) {
            'oldest' => " ORDER BY activities.created_at ASC",
            'type' => " ORDER BY CAST(activities.type AS CHAR) ASC",
            default => " ORDER BY activities.created_at DESC",
        };

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;

        $sql .= " LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function count(
        ?string $type = null,
        ?int $leadId = null,
        ?int $customerId = null,
        ?int $dealId = null,
        ?string $search = null
    ): int {
        [$whereSql, $params] = $this->buildWhere($type, $leadId, $customerId, $dealId, $search);

        $sql = "SELECT COUNT(*) FROM {$this->table} activities" . $whereSql;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    public function findWithRelations(int $id): ?array
    {
        $sql = "SELECT activities.*,
                       leads.name AS lead_name,
                       customers.name AS customer_name,
                       deals.title AS deal_title,
                       users.name AS user_name
                FROM {$this->table}
                LEFT JOIN leads ON activities.lead_id = leads.id
                LEFT JOIN customers ON activities.customer_id = customers.id
                LEFT JOIN deals ON activities.deal_id = deals.id
                LEFT JOIN users ON activities.user_id = users.id
                WHERE activities.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();

        return $result ?: null;
    }
}