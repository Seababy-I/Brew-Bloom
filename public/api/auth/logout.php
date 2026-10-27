<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../../../api/AuthService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Method Not Allowed. Use POST.',
        'errors' => ['Only POST is permitted.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);
    if (!is_array($body)) {
        $body = $_POST;
    }

    $submittedToken = AuthService::extractCsrfToken($body);
    if (!AuthService::validateCsrfToken($submittedToken)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Invalid or missing CSRF token.',
            'errors' => ['CSRF validation failed.'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    AuthService::logout();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => null,
        'message' => 'Signed out successfully.',
        'errors' => [],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'An error occurred during logout.',
        'errors' => ['Please try again.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
