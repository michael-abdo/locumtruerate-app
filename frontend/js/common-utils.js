/**
 * Common Frontend Utilities
 * 
 * Centralized JavaScript utilities to eliminate duplicate code across HTML files.
 * This file provides shared functions for toast notifications, validation, formatting,
 * and other common frontend operations.
 */

// Create global LocumUtils namespace
window.LocumUtils = window.LocumUtils || {};

(function() {
    'use strict';

    /**
     * Toast Notification System
     * Centralized toast notifications with consistent styling and behavior
     * @param {string} message - Message to display
     * @param {string} type - Toast type: 'success', 'error', 'warning', 'info' 
     * @param {number} duration - Duration in ms (default: 3000)
     */
    function showToast(message, type = 'info', duration = 3000) {
        // Remove any existing toasts
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Set content with close button
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    /**
     * Notification System (Alias for showToast)
     * Used throughout the app for consistent notifications
     * @param {string} message - Message to display
     * @param {string} type - Notification type: 'success', 'error', 'warning', 'info' 
     * @param {number} duration - Duration in ms (default: 3000)
     */
    function showNotification(message, type = 'info', duration = 3000) {
        showToast(message, type, duration);
    }

    /**
     * Currency Formatting
     * Consistent currency formatting across all applications
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (default: 'USD')
     * @returns {string} Formatted currency string
     */
    function formatCurrency(amount, currency = 'USD') {
        // Handle edge cases
        if (amount === 0 || amount === -0 || (amount < 0 && amount > -0.01)) {
            return '$0.00';
        }
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Date Formatting
     * Consistent date formatting across applications  
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type: 'short', 'long', 'relative'
     * @returns {string} Formatted date string
     */
    function formatDate(date, format = 'short') {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (format === 'relative') {
            return formatRelativeTime(dateObj);
        }
        
        const options = format === 'long' ? 
            { year: 'numeric', month: 'long', day: 'numeric' } :
            { year: 'numeric', month: 'short', day: 'numeric' };
            
        return dateObj.toLocaleDateString('en-US', options);
    }

    /**
     * Relative Time Formatting
     * Format dates relative to current time (e.g., "2 hours ago")
     * @param {Date} date - Date to format
     * @returns {string} Relative time string
     */
    function formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 60) {
            return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
        } else if (diffHours < 24) {
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        } else if (diffDays < 7) {
            return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
        } else {
            return formatDate(date, 'short');
        }
    }

    /**
     * Input Validation
     * Centralized input validation with error display
     * @param {HTMLInputElement} input - Input element to validate
     * @param {string} type - Validation type: 'required', 'number', 'email', 'phone'
     * @returns {boolean} True if valid, false otherwise
     */
    function validateInput(input, type = 'required') {
        const errorElement = document.getElementById(input.id + '-error');
        
        // Clear previous errors
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }

        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (type === 'required' || type.includes('required')) {
            if (!value) {
                isValid = false;
                errorMessage = 'This field is required';
            }
        }

        // Number validation
        if (type.includes('number') && value) {
            const numberValue = parseFloat(value);
            if (isNaN(numberValue)) {
                isValid = false;
                errorMessage = 'Please enter a valid number';
            } else if (numberValue < 0) {
                isValid = false;
                errorMessage = 'Value must be greater than or equal to 0';
            }
        }

        // Email validation
        if (type.includes('email') && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Phone validation
        if (type.includes('phone') && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        // Display error if validation failed
        if (!isValid && errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
        }

        return isValid;
    }

    /**
     * Form Validation
     * Validate entire forms with comprehensive error handling
     * @param {HTMLFormElement} form - Form element to validate
     * @returns {boolean} True if all inputs are valid
     */
    function validateForm(form) {
        let isFormValid = true;
        
        // Find all inputs that need validation
        const inputs = form.querySelectorAll('input[required], input[data-validate]');
        
        inputs.forEach(input => {
            const validationType = input.dataset.validate || 'required';
            const isValid = validateInput(input, validationType);
            if (!isValid) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    /**
     * Debounced Function Execution
     * Prevent excessive function calls during rapid events (e.g., input typing)
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * API Request Helper
     * Centralized API requests with consistent error handling
     * @param {string} url - API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise} API response promise
     */
    async function apiRequest(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            const response = await fetch(url, { ...defaultOptions, ...options });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            showToast(`Request failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Local Storage Helper
     * Safe localStorage operations with error handling
     * @param {string} key - Storage key
     * @param {any} value - Value to store (optional, for getting)
     * @returns {any} Stored value when getting, undefined on error
     */
    function localStorage(key, value = undefined) {
        try {
            if (value !== undefined) {
                // Set value
                window.localStorage.setItem(key, JSON.stringify(value));
                return value;
            } else {
                // Get value
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            }
        } catch (error) {
            console.error('localStorage operation failed:', error);
            return null;
        }
    }

    /**
     * Element Visibility Toggle
     * Show/hide elements with optional animation
     * @param {HTMLElement|string} element - Element or selector
     * @param {boolean} show - True to show, false to hide
     * @param {string} animation - Animation class (optional)
     */
    function toggleVisibility(element, show, animation = null) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;

        if (show) {
            el.style.display = 'block';
            if (animation) {
                el.classList.add(animation);
            }
        } else {
            if (animation) {
                el.classList.add(animation);
                setTimeout(() => {
                    el.style.display = 'none';
                    el.classList.remove(animation);
                }, 300);
            } else {
                el.style.display = 'none';
            }
        }
    }

    /**
     * Dashboard API Utilities
     * Centralized API functions for all dashboard operations
     */
    
    /**
     * Get authentication headers
     * @returns {Object} Headers with authorization token
     */
    function getAuthHeaders() {
        const token = localStorage('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    /**
     * Handle API errors consistently
     * @param {Response} response - Fetch response object
     * @returns {Promise} Rejected promise with error details
     */
    async function handleApiError(response) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorType = 'api_error';
        
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            errorType = errorData.error || errorType;
        } catch (e) {
            // Response wasn't JSON
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.type = errorType;
        throw error;
    }

    /**
     * Load dashboard data with error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Additional options
     * @returns {Promise} API response data
     */
    async function loadDashboardData(endpoint, options = {}) {
        try {
            const response = await fetch(endpoint, {
                headers: getAuthHeaders(),
                ...options
            });
            
            if (!response.ok) {
                await handleApiError(response);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Failed to load data from ${endpoint}:`, error);
            showToast(error.message || 'Failed to load data', 'error');
            throw error;
        }
    }

    /**
     * Submit form data to API
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Form data to submit
     * @param {string} method - HTTP method (POST, PUT, PATCH)
     * @returns {Promise} API response data
     */
    async function submitFormData(endpoint, data, method = 'POST') {
        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                await handleApiError(response);
            }
            
            const result = await response.json();
            showToast(result.message || 'Operation successful', 'success');
            return result;
        } catch (error) {
            console.error(`Failed to submit data to ${endpoint}:`, error);
            showToast(error.message || 'Failed to submit data', 'error');
            throw error;
        }
    }

    /**
     * Delete resource from API
     * @param {string} endpoint - API endpoint
     * @param {string} confirmMessage - Optional confirmation message
     * @returns {Promise} API response data
     */
    async function deleteResource(endpoint, confirmMessage = null) {
        try {
            // Note: Per CLAUDE.md, we never use confirm()
            // If confirmation is needed, it should be handled by the UI
            
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                await handleApiError(response);
            }
            
            const result = await response.json();
            showToast(result.message || 'Deleted successfully', 'success');
            return result;
        } catch (error) {
            console.error(`Failed to delete resource at ${endpoint}:`, error);
            showToast(error.message || 'Failed to delete', 'error');
            throw error;
        }
    }

    /**
     * Load paginated data
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise} Paginated response
     */
    async function loadPaginatedData(endpoint, params = {}) {
        const queryParams = new URLSearchParams(params);
        const url = `${endpoint}?${queryParams}`;
        
        return loadDashboardData(url);
    }

    /**
     * Search/filter data
     * @param {string} endpoint - API endpoint
     * @param {Object} filters - Filter parameters
     * @returns {Promise} Filtered results
     */
    async function searchData(endpoint, filters = {}) {
        // Remove empty filters
        const activeFilters = Object.entries(filters)
            .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        
        return loadPaginatedData(endpoint, activeFilters);
    }

    /**
     * Export data in various formats
     * @param {string} endpoint - API endpoint
     * @param {string} format - Export format (csv, json, pdf)
     * @param {Object} params - Additional parameters
     */
    async function exportData(endpoint, format = 'csv', params = {}) {
        try {
            const queryParams = new URLSearchParams({ ...params, format });
            const url = `${endpoint}?${queryParams}`;
            
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                await handleApiError(response);
            }
            
            // Handle different response types
            if (format === 'json') {
                return await response.json();
            } else {
                // For CSV/PDF, trigger download
                const blob = await response.blob();
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `export-${Date.now()}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
                
                showToast('Export downloaded successfully', 'success');
            }
        } catch (error) {
            console.error(`Failed to export data:`, error);
            showToast(error.message || 'Failed to export data', 'error');
            throw error;
        }
    }

    /**
     * Initialize dashboard with common functionality
     * @param {Object} config - Dashboard configuration
     */
    function initializeDashboard(config = {}) {
        const {
            loadInitialData = true,
            setupEventListeners = true,
            dataEndpoint = null,
            refreshInterval = null
        } = config;
        
        document.addEventListener('DOMContentLoaded', async () => {
            // Load initial data if endpoint provided
            if (loadInitialData && dataEndpoint) {
                try {
                    const data = await loadDashboardData(dataEndpoint);
                    if (config.onDataLoaded) {
                        config.onDataLoaded(data);
                    }
                } catch (error) {
                    console.error('Failed to load initial dashboard data:', error);
                }
            }
            
            // Setup common event listeners
            if (setupEventListeners) {
                // Logout handler
                const logoutBtn = document.querySelector('[data-action="logout"]');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        try {
                            await apiRequest('/api/v1/auth/logout', { method: 'POST' });
                            localStorage('authToken', null);
                            window.location.href = '/login.html';
                        } catch (error) {
                            console.error('Logout failed:', error);
                        }
                    });
                }
                
                // Search form handler
                const searchForm = document.querySelector('[data-role="search-form"]');
                if (searchForm) {
                    searchForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const formData = new FormData(searchForm);
                        const filters = Object.fromEntries(formData);
                        if (config.onSearch) {
                            config.onSearch(filters);
                        }
                    });
                }
            }
            
            // Setup auto-refresh if configured
            if (refreshInterval && dataEndpoint) {
                setInterval(async () => {
                    try {
                        const data = await loadDashboardData(dataEndpoint);
                        if (config.onDataLoaded) {
                            config.onDataLoaded(data);
                        }
                    } catch (error) {
                        console.error('Auto-refresh failed:', error);
                    }
                }, refreshInterval);
            }
        });
    }

    /**
     * Authentication Modal HTML Templates
     * Centralized modal templates for login and registration
     */
    
    // Login Modal HTML Template
    const loginModalHTML = `
        <div id="loginModal" class="auth-modal" role="dialog" aria-labelledby="loginModalTitle" aria-modal="true">
            <div class="modal-backdrop" aria-hidden="true"></div>
            <div class="modal-content" role="document">
                <div class="modal-header">
                    <h2 id="loginModalTitle" class="modal-title">Login to LocumTrueRate</h2>
                    <button type="button" class="modal-close" aria-label="Close login modal" data-action="close-modal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="loginForm" class="auth-form" novalidate>
                        <div class="form-group">
                            <label for="loginEmail" class="form-label">Email Address</label>
                            <input 
                                type="email" 
                                id="loginEmail" 
                                name="email" 
                                class="form-control" 
                                required 
                                autocomplete="email"
                                aria-describedby="loginEmailError"
                                placeholder="Enter your email address"
                            >
                            <div id="loginEmailError" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="loginPassword" class="form-label">Password</label>
                            <div class="password-input-wrapper">
                                <input 
                                    type="password" 
                                    id="loginPassword" 
                                    name="password" 
                                    class="form-control" 
                                    required 
                                    autocomplete="current-password"
                                    aria-describedby="loginPasswordError"
                                    placeholder="Enter your password"
                                >
                                <button 
                                    type="button" 
                                    class="password-toggle" 
                                    aria-label="Toggle password visibility"
                                    data-target="loginPassword"
                                >
                                    <span class="toggle-icon" aria-hidden="true">👁</span>
                                </button>
                            </div>
                            <div id="loginPasswordError" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" id="loginSubmit" class="btn btn-primary btn-block">
                                <span class="button-text">Login</span>
                                <span id="loginSpinner" class="loading-spinner" style="display: none;" aria-hidden="true">
                                    <span class="spinner"></span>
                                </span>
                            </button>
                        </div>
                        
                        <div class="form-footer">
                            <p class="switch-form-text">
                                Don't have an account? 
                                <button type="button" class="link-button" data-action="switch-to-register">
                                    Create Account
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    /**
     * Show Login Modal
     * Display the login modal and set up event listeners
     */
    function showLoginModal() {
        // Inject modal HTML if not already present
        if (!document.getElementById('loginModal')) {
            document.body.insertAdjacentHTML('beforeend', loginModalHTML);
            setupModalEventListeners('loginModal');
        }
        
        const modal = document.getElementById('loginModal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus on first input for accessibility
        setTimeout(() => {
            const firstInput = modal.querySelector('#loginEmail');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Hide Login Modal
     * Hide the login modal and clean up
     */
    function hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            
            // Clear form data
            const form = modal.querySelector('#loginForm');
            if (form) form.reset();
            clearFormErrors(form);
        }
    }

    // Register Modal HTML Template
    const registerModalHTML = `
        <div id="registerModal" class="auth-modal" role="dialog" aria-labelledby="registerModalTitle" aria-modal="true">
            <div class="modal-backdrop" aria-hidden="true"></div>
            <div class="modal-content" role="document">
                <div class="modal-header">
                    <h2 id="registerModalTitle" class="modal-title">Register for LocumTrueRate</h2>
                    <button type="button" class="modal-close" aria-label="Close registration modal" data-action="close-modal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="registerForm" class="auth-form" novalidate>
                        <div class="form-row">
                            <div class="form-group form-group-half">
                                <label for="registerFirstName" class="form-label">First Name</label>
                                <input 
                                    type="text" 
                                    id="registerFirstName" 
                                    name="firstName" 
                                    class="form-control" 
                                    required 
                                    autocomplete="given-name"
                                    aria-describedby="registerFirstNameError"
                                    placeholder="Enter your first name"
                                >
                                <div id="registerFirstNameError" class="error-message" role="alert" aria-live="polite"></div>
                            </div>
                            
                            <div class="form-group form-group-half">
                                <label for="registerLastName" class="form-label">Last Name</label>
                                <input 
                                    type="text" 
                                    id="registerLastName" 
                                    name="lastName" 
                                    class="form-control" 
                                    required 
                                    autocomplete="family-name"
                                    aria-describedby="registerLastNameError"
                                    placeholder="Enter your last name"
                                >
                                <div id="registerLastNameError" class="error-message" role="alert" aria-live="polite"></div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="registerEmail" class="form-label">Email Address</label>
                            <input 
                                type="email" 
                                id="registerEmail" 
                                name="email" 
                                class="form-control" 
                                required 
                                autocomplete="email"
                                aria-describedby="registerEmailError"
                                placeholder="Enter your email address"
                            >
                            <div id="registerEmailError" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="registerPassword" class="form-label">Password</label>
                            <div class="password-input-wrapper">
                                <input 
                                    type="password" 
                                    id="registerPassword" 
                                    name="password" 
                                    class="form-control" 
                                    required 
                                    autocomplete="new-password"
                                    aria-describedby="registerPasswordError registerPasswordHelp"
                                    placeholder="Enter your password"
                                    minlength="6"
                                >
                                <button 
                                    type="button" 
                                    class="password-toggle" 
                                    aria-label="Toggle password visibility"
                                    data-target="registerPassword"
                                >
                                    <span class="toggle-icon" aria-hidden="true">👁</span>
                                </button>
                            </div>
                            <div id="registerPasswordHelp" class="form-help">Minimum 6 characters</div>
                            <div id="registerPasswordError" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="registerPasswordConfirm" class="form-label">Confirm Password</label>
                            <div class="password-input-wrapper">
                                <input 
                                    type="password" 
                                    id="registerPasswordConfirm" 
                                    name="passwordConfirm" 
                                    class="form-control" 
                                    required 
                                    autocomplete="new-password"
                                    aria-describedby="registerPasswordConfirmError"
                                    placeholder="Confirm your password"
                                >
                                <button 
                                    type="button" 
                                    class="password-toggle" 
                                    aria-label="Toggle password confirmation visibility"
                                    data-target="registerPasswordConfirm"
                                >
                                    <span class="toggle-icon" aria-hidden="true">👁</span>
                                </button>
                            </div>
                            <div id="registerPasswordConfirmError" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="registerRole" class="form-label">Account Type</label>
                            <select 
                                id="registerRole" 
                                name="role" 
                                class="form-control" 
                                required
                                aria-describedby="registerRoleError"
                            >
                                <option value="">Select your account type</option>
                                <option value="locum">Healthcare Professional (Locum)</option>
                                <option value="recruiter">Recruiter</option>
                            </select>
                            <div id="registerRoleError" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="registerPhone" class="form-label">Phone Number <span class="optional">(Optional)</span></label>
                            <input 
                                type="tel" 
                                id="registerPhone" 
                                name="phone" 
                                class="form-control" 
                                autocomplete="tel"
                                aria-describedby="registerPhoneError"
                                placeholder="Enter your phone number"
                            >
                            <div id="registerPhoneError" class="error-message" role="alert" aria-live="polite"></div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" id="registerSubmit" class="btn btn-primary btn-block">
                                <span class="button-text">Create Account</span>
                                <span id="registerSpinner" class="loading-spinner" style="display: none;" aria-hidden="true">
                                    <span class="spinner"></span>
                                </span>
                            </button>
                        </div>
                        
                        <div class="form-footer">
                            <p class="switch-form-text">
                                Already have an account? 
                                <button type="button" class="link-button" data-action="switch-to-login">
                                    Login
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    /**
     * Show Register Modal
     * Display the register modal and set up event listeners
     */
    function showRegisterModal() {
        // Inject modal HTML if not already present
        if (!document.getElementById('registerModal')) {
            document.body.insertAdjacentHTML('beforeend', registerModalHTML);
            setupModalEventListeners('registerModal');
        }
        
        const modal = document.getElementById('registerModal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus on first input for accessibility
        setTimeout(() => {
            const firstInput = modal.querySelector('#registerFirstName');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Hide Register Modal
     * Hide the register modal and clean up
     */
    function hideRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            
            // Clear form data
            const form = modal.querySelector('#registerForm');
            if (form) form.reset();
            clearFormErrors(form);
        }
    }

    /**
     * Switch Between Login and Register Modals
     */
    function switchToRegister() {
        hideLoginModal();
        setTimeout(() => showRegisterModal(), 100);
    }
    
    function switchToLogin() {
        hideRegisterModal();
        setTimeout(() => showLoginModal(), 100);
    }

    /**
     * Clear Form Errors
     * Remove all error messages and styling from a form
     * @param {HTMLFormElement} form - Form to clear errors from
     */
    function clearFormErrors(form) {
        if (!form) return;
        
        // Clear all error messages
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
        
        // Remove error styling from inputs
        const inputs = form.querySelectorAll('.form-control.error');
        inputs.forEach(input => {
            input.classList.remove('error');
        });
    }

    /**
     * Setup Modal Event Listeners
     * Add event listeners for modal interactions
     * @param {string} modalId - ID of the modal to set up
     */
    function setupModalEventListeners(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Close modal on backdrop click
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                if (modalId === 'loginModal') hideLoginModal();
                if (modalId === 'registerModal') hideRegisterModal();
            });
        }
        
        // Close modal on close button click
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (modalId === 'loginModal') hideLoginModal();
                if (modalId === 'registerModal') hideRegisterModal();
            });
        }
        
        // Handle form switching
        const switchButtons = modal.querySelectorAll('[data-action^="switch-to-"]');
        switchButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.getAttribute('data-action');
                if (action === 'switch-to-register') switchToRegister();
                if (action === 'switch-to-login') switchToLogin();
            });
        });
        
        // Handle password visibility toggles
        const toggleButtons = modal.querySelectorAll('.password-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                if (targetInput) {
                    const isPassword = targetInput.type === 'password';
                    targetInput.type = isPassword ? 'text' : 'password';
                    button.querySelector('.toggle-icon').textContent = isPassword ? '🙈' : '👁';
                    button.setAttribute('aria-label', 
                        isPassword ? 'Hide password' : 'Show password'
                    );
                }
            });
        });
        
        // Handle ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                if (modalId === 'loginModal') hideLoginModal();
                if (modalId === 'registerModal') hideRegisterModal();
            }
        });
        
        // Trap focus within modal for accessibility
        trapFocusInModal(modal);
    }

    /**
     * Trap Focus in Modal
     * Keep focus within modal for accessibility
     * @param {HTMLElement} modal - Modal element
     */
    function trapFocusInModal(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    /**
     * Handle Login Form Submission
     * Validates form and calls login API
     */
    async function handleLoginSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('#loginSubmit');
        const spinner = form.querySelector('#loginSpinner');
        const emailInput = form.querySelector('#loginEmail');
        const passwordInput = form.querySelector('#loginPassword');
        
        // Clear previous errors
        clearFormErrors(form);
        
        // Basic validation
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            showFormError(form, 'Please fill in all fields');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showFieldError(emailInput, 'Please enter a valid email address');
            return;
        }
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        if (spinner) spinner.style.display = 'inline-block';
        
        try {
            // Check if AuthAPI is available
            if (typeof AuthAPI === 'undefined') {
                throw new Error('Authentication system not loaded. Please refresh the page.');
            }
            
            // Call login API
            const response = await AuthAPI.login(email, password);
            
            // Success - close modal and update UI
            hideLoginModal();
            showNotification('Login successful! Welcome back.', 'success');
            
            // Update UI for logged-in state
            updateAuthUI();
            
            // Redirect if there was an intended destination
            const intendedUrl = sessionStorage.getItem('intendedUrl');
            if (intendedUrl) {
                sessionStorage.removeItem('intendedUrl');
                window.location.href = intendedUrl;
            }
            
        } catch (error) {
            // Handle errors
            if (error.status === 401) {
                showFormError(form, 'Invalid email or password');
            } else if (error.isNetworkError) {
                showFormError(form, 'Network error. Please check your connection.');
            } else {
                showFormError(form, error.message || 'Login failed. Please try again.');
            }
        } finally {
            // Reset loading state
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
            if (spinner) spinner.style.display = 'none';
        }
    }

    /**
     * Handle Register Form Submission
     * Validates form and calls register API
     */
    async function handleRegisterSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('#registerSubmit');
        const spinner = form.querySelector('#registerSpinner');
        
        // Get form values
        const formData = {
            firstName: form.querySelector('#registerFirstName').value.trim(),
            lastName: form.querySelector('#registerLastName').value.trim(),
            email: form.querySelector('#registerEmail').value.trim(),
            password: form.querySelector('#registerPassword').value,
            role: form.querySelector('#registerRole').value,
            phone: form.querySelector('#registerPhone').value.trim()
        };
        
        const confirmPassword = form.querySelector('#registerPasswordConfirm').value;
        
        // Clear previous errors
        clearFormErrors(form);
        
        // Validation
        const errors = [];
        
        if (!formData.firstName) errors.push({ field: 'registerFirstName', message: 'First name is required' });
        if (!formData.lastName) errors.push({ field: 'registerLastName', message: 'Last name is required' });
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            errors.push({ field: 'registerEmail', message: 'Email is required' });
        } else if (!emailRegex.test(formData.email)) {
            errors.push({ field: 'registerEmail', message: 'Please enter a valid email address' });
        }
        
        if (!formData.password) {
            errors.push({ field: 'registerPassword', message: 'Password is required' });
        } else if (formData.password.length < 6) {
            errors.push({ field: 'registerPassword', message: 'Password must be at least 6 characters' });
        }
        
        if (formData.password !== confirmPassword) {
            errors.push({ field: 'registerPasswordConfirm', message: 'Passwords do not match' });
        }
        
        if (!formData.role) {
            errors.push({ field: 'registerRole', message: 'Please select your account type' });
        }
        
        // Show validation errors
        if (errors.length > 0) {
            errors.forEach(error => {
                const field = form.querySelector(`#${error.field}`);
                if (field) showFieldError(field, error.message);
            });
            return;
        }
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
        if (spinner) spinner.style.display = 'inline-block';
        
        try {
            // Check if AuthAPI is available
            if (typeof AuthAPI === 'undefined') {
                throw new Error('Authentication system not loaded. Please refresh the page.');
            }
            
            // Call register API
            const response = await AuthAPI.register(formData);
            
            // Success - close modal and update UI
            hideRegisterModal();
            showNotification('Account created successfully! Welcome to LocumTrueRate.', 'success');
            
            // Update UI for logged-in state
            updateAuthUI();
            
            // Redirect to appropriate dashboard
            if (formData.role === 'recruiter') {
                window.location.href = '/recruiter-dashboard.html';
            } else if (formData.role === 'locum') {
                window.location.href = '/locum-dashboard.html';
            }
            
        } catch (error) {
            // Handle errors
            if (error.status === 409) {
                showFieldError(form.querySelector('#registerEmail'), 'An account with this email already exists');
            } else if (error.status === 400 && error.errors) {
                // Show field-specific errors
                Object.entries(error.errors).forEach(([field, message]) => {
                    const fieldElement = form.querySelector(`#register${field.charAt(0).toUpperCase() + field.slice(1)}`);
                    if (fieldElement) showFieldError(fieldElement, message);
                });
            } else {
                showFormError(form, error.message || 'Registration failed. Please try again.');
            }
        } finally {
            // Reset loading state
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
            if (spinner) spinner.style.display = 'none';
        }
    }

    /**
     * Show Form Error
     * Display error message at form level
     */
    function showFormError(form, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error alert alert-danger';
        errorDiv.textContent = message;
        errorDiv.style.marginBottom = '1rem';
        
        // Insert at top of form
        form.insertBefore(errorDiv, form.firstChild);
    }

    /**
     * Show Field Error
     * Display error message for specific field
     */
    function showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        // Create or update error message
        let errorEl = field.parentElement.querySelector('.invalid-feedback');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'invalid-feedback';
            field.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    /**
     * Update Auth UI
     * Update navigation and UI elements based on authentication state
     */
    function updateAuthUI() {
        // Check if AuthManager is available
        if (typeof AuthManager === 'undefined') {
            console.warn('AuthManager not loaded yet');
            return;
        }
        
        const isAuthenticated = AuthManager.isAuthenticated();
        const user = AuthManager.getUser();
        
        // Update navigation
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenu = document.querySelectorAll('.user-menu');
        
        authButtons.forEach(el => {
            el.style.display = isAuthenticated ? 'none' : 'block';
        });
        
        userMenu.forEach(el => {
            el.style.display = isAuthenticated ? 'block' : 'none';
            if (isAuthenticated && user) {
                const userName = el.querySelector('.user-name');
                if (userName) {
                    userName.textContent = `${user.firstName} ${user.lastName}`;
                }
            }
        });
        
        // Update any auth-dependent elements
        document.querySelectorAll('[data-auth-required]').forEach(el => {
            el.style.display = isAuthenticated ? 'block' : 'none';
        });
        
        document.querySelectorAll('[data-auth-hidden]').forEach(el => {
            el.style.display = isAuthenticated ? 'none' : 'block';
        });
        
        // Update navigation links for authenticated users
        if (isAuthenticated) {
            // Check if My Applications link exists in nav
            const navs = document.querySelectorAll('nav ul');
            navs.forEach(nav => {
                const hasApplicationsLink = nav.querySelector('a[href="applications.html"]');
                if (!hasApplicationsLink) {
                    // Find the position to insert (after Jobs)
                    const jobsLink = nav.querySelector('a[href="job-board.html"]');
                    if (jobsLink && jobsLink.parentElement) {
                        const applicationsLi = document.createElement('li');
                        applicationsLi.innerHTML = '<a href="applications.html">My Applications</a>';
                        jobsLink.parentElement.parentElement.insertBefore(
                            applicationsLi, 
                            jobsLink.parentElement.nextSibling
                        );
                    }
                }
            });
        } else {
            // Remove My Applications link for non-authenticated users
            const applicationsLinks = document.querySelectorAll('nav a[href="applications.html"]');
            applicationsLinks.forEach(link => {
                if (link.parentElement.tagName === 'LI') {
                    link.parentElement.remove();
                }
            });
        }
    }

    // Application Modal HTML Template
    const applicationModalHTML = `
        <div id="applicationModal" class="auth-modal" role="dialog" aria-labelledby="applicationModalTitle" aria-modal="true">
            <div class="modal-backdrop" aria-hidden="true"></div>
            <div class="modal-content" role="document" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2 id="applicationModalTitle" class="modal-title">Apply for Position</h2>
                    <button type="button" class="close-btn" aria-label="Close modal" onclick="closeModal('applicationModal')">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div id="applicationJobInfo" style="background: var(--background-color); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                        <!-- Job info will be populated dynamically -->
                    </div>
                    
                    <form id="applicationForm" novalidate>
                        <div class="form-section">
                            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Contact Information</h3>
                            
                            <div class="form-group">
                                <label for="applicantName">Full Name *</label>
                                <input type="text" id="applicantName" name="applicant_name" required 
                                       placeholder="Dr. Jane Smith" autocomplete="name">
                                <span class="error-message" role="alert"></span>
                            </div>
                            
                            <div class="form-group">
                                <label for="applicantEmail">Email Address *</label>
                                <input type="email" id="applicantEmail" name="applicant_email" required 
                                       placeholder="jane.smith@example.com" autocomplete="email">
                                <span class="error-message" role="alert"></span>
                            </div>
                            
                            <div class="form-group">
                                <label for="applicantPhone">Phone Number</label>
                                <input type="tel" id="applicantPhone" name="applicant_phone" 
                                       placeholder="+1-555-0123" autocomplete="tel">
                                <span class="error-message" role="alert"></span>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Application Details</h3>
                            
                            <div class="form-group">
                                <label for="coverLetter">Cover Letter *</label>
                                <textarea id="coverLetter" name="cover_letter" rows="6" required 
                                          placeholder="Introduce yourself and explain why you're interested in this position..."></textarea>
                                <span class="error-message" role="alert"></span>
                            </div>
                            
                            <div class="form-group">
                                <label for="resumeText">Resume/CV (paste text or summary)</label>
                                <textarea id="resumeText" name="resume_text" rows="6" 
                                          placeholder="Paste your resume text or provide a summary of your qualifications..."></textarea>
                                <span class="error-message" role="alert"></span>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Availability & Preferences</h3>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="availabilityStart">Available From</label>
                                    <input type="date" id="availabilityStart" name="availability_start">
                                    <span class="error-message" role="alert"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="availabilityEnd">Available Until</label>
                                    <input type="date" id="availabilityEnd" name="availability_end">
                                    <span class="error-message" role="alert"></span>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="salaryExpectation">Salary Expectation (Annual)</label>
                                    <input type="number" id="salaryExpectation" name="salary_expectation" 
                                           placeholder="200000" step="1000" min="0">
                                    <span class="error-message" role="alert"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="hourlyRateExpectation">Hourly Rate Expectation</label>
                                    <input type="number" id="hourlyRateExpectation" name="hourly_rate_expectation" 
                                           placeholder="120" step="1" min="0">
                                    <span class="error-message" role="alert"></span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="preferredLocation">Preferred Location(s)</label>
                                <input type="text" id="preferredLocation" name="preferred_location" 
                                       placeholder="California, Nevada, Arizona">
                                <span class="error-message" role="alert"></span>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" id="willingToRelocate" name="willing_to_relocate">
                                    <span>Willing to relocate</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Experience & Qualifications</h3>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="yearsExperience">Years of Experience</label>
                                    <input type="number" id="yearsExperience" name="years_experience" 
                                           placeholder="8" min="0" max="60">
                                    <span class="error-message" role="alert"></span>
                                </div>
                                
                                <div class="form-group">
                                    <label for="specialty">Specialty</label>
                                    <input type="text" id="specialty" name="specialty" 
                                           placeholder="Emergency Medicine">
                                    <span class="error-message" role="alert"></span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="additionalNotes">Additional Notes</label>
                                <textarea id="additionalNotes" name="additional_notes" rows="3" 
                                          placeholder="Any additional information you'd like to share..."></textarea>
                                <span class="error-message" role="alert"></span>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <div class="form-group">
                                <label style="display: flex; align-items: flex-start; gap: 0.5rem;">
                                    <input type="checkbox" id="privacyPolicy" name="privacy_policy_accepted" required style="margin-top: 0.25rem;">
                                    <span>I have read and agree to the <a href="#" onclick="event.preventDefault(); alert('Privacy Policy');">Privacy Policy</a> *</span>
                                </label>
                                <span class="error-message" role="alert"></span>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: flex; align-items: flex-start; gap: 0.5rem;">
                                    <input type="checkbox" id="termsAccepted" name="terms_accepted" required style="margin-top: 0.25rem;">
                                    <span>I agree to the <a href="#" onclick="event.preventDefault(); alert('Terms and Conditions');">Terms and Conditions</a> *</span>
                                </label>
                                <span class="error-message" role="alert"></span>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" id="submitApplicationBtn">
                                Submit Application
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="closeModal('applicationModal')">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    /**
     * Display the application modal and populate with job data
     */
    function showApplicationModal(job) {
        // Inject modal HTML if not already present
        if (!document.getElementById('applicationModal')) {
            document.body.insertAdjacentHTML('beforeend', applicationModalHTML);
            setupApplicationModalEventListeners();
        }
        
        const modal = document.getElementById('applicationModal');
        const jobInfo = document.getElementById('applicationJobInfo');
        
        // Populate job information
        if (job && jobInfo) {
            jobInfo.innerHTML = `
                <h4 style="margin: 0 0 0.5rem 0; color: var(--primary-color);">Applying for:</h4>
                <p style="margin: 0; font-weight: 600;">${job.title || 'Position'}</p>
                <p style="margin: 0; color: var(--text-secondary);">${job.location || ''} ${job.facility ? `- ${job.facility}` : ''}</p>
                ${job.hourlyRateMin && job.hourlyRateMax ? 
                    `<p style="margin: 0.5rem 0 0 0; color: var(--success-color); font-weight: 500;">$${job.hourlyRateMin} - $${job.hourlyRateMax}/hr</p>` : 
                    ''}
            `;
        }
        
        // Pre-fill user information if available
        const user = window.AuthManager?.getUser();
        if (user) {
            const emailField = document.getElementById('applicantEmail');
            if (emailField && user.email) {
                emailField.value = user.email;
            }
        }
        
        modal.style.display = 'flex';
        
        // Set focus on first empty input
        setTimeout(() => {
            const firstEmptyInput = modal.querySelector('input:not([type="checkbox"]):not([value])');
            if (firstEmptyInput) firstEmptyInput.focus();
        }, 100);
        
        console.log('Application modal displayed for job:', job);
        
        // Clear any existing errors
        const form = modal.querySelector('#applicationForm');
        if (form) {
            clearFormErrors(form);
        }
    }

    /**
     * Set up event listeners for application modal
     */
    function setupApplicationModalEventListeners() {
        const modal = document.getElementById('applicationModal');
        if (!modal) return;
        
        const form = modal.querySelector('#applicationForm');
        if (form) {
            form.addEventListener('submit', handleApplicationSubmit);
        }
        
        // Close on backdrop click
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => closeModal('applicationModal'));
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal('applicationModal');
            }
        });
    }

    /**
     * Handle application form submission
     */
    async function handleApplicationSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('#submitApplicationBtn');
        
        // Clear previous errors
        clearFormErrors(form);
        
        // Basic validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Get form data
        const formData = new FormData(form);
        const applicationData = {
            job_id: window.currentApplicationJob?.id,
            applicant_name: formData.get('applicant_name'),
            applicant_email: formData.get('applicant_email'),
            applicant_phone: formData.get('applicant_phone') || null,
            cover_letter: formData.get('cover_letter'),
            resume_text: formData.get('resume_text') || null,
            additional_notes: formData.get('additional_notes') || null,
            availability_start: formData.get('availability_start') || null,
            availability_end: formData.get('availability_end') || null,
            salary_expectation: formData.get('salary_expectation') || null,
            hourly_rate_expectation: formData.get('hourly_rate_expectation') || null,
            preferred_location: formData.get('preferred_location') || null,
            willing_to_relocate: formData.get('willing_to_relocate') === 'on',
            years_experience: formData.get('years_experience') || null,
            specialty: formData.get('specialty') || null,
            privacy_policy_accepted: formData.get('privacy_policy_accepted') === 'on',
            terms_accepted: formData.get('terms_accepted') === 'on',
            source: 'company_website',
            consent_to_contact: true
        };
        
        // Validate required checkboxes
        if (!applicationData.privacy_policy_accepted) {
            showFieldError(form.querySelector('[name="privacy_policy_accepted"]'), 'You must accept the privacy policy');
            return;
        }
        
        if (!applicationData.terms_accepted) {
            showFieldError(form.querySelector('[name="terms_accepted"]'), 'You must accept the terms and conditions');
            return;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        try {
            // Submit application via API
            const apiBase = window.API_CONFIG?.getBaseUrl() || 'http://localhost:4000/api/v1';
            const token = window.AuthManager?.getToken();
            
            const response = await fetch(`${apiBase}/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(applicationData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('Application submitted successfully!', 'success');
                form.reset();
                closeModal('applicationModal');
                
                // Optionally refresh applications list if on dashboard
                if (typeof refreshApplicationsList === 'function') {
                    refreshApplicationsList();
                }
            } else {
                showNotification(result.message || 'Failed to submit application', 'error');
            }
        } catch (error) {
            console.error('Application submission error:', error);
            showNotification('An error occurred. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
        }
    }

    /**
     * Setup Authentication Event Listeners
     * Attach form submission handlers
     */
    function setupAuthEventListeners() {
        // Login form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') {
                handleLoginSubmit(e);
            } else if (e.target.id === 'registerForm') {
                handleRegisterSubmit(e);
            }
        });
        
        // Update UI on page load
        updateAuthUI();
        
        // Listen for auth state changes
        window.addEventListener('authStateChanged', updateAuthUI);
        
        // Check token expiry periodically
        setInterval(() => {
            if (typeof AuthManager !== 'undefined' && 
                AuthManager.isAuthenticated() && 
                AuthManager.isTokenExpiringSoon()) {
                showNotification('Your session will expire soon. Please save your work.', 'warning');
            }
        }, 60000); // Check every minute
    }

    // Initialize auth event listeners when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAuthEventListeners);
    } else {
        setupAuthEventListeners();
    }

    // Export functions to global namespace
    window.LocumUtils = {
        showToast,
        showNotification,
        formatCurrency,
        formatDate,
        formatRelativeTime,
        validateInput,
        validateForm,
        debounce,
        apiRequest,
        localStorage,
        toggleVisibility,
        // API utilities
        getAuthHeaders,
        handleApiError,
        loadDashboardData,
        submitFormData,
        deleteResource,
        loadPaginatedData,
        searchData,
        exportData,
        initializeDashboard,
        // Authentication modals
        showLoginModal,
        hideLoginModal,
        showRegisterModal,
        hideRegisterModal,
        switchToLogin,
        switchToRegister,
        // Application modal
        showApplicationModal,
        // Helper functions
        clearFormErrors,
        setupModalEventListeners,
        trapFocusInModal,
        // Authentication handlers
        handleLoginSubmit,
        handleRegisterSubmit,
        updateAuthUI,
        showFormError,
        showFieldError
    };

    // Global alias for backward compatibility
    window.showNotification = showNotification;

})();