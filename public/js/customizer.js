/**
 * Brew & Bloom — Product Customizer Module
 * Vanilla JS • Interactive Option Calculators • Accessible Keyboard Dialog
 */

(function () {
    'use strict';

    let activeProduct = null;
    let selectedState = {
        size: null,
        milk: null,
        sweetness: null,
        warming: null,
        extras: [],
        quantity: 1,
    };

    let modalBackdrop = null;
    let modalContent = null;
    let previousActiveElement = null;

    const Customizer = {
        /**
         * Initializes the customizer modal listeners if present on the page.
         */
        init() {
            modalBackdrop = document.getElementById('customizer-modal');
            modalContent = document.getElementById('customizer-modal-content');

            if (!modalBackdrop || !modalContent) return;

            const closeBtn = document.getElementById('customizer-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal());
            }

            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) {
                    this.closeModal();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !modalBackdrop.hidden) {
                    this.closeModal();
                }
            });
        },

        /**
         * Opens the customization modal for a given product object.
         * @param {Object} product
         * @param {HTMLElement} [triggerElement]
         */
        openForProduct(product, triggerElement = null) {
            if (!product) return;
            activeProduct = product;
            previousActiveElement = triggerElement || document.activeElement;

            this.resetState(product);
            this.renderCustomizer(modalContent, product);

            if (modalBackdrop) {
                modalBackdrop.hidden = false;
                document.body.style.overflow = 'hidden';

                // Focus first focusable control in modal
                setTimeout(() => {
                    const firstFocusable = modalContent.querySelector('input:checked, input, button');
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                }, 50);
            }
        },

        /**
         * Closes the customization modal and restores focus.
         */
        closeModal() {
            if (modalBackdrop) {
                modalBackdrop.hidden = true;
                document.body.style.overflow = '';
            }
            if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
                previousActiveElement.focus();
            }
            activeProduct = null;
        },

        /**
         * Resets customization state to defaults based on product schema.
         * @param {Object} product
         */
        resetState(product) {
            selectedState = {
                size: null,
                milk: null,
                sweetness: null,
                warming: null,
                extras: [],
                quantity: 1,
            };

            const opts = product.options || {};

            // Default size: first size available or regular
            if (Array.isArray(opts.sizes) && opts.sizes.length > 0) {
                const regular = opts.sizes.find((s) => s.id === 'regular' || s.id === 'single' || s.priceModifier === 0);
                selectedState.size = regular || opts.sizes[0];
            }

            // Default milk: whole milk or none/first
            if (Array.isArray(opts.milks) && opts.milks.length > 0) {
                const defaultMilk = opts.milks.find((m) => m.id === 'whole' || m.priceModifier === 0);
                selectedState.milk = defaultMilk || opts.milks[0];
            }

            // Default sweetness: 0% or 100%
            if (Array.isArray(opts.sweetness) && opts.sweetness.length > 0) {
                const defaultSweet = opts.sweetness.find((s) => s.id === '100' || s.id === '0');
                selectedState.sweetness = defaultSweet || opts.sweetness[0];
            }

            // Default warming (for bakery)
            if (Array.isArray(opts.warming) && opts.warming.length > 0) {
                selectedState.warming = opts.warming[0];
            }
        },

        /**
         * Renders the customizer interface into any container (modal or standalone page).
         * @param {HTMLElement} container
         * @param {Object} product
         */
        renderCustomizer(container, product) {
            if (!container || !product) return;

            const opts = product.options || {};
            const basePrice = parseInt(product.priceINR, 10) || 0;

            const categoryLabels = {
                coffee: 'Craft Coffee',
                tea: 'Artisanal Tea',
                bakery: 'Fresh Bakery',
            };

            let optionsHtml = '';

            // 1. SIZES GROUP (Radio)
            if (Array.isArray(opts.sizes) && opts.sizes.length > 0) {
                optionsHtml += `
                    <fieldset class="customizer-fieldset">
                        <legend class="customizer-legend">
                            Portion / Cup Size <span class="required-indicator" aria-label="Required">*</span>
                        </legend>
                        <div class="customizer-options-grid">
                            ${opts.sizes.map((s, idx) => {
                                const isChecked = selectedState.size && selectedState.size.id === s.id;
                                const modText = s.priceModifier > 0 ? ` (+₹${s.priceModifier})` : (s.priceModifier < 0 ? ` (-₹${Math.abs(s.priceModifier)})` : '');
                                return `
                                    <label class="customizer-radio-card ${isChecked ? 'is-selected' : ''}">
                                        <input 
                                            type="radio" 
                                            name="custom_size" 
                                            value="${escapeHtml(s.id)}" 
                                            data-name="${escapeHtml(s.name)}"
                                            data-modifier="${Number(s.priceModifier || 0)}"
                                            ${isChecked ? 'checked' : ''} 
                                            class="sr-only custom-option-radio"
                                        >
                                        <span class="custom-card-title">${escapeHtml(s.name)}</span>
                                        <span class="custom-card-price">${modText || 'Standard'}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </fieldset>
                `;
            }

            // 2. MILK ALTERNATIVES (Radio)
            if (Array.isArray(opts.milks) && opts.milks.length > 0) {
                optionsHtml += `
                    <fieldset class="customizer-fieldset">
                        <legend class="customizer-legend">Milk Preference</legend>
                        <div class="customizer-options-grid">
                            ${opts.milks.map((m) => {
                                const isChecked = selectedState.milk && selectedState.milk.id === m.id;
                                const modText = m.priceModifier > 0 ? ` (+₹${m.priceModifier})` : '';
                                return `
                                    <label class="customizer-radio-card ${isChecked ? 'is-selected' : ''}">
                                        <input 
                                            type="radio" 
                                            name="custom_milk" 
                                            value="${escapeHtml(m.id)}" 
                                            data-name="${escapeHtml(m.name)}"
                                            data-modifier="${Number(m.priceModifier || 0)}"
                                            ${isChecked ? 'checked' : ''} 
                                            class="sr-only custom-option-radio"
                                        >
                                        <span class="custom-card-title">${escapeHtml(m.name)}</span>
                                        <span class="custom-card-price">${modText || 'Included'}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </fieldset>
                `;
            }

            // 3. SWEETNESS (Radio)
            if (Array.isArray(opts.sweetness) && opts.sweetness.length > 0) {
                optionsHtml += `
                    <fieldset class="customizer-fieldset">
                        <legend class="customizer-legend">Sweetness</legend>
                        <div class="customizer-options-grid">
                            ${opts.sweetness.map((sw) => {
                                const isChecked = selectedState.sweetness && selectedState.sweetness.id === sw.id;
                                const modText = sw.priceModifier > 0 ? ` (+₹${sw.priceModifier})` : '';
                                return `
                                    <label class="customizer-radio-card ${isChecked ? 'is-selected' : ''}">
                                        <input 
                                            type="radio" 
                                            name="custom_sweetness" 
                                            value="${escapeHtml(sw.id)}" 
                                            data-name="${escapeHtml(sw.name)}"
                                            data-modifier="${Number(sw.priceModifier || 0)}"
                                            ${isChecked ? 'checked' : ''} 
                                            class="sr-only custom-option-radio"
                                        >
                                        <span class="custom-card-title">${escapeHtml(sw.name)}</span>
                                        <span class="custom-card-price">${modText || 'Free'}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </fieldset>
                `;
            }

            // 4. WARMING (Bakery Radio)
            if (Array.isArray(opts.warming) && opts.warming.length > 0) {
                optionsHtml += `
                    <fieldset class="customizer-fieldset">
                        <legend class="customizer-legend">Bakehouse Serving Style</legend>
                        <div class="customizer-options-grid">
                            ${opts.warming.map((w) => {
                                const isChecked = selectedState.warming && selectedState.warming.id === w.id;
                                return `
                                    <label class="customizer-radio-card ${isChecked ? 'is-selected' : ''}">
                                        <input 
                                            type="radio" 
                                            name="custom_warming" 
                                            value="${escapeHtml(w.id)}" 
                                            data-name="${escapeHtml(w.name)}"
                                            data-modifier="${Number(w.priceModifier || 0)}"
                                            ${isChecked ? 'checked' : ''} 
                                            class="sr-only custom-option-radio"
                                        >
                                        <span class="custom-card-title">${escapeHtml(w.name)}</span>
                                        <span class="custom-card-price">Complimentary</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </fieldset>
                `;
            }

            // 5. EXTRAS & TOPPINGS (Checkboxes)
            if (Array.isArray(opts.extras) && opts.extras.length > 0) {
                optionsHtml += `
                    <fieldset class="customizer-fieldset">
                        <legend class="customizer-legend">Add-ons &amp; Extras (Optional)</legend>
                        <div class="customizer-checkbox-list">
                            ${opts.extras.map((ex) => {
                                const isChecked = selectedState.extras.some((e) => e.id === ex.id);
                                return `
                                    <label class="customizer-checkbox-row ${isChecked ? 'is-selected' : ''}">
                                        <input 
                                            type="checkbox" 
                                            name="custom_extras" 
                                            value="${escapeHtml(ex.id)}" 
                                            data-name="${escapeHtml(ex.name)}"
                                            data-modifier="${Number(ex.priceModifier || 0)}"
                                            ${isChecked ? 'checked' : ''} 
                                            class="custom-option-checkbox"
                                        >
                                        <span class="custom-checkbox-label">${escapeHtml(ex.name)}</span>
                                        <span class="custom-checkbox-price">+₹${Number(ex.priceModifier)}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </fieldset>
                `;
            }

            container.innerHTML = `
                <div class="customizer-body-wrapper">
                    <!-- Product Header -->
                    <div class="customizer-product-header">
                        <img 
                            src="${escapeHtml(product.imageUrl)}" 
                            alt="${escapeHtml(product.name)}" 
                            class="customizer-img"
                            loading="lazy"
                        >
                        <div class="customizer-product-meta">
                            <span class="badge badge-sage" style="margin-bottom: 6px;">
                                ${escapeHtml(categoryLabels[product.category] || product.category)}
                            </span>
                            <h2 class="customizer-title" id="customizer-modal-title">${escapeHtml(product.name)}</h2>
                            <p class="customizer-description">${escapeHtml(product.description)}</p>
                            <div class="customizer-base-price">
                                Base Price: <strong>₹${basePrice.toLocaleString('en-IN')}</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Customization Options -->
                    <form id="customizer-form" class="customizer-form" onsubmit="event.preventDefault();">
                        ${optionsHtml}

                        <!-- Quantity Selector -->
                        <div class="customizer-qty-group">
                            <label for="customizer-qty-input" class="customizer-qty-label">Quantity</label>
                            <div class="stepper-controls">
                                <button type="button" class="stepper-btn" id="customizer-qty-minus" aria-label="Decrease quantity" disabled>&minus;</button>
                                <input 
                                    type="number" 
                                    id="customizer-qty-input" 
                                    name="quantity" 
                                    min="1" 
                                    max="99" 
                                    value="1" 
                                    class="stepper-input"
                                    aria-label="Quantity of ${escapeHtml(product.name)}"
                                >
                                <button type="button" class="stepper-btn" id="customizer-qty-plus" aria-label="Increase quantity">&plus;</button>
                            </div>
                        </div>

                        <!-- Live Price & Submit Button -->
                        <div class="customizer-footer-action">
                            <div class="customizer-summary-price" aria-live="polite">
                                <span>Unit Price: <strong id="customizer-unit-display">₹0</strong></span>
                                <span class="customizer-subtotal-text">Total: <strong id="customizer-total-display">₹0</strong></span>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block btn-add-cart-action" id="btn-submit-add-cart">
                                Add to Cart
                            </button>
                        </div>
                    </form>
                </div>
            `;

            this.bindEvents(container, product);
            this.updateCalculatedPrices(container, product);
        },

        /**
         * Binds change listeners and quantity stepper controls.
         * @param {HTMLElement} container
         * @param {Object} product
         */
        bindEvents(container, product) {
            // Radio options
            container.querySelectorAll('.custom-option-radio').forEach((radio) => {
                radio.addEventListener('change', (e) => {
                    const group = e.target.name.replace('custom_', '');
                    const label = e.target.closest('label');

                    // Deselect sibling labels in same fieldset
                    const fieldset = e.target.closest('fieldset');
                    if (fieldset) {
                        fieldset.querySelectorAll('.customizer-radio-card').forEach((l) => l.classList.remove('is-selected'));
                    }
                    if (label) {
                        label.classList.add('is-selected');
                    }

                    selectedState[group] = {
                        id: e.target.value,
                        name: e.target.getAttribute('data-name'),
                        priceModifier: Number(e.target.getAttribute('data-modifier') || 0),
                    };

                    this.updateCalculatedPrices(container, product);
                });
            });

            // Checkbox extras
            container.querySelectorAll('.custom-option-checkbox').forEach((cb) => {
                cb.addEventListener('change', (e) => {
                    const row = e.target.closest('.customizer-checkbox-row');
                    if (row) {
                        row.classList.toggle('is-selected', e.target.checked);
                    }

                    const extraItem = {
                        id: e.target.value,
                        name: e.target.getAttribute('data-name'),
                        priceModifier: Number(e.target.getAttribute('data-modifier') || 0),
                    };

                    if (e.target.checked) {
                        selectedState.extras.push(extraItem);
                    } else {
                        selectedState.extras = selectedState.extras.filter((ex) => ex.id !== extraItem.id);
                    }

                    this.updateCalculatedPrices(container, product);
                });
            });

            // Quantity stepper
            const qtyInput = container.querySelector('#customizer-qty-input');
            const minusBtn = container.querySelector('#customizer-qty-minus');
            const plusBtn = container.querySelector('#customizer-qty-plus');

            if (qtyInput && minusBtn && plusBtn) {
                minusBtn.addEventListener('click', () => {
                    let val = parseInt(qtyInput.value, 10) || 1;
                    if (val > 1) {
                        val -= 1;
                        qtyInput.value = val;
                        selectedState.quantity = val;
                        minusBtn.disabled = val <= 1;
                        this.updateCalculatedPrices(container, product);
                    }
                });

                plusBtn.addEventListener('click', () => {
                    let val = parseInt(qtyInput.value, 10) || 1;
                    if (val < 99) {
                        val += 1;
                        qtyInput.value = val;
                        selectedState.quantity = val;
                        minusBtn.disabled = false;
                        this.updateCalculatedPrices(container, product);
                    }
                });

                qtyInput.addEventListener('change', () => {
                    let val = parseInt(qtyInput.value, 10);
                    if (isNaN(val) || val < 1) val = 1;
                    if (val > 99) val = 99;
                    qtyInput.value = val;
                    selectedState.quantity = val;
                    minusBtn.disabled = val <= 1;
                    this.updateCalculatedPrices(container, product);
                });
            }

            // Form submission (Add to Cart)
            const form = container.querySelector('#customizer-form');
            if (form) {
                form.addEventListener('submit', () => {
                    this.submitAddToCart(product);
                });
            }
        },

        /**
         * Recalculates unit and grand total, updating DOM labels.
         */
        updateCalculatedPrices(container, product) {
            const basePrice = parseInt(product.priceINR, 10) || 0;
            const unitPrice = window.BrewCart.calculateUnitPrice(basePrice, selectedState);
            const qty = Math.max(1, selectedState.quantity || 1);
            const grandTotal = unitPrice * qty;

            const unitDisplay = container.querySelector('#customizer-unit-display');
            const totalDisplay = container.querySelector('#customizer-total-display');
            const submitBtn = container.querySelector('#btn-submit-add-cart');

            if (unitDisplay) unitDisplay.textContent = `₹${unitPrice.toLocaleString('en-IN')}`;
            if (totalDisplay) totalDisplay.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
            if (submitBtn) {
                submitBtn.textContent = `Add to Cart • ₹${grandTotal.toLocaleString('en-IN')}`;
            }
        },

        /**
         * Commits the customized product to the cart.
         */
        submitAddToCart(product) {
            const added = window.BrewCart.addItem(product, selectedState, selectedState.quantity);

            // Show feedback toast notification
            showToast(`${escapeHtml(product.name)} (x${selectedState.quantity}) added to your cart!`);

            // If modal is open, close it
            if (modalBackdrop && !modalBackdrop.hidden) {
                this.closeModal();
            }
        }
    };

    /**
     * Accessible toast notification helper
     */
    function showToast(message) {
        let toast = document.getElementById('brew-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'brew-toast';
            toast.className = 'brew-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('is-active');

        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('is-active');
        }, 3200);
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

    window.BrewCustomizer = Customizer;
    document.addEventListener('DOMContentLoaded', () => {
        Customizer.init();
    });
})();
