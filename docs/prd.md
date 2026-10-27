ICT 3131  /  WEB TECHNOLOGIES


# Brew & Bloom


**THE SMART CAFÉ EXPERIENCE**

**Product Requirements Document**

Functional scope, UX standards, architecture, database design, implementation milestones and acceptance tests.




| STATUS | Planning — not yet implemented |

| --- | --- |

| STACK | HTML • CSS • JavaScript • PHP • MongoDB |

| TEAM | 2 members | Names and IDs to be added |




PROJECT DRAFT  •  27 OCTOBER 2026


# Document map


**01   **Product summary & success conditions

**02   **Users, permissions & user journeys

**03   **Release scope and feature priorities

**04   **Detailed functional requirements

**05   **User experience and page inventory

**06   **System architecture & integrations

**07   **Database model

**08   **API contract

**09   **Non-functional requirements & security

**10   **Acceptance testing & definition of done

**11   **Delivery plan, ownership & risks

**12   **Coursework traceability & open decisions


# 1. Product summary & success conditions


PRODUCT VISION

Brew & Bloom is a responsive, database-backed café ordering and management platform. Customers can discover products, customize beverages, place pickup orders, track preparation and (in the enhanced scope) reserve tables and leave reviews. Café staff manage products and incoming orders through a protected admin dashboard.




| PRIMARY DESIGN PRINCIPLEBuild a convincing end-to-end product, not disconnected demo pages. Every critical action should update shared state through PHP APIs and persist to MongoDB. |

| --- |





## 1.1 Problem and opportunity


Conventional brochure-style café sites offer menus but limited interaction. This project models a café journey from discovery through fulfillment, showing core web-technology concepts and real CRUD operations.


## 1.2 Objectives and measurable success





| ID | Target | How success will be demonstrated |

| --- | --- | --- |

| G-01 | At least six complete features | Live demonstration of the six MVP modules with the same test account. |

| G-02 | Persistent database | Refresh/restart the UI; stored accounts, menu items and orders remain available. |

| G-03 | End-to-end ordering | Customer order appears in admin; status changes appear back in customer view. |

| G-04 | Course-aligned frontend | HTML5 semantic structure, custom CSS and vanilla JS; no React/Tailwind. |

| G-05 | Accessible UI | All forms labeled, contrast verified, keyboard operation and text errors. |

| G-06 | Presentation readiness | GitHub code, screenshots, report, documented role split and demo dataset. |





## 1.3 Explicit non-goals


Version 1 excludes real card/UPI charging, delivery routing, production inventory integration, live GPS tracking, a native mobile app and automatic café hardware connections. Checkout is a simulated pickup-order confirmation, not a payment transaction.


# 2. Users, permissions & user journeys





| Role | Access | Key jobs |

| --- | --- | --- |

| Guest | Public pages | Browse product categories, search menu, view item details. |

| Customer | Public + authenticated | Save orders, track status, see order history; reserve and review in enhanced release. |

| Admin / staff | Authorized back-office pages | Manage menu items, process orders, monitor reservations/reviews, view basic activity summary. |





## 2.1 Core customer journey


Open homepage → browse/search menu → select an item → customize options → add to cart → sign in or register → confirm pickup order → receive order number → view order status and history.


## 2.2 Core staff journey


Sign in with staff credentials → open protected order dashboard → inspect pending order and price breakdown → update order from Pending to Preparing to Ready to Completed → customer sees the change when the page refreshes or polls.


## 2.3 Reservation journey (enhanced scope)


Customer selects date, arrival time and party size → server checks capacity/availability → confirms a reservation with reference number → admin views and manages it. Availability must be checked on the server before a reservation is saved.


# 3. Release scope and feature priorities





| Priority | Module | Outcome / evidence |

| --- | --- | --- |

| MVP / P0 | F01 Account & role access | Customer account persists; administrator is blocked from ordinary-user privileges and vice versa. |

| MVP / P0 | F02 Menu & discovery | Products load from MongoDB; search and category filters work. |

| MVP / P0 | F03 Customization | Valid option selections update the displayed price. |

| MVP / P0 | F04 Cart & order placement | Quantities and final totals are correct; order saves with item snapshots. |

| MVP / P0 | F05 Order history & status | Customer can see own orders and their latest status. |

| MVP / P0 | F06 Admin management | Admin CRUD menu and transitions orders through valid statuses. |

| Next / P1 | F07 Table reservations | Validated bookings with basic slot conflict prevention. |

| Next / P1 | F08 Reviews & ratings | Customers can submit and see reviews with server validation. |

| Optional / P2 | F09 Sales overview | Read-only summary from persisted orders; no fabricated charts. |





# 4. Detailed functional requirements



## F01  Registration, login and roles


Email + password registration; password securely hashed on server; session-based login/logout; customer and admin roles; clear validation errors; redirect authenticated users appropriately. Admin role must be provisioned by an authorized setup process.

**Acceptance: ****Unique email; incorrect password rejected; logout invalidates session; customer cannot open admin APIs.**


## F02  Menu and discovery


Menu items are loaded asynchronously from the database, with title, description, image, category, base price, availability and customizable options. Implement query search, category filters and item details.

**Acceptance: ****Query and category show correct results; empty-results message appears; unavailable products cannot be ordered.**


## F03  Product customization


Permit available drink sizes, milk alternatives, sugar level and extras. Only options defined for that product may be selected. Display running subtotal for quantity and options.

**Acceptance: ****Changing size/extras updates preview; required options enforced; server recomputes price independently.**


## F04  Cart and checkout


Add customized line items to cart; edit quantities and remove items; show line-item and total amounts in INR. Checkout captures pickup name/time note if supported, then persists order. No real payment capture.

**Acceptance: ****Cart totals consistent; empty cart cannot place order; generated order has unique reference; server rejects tampered price.**


## F05  Order tracking/history


Authenticated customers see only their own orders and a readable status timeline. Version 1 uses periodic polling or manual refresh instead of real-time sockets.

**Acceptance: ****Status updates after admin action; previous orders retained; unauthorized access to others’ orders denied.**


## F06  Admin management


Admin adds/edits/deactivates products and sees incoming orders; updates status according to allowed workflow; displays order totals and selected customizations.

**Acceptance: ****Product CRUD reflected on menu; pending→preparing→ready→completed works; invalid transition rejected.**


## F07  Reservations


Booking form: date, time, party size, optional note. Validate future slot, operating hours and capacity; allow customer cancellation based on stated rules; admin can view bookings.

**Acceptance: ****Two conflicting reservations cannot exceed configured capacity; valid booking creates reference; validation visible in text.**


## F08  Reviews and ratings


Authenticated customers submit a 1–5 rating and written review; sanitize display; display rating summary and moderation controls for admin.

**Acceptance: ****Invalid rating refused; stored review appears with author alias; unsafe HTML is escaped.**


## F09  Sales snapshot (optional)


Admin summary of completed orders, top ordered menu items and approximate revenue from recorded demo orders.

**Acceptance: ****Metrics are queried from MongoDB, distinguish completed from canceled, and never claim real sales.**


# 5. User experience and page inventory



## 5.1 UI direction


Brand personality: warm, cozy, editorial and premium without sacrificing readability. Suggested palette: espresso #37271E, coffee brown #74513A, warm cream #F6F0E8, sage #66765B, terracotta #C08361. Use real/licensed imagery or authored assets and provide descriptive alt text.




| Area | Required design behavior |

| --- | --- |

| Navigation | Persistent brand link; menu, cart and account destinations; active state and visible keyboard focus. |

| Homepage | Hero with primary “Explore menu” action; featured category cards; café story snippet. |

| Menu | Search box, clear category filters, product cards, empty-state handling and accessible add-to-cart action. |

| Customization | Labeled groups (e.g., size/milk/extras); live total; clear selected options. |

| Checkout | Order summary, validations, submit feedback; never request bank/card credentials. |

| Orders | Readable status text and order detail; no color-only indication. |

| Admin | Compact tables/cards, editable forms with confirmations, clear success/error notices. |

| Mobile | Single-column shopping flows, touch-friendly buttons, no horizontal overflow. |





## 5.2 Page routes / views





| Public / customer | Admin |

| --- | --- |

| index.html — Home | admin/index.html — Dashboard |

| menu.html — Menu and filters | admin/products.html — Menu management |

| product.html?id=... — Product details | admin/orders.html — Order management |

| cart.html — Cart | admin/reservations.html — P1 |

| login.html / register.html | admin/reviews.html — P1 |

| checkout.html — Order confirmation |  |

| orders.html — History/status |  |

| reservations.html — P1 |  |

| reviews.html — P1 |  |





# 6. System architecture & integrations


*Figure 1. Proposed system architecture. The browser never accesses MongoDB directly.*


## 6.1 Chosen stack





| Layer | Choice | Rationale |

| --- | --- | --- |

| Frontend | HTML5, CSS3, vanilla JavaScript | Directly reflects course topics; no framework transpilation. |

| Server | PHP (version compatible with MongoDB extension) | Server-side validation, sessions and business logic; course-aligned PHP. |

| Database | MongoDB (local or Atlas) | Persistence for products, users, carts/orders and reservations. |

| Communication | Fetch API / JSON over HTTPS or localhost | AJAX-driven updates without page reload. |

| Source | Git + GitHub | Required source repository and audit trail. |

| Demo hosting | Compatible PHP host; reliable local fallback | Any hosted environment must have MongoDB PHP driver and database connectivity. |





## 6.2 High-level implementation rules


Keep front-end files in /public and server endpoints in /api; do not expose MongoDB credentials to JavaScript.

All privileged operations must authenticate server-side; hiding admin buttons is insufficient.

Use PHP sessions with secure cookie settings, password_hash/password_verify, CSRF protection for cookie-authenticated writes, parameter validation and escaped output.

Use environment variables for secrets and provide a safe .env.example file; never commit real credentials.

Develop the database connection as a separate reusable PHP module; explicitly handle driver/configuration errors.


# 7. Database model


The following collection design is a starting point; MongoDB document structures may be refined during development. IDs are stored as ObjectIds; all time values use UTC in storage and local time for display.




| Collection | Representative fields | Key rule / index |

| --- | --- | --- |

| users | _id, name, email, passwordHash, role, createdAt | Unique index on normalized email; no plaintext passwords. |

| products | _id, name, slug, category, description, priceINR, imageUrl, available, options, createdAt | Unique slug/SKU; server validates allowed option combinations. |

| orders | _id, orderCode, userId, items[], totalINR, status, statusHistory[], note, createdAt | Unique orderCode; index userId+createdAt; immutable snapshots of purchased item prices. |

| reservations (P1) | _id, userId, date, slot, partySize, status, note, createdAt | Check capacity atomically or under suitable concurrency control. |

| tables / capacity (P1) | _id, seats, active, locationTag | Optional per-table capacity model for reliable booking. |

| reviews (P1) | _id, userId, productId, rating, body, visible, createdAt | Rate 1–5; optional unique user-product index to limit duplicates. |





## 7.1 Order item snapshot


Each order item stores productId, productName, quantity, selectedOptions, unitPriceINR and lineTotalINR at checkout. This protects historic order totals when an administrator later changes a menu price.


## 7.2 Pricing and ordering rules


Currency is INR; store amounts as integer paise or integer whole-rupee amounts consistently—do not rely on floating-point currency math.

The server looks up the product and allowed option prices; a client-sent total is informational only.

An order begins at Pending, then Preparing, Ready, Completed. Cancellation requires an explicit rule and terminal state.

Unavailable/deleted products remain readable in historical orders via snapshots, but cannot be added to new orders.


# 8. API contract (proposed)


Illustrative same-origin PHP endpoints. Use JSON responses: { success, data, message, errors }. Routes may be consolidated during implementation while preserving behavior.




| Method | Path | What it does / permission |

| --- | --- | --- |

| POST | /api/auth/register.php | Register customer; public. |

| POST | /api/auth/login.php | Create login session; public. |

| POST | /api/auth/logout.php | Revoke login session; authenticated. |

| GET | /api/auth/me.php | Return safe current user profile. |

| GET | /api/products.php | Search/filter available products; public. |

| GET | /api/product.php?id= | Get one product and its option schema; public. |

| POST | /api/orders.php | Create validated order; customer. |

| GET | /api/orders.php | List own orders; customer. |

| GET | /api/order.php?id= | Read own order details; customer/admin. |

| POST | /api/admin/product.php | Create/update product; admin. |

| POST | /api/admin/order-status.php | Validate and apply status transition; admin. |

| POST | /api/reservations.php | Create reservation; customer, P1. |

| GET | /api/reservations.php | List own reservations; customer, P1. |

| POST | /api/reviews.php | Submit product review; customer, P1. |





# 9. Non-functional requirements & security





| ID | Requirement | Verification |

| --- | --- | --- |

| NFR-01 | Semantic, valid HTML with meaningful heading hierarchy and landmarks. | Document and validator inspection. |

| NFR-02 | WCAG 2.1 AA contrast targets: ≥4.5:1 normal text; ≥3:1 large text. | Contrast spot check across templates. |

| NFR-03 | Body text ≥16px with consistent spacing; keyboard operable controls and visible focus. | Keyboard-only walkthrough at phone/desktop widths. |

| NFR-04 | Labels tied to inputs; placeholders only hints; error feedback in text. | Form inspection with invalid values. |

| NFR-05 | Alt text for informative imagery; decorative images empty alt / aria-hidden. | Image audit; no unnecessary inaccessible media. |

| NFR-06 | Mobile/tablet/desktop responsive behavior. | Test 360px, 768px and 1280px widths. |

| NFR-07 | Passwords hashed; sessions secured; authorization checked on API. | Unprivileged API tests; inspect saved users. |

| NFR-08 | Server-side price and quantity checks; useful errors, no stack trace leaks. | Tampered request tests, invalid forms. |

| NFR-09 | Async interactions show loading/empty/error states. | Disable database/network and inspect feedback. |

| NFR-10 | No hardcoded secrets or payment collection. | Repository scan and checkout review. |





# 10. Acceptance testing & definition of done





| Test | Steps | Expected result |

| --- | --- | --- |

| AT-01 | Register → logout → login | Same account persists; password never visible in DB. |

| AT-02 | Search “latte” then filter to coffee | Only matching, currently available products appear. |

| AT-03 | Customize a drink, change quantity | Price updates consistently; invalid option blocked. |

| AT-04 | Alter total via browser developer tools; submit | PHP recomputes correct total or rejects payload. |

| AT-05 | Place order and open admin dashboard | Order appears with saved snapshot and Pending status. |

| AT-06 | Admin advances Pending → Preparing → Ready | Customer view shows updated readable status. |

| AT-07 | Customer requests someone else’s order | Server returns unauthorized/forbidden response. |

| AT-08 | Create, edit, disable menu item in admin | Public menu accurately reflects database update. |

| AT-09 | Submit blank/invalid forms with keyboard | Associated text errors, labeled fields and focus work. |

| AT-10 / P1 | Create conflicting reservation at capacity | System prevents overbooking and explains conflict. |

| AT-11 / P1 | Submit review with rating outside 1–5 | Server rejects invalid rating. |







| DEFINITION OF DONEA feature counts as complete only when it has working interface states, PHP validation/authorization, MongoDB persistence where relevant, error handling, and at least one successful manual test. |

| --- |





# 11. Delivery plan, ownership & risks





| Phase | Implementation focus | Exit criterion |

| --- | --- | --- |

| 1. Foundation | Repo, semantic page shells, CSS design system, sample menu layout, PHP/DB connection. | Navigation works; one API fetches database products. |

| 2. Customer MVP | Account, menu, customization, cart, checkout/order persistence. | New order saved from customer flow. |

| 3. Operations MVP | Admin menu CRUD, staff order queue, status updates and customer history. | Full customer → admin → customer demonstration works. |

| 4. Polish & enhancements | Reservation/review modules, responsive/accessibility audit, report/screenshots and rehearsal. | No critical bugs; rubric checklist and GitHub documentation complete. |





## 11.1 Suggested two-member ownership





| Member A — customer experience | Member B — platform & management |

| --- | --- |

| Semantic homepage, menu UX, search/filter | PHP authentication and user roles |

| Customization UX, cart and price previews | MongoDB schema, server price validation, checkout endpoint |

| Responsive CSS and UI components | Admin product management and status transitions |

| Reviews UI and frontend integration (P1) | Order history API and reservation logic (P1) |

| Keyboard/contrast accessibility QA | Security/API QA; deployment and seed script |




Both contributors should demonstrate at least two substantive features, review each other’s integration work, and commit to the shared repository. Adjust assignments according to actual progress; record the final split in the report.


## 11.2 Key risks and mitigations





| Risk | Mitigation |

| --- | --- |

| PHP–MongoDB driver configuration on demo laptop | Configure and test driver/Composer library at project start; preserve a verified local demo setup. |

| Too many incomplete features | Complete six P0 modules end-to-end before implementing reservations/reviews. |

| Order prices editable in browser | Recalculate trusted prices in PHP using MongoDB product rules. |

| Admin data accidentally public | Enforce authorization in all admin endpoints; test with customer session. |

| Presentation/demo network failure | Pre-seed database and test local service; keep static walkthrough/screenshots as backup evidence. |





# 12. Coursework traceability & open decisions





| Course / evaluation requirement | Implementation proof |

| --- | --- |

| Two-person team; each demonstrates 2 features | Ownership table, Git commits and live role-based demonstrations. |

| At least 6 functionalities | F01–F06 completed and tested; F07–F08 enhancements. |

| Full stack and compulsory database | HTML/CSS/JS + PHP + MongoDB, including real persisted orders. |

| Proper HTML/semantic tags and heading order | Semantic templates and audit checklist. |

| Contrast, readability and captions/alt text | WCAG-oriented UI checklist and screen captures. |

| Labels, hints, error text, instructions and keyboard | Validated registration, checkout and reservation forms. |

| GitHub link and report with screenshots/work split | README, project report, screenshots, feature ownership. |





## 12.1 Decisions to confirm with faculty/team


Confirm whether PHP + MongoDB is required, recommended or merely allowed (the provided course outcome names it).

Confirm whether the six required “functionalities” may be grouped as product modules as defined above.

Choose café opening hours, pickup policy, table capacity and initial demo menu; these are business configuration, not predetermined facts.

Confirm project submission date and any faculty-provided report formatting requirements.

SOURCE BASIS AND STATUS

Requirements drawn from the shared class announcement, evaluation-criteria screenshots, ICT 3131 course syllabus image and uploaded HTML/CSS/DHTML/AJAX/XML lecture slides. Business rules and endpoint names are proposed design decisions—not stated faculty requirements. This is a planning document; no implementation or test completion is claimed.


# Appendix A. Implementation handoff checklist





| Deliverable | Minimum required evidence |

| --- | --- |

| Repository structure | /public, /api, /config (server only), /database, /docs; README; .env.example; .gitignore. |

| Seed database | Sample products spanning coffee, tea and bakery; one authorized admin; demonstration customer accounts. |

| Setup instructions | PHP/Composer version, MongoDB extension requirement, database connection configuration, local launch steps. |

| API verification | Saved test examples for auth, menu retrieval, order submission, status changes and authorization. |

| UI proof | Screenshots at desktop/mobile width and a short recording or live walkthrough of one order lifecycle. |

| Submission check | GitHub link, report, final contribution matrix, limitations, screenshot appendix and reproducible demo. |





## Appendix A.1 Definition of a successful demonstration


The team can start from a clean browser session, complete a customer order, confirm it in MongoDB, change its status as an admin and retrieve the new status as the customer—all without manual database edits. If this workflow fails, optional features should be deferred until it passes.