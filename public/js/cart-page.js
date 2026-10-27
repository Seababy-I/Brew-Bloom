/**
 * Brew & Bloom — Cart Page Controller
 * Vanilla JS • Fully Accessible • Real-time Re-calculation
 */

(function () {
    'use strict';

    let cartContainer = null;

    document.addEventListener('DOMContentLoaded', () => {
        cartContainer = document.getElementById('cart-page-container');
        renderCartPage();

        // Listen for updates from other tabs or actions
        window.addEventListener('cart:updated', () => {
            renderCartPage();
        });
    });

    function renderCartPage() {
        if (!cartContainer) return;

        const items = window.BrewCart.getItems();

        if (items.length === 0) {
            renderEmptyCart();
            return;
        }

        const subtotal = window.BrewCart.getSubtotal();
        const totalCount = window.BrewCart.getTotalCount();

        let itemsHtml = items.map((item) => {
            const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);

            // Format human-readable customizations
            const details = [];
            const opts = item.selectedOptions || {};

            if (opts.size && opts.size.name) {
                const mod = opts.size.priceModifier ? ` (+₹${opts.size.priceModifier})` : '';
                details.push(`Size: ${escapeHtml(opts.size.name)}${mod}`);
            }
            if (opts.milk && opts.milk.name) {
                const mod = opts.milk.priceModifier ? ` (+₹${opts.milk.priceModifier})` : '';
                details.push(`Milk: ${escapeHtml(opts.milk.name)}${mod}`);
            }
            if (opts.sweetness && opts.sweetness.name) {
                details.push(`Sweetness: ${escapeHtml(opts.sweetness.name)}`);
            }
            if (opts.warming && opts.warming.name) {
                details.push(`Serving: ${escapeHtml(opts.warming.name)}`);
            }
            if (Array.isArray(opts.extras) && opts.extras.length > 0) {
                const extrasText = opts.extras.map((ex) => `${escapeHtml(ex.name)} (+₹${ex.priceModifier})`).join(', ');
                details.push(`Extras: ${extrasText}`);
            }

            const detailsHtml = details.length > 0
                ? `<ul class="cart-item-customizations-list">${details.map((d) => `<li>${d}</li>`).join('')}</ul>`
                : '<span class="cart-item-standard-tag">Standard Preparation</span>';

            return `
                <article class="cart-item-card" id="cart-item-${escapeHtml(item.cartItemId)}">
                    <img 
                        src="${escapeHtml(item.imageUrl)}" 
                        alt="${escapeHtml(item.name)}" 
                        class="cart-item-thumbnail"
                        loading="lazy"
                        onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'"
                    >
                    <div class="cart-item-details">
                        <div class="cart-item-title-row">
                            <h3 class="cart-item-name">${escapeHtml(item.name)}</h3>
                            <span class="cart-item-unit-price">₹${Number(item.unitPrice).toLocaleString('en-IN')} each</span>
                        </div>

                        ${detailsHtml}

                        <div class="cart-item-controls-row">
                            <!-- Quantity stepper -->
                            <div class="stepper-controls stepper-controls-sm" aria-label="Quantity for ${escapeHtml(item.name)}">
                                <button 
                                    type="button" 
                                    class="stepper-btn btn-cart-qty-minus" 
                                    data-cart-id="${escapeHtml(item.cartItemId)}"
                                    data-qty="${item.quantity}"
                                    aria-label="Decrease quantity of ${escapeHtml(item.name)}"
                                >
                                    &minus;
                                </button>
                                <span class="stepper-value-display" aria-live="polite">${item.quantity}</span>
                                <button 
                                    type="button" 
                                    class="stepper-btn btn-cart-qty-plus" 
                                    data-cart-id="${escapeHtml(item.cartItemId)}"
                                    data-qty="${item.quantity}"
                                    aria-label="Increase quantity of ${escapeHtml(item.name)}"
                                >
                                    &plus;
                                </button>
                            </div>

                            <!-- Line total -->
                            <div class="cart-item-total">
                                <small>Line Total</small>
                                <strong>₹${lineTotal.toLocaleString('en-IN')}</strong>
                            </div>

                            <!-- Remove item button -->
                            <button 
                                type="button" 
                                class="btn-cart-remove" 
                                data-cart-id="${escapeHtml(item.cartItemId)}"
                                data-name="${escapeHtml(item.name)}"
                                aria-label="Remove ${escapeHtml(item.name)} from cart"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        cartContainer.innerHTML = `
            <div class="cart-layout">
                <!-- Left: Items list -->
                <section class="cart-items-section" aria-label="Cart Line Items">
                    <div class="cart-items-header">
                        <h2>Your Selections (${totalCount} ${totalCount === 1 ? 'item' : 'items'})</h2>
                        <button type="button" class="btn-clear-cart" id="btn-prompt-clear-cart">
                            Clear Entire Cart
                        </button>
                    </div>

                    <div id="clear-confirm-banner" class="clear-confirm-banner" style="display:none;" role="alert">
                        <span>Are you sure you want to remove all items from your cart?</span>
                        <div class="clear-confirm-actions">
                            <button type="button" class="btn btn-primary btn-sm" id="btn-confirm-clear-yes">Yes, Clear</button>
                            <button type="button" class="btn btn-secondary btn-sm" id="btn-confirm-clear-no">Cancel</button>
                        </div>
                    </div>

                    <div class="cart-items-list">
                        ${itemsHtml}
                    </div>

                    <div style="margin-top: 24px;">
                        <a href="menu.html" class="btn btn-secondary">
                            &larr; Add More Items from Menu
                        </a>
                    </div>
                </section>

                <!-- Right: Summary -->
                <aside class="cart-summary-section" aria-label="Order Cost Summary">
                    <div class="cart-summary-card">
                        <h2 class="cart-summary-title">Summary &amp; Total</h2>

                        <div class="summary-line">
                            <span>Subtotal (${totalCount} ${totalCount === 1 ? 'item' : 'items'})</span>
                            <span>₹${subtotal.toLocaleString('en-IN')}</span>
                        </div>

                        <div class="summary-line">
                            <span>Café Taxes &amp; Packaging</span>
                            <span class="badge badge-sage" style="font-size:0.75rem;">Included</span>
                        </div>

                        <div class="summary-line summary-grand-total">
                            <span>Estimated Total</span>
                            <strong class="grand-total-amount">₹${subtotal.toLocaleString('en-IN')}</strong>
                        </div>

                        <div class="cart-security-notice">
                            <small>
                                🔒 <strong>Server-Verified Pricing:</strong> Cart contents are kept securely in your local browser. Unit prices, options, and live product availability are re-calculated and verified independently on the server when submitting your order.
                            </small>
                        </div>

                        <a 
                            href="checkout.html" 
                            class="btn btn-primary btn-block btn-checkout-trigger" 
                            id="btn-checkout-notice"
                        >
                            Proceed to Pickup Checkout
                        </a>
                    </div>
                </aside>
            </div>
        `;

        bindCartEvents();
    }

    function renderEmptyCart() {
        cartContainer.innerHTML = `
            <div class="state-message-box" role="status">
                <span class="state-message-icon" aria-hidden="true">🧺</span>
                <h2 class="state-message-title">Your Cart is Currently Empty</h2>
                <p class="state-message-desc">
                    Looks like you haven't added any handcrafted coffees, single-estate Himalayan teas, or artisanal pastries yet.
                </p>
                <div style="margin-top: 24px;">
                    <a href="menu.html" class="btn btn-primary">
                        Browse the Café Menu
                    </a>
                </div>
            </div>
        `;
    }

    function bindCartEvents() {
        // Minus quantity
        cartContainer.querySelectorAll('.btn-cart-qty-minus').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-cart-id');
                const curQty = parseInt(btn.getAttribute('data-qty'), 10) || 1;
                window.BrewCart.updateQuantity(id, curQty - 1);
            });
        });

        // Plus quantity
        cartContainer.querySelectorAll('.btn-cart-qty-plus').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-cart-id');
                const curQty = parseInt(btn.getAttribute('data-qty'), 10) || 1;
                window.BrewCart.updateQuantity(id, curQty + 1);
            });
        });

        // Remove item
        cartContainer.querySelectorAll('.btn-cart-remove').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-cart-id');
                const name = btn.getAttribute('data-name');
                if (confirm(`Remove "${name}" from your cart?`)) {
                    window.BrewCart.removeItem(id);
                }
            });
        });

        // Clear cart prompt
        const promptClearBtn = document.getElementById('btn-prompt-clear-cart');
        const confirmBanner = document.getElementById('clear-confirm-banner');
        const confirmYes = document.getElementById('btn-confirm-clear-yes');
        const confirmNo = document.getElementById('btn-confirm-clear-no');

        if (promptClearBtn && confirmBanner && confirmYes && confirmNo) {
            promptClearBtn.addEventListener('click', () => {
                confirmBanner.style.display = 'flex';
                confirmYes.focus();
            });

            confirmNo.addEventListener('click', () => {
                confirmBanner.style.display = 'none';
                promptClearBtn.focus();
            });

            confirmYes.addEventListener('click', () => {
                window.BrewCart.clearCart();
            });
        }

        // Checkout button: proceed to checkout page
        const checkoutBtn = document.getElementById('btn-checkout-notice');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                window.location.href = 'checkout.html';
            });
        }
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
