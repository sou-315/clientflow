<?php

namespace App\Models;

use App\Core\Model;

class Notification extends Model
{
    protected string $table = 'notifications';

    public function forUser(int $userId, int $limit = 30): array
    {
        $sql = "SELECT * FROM {$this->table}
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function unreadCount(int $userId): int
    {
        $sql = "SELECT COUNT(*) AS count FROM {$this->table}
                WHERE user_id = :user_id AND is_read = 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);
        $result = $stmt->fetch();

        return (int) ($result['count'] ?? 0);
    }

    public function markRead(int $id, int $userId): bool
    {
        $sql = "UPDATE {$this->table}
                SET is_read = 1
                WHERE id = :id AND user_id = :user_id";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $id, 'user_id' => $userId]);
    }

    public function markAllRead(int $userId): bool
    {
        $sql = "UPDATE {$this->table}
                SET is_read = 1
                WHERE user_id = :user_id AND is_read = 0";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['user_id' => $userId]);
    }

    public function existsForEntity(int $userId, string $type, string $entityType, int $entityId): bool
    {
        $sql = "SELECT id FROM {$this->table}
                WHERE user_id = :user_id
                  AND type = :type
                  AND entity_type = :entity_type
                  AND entity_id = :entity_id
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'user_id' => $userId,
            'type' => $type,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ]);

        return (bool) $stmt->fetch();
    }
}