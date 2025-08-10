/**
 * Toast Component - Reusable toast notification system
 * Supports: success, error, warning, info types
 * Features: cancelable toasts, auto-dismiss, stacking, accessibility
 */

(function(window) {
    'use strict';

    // Toast configuration
    const config = {
        position: 'top-right',
        duration: 3000,
        gap: 10,
        maxToasts: 5,
        animationDuration: 300
    };

    // Active toasts tracking
    let activeToasts = [];
    let toastIdCounter = 0;

    /**
     * Create and show a toast notification
     * @param {string} message - The message to display
     * @param {Object} options - Toast options
     * @param {string} options.type - Toast type: success, error, warning, info
     * @param {number} options.duration - Duration in milliseconds (0 for persistent)
     * @param {boolean} options.cancelable - Show cancel button
     * @param {Function} options.onCancel - Callback when toast is cancelled
     * @param {Function} options.onDismiss - Callback when toast is dismissed
     * @returns {Object} Toast instance with methods
     */
    function showToast(message, options = {}) {
        const defaults = {
            type: 'info',
            duration: config.duration,
            cancelable: false,
            onCancel: null,
            onDismiss: null
        };

        const settings = { ...defaults, ...options };
        const toastId = `toast-${++toastIdCounter}`;

        // Create toast element
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast toast-${settings.type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        // Create toast content
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        // Add icon based on type
        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.innerHTML = getIconForType(settings.type);
        
        // Add message
        const messageEl = document.createElement('span');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;

        content.appendChild(icon);
        content.appendChild(messageEl);
        toast.appendChild(content);

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => dismissToast(toastId);
        toast.appendChild(closeBtn);

        // Add cancel button if cancelable
        if (settings.cancelable) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'toast-cancel';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => {
                if (settings.onCancel) settings.onCancel();
                dismissToast(toastId);
            };
            content.appendChild(cancelBtn);
        }

        // Add to DOM
        document.body.appendChild(toast);

        // Position toast
        positionToast(toast);

        // Track active toast
        const toastInstance = {
            id: toastId,
            element: toast,
            settings,
            timer: null
        };
        activeToasts.push(toastInstance);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });

        // Auto-dismiss if duration > 0
        if (settings.duration > 0) {
            toastInstance.timer = setTimeout(() => {
                dismissToast(toastId);
            }, settings.duration);
        }

        // Manage max toasts
        if (activeToasts.length > config.maxToasts) {
            dismissToast(activeToasts[0].id);
        }

        // Return control methods
        return {
            dismiss: () => dismissToast(toastId),
            update: (newMessage) => updateToast(toastId, newMessage)
        };
    }

    /**
     * Dismiss a toast
     * @param {string} toastId - The toast ID to dismiss
     */
    function dismissToast(toastId) {
        const toastIndex = activeToasts.findIndex(t => t.id === toastId);
        if (toastIndex === -1) return;

        const toastInstance = activeToasts[toastIndex];
        const toast = toastInstance.element;

        // Clear timer
        if (toastInstance.timer) {
            clearTimeout(toastInstance.timer);
        }

        // Animate out
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');

        // Remove after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            activeToasts.splice(toastIndex, 1);
            repositionToasts();

            // Call dismiss callback
            if (toastInstance.settings.onDismiss) {
                toastInstance.settings.onDismiss();
            }
        }, config.animationDuration);
    }

    /**
     * Update toast message
     * @param {string} toastId - The toast ID to update
     * @param {string} newMessage - New message
     */
    function updateToast(toastId, newMessage) {
        const toastInstance = activeToasts.find(t => t.id === toastId);
        if (!toastInstance) return;

        const messageEl = toastInstance.element.querySelector('.toast-message');
        if (messageEl) {
            messageEl.textContent = newMessage;
        }
    }

    /**
     * Position a toast element
     * @param {HTMLElement} toast - Toast element to position
     */
    function positionToast(toast) {
        const index = activeToasts.length - 1;
        const offset = index * (60 + config.gap); // Approximate toast height + gap

        switch (config.position) {
            case 'top-right':
                toast.style.top = `${20 + offset}px`;
                toast.style.right = '20px';
                break;
            case 'top-left':
                toast.style.top = `${20 + offset}px`;
                toast.style.left = '20px';
                break;
            case 'bottom-right':
                toast.style.bottom = `${20 + offset}px`;
                toast.style.right = '20px';
                break;
            case 'bottom-left':
                toast.style.bottom = `${20 + offset}px`;
                toast.style.left = '20px';
                break;
        }
    }

    /**
     * Reposition all active toasts
     */
    function repositionToasts() {
        activeToasts.forEach((toastInstance, index) => {
            const offset = index * (60 + config.gap);
            const toast = toastInstance.element;

            switch (config.position) {
                case 'top-right':
                case 'top-left':
                    toast.style.top = `${20 + offset}px`;
                    break;
                case 'bottom-right':
                case 'bottom-left':
                    toast.style.bottom = `${20 + offset}px`;
                    break;
            }
        });
    }

    /**
     * Get icon HTML for toast type
     * @param {string} type - Toast type
     * @returns {string} Icon HTML
     */
    function getIconForType(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Dismiss all toasts
     */
    function dismissAllToasts() {
        [...activeToasts].forEach(toast => dismissToast(toast.id));
    }

    /**
     * Configure toast settings
     * @param {Object} newConfig - Configuration options
     */
    function configure(newConfig) {
        Object.assign(config, newConfig);
    }

    // Expose API
    window.Toast = {
        show: showToast,
        dismissAll: dismissAllToasts,
        configure: configure,
        // Convenience methods
        success: (message, options = {}) => showToast(message, { ...options, type: 'success' }),
        error: (message, options = {}) => showToast(message, { ...options, type: 'error' }),
        warning: (message, options = {}) => showToast(message, { ...options, type: 'warning' }),
        info: (message, options = {}) => showToast(message, { ...options, type: 'info' })
    };

    // Maintain backward compatibility
    window.showToast = (message, type = 'success') => {
        return showToast(message, { type });
    };

})(window);