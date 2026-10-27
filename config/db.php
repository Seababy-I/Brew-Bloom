<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use MongoDB\Client;
use MongoDB\Database;

/**
 * Loads environment variables from the project root .env file.
 */
function loadEnv(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }

    $projectRoot = dirname(__DIR__);
    if (file_exists($projectRoot . '/.env')) {
        $dotenv = Dotenv::createImmutable($projectRoot);
        $dotenv->safeLoad();
    }
    $loaded = true;
}

/**
 * Returns a MongoDB Database instance using environment configuration.
 *
 * @throws RuntimeException if connection fails or environment variables are missing.
 */
function getDatabase(): Database
{
    static $database = null;
    if ($database !== null) {
        return $database;
    }

    loadEnv();

    $uri = $_ENV['MONGODB_URI'] ?? getenv('MONGODB_URI');
    $dbName = $_ENV['MONGODB_DATABASE'] ?? getenv('MONGODB_DATABASE') ?: 'brew_and_bloom';

    if (empty($uri)) {
        throw new RuntimeException(
            'Database configuration error: MONGODB_URI is not defined. ' .
            'Please check your .env file.'
        );
    }

    try {
        $client = new Client($uri, [], [
            'serverSelectionTimeoutMS' => 5000,
        ]);
        $database = $client->selectDatabase($dbName);
        return $database;
    } catch (\Throwable $e) {
        // Sanitize error message to prevent leaking URI credentials
        throw new RuntimeException(
            'Unable to connect to MongoDB server: ' . $e->getMessage()
        );
    }
}

/**
 * Performs a ping command on the MongoDB database to verify connectivity.
 *
 * @return array{success: bool, message: string, database?: string}
 */
function pingDatabase(): array
{
    try {
        $db = getDatabase();
        $command = ['ping' => 1];
        $cursor = $db->command($command);
        $result = current($cursor->toArray());

        if (isset($result->ok) && (float)$result->ok === 1.0) {
            return [
                'success' => true,
                'message' => 'Successfully connected to MongoDB Atlas.',
                'database' => $db->getDatabaseName(),
            ];
        }

        return [
            'success' => false,
            'message' => 'Ping responded but status was not OK.',
        ];
    } catch (\Throwable $e) {
        return [
            'success' => false,
            'message' => 'Ping failed: ' . $e->getMessage(),
        ];
    }
}

// If invoked directly from CLI, run ping and report status
if (php_sapi_name() === 'cli' && isset($argv[0]) && realpath($argv[0]) === realpath(__FILE__)) {
    echo "--- Testing MongoDB Atlas Connection ---\n";
    $status = pingDatabase();
    if ($status['success']) {
        echo "[OK] " . $status['message'] . " (Database: " . ($status['database'] ?? 'unknown') . ")\n";
        exit(0);
    } else {
        echo "[ERROR] " . $status['message'] . "\n";
        exit(1);
    }
}
