<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\User;

class AuthController extends Controller
{
    public function register(): void
    {
        $data = $this->getRequestBody();

        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        // Validation
        if ($name === '' || $email === '' || $password === '') {
            $this->error('Name, email, and password are required.', 422);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email format.', 422);
            return;
        }

        if (strlen($password) < 6) {
            $this->error('Password must be at least 6 characters.', 422);
            return;
        }

        $userModel = new User();

        // Check for duplicate email
        if ($userModel->findByEmail($email)) {
            $this->error('An account with this email already exists.', 409);
            return;
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $userId = $userModel->create([
            'name' => $name,
            'email' => $email,
            'password_hash' => $passwordHash,
            'role' => 'Employee', // default role for new signups
        ]);

        $this->success([
            'message' => 'User registered successfully.',
            'user_id' => $userId,
        ], 201);
    }

       public function login(): void
    {
        $data = $this->getRequestBody();

        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if ($email === '' || $password === '') {
            $this->error('Email and password are required.', 422);
            return;
        }

        $userModel = new User();
        $user = $userModel->findByEmail($email);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            $this->error('Invalid email or password.', 401);
            return;
        }

        // Temporary response until Task 6 adds a real JWT token
               $token = \App\Core\JwtHelper::generate([
            'user_id' => $user['id'],
            'role' => $user['role'],
        ]);

        $this->success([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
            ],
        ]);
    }
}