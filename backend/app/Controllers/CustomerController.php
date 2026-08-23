<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Models\Customer;
use App\Models\AuditLog;

class CustomerController extends Controller
{
    public function index(): void
    {
        $request = new Request();
        $search = $request->query('search');
        $sort = $request->query('sort');
        $page = (int) ($request->query('page') ?? 1);
        $limit = (int) ($request->query('limit') ?? 10);

        $customerModel = new Customer();
        $customers = $customerModel->search($search, $sort, $page, $limit);
        $total = $customerModel->count($search);

        $page = max(1, $page);
        $limit = max(1, min(100, $limit));

        $this->success([
            'customers' => $customers,
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
        $customerModel = new Customer();
        $customer = $customerModel->findWithCompany((int) $id);

        if (!$customer) {
            $this->error('Customer not found.', 404);
            return;
        }

        $this->success(['customer' => $customer]);
    }

    public function store(): void
    {
        $request = new Request();
        $data = $request->body();

        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $notes = trim($data['notes'] ?? '');
        $companyId = $data['company_id'] ?? null;

        if ($name === '') {
            $this->error('Name is required.', 422);
            return;
        }

        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email format.', 422);
            return;
        }

        $customerModel = new Customer();
        $newData = [
            'name' => $name,
            'email' => $email !== '' ? $email : null,
            'phone' => $phone !== '' ? $phone : null,
            'company_id' => $companyId !== null ? (int) $companyId : null,
            'notes' => $notes !== '' ? $notes : null,
        ];
        $id = $customerModel->create($newData);

        (new AuditLog())->log('create', 'customer', $id, $newData);

        $this->success([
            'message' => 'Customer created successfully.',
            'customer_id' => $id,
        ], 201);
    }

    public function update(string $id): void
    {
        $customerModel = new Customer();
        $existing = $customerModel->find((int) $id);

        if (!$existing) {
            $this->error('Customer not found.', 404);
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

        if (isset($data['notes'])) {
            $notes = trim($data['notes']);
            $updateData['notes'] = $notes !== '' ? $notes : null;
        }

        if (array_key_exists('company_id', $data)) {
            $updateData['company_id'] = $data['company_id'] !== null
                ? (int) $data['company_id']
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

        $customerModel->update((int) $id, $updateData);

        if (!empty($changes)) {
            (new AuditLog())->log('update', 'customer', (int) $id, $changes);
        }

        $this->success(['message' => 'Customer updated successfully.']);
    }

    public function destroy(string $id): void
    {
        $customerModel = new Customer();
        $existing = $customerModel->find((int) $id);

        if (!$existing) {
            $this->error('Customer not found.', 404);
            return;
        }

        $customerModel->delete((int) $id);

        (new AuditLog())->log('delete', 'customer', (int) $id, $existing);

        $this->success(['message' => 'Customer deleted successfully.']);
    }
}