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

    // Export functions to global namespace
    window.LocumUtils = {
        showToast,
        formatCurrency,
        formatDate,
        formatRelativeTime,
        validateInput,
        validateForm,
        debounce,
        apiRequest,
        localStorage,
        toggleVisibility
    };

})();