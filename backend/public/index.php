<?php
header('Access-Control-Allow-Origin: http://localhost:5177');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require __DIR__ . '/../vendor/autoload.php';

use App\Core\ErrorHandler;

ErrorHandler::register();

/** @var \App\Core\Router $router */
$router = require __DIR__ . '/../routes/api.php';

$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);