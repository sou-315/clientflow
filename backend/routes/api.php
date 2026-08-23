<?php

use App\Core\Router;

$router = new Router();

$router->get('/api/ping', 'TestController@ping', ['AuthMiddleware']);
$router->get('/api/users', 'UserController@index', ['AuthMiddleware']);

$router->post('/api/register', 'AuthController@register');
$router->post('/api/login', 'AuthController@login');

$router->get('/api/leads', 'LeadController@index', ['AuthMiddleware']);
$router->get('/api/leads/{id}', 'LeadController@show', ['AuthMiddleware']);
$router->post('/api/leads', 'LeadController@store', ['AuthMiddleware']);
$router->put('/api/leads/{id}', 'LeadController@update', ['AuthMiddleware']);
$router->delete('/api/leads/{id}', 'LeadController@destroy', ['AuthMiddleware']);

$router->get('/api/customers', 'CustomerController@index', ['AuthMiddleware']);
$router->get('/api/customers/{id}', 'CustomerController@show', ['AuthMiddleware']);
$router->post('/api/customers', 'CustomerController@store', ['AuthMiddleware']);
$router->put('/api/customers/{id}', 'CustomerController@update', ['AuthMiddleware']);
$router->delete('/api/customers/{id}', 'CustomerController@destroy', ['AuthMiddleware']);

$router->get('/api/companies', 'CompanyController@index', ['AuthMiddleware']);
$router->get('/api/companies/{id}', 'CompanyController@show', ['AuthMiddleware']);
$router->post('/api/companies', 'CompanyController@store', ['AuthMiddleware']);
$router->put('/api/companies/{id}', 'CompanyController@update', ['AuthMiddleware']);
$router->delete('/api/companies/{id}', 'CompanyController@destroy', ['AuthMiddleware']);

$router->get('/api/deals', 'DealController@index', ['AuthMiddleware']);
$router->get('/api/deals/{id}', 'DealController@show', ['AuthMiddleware']);
$router->post('/api/deals', 'DealController@store', ['AuthMiddleware']);
$router->put('/api/deals/{id}', 'DealController@update', ['AuthMiddleware']);
$router->delete('/api/deals/{id}', 'DealController@destroy', ['AuthMiddleware']);

$router->get('/api/activities', 'ActivityController@index', ['AuthMiddleware']);
$router->get('/api/activities/{id}', 'ActivityController@show', ['AuthMiddleware']);
$router->post('/api/activities', 'ActivityController@store', ['AuthMiddleware']);
$router->put('/api/activities/{id}', 'ActivityController@update', ['AuthMiddleware']);
$router->delete('/api/activities/{id}', 'ActivityController@destroy', ['AuthMiddleware']);

$router->get('/api/tasks', 'TaskController@index', ['AuthMiddleware']);
$router->get('/api/tasks/{id}', 'TaskController@show', ['AuthMiddleware']);
$router->post('/api/tasks', 'TaskController@store', ['AuthMiddleware']);
$router->put('/api/tasks/{id}', 'TaskController@update', ['AuthMiddleware']);
$router->delete('/api/tasks/{id}', 'TaskController@destroy', ['AuthMiddleware']);

$router->get('/api/notifications', 'NotificationController@index', ['AuthMiddleware']);
$router->get('/api/notifications/unread-count', 'NotificationController@unreadCount', ['AuthMiddleware']);
$router->put('/api/notifications/{id}/read', 'NotificationController@markRead', ['AuthMiddleware']);
$router->put('/api/notifications/mark-all-read', 'NotificationController@markAllRead', ['AuthMiddleware']);

$router->get('/api/audit-logs', 'AuditLogController@index', ['AuthMiddleware']);

return $router;