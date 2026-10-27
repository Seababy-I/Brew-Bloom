/**
 * Brew & Bloom — Standalone Product Detail & Customizer Controller
 * Vanilla JS • Fully Accessible • Reads ?id= or ?slug=
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('product-view-container');
        if (!container) return;

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const slug = params.get('slug');

        if (!id && !slug) {
            renderNotFound(container, 'No product specified in URL.');
            return;
        }

        const query = id ? `id=${encodeURIComponent(id)}` : `slug=${encodeURIComponent(slug)}`;

        fetch(`api/product.php?${query}`)
            .then((res) => res.json())
            .then((result) => {
                if (result.success && result.data) {
                    const product = result.data;
                    document.title = `${product.name} — Brew & Bloom`;
                    window.BrewCustomizer.resetState(product);
                    window.BrewCustomizer.renderCustomizer(container, product);
                } else {
                    renderNotFound(container, result.message || 'Product not found.');
                }
            })
            .catch(() => {
                renderNotFound(container, 'Unable to load product details from server.');
            });
    });

    function renderNotFound(container, message) {
        container.innerHTML = `
            <div class="state-message-box" role="status">
                <span class="state-message-icon" aria-hidden="true">☕</span>
                <h2 class="state-message-title">Product Not Found</h2>
                <p class="state-message-desc">${escapeHtml(message)}</p>
                <div style="margin-top: 24px;">
                    <a href="menu.html" class="btn btn-primary">Return to Café Menu</a>
                </div>
            </div>
        `;
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
