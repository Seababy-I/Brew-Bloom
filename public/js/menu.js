/**
 * Brew & Bloom — Interactive Café Menu
 * Vanilla JS • Asynchronous Fetch • WCAG 2.1 AA Compliant
 */

(function () {
    'use strict';

    // State
    const state = {
        category: 'all',
        searchQuery: '',
        isLoading: false,
        products: [],
    };

    // DOM Elements
    let searchInput = null;
    let searchClearBtn = null;
    let categoryButtons = [];
    let productsGrid = null;
    let liveRegion = null;
    let stateMessageContainer = null;
    let debounceTimer = null;

    document.addEventListener('DOMContentLoaded', initMenu);

    function initMenu() {
        searchInput = document.getElementById('menu-search');
        searchClearBtn = document.getElementById('search-clear-btn');
        categoryButtons = Array.from(document.querySelectorAll('.category-filter-btn'));
        productsGrid = document.getElementById('products-grid');
        liveRegion = document.getElementById('menu-live-region');
        stateMessageContainer = document.getElementById('menu-state-message');

        // Parse initial URL query params if any (e.g. menu.html?category=coffee)
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('category');
        if (initialCategory && ['coffee', 'tea', 'bakery'].includes(initialCategory.toLowerCase())) {
            state.category = initialCategory.toLowerCase();
            updateCategoryButtonsUI(state.category);
        }

        const initialSearch = urlParams.get('q') || urlParams.get('search');
        if (initialSearch && searchInput) {
            state.searchQuery = initialSearch.trim();
            searchInput.value = state.searchQuery;
            if (searchClearBtn) {
                searchClearBtn.style.display = 'block';
            }
        }

        // Event listeners
        if (searchInput) {
            searchInput.addEventListener('input', onSearchInput);
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    clearSearch();
                }
            });
        }

        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', clearSearch);
        }

        categoryButtons.forEach((btn) => {
            btn.addEventListener('click', onCategoryClick);
        });

        // Initial fetch
        fetchProducts();
    }

    function onSearchInput(e) {
        const query = e.target.value.trim();
        state.searchQuery = query;

        if (searchClearBtn) {
            searchClearBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchProducts();
        }, 300);
    }

    function clearSearch() {
        if (!searchInput) return;
        searchInput.value = '';
        state.searchQuery = '';
        if (searchClearBtn) {
            searchClearBtn.style.display = 'none';
        }
        searchInput.focus();
        fetchProducts();
    }

    function onCategoryClick(e) {
        const button = e.currentTarget;
        const selectedCategory = button.getAttribute('data-category');

        if (state.category === selectedCategory) {
            return;
        }

        state.category = selectedCategory;
        updateCategoryButtonsUI(selectedCategory);
        fetchProducts();
    }

    function updateCategoryButtonsUI(activeCategory) {
        categoryButtons.forEach((btn) => {
            const btnCat = btn.getAttribute('data-category');
            const isActive = btnCat === activeCategory;
            btn.setAttribute('aria-pressed', String(isActive));
            btn.classList.toggle('active', isActive);
        });
    }

    function announceLive(message) {
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }

    async function fetchProducts() {
        state.isLoading = true;
        renderLoadingSkeleton();
        clearStateMessage();

        // Build query string
        const params = new URLSearchParams();
        if (state.category && state.category !== 'all') {
            params.append('category', state.category);
        }
        if (state.searchQuery) {
            params.append('q', state.searchQuery);
        }

        const queryString = params.toString() ? '?' + params.toString() : '';
        const endpoint = 'api/products.php' + queryString;
        try {
            window.history.replaceState(null, '', window.location.pathname + queryString);
        } catch (_) {}

        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                const errMsg = (result.errors && result.errors.length > 0)
                    ? result.errors.join('. ')
                    : result.message || 'Failed to load products.';
                renderError(errMsg);
                announceLive('Error loading products: ' + errMsg);
                return;
            }

            state.products = Array.isArray(result.data) ? result.data : [];
            renderProducts(state.products);

            // Announce to assistive technology
            const count = state.products.length;
            const catLabel = state.category === 'all' ? 'all categories' : state.category;
            const queryLabel = state.searchQuery ? ` matching "${state.searchQuery}"` : '';
            announceLive(`Found ${count} ${count === 1 ? 'item' : 'items'} in ${catLabel}${queryLabel}.`);

        } catch (error) {
            const errorText = 'Unable to reach the server. Please verify your internet connection or local server status.';
            renderError(errorText);
            announceLive('Network error: ' + errorText);
        } finally {
            state.isLoading = false;
        }
    }

    function renderLoadingSkeleton() {
        if (!productsGrid) return;
        let html = '';
        for (let i = 0; i < 6; i++) {
            html += `
                <div class="skeleton-card" aria-hidden="true">
                    <div class="skeleton-pulse" style="height: 220px; width: 100%;"></div>
                    <div style="padding: 22px;">
                        <div class="skeleton-pulse" style="height: 20px; width: 65%; margin-bottom: 12px; border-radius: 4px;"></div>
                        <div class="skeleton-pulse" style="height: 14px; width: 90%; margin-bottom: 8px; border-radius: 4px;"></div>
                        <div class="skeleton-pulse" style="height: 14px; width: 75%; margin-bottom: 24px; border-radius: 4px;"></div>
                        <div class="skeleton-pulse" style="height: 28px; width: 40%; border-radius: 4px;"></div>
                    </div>
                </div>
            `;
        }
        productsGrid.innerHTML = html;
    }

    function renderProducts(products) {
        if (!productsGrid) return;

        if (products.length === 0) {
            productsGrid.innerHTML = '';
            renderEmptyState();
            return;
        }

        const cardsHtml = products.map((product) => createProductCardHtml(product)).join('');
        productsGrid.innerHTML = cardsHtml;
    }

    function createProductCardHtml(product) {
        const categoryLabels = {
            coffee: 'Craft Coffee',
            tea: 'Artisanal Tea',
            bakery: 'Fresh Bakery',
        };

        const catName = categoryLabels[product.category] || product.category;

        // Customization preview tags
        let tagsHtml = '';
        if (product.options) {
            if (product.options.sizes && product.options.sizes.length > 0) {
                tagsHtml += `<span class="option-tag">${product.options.sizes.length} Sizes</span>`;
            }
            if (product.options.milks && product.options.milks.length > 0) {
                tagsHtml += `<span class="option-tag">Alt-Milks</span>`;
            }
            if (product.options.warming) {
                tagsHtml += `<span class="option-tag">Served Warm</span>`;
            }
            if (product.options.extras && product.options.extras.length > 0) {
                tagsHtml += `<span class="option-tag">+Add-ons</span>`;
            }
        }

        const altText = `${escapeHtml(product.name)} - freshly prepared ${escapeHtml(catName)} at Brew & Bloom`;

        return `
            <article class="product-card" id="product-${escapeHtml(product.id)}">
                <div class="product-media">
                    <img 
                        src="${escapeHtml(product.imageUrl)}" 
                        alt="${altText}" 
                        class="product-img" 
                        loading="lazy"
                        onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'"
                    >
                    <span class="product-badge-category">${escapeHtml(catName)}</span>
                </div>
                <div class="product-body">
                    <h3 class="product-name">${escapeHtml(product.name)}</h3>
                    <p class="product-desc">${escapeHtml(product.description)}</p>
                    
                    ${tagsHtml ? `<div class="product-meta-tags" aria-label="Available customizations">${tagsHtml}</div>` : ''}

                    <div class="product-footer">
                        <div class="product-price">
                            <small>INR</small> ₹${Number(product.priceINR).toLocaleString('en-IN')}
                        </div>
                        <span class="badge badge-sage" aria-label="Status: Available in store">Fresh Daily</span>
                    </div>
                </div>
            </article>
        `;
    }

    function renderEmptyState() {
        if (!stateMessageContainer) return;

        stateMessageContainer.innerHTML = `
            <div class="state-message-box" role="status">
                <span class="state-message-icon" aria-hidden="true">☕</span>
                <h3 class="state-message-title">No Menu Items Found</h3>
                <p class="state-message-desc">
                    We couldn't find any items matching your current search or category filter. Try clearing the search or exploring all categories.
                </p>
                <button type="button" class="btn btn-primary" id="btn-reset-filters">
                    Reset All Filters
                </button>
            </div>
        `;

        const resetBtn = document.getElementById('btn-reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                }
                state.searchQuery = '';
                state.category = 'all';
                updateCategoryButtonsUI('all');
                if (searchClearBtn) {
                    searchClearBtn.style.display = 'none';
                }
                fetchProducts();
            });
        }
    }

    function renderError(errorMessage) {
        if (!productsGrid || !stateMessageContainer) return;
        productsGrid.innerHTML = '';

        stateMessageContainer.innerHTML = `
            <div class="state-message-box" role="alert">
                <span class="state-message-icon" aria-hidden="true">⚠️</span>
                <h3 class="state-message-title">Unable to Load Menu</h3>
                <p class="error-text-notice">${escapeHtml(errorMessage)}</p>
                <button type="button" class="btn btn-primary" id="btn-retry-fetch">
                    Try Again
                </button>
            </div>
        `;

        const retryBtn = document.getElementById('btn-retry-fetch');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                fetchProducts();
            });
        }
    }

    function clearStateMessage() {
        if (stateMessageContainer) {
            stateMessageContainer.innerHTML = '';
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
