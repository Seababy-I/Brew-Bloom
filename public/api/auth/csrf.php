<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../../../api/AuthService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Method Not Allowed. Use GET.',
        'errors' => ['Only GET is supported.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $token = AuthService::getCsrfToken();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'csrf_token' => $token,
        ],
        'message' => 'CSRF token retrieved successfully.',
        'errors' => [],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Failed to initialize CSRF token.',
        'errors' => ['Server error occurred.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
