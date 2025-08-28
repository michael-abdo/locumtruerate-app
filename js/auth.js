/**
 * JWT Authentication Module for LocumTrueRate
 * Handles login, logout, token management, and authentication checks
 */

// Configuration
const AUTH_CONFIG = {
    API_BASE: window.location.origin,
    TOKEN_KEY: 'locum_auth_token',
    USER_KEY: 'locum_user_data',
    REDIRECT_KEY: 'redirectAfterLogin'
};

/**
 * API request helper with authentication headers
 */
async function apiRequest(url, options = {}) {
    const token = getAuthToken();
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Add Authorization header if token exists
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        // Handle token expiration
        if (!response.ok && data.code === 'TOKEN_EXPIRED') {
            clearAuth();
            showToast('Your session has expired. Please log in again.', 'warning');
            redirectToLogin();
            return { success: false, data };
        }

        return { success: response.ok, data, status: response.status };
    } catch (error) {
        console.error('API request failed:', error);
        return { 
            success: false, 
            data: { error: 'Network error. Please check your connection.' }, 
            status: 0 
        };
    }
}

/**
 * Login user with email and password
 * Returns user data and stores JWT token
 */
async function login(email, password) {
    if (!email || !password) {
        const error = 'Email and password are required';
        showToast(error, 'error');
        return { success: false, error };
    }

    try {
        const result = await apiRequest(`${AUTH_CONFIG.API_BASE}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.success && result.data.token) {
            // Store authentication data
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, result.data.token);
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(result.data.user));
            
            // Maintain compatibility with existing code
            localStorage.setItem('userAuthenticated', 'true');
            localStorage.setItem('userEmail', result.data.user.email);
            localStorage.setItem('userName', `${result.data.user.first_name || ''} ${result.data.user.last_name || ''}`.trim());
            localStorage.setItem('userRole', result.data.user.role);

            showToast('Login successful!', 'success');
            return { success: true, user: result.data.user };
        } else {
            const error = result.data.error || 'Login failed';
            showToast(error, 'error');
            return { success: false, error };
        }
    } catch (error) {
        console.error('Login error:', error);
        const errorMessage = 'Login failed. Please try again.';
        showToast(errorMessage, 'error');
        return { success: false, error: errorMessage };
    }
}

/**
 * Logout user - clear tokens and redirect
 */
async function logout() {
    const token = getAuthToken();
    
    // Call logout API if token exists
    if (token) {
        try {
            await apiRequest(`${AUTH_CONFIG.API_BASE}/api/auth/logout`, {
                method: 'POST'
            });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        }
    }

    // Clear all authentication data
    clearAuth();
    showToast('You have been logged out successfully.', 'info');
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    const token = getAuthToken();
    if (!token) {
        return false;
    }

    try {
        // Basic JWT validation - check if token is expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp < currentTime) {
            // Token expired
            clearAuth();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        clearAuth();
        return false;
    }
}

/**
 * Get stored JWT token
 */
function getAuthToken() {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
}

/**
 * Get user information from stored data
 */
function getUserInfo() {
    try {
        const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

/**
 * Get user role for authorization checks
 */
function getUserRole() {
    const user = getUserInfo();
    return user ? user.role : null;
}

/**
 * Check if user has required role/permission
 */
function hasPermission(requiredRole) {
    const userRole = getUserRole();
    
    // Role hierarchy: admin > recruiter > locum
    const roleHierarchy = {
        'admin': 3,
        'recruiter': 2, 
        'locum': 1
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
}

/**
 * Verify JWT token with server
 */
async function verifyToken() {
    const result = await apiRequest(`${AUTH_CONFIG.API_BASE}/api/auth/verify`, {
        method: 'GET'
    });

    if (result.success) {
        // Update stored user data with fresh data from server
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(result.data.user));
        return { success: true, user: result.data.user };
    } else {
        clearAuth();
        return { success: false, error: result.data.error };
    }
}

/**
 * Clear all authentication data
 */
function clearAuth() {
    // Remove JWT token and user data
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    
    // Remove legacy authentication data for compatibility
    localStorage.removeItem('userAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
}

/**
 * Redirect to login page with return URL
 */
function redirectToLogin(returnUrl = null) {
    const currentUrl = returnUrl || window.location.pathname + window.location.search + window.location.hash;
    
    // Only store redirect if it's not the login page itself
    if (!currentUrl.includes('login.html') && !currentUrl.includes('index.html')) {
        localStorage.setItem(AUTH_CONFIG.REDIRECT_KEY, currentUrl);
    }

    window.location.href = 'login.html';
}

/**
 * Handle redirect after successful login
 */
function handlePostLoginRedirect() {
    const redirectUrl = localStorage.getItem(AUTH_CONFIG.REDIRECT_KEY);
    
    if (redirectUrl) {
        localStorage.removeItem(AUTH_CONFIG.REDIRECT_KEY);
        window.location.href = redirectUrl;
    } else {
        // Default redirect based on user role
        const userRole = getUserRole();
        switch (userRole) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'recruiter':
                window.location.href = 'recruiter-dashboard.html';
                break;
            case 'locum':
            default:
                window.location.href = 'locum-dashboard.html';
                break;
        }
    }
}

/**
 * Initialize authentication on page load
 * Call this on protected pages
 */
function initAuth() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    // Verify token with server (optional - for extra security)
    verifyToken().catch(error => {
        console.warn('Token verification failed:', error);
        // Don't force logout on verification failure - token might still be valid locally
    });

    return true;
}

/**
 * Show toast notification (compatibility with existing toast systems)
 */
function showToast(message, type = 'info', duration = 5000) {
    // Try to use existing toast function if available
    if (typeof window.showToast === 'function') {
        window.showToast(message, type, duration);
        return;
    }

    // Fallback toast implementation
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545', 
        warning: '#ffc107',
        info: '#17a2b8'
    };
    toast.style.backgroundColor = colors[type] || colors.info;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove toast after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, duration);
}

// Export functions for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        login,
        logout,
        isAuthenticated,
        getAuthToken,
        getUserInfo,
        getUserRole,
        hasPermission,
        verifyToken,
        clearAuth,
        redirectToLogin,
        handlePostLoginRedirect,
        initAuth,
        apiRequest
    };
}