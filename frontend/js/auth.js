/**
 * Authentication Module for LocumTrueRate
 * 
 * Handles user authentication state, token management, and user session.
 * Works in conjunction with apiClient.js for authentication operations.
 */

class Auth {
    constructor() {
        this.user = null;
        this.tokenKey = 'authToken';
        this.userKey = 'currentUser';
        this.loadUserFromStorage();
    }

    /**
     * Load user data from localStorage on initialization
     */
    loadUserFromStorage() {
        try {
            const savedUser = localStorage.getItem(this.userKey);
            if (savedUser) {
                this.user = JSON.parse(savedUser);
            }
        } catch (error) {
            console.error('Error loading user from storage:', error);
            this.clearSession();
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!this.getToken() && !!this.user;
    }

    /**
     * Get current user
     * @returns {object|null} Current user object
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Get user role
     * @returns {string|null} User role (locum/recruiter/admin)
     */
    getUserRole() {
        return this.user ? this.user.role : null;
    }

    /**
     * Get authentication token
     * @returns {string|null} JWT token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Set authentication data after login/register
     * @param {string} token - JWT token
     * @param {object} user - User data
     */
    setAuthData(token, user) {
        if (token && user) {
            localStorage.setItem(this.tokenKey, token);
            localStorage.setItem(this.userKey, JSON.stringify(user));
            this.user = user;
            
            // Update apiClient token
            if (window.apiClient) {
                window.apiClient.setToken(token);
            }
        }
    }

    /**
     * Clear authentication session
     */
    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.user = null;
        
        // Clear apiClient token
        if (window.apiClient) {
            window.apiClient.removeToken();
        }
    }

    /**
     * Login user
     * @param {object} credentials - Login credentials
     * @returns {Promise} Login response
     */
    async login(credentials) {
        try {
            const response = await window.apiClient.login(credentials);
            
            if (response.token && response.user) {
                this.setAuthData(response.token, response.user);
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Register new user
     * @param {object} userData - Registration data
     * @returns {Promise} Registration response
     */
    async register(userData) {
        try {
            const response = await window.apiClient.register(userData);
            
            if (response.token && response.user) {
                this.setAuthData(response.token, response.user);
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await window.apiClient.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        }
        
        this.clearSession();
        
        // Redirect to home page
        window.location.href = '/frontend/index.html';
    }

    /**
     * Refresh user data from API
     * @returns {Promise} Updated user data
     */
    async refreshUserData() {
        try {
            const user = await window.apiClient.getCurrentUser();
            
            if (user) {
                this.user = user;
                localStorage.setItem(this.userKey, JSON.stringify(user));
            }
            
            return user;
        } catch (error) {
            // If refresh fails, clear session
            if (error.status === 401) {
                this.clearSession();
            }
            throw error;
        }
    }

    /**
     * Check if user has specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean} Permission status
     */
    hasPermission(permission) {
        if (!this.user || !this.user.permissions) {
            return false;
        }
        
        return this.user.permissions.includes(permission);
    }

    /**
     * Check if user has specific role
     * @param {string} role - Role to check
     * @returns {boolean} Role match status
     */
    hasRole(role) {
        return this.user && this.user.role === role;
    }

    /**
     * Redirect based on user role
     */
    redirectToDashboard() {
        const role = this.getUserRole();
        
        switch (role) {
            case 'locum':
                window.location.href = '/frontend/locum-dashboard.html';
                break;
            case 'recruiter':
                window.location.href = '/frontend/recruiter-dashboard.html';
                break;
            case 'admin':
                window.location.href = '/frontend/admin-dashboard.html';
                break;
            default:
                window.location.href = '/frontend/index.html';
        }
    }

    /**
     * Check authentication and redirect if not authenticated
     * @param {array} allowedRoles - Array of allowed roles for the page
     */
    requireAuth(allowedRoles = []) {
        if (!this.isAuthenticated()) {
            // Store intended destination
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/frontend/locum-dashboard.html';
            return false;
        }
        
        // Check role permissions if specified
        if (allowedRoles.length > 0 && !allowedRoles.includes(this.getUserRole())) {
            this.redirectToDashboard();
            return false;
        }
        
        return true;
    }

    /**
     * Handle post-login redirect
     */
    handlePostLoginRedirect() {
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        
        if (redirectPath) {
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectPath;
        } else {
            this.redirectToDashboard();
        }
    }
}

// Create singleton instance
window.auth = new Auth();

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', () => {
    // Sync token with apiClient if exists
    const token = window.auth.getToken();
    if (token && window.apiClient) {
        window.apiClient.setToken(token);
    }
});