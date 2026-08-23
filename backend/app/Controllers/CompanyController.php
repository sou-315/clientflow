<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Models\Company;
use App\Models\AuditLog;

class CompanyController extends Controller
{
    public function index(): void
    {
        $request = new Request();
        $search = $request->query('search');
        $sort = $request->query('sort');
        $industry = $request->query('industry');
        $page = (int) ($request->query('page') ?? 1);
        $limit = (int) ($request->query('limit') ?? 10);

        $companyModel = new Company();
        $companies = $companyModel->search($search, $sort, $industry, $page, $limit);
        $total = $companyModel->count($search, $industry);

        $page = max(1, $page);
        $limit = max(1, min(1000, $limit));

        $this->success([
            'companies' => $companies,
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
        $companyModel = new Company();
        $company = $companyModel->find((int) $id);

        if (!$company) {
            $this->error('Company not found.', 404);
            return;
        }

        $customers = $companyModel->customers((int) $id);

        $this->success([
            'company' => $company,
            'customers' => $customers,
        ]);
    }

    public function store(): void
    {
        $request = new Request();
        $data = $request->body();

        $name = trim($data['name'] ?? '');
        $industry = trim($data['industry'] ?? '');

        if ($name === '') {
            $this->error('Name is required.', 422);
            return;
        }

        $companyModel = new Company();
        $newData = [
            'name' => $name,
            'industry' => $industry !== '' ? $industry : null,
        ];
        $id = $companyModel->create($newData);

        (new AuditLog())->log('create', 'company', $id, $newData);

        $this->success([
            'message' => 'Company created successfully.',
            'company_id' => $id,
        ], 201);
    }

    public function update(string $id): void
    {
        $companyModel = new Company();
        $existing = $companyModel->find((int) $id);

        if (!$existing) {
            $this->error('Company not found.', 404);
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

        if (isset($data['industry'])) {
            $industry = trim($data['industry']);
            $updateData['industry'] = $industry !== '' ? $industry : null;
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

        $companyModel->update((int) $id, $updateData);

        if (!empty($changes)) {
            (new AuditLog())->log('update', 'company', (int) $id, $changes);
        }

        $this->success(['message' => 'Company updated successfully.']);
    }

    public function destroy(string $id): void
    {
        $companyModel = new Company();
        $existing = $companyModel->find((int) $id);

        if (!$existing) {
            $this->error('Company not found.', 404);
            return;
        }

        $companyModel->delete((int) $id);

        (new AuditLog())->log('delete', 'company', (int) $id, $existing);

        $this->success(['message' => 'Company deleted successfully.']);
    }
}