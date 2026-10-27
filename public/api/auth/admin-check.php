<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../../../api/AuthService.php';

try {
    // Requires admin role; throws RuntimeException with code 401 or 403 if check fails
    $adminUser = AuthService::requireRole('admin');

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'admin' => $adminUser,
            'protected_resource' => 'Brew & Bloom Admin Management Clearance Verified.',
            'server_time' => date(DATE_ATOM),
        ],
        'message' => 'Admin authorization verified successfully.',
        'errors' => [],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (RuntimeException $e) {
    $code = $e->getCode();
    if ($code !== 401 && $code !== 403) {
        $code = 403;
    }
    http_response_code($code);
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
        'message' => 'Server error verifying authorization.',
        'errors' => ['An unexpected error occurred.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
