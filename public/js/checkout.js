/**
 * Brew & Bloom — Checkout Page Controller
 * Vanilla JS • Strict Server Verification • CSRF & Idempotency Protected
 */

(function () {
    'use strict';

    let currentUser = null;
    let authoritativeTotal = 0;
    let idempotencyKey = '';
    let isSubmitting = false;

    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Generate or recover a checkout idempotency key
        initIdempotencyKey();

        // 2. Enforce Customer Authentication
        await checkAuthentication();

        // 3. Verify Cart & Fetch Authoritative Quote
        await loadAndQuoteCart();

        // 4. Bind Form Submission
        bindCheckoutForm();
    });

    /**
     * Ensures a stable idempotency key for this checkout attempt.
     */
    function initIdempotencyKey() {
        const storedKey = sessionStorage.getItem('brew_checkout_idempotency_key');
        if (storedKey && storedKey.length >= 16) {
            idempotencyKey = storedKey;
        } else {
            const randomBytes = (window.crypto && window.crypto.randomUUID)
                ? window.crypto.randomUUID()
                : 'bb_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
            idempotencyKey = randomBytes;
            sessionStorage.setItem('brew_checkout_idempotency_key', idempotencyKey);
        }
    }

    /**
     * Checks if current user is signed in. If not, redirects to login with return parameter.
     */
    async function checkAuthentication() {
        try {
            currentUser = await window.BrewAuth.getCurrentUser();
            if (!currentUser) {
                // Redirect guest to login, remembering checkout destination
                window.location.href = 'login.html?redirect=checkout.html';
                return;
            }

            // Pre-fill user information
            const nameInput = document.getElementById('checkout-name');
            const emailInput = document.getElementById('checkout-email');

            if (nameInput && !nameInput.value && currentUser.name) {
                nameInput.value = currentUser.name;
            }
            if (emailInput && !emailInput.value && currentUser.email) {
                emailInput.value = currentUser.email;
            }
        } catch (err) {
            console.error('Error verifying customer session:', err);
            window.location.href = 'login.html?redirect=checkout.html';
        }
    }

    /**
     * Loads cart items from localStorage and fetches authoritative pricing quote from server.
     */
    async function loadAndQuoteCart() {
        const cartItems = window.BrewCart ? window.BrewCart.getItems() : [];
        const previewContainer = document.getElementById('checkout-items-preview');
        const alertBox = document.getElementById('checkout-alert');
        const submitBtn = document.getElementById('btn-place-order');

        if (!cartItems || cartItems.length === 0) {
            // Cart is empty, redirect back to cart page
            window.location.href = 'cart.html';
            return;
        }

        // Render loading state
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: 20px;">
                    Verifying fresh prices with the café server...
                </div>
            `;
        }

        try {
            // Request pre-flight quote from backend
            const csrfToken = await window.BrewAuth.getCsrfToken();
            const response = await fetch('api/orders.php?action=quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({
                    action: 'quote',
                    items: cartItems.map((it) => ({
                        productId: it.productId,
                        quantity: it.quantity,
                        selectedOptions: it.selectedOptions || {},
                    })),
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                const msg = result.message || 'One or more items in your cart are currently unavailable.';
                showAlert(msg, 'error');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Items Unavailable — Return to Menu';
                }
                if (previewContainer) {
                    previewContainer.innerHTML = `
                        <div style="padding: 16px; color: var(--color-burgundy); text-align: center;">
                            ${escapeHtml(msg)}
                        </div>
                    `;
                }
                return;
            }

            // Quoted successfully: update UI with authoritative data
            const quoteData = result.data;
            authoritativeTotal = quoteData.total || 0;

            renderQuotedItems(quoteData.items);
            updateSummaryTotals(authoritativeTotal, quoteData.count);

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = `Place Pickup Order • ₹${authoritativeTotal.toLocaleString('en-IN')}`;
            }

        } catch (err) {
            console.error('Error fetching authoritative order quote:', err);
            showAlert('Could not verify cart prices with the server. Please check your connection and refresh.', 'error');
        }
    }

    /**
     * Renders server-quoted line items into the preview container.
     */
    function renderQuotedItems(items) {
        const previewContainer = document.getElementById('checkout-items-preview');
        if (!previewContainer) return;

        if (!items || items.length === 0) {
            previewContainer.innerHTML = '<p style="padding:10px; color:var(--color-text-muted);">No items in cart.</p>';
            return;
        }

        previewContainer.innerHTML = items.map((it) => {
            const options = it.selectedOptions || {};
            const optList = [];

            if (options.size && options.size.name) {
                optList.push(`Size: ${options.size.name}`);
            }
            if (options.milk && options.milk.name) {
                optList.push(`Milk: ${options.milk.name}`);
            }
            if (options.sweetness && options.sweetness.name) {
                optList.push(`Sweetness: ${options.sweetness.name}`);
            }
            if (options.warming && options.warming.name) {
                optList.push(`Prep: ${options.warming.name}`);
            }
            if (Array.isArray(options.extras) && options.extras.length > 0) {
                const extraNames = options.extras.map((ex) => ex.name).join(', ');
                optList.push(`Extras: ${extraNames}`);
            }

            const metaStr = optList.join(' • ');

            return `
                <div class="checkout-item-row">
                    <img 
                        src="${escapeHtml(it.imageUrl || '/assets/images/espresso.jpg')}" 
                        alt="${escapeHtml(it.name)}" 
                        class="checkout-item-thumb"
                        loading="lazy"
                    >
                    <div class="checkout-item-info">
                        <div class="checkout-item-name">
                            ${escapeHtml(it.name)} 
                            <span style="font-weight: normal; color: var(--color-text-muted); font-size: 0.85em;">&times; ${it.quantity}</span>
                        </div>
                        <div class="checkout-item-meta">${escapeHtml(metaStr)}</div>
                    </div>
                    <div class="checkout-item-price">
                        ₹${it.lineTotal.toLocaleString('en-IN')}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Updates subtotal and grand total figures.
     */
    function updateSummaryTotals(total, count) {
        const subtotalVal = document.getElementById('checkout-subtotal-val');
        const grandTotal = document.getElementById('checkout-grand-total');
        const subtotalLabel = document.getElementById('checkout-subtotal-label');

        if (subtotalVal) subtotalVal.textContent = `₹${total.toLocaleString('en-IN')}`;
        if (grandTotal) grandTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
        if (subtotalLabel) {
            subtotalLabel.textContent = `Subtotal (${count || 1} ${(count === 1 ? 'item' : 'items')})`;
        }
    }

    /**
     * Validates and submits the order form.
     */
    function bindCheckoutForm() {
        const form = document.getElementById('checkout-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isSubmitting) return;

            clearErrors();

            const nameInput = document.getElementById('checkout-name');
            const phoneInput = document.getElementById('checkout-phone');
            const emailInput = document.getElementById('checkout-email');
            const pickupSelect = document.getElementById('checkout-pickup-time');
            const instructionsInput = document.getElementById('checkout-instructions');
            const submitBtn = document.getElementById('btn-place-order');

            const name = nameInput ? nameInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const pickupTime = pickupSelect ? pickupSelect.value : 'asap';
            const specialInstructions = instructionsInput ? instructionsInput.value.trim() : '';

            let isValid = true;

            // Name validation
            if (!name || name.length < 2) {
                showFieldError('checkout-name-error', 'Please enter your full contact name.');
                if (nameInput) nameInput.classList.add('has-error');
                isValid = false;
            }

            // Phone validation
            const cleanPhone = phone.replace(/[^\d]/g, '');
            if (!cleanPhone || cleanPhone.length < 10) {
                showFieldError('checkout-phone-error', 'Please enter a valid phone number (at least 10 digits).');
                if (phoneInput) phoneInput.classList.add('has-error');
                isValid = false;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                showFieldError('checkout-email-error', 'Please enter a valid email address.');
                if (emailInput) emailInput.classList.add('has-error');
                isValid = false;
            }

            if (!isValid) {
                showAlert('Please correct the highlighted form errors before placing your order.', 'error');
                announceLive('Form has errors. Please correct the highlighted fields.');
                return;
            }

            // Lock submission
            isSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <span class="spinner" aria-hidden="true"></span>
                    <span>Securing Your Order...</span>
                `;
            }

            try {
                const csrfToken = await window.BrewAuth.getCsrfToken();
                const cartItems = window.BrewCart ? window.BrewCart.getItems() : [];

                const payload = {
                    csrf_token: csrfToken,
                    idempotency_key: idempotencyKey,
                    expected_total: authoritativeTotal,
                    pickup_info: {
                        customer_name: name,
                        customer_phone: phone,
                        customer_email: email,
                        pickup_time: pickupTime,
                        special_instructions: specialInstructions,
                    },
                    items: cartItems.map((it) => ({
                        productId: it.productId,
                        quantity: it.quantity,
                        selectedOptions: it.selectedOptions || {},
                    })),
                };

                const response = await fetch('api/orders.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken,
                    },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();

                if ((response.status === 201 || response.status === 200) && result.success) {
                    // Successful Order Creation!
                    const createdOrder = result.data;

                    // 1. Clear cart & purge stored idempotency key
                    window.BrewCart.clearCart();
                    sessionStorage.removeItem('brew_checkout_idempotency_key');

                    // 2. Announce to screen reader
                    announceLive(`Order placed successfully! Reference ${createdOrder.orderReference}.`);

                    // 3. Show Success Modal
                    showOrderSuccessModal(createdOrder);

                } else if (response.status === 409) {
                    // Authoritative price discrepancy: prompt customer review
                    showAlert(result.message || 'Prices have been updated on the server. Please review before proceeding.', 'error');
                    announceLive('Prices updated on server. Please review.');
                    await loadAndQuoteCart(); // re-sync authoritative prices
                    isSubmitting = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = `Place Pickup Order • ₹${authoritativeTotal.toLocaleString('en-IN')}`;
                    }

                } else {
                    // Other server validation errors: keep cart preserved!
                    const errorMsg = result.message || 'Failed to place order. Please review your details and try again.';
                    showAlert(errorMsg, 'error');
                    announceLive(`Order placement error: ${errorMsg}`);
                    isSubmitting = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = `Place Pickup Order • ₹${authoritativeTotal.toLocaleString('en-IN')}`;
                    }
                }

            } catch (err) {
                console.error('Error submitting order:', err);
                showAlert('A network communication error occurred. Your cart has been safely preserved. Please retry.', 'error');
                isSubmitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = `Place Pickup Order • ₹${authoritativeTotal.toLocaleString('en-IN')}`;
                }
            }
        });
    }

    /**
     * Displays the order confirmation modal with direct link to tracking.
     */
    function showOrderSuccessModal(order) {
        const modal = document.getElementById('order-success-modal');
        const refDisplay = document.getElementById('modal-success-ref');
        const detailsDisplay = document.getElementById('modal-success-details');
        const trackerBtn = document.getElementById('btn-view-tracker');

        if (refDisplay) refDisplay.textContent = order.orderReference;
        if (detailsDisplay) {
            const pickupLabel = (order.pickupInfo && order.pickupInfo.pickupTime) || 'ASAP';
            detailsDisplay.textContent = `Pickup: ${pickupLabel} • Total: ₹${order.total.toLocaleString('en-IN')} (Pay at counter)`;
        }
        if (trackerBtn) {
            trackerBtn.href = `orders.html?highlight=${encodeURIComponent(order.orderReference)}`;
        }

        if (modal) {
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            if (trackerBtn) trackerBtn.focus();
        }
    }

    function showAlert(message, type = 'error') {
        const alertBox = document.getElementById('checkout-alert');
        if (!alertBox) return;

        alertBox.className = `form-alert form-alert-${type}`;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showFieldError(elemId, message) {
        const errElem = document.getElementById(elemId);
        if (errElem) {
            errElem.textContent = message;
            errElem.style.display = 'block';
        }
    }

    function clearErrors() {
        const alertBox = document.getElementById('checkout-alert');
        if (alertBox) alertBox.style.display = 'none';

        document.querySelectorAll('.field-error-message').forEach((el) => {
            el.textContent = '';
            el.style.display = 'none';
        });

        document.querySelectorAll('.form-input').forEach((el) => {
            el.classList.remove('has-error');
        });
    }

    function announceLive(message) {
        const liveRegion = document.getElementById('checkout-live-status');
        if (liveRegion) liveRegion.textContent = message;
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
