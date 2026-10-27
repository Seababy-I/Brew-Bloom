# Brew & Bloom — Smart Café Ordering & Management System

> Coursework Project: **ICT 3131 — Web Technologies**  
> Status: **Slice 4 Complete (Checkout, Order Placement & Order History)** — Branch: `feature/ordering`

Brew & Bloom is a responsive, database-backed café web application built with semantic HTML5, custom vanilla CSS3, vanilla JavaScript, PHP, and MongoDB Atlas.

---

## Architecture & Technology Stack

- **Frontend:** HTML5, Vanilla CSS3 (Custom Design System), Vanilla JavaScript (ES6+). Zero frontend frameworks, libraries, or build tools.
- **Backend:** PHP 8.5 with `mongodb/mongodb` driver client library and `vlucas/phpdotenv`.
- **Database:** MongoDB Atlas (Cloud Cluster: `brew_and_bloom`).
- **Communication:** Native Fetch API exchanging structured JSON (`{ success, data, message, errors }`).
- **Cart Management:** Persistent client-side cart stored in `localStorage` under key `brew_bloom_cart`. Line items indexed by a deterministic hash of product ID and sorted customization options.
- **Order Engine:** Server-verified pricing and options validation, unique human-readable order references (`BB-YYYYMMDD-XXXX`), checkout idempotency protection, immutable item snapshots, and real-time Fetch polling for active preparation stages.
- **Security Boundaries:** Only `/public` is exposed as the web document root. Secrets, database configuration (`/config`), seeding scripts (`/database`), and vendor dependencies reside securely outside the public root.

---

## Directory Structure

```text
Brew&Bloom/
├── config/
│   └── db.php                  # Safe MongoDB Atlas client & CLI ping test
├── database/
│   └── seed.php                # Idempotent database seeder (12 items + 2 users + orders indexes)
├── api/
│   ├── ProductService.php      # Catalog business logic and query filtering
│   ├── AuthService.php         # Session management, CSRF validation & RBAC guards
│   └── OrderService.php        # Authoritative price recalculation, order creation & ownership
├── public/                     # Web Document Root
│   ├── index.html              # Homepage with hero, features & story
│   ├── menu.html               # Dynamic interactive café menu & customizer modal
│   ├── product.html            # Standalone product customization & detail view
│   ├── cart.html               # Dedicated shopping cart page & order summary
│   ├── checkout.html           # Accessible pickup checkout & authoritative price verification
│   ├── orders.html             # Customer order history & real-time preparation tracker
│   ├── login.html              # Customer & Admin sign-in page with return redirect support
│   ├── register.html           # Customer registration page with return redirect support
│   ├── account.html            # Member portal & server-side RBAC verification
│   ├── api/
│   │   ├── products.php        # Products list endpoint (GET /api/products.php)
│   │   ├── product.php         # Single product endpoint (GET /api/product.php?id=...|?slug=...)
│   │   ├── orders.php          # Order creation & history (GET/POST /api/orders.php)
│   │   ├── order.php           # Single order details & status (GET /api/order.php?id=...|?ref=...)
│   │   └── auth/
│   │       ├── csrf.php        # CSRF token endpoint (GET /api/auth/csrf.php)
│   │       ├── register.php    # Customer registration (POST /api/auth/register.php)
│   │       ├── login.php       # Session authentication (POST /api/auth/login.php)
│   │       ├── logout.php      # Session termination (POST /api/auth/logout.php)
│   │       ├── me.php          # Session profile (GET /api/auth/me.php)
│   │       └── admin-check.php # Protected test endpoint (GET /api/auth/admin-check.php)
│   ├── css/
│   │   └── style.css           # Global WCAG AA compliant design system & checkout/order styling
│   ├── js/
│   │   ├── main.js             # Shared navigation, auth sync, and accessibility
│   │   ├── menu.js             # Async menu search, filtering & modal customizer trigger
│   │   ├── customizer.js       # Accessible product option builder & price calculator
│   │   ├── cart.js             # Reusable cart storage engine & badge dispatcher
│   │   ├── cart-page.js        # Cart view manager (steppers, removals, clear cart modal)
│   │   ├── checkout.js         # Checkout controller, authoritative quote & idempotency
│   │   ├── orders.js           # Live order tracking (4-step progress stepper & polling)
│   │   ├── product-page.js     # Standalone product page customizer controller
│   │   └── auth.js             # Accessible form validation & RBAC verification
│   └── assets/
│       └── images/             # 14 curated high-resolution café assets
├── docs/
│   ├── prd.md                  # Converted Product Requirements Document
│   └── proposal.md             # Converted Coursework Project Proposal
├── .env.example                # Sanitized environment template
├── .gitignore                  # Git ignore rules (.env, vendor, etc.)
├── composer.json               # PHP backend dependencies
├── composer.lock               # Pinned dependency versions
├── README.md                   # Project documentation & run guide
└── RULES.md                    # Project-wide architecture & quality constraints
```

---

## Prerequisites

- **PHP 8.2+** with the `mongodb` extension enabled (configured on system at `C:\php`).
- **Composer 2.x** (configured at `C:\ProgramData\ComposerSetup\bin`).
- Active MongoDB connection URI.

---

## Quick Start / How to Run Locally

### 1. Environment Configuration

Ensure your `.env` file exists in the project root with valid credentials:

```ini
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.zp18br4.mongodb.net/"
MONGODB_DATABASE="brew_and_bloom"

SEED_ADMIN_EMAIL="admin@brewandbloom.com"
SEED_ADMIN_PASSWORD="AdminBrewBloom2026!"
SEED_CUSTOMER_EMAIL="customer@brewandbloom.com"
SEED_CUSTOMER_PASSWORD="CustomerBrewBloom2026!"
```

### 2. Verify Database Connectivity

Run the database ping test from PowerShell:

```powershell
C:\php\php.exe config/db.php
```

Expected output:
```text
--- Testing MongoDB Atlas Connection ---
[OK] Successfully connected to MongoDB Atlas. (Database: brew_and_bloom)
```

### 3. Seed Database Catalog (Idempotent)

Seed the 12 café items (4 Coffee, 4 Tea, 4 Bakery) and seed users:

```powershell
C:\php\php.exe database/seed.php
```

### 4. Launch the Local PHP Web Server

Serve the application with `/public` as the document root:

```powershell
C:\php\php.exe -S 127.0.0.1:8000 -t public
```

### 5. Access the Web Application

Open your browser to:
- **Homepage:** [http://127.0.0.1:8000/index.html](http://127.0.0.1:8000/index.html)
- **Interactive Menu:** [http://127.0.0.1:8000/menu.html](http://127.0.0.1:8000/menu.html)
- **Products API:** [http://127.0.0.1:8000/api/products.php](http://127.0.0.1:8000/api/products.php)

---

## API Documentation

### `GET /api/products.php`

Returns products according to optional search and category filters.

- **Query Parameters:**
  - `category` *(optional)*: `all`, `coffee`, `tea`, `bakery`
  - `q` or `search` *(optional)*: Case-insensitive search query (max 60 chars)

- **Sample Request:**
  `GET /api/products.php?category=coffee&q=latte`

- **Response Format:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "671e3b...",
        "slug": "hazelnut-velvet-latte",
        "name": "Hazelnut Velvet Latte",
        "category": "coffee",
        "description": "Rich espresso layered over silky textured milk...",
        "priceINR": 240,
        "imageUrl": "/assets/images/hazelnut-latte.jpg",
        "available": true,
        "featured": true,
        "options": {
          "sizes": [...],
          "milks": [...],
          "sweetness": [...],
          "extras": [...]
        }
      }
    ],
    "message": "Products retrieved successfully.",
    "errors": []
  }
  ```

### `GET /api/product.php`

Retrieves a single product document including all available customization dimensions (sizes, milks, sweetness, warming, extras).

- **Query Parameters:**
  - `id`: 24-character hexadecimal MongoDB ObjectId
  - `slug`: Product slug string (e.g. `signature-espresso`, `hazelnut-velvet-latte`)
- **Responses:**
  - `200 OK`: Product found and returned.
  - `400 Bad Request`: Missing identifier or invalid 24-character ObjectId format.
  - `404 Not Found`: No available product found matching the given identifier.

### Orders & Checkout APIs

- **`POST /api/orders.php?action=quote`**: Computes an authoritative pre-flight quote for cart items without database persistence.
- **`POST /api/orders.php`**: Securely creates a customer pickup order.
  - Requires authenticated session (`customer` or `admin`).
  - Requires valid CSRF token (`X-CSRF-Token` or `csrf_token` body field).
  - Requires `idempotency_key` to prevent duplicate submissions.
  - Validates and recalculates every item price and customization modifier against live MongoDB products.
  - Verifies `expected_total` to prevent client price tampering (`HTTP 409 Conflict` on discrepancy).
  - Returns `201 Created` with full order document.
- **`GET /api/orders.php`**: Retrieves the authenticated customer's order history, sorted newest first (`HTTP 200`).
- **`GET /api/order.php?id=...` or `?ref=...`**: Retrieves a single order document. Strict customer ownership enforced (`HTTP 403 Forbidden` on mismatch, `HTTP 404` if not found).

---

## MongoDB Orders Schema

Stored in collection `orders`:

```json
{
  "_id": "ObjectId",
  "orderReference": "BB-20261027-A79680",
  "customerId": "6ae08199eb96548efceb1d0a",
  "idempotencyKey": "9f2c694a-9b5b-417c-a0e2-63bcbb51d0ab",
  "items": [
    {
      "productId": "6ae08199eb96548efceb1d0c",
      "slug": "hazelnut-velvet-latte",
      "name": "Hazelnut Velvet Latte",
      "category": "coffee",
      "imageUrl": "/assets/images/hazelnut-latte.jpg",
      "basePrice": 240,
      "selectedOptions": {
        "size": { "id": "large", "name": "Large (360ml)", "priceModifier": 40 },
        "milk": { "id": "oat", "name": "Oat Milk", "priceModifier": 35 },
        "sweetness": { "id": "0", "name": "No Sugar (0%)", "priceModifier": 0 },
        "extras": [
          { "id": "espresso_shot", "name": "Extra Espresso Shot", "priceModifier": 45 }
        ]
      },
      "unitPrice": 360,
      "quantity": 1,
      "lineTotal": 360
    }
  ],
  "itemCount": 1,
  "subtotal": 360,
  "taxesAndFees": 0,
  "total": 360,
  "pickupInfo": {
    "customerName": "Aarav Sharma",
    "customerPhone": "9876543210",
    "customerEmail": "customer@brewandbloom.com",
    "pickupTime": "In 30 minutes",
    "specialInstructions": "Please package carefully."
  },
  "paymentMethod": "Pay at Café",
  "paymentStatus": "unpaid",
  "status": "pending",
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "2026-10-27T18:45:00Z",
      "note": "Order placed successfully by customer. Awaiting barista preparation."
    }
  ],
  "createdAt": "2026-10-27T18:45:00Z",
  "updatedAt": "2026-10-27T18:45:00Z"
}
```

---

## Testing & Verification

### Slice 4 Automated Verification Suite
Run the 25 automated test cases covering unauthenticated checkout protection, login redirection, CSRF verification, client-side price tampering detection, invalid options rejection, quantity bounds, server price calculation, idempotency replay, MongoDB persistence, order history retrieval, and cross-customer ownership security:

```powershell
python C:\Users\priyali\.gemini\antigravity-ide\brain\15a06ac6-d8b0-4a64-bcae-73da7f8b768e\scratch\test_slice4_orders.py
```

### Full Regression Test Suite (Slices 1–4)
Run all test suites sequentially to ensure zero regression across the entire application:

```powershell
python C:\Users\priyali\.gemini\antigravity-ide\brain\15a06ac6-d8b0-4a64-bcae-73da7f8b768e\scratch\test_slice2_auth.py; python C:\Users\priyali\.gemini\antigravity-ide\brain\15a06ac6-d8b0-4a64-bcae-73da7f8b768e\scratch\verify_slice3_e2e.py; python C:\Users\priyali\.gemini\antigravity-ide\brain\15a06ac6-d8b0-4a64-bcae-73da7f8b768e\scratch\test_slice4_orders.py
```

---

## Accessibility & Quality Standards (WCAG 2.1 AA)

- Strict HTML5 semantic landmark structure (`<header>`, `<nav>`, `<main>`, `<footer>`).
- Unbroken heading hierarchy (`<h1>` → `<h2>` → `<h3>`). Exactly one `<h1>` per view.
- Explicit `<label>` elements associated with every form input.
- High contrast ratios (dark espresso text `#241812` on ivory `#FAF7F2` achieves >11:1).
- Distinct keyboard `:focus-visible` styling with 3px caramel outline and offset.
- Screen reader dynamic announcements powered by `aria-live="polite"`.
