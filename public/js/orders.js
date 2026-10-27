/**
 * Brew & Bloom — Customer Order History Controller
 * Vanilla JS • Clean Order Cards & Progress Stages
 */

(function () {
    'use strict';

    let currentUser = null;

    const STAGE_STEPS = [
        { key: 'pending', label: '1. Order Placed' },
        { key: 'preparing', label: '2. Preparing' },
        { key: 'ready', label: '3. Ready at Counter' },
        { key: 'completed', label: '4. Completed' },
    ];

    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Verify Authentication
        currentUser = await window.BrewAuth.getCurrentUser();
        if (!currentUser) {
            window.location.href = 'login.html?redirect=orders.html';
            return;
        }

        // 2. Fetch and render customer orders
        await loadOrders();
    });

    /**
     * Fetches the authenticated customer's orders from the backend API.
     */
    async function loadOrders() {
        const container = document.getElementById('orders-container');
        if (!container) return;

        try {
            const response = await fetch('api/orders.php');
            if (response.status === 401) {
                window.location.href = 'login.html?redirect=orders.html';
                return;
            }

            const result = await response.json();

            if (response.ok && result.success) {
                const orders = result.data || [];
                renderOrdersList(orders);
            } else {
                container.innerHTML = `
                    <div class="form-alert form-alert-error" role="alert" style="margin: 20px 0;">
                        ${escapeHtml(result.message || 'Could not load your orders. Please refresh the page.')}
                    </div>
                `;
            }
        } catch (err) {
            console.error('Error loading orders:', err);
            container.innerHTML = `
                <div class="form-alert form-alert-error" role="alert" style="margin: 20px 0;">
                    Connection error while loading orders. Please check your network and refresh.
                </div>
            `;
        }
    }

    /**
     * Renders orders list or empty state.
     */
    function renderOrdersList(orders) {
        const container = document.getElementById('orders-container');
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
                    <div style="font-size: 2.8rem; margin-bottom: 16px;" aria-hidden="true">☕</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 8px;">No Orders Placed Yet</h2>
                    <p style="color: var(--color-text-muted); max-width: 460px; margin: 0 auto 24px;">
                        You have not placed any orders yet. Explore our freshly brewed coffees, teas, and pastries to get started.
                    </p>
                    <a href="menu.html" class="btn btn-primary">
                        Browse Café Menu &rarr;
                    </a>
                </div>
            `;
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const highlightedRef = urlParams.get('highlight');

        container.innerHTML = orders.map((order) => {
            const isHighlighted = (order.orderReference === highlightedRef);
            return renderSingleOrderCard(order, isHighlighted);
        }).join('');
    }

    /**
     * Generates HTML markup for an individual order card.
     */
    function renderSingleOrderCard(order, isHighlighted) {
        const status = order.status || 'pending';
        const statusClass = `order-status-${status}`;
        const statusLabel = formatStatusLabel(status);

        // Date formatting
        let dateFormatted = 'Recently';
        if (order.createdAt) {
            try {
                const d = new Date(order.createdAt);
                dateFormatted = d.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            } catch (e) {
                dateFormatted = order.createdAt;
            }
        }

        const pickupInfo = order.pickupInfo || {};
        const items = order.items || [];

        // Stepper markup
        const stepperHtml = renderStepper(status);

        // Items table rows
        const itemsRowsHtml = items.map((it) => {
            const opts = it.selectedOptions || {};
            const optList = [];

            if (opts.size && opts.size.name) optList.push(opts.size.name);
            if (opts.milk && opts.milk.name) optList.push(opts.milk.name);
            if (opts.sweetness && opts.sweetness.name) optList.push(opts.sweetness.name);
            if (opts.warming && opts.warming.name) optList.push(opts.warming.name);
            if (Array.isArray(opts.extras)) {
                opts.extras.forEach((ex) => optList.push(ex.name));
            }

            const optPills = optList.map((str) => `
                <span class="custom-badge" style="font-size:0.75rem; padding: 2px 8px; margin-right: 4px; margin-top: 4px; display:inline-block;">
                    ${escapeHtml(str)}
                </span>
            `).join('');

            return `
                <tr>
                    <td style="display:flex; align-items:center; gap:12px;">
                        <img 
                            src="${escapeHtml(it.imageUrl || '/assets/images/espresso.jpg')}" 
                            alt="${escapeHtml(it.name)}" 
                            style="width:44px; height:44px; border-radius:var(--radius-sm); object-fit:cover; border:1px solid var(--color-border);"
                            loading="lazy"
                        >
                        <div>
                            <strong>${escapeHtml(it.name)}</strong>
                            <div>${optPills}</div>
                        </div>
                    </td>
                    <td style="text-align:center;">&times; ${it.quantity}</td>
                    <td style="text-align:right;">₹${it.unitPrice.toLocaleString('en-IN')}</td>
                    <td style="text-align:right; font-weight:600; color:var(--color-espresso);">
                        ₹${it.lineTotal.toLocaleString('en-IN')}
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <article 
                class="order-card" 
                id="order-${escapeHtml(order.orderReference)}"
                style="${isHighlighted ? 'outline: 2px solid var(--color-caramel);' : ''}"
                aria-labelledby="ref-${escapeHtml(order.id)}"
            >
                <!-- Card Header -->
                <div class="order-card-header">
                    <div class="order-ref-group">
                        <span class="order-ref-badge" id="ref-${escapeHtml(order.id)}">
                            ${escapeHtml(order.orderReference)}
                        </span>
                        <span class="order-date-text">Placed on ${escapeHtml(dateFormatted)}</span>
                    </div>

                    <div>
                        <span class="order-status-badge ${statusClass}">
                            <span>${escapeHtml(statusLabel)}</span>
                        </span>
                    </div>
                </div>

                <!-- Tracker Stepper (for active & completed orders) -->
                ${status !== 'cancelled' ? `
                    <div class="order-tracker-card" aria-label="Order Preparation Stage">
                        ${stepperHtml}
                    </div>
                ` : `
                    <div style="padding: 14px 20px; background-color: #FEE2E2; color: #991B1B; font-size: 0.875rem;">
                        This order was cancelled.
                    </div>
                `}

                <!-- Card Body -->
                <div class="order-card-body">
                    <div class="order-details-grid">
                        <div class="order-info-block">
                            <strong>Pickup Details:</strong>
                            <div>Name: ${escapeHtml(pickupInfo.customerName || currentUser.name)}</div>
                            <div>Phone: ${escapeHtml(pickupInfo.customerPhone || '—')}</div>
                            <div>Pickup Window: <strong>${escapeHtml(pickupInfo.pickupTime || 'ASAP')}</strong></div>
                            ${pickupInfo.specialInstructions ? `
                                <div style="margin-top:4px; font-style:italic; color:var(--color-text);">
                                    Note: &ldquo;${escapeHtml(pickupInfo.specialInstructions)}&rdquo;
                                </div>
                            ` : ''}
                        </div>

                        <div class="order-info-block">
                            <strong>Payment &amp; Collection:</strong>
                            <div>Method: <strong>${escapeHtml(order.paymentMethod || 'Pay at Café')}</strong></div>
                            <div>Status: <span class="badge badge-caramel" style="font-size:0.75rem; text-transform:uppercase;">${escapeHtml(order.paymentStatus || 'Unpaid')}</span></div>
                            <div style="margin-top:4px; font-size:0.8125rem;">
                                Payment collected at counter via Cash, UPI, or Card.
                            </div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <table class="order-items-table" aria-label="Items in order ${escapeHtml(order.orderReference)}">
                        <thead>
                            <tr>
                                <th scope="col">Item</th>
                                <th scope="col" style="text-align:center;">Qty</th>
                                <th scope="col" style="text-align:right;">Price</th>
                                <th scope="col" style="text-align:right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsRowsHtml}
                        </tbody>
                    </table>
                </div>

                <!-- Card Footer -->
                <div class="order-card-footer">
                    <span style="font-size:0.875rem; color:var(--color-text-muted);">
                        ${order.itemCount || items.length} ${order.itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <span class="order-total-callout">
                        Total: ₹${order.total.toLocaleString('en-IN')}
                    </span>
                </div>
            </article>
        `;
    }

    /**
     * Generates a 4-step visual progress stepper for an order.
     */
    function renderStepper(currentStatus) {
        const statusIdxMap = {
            pending: 0,
            preparing: 1,
            ready: 2,
            completed: 3,
        };

        const activeIndex = statusIdxMap[currentStatus] ?? 0;

        const stepsHtml = STAGE_STEPS.map((step, idx) => {
            let stateClass = '';
            let stepIcon = String(idx + 1);

            if (idx < activeIndex) {
                stateClass = 'is-completed';
                stepIcon = '✓';
            } else if (idx === activeIndex) {
                stateClass = 'is-active';
            }

            return `
                <div class="stepper-step ${stateClass}">
                    <div class="stepper-circle" aria-hidden="true">${stepIcon}</div>
                    <span class="stepper-label">${escapeHtml(step.label)}</span>
                </div>
            `;
        }).join('');

        return `<div class="order-stepper">${stepsHtml}</div>`;
    }

    function formatStatusLabel(status) {
        const map = {
            pending: 'Order Placed',
            preparing: 'Preparing',
            ready: 'Ready for Pickup',
            completed: 'Completed',
            cancelled: 'Cancelled',
        };
        return map[status] || status;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
})();
