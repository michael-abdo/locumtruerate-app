/**
 * UI Helper
 * Provides loading states, toast notifications, and other UI utilities
 */

class UI {
    // Toast notification types
    static TOAST_TYPES = {
        SUCCESS: 'success',
        ERROR: 'error',
        INFO: 'info',
        WARNING: 'warning'
    };

    // Loading spinner HTML
    static SPINNER_HTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;

    /**
     * Initialize UI helpers (call once on page load)
     */
    static init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Add required CSS if not already present
        if (!document.getElementById('ui-helper-styles')) {
            const style = document.createElement('style');
            style.id = 'ui-helper-styles';
            style.textContent = this.getStyles();
            document.head.appendChild(style);
        }
    }

    /**
     * Show loading state on an element
     * @param {HTMLElement|string} element - Element or selector
     * @param {string} message - Loading message (optional)
     */
    static showLoading(element, message = 'Loading...') {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        
        if (!el) return;

        // Store original content
        el.setAttribute('data-original-content', el.innerHTML);
        el.classList.add('loading');
        
        // Add spinner and message
        el.innerHTML = `
            ${this.SPINNER_HTML}
            ${message ? `<p class="loading-message">${message}</p>` : ''}
        `;
        
        // Disable if it's a form element
        if (el.tagName === 'BUTTON' || el.tagName === 'INPUT') {
            el.disabled = true;
        }
    }

    /**
     * Hide loading state and restore original content
     * @param {HTMLElement|string} element - Element or selector
     */
    static hideLoading(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        
        if (!el) return;

        const originalContent = el.getAttribute('data-original-content');
        
        if (originalContent !== null) {
            el.innerHTML = originalContent;
            el.removeAttribute('data-original-content');
        }
        
        el.classList.remove('loading');
        
        // Re-enable if it's a form element
        if (el.tagName === 'BUTTON' || el.tagName === 'INPUT') {
            el.disabled = false;
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, info, warning)
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    static showToast(message, type = 'info', duration = 3000) {
        // Initialize if needed
        this.init();

        const toastContainer = document.getElementById('toast-container');
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Add icon based on type
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-content">
                ${icon}
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     * @param {number} duration - Duration in milliseconds
     */
    static showError(message, duration = 5000) {
        this.showToast(message, this.TOAST_TYPES.ERROR, duration);
    }

    /**
     * Show success message
     * @param {string} message - Success message
     * @param {number} duration - Duration in milliseconds
     */
    static showSuccess(message, duration = 3000) {
        this.showToast(message, this.TOAST_TYPES.SUCCESS, duration);
    }

    /**
     * Show info message
     * @param {string} message - Info message
     * @param {number} duration - Duration in milliseconds
     */
    static showInfo(message, duration = 3000) {
        this.showToast(message, this.TOAST_TYPES.INFO, duration);
    }

    /**
     * Show warning message
     * @param {string} message - Warning message
     * @param {number} duration - Duration in milliseconds
     */
    static showWarning(message, duration = 4000) {
        this.showToast(message, this.TOAST_TYPES.WARNING, duration);
    }

    /**
     * Show confirmation dialog (non-blocking)
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Callback for confirmation
     * @param {Function} onCancel - Callback for cancellation (optional)
     */
    static showConfirm(message, onConfirm, onCancel = null) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <p class="modal-message">${message}</p>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
                    <button class="btn btn-primary" id="confirm-ok">OK</button>
                </div>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Show modal
        setTimeout(() => overlay.classList.add('show'), 10);
        
        // Handle button clicks
        const closeModal = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        };
        
        document.getElementById('confirm-ok').onclick = () => {
            closeModal();
            if (onConfirm) onConfirm();
        };
        
        document.getElementById('confirm-cancel').onclick = () => {
            closeModal();
            if (onCancel) onCancel();
        };
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeModal();
                if (onCancel) onCancel();
            }
        };
    }

    /**
     * Show/hide element with fade animation
     * @param {HTMLElement|string} element - Element or selector
     * @param {boolean} show - Show or hide
     */
    static fadeToggle(element, show) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        
        if (!el) return;

        if (show) {
            el.style.display = 'block';
            setTimeout(() => el.classList.add('fade-in'), 10);
        } else {
            el.classList.remove('fade-in');
            setTimeout(() => el.style.display = 'none', 300);
        }
    }

    /**
     * Disable form while processing
     * @param {HTMLFormElement|string} form - Form element or selector
     * @param {boolean} disable - Disable or enable
     */
    static disableForm(form, disable = true) {
        const formEl = typeof form === 'string' ? document.querySelector(form) : form;
        
        if (!formEl) return;

        const inputs = formEl.querySelectorAll('input, textarea, select, button');
        inputs.forEach(input => {
            input.disabled = disable;
        });
        
        if (disable) {
            formEl.classList.add('form-disabled');
        } else {
            formEl.classList.remove('form-disabled');
        }
    }

    /**
     * Get toast icon based on type
     * @param {string} type - Toast type
     * @returns {string} - Icon HTML
     */
    static getToastIcon(type) {
        const icons = {
            success: '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
            error: '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
            info: '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
            warning: '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
        };
        
        return icons[type] || icons.info;
    }

    /**
     * Get required CSS styles
     * @returns {string} - CSS styles
     */
    static getStyles() {
        return `
            /* Toast Container */
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            }
            
            /* Toast Styles */
            .toast {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 10px;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 500px;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                pointer-events: all;
            }
            
            .toast.show {
                transform: translateX(0);
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .toast-icon {
                width: 24px;
                height: 24px;
                flex-shrink: 0;
                fill: currentColor;
            }
            
            .toast-message {
                color: #333;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .toast-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
                padding: 0;
                margin-left: 12px;
                line-height: 1;
            }
            
            .toast-close:hover {
                color: #666;
            }
            
            /* Toast Types */
            .toast-success {
                border-left: 4px solid #10b981;
            }
            
            .toast-success .toast-icon {
                color: #10b981;
            }
            
            .toast-error {
                border-left: 4px solid #ef4444;
            }
            
            .toast-error .toast-icon {
                color: #ef4444;
            }
            
            .toast-info {
                border-left: 4px solid #3b82f6;
            }
            
            .toast-info .toast-icon {
                color: #3b82f6;
            }
            
            .toast-warning {
                border-left: 4px solid #f59e0b;
            }
            
            .toast-warning .toast-icon {
                color: #f59e0b;
            }
            
            /* Loading Spinner */
            .spinner-container {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-message {
                margin-top: 10px;
                text-align: center;
                color: #666;
            }
            
            /* Modal Overlay */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal-overlay.show {
                opacity: 1;
            }
            
            .confirm-modal {
                background: white;
                border-radius: 8px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }
            
            .modal-message {
                margin: 0 0 20px;
                font-size: 16px;
                color: #333;
            }
            
            .modal-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            /* Utility Classes */
            .loading {
                position: relative;
                min-height: 100px;
            }
            
            .form-disabled {
                opacity: 0.6;
                pointer-events: none;
            }
            
            .fade-in {
                opacity: 1;
                transition: opacity 0.3s ease;
            }
        `;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}