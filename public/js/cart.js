/**
 * Brew & Bloom — Shopping Cart Storage & Calculation Engine
 * Vanilla JS • localStorage State • No External Dependencies
 */

(function () {
    'use strict';

    const CART_STORAGE_KEY = 'brew_bloom_cart';

    const Cart = {
        /**
         * Retrieves all cart items from localStorage.
         * @returns {Array<Object>}
         */
        getItems() {
            try {
                const data = localStorage.getItem(CART_STORAGE_KEY);
                if (!data) return [];
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [];
            } catch (err) {
                console.error('Error reading cart from localStorage:', err);
                return [];
            }
        },

        /**
         * Saves items to localStorage and dispatches a cart:updated event.
         * @param {Array<Object>} items
         */
        saveItems(items) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
                this.updateBadges();
                window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items } }));
            } catch (err) {
                console.error('Error saving cart to localStorage:', err);
            }
        },

        /**
         * Computes a deterministic, collision-resistant identifier for a customized item.
         * Combines product ID and sorted, normalized option selections.
         *
         * @param {string} productId
         * @param {Object} selectedOptions
         * @returns {string}
         */
        generateItemId(productId, selectedOptions) {
            const normalized = {};

            // Normalize single-selection options (size, milk, sweetness, warming)
            ['size', 'milk', 'sweetness', 'warming'].forEach((key) => {
                if (selectedOptions[key] && selectedOptions[key].id) {
                    normalized[key] = selectedOptions[key].id;
                }
            });

            // Normalize multi-selection extras (sorted array of IDs)
            if (Array.isArray(selectedOptions.extras)) {
                normalized.extras = selectedOptions.extras
                    .map((ex) => (typeof ex === 'string' ? ex : ex.id))
                    .sort();
            } else {
                normalized.extras = [];
            }

            const rawKey = `${productId}::${JSON.stringify(normalized)}`;
            // Simple deterministic hash
            let hash = 0;
            for (let i = 0; i < rawKey.length; i++) {
                hash = ((hash << 5) - hash) + rawKey.charCodeAt(i);
                hash |= 0;
            }
            return `${productId}_${Math.abs(hash).toString(36)}`;
        },

        /**
         * Calculates unit price from base price and selected options.
         *
         * @param {number} basePrice
         * @param {Object} selectedOptions
         * @returns {number}
         */
        calculateUnitPrice(basePrice, selectedOptions) {
            let total = Number(basePrice) || 0;

            ['size', 'milk', 'sweetness', 'warming'].forEach((key) => {
                if (selectedOptions[key] && typeof selectedOptions[key].priceModifier === 'number') {
                    total += Number(selectedOptions[key].priceModifier);
                }
            });

            if (Array.isArray(selectedOptions.extras)) {
                selectedOptions.extras.forEach((ex) => {
                    if (typeof ex.priceModifier === 'number') {
                        total += Number(ex.priceModifier);
                    }
                });
            }

            return Math.max(0, Math.round(total));
        },

        /**
         * Adds an item with customizations to the cart.
         * Merges quantity if an item with identical customizations already exists.
         *
         * @param {Object} product - Product record (id, name, slug, priceINR, imageUrl, category)
         * @param {Object} selectedOptions - Chosen options schema
         * @param {number} quantity - Quantity to add (default: 1)
         * @returns {Object} Added or updated cart item
         */
        addItem(product, selectedOptions, quantity = 1) {
            const qty = Math.max(1, parseInt(quantity, 10) || 1);
            const cartItemId = this.generateItemId(product.id, selectedOptions);
            const basePrice = parseInt(product.priceINR, 10) || 0;
            const unitPrice = this.calculateUnitPrice(basePrice, selectedOptions);

            const items = this.getItems();
            const existingIndex = items.findIndex((it) => it.cartItemId === cartItemId);

            let resultItem = null;

            if (existingIndex > -1) {
                // Merge identical customized product
                items[existingIndex].quantity += qty;
                items[existingIndex].unitPrice = unitPrice; // sync in case of schema update
                resultItem = items[existingIndex];
            } else {
                // New distinct line item
                resultItem = {
                    cartItemId,
                    productId: String(product.id),
                    slug: String(product.slug || ''),
                    name: String(product.name || 'Café Item'),
                    category: String(product.category || 'coffee'),
                    imageUrl: String(product.imageUrl || ''),
                    basePrice,
                    unitPrice,
                    quantity: qty,
                    selectedOptions: JSON.parse(JSON.stringify(selectedOptions || {})),
                    addedAt: Date.now(),
                };
                items.push(resultItem);
            }

            this.saveItems(items);
            return resultItem;
        },

        /**
         * Updates the quantity of a specific item in the cart.
         * Removes the item if newQty <= 0.
         *
         * @param {string} cartItemId
         * @param {number} newQty
         */
        updateQuantity(cartItemId, newQty) {
            const qty = parseInt(newQty, 10);
            let items = this.getItems();

            if (qty <= 0) {
                items = items.filter((it) => it.cartItemId !== cartItemId);
            } else {
                const item = items.find((it) => it.cartItemId === cartItemId);
                if (item) {
                    item.quantity = Math.min(99, qty);
                }
            }

            this.saveItems(items);
        },

        /**
         * Removes a specific item from the cart.
         *
         * @param {string} cartItemId
         */
        removeItem(cartItemId) {
            const items = this.getItems().filter((it) => it.cartItemId !== cartItemId);
            this.saveItems(items);
        },

        /**
         * Clears all items from the cart.
         */
        clearCart() {
            this.saveItems([]);
        },

        /**
         * Returns the total count of individual units in the cart.
         * @returns {number}
         */
        getTotalCount() {
            return this.getItems().reduce((sum, it) => sum + (it.quantity || 0), 0);
        },

        /**
         * Calculates subtotal of all items in INR.
         * @returns {number}
         */
        getSubtotal() {
            return this.getItems().reduce((sum, it) => sum + ((it.unitPrice || 0) * (it.quantity || 0)), 0);
        },

        /**
         * Updates all cart badge counters in the DOM.
         */
        updateBadges() {
            const totalCount = this.getTotalCount();
            const badges = document.querySelectorAll('.nav-cart-badge');
            badges.forEach((badge) => {
                badge.textContent = String(totalCount);
                badge.setAttribute('aria-label', `${totalCount} ${totalCount === 1 ? 'item' : 'items'} in shopping cart`);
                badge.style.display = totalCount > 0 ? 'inline-flex' : 'none';
            });

            // Announce to live regions if present
            const liveBadge = document.getElementById('cart-live-counter');
            if (liveBadge) {
                liveBadge.textContent = `Cart updated: ${totalCount} items in total.`;
            }
        }
    };

    // Export to global scope
    window.BrewCart = Cart;

    // Synchronize badges when page finishes loading and when storage changes in another tab
    document.addEventListener('DOMContentLoaded', () => {
        Cart.updateBadges();
    });

    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) {
            Cart.updateBadges();
            window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: Cart.getItems() } }));
        }
    });
})();
