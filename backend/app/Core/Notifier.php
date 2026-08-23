<?php

namespace App\Core;

use App\Models\Notification;
use App\Models\Task;

class Notifier
{
    public static function notify(int $userId, string $type, string $message, string $entityType, int $entityId): void
    {
        $model = new Notification();
        $model->create([
            'user_id' => $userId,
            'type' => $type,
            'message' => $message,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ]);
    }

    public static function checkDueSoonTasks(int $userId, int $hoursAhead = 48): void
    {
        $taskModel = new Task();
        $notificationModel = new Notification();

        $dueSoonTasks = $taskModel->dueSoonForUser($userId, $hoursAhead);

        foreach ($dueSoonTasks as $task) {
            $alreadyNotified = $notificationModel->existsForEntity(
                $userId,
                'task_due_soon',
                'task',
                (int) $task['id']
            );

            if (!$alreadyNotified) {
                self::notify(
                    $userId,
                    'task_due_soon',
                    "Task \"{$task['title']}\" is due soon.",
                    'task',
                    (int) $task['id']
                );
            }
        }
    }
}