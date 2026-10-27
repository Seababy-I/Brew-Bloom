<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../../api/AuthService.php';
require_once __DIR__ . '/../../api/OrderService.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!in_array($method, ['GET', 'POST'], true)) {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Method Not Allowed. Acceptable methods: GET, POST.',
        'errors' => ["Method {$method} is not permitted on this endpoint."],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    // 1. Enforce authentication for all orders operations
    $user = AuthService::requireAuth();

    // 2. GET: List customer's orders
    if ($method === 'GET') {
        $orders = OrderService::getCustomerOrders($user['id']);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $orders,
            'message' => 'Customer orders retrieved successfully.',
            'errors' => [],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    // 3. POST: Quote or Order Placement
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);

    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Invalid JSON payload received.',
            'errors' => ['Payload must be a valid JSON object.'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    // Check if this is an authoritative price quote request
    $isQuote = (isset($_GET['action']) && $_GET['action'] === 'quote')
        || (isset($body['action']) && $body['action'] === 'quote');

    if ($isQuote) {
        $items = isset($body['items']) && is_array($body['items']) ? $body['items'] : [];
        $recalculated = OrderService::validateAndRecalculateItems($items);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $recalculated,
            'message' => 'Cart pricing quoted authoritatively.',
            'errors' => [],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    // Full order placement requires CSRF token validation
    $csrfToken = AuthService::extractCsrfToken($body);
    if (!AuthService::validateCsrfToken($csrfToken)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'CSRF verification failed. Please refresh your browser and try again.',
            'errors' => ['Invalid or missing CSRF token.'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    $idempotencyKey = (string)($body['idempotency_key'] ?? $body['idempotencyKey'] ?? '');
    $items = isset($body['items']) && is_array($body['items']) ? $body['items'] : [];
    $pickupInfo = isset($body['pickup_info']) && is_array($body['pickup_info'])
        ? $body['pickup_info']
        : (isset($body['pickupInfo']) && is_array($body['pickupInfo']) ? $body['pickupInfo'] : []);
    $expectedTotal = isset($body['expected_total']) ? (int)$body['expected_total'] : null;

    $order = OrderService::createOrder(
        $user['id'],
        $items,
        $pickupInfo,
        $idempotencyKey,
        $expectedTotal
    );

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'data' => $order,
        'message' => 'Order placed successfully! Pay at the café when picking up.',
        'errors' => [],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (\InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => $e->getMessage(),
        'errors' => [$e->getMessage()],
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
        'message' => 'An unexpected server error occurred while processing your order.',
        'errors' => ['Internal server error.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
