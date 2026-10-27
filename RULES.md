# Brew & Bloom — Project Rules & Architecture Constraints

These rules are permanent hard constraints for the entire Brew & Bloom project. Every phase, feature, and commit must strictly adhere to them.

---

## 1. Technology Stack & Environment

### Frontend
- **Languages:** HTML5, CSS3, vanilla JavaScript (ES6+) only.
- **Strictly Forbidden:** No React, Vue, Angular, or frontend frameworks. No Tailwind CSS, Bootstrap, or utility CSS libraries. No bundlers or build tools (no Webpack, Vite, Parcel, PostCSS, Babel, etc.).
- **Dependencies:** Zero client-side third-party npm packages.

### Backend
- **Language & Runtime:** PHP (compatible with MongoDB extension).
- **Dependency Management:** Composer is permitted **only** for backend PHP dependencies.
- **Required Libraries:**
  - `mongodb/mongodb` (Composer MongoDB driver client library).
  - `vlucas/phpdotenv` (Environment variable management).
- **Communication:** Fetch API exchanging JSON payloads (`{ success, data, message, errors }`) over same-origin endpoints.

---

## 2. Directory Structure & Security Boundaries

### Directory Layout
- **Web Root:** Only `/public` is web-accessible.
- **Public Assets & UI:**
  - `/public/index.html`, `/public/menu.html`, etc.
  - `/public/css/` (vanilla CSS).
  - `/public/js/` (vanilla JavaScript).
  - `/public/assets/` (images, icons).
- **Public API Endpoints:** All public PHP endpoints must reside in `/public/api` (e.g. `/public/api/products.php`, `/public/api/orders.php`, `/public/api/auth/login.php`) so that requests to `/api/...` resolve correctly when `/public` is served as the web root.
- **Protected Internal Directories (Must stay outside `/public`):**
  - `/config` — database configuration and environment bootstrap.
  - `/database` — migrations, idempotent seed scripts (`seed.php`), connection helpers.
  - `/vendor` — Composer dependencies.
  - `.env` — environment configuration (database connection strings, secrets, app config).
  - Internal business logic and helpers.

### Security & Credentials
- **No Secrets in Repo:** Never commit `.env`. Provide a sanitized `.env.example`.
- **Database Connection:** Never hardcode database connection strings or passwords.
- **Passwords:** Always hash passwords with PHP's `password_hash($password, PASSWORD_DEFAULT)` and verify with `password_verify()`.
- **Admin Seeding:** Generate hashed passwords for seeded accounts. All database seed scripts must be idempotent.
- **Zero Frontend Trust:** Never trust prices, quantities, role flags, or user IDs sent from the client. Validate all inputs, recalculate all prices server-side from canonical database records, and enforce server-side session role checks on every administrative and customer endpoint.
- **Database Access:** The browser must never connect directly to MongoDB. Only backend PHP scripts communicate with the database.

---

## 3. Accessibility & UX Standards (WCAG 2.1 AA)

- **Semantic HTML:** Mandatory `<!DOCTYPE html>` on every page. Use proper semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- **Heading Order:** Heading levels must follow strict numerical order (`<h1>` → `<h2>` → `<h3>`) without skipping levels. Exactly one `<h1>` per view.
- **Form Accessibility:**
  - Every `<input>`, `<select>`, and `<textarea>` must have an explicitly associated `<label>` (via `for` / `id` or nesting).
  - Placeholders are hints only and must never replace labels.
  - Required fields must be visually and programmatically marked (`required`, `aria-required="true"`).
  - Validation errors must be rendered in clear text, not conveyed by color alone.
- **Readability & Contrast:**
  - Base body text must be at least `16px` with proper line-height.
  - Color contrast must meet WCAG AA standards (minimum 4.5:1 for standard text, 3:1 for large text and UI components).
- **Keyboard Navigation & Focus:**
  - All interactive elements must be fully operable via keyboard (`Tab`, `Enter`, `Space`, arrows).
  - A distinct, visible focus outline must be maintained across all focusable elements.
- **Images:** Descriptive `alt` text for all informative images; purely decorative images must use empty `alt=""` or `aria-hidden="true"`.
- **Dynamic Updates:** Use `aria-live` regions (e.g. `aria-live="polite"`) for asynchronous notifications, cart updates, and status messages.

---

## 4. State Management & Ordering Rules

- **Cart Lifecycle:** The shopping cart lives exclusively in client `localStorage`.
- **Order Placement:** The cart is sent to PHP only at checkout (product IDs, options, quantities).
- **Server-Side Pricing:** Total calculations on the client are previews only. PHP must independently look up each product and option price in MongoDB and compute the definitive line totals and final order total.
- **Price Integrity & Snapshots:** Orders must store an immutable snapshot of item names, options, unit prices, and line totals at the moment of checkout, protecting historical order records from subsequent menu price changes.
- **Currency Standard:** Currency is Indian Rupee (INR). Standardize currency storage as integers (paise or whole rupees) without floating-point arithmetic errors.

---

## 5. Development & Delivery Workflow

- **One Feature at a Time:** Build one feature at a time, working strictly end-to-end (Frontend UI, PHP API endpoints, MongoDB persistence).
- **Stop and Test:** Stop after each feature is complete and wait for user instructions before moving to the next feature.
- **Definition of Done:** Every completed feature must include:
  1. A fully functional, responsive, accessible frontend.
  2. Complete backend PHP integration and validation.
  3. Verified MongoDB persistence.
  4. Robust error handling (validation, failure states, empty states).
  5. Concrete, reproducible testing steps.
- **Honest Test Reporting:** Do not claim that code has been tested unless the test was actually executed. Report all verified items and explicitly declare anything that could not be verified.
- **Preserve Working Code:** Never overwrite or break working functionality when implementing subsequent features.
- **No Scope Creep:** Do not introduce unrequested features or alter the planned architecture without clear explanation and justification.
