/**
 * Brew & Bloom — Shared Core JavaScript
 * Vanilla JS • Fully Accessible • Mobile Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile navigation menu toggle
    const navToggle = document.querySelector('.nav-toggle-btn');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!isExpanded));
            navMenu.classList.toggle('is-open');

            if (!isExpanded) {
                navToggle.setAttribute('aria-label', 'Close navigation menu');
            } else {
                navToggle.setAttribute('aria-label', 'Open navigation menu');
            }
        });

        // Close nav menu on Escape key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
                navMenu.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-label', 'Open navigation menu');
                navToggle.focus();
            }
        });
    }

    // 2. Set current year in footer dynamically
    const yearElem = document.getElementById('current-year');
    if (yearElem) {
        yearElem.textContent = String(new Date().getFullYear());
    }
});
