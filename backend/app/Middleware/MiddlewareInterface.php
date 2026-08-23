<?php

namespace App\Middleware;

interface MiddlewareInterface
{
    /**
     * Return true to let the request continue, false to stop it
     * (the middleware is responsible for sending its own error response
     * if it returns false).
     */
    public function handle(): bool;
}
