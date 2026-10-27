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
    // Parse JSON body or POST form data
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);
    if (!is_array($body)) {
        $body = $_POST;
    }

    // CSRF verification
    $submittedToken = AuthService::extractCsrfToken($body);
    if (!AuthService::validateCsrfToken($submittedToken)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Invalid or missing CSRF token. Please refresh the page and try again.',
            'errors' => ['CSRF validation failed.'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    $name = isset($body['name']) ? trim((string)$body['name']) : '';
    $email = isset($body['email']) ? trim((string)$body['email']) : '';
    $password = isset($body['password']) ? (string)$body['password'] : '';
    $confirmPassword = isset($body['confirm_password']) ? (string)$body['confirm_password'] : '';

    if (empty($name) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'All fields (Name, Email, Password) are required.',
            'errors' => ['Missing required registration fields.'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    if ($confirmPassword !== '' && $password !== $confirmPassword) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Password confirmation does not match.',
            'errors' => ['The entered passwords do not match.'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    $user = AuthService::registerCustomer($name, $email, $password);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'data' => $user,
        'message' => 'Account registered successfully. Welcome to Brew & Bloom!',
        'errors' => [],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (InvalidArgumentException $e) {
    http_response_code(400);
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
        'message' => 'An unexpected server error occurred during registration.',
        'errors' => ['Please try again later.'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
