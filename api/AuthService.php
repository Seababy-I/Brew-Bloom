<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

class AuthService
{
    /**
     * Initializes a hardened PHP session if not already active.
     */
    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

            session_set_cookie_params([
                'lifetime' => 0, // Session cookie persists until browser closes
                'path' => '/',
                'domain' => '',
                'secure' => $isHttps,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);

            ini_set('session.use_strict_mode', '1');
            session_start();
        }

        // Initialize CSRF token in session if not present
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
    }

    /**
     * Returns the active CSRF token for the current session.
     */
    public static function getCsrfToken(): string
    {
        self::startSession();
        return (string)$_SESSION['csrf_token'];
    }

    /**
     * Validates an incoming CSRF token against the session token.
     */
    public static function validateCsrfToken(?string $token): bool
    {
        self::startSession();
        if (empty($token) || empty($_SESSION['csrf_token'])) {
            return false;
        }
        return hash_equals($_SESSION['csrf_token'], $token);
    }

    /**
     * Extracts CSRF token from headers (X-CSRF-Token) or parsed request body.
     *
     * @param array<string, mixed> $bodyData
     */
    public static function extractCsrfToken(array $bodyData = []): ?string
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        foreach ($headers as $key => $val) {
            if (strtolower($key) === 'x-csrf-token') {
                return (string)$val;
            }
        }

        if (isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
            return (string)$_SERVER['HTTP_X_CSRF_TOKEN'];
        }

        if (isset($bodyData['csrf_token'])) {
            return (string)$bodyData['csrf_token'];
        }

        return null;
    }

    /**
     * Registers a new customer in MongoDB.
     * Always forces role='customer'.
     *
     * @return array<string, mixed> Safe user data
     * @throws InvalidArgumentException on validation or duplicate email failure
     */
    public static function registerCustomer(string $name, string $email, string $password): array
    {
        self::startSession();

        $cleanName = trim($name);
        $cleanEmail = strtolower(trim($email));

        // 1. Validation
        if (mb_strlen($cleanName) < 2 || mb_strlen($cleanName) > 80) {
            throw new InvalidArgumentException('Full name must be between 2 and 80 characters.');
        }

        if (!filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Please provide a valid email address.');
        }

        if (strlen($password) < 8) {
            throw new InvalidArgumentException('Password must be at least 8 characters long.');
        }

        if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
            throw new InvalidArgumentException('Password must contain at least one letter and one number.');
        }

        $db = getDatabase();
        $users = $db->selectCollection('users');

        // 2. Check for duplicate email
        $existing = $users->findOne(['email' => $cleanEmail]);
        if ($existing !== null) {
            throw new InvalidArgumentException('An account with this email address already exists.');
        }

        // 3. Hash password and insert with strictly 'customer' role
        $now = new UTCDateTime();
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $insertResult = $users->insertOne([
            'name' => $cleanName,
            'email' => $cleanEmail,
            'passwordHash' => $passwordHash,
            'role' => 'customer', // Hard constraint: never allow client-specified role
            'createdAt' => $now,
            'updatedAt' => $now,
        ]);

        $userId = (string)$insertResult->getInsertedId();

        // 4. Log in the newly registered user
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_role'] = 'customer';
        $_SESSION['user_name'] = $cleanName;
        $_SESSION['user_email'] = $cleanEmail;
        $_SESSION['logged_in_at'] = time();

        return [
            'id' => $userId,
            'name' => $cleanName,
            'email' => $cleanEmail,
            'role' => 'customer',
        ];
    }

    /**
     * Authenticates an existing customer or administrator.
     *
     * @return array<string, mixed> Safe user profile
     * @throws InvalidArgumentException on invalid credentials
     */
    public static function login(string $email, string $password): array
    {
        self::startSession();

        $cleanEmail = strtolower(trim($email));

        if (empty($cleanEmail) || empty($password)) {
            throw new InvalidArgumentException('Email and password are required.');
        }

        $db = getDatabase();
        $users = $db->selectCollection('users');

        $user = $users->findOne(['email' => $cleanEmail]);

        // Generic error message to prevent account enumeration
        if ($user === null || !password_verify($password, (string)$user['passwordHash'])) {
            throw new InvalidArgumentException('Invalid email or password.');
        }

        // Regenerate session ID to prevent session fixation
        session_regenerate_id(true);

        $userId = (string)$user['_id'];
        $role = (string)($user['role'] ?? 'customer');
        $name = (string)($user['name'] ?? '');
        $email = (string)($user['email'] ?? $cleanEmail);

        $_SESSION['user_id'] = $userId;
        $_SESSION['user_role'] = $role;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['logged_in_at'] = time();

        return [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => $role,
        ];
    }

    /**
     * Completely invalidates the active user session and clears cookie.
     */
    public static function logout(): void
    {
        self::startSession();

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();
    }

    /**
     * Returns the safe profile of the currently logged-in user, or null if unauthenticated.
     *
     * @return array<string, mixed>|null
     */
    public static function getCurrentUser(): ?array
    {
        self::startSession();

        if (empty($_SESSION['user_id'])) {
            return null;
        }

        $userId = (string)$_SESSION['user_id'];

        try {
            $db = getDatabase();
            $users = $db->selectCollection('users');
            $user = $users->findOne(['_id' => new ObjectId($userId)]);

            if ($user === null) {
                // User was deleted or ID invalid
                self::logout();
                return null;
            }

            // Sync session if role or name changed
            $role = (string)($user['role'] ?? 'customer');
            $name = (string)($user['name'] ?? '');
            $email = (string)($user['email'] ?? '');

            $_SESSION['user_role'] = $role;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;

            return [
                'id' => $userId,
                'name' => $name,
                'email' => $email,
                'role' => $role,
                'createdAt' => isset($user['createdAt']) && $user['createdAt'] instanceof UTCDateTime
                    ? $user['createdAt']->toDateTime()->format(DATE_ATOM)
                    : null,
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Enforces that a user is logged in. Throws RuntimeException (401) if not.
     *
     * @return array<string, mixed>
     */
    public static function requireAuth(): array
    {
        $user = self::getCurrentUser();
        if ($user === null) {
            throw new RuntimeException('Authentication required. Please sign in.', 401);
        }
        return $user;
    }

    /**
     * Enforces that the logged-in user possesses a specific role (e.g. 'admin').
     * Throws RuntimeException with 401 (not logged in) or 403 (insufficient permissions).
     *
     * @return array<string, mixed>
     */
    public static function requireRole(string $requiredRole): array
    {
        $user = self::requireAuth();

        if ($user['role'] !== $requiredRole) {
            throw new RuntimeException(
                "Access Denied. You do not possess the required '{$requiredRole}' role.",
                403
            );
        }

        return $user;
    }
}
