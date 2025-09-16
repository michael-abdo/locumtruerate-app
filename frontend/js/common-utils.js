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
     * Password Strength Validation
     * Check password strength and provide feedback
     * @param {string} password - Password to validate
     * @returns {object} Strength level and suggestions
     */
    function validatePasswordStrength(password) {
        const result = {
            strength: 0,
            level: 'weak',
            suggestions: []
        };
        
        // Length check
        if (password.length < 8) {
            result.suggestions.push('Use at least 8 characters');
        } else {
            result.strength += 1;
        }
        
        // Uppercase check
        if (!/[A-Z]/.test(password)) {
            result.suggestions.push('Add uppercase letters');
        } else {
            result.strength += 1;
        }
        
        // Lowercase check
        if (!/[a-z]/.test(password)) {
            result.suggestions.push('Add lowercase letters');
        } else {
            result.strength += 1;
        }
        
        // Number check
        if (!/\d/.test(password)) {
            result.suggestions.push('Add numbers');
        } else {
            result.strength += 1;
        }
        
        // Special character check
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            result.suggestions.push('Add special characters');
        } else {
            result.strength += 1;
        }
        
        // Set strength level
        if (result.strength <= 2) {
            result.level = 'weak';
        } else if (result.strength <= 3) {
            result.level = 'medium';
        } else {
            result.level = 'strong';
        }
        
        return result;
    }

    /**
     * Serialize Form Data
     * Convert form data to object for API submission
     * @param {HTMLFormElement} form - Form to serialize
     * @returns {object} Form data as object
     */
    function serializeForm(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            // Handle multiple values (like checkboxes)
            if (data[key] !== undefined) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }

    /**
     * Clear Form Errors
     * Remove all error messages from a form
     * @param {HTMLFormElement} form - Form to clear errors from
     */
    function clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
        
        const invalidInputs = form.querySelectorAll('.is-invalid');
        invalidInputs.forEach(input => {
            input.classList.remove('is-invalid');
        });
    }

    /**
     * Show Field Error
     * Display error message for specific field
     * @param {string} fieldId - Field ID
     * @param {string} message - Error message
     */
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + '-error');
        
        if (field) {
            field.classList.add('is-invalid');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
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
     * Loading State Management
     * Show/hide loading indicators and disable/enable UI elements
     * @param {boolean} isLoading - Loading state
     * @param {string|Element} target - Target element or selector
     * @param {object} options - Additional options
     */
    function setLoadingState(isLoading, target, options = {}) {
        const defaults = {
            loadingText: 'Loading...',
            disableInputs: true,
            showOverlay: false,
            spinnerClass: 'spinner-border'
        };
        
        const config = { ...defaults, ...options };
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!element) return;
        
        if (isLoading) {
            // Store original state
            element.dataset.originalContent = element.innerHTML;
            element.dataset.originalDisabled = element.disabled;
            
            // Set loading content
            if (element.tagName === 'BUTTON') {
                element.innerHTML = `<span class="${config.spinnerClass}"></span> ${config.loadingText}`;
                element.disabled = true;
            } else {
                element.classList.add('loading');
                if (config.showOverlay) {
                    const overlay = document.createElement('div');
                    overlay.className = 'loading-overlay';
                    overlay.innerHTML = `<div class="${config.spinnerClass}"></div>`;
                    element.style.position = 'relative';
                    element.appendChild(overlay);
                }
            }
            
            // Disable form inputs if requested
            if (config.disableInputs && element.tagName === 'FORM') {
                element.querySelectorAll('input, select, textarea, button').forEach(input => {
                    input.disabled = true;
                });
            }
        } else {
            // Restore original state
            if (element.dataset.originalContent) {
                element.innerHTML = element.dataset.originalContent;
            }
            
            if (element.dataset.originalDisabled !== 'true') {
                element.disabled = false;
            }
            
            element.classList.remove('loading');
            
            // Remove overlay
            const overlay = element.querySelector('.loading-overlay');
            if (overlay) {
                overlay.remove();
            }
            
            // Re-enable form inputs
            if (config.disableInputs && element.tagName === 'FORM') {
                element.querySelectorAll('input, select, textarea, button').forEach(input => {
                    if (!input.dataset.keepDisabled) {
                        input.disabled = false;
                    }
                });
            }
            
            // Clean up data attributes
            delete element.dataset.originalContent;
            delete element.dataset.originalDisabled;
        }
    }

    /**
     * Show loading spinner
     * Display a fullscreen or inline loading spinner
     * @param {object} options - Spinner options
     * @returns {Element} Spinner element
     */
    function showLoadingSpinner(options = {}) {
        const defaults = {
            fullscreen: false,
            container: document.body,
            message: 'Loading...',
            size: 'medium' // small, medium, large
        };
        
        const config = { ...defaults, ...options };
        
        // Create spinner element
        const spinner = document.createElement('div');
        spinner.className = `loading-spinner ${config.size}`;
        spinner.id = 'loadingSpinner' + Date.now();
        
        if (config.fullscreen) {
            spinner.classList.add('fullscreen');
        }
        
        spinner.innerHTML = `
            <div class="spinner-content">
                <div class="spinner"></div>
                ${config.message ? `<p class="spinner-message">${config.message}</p>` : ''}
            </div>
        `;
        
        // Append to container
        const container = typeof config.container === 'string' ? 
            document.querySelector(config.container) : config.container;
        
        if (container) {
            container.appendChild(spinner);
        }
        
        return spinner;
    }

    /**
     * Hide loading spinner
     * Remove a loading spinner by element or ID
     * @param {Element|string} spinner - Spinner element or ID
     */
    function hideLoadingSpinner(spinner) {
        const element = typeof spinner === 'string' ? 
            document.getElementById(spinner) : spinner;
        
        if (element) {
            element.style.opacity = '0';
            setTimeout(() => {
                element.remove();
            }, 300);
        }
    }

    // Export functions to global namespace
    window.LocumUtils = {
        showToast,
        formatCurrency,
        formatDate,
        formatRelativeTime,
        validateInput,
        validateForm,
        validatePasswordStrength,
        serializeForm,
        clearFormErrors,
        showFieldError,
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
        // Loading utilities
        setLoadingState,
        showLoadingSpinner,
        hideLoadingSpinner
    };

})();