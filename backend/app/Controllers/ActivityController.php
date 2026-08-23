<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Auth;
use App\Models\Activity;
use App\Models\AuditLog;

class ActivityController extends Controller
{
    private array $validTypes = ['Call', 'Meeting', 'Email', 'Note', 'Follow-up'];

    public function index(): void
    {
        $request = new Request();
        $type = $request->query('type');
        $leadId = $request->query('lead_id');
        $customerId = $request->query('customer_id');
        $dealId = $request->query('deal_id');
        $search = $request->query('search');
        $sort = $request->query('sort');
        $page = (int) ($request->query('page') ?? 1);
        $limit = (int) ($request->query('limit') ?? 10);

        $leadIdInt = $leadId !== null && $leadId !== '' ? (int) $leadId : null;
        $customerIdInt = $customerId !== null && $customerId !== '' ? (int) $customerId : null;
        $dealIdInt = $dealId !== null && $dealId !== '' ? (int) $dealId : null;

        $activityModel = new Activity();
        $activities = $activityModel->search(
            $type,
            $leadIdInt,
            $customerIdInt,
            $dealIdInt,
            $search,
            $sort,
            $page,
            $limit
        );
        $total = $activityModel->count($type, $leadIdInt, $customerIdInt, $dealIdInt, $search);

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));

        $this->success([
            'activities' => $activities,
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
        $activityModel = new Activity();
        $activity = $activityModel->findWithRelations((int) $id);

        if (!$activity) {
            $this->error('Activity not found.', 404);
            return;
        }

        $this->success(['activity' => $activity]);
    }

    public function store(): void
    {
        $request = new Request();
        $data = $request->body();

        $type = trim($data['type'] ?? '');
        $notes = trim($data['notes'] ?? '');
        $leadId = $data['lead_id'] ?? null;
        $customerId = $data['customer_id'] ?? null;
        $dealId = $data['deal_id'] ?? null;

        if (!in_array($type, $this->validTypes, true)) {
            $this->error('Invalid activity type.', 422);
            return;
        }

        $activityModel = new Activity();
        $newData = [
            'type' => $type,
            'notes' => $notes !== '' ? $notes : null,
            'lead_id' => $leadId !== null && $leadId !== '' ? (int) $leadId : null,
            'customer_id' => $customerId !== null && $customerId !== '' ? (int) $customerId : null,
            'deal_id' => $dealId !== null && $dealId !== '' ? (int) $dealId : null,
            'user_id' => Auth::id(),
        ];
        $id = $activityModel->create($newData);

        (new AuditLog())->log('create', 'activity', $id, $newData);

        $this->success([
            'message' => 'Activity created successfully.',
            'activity_id' => $id,
        ], 201);
    }

    public function update(string $id): void
    {
        $activityModel = new Activity();
        $existing = $activityModel->find((int) $id);

        if (!$existing) {
            $this->error('Activity not found.', 404);
            return;
        }

        $request = new Request();
        $data = $request->body();

        $updateData = [];

        if (isset($data['type'])) {
            if (!in_array($data['type'], $this->validTypes, true)) {
                $this->error('Invalid activity type.', 422);
                return;
            }
            $updateData['type'] = $data['type'];
        }

        if (isset($data['notes'])) {
            $notes = trim($data['notes']);
            $updateData['notes'] = $notes !== '' ? $notes : null;
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

        $activityModel->update((int) $id, $updateData);

        if (!empty($changes)) {
            (new AuditLog())->log('update', 'activity', (int) $id, $changes);
        }

        $this->success(['message' => 'Activity updated successfully.']);
    }

    public function destroy(string $id): void
    {
        $activityModel = new Activity();
        $existing = $activityModel->find((int) $id);

        if (!$existing) {
            $this->error('Activity not found.', 404);
            return;
        }

        $activityModel->delete((int) $id);

        (new AuditLog())->log('delete', 'activity', (int) $id, $existing);

        $this->success(['message' => 'Activity deleted successfully.']);
    }
}