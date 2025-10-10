/**
 * JWT Authentication Module for LocumCalc
 * Handles login, logout, token management, and authentication checks
 */

// Configuration
const AUTH_CONFIG = {
    API_BASE: 'https://locumtruerate-staging-66ba3177c382.herokuapp.com',
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
        const result = await apiRequest(`${AUTH_CONFIG.API_BASE}/api/v1/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.success && result.data && result.data.token) {
            console.log('DEBUG: login - storing token:', result.data.token.substring(0, 50) + '...');
            console.log('DEBUG: login - AUTH_CONFIG.TOKEN_KEY:', AUTH_CONFIG.TOKEN_KEY);
            
            // Store authentication data
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, result.data.token);
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(result.data.user));
            
            console.log('DEBUG: login - token stored, verifying:', !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY));
            console.log('DEBUG: login - localStorage test:', localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) ? localStorage.getItem(AUTH_CONFIG.TOKEN_KEY).substring(0, 50) + '...' : 'null');
            
            // Maintain compatibility with existing code
            localStorage.setItem('userAuthenticated', 'true');
            localStorage.setItem('userEmail', result.data.user.email);
            localStorage.setItem('userName', `${result.data.user.firstName || ''} ${result.data.user.lastName || ''}`.trim());
            localStorage.setItem('userRole', result.data.user.role);

            showToast('Login successful!', 'success');
            return { success: true, user: result.data.user };
        } else {
            const error = result.data.error || result.data.message || 'Login failed';
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
 * Register new user
 * Returns user data and stores JWT token
 */
async function register(userData) {
    const { email, password, role, first_name, last_name, phone } = userData;
    
    // Validate required fields
    if (!email || !password || !role) {
        const error = 'Email, password, and role are required';
        showToast(error, 'error');
        return { success: false, error };
    }

    if (password.length < 6) {
        const error = 'Password must be at least 6 characters';
        showToast(error, 'error');
        return { success: false, error };
    }

    try {
        const result = await apiRequest(`${AUTH_CONFIG.API_BASE}/api/v1/auth/register`, {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
                role,
                firstName: first_name || null,
                lastName: last_name || null,
                phone: phone || null
            })
        });

        if (result.success && result.data.token) {
            // Store authentication data (same as login)
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, result.data.token);
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(result.data.user));
            
            // Maintain compatibility with existing code
            localStorage.setItem('userAuthenticated', 'true');
            localStorage.setItem('userEmail', result.data.user.email);
            localStorage.setItem('userName', `${result.data.user.first_name || ''} ${result.data.user.last_name || ''}`.trim());
            localStorage.setItem('userRole', result.data.user.role);

            showToast('Registration successful!', 'success');
            return { success: true, user: result.data.user };
        } else {
            // Handle specific error codes
            if (result.data.code === 'EMAIL_EXISTS') {
                const error = 'An account with this email already exists';
                showToast(error, 'error');
                return { success: false, error, code: 'EMAIL_EXISTS' };
            } else if (result.data.code === 'WEAK_PASSWORD') {
                const error = 'Password must be at least 6 characters';
                showToast(error, 'error');
                return { success: false, error, code: 'WEAK_PASSWORD' };
            } else {
                const error = result.data.error || 'Registration failed';
                showToast(error, 'error');
                return { success: false, error };
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        const errorMessage = 'Registration failed. Please try again.';
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
            await apiRequest(`${AUTH_CONFIG.API_BASE}/api/v1/auth/logout`, {
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
    console.log('DEBUG: isAuthenticated - token exists:', !!token);
    console.log('DEBUG: isAuthenticated - token value:', token ? token.substring(0, 50) + '...' : 'null');
    
    if (!token) {
        console.log('DEBUG: isAuthenticated - no token found, returning false');
        return false;
    }

    try {
        // Basic JWT validation - check if token is expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        console.log('DEBUG: isAuthenticated - token payload:', payload);
        console.log('DEBUG: isAuthenticated - current time:', currentTime);
        console.log('DEBUG: isAuthenticated - token exp:', payload.exp);
        console.log('DEBUG: isAuthenticated - is expired:', payload.exp < currentTime);
        
        if (payload.exp < currentTime) {
            // Token expired
            console.log('DEBUG: isAuthenticated - token expired, clearing auth');
            clearAuth();
            return false;
        }

        console.log('DEBUG: isAuthenticated - token valid, returning true');
        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        console.log('DEBUG: isAuthenticated - token parsing failed, clearing auth');
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
    console.log('DEBUG: getUserInfo() called');
    console.log('DEBUG: AUTH_CONFIG.USER_KEY:', AUTH_CONFIG.USER_KEY);
    
    try {
        const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        console.log('DEBUG: Raw userData from localStorage:', userData);
        
        const parsedUser = userData ? JSON.parse(userData) : null;
        console.log('DEBUG: Parsed user data:', parsedUser);
        
        return parsedUser;
    } catch (error) {
        console.error('Error parsing user data:', error);
        console.log('DEBUG: getUserInfo() returning null due to error');
        return null;
    }
}

/**
 * Get user role for authorization checks
 */
function getUserRole() {
    console.log('DEBUG: getUserRole() called');
    const user = getUserInfo();
    console.log('DEBUG: getUserInfo() returned:', user);
    const role = user ? user.role : null;
    console.log('DEBUG: getUserRole() returning:', role);
    return role;
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
    const result = await apiRequest(`${AUTH_CONFIG.API_BASE}/api/v1/auth/verify`, {
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
    console.log('DEBUG: handlePostLoginRedirect() called');
    console.log('DEBUG: AUTH_CONFIG.REDIRECT_KEY:', AUTH_CONFIG.REDIRECT_KEY);
    
    const redirectUrl = localStorage.getItem(AUTH_CONFIG.REDIRECT_KEY);
    console.log('DEBUG: redirectUrl from localStorage:', redirectUrl);
    
    if (redirectUrl) {
        console.log('DEBUG: Using stored redirect URL:', redirectUrl);
        localStorage.removeItem(AUTH_CONFIG.REDIRECT_KEY);
        console.log('DEBUG: Redirecting to stored URL');
        window.location.href = redirectUrl;
    } else {
        console.log('DEBUG: No stored redirect URL, using role-based redirect');
        // Default redirect based on user role
        const userRole = getUserRole();
        console.log('DEBUG: User role:', userRole);
        
        switch (userRole) {
            case 'admin':
                console.log('DEBUG: Redirecting to admin-dashboard.html');
                window.location.href = 'admin-dashboard.html';
                break;
            case 'recruiter':
                console.log('DEBUG: Redirecting to recruiter-dashboard.html');
                window.location.href = 'recruiter-dashboard.html';
                break;
            case 'locum':
            default:
                console.log('DEBUG: Redirecting to locum-dashboard.html');
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
    // Try to use existing toast function if available (but not ourselves!)
    if (typeof window.showToast === 'function' && window.showToast !== showToast) {
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
        register,
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