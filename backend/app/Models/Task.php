<?php

namespace App\Models;

use App\Core\Model;

class Task extends Model
{
    protected string $table = 'tasks';

    private function buildWhere(
        ?string $status,
        ?string $priority,
        ?int $assignedTo,
        ?int $leadId,
        ?int $customerId,
        ?int $dealId,
        ?string $search
    ): array {
        $sql = " WHERE 1=1";
        $params = [];

        if ($status !== null && $status !== '') {
            $sql .= " AND tasks.status = :status";
            $params['status'] = $status;
        }

        if ($priority !== null && $priority !== '') {
            $sql .= " AND tasks.priority = :priority";
            $params['priority'] = $priority;
        }

        if ($assignedTo !== null) {
            $sql .= " AND tasks.assigned_to = :assigned_to";
            $params['assigned_to'] = $assignedTo;
        }

        if ($leadId !== null) {
            $sql .= " AND tasks.lead_id = :lead_id";
            $params['lead_id'] = $leadId;
        }

        if ($customerId !== null) {
            $sql .= " AND tasks.customer_id = :customer_id";
            $params['customer_id'] = $customerId;
        }

        if ($dealId !== null) {
            $sql .= " AND tasks.deal_id = :deal_id";
            $params['deal_id'] = $dealId;
        }

        if ($search !== null && $search !== '') {
            $sql .= " AND tasks.title LIKE :search";
            $params['search'] = '%' . $search . '%';
        }

        return [$sql, $params];
    }

    public function search(
        ?string $status = null,
        ?string $priority = null,
        ?int $assignedTo = null,
        ?int $leadId = null,
        ?int $customerId = null,
        ?int $dealId = null,
        ?string $search = null,
        ?string $sort = null,
        int $page = 1,
        int $limit = 10
    ): array {
        [$whereSql, $params] = $this->buildWhere(
            $status, $priority, $assignedTo, $leadId, $customerId, $dealId, $search
        );

        $sql = "SELECT tasks.*,
                       users.name AS assigned_to_name,
                       leads.name AS lead_name,
                       customers.name AS customer_name,
                       deals.title AS deal_title
                FROM {$this->table}
                LEFT JOIN users ON tasks.assigned_to = users.id
                LEFT JOIN leads ON tasks.lead_id = leads.id
                LEFT JOIN customers ON tasks.customer_id = customers.id
                LEFT JOIN deals ON tasks.deal_id = deals.id"
                . $whereSql;

        $sql .= match ($sort) {
            'due_latest' => " ORDER BY tasks.due_date IS NULL, tasks.due_date DESC",
            'priority_high' => " ORDER BY tasks.priority DESC",
            'priority_low' => " ORDER BY tasks.priority ASC",
            'newest' => " ORDER BY tasks.created_at DESC",
            default => " ORDER BY tasks.due_date IS NULL, tasks.due_date ASC, tasks.created_at DESC",
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
        ?string $status = null,
        ?string $priority = null,
        ?int $assignedTo = null,
        ?int $leadId = null,
        ?int $customerId = null,
        ?int $dealId = null,
        ?string $search = null
    ): int {
        [$whereSql, $params] = $this->buildWhere(
            $status, $priority, $assignedTo, $leadId, $customerId, $dealId, $search
        );

        $sql = "SELECT COUNT(*) FROM {$this->table} tasks" . $whereSql;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    public function findWithRelations(int $id): ?array
    {
        $sql = "SELECT tasks.*,
                       users.name AS assigned_to_name,
                       leads.name AS lead_name,
                       customers.name AS customer_name,
                       deals.title AS deal_title
                FROM {$this->table}
                LEFT JOIN users ON tasks.assigned_to = users.id
                LEFT JOIN leads ON tasks.lead_id = leads.id
                LEFT JOIN customers ON tasks.customer_id = customers.id
                LEFT JOIN deals ON tasks.deal_id = deals.id
                WHERE tasks.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();

        return $result ?: null;
    }
        public function dueSoonForUser(int $userId, int $hoursAhead): array
    {
        $sql = "SELECT * FROM {$this->table}
                WHERE assigned_to = :user_id
                  AND status != 'Done'
                  AND due_date IS NOT NULL
                  AND due_date <= DATE_ADD(NOW(), INTERVAL :hours HOUR)
                  AND due_date >= NOW()";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->bindValue(':hours', $hoursAhead, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}