# Brew & Bloom — Smart Café Ordering & Management System

> Coursework Project: **ICT 3131 — Web Technologies**  
> Status: **Slice 2 Complete (Authentication & Role-Based Access Control)**

Brew & Bloom is a responsive, database-backed café web application built with semantic HTML5, custom vanilla CSS3, vanilla JavaScript, PHP, and MongoDB Atlas.

---

## Architecture & Technology Stack

- **Frontend:** HTML5, Vanilla CSS3 (Custom Design System), Vanilla JavaScript (ES6+). Zero frontend frameworks, libraries, or build tools.
- **Backend:** PHP 8.5 with `mongodb/mongodb` driver client library and `vlucas/phpdotenv`.
- **Database:** MongoDB Atlas (Cloud Cluster: `brew_and_bloom`).
- **Communication:** Native Fetch API exchanging structured JSON (`{ success, data, message, errors }`).
- **Security Boundaries:** Only `/public` is exposed as the web document root. Secrets, database configuration (`/config`), seeding scripts (`/database`), and vendor dependencies reside securely outside the public root.

---

## Directory Structure

```text
Brew&Bloom/
├── config/
│   └── db.php                  # Safe MongoDB Atlas client & CLI ping test
├── database/
│   └── seed.php                # Idempotent database seeder (12 items + 2 users)
├── api/
│   ├── ProductService.php      # Internal business logic and query filtering
│   └── AuthService.php         # Session management, CSRF validation & RBAC guards
├── public/                     # Web Document Root
│   ├── index.html              # Homepage with hero, features & story
│   ├── menu.html               # Dynamic interactive café menu
│   ├── login.html              # Customer & Admin sign-in page
│   ├── register.html           # Customer registration page
│   ├── account.html            # Member portal & server-side RBAC verification
│   ├── api/
│   │   ├── products.php        # Public JSON endpoint (GET /api/products.php)
│   │   └── auth/
│   │       ├── csrf.php        # CSRF token endpoint (GET /api/auth/csrf.php)
│   │       ├── register.php    # Customer registration (POST /api/auth/register.php)
│   │       ├── login.php       # Session authentication (POST /api/auth/login.php)
│   │       ├── logout.php      # Session termination (POST /api/auth/logout.php)
│   │       ├── me.php          # Session profile (GET /api/auth/me.php)
│   │       └── admin-check.php # Protected test endpoint (GET /api/auth/admin-check.php)
│   ├── css/
│   │   └── style.css           # Global WCAG AA compliant design system
│   ├── js/
│   │   ├── main.js             # Shared navigation, auth sync, and accessibility
│   │   ├── menu.js             # Async menu search, filtering & rendering
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

### Authentication & RBAC APIs

- **`GET /api/auth/csrf.php`**: Retrieves a cryptographically secure CSRF token for the session.
- **`POST /api/auth/register.php`**: Registers a customer with validated inputs, password hash, and strictly assigned `customer` role.
- **`POST /api/auth/login.php`**: Authenticates customers and administrators using `password_verify()` and regenerates the session ID.
- **`POST /api/auth/logout.php`**: Invalidates the active session and clears the session cookie.
- **`GET /api/auth/me.php`**: Returns safe profile data for the active user, or `data: null` for guests.
- **`GET /api/auth/admin-check.php`**: Protected verification endpoint returning `HTTP 200` to administrators, `HTTP 403` to customers, and `HTTP 401` to unauthenticated guests.

---

## Testing & Verification

Run the complete Slice 2 automated test suite (16 tests covering CSRF, registration, duplicates, sessions, customer/admin login, RBAC restrictions, and catalog integrity):

```powershell
python C:\Users\priyali\.gemini\antigravity-ide\brain\15a06ac6-d8b0-4a64-bcae-73da7f8b768e\scratch\test_slice2_auth.py
```

---

## Accessibility & Quality Standards (WCAG 2.1 AA)

- Strict HTML5 semantic landmark structure (`<header>`, `<nav>`, `<main>`, `<footer>`).
- Unbroken heading hierarchy (`<h1>` → `<h2>` → `<h3>`). Exactly one `<h1>` per view.
- Explicit `<label>` elements associated with every form input.
- High contrast ratios (dark espresso text `#241812` on ivory `#FAF7F2` achieves >11:1).
- Distinct keyboard `:focus-visible` styling with 3px caramel outline and offset.
- Screen reader dynamic announcements powered by `aria-live="polite"`.
