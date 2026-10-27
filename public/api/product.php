<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../../api/ProductService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Method Not Allowed. This endpoint accepts GET requests only.',
        'errors' => ['HTTP method ' . htmlspecialchars($_SERVER['REQUEST_METHOD']) . ' is not permitted.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : null;
    $slug = isset($_GET['slug']) ? trim((string)$_GET['slug']) : null;

    if (($id === null || $id === '') && ($slug === null || $slug === '')) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Product identifier (id or slug) is required.',
            'errors' => ['Missing id or slug parameter.'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    if ($id !== null && $id !== '') {
        if (!preg_match('/^[a-f\d]{24}$/i', $id)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Invalid product ID format. Expected a 24-character hexadecimal ObjectId.',
                'errors' => ["'{$id}' is not a valid 24-character hexadecimal MongoDB ObjectId."],
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            exit;
        }
        $product = ProductService::getProductByIdOrSlug($id);
    } else {
        $product = ProductService::getProductByIdOrSlug((string)$slug);
    }

    if ($product === null) {
        $lookupKey = $id ?? (string)$slug;
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Product not found or currently unavailable.',
            'errors' => ["No available product matches '{$lookupKey}'."],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $product,
        'message' => 'Product details retrieved successfully.',
        'errors' => [],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'An error occurred while retrieving product details.',
        'errors' => ['Internal server error.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
