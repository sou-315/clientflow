<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\User;

class UserController extends Controller
{
    public function index(): void
    {
        $userModel = new User();
        $users = $userModel->all();

        // Never expose password hashes or other sensitive fields to the frontend.
        $safeUsers = array_map(function ($user) {
            return [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'] ?? null,
            ];
        }, $users);

        $this->success(['users' => $safeUsers]);
    }
}