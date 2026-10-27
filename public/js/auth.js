/**
 * Brew & Bloom — Authentication & Account Controller
 * Vanilla JS • Fully Accessible • WCAG 2.1 AA Compliant
 */

document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggles();
    initRegisterForm();
    initLoginForm();
    initAccountPage();
});

// 1. Password Visibility Toggles
function initPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.password-toggle-btn');
    toggleBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            btn.textContent = isPassword ? 'Hide' : 'Show';
            btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
    });
}

// 2. Customer Registration Controller
function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const confirmInput = document.getElementById('reg-confirm-password');
    const submitBtn = document.getElementById('reg-submit-btn');
    const alertBox = document.getElementById('reg-alert');
    const liveRegion = document.getElementById('reg-live-region');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        let isValid = true;
        const nameVal = nameInput.value.trim();
        const emailVal = emailInput.value.trim();
        const passVal = passwordInput.value;
        const confirmVal = confirmInput.value;

        // Name validation
        if (nameVal.length < 2 || nameVal.length > 80) {
            showFieldError('reg-name-error', 'Full name must be between 2 and 80 characters.');
            nameInput.classList.add('has-error');
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
            showFieldError('reg-email-error', 'Please enter a valid email address.');
            emailInput.classList.add('has-error');
            isValid = false;
        }

        // Password strength
        if (passVal.length < 8) {
            showFieldError('reg-password-error', 'Password must be at least 8 characters.');
            passwordInput.classList.add('has-error');
            isValid = false;
        } else if (!/[A-Za-z]/.test(passVal) || !/[0-9]/.test(passVal)) {
            showFieldError('reg-password-error', 'Password must contain at least one letter and one number.');
            passwordInput.classList.add('has-error');
            isValid = false;
        }

        // Confirm match
        if (passVal !== confirmVal) {
            showFieldError('reg-confirm-error', 'Passwords do not match.');
            confirmInput.classList.add('has-error');
            isValid = false;
        }

        if (!isValid) {
            showAlert(alertBox, 'Please correct the highlighted errors before submitting.', 'error');
            announceLive(liveRegion, 'Registration form has errors. Please review the highlighted fields.');
            return;
        }

        // Form is valid: submit to backend
        setLoading(submitBtn, true, 'Creating Account...');

        try {
            const csrfToken = await window.BrewAuth.getCsrfToken();
            const response = await fetch('api/auth/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({
                    csrf_token: csrfToken,
                    name: nameVal,
                    email: emailVal,
                    password: passVal,
                    confirm_password: confirmVal,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showAlert(alertBox, 'Registration successful! Redirecting to your account...', 'success');
                announceLive(liveRegion, 'Registration successful! Redirecting to your account.');
                form.reset();
                setTimeout(() => {
                    window.location.href = 'account.html';
                }, 1200);
            } else {
                const errorMsg = (result.errors && result.errors.length > 0)
                    ? result.errors.join('. ')
                    : result.message || 'Registration failed.';
                showAlert(alertBox, errorMsg, 'error');
                announceLive(liveRegion, 'Registration failed: ' + errorMsg);
                setLoading(submitBtn, false);
            }
        } catch (err) {
            const netErr = 'Network error. Please check your connection and try again.';
            showAlert(alertBox, netErr, 'error');
            announceLive(liveRegion, netErr);
            setLoading(submitBtn, false);
        }
    });

    function clearErrors() {
        document.querySelectorAll('.form-error-text').forEach((el) => {
            el.textContent = '';
            el.classList.remove('is-visible');
        });
        document.querySelectorAll('.form-input').forEach((el) => {
            el.classList.remove('has-error');
        });
        if (alertBox) {
            alertBox.textContent = '';
            alertBox.className = 'form-alert';
        }
    }
}

// 3. Customer & Admin Login Controller
function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('login-submit-btn');
    const alertBox = document.getElementById('login-alert');
    const liveRegion = document.getElementById('login-live-region');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        let isValid = true;
        const emailVal = emailInput.value.trim();
        const passVal = passwordInput.value;

        if (!emailVal) {
            showFieldError('login-email-error', 'Please enter your email address.');
            emailInput.classList.add('has-error');
            isValid = false;
        }

        if (!passVal) {
            showFieldError('login-password-error', 'Please enter your password.');
            passwordInput.classList.add('has-error');
            isValid = false;
        }

        if (!isValid) {
            showAlert(alertBox, 'Please provide both your email and password.', 'error');
            announceLive(liveRegion, 'Login error: Please provide email and password.');
            return;
        }

        setLoading(submitBtn, true, 'Signing In...');

        try {
            const csrfToken = await window.BrewAuth.getCsrfToken();
            const response = await fetch('api/auth/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({
                    csrf_token: csrfToken,
                    email: emailVal,
                    password: passVal,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showAlert(alertBox, 'Signed in successfully! Loading your profile...', 'success');
                announceLive(liveRegion, 'Signed in successfully. Redirecting...');
                setTimeout(() => {
                    window.location.href = 'account.html';
                }, 1000);
            } else {
                const errorMsg = result.message || 'Invalid email or password.';
                showAlert(alertBox, errorMsg, 'error');
                announceLive(liveRegion, 'Sign in failed: ' + errorMsg);
                passwordInput.value = '';
                passwordInput.focus();
                setLoading(submitBtn, false);
            }
        } catch (err) {
            const netErr = 'Network error. Please try again later.';
            showAlert(alertBox, netErr, 'error');
            announceLive(liveRegion, netErr);
            setLoading(submitBtn, false);
        }
    });

    function clearErrors() {
        document.querySelectorAll('.form-error-text').forEach((el) => {
            el.textContent = '';
            el.classList.remove('is-visible');
        });
        document.querySelectorAll('.form-input').forEach((el) => {
            el.classList.remove('has-error');
        });
        if (alertBox) {
            alertBox.textContent = '';
            alertBox.className = 'form-alert';
        }
    }
}

// 4. Account Profile & Role-Based Access Controller
async function initAccountPage() {
    const accountContainer = document.getElementById('account-view');
    if (!accountContainer) return;

    const user = await window.BrewAuth.getCurrentUser();

    if (!user) {
        // Not authenticated: prompt to sign in
        accountContainer.innerHTML = `
            <div class="state-message-box" role="status">
                <span class="state-message-icon" aria-hidden="true">🔒</span>
                <h2 class="state-message-title">Sign In Required</h2>
                <p class="state-message-desc">
                    You need to be signed in to view your account details and order history.
                </p>
                <div style="display:flex; justify-content:center; gap: 12px; margin-top: 16px;">
                    <a href="login.html" class="btn btn-primary">Sign In</a>
                    <a href="register.html" class="btn btn-secondary">Create Account</a>
                </div>
            </div>
        `;
        return;
    }

    // Render logged-in profile
    const isAdmin = user.role === 'admin';
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'B';
    const memberSince = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Active Member';

    accountContainer.innerHTML = `
        <article class="account-profile-card">
            <div class="profile-header">
                <div class="profile-user-info">
                    <div class="profile-avatar-circle" aria-hidden="true">${escapeHtml(initial)}</div>
                    <div>
                        <h2 style="font-size: 1.6rem; margin-bottom: 4px;">${escapeHtml(user.name)}</h2>
                        <span class="role-badge ${isAdmin ? 'role-admin' : 'role-customer'}">
                            ${isAdmin ? '👑 Administrator' : '☕ Café Customer'}
                        </span>
                    </div>
                </div>
                <div>
                    <button type="button" class="btn btn-secondary" id="account-logout-btn">
                        Sign Out
                    </button>
                </div>
            </div>

            <div class="account-details-grid">
                <div class="account-detail-item">
                    <span>Email Address</span>
                    <strong>${escapeHtml(user.email)}</strong>
                </div>
                <div class="account-detail-item">
                    <span>Account Role</span>
                    <strong style="text-transform: capitalize;">${escapeHtml(user.role)}</strong>
                </div>
                <div class="account-detail-item">
                    <span>Member Since</span>
                    <strong>${escapeHtml(memberSince)}</strong>
                </div>
            </div>

            <!-- Server-Side RBAC Verification Tool -->
            <div class="admin-testing-panel">
                <h3>Server-Side Authorization &amp; RBAC Verification</h3>
                <p style="font-size: 0.9375rem; color: var(--color-text-muted); margin-bottom: 16px;">
                    Verify that privileged admin resources are protected strictly by PHP session validation on the server rather than client-side hiding.
                </p>

                <div style="display:flex; flex-wrap:wrap; gap: 12px; align-items:center;">
                    <button type="button" class="btn btn-primary" id="btn-test-admin-check">
                        Test Admin Endpoint (GET /api/auth/admin-check.php)
                    </button>
                    <span id="rbac-status-spinner" style="display:none; font-size: 0.9rem; color: var(--color-caramel);">
                        Checking server authorization...
                    </span>
                </div>

                <div id="rbac-result-box" style="margin-top: 16px; display:none;" aria-live="polite">
                    <!-- Results from admin-check.php will render here -->
                </div>
            </div>
        </article>
    `;

    // Logout button handler
    const logoutBtn = document.getElementById('account-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.BrewAuth.logout();
        });
    }

    // Admin endpoint verification tester
    const testAdminBtn = document.getElementById('btn-test-admin-check');
    const rbacSpinner = document.getElementById('rbac-status-spinner');
    const rbacResult = document.getElementById('rbac-result-box');

    if (testAdminBtn) {
        testAdminBtn.addEventListener('click', async () => {
            rbacSpinner.style.display = 'inline';
            rbacResult.style.display = 'none';

            try {
                const res = await fetch('api/auth/admin-check.php');
                const json = await res.json();
                rbacSpinner.style.display = 'none';
                rbacResult.style.display = 'block';

                if (res.status === 200 && json.success) {
                    rbacResult.innerHTML = `
                        <div class="form-alert form-alert-success is-visible">
                            <strong>✅ HTTP 200 OK — Admin Access Granted:</strong><br>
                            ${escapeHtml(json.message)}<br>
                            <small>Server Confirmed Role: <code>${escapeHtml(json.data.admin.role)}</code> (${escapeHtml(json.data.protected_resource)})</small>
                        </div>
                    `;
                } else if (res.status === 403) {
                    rbacResult.innerHTML = `
                        <div class="form-alert form-alert-error is-visible">
                            <strong>🚫 HTTP 403 Forbidden — Server-Side Role Enforcement Verified:</strong><br>
                            ${escapeHtml(json.message || 'Access Denied.')}<br>
                            <small>Server confirmed: As a <code>customer</code>, you cannot access administrative endpoints.</small>
                        </div>
                    `;
                } else {
                    rbacResult.innerHTML = `
                        <div class="form-alert form-alert-error is-visible">
                            <strong>HTTP ${res.status}:</strong> ${escapeHtml(json.message || 'Unexpected response.')}
                        </div>
                    `;
                }
            } catch (err) {
                rbacSpinner.style.display = 'none';
                rbacResult.style.display = 'block';
                rbacResult.innerHTML = `
                    <div class="form-alert form-alert-error is-visible">
                        Failed to connect to admin endpoint.
                    </div>
                `;
            }
        });
    }
}

// Utility Helpers
function showFieldError(elementId, message) {
    const errElem = document.getElementById(elementId);
    if (errElem) {
        errElem.textContent = message;
        errElem.classList.add('is-visible');
    }
}

function showAlert(alertElem, message, type) {
    if (!alertElem) return;
    alertElem.textContent = message;
    alertElem.className = `form-alert form-alert-${type} is-visible`;
}

function announceLive(liveElem, message) {
    if (liveElem) {
        liveElem.textContent = message;
    }
}

function setLoading(btn, isLoading, loadingText = 'Processing...') {
    if (!btn) return;
    if (isLoading) {
        btn.classList.add('is-loading');
        btn.setAttribute('data-original-text', btn.textContent);
        btn.textContent = loadingText;
        btn.disabled = true;
    } else {
        btn.classList.remove('is-loading');
        const orig = btn.getAttribute('data-original-text');
        if (orig) btn.textContent = orig;
        btn.disabled = false;
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
