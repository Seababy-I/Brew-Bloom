<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

use MongoDB\BSON\Regex;

class ProductService
{
    public const ALLOWED_CATEGORIES = ['coffee', 'tea', 'bakery'];

    /**
     * Finds products with optional search query and category filtering.
     *
     * @param string|null $category
     * @param string|null $search
     * @return array<int, array<string, mixed>>
     * @throws InvalidArgumentException if parameters are invalid.
     */
    public static function getProducts(?string $category = null, ?string $search = null): array
    {
        $db = getDatabase();
        $collection = $db->selectCollection('products');

        $filter = ['available' => true];

        // Validate and apply category filter
        if ($category !== null && $category !== '' && strtolower($category) !== 'all') {
            $catLower = strtolower(trim($category));
            if (!in_array($catLower, self::ALLOWED_CATEGORIES, true)) {
                throw new InvalidArgumentException(
                    "Invalid category '{$category}'. Allowed categories are: " . implode(', ', self::ALLOWED_CATEGORIES)
                );
            }
            $filter['category'] = $catLower;
        }

        // Validate and apply search filter
        if ($search !== null && trim($search) !== '') {
            $cleanSearch = trim($search);
            if (mb_strlen($cleanSearch) > 60) {
                throw new InvalidArgumentException('Search term must not exceed 60 characters.');
            }
            // Case-insensitive regex match on product name
            $filter['name'] = new Regex(preg_quote($cleanSearch, '/'), 'i');
        }

        $cursor = $collection->find($filter, [
            'sort' => ['featured' => -1, 'category' => 1, 'name' => 1],
        ]);

        $results = [];
        foreach ($cursor as $doc) {
            $results[] = self::formatProductDocument($doc);
        }

        return $results;
    }

    /**
     * Formats a MongoDB product document into a safe array for client presentation.
     *
     * @param object|array $doc
     * @return array<string, mixed>
     */
    public static function formatProductDocument($doc): array
    {
        $data = (array) $doc;

        return [
            'id' => (string) ($data['_id'] ?? ''),
            'slug' => (string) ($data['slug'] ?? ''),
            'name' => (string) ($data['name'] ?? ''),
            'category' => (string) ($data['category'] ?? ''),
            'description' => (string) ($data['description'] ?? ''),
            'priceINR' => (int) ($data['priceINR'] ?? 0),
            'imageUrl' => (string) ($data['imageUrl'] ?? ''),
            'available' => (bool) ($data['available'] ?? false),
            'featured' => (bool) ($data['featured'] ?? false),
            'options' => isset($data['options']) ? json_decode(json_encode($data['options']), true) : [],
        ];
    }
}
