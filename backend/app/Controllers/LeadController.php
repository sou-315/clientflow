<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Notifier;
use App\Models\Lead;
use App\Models\AuditLog;

class LeadController extends Controller
{
    private array $validStatuses = [
        'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'
    ];

    public function index(): void
    {
        $request = new Request();
        $status = $request->query('status');
        $search = $request->query('search');
        $sort = $request->query('sort');
        $from = $request->query('from');
        $to = $request->query('to');
        $page = (int) ($request->query('page') ?? 1);
        $limit = (int) ($request->query('limit') ?? 10);

        $leadModel = new Lead();
        $leads = $leadModel->search($status, $search, $sort, $from, $to, $page, $limit);
        $total = $leadModel->count($status, $search, $from, $to);

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));

        $this->success([
            'leads' => $leads,
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
        $leadModel = new Lead();
        $lead = $leadModel->find((int) $id);

        if (!$lead) {
            $this->error('Lead not found.', 404);
            return;
        }

        $this->success(['lead' => $lead]);
    }

    public function store(): void
    {
        $request = new Request();
        $data = $request->body();

        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $status = $data['status'] ?? 'New';
        $assignedTo = $data['assigned_to'] ?? null;

        if ($name === '') {
            $this->error('Name is required.', 422);
            return;
        }

        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email format.', 422);
            return;
        }

        if (!in_array($status, $this->validStatuses, true)) {
            $this->error('Invalid status value.', 422);
            return;
        }

        $leadModel = new Lead();
        $newData = [
            'name' => $name,
            'email' => $email !== '' ? $email : null,
            'phone' => $phone !== '' ? $phone : null,
            'status' => $status,
            'assigned_to' => $assignedTo !== null ? (int) $assignedTo : null,
        ];
        $id = $leadModel->create($newData);

        (new AuditLog())->log('create', 'lead', $id, $newData);

        $assignedToInt = $assignedTo !== null ? (int) $assignedTo : null;
        if ($assignedToInt !== null) {
            Notifier::notify(
                $assignedToInt,
                'lead_assigned',
                "You were assigned a new lead: \"{$name}\".",
                'lead',
                $id
            );
        }

        $this->success([
            'message' => 'Lead created successfully.',
            'lead_id' => $id,
        ], 201);
    }

    public function update(string $id): void
    {
        $leadModel = new Lead();
        $existing = $leadModel->find((int) $id);

        if (!$existing) {
            $this->error('Lead not found.', 404);
            return;
        }

        $request = new Request();
        $data = $request->body();

        $updateData = [];

        if (isset($data['name'])) {
            $name = trim($data['name']);
            if ($name === '') {
                $this->error('Name cannot be empty.', 422);
                return;
            }
            $updateData['name'] = $name;
        }

        if (isset($data['email'])) {
            $email = trim($data['email']);
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->error('Invalid email format.', 422);
                return;
            }
            $updateData['email'] = $email !== '' ? $email : null;
        }

        if (isset($data['phone'])) {
            $phone = trim($data['phone']);
            $updateData['phone'] = $phone !== '' ? $phone : null;
        }

        if (isset($data['status'])) {
            if (!in_array($data['status'], $this->validStatuses, true)) {
                $this->error('Invalid status value.', 422);
                return;
            }
            $updateData['status'] = $data['status'];
        }

        if (array_key_exists('assigned_to', $data)) {
            $updateData['assigned_to'] = $data['assigned_to'] !== null
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

        $leadModel->update((int) $id, $updateData);

        if (!empty($changes)) {
            (new AuditLog())->log('update', 'lead', (int) $id, $changes);
        }

        if (array_key_exists('assigned_to', $updateData)
            && $updateData['assigned_to'] !== null
            && $updateData['assigned_to'] !== $existing['assigned_to']
        ) {
            Notifier::notify(
                (int) $updateData['assigned_to'],
                'lead_assigned',
                "You were assigned a lead: \"{$existing['name']}\".",
                'lead',
                (int) $id
            );
        }

        $this->success(['message' => 'Lead updated successfully.']);
    }

    public function destroy(string $id): void
    {
        $leadModel = new Lead();
        $existing = $leadModel->find((int) $id);

        if (!$existing) {
            $this->error('Lead not found.', 404);
            return;
        }

        $leadModel->delete((int) $id);

        (new AuditLog())->log('delete', 'lead', (int) $id, $existing);

        $this->success(['message' => 'Lead deleted successfully.']);
    }
}