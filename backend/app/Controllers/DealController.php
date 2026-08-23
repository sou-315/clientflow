<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Notifier;
use App\Models\Deal;
use App\Models\AuditLog;

class DealController extends Controller
{
    private array $validStatuses = ['Open', 'Won', 'Lost'];

    public function index(): void
    {
        $request = new Request();
        $status = $request->query('status');
        $search = $request->query('search');
        $sort = $request->query('sort');
        $page = (int) ($request->query('page') ?? 1);
        $limit = (int) ($request->query('limit') ?? 10);

        $dealModel = new Deal();
        $deals = $dealModel->search($status, $search, $sort, $page, $limit);
        $total = $dealModel->count($status, $search);

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));

        $this->success([
            'deals' => $deals,
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
        $dealModel = new Deal();
        $deal = $dealModel->findWithCustomer((int) $id);

        if (!$deal) {
            $this->error('Deal not found.', 404);
            return;
        }

        $this->success(['deal' => $deal]);
    }

    public function store(): void
    {
        $request = new Request();
        $data = $request->body();

        $title = trim($data['title'] ?? '');
        $value = $data['value'] ?? 0;
        $status = $data['status'] ?? 'Open';
        $expectedCloseDate = $data['expected_close_date'] ?? null;
        $customerId = $data['customer_id'] ?? null;
        $assignedTo = $data['assigned_to'] ?? null;

        if ($title === '') {
            $this->error('Title is required.', 422);
            return;
        }

        if ($customerId === null || $customerId === '') {
            $this->error('A customer must be selected for this deal.', 422);
            return;
        }

        $customerModel = new \App\Models\Customer();
        if (!$customerModel->find((int) $customerId)) {
            $this->error('Selected customer does not exist.', 422);
            return;
        }

        if (!in_array($status, $this->validStatuses, true)) {
            $this->error('Invalid status value.', 422);
            return;
        }

        if (!is_numeric($value) || $value < 0) {
            $this->error('Value must be a positive number.', 422);
            return;
        }

        $dealModel = new Deal();
        $newData = [
            'title' => $title,
            'value' => $value,
            'status' => $status,
            'expected_close_date' => $expectedCloseDate !== '' ? $expectedCloseDate : null,
            'customer_id' => (int) $customerId,
            'assigned_to' => $assignedTo !== null && $assignedTo !== '' ? (int) $assignedTo : null,
        ];
        $id = $dealModel->create($newData);

        (new AuditLog())->log('create', 'deal', $id, $newData);

        $assignedToInt = $assignedTo !== null && $assignedTo !== '' ? (int) $assignedTo : null;
        if ($assignedToInt !== null) {
            Notifier::notify(
                $assignedToInt,
                'deal_assigned',
                "You were assigned a new deal: \"{$title}\".",
                'deal',
                $id
            );
        }

        $this->success([
            'message' => 'Deal created successfully.',
            'deal_id' => $id,
        ], 201);
    }

    public function update(string $id): void
    {
        $dealModel = new Deal();
        $existing = $dealModel->find((int) $id);

        if (!$existing) {
            $this->error('Deal not found.', 404);
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

        if (isset($data['value'])) {
            if (!is_numeric($data['value']) || $data['value'] < 0) {
                $this->error('Value must be a positive number.', 422);
                return;
            }
            $updateData['value'] = $data['value'];
        }

        if (isset($data['status'])) {
            if (!in_array($data['status'], $this->validStatuses, true)) {
                $this->error('Invalid status value.', 422);
                return;
            }
            $updateData['status'] = $data['status'];
        }

        if (array_key_exists('expected_close_date', $data)) {
            $updateData['expected_close_date'] = $data['expected_close_date'] !== ''
                ? $data['expected_close_date']
                : null;
        }

        if (isset($data['customer_id'])) {
            if ($data['customer_id'] === null || $data['customer_id'] === '') {
                $this->error('A customer must be selected for this deal.', 422);
                return;
            }
            $updateData['customer_id'] = (int) $data['customer_id'];
        }

        if (array_key_exists('assigned_to', $data)) {
            $updateData['assigned_to'] = $data['assigned_to'] !== null && $data['assigned_to'] !== ''
                ? (int) $data['assigned_to']
                : null;
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

        $dealModel->update((int) $id, $updateData);

        if (!empty($changes)) {
            (new AuditLog())->log('update', 'deal', (int) $id, $changes);
        }

        if (isset($updateData['status'])
            && $updateData['status'] !== $existing['status']
            && in_array($updateData['status'], ['Won', 'Lost'], true)
        ) {
            $finalAssignedTo = array_key_exists('assigned_to', $updateData)
                ? $updateData['assigned_to']
                : $existing['assigned_to'];

            if ($finalAssignedTo !== null) {
                $notifType = $updateData['status'] === 'Won' ? 'deal_won' : 'deal_lost';
                Notifier::notify(
                    (int) $finalAssignedTo,
                    $notifType,
                    "Deal \"{$existing['title']}\" was marked as {$updateData['status']}.",
                    'deal',
                    (int) $id
                );
            }
        }

        $this->success(['message' => 'Deal updated successfully.']);
    }

    public function destroy(string $id): void
    {
        $dealModel = new Deal();
        $existing = $dealModel->find((int) $id);

        if (!$existing) {
            $this->error('Deal not found.', 404);
            return;
        }

        $dealModel->delete((int) $id);

        (new AuditLog())->log('delete', 'deal', (int) $id, $existing);

        $this->success(['message' => 'Deal deleted successfully.']);
    }
}