<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../../api/AuthService.php';
require_once __DIR__ . '/../../api/OrderService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Method Not Allowed. Acceptable methods: GET.',
        'errors' => ['Only GET requests are permitted on this endpoint.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $user = AuthService::requireAuth();

    $identifier = isset($_GET['id']) ? trim((string)$_GET['id']) : (isset($_GET['ref']) ? trim((string)$_GET['ref']) : '');

    if ($identifier === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Order identifier (id or ref) is required.',
            'errors' => ['Missing id or ref parameter.'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    $isAdmin = ($user['role'] === 'admin');
    $order = OrderService::getOrderByIdOrRef($identifier, $user['id'], $isAdmin);

    if ($order === null) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Order not found.',
            'errors' => ["No order matches '{$identifier}'."],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $order,
        'message' => 'Order details retrieved successfully.',
        'errors' => [],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (\RuntimeException $e) {
    $code = $e->getCode();
    $statusCode = ($code >= 400 && $code < 600) ? $code : 400;
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => $e->getMessage(),
        'errors' => [$e->getMessage()],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'An error occurred while retrieving order details.',
        'errors' => ['Internal server error.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
