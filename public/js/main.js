/**
 * Brew & Bloom — Shared Core JavaScript
 * Vanilla JS • Fully Accessible • Navigation & Auth State Sync
 */

(function () {
    'use strict';

    // Global BrewAuth helper
    window.BrewAuth = {
        currentUser: null,
        csrfToken: null,

        async getCsrfToken() {
            if (this.csrfToken) {
                return this.csrfToken;
            }
            try {
                const res = await fetch('api/auth/csrf.php');
                const json = await res.json();
                if (json.success && json.data && json.data.csrf_token) {
                    this.csrfToken = json.data.csrf_token;
                    return this.csrfToken;
                }
            } catch (err) {
                console.warn('Could not fetch CSRF token:', err);
            }
            return '';
        },

        async getCurrentUser() {
            if (this.currentUser !== null) {
                return this.currentUser;
            }
            try {
                const res = await fetch('api/auth/me.php');
                const json = await res.json();
                if (json.success && json.data) {
                    this.currentUser = json.data;
                    return this.currentUser;
                }
            } catch (err) {
                console.warn('Could not fetch session user:', err);
            }
            this.currentUser = false; // explicitly unauthenticated
            return null;
        },

        async logout() {
            try {
                const token = await this.getCsrfToken();
                const res = await fetch('api/auth/logout.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': token,
                    },
                    body: JSON.stringify({ csrf_token: token }),
                });
                const json = await res.json();
                if (json.success) {
                    this.currentUser = false;
                    window.location.href = 'index.html';
                } else {
                    alert(json.message || 'Logout failed.');
                }
            } catch (err) {
                console.error('Error logging out:', err);
                window.location.href = 'index.html';
            }
        }
    };

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

        // 3. Synchronize navbar with authentication state
        syncNavAuth();
    });

    async function syncNavAuth() {
        const authSlot = document.getElementById('nav-auth-slot');
        if (!authSlot) return;

        const user = await window.BrewAuth.getCurrentUser();

        if (user) {
            const isAdmin = user.role === 'admin';
            const path = window.location.pathname;
            const isOrders = path.endsWith('orders.html');
            const isAccount = path.endsWith('account.html');

            authSlot.innerHTML = `
                <li>
                    <a href="orders.html" class="nav-link ${isOrders ? 'active' : ''}" id="nav-orders-link" ${isOrders ? 'aria-current="page"' : ''}>
                        My Orders
                    </a>
                </li>
                <li class="nav-auth-user">
                    <a href="account.html" class="nav-link ${isAccount ? 'active' : ''}" id="nav-account-link" ${isAccount ? 'aria-current="page"' : ''}>
                        ${isAdmin ? '<span class="role-badge role-admin" style="margin-right:6px; font-size:0.7rem; padding: 2px 8px;">Admin</span>' : ''}
                        Account (${escapeHtml(user.name.split(' ')[0])})
                    </a>
                </li>
                <li>
                    <button type="button" class="btn btn-secondary" id="global-nav-logout-btn" style="padding: 6px 14px; font-size: 0.8125rem;">
                        Sign Out
                    </button>
                </li>
            `;

            const logoutBtn = document.getElementById('global-nav-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.BrewAuth.logout();
                });
            }
        } else {
            authSlot.innerHTML = `
                <li><a href="login.html" class="nav-link" id="nav-login-link">Sign In</a></li>
                <li><a href="register.html" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.8125rem;">Register</a></li>
            `;
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
