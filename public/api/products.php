<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../../api/ProductService.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'data' => [],
        'message' => 'Method Not Allowed. This endpoint accepts GET requests only.',
        'errors' => ['HTTP method ' . htmlspecialchars($_SERVER['REQUEST_METHOD']) . ' is not permitted.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $category = isset($_GET['category']) ? trim((string)$_GET['category']) : null;
    $search = isset($_GET['q']) ? trim((string)$_GET['q']) : (isset($_GET['search']) ? trim((string)$_GET['search']) : null);

    $products = ProductService::getProducts($category, $search);

    $message = count($products) > 0
        ? 'Products retrieved successfully.'
        : 'No products found matching your criteria.';

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $products,
        'message' => $message,
        'errors' => [],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'data' => [],
        'message' => 'Invalid query parameters provided.',
        'errors' => [$e->getMessage()],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => [],
        'message' => 'An error occurred while fetching products from the database.',
        'errors' => ['The server encountered an unexpected error. Please try again later.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
