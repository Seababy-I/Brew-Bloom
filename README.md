# Brew & Bloom — Smart Café Ordering & Management System

> Coursework Project: **ICT 3131 — Web Technologies**  
> Status: **Slice 1 Complete (Project Foundation + Dynamic Café Menu)**

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
│   └── ProductService.php      # Internal business logic and query filtering
├── public/                     # Web Document Root
│   ├── index.html              # Homepage with hero, features & story
│   ├── menu.html               # Dynamic interactive café menu
│   ├── api/
│   │   └── products.php        # Public JSON endpoint (GET /api/products.php)
│   ├── css/
│   │   └── style.css           # Global WCAG AA compliant design system
│   ├── js/
│   │   ├── main.js             # Shared navigation and accessibility scripts
│   │   └── menu.js             # Async menu search, filtering & rendering
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

---

## Accessibility & Quality Standards (WCAG 2.1 AA)

- Strict HTML5 semantic landmark structure (`<header>`, `<nav>`, `<main>`, `<footer>`).
- Unbroken heading hierarchy (`<h1>` → `<h2>` → `<h3>`). Exactly one `<h1>` per view.
- Explicit `<label>` elements associated with every form input.
- High contrast ratios (dark espresso text `#241812` on ivory `#FAF7F2` achieves >11:1).
- Distinct keyboard `:focus-visible` styling with 3px caramel outline and offset.
- Screen reader dynamic announcements powered by `aria-live="polite"`.
