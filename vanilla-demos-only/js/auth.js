/**
 * Authentication Helper
 * Manages JWT tokens and user session in localStorage
 */

class Auth {
    // Storage keys
    static TOKEN_KEY = 'locumtruerate_token';
    static USER_KEY = 'locumtruerate_user';
    static TOKEN_EXPIRY_KEY = 'locumtruerate_token_expiry';

    /**
     * Set authentication token
     * @param {string} token - JWT token
     * @param {number} expiresIn - Token expiry time in seconds (optional)
     */
    static setToken(token, expiresIn = null) {
        localStorage.setItem(this.TOKEN_KEY, token);
        
        // Set expiry time if provided (typically 24 hours)
        if (expiresIn) {
            const expiryTime = Date.now() + (expiresIn * 1000);
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
        }
    }

    /**
     * Get authentication token
     * @returns {string|null} - JWT token or null if not found/expired
     */
    static getToken() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        
        if (!token) {
            return null;
        }

        // Check if token is expired
        const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (expiry && Date.now() > parseInt(expiry)) {
            this.clearAuth();
            return null;
        }

        return token;
    }

    /**
     * Clear authentication token
     */
    static clearToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    }

    /**
     * Check if user is logged in
     * @returns {boolean} - True if valid token exists
     */
    static isLoggedIn() {
        return !!this.getToken();
    }

    /**
     * Set current user data
     * @param {Object} user - User data object
     */
    static setCurrentUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    /**
     * Get current user data
     * @returns {Object|null} - User data or null if not found
     */
    static getCurrentUser() {
        const userJson = localStorage.getItem(this.USER_KEY);
        
        if (!userJson) {
            return null;
        }

        try {
            return JSON.parse(userJson);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    /**
     * Clear current user data
     */
    static clearCurrentUser() {
        localStorage.removeItem(this.USER_KEY);
    }

    /**
     * Clear all authentication data
     */
    static clearAuth() {
        this.clearToken();
        this.clearCurrentUser();
    }

    /**
     * Handle successful login
     * @param {string} token - JWT token
     * @param {Object} user - User data
     * @param {number} expiresIn - Token expiry in seconds (optional)
     */
    static login(token, user, expiresIn = null) {
        this.setToken(token, expiresIn);
        this.setCurrentUser(user);
    }

    /**
     * Handle logout
     */
    static logout() {
        this.clearAuth();
    }

    /**
     * Get user role
     * @returns {string|null} - User role (locum/recruiter/admin) or null
     */
    static getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    }

    /**
     * Check if user has specific role
     * @param {string} role - Role to check
     * @returns {boolean} - True if user has the role
     */
    static hasRole(role) {
        return this.getUserRole() === role;
    }

    /**
     * Check if user is a recruiter
     * @returns {boolean} - True if user is a recruiter
     */
    static isRecruiter() {
        return this.hasRole('recruiter');
    }

    /**
     * Check if user is a locum
     * @returns {boolean} - True if user is a locum
     */
    static isLocum() {
        return this.hasRole('locum');
    }

    /**
     * Check if user is an admin
     * @returns {boolean} - True if user is an admin
     */
    static isAdmin() {
        return this.hasRole('admin');
    }

    /**
     * Get user display name
     * @returns {string} - User's full name or email
     */
    static getUserDisplayName() {
        const user = this.getCurrentUser();
        
        if (!user) {
            return 'Guest';
        }

        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }

        return user.email || 'User';
    }

    /**
     * Check if authentication is required for a route
     * @param {string} path - Route path
     * @returns {boolean} - True if auth required
     */
    static isAuthRequired(path) {
        // Define public routes that don't require authentication
        const publicRoutes = [
            '/',
            '/index.html',
            '/job-board.html',
            '/contract-calculator.html',
            '/paycheck-calculator.html'
        ];

        return !publicRoutes.includes(path);
    }

    /**
     * Redirect to login if not authenticated
     * @param {string} returnUrl - URL to return after login (optional)
     */
    static requireAuth(returnUrl = null) {
        if (!this.isLoggedIn()) {
            if (returnUrl) {
                localStorage.setItem('returnUrl', returnUrl);
            }
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    /**
     * Get and clear return URL after login
     * @returns {string} - Return URL or default dashboard
     */
    static getReturnUrl() {
        const returnUrl = localStorage.getItem('returnUrl');
        localStorage.removeItem('returnUrl');
        
        if (!returnUrl) {
            // Default return URLs based on role
            const role = this.getUserRole();
            if (role === 'recruiter') {
                return '/recruiter-dashboard.html';
            } else if (role === 'admin') {
                return '/admin-dashboard.html';
            }
            return '/locum-dashboard.html';
        }
        
        return returnUrl;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}