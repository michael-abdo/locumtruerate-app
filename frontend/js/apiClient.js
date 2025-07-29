// API Client for LocumTrueRate
// Centralized API configuration and request handling

// API Configuration with environment detection
const API_CONFIG = {
    getBaseUrl() {
        // Check environment and return appropriate API URL
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:4000/api/v1';
        } else if (window.location.hostname.includes('herokuapp.com')) {
            // For Heroku deployments, use the same origin
            return window.location.origin + '/api/v1';
        } else {
            // Default to relative URL for production
            return '/api/v1';
        }
    },
    
    // API endpoints
    endpoints: {
        // Authentication
        login: '/auth/login',
        register: '/auth/register',
        logout: '/auth/logout',
        
        // Jobs
        jobs: '/jobs',
        jobById: (id) => `/jobs/${id}`,
        
        // Applications
        applications: '/applications',
        myApplications: '/applications/my',
        applicationsByJob: (jobId) => `/applications/for-job/${jobId}`,
        
        // Calculations
        calculations: '/calculations',
        calculationById: (id) => `/calculations/${id}`,
        
        // GDPR
        myData: '/data-export/my-data',
        privacySummary: '/data-export/privacy-summary',
        requestDeletion: '/data-export/request-deletion'
    }
};

// Authentication State Management
const AuthManager = {
    // Storage keys
    TOKEN_KEY: 'authToken',
    USER_KEY: 'userData',
    TOKEN_EXPIRY_KEY: 'tokenExpiry',
    
    // Save authentication data
    saveAuth(token, user) {
        // Calculate token expiry (24 hours from now)
        const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
        
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
        
        // Dispatch custom event for auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { isAuthenticated: true, user } 
        }));
    },
    
    // Clear authentication data
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        
        // Dispatch custom event for auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { isAuthenticated: false } 
        }));
    },
    
    // Get authentication token
    getToken() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        
        // Check if token is expired
        if (token && expiry) {
            const expiryTime = parseInt(expiry);
            if (new Date().getTime() > expiryTime) {
                // Token expired, clear auth
                this.clearAuth();
                return null;
            }
        }
        
        return token;
    },
    
    // Get current user data
    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },
    
    // Check if token will expire soon (within 5 minutes)
    isTokenExpiringSoon() {
        const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (!expiry) return false;
        
        const expiryTime = parseInt(expiry);
        const fiveMinutes = 5 * 60 * 1000;
        return (expiryTime - new Date().getTime()) < fiveMinutes;
    }
};

// API Client
const ApiClient = {
    // Make authenticated API request
    async request(endpoint, options = {}) {
        const url = API_CONFIG.getBaseUrl() + endpoint;
        const token = AuthManager.getToken();
        
        // Default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add auth token if available
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                AuthManager.clearAuth();
                // Show login modal if available
                if (typeof LocumUtils !== 'undefined' && LocumUtils.showLoginModal) {
                    LocumUtils.showLoginModal();
                }
                throw new Error('Authentication required');
            }
            
            // Parse response
            const data = await response.json();
            
            // Handle non-OK responses
            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.message || data.error || 'Request failed',
                    errors: data.errors || {},
                    data
                };
            }
            
            return data;
            
        } catch (error) {
            // Network errors
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw {
                    status: 0,
                    message: 'Network error. Please check your connection.',
                    isNetworkError: true
                };
            }
            
            // Re-throw other errors
            throw error;
        }
    },
    
    // Convenience methods
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },
    
    post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
};

// Authentication API
const AuthAPI = {
    async login(email, password) {
        try {
            const response = await ApiClient.post(API_CONFIG.endpoints.login, {
                email,
                password
            });
            
            // Save authentication data
            if (response.token && response.user) {
                AuthManager.saveAuth(response.token, response.user);
            }
            
            return response;
        } catch (error) {
            // Enhance error messages for common cases
            if (error.status === 401) {
                error.message = 'Invalid email or password';
            }
            throw error;
        }
    },
    
    async register(userData) {
        try {
            const response = await ApiClient.post(API_CONFIG.endpoints.register, userData);
            
            // Auto-login after successful registration
            if (response.token && response.user) {
                AuthManager.saveAuth(response.token, response.user);
            } else if (response.user) {
                // If no token returned, try logging in
                await this.login(userData.email, userData.password);
            }
            
            return response;
        } catch (error) {
            // Enhance error messages for common cases
            if (error.status === 409) {
                error.message = 'An account with this email already exists';
            } else if (error.status === 400 && error.errors) {
                // Format validation errors
                const errorMessages = Object.entries(error.errors)
                    .map(([field, message]) => message)
                    .join('. ');
                error.message = errorMessages || 'Please check your information and try again';
            }
            throw error;
        }
    },
    
    async logout() {
        try {
            // Call logout endpoint if authenticated
            if (AuthManager.isAuthenticated()) {
                await ApiClient.post(API_CONFIG.endpoints.logout);
            }
        } catch (error) {
            // Ignore logout errors
            console.warn('Logout API call failed:', error);
        } finally {
            // Always clear local auth data
            AuthManager.clearAuth();
        }
    }
};

// Export for use in other files
window.ApiClient = ApiClient;
window.AuthManager = AuthManager;
window.AuthAPI = AuthAPI;
window.API_CONFIG = API_CONFIG;