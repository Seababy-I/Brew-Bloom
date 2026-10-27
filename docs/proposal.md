ICT 3131  /  WEB TECHNOLOGIES


# Brew & Bloom


**THE SMART CAFÉ EXPERIENCE**

**Project Proposal & Implementation Plan**

Coursework-oriented synopsis with objectives, modules, proposed implementation, work allocation, evaluation checklist and final-report placeholders.




| STATUS | Planning — not yet implemented |

| --- | --- |

| STACK | HTML • CSS • JavaScript • PHP • MongoDB |

| TEAM | 2 members | Names and IDs to be added |




PROJECT DRAFT  •  27 OCTOBER 2026


# 1. Project details





| Field | Details |

| --- | --- |

| Course | ICT 3131 — Web Technologies |

| Project title | Brew & Bloom — Smart Café Ordering and Management System |

| Team size | 2 students |

| Team members / IDs | [Member 1 name + ID] | [Member 2 name + ID] |

| Faculty / section | [To be added] |

| Current status | Proposed; implementation and testing pending |





# 2. Abstract


Brew & Bloom is a proposed full-stack web application that digitizes core café activities through an interactive customer website and a protected administrative dashboard. Customers will browse a dynamic product menu, customize beverages, manage a cart, place pickup orders and monitor order progress. Administrators will manage menu information and process customer orders. The planned application uses HTML5, CSS3 and vanilla JavaScript on the frontend, PHP for server-side logic, and MongoDB for persistent storage. AJAX/Fetch-based requests will update selected content without full-page reloads. Enhanced modules may include table reservations, customer reviews and basic order analytics. The project emphasizes semantic HTML, accessible forms, responsive styling, security-aware input validation, CRUD operations and a demonstrable customer-to-admin workflow.


# 3. Problem statement and motivation


Many small café websites display basic information but do not connect product discovery, customer ordering and staff operations. This project addresses that gap by creating one integrated interface where customer activity is saved in a database and reflected in staff workflows. It also provides a practical demonstration of the technologies in the Web Technologies course.


# 4. Objectives


Design a responsive, semantically structured and visually consistent café website using HTML5 and custom CSS.

Implement client-side interactivity with vanilla JavaScript, DOM events and form validation.

Retrieve and update server data asynchronously using AJAX/Fetch.

Use PHP and MongoDB to persist users, products, orders and relevant status information.

Implement at least six working functionalities and let each teammate demonstrate at least two.

Provide a protected admin view for product management and order handling.

Meet the shared usability and accessibility evaluation criteria and prepare reproducible project documentation.


# 5. Scope and proposed features





| Module | Customer / administrator functionality | Priority |

| --- | --- | --- |

| 1. Login and registration | User registration, authentication and role-based access. | Required |

| 2. Digital menu | Dynamic products, category browsing, searching and filtering. | Required |

| 3. Custom drink builder | Size, milk, sweetness and extra options with updated price. | Required |

| 4. Cart and checkout | Cart edits, total calculation and pickup-order confirmation. | Required |

| 5. Order history/tracking | View order records and status: Pending, Preparing, Ready, Completed. | Required |

| 6. Admin management | Manage products and incoming orders, update statuses. | Required |

| 7. Table reservations | Book available date/time slots; admin overview. | Enhanced |

| 8. Customer reviews | Submit and display ratings/reviews. | Enhanced |

| 9. Activity dashboard | Summary of completed demo orders and product popularity. | Optional |




Scope limit: this application is an educational prototype. Checkout does not capture real payments; order status reflects simulated café operations. Reservations depend on a configured table/capacity model.


# 6. Technologies used





| Component | Selected technology | Usage |

| --- | --- | --- |

| Structure | HTML5 | Semantic elements, forms, navigation, tables and content. |

| Presentation | CSS3 (custom) | Responsive grids, media queries, design tokens, transitions and accessibility. |

| Interactions | Vanilla JavaScript | DOM updates, search, cart operations and form behaviors. |

| Asynchronous communication | AJAX / Fetch API | Exchange JSON with server without full-page reload. |

| Server-side scripting | PHP | Authentication, authorization, API processing and validation. |

| Database | MongoDB | Store user accounts, products, orders, booking/review data. |

| Collaboration | Git and GitHub | Source version control and evidence of contributions. |





# 7. Proposed system architecture


*Figure 1. Proposed system architecture. The browser never accesses MongoDB directly.*

The client renders HTML pages and issues Fetch requests to PHP API endpoints. PHP authenticates requests, applies business rules and communicates with MongoDB using the supported PHP driver/library. MongoDB credentials remain on the server. The architecture supports real database changes rather than front-end-only mock data.


## 7.1 Typical order data flow


Customer selects menu item and permitted customizations.

JavaScript prepares the cart view and submits product IDs, quantities and options.

PHP validates the user and menu options, calculates trusted prices and saves an order in MongoDB.

Admin dashboard retrieves incoming orders; a staff member changes the status.

Customer order-history page retrieves the updated status asynchronously.


# 8. Database design (high level)





| Collection | Stored information | Used by |

| --- | --- | --- |

| users | Names, normalized emails, password hashes, roles. | Login, registration and access control. |

| products | Names, images, categories, pricing, availability and option schemas. | Dynamic menu and customization. |

| orders | Customer ID, purchased-item snapshots, total, status and timestamps. | Checkout, history and admin queue. |

| reservations [enhanced] | Customer ID, date, time, party size, status. | Availability booking and staff management. |

| reviews [enhanced] | Customer ID, menu item ID, rating and text. | Feedback display/moderation. |





# 9. User interface plan





| View | Purpose / main elements |

| --- | --- |

| Homepage | Brand hero, navigation, category highlights, café story and featured items. |

| Menu / product detail | Product cards, search/filter controls, pricing and customization forms. |

| Cart and checkout | Order list, quantity controls, total summary, validation and order confirmation. |

| Account and orders | Login/register, order history, status timeline and feedback. |

| Admin dashboard | Overview, product-management forms and live order queue. |

| Enhanced pages | Reservation form and customer reviews. |




Proposed art direction: espresso brown, warm cream, soft sage and terracotta accents; editorial typography; quality café photography. Design will prioritize contrast and legibility over decoration.


# 10. Accessibility and evaluation checklist


Use <!DOCTYPE html> and valid <html>, <head> and <body> structure; employ <header>, <nav>, <main> and <footer>.

Use h1 → h2 → h3 in logical order without skipping levels.

Check WCAG 2.1 AA contrast: 4.5:1 for standard text and 3:1 for large text.

Use body text of at least 16px, appropriate line-height and sufficient spacing.

Provide descriptive alt text; mark purely decorative images with empty alt or aria-hidden.

Provide captions or transcripts if video/audio content is introduced.

Associate every form input with a visible label or suitable accessible name; do not use placeholders as labels.

Explain errors in readable text, identify required fields and support Tab/Enter/Space keyboard interaction.

Test pages at desktop, tablet and mobile widths and verify focus visibility.


# 11. Division of work





| Member 1 — frontend and customer journey | Member 2 — backend and staff operations |

| --- | --- |

| Homepage and navigation; menu browsing and filters | Registration/login PHP endpoints and permissions |

| Customization UI; cart interaction and checkout views | MongoDB collections and validation-based order creation |

| Responsive CSS, accessibility fixes, reviews UI | Admin menu CRUD, order-status handling, reservations logic |

| Customer journey QA and screenshot capture | API/DB tests, seed data and environment documentation |




Both members will integrate features, review critical code paths and demonstrate at least two functionalities. Final contributions should be updated in the submitted report to reflect work actually completed.


# 12. Proposed development phases





| Stage | Tasks | Deliverable |

| --- | --- | --- |

| Phase 1 | Site wireframes, design system, static semantic pages, setup PHP/MongoDB. | UI shell and working database connection. |

| Phase 2 | Login, database-driven menu, customizer, cart, checkout. | Customer ordering workflow. |

| Phase 3 | Admin CRUD, order status, order history, integration tests. | Six required features working end-to-end. |

| Phase 4 | Optional bookings/reviews, accessibility review, bug fixes and presentation. | Stable demo, GitHub repository and report. |





# 13. Testing strategy and demonstration


Testing will combine manual UI walkthroughs, invalid-form tests, direct API authorization checks and database verification. Planned test scenarios include registration/login, filtering, customization pricing, checkout and order persistence, status changes, unauthorized admin access, empty/error states and mobile keyboard navigation.


## 13.1 Planned live demonstration sequence


Open branded homepage and browse/search the menu.

Choose a coffee, configure its options and inspect updated price.

Add to cart, modify quantity and submit a pickup order.

Show the saved order in the admin dashboard and change its status.

Switch to customer order history and show the updated state.

Demonstrate product CRUD and, if completed, reservation or review flow.


# 14. Required submission artifacts


GitHub repository link and README with setup instructions.

Complete source files (HTML, CSS, JavaScript, PHP) and database seed instructions.

Project report describing objectives, architecture, functionality and module ownership.

Screenshots of important completed pages and at least one end-to-end interaction.

Actual test results, known limitations and a final work-division table.

Prepared local or hosted demo environment and test accounts.


# 15. Final report completion sheet





| COMPLETE THESE FIELDS AFTER IMPLEMENTATIONDo not present planning claims as results. Replace each placeholder below with actual evidence from the completed build. |

| --- |







| Section | To insert before submission |

| --- | --- |

| Project contributors | Names, IDs, responsibilities and relevant GitHub commits. |

| Environment | PHP version, MongoDB environment, setup instructions and deployment URL if any. |

| Screenshots | Homepage; menu; customizer; cart; checkout confirmation; admin orders; status change. |

| Database evidence | Redacted sample product/order documents or screenshots with no passwords/secrets. |

| Testing | Pass/fail results for agreed acceptance tests and resolved defects. |

| Challenges | Actual integration, database or UI issues encountered and their solutions. |

| Conclusion | Implemented features, learning outcomes and planned future improvements. |





# 16. Expected outcome and future enhancements


The expected outcome is a functioning educational prototype that connects customer activities with administrative operations through a persistent database. Future enhancements may include loyalty points, notifications, improved seating allocation, inventory tracking, integrated payments and analytics—only after the required features are stable.

BASIS OF REQUIREMENTS AND PLANNING ASSUMPTIONS

Based on the class project instructions and evaluation screenshots, ICT 3131 course outcomes and the seven uploaded lecture sets (HTML, CSS, CSS specificity, DHTML, AJAX, XML). The course brief explicitly requires a two-person team, at least six functionalities, a full-stack build, GitHub source and a screenshot-based report with division of work; the user also confirmed that a database is compulsory. Technology choices, feature ordering and user flows are proposed project decisions.


# 17. Evidence register for the final report





| Evidence ID | Screenshot / proof to attach | Status |

| --- | --- | --- |

| E01 | Responsive homepage with header/navigation and primary call to action. | Pending |

| E02 | Database-backed menu with category filters and search. | Pending |

| E03 | Drink customization selections and calculated price. | Pending |

| E04 | Cart, checkout validations and order confirmation number. | Pending |

| E05 | Persisted order document, with private identifiers redacted. | Pending |

| E06 | Admin dashboard showing a customer order and status change. | Pending |

| E07 | Customer order history displaying the changed status. | Pending |

| E08 | Keyboard and mobile responsiveness/accessibility checks. | Pending |

| E09 | GitHub commits plus final two-person work allocation. | Pending |





## 17.1 Report completion note


Mark evidence as complete only after the matching feature works and the screenshot has been captured. If an enhanced feature is not implemented, list it under future scope rather than claiming it in the results.