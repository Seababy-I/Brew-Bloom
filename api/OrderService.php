<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

class OrderService
{
    public const VALID_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    public const VALID_PICKUP_TIMES = [
        'asap' => 'ASAP (~15-20 mins)',
        '30m'  => 'In 30 minutes',
        '45m'  => 'In 45 minutes',
        '60m'  => 'In 1 hour',
        '90m'  => 'In 1.5 hours',
    ];

    /**
     * Ensures necessary MongoDB indexes exist for the orders collection.
     */
    public static function ensureIndexes(): void
    {
        try {
            $db = getDatabase();
            $orders = $db->selectCollection('orders');

            $orders->createIndex(['orderReference' => 1], ['unique' => true, 'name' => 'uniq_order_reference']);
            $orders->createIndex(['customerId' => 1, 'createdAt' => -1], ['name' => 'idx_customer_orders']);
            $orders->createIndex(
                ['customerId' => 1, 'idempotencyKey' => 1],
                ['unique' => true, 'sparse' => true, 'name' => 'uniq_customer_idempotency']
            );
            $orders->createIndex(['status' => 1], ['name' => 'idx_order_status']);
        } catch (\Throwable $e) {
            // Ignore index exists warnings
        }
    }

    /**
     * Validates raw client items against live MongoDB products and options,
     * recalculating authoritative unit prices and line totals.
     *
     * @param array<int, mixed> $rawItems
     * @return array{items: array<int, array<string, mixed>>, total: int, count: int}
     * @throws InvalidArgumentException on validation or availability failure
     */
    public static function validateAndRecalculateItems(array $rawItems): array
    {
        if (empty($rawItems)) {
            throw new InvalidArgumentException('Your cart is empty. Please add items to checkout.');
        }

        if (count($rawItems) > 30) {
            throw new InvalidArgumentException('Order exceeds maximum allowed unique line items (30).');
        }

        $db = getDatabase();
        $productsCol = $db->selectCollection('products');

        $validatedItems = [];
        $orderTotal = 0;
        $totalQuantity = 0;

        foreach ($rawItems as $idx => $item) {
            if (!is_array($item)) {
                throw new InvalidArgumentException("Item at index {$idx} is invalid.");
            }

            // 1. Validate quantity
            $quantity = isset($item['quantity']) ? (int)$item['quantity'] : 0;
            if ($quantity < 1 || $quantity > 20) {
                throw new InvalidArgumentException("Quantity for item " . ($idx + 1) . " must be between 1 and 20.");
            }
            $totalQuantity += $quantity;
            if ($totalQuantity > 50) {
                throw new InvalidArgumentException('Total item quantity in a single order cannot exceed 50.');
            }

            // 2. Validate product existence and availability
            $productId = trim((string)($item['productId'] ?? $item['id'] ?? ''));
            if (!preg_match('/^[a-f\d]{24}$/i', $productId)) {
                throw new InvalidArgumentException("Item " . ($idx + 1) . " has an invalid product identifier.");
            }

            $product = $productsCol->findOne(['_id' => new ObjectId($productId)]);
            if ($product === null) {
                throw new InvalidArgumentException("One of the ordered items could not be found.");
            }

            if (empty($product['available'])) {
                $name = (string)($product['name'] ?? 'This item');
                throw new InvalidArgumentException("'{$name}' is currently unavailable or sold out.");
            }

            $productData = (array)$product;
            $basePrice = (int)($productData['priceINR'] ?? 0);
            $productOpts = isset($productData['options']) ? json_decode(json_encode($productData['options']), true) : [];

            // 3. Validate selected options strictly against product options schema
            $clientOpts = isset($item['selectedOptions']) && is_array($item['selectedOptions'])
                ? $item['selectedOptions']
                : [];

            $optionsSnapshot = [];
            $modifiersSum = 0;

            // --- Size option validation ---
            if (!empty($productOpts['sizes']) && is_array($productOpts['sizes'])) {
                $chosenSizeId = trim((string)($clientOpts['size']['id'] ?? $clientOpts['size'] ?? ''));
                if ($chosenSizeId === '') {
                    throw new InvalidArgumentException("Please select a size for '{$productData['name']}'.");
                }
                $matchedSize = null;
                foreach ($productOpts['sizes'] as $s) {
                    if ((string)$s['id'] === $chosenSizeId) {
                        $matchedSize = $s;
                        break;
                    }
                }
                if ($matchedSize === null) {
                    throw new InvalidArgumentException("Invalid size '{$chosenSizeId}' selected for '{$productData['name']}'.");
                }
                $sMod = (int)($matchedSize['priceModifier'] ?? 0);
                $modifiersSum += $sMod;
                $optionsSnapshot['size'] = [
                    'id' => (string)$matchedSize['id'],
                    'name' => (string)$matchedSize['name'],
                    'priceModifier' => $sMod,
                ];
            }

            // --- Milk option validation ---
            if (!empty($productOpts['milks']) && is_array($productOpts['milks'])) {
                $chosenMilkId = trim((string)($clientOpts['milk']['id'] ?? $clientOpts['milk'] ?? ''));
                if ($chosenMilkId !== '') {
                    $matchedMilk = null;
                    foreach ($productOpts['milks'] as $m) {
                        if ((string)$m['id'] === $chosenMilkId) {
                            $matchedMilk = $m;
                            break;
                        }
                    }
                    if ($matchedMilk === null) {
                        throw new InvalidArgumentException("Invalid milk option '{$chosenMilkId}' selected for '{$productData['name']}'.");
                    }
                    $mMod = (int)($matchedMilk['priceModifier'] ?? 0);
                    $modifiersSum += $mMod;
                    $optionsSnapshot['milk'] = [
                        'id' => (string)$matchedMilk['id'],
                        'name' => (string)$matchedMilk['name'],
                        'priceModifier' => $mMod,
                    ];
                }
            }

            // --- Sweetness option validation ---
            if (!empty($productOpts['sweetness']) && is_array($productOpts['sweetness'])) {
                $chosenSweetId = trim((string)($clientOpts['sweetness']['id'] ?? $clientOpts['sweetness'] ?? ''));
                if ($chosenSweetId !== '') {
                    $matchedSweet = null;
                    foreach ($productOpts['sweetness'] as $sw) {
                        if ((string)$sw['id'] === $chosenSweetId) {
                            $matchedSweet = $sw;
                            break;
                        }
                    }
                    if ($matchedSweet === null) {
                        throw new InvalidArgumentException("Invalid sweetness level '{$chosenSweetId}' selected for '{$productData['name']}'.");
                    }
                    $swMod = (int)($matchedSweet['priceModifier'] ?? 0);
                    $modifiersSum += $swMod;
                    $optionsSnapshot['sweetness'] = [
                        'id' => (string)$matchedSweet['id'],
                        'name' => (string)$matchedSweet['name'],
                        'priceModifier' => $swMod,
                    ];
                }
            }

            // --- Warming option validation (bakery) ---
            if (!empty($productOpts['warming']) && is_array($productOpts['warming'])) {
                $chosenWarmId = trim((string)($clientOpts['warming']['id'] ?? $clientOpts['warming'] ?? ''));
                if ($chosenWarmId !== '') {
                    $matchedWarm = null;
                    foreach ($productOpts['warming'] as $w) {
                        if ((string)$w['id'] === $chosenWarmId) {
                            $matchedWarm = $w;
                            break;
                        }
                    }
                    if ($matchedWarm === null) {
                        throw new InvalidArgumentException("Invalid warming option '{$chosenWarmId}' selected for '{$productData['name']}'.");
                    }
                    $wMod = (int)($matchedWarm['priceModifier'] ?? 0);
                    $modifiersSum += $wMod;
                    $optionsSnapshot['warming'] = [
                        'id' => (string)$matchedWarm['id'],
                        'name' => (string)$matchedWarm['name'],
                        'priceModifier' => $wMod,
                    ];
                }
            }

            // --- Extras option validation ---
            $extrasList = [];
            $clientExtras = isset($clientOpts['extras']) && is_array($clientOpts['extras']) ? $clientOpts['extras'] : [];
            $seenExtras = [];

            if (!empty($clientExtras)) {
                $allowedExtras = !empty($productOpts['extras']) && is_array($productOpts['extras'])
                    ? $productOpts['extras']
                    : [];

                foreach ($clientExtras as $exItem) {
                    $exId = is_array($exItem) ? trim((string)($exItem['id'] ?? '')) : trim((string)$exItem);
                    if ($exId === '') continue;

                    if (isset($seenExtras[$exId])) {
                        continue; // skip duplicate selections of the same add-on
                    }
                    $seenExtras[$exId] = true;

                    $matchedExtra = null;
                    foreach ($allowedExtras as $ae) {
                        if ((string)$ae['id'] === $exId) {
                            $matchedExtra = $ae;
                            break;
                        }
                    }

                    if ($matchedExtra === null) {
                        throw new InvalidArgumentException("Add-on '{$exId}' is not available for '{$productData['name']}'.");
                    }

                    $eMod = (int)($matchedExtra['priceModifier'] ?? 0);
                    $modifiersSum += $eMod;
                    $extrasList[] = [
                        'id' => (string)$matchedExtra['id'],
                        'name' => (string)$matchedExtra['name'],
                        'priceModifier' => $eMod,
                    ];
                }
            }
            $optionsSnapshot['extras'] = $extrasList;

            // 4. Server-side price calculation
            $unitPrice = max(0, $basePrice + $modifiersSum);
            $lineTotal = $unitPrice * $quantity;
            $orderTotal += $lineTotal;

            $validatedItems[] = [
                'productId' => (string)$productData['_id'],
                'slug' => (string)($productData['slug'] ?? ''),
                'name' => (string)($productData['name'] ?? 'Café Item'),
                'category' => (string)($productData['category'] ?? 'coffee'),
                'imageUrl' => (string)($productData['imageUrl'] ?? ''),
                'basePrice' => $basePrice,
                'selectedOptions' => $optionsSnapshot,
                'unitPrice' => $unitPrice,
                'quantity' => $quantity,
                'lineTotal' => $lineTotal,
            ];
        }

        return [
            'items' => $validatedItems,
            'total' => $orderTotal,
            'count' => $totalQuantity,
        ];
    }

    /**
     * Validates and normalizes pickup information.
     *
     * @param array<string, mixed> $pickupData
     * @return array<string, string>
     * @throws InvalidArgumentException
     */
    public static function validatePickupInfo(array $pickupData): array
    {
        $name = trim((string)($pickupData['customerName'] ?? $pickupData['customer_name'] ?? ''));
        $phone = trim((string)($pickupData['customerPhone'] ?? $pickupData['customer_phone'] ?? ''));
        $email = strtolower(trim((string)($pickupData['customerEmail'] ?? $pickupData['customer_email'] ?? '')));
        $pickupTimeRaw = trim((string)($pickupData['pickupTime'] ?? $pickupData['pickup_time'] ?? 'asap'));
        $instructions = trim((string)($pickupData['specialInstructions'] ?? $pickupData['special_instructions'] ?? ''));

        if (mb_strlen($name) < 2 || mb_strlen($name) > 80) {
            throw new InvalidArgumentException('Please provide a valid contact name (2–80 characters).');
        }

        // Clean phone digits
        $digitsOnly = preg_replace('/[^\d]/', '', $phone);
        if (strlen($digitsOnly) < 10 || strlen($digitsOnly) > 15) {
            throw new InvalidArgumentException('Please provide a valid phone number (at least 10 digits).');
        }

        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Please provide a valid contact email address.');
        }

        $pickupTimeLabel = self::VALID_PICKUP_TIMES[$pickupTimeRaw] ?? null;
        if ($pickupTimeLabel === null) {
            // Check if exact label was passed
            if (in_array($pickupTimeRaw, self::VALID_PICKUP_TIMES, true)) {
                $pickupTimeLabel = $pickupTimeRaw;
            } else {
                $pickupTimeLabel = self::VALID_PICKUP_TIMES['asap'];
            }
        }

        if (mb_strlen($instructions) > 500) {
            throw new InvalidArgumentException('Special instructions must not exceed 500 characters.');
        }

        return [
            'customerName' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
            'customerPhone' => htmlspecialchars($phone, ENT_QUOTES, 'UTF-8'),
            'customerEmail' => htmlspecialchars($email, ENT_QUOTES, 'UTF-8'),
            'pickupTime' => $pickupTimeLabel,
            'specialInstructions' => htmlspecialchars($instructions, ENT_QUOTES, 'UTF-8'),
        ];
    }

    /**
     * Generates a readable, unique order reference. e.g. BB-20261027-4B9E
     */
    public static function generateOrderReference(): string
    {
        $datePart = date('Ymd');
        $randomHex = strtoupper(bin2hex(random_bytes(2)));
        $randomNum = mt_rand(10, 99);
        return "BB-{$datePart}-{$randomHex}{$randomNum}";
    }

    /**
     * Creates a new order in MongoDB after full security, pricing, and idempotency checks.
     *
     * @param string $customerId
     * @param array<int, mixed> $rawItems
     * @param array<string, mixed> $pickupData
     * @param string $idempotencyKey
     * @param int|null $expectedTotal
     * @return array<string, mixed> Formatted created order document
     * @throws InvalidArgumentException|RuntimeException
     */
    public static function createOrder(
        string $customerId,
        array $rawItems,
        array $pickupData,
        string $idempotencyKey,
        ?int $expectedTotal = null
    ): array {
        self::ensureIndexes();

        $cleanIdempotencyKey = trim($idempotencyKey);
        if ($cleanIdempotencyKey === '' || mb_strlen($cleanIdempotencyKey) > 128) {
            throw new InvalidArgumentException('A valid idempotency key is required to prevent duplicate submissions.');
        }

        $db = getDatabase();
        $ordersCol = $db->selectCollection('orders');

        // Check for existing order with same idempotency key for this customer
        $existingOrder = $ordersCol->findOne([
            'customerId' => $customerId,
            'idempotencyKey' => $cleanIdempotencyKey,
        ]);

        if ($existingOrder !== null) {
            // Idempotent replay: return existing order without creating a duplicate
            return self::formatOrderDocument($existingOrder);
        }

        // Validate items and recalculate authoritative pricing
        $recalculated = self::validateAndRecalculateItems($rawItems);
        $authoritativeTotal = $recalculated['total'];

        // Strict price verification: prevent client price tampering or stale cart totals
        if ($expectedTotal !== null && (int)$expectedTotal !== $authoritativeTotal) {
            throw new RuntimeException(
                "Order total verification failed. Authoritative price is ₹{$authoritativeTotal}, but client submitted ₹{$expectedTotal}. Please review the updated order details.",
                409 // Conflict
            );
        }

        // Validate pickup information
        $validatedPickup = self::validatePickupInfo($pickupData);

        // Generate unique reference and timestamps
        $now = new UTCDateTime();
        $orderRef = self::generateOrderReference();

        $orderDocument = [
            'orderReference' => $orderRef,
            'customerId' => $customerId,
            'idempotencyKey' => $cleanIdempotencyKey,
            'items' => $recalculated['items'],
            'itemCount' => $recalculated['count'],
            'subtotal' => $authoritativeTotal,
            'taxesAndFees' => 0, // Included in café prices
            'total' => $authoritativeTotal,
            'pickupInfo' => $validatedPickup,
            'paymentMethod' => 'Pay at Café',
            'paymentStatus' => 'unpaid',
            'status' => 'pending',
            'statusHistory' => [
                [
                    'status' => 'pending',
                    'timestamp' => $now,
                    'note' => 'Order placed successfully by customer. Awaiting barista preparation.',
                ],
            ],
            'createdAt' => $now,
            'updatedAt' => $now,
        ];

        $insertResult = $ordersCol->insertOne($orderDocument);
        $orderDocument['_id'] = $insertResult->getInsertedId();

        return self::formatOrderDocument($orderDocument);
    }

    /**
     * Retrieves all orders placed by an authenticated customer, sorted newest first.
     *
     * @param string $customerId
     * @param int $limit
     * @return array<int, array<string, mixed>>
     */
    public static function getCustomerOrders(string $customerId, int $limit = 50): array
    {
        $db = getDatabase();
        $ordersCol = $db->selectCollection('orders');

        $cursor = $ordersCol->find(
            ['customerId' => $customerId],
            [
                'sort' => ['createdAt' => -1],
                'limit' => min(100, max(1, $limit)),
            ]
        );

        $results = [];
        foreach ($cursor as $doc) {
            $results[] = self::formatOrderDocument($doc);
        }

        return $results;
    }

    /**
     * Retrieves a single order document by ID or reference with strict customer ownership enforcement.
     *
     * @param string $identifier Order ObjectId or BB-YYYYMMDD-XXXX reference
     * @param string $customerId Authenticated customer's ID
     * @param bool $isAdmin If true, bypasses ownership check (for admin management)
     * @return array<string, mixed>|null
     * @throws RuntimeException with 403 on ownership mismatch
     */
    public static function getOrderByIdOrRef(string $identifier, string $customerId, bool $isAdmin = false): ?array
    {
        $clean = trim($identifier);
        if ($clean === '') {
            return null;
        }

        $db = getDatabase();
        $ordersCol = $db->selectCollection('orders');

        $filter = [];
        if (preg_match('/^[a-f\d]{24}$/i', $clean)) {
            $filter['_id'] = new ObjectId($clean);
        } else {
            $filter['orderReference'] = $clean;
        }

        $doc = $ordersCol->findOne($filter);
        if ($doc === null) {
            return null;
        }

        $docArray = (array)$doc;
        $orderCustomerId = (string)($docArray['customerId'] ?? '');

        // Strict ownership check: prevent unauthorized access to other customers' orders
        if (!$isAdmin && $orderCustomerId !== $customerId) {
            throw new RuntimeException("Access Denied. You do not have permission to view this order.", 403);
        }

        return self::formatOrderDocument($doc);
    }

    /**
     * Formats an internal MongoDB order document into a safe, client-facing array.
     *
     * @param object|array $doc
     * @return array<string, mixed>
     */
    public static function formatOrderDocument($doc): array
    {
        $data = (array)$doc;

        $createdStr = '';
        if (isset($data['createdAt']) && $data['createdAt'] instanceof UTCDateTime) {
            $createdStr = $data['createdAt']->toDateTime()->format(DATE_ATOM);
        }

        $updatedStr = '';
        if (isset($data['updatedAt']) && $data['updatedAt'] instanceof UTCDateTime) {
            $updatedStr = $data['updatedAt']->toDateTime()->format(DATE_ATOM);
        }

        $historyFormatted = [];
        if (isset($data['statusHistory']) && is_iterable($data['statusHistory'])) {
            foreach ($data['statusHistory'] as $h) {
                $hArray = (array)$h;
                $tStr = '';
                if (isset($hArray['timestamp']) && $hArray['timestamp'] instanceof UTCDateTime) {
                    $tStr = $hArray['timestamp']->toDateTime()->format(DATE_ATOM);
                }
                $historyFormatted[] = [
                    'status' => (string)($hArray['status'] ?? ''),
                    'timestamp' => $tStr,
                    'note' => (string)($hArray['note'] ?? ''),
                ];
            }
        }

        return [
            'id' => (string)($data['_id'] ?? ''),
            'orderReference' => (string)($data['orderReference'] ?? ''),
            'customerId' => (string)($data['customerId'] ?? ''),
            'items' => isset($data['items']) ? json_decode(json_encode($data['items']), true) : [],
            'itemCount' => (int)($data['itemCount'] ?? 0),
            'subtotal' => (int)($data['subtotal'] ?? 0),
            'taxesAndFees' => (int)($data['taxesAndFees'] ?? 0),
            'total' => (int)($data['total'] ?? 0),
            'pickupInfo' => isset($data['pickupInfo']) ? json_decode(json_encode($data['pickupInfo']), true) : [],
            'paymentMethod' => (string)($data['paymentMethod'] ?? 'Pay at Café'),
            'paymentStatus' => (string)($data['paymentStatus'] ?? 'unpaid'),
            'status' => (string)($data['status'] ?? 'pending'),
            'statusHistory' => $historyFormatted,
            'createdAt' => $createdStr,
            'updatedAt' => $updatedStr,
        ];
    }
}
