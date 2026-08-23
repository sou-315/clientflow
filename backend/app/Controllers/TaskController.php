<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Notifier;
use App\Models\Task;
use App\Models\AuditLog;

class TaskController extends Controller
{
    private array $validPriorities = ['Low', 'Medium', 'High'];
    private array $validStatuses = ['Pending', 'In Progress', 'Done'];

    public function index(): void
    {
        $request = new Request();
        $status = $request->query('status');
        $priority = $request->query('priority');
        $assignedTo = $request->query('assigned_to');
        $leadId = $request->query('lead_id');
        $customerId = $request->query('customer_id');
        $dealId = $request->query('deal_id');
        $search = $request->query('search');
        $sort = $request->query('sort');
        $page = (int) ($request->query('page') ?? 1);
        $limit = (int) ($request->query('limit') ?? 10);

        $assignedToInt = $assignedTo !== null && $assignedTo !== '' ? (int) $assignedTo : null;
        $leadIdInt = $leadId !== null && $leadId !== '' ? (int) $leadId : null;
        $customerIdInt = $customerId !== null && $customerId !== '' ? (int) $customerId : null;
        $dealIdInt = $dealId !== null && $dealId !== '' ? (int) $dealId : null;

        $taskModel = new Task();
        $tasks = $taskModel->search(
            $status,
            $priority,
            $assignedToInt,
            $leadIdInt,
            $customerIdInt,
            $dealIdInt,
            $search,
            $sort,
            $page,
            $limit
        );
        $total = $taskModel->count(
            $status,
            $priority,
            $assignedToInt,
            $leadIdInt,
            $customerIdInt,
            $dealIdInt,
            $search
        );

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));

        $this->success([
            'tasks' => $tasks,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => $limit > 0 ? (int) ceil($total / $limit) : 0,
            ],
        ]);
    }

    public function show(string $id): void
    {
        $taskModel = new Task();
        $task = $taskModel->findWithRelations((int) $id);

        if (!$task) {
            $this->error('Task not found.', 404);
            return;
        }

        $this->success(['task' => $task]);
    }

    public function store(): void
    {
        $request = new Request();
        $data = $request->body();

        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $dueDate = $data['due_date'] ?? null;
        $priority = $data['priority'] ?? 'Medium';
        $status = $data['status'] ?? 'Pending';
        $assignedTo = $data['assigned_to'] ?? null;
        $leadId = $data['lead_id'] ?? null;
        $customerId = $data['customer_id'] ?? null;
        $dealId = $data['deal_id'] ?? null;

        if ($title === '') {
            $this->error('Title is required.', 422);
            return;
        }

        if (!in_array($priority, $this->validPriorities, true)) {
            $this->error('Invalid priority.', 422);
            return;
        }

        if (!in_array($status, $this->validStatuses, true)) {
            $this->error('Invalid status.', 422);
            return;
        }

        $relationCount = 0;
        if ($leadId !== null && $leadId !== '') $relationCount++;
        if ($customerId !== null && $customerId !== '') $relationCount++;
        if ($dealId !== null && $dealId !== '') $relationCount++;

        if ($relationCount > 1) {
            $this->error('A task can only be linked to one of Lead, Customer, or Deal at a time.', 422);
            return;
        }

        $taskModel = new Task();
        $newData = [
            'title' => $title,
            'description' => $description !== '' ? $description : null,
            'due_date' => $dueDate !== null && $dueDate !== '' ? $dueDate : null,
            'priority' => $priority,
            'status' => $status,
            'assigned_to' => $assignedTo !== null && $assignedTo !== '' ? (int) $assignedTo : null,
            'lead_id' => $leadId !== null && $leadId !== '' ? (int) $leadId : null,
            'customer_id' => $customerId !== null && $customerId !== '' ? (int) $customerId : null,
            'deal_id' => $dealId !== null && $dealId !== '' ? (int) $dealId : null,
        ];
        $id = $taskModel->create($newData);

        (new AuditLog())->log('create', 'task', $id, $newData);

        $assignedToInt = $assignedTo !== null && $assignedTo !== '' ? (int) $assignedTo : null;
        if ($assignedToInt !== null) {
            Notifier::notify(
                $assignedToInt,
                'task_assigned',
                "You were assigned a new task: \"{$title}\".",
                'task',
                $id
            );
        }

        $this->success([
            'message' => 'Task created successfully.',
            'task_id' => $id,
        ], 201);
    }

    public function update(string $id): void
    {
        $taskModel = new Task();
        $existing = $taskModel->find((int) $id);

        if (!$existing) {
            $this->error('Task not found.', 404);
            return;
        }

        $request = new Request();
        $data = $request->body();

        $updateData = [];

        if (isset($data['title'])) {
            $title = trim($data['title']);
            if ($title === '') {
                $this->error('Title cannot be empty.', 422);
                return;
            }
            $updateData['title'] = $title;
        }

        if (isset($data['description'])) {
            $description = trim($data['description']);
            $updateData['description'] = $description !== '' ? $description : null;
        }

        if (array_key_exists('due_date', $data)) {
            $updateData['due_date'] = $data['due_date'] !== null && $data['due_date'] !== ''
                ? $data['due_date']
                : null;
        }

        if (isset($data['priority'])) {
            if (!in_array($data['priority'], $this->validPriorities, true)) {
                $this->error('Invalid priority.', 422);
                return;
            }
            $updateData['priority'] = $data['priority'];
        }

        if (isset($data['status'])) {
            if (!in_array($data['status'], $this->validStatuses, true)) {
                $this->error('Invalid status.', 422);
                return;
            }
            $updateData['status'] = $data['status'];
        }

        if (array_key_exists('assigned_to', $data)) {
            $updateData['assigned_to'] = $data['assigned_to'] !== null && $data['assigned_to'] !== ''
                ? (int) $data['assigned_to']
                : null;
        }

        if (array_key_exists('lead_id', $data)) {
            $updateData['lead_id'] = $data['lead_id'] !== null && $data['lead_id'] !== ''
                ? (int) $data['lead_id']
                : null;
        }

        if (array_key_exists('customer_id', $data)) {
            $updateData['customer_id'] = $data['customer_id'] !== null && $data['customer_id'] !== ''
                ? (int) $data['customer_id']
                : null;
        }

        if (array_key_exists('deal_id', $data)) {
            $updateData['deal_id'] = $data['deal_id'] !== null && $data['deal_id'] !== ''
                ? (int) $data['deal_id']
                : null;
        }

        $finalLeadId = array_key_exists('lead_id', $updateData) ? $updateData['lead_id'] : $existing['lead_id'];
        $finalCustomerId = array_key_exists('customer_id', $updateData) ? $updateData['customer_id'] : $existing['customer_id'];
        $finalDealId = array_key_exists('deal_id', $updateData) ? $updateData['deal_id'] : $existing['deal_id'];

        $relationCount = 0;
        if ($finalLeadId !== null) $relationCount++;
        if ($finalCustomerId !== null) $relationCount++;
        if ($finalDealId !== null) $relationCount++;

        if ($relationCount > 1) {
            $this->error('A task can only be linked to one of Lead, Customer, or Deal at a time.', 422);
            return;
        }

        if (empty($updateData)) {
            $this->error('No valid fields provided to update.', 422);
            return;
        }

        $changes = [];
        foreach ($updateData as $field => $newValue) {
            $oldValue = $existing[$field] ?? null;
            if ($oldValue != $newValue) {
                $changes[$field] = ['from' => $oldValue, 'to' => $newValue];
            }
        }

        $taskModel->update((int) $id, $updateData);

        if (!empty($changes)) {
            (new AuditLog())->log('update', 'task', (int) $id, $changes);
        }

        if (array_key_exists('assigned_to', $updateData)
            && $updateData['assigned_to'] !== null
            && $updateData['assigned_to'] !== $existing['assigned_to']
        ) {
            Notifier::notify(
                (int) $updateData['assigned_to'],
                'task_assigned',
                "You were assigned a task: \"{$existing['title']}\".",
                'task',
                (int) $id
            );
        }

        $this->success(['message' => 'Task updated successfully.']);
    }

    public function destroy(string $id): void
    {
        $taskModel = new Task();
        $existing = $taskModel->find((int) $id);

        if (!$existing) {
            $this->error('Task not found.', 404);
            return;
        }

        $taskModel->delete((int) $id);

        (new AuditLog())->log('delete', 'task', (int) $id, $existing);

        $this->success(['message' => 'Task deleted successfully.']);
    }
}