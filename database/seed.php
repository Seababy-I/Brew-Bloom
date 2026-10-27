<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

use MongoDB\BSON\UTCDateTime;

function runDatabaseSeed(): void
{
    loadEnv();
    $db = getDatabase();

    echo "=== Brew & Bloom Database Seeder ===\n";
    echo "Connecting to database: " . $db->getDatabaseName() . "\n";

    // 1. Setup collections and indexes
    $usersCollection = $db->selectCollection('users');
    $productsCollection = $db->selectCollection('products');

    echo "Ensuring unique indexes...\n";
    $usersCollection->createIndex(['email' => 1], ['unique' => true, 'name' => 'uniq_user_email']);
    $productsCollection->createIndex(['slug' => 1], ['unique' => true, 'name' => 'uniq_product_slug']);
    $productsCollection->createIndex(['category' => 1], ['name' => 'idx_product_category']);

    // 2. Seed Users
    echo "Seeding accounts...\n";
    $now = new UTCDateTime();

    $adminEmail = strtolower(trim($_ENV['SEED_ADMIN_EMAIL'] ?? 'admin@brewandbloom.com'));
    $adminPassword = $_ENV['SEED_ADMIN_PASSWORD'] ?? 'AdminBrewBloom2026!';
    $adminName = $_ENV['SEED_ADMIN_NAME'] ?? 'Brew & Bloom Manager';

    $customerEmail = strtolower(trim($_ENV['SEED_CUSTOMER_EMAIL'] ?? 'customer@brewandbloom.com'));
    $customerPassword = $_ENV['SEED_CUSTOMER_PASSWORD'] ?? 'CustomerBrewBloom2026!';
    $customerName = $_ENV['SEED_CUSTOMER_NAME'] ?? 'Aarav Sharma';

    $usersToSeed = [
        [
            'name' => $adminName,
            'email' => $adminEmail,
            'passwordHash' => password_hash($adminPassword, PASSWORD_DEFAULT),
            'role' => 'admin',
            'createdAt' => $now,
            'updatedAt' => $now,
        ],
        [
            'name' => $customerName,
            'email' => $customerEmail,
            'passwordHash' => password_hash($customerPassword, PASSWORD_DEFAULT),
            'role' => 'customer',
            'createdAt' => $now,
            'updatedAt' => $now,
        ],
    ];

    foreach ($usersToSeed as $user) {
        $usersCollection->updateOne(
            ['email' => $user['email']],
            [
                '$set' => [
                    'name' => $user['name'],
                    'passwordHash' => $user['passwordHash'],
                    'role' => $user['role'],
                    'updatedAt' => $now,
                ],
                '$setOnInsert' => [
                    'createdAt' => $user['createdAt'],
                ],
            ],
            ['upsert' => true]
        );
        echo "  [User Upserted] " . $user['email'] . " (" . $user['role'] . ")\n";
    }

    // 3. Seed 12 Products (4 Coffee, 4 Tea, 4 Bakery)
    echo "\nSeeding 12 café products...\n";

    $drinkCustomizations = [
        'sizes' => [
            ['id' => 'regular', 'name' => 'Regular (240ml)', 'priceModifier' => 0],
            ['id' => 'large', 'name' => 'Large (360ml)', 'priceModifier' => 40],
        ],
        'milks' => [
            ['id' => 'whole', 'name' => 'Whole Milk', 'priceModifier' => 0],
            ['id' => 'oat', 'name' => 'Oat Milk', 'priceModifier' => 35],
            ['id' => 'almond', 'name' => 'Almond Milk', 'priceModifier' => 40],
            ['id' => 'skim', 'name' => 'Skim Milk', 'priceModifier' => 0],
        ],
        'sweetness' => [
            ['id' => '0', 'name' => 'No Sugar (0%)', 'priceModifier' => 0],
            ['id' => '50', 'name' => 'Less Sweet (50%)', 'priceModifier' => 0],
            ['id' => '100', 'name' => 'Standard Sweet (100%)', 'priceModifier' => 0],
        ],
        'extras' => [
            ['id' => 'espresso_shot', 'name' => 'Extra Espresso Shot', 'priceModifier' => 45],
            ['id' => 'vanilla_syrup', 'name' => 'Madagascar Vanilla Syrup', 'priceModifier' => 35],
            ['id' => 'caramel_drizzle', 'name' => 'Salted Caramel Drizzle', 'priceModifier' => 30],
        ],
    ];

    $teaCustomizations = [
        'sizes' => [
            ['id' => 'regular', 'name' => 'Pot / Cup (240ml)', 'priceModifier' => 0],
            ['id' => 'large', 'name' => 'Grand Pot (360ml)', 'priceModifier' => 35],
        ],
        'milks' => [
            ['id' => 'none', 'name' => 'No Milk (Clear)', 'priceModifier' => 0],
            ['id' => 'whole', 'name' => 'Steamed Whole Milk', 'priceModifier' => 0],
            ['id' => 'oat', 'name' => 'Oat Milk', 'priceModifier' => 35],
        ],
        'sweetness' => [
            ['id' => '0', 'name' => 'Unsweetened (0%)', 'priceModifier' => 0],
            ['id' => '50', 'name' => 'Honey / Less Sweet', 'priceModifier' => 20],
            ['id' => '100', 'name' => 'Standard Sweet', 'priceModifier' => 0],
        ],
        'extras' => [
            ['id' => 'saffron', 'name' => 'Saffron Threads', 'priceModifier' => 50],
            ['id' => 'ginger', 'name' => 'Crushed Ginger & Mint', 'priceModifier' => 25],
        ],
    ];

    $bakeryCustomizations = [
        'warming' => [
            ['id' => 'warmed', 'name' => 'Warmed & Crisp', 'priceModifier' => 0],
            ['id' => 'room', 'name' => 'Room Temperature', 'priceModifier' => 0],
        ],
        'extras' => [
            ['id' => 'extra_butter', 'name' => 'Cultured Butter Portion', 'priceModifier' => 30],
            ['id' => 'jam', 'name' => 'Organic Berry Jam', 'priceModifier' => 35],
        ],
    ];

    $products = [
        // --- COFFEE (4) ---
        [
            'slug' => 'signature-espresso',
            'name' => 'Signature Espresso',
            'category' => 'coffee',
            'description' => 'A concentrated double shot extracted from single-origin Chikmagalur Arabica beans with notes of dark cocoa and honeyed crema.',
            'priceINR' => 160,
            'imageUrl' => '/assets/images/espresso.jpg',
            'available' => true,
            'featured' => true,
            'options' => [
                'sizes' => [
                    ['id' => 'single', 'name' => 'Single Shot (30ml)', 'priceModifier' => -30],
                    ['id' => 'double', 'name' => 'Double Shot (60ml)', 'priceModifier' => 0],
                ],
                'extras' => [
                    ['id' => 'espresso_shot', 'name' => 'Extra Shot', 'priceModifier' => 45],
                ],
            ],
        ],
        [
            'slug' => 'hazelnut-velvet-latte',
            'name' => 'Hazelnut Velvet Latte',
            'category' => 'coffee',
            'description' => 'Rich espresso layered over silky textured milk and house-made roasted hazelnut praline syrup, finished with grated nutmeg.',
            'priceINR' => 240,
            'imageUrl' => '/assets/images/hazelnut-latte.jpg',
            'available' => true,
            'featured' => true,
            'options' => $drinkCustomizations,
        ],
        [
            'slug' => 'classic-cold-brew',
            'name' => 'Classic Cold Brew',
            'category' => 'coffee',
            'description' => 'Steeped for 18 slow hours in cold filtered mountain water. Naturally low in acidity with subtle caramel undertones, served over ice.',
            'priceINR' => 210,
            'imageUrl' => '/assets/images/cold-brew.jpg',
            'available' => true,
            'featured' => false,
            'options' => [
                'sizes' => $drinkCustomizations['sizes'],
                'sweetness' => $drinkCustomizations['sweetness'],
                'milks' => $drinkCustomizations['milks'],
                'extras' => [
                    ['id' => 'vanilla_cold_foam', 'name' => 'Vanilla Sweet Cream Foam', 'priceModifier' => 45],
                    ['id' => 'espresso_shot', 'name' => 'Extra Shot', 'priceModifier' => 45],
                ],
            ],
        ],
        [
            'slug' => 'cinnamon-spiced-flat-white',
            'name' => 'Cinnamon Spiced Flat White',
            'category' => 'coffee',
            'description' => 'Velvety micro-foam expertly poured over a double ristretto shot, gently infused with whole Ceylon cinnamon bark.',
            'priceINR' => 230,
            'imageUrl' => '/assets/images/flat-white.jpg',
            'available' => true,
            'featured' => false,
            'options' => $drinkCustomizations,
        ],

        // --- TEA (4) ---
        [
            'slug' => 'royal-darjeeling-first-flush',
            'name' => 'Royal Darjeeling First Flush',
            'category' => 'tea',
            'description' => 'The champagne of teas. Single-estate spring harvest from high altitude Darjeeling slopes, boasting floral muscatel notes.',
            'priceINR' => 190,
            'imageUrl' => '/assets/images/darjeeling-tea.jpg',
            'available' => true,
            'featured' => true,
            'options' => $teaCustomizations,
        ],
        [
            'slug' => 'ceremonial-matcha-latte',
            'name' => 'Ceremonial Matcha Latte',
            'category' => 'tea',
            'description' => 'First-harvest shade-grown Uji green tea whisked with bamboo chasen and folded into gently frothed sweet milk.',
            'priceINR' => 260,
            'imageUrl' => '/assets/images/matcha-latte.jpg',
            'available' => true,
            'featured' => true,
            'options' => [
                'sizes' => $drinkCustomizations['sizes'],
                'milks' => $drinkCustomizations['milks'],
                'sweetness' => $drinkCustomizations['sweetness'],
                'extras' => [
                    ['id' => 'extra_matcha', 'name' => 'Double Matcha Scoop', 'priceModifier' => 50],
                    ['id' => 'vanilla_syrup', 'name' => 'Vanilla Bean Syrup', 'priceModifier' => 35],
                ],
            ],
        ],
        [
            'slug' => 'kashmiri-kahwa',
            'name' => 'Kashmiri Saffron Kahwa',
            'category' => 'tea',
            'description' => 'Slow-brewed green tea leaves infused with handpicked Kashmiri saffron strands, green cardamom, cinnamon, and slivered almonds.',
            'priceINR' => 220,
            'imageUrl' => '/assets/images/kashmiri-kahwa.jpg',
            'available' => true,
            'featured' => false,
            'options' => $teaCustomizations,
        ],
        [
            'slug' => 'chamomile-citrus-blossom',
            'name' => 'Chamomile Citrus Blossom',
            'category' => 'tea',
            'description' => 'Naturally caffeine-free Egyptian chamomile whole flowers infused with sun-dried sweet Valencia orange peel and lemongrass.',
            'priceINR' => 180,
            'imageUrl' => '/assets/images/chamomile-tea.jpg',
            'available' => true,
            'featured' => false,
            'options' => $teaCustomizations,
        ],

        // --- BAKERY (4) ---
        [
            'slug' => 'artisanal-butter-croissant',
            'name' => 'Artisanal Butter Croissant',
            'category' => 'bakery',
            'description' => 'Classic laminated French pastry crafted with 32 delicate layers of cultured butter, yielding a honeycomb interior and crisp golden shell.',
            'priceINR' => 170,
            'imageUrl' => '/assets/images/croissant.jpg',
            'available' => true,
            'featured' => true,
            'options' => $bakeryCustomizations,
        ],
        [
            'slug' => 'wild-blueberry-crumble-muffin',
            'name' => 'Wild Blueberry Crumble Muffin',
            'category' => 'bakery',
            'description' => 'Moist vanilla sour-cream crumb generously packed with whole wild mountain blueberries and crowned with cinnamon-oat streusel.',
            'priceINR' => 190,
            'imageUrl' => '/assets/images/blueberry-muffin.jpg',
            'available' => true,
            'featured' => false,
            'options' => $bakeryCustomizations,
        ],
        [
            'slug' => 'belgian-dark-chocolate-tart',
            'name' => 'Belgian Dark Chocolate Tart',
            'category' => 'bakery',
            'description' => 'Velvety ganache made with 70% single-origin Belgian dark chocolate encased in a tender almond-cocoa sablé crust.',
            'priceINR' => 250,
            'imageUrl' => '/assets/images/chocolate-tart.jpg',
            'available' => true,
            'featured' => true,
            'options' => $bakeryCustomizations,
        ],
        [
            'slug' => 'rosemary-sea-salt-focaccia',
            'name' => 'Rosemary & Sea Salt Focaccia',
            'category' => 'bakery',
            'description' => 'Pillowy 24-hour fermented sourdough flatbread dimpled with extra-virgin olive oil, fresh rosemary sprigs, and Maldon sea salt flakes.',
            'priceINR' => 210,
            'imageUrl' => '/assets/images/focaccia.jpg',
            'available' => true,
            'featured' => false,
            'options' => $bakeryCustomizations,
        ],
    ];

    foreach ($products as $item) {
        $productsCollection->updateOne(
            ['slug' => $item['slug']],
            [
                '$set' => [
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'description' => $item['description'],
                    'priceINR' => $item['priceINR'],
                    'imageUrl' => $item['imageUrl'],
                    'available' => $item['available'],
                    'featured' => $item['featured'],
                    'options' => $item['options'],
                    'updatedAt' => $now,
                ],
                '$setOnInsert' => [
                    'createdAt' => $now,
                ],
            ],
            ['upsert' => true]
        );
        echo "  [Product Upserted] [" . strtoupper($item['category']) . "] " . $item['name'] . " - INR " . $item['priceINR'] . "\n";
    }

    $totalProducts = $productsCollection->countDocuments();
    $totalUsers = $usersCollection->countDocuments();

    echo "\n=== Seeding Finished Successfully ===";
    echo "\nTotal users in collection: {$totalUsers}";
    echo "\nTotal products in collection: {$totalProducts}\n";
}

if (php_sapi_name() === 'cli') {
    try {
        runDatabaseSeed();
        exit(0);
    } catch (\Throwable $e) {
        fwrite(STDERR, "Seed failed: " . $e->getMessage() . "\n");
        exit(1);
    }
}
