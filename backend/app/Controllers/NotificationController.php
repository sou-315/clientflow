<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Core\Notifier;
use App\Models\Notification;

class NotificationController extends Controller
{
    public function index(): void
    {
        $userId = Auth::id();
        Notifier::checkDueSoonTasks($userId);

        $model = new Notification();
        $notifications = $model->forUser($userId);

        $this->success(['notifications' => $notifications]);
    }

    public function unreadCount(): void
    {
        $userId = Auth::id();
        Notifier::checkDueSoonTasks($userId);

        $model = new Notification();
        $count = $model->unreadCount($userId);

        $this->success(['unread_count' => $count]);
    }

    public function markRead(string $id): void
    {
        $userId = Auth::id();
        $model = new Notification();
        $model->markRead((int) $id, $userId);

        $this->success(['message' => 'Notification marked as read.']);
    }

    public function markAllRead(): void
    {
        $userId = Auth::id();
        $model = new Notification();
        $model->markAllRead($userId);

        $this->success(['message' => 'All notifications marked as read.']);
    }
}