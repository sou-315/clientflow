<?php

namespace App\Core;

class Router
{
    private array $routes = [];

    public function get(string $path, string $action, array $middleware = []): void
    {
        $this->addRoute('GET', $path, $action, $middleware);
    }

    public function post(string $path, string $action, array $middleware = []): void
    {
        $this->addRoute('POST', $path, $action, $middleware);
    }

    public function put(string $path, string $action, array $middleware = []): void
    {
        $this->addRoute('PUT', $path, $action, $middleware);
    }

    public function delete(string $path, string $action, array $middleware = []): void
    {
        $this->addRoute('DELETE', $path, $action, $middleware);
    }

    private function addRoute(string $method, string $path, string $action, array $middleware = []): void
    {
        $pattern = preg_replace('#\{[a-zA-Z_]+\}#', '([^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';

        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'action' => $action,
            'middleware' => $middleware,
        ];
    }

    public function dispatch(string $requestMethod, string $requestUri): void
    {
        $path = parse_url($requestUri, PHP_URL_PATH);

        foreach ($this->routes as $route) {
            if ($route['method'] !== $requestMethod) {
                continue;
            }

            if (preg_match($route['pattern'], $path, $matches)) {
                array_shift($matches);

                                // Run middleware before the controller action
                foreach ($route['middleware'] as $middlewareEntry) {
                    // Support "RoleMiddleware:Admin,Manager" syntax
                    [$middlewareClass, $params] = array_pad(explode(':', $middlewareEntry, 2), 2, null);
                    $fullClass = "App\\Middleware\\{$middlewareClass}";

                    $middlewareInstance = $params !== null
                        ? new $fullClass(explode(',', $params))
                        : new $fullClass();

                    if (!$middlewareInstance->handle()) {
                        return; // middleware already sent its own error response
                    }
                }

                [$controllerName, $methodName] = explode('@', $route['action']);
                $controllerClass = "App\\Controllers\\{$controllerName}";

                if (!class_exists($controllerClass)) {
                    $this->notFound();
                    return;
                }

                $controller = new $controllerClass();

                if (!method_exists($controller, $methodName)) {
                    $this->notFound();
                    return;
                }

                call_user_func_array([$controller, $methodName], $matches);
                return;
            }
        }

        $this->notFound();
    }

    private function notFound(): void
    {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Route not found']);
    }
}