/**
 * Modal Component - Reusable modal dialog system
 * Supports: error, confirm, info, success modal types
 * Features: accessibility, focus management, keyboard navigation, templates
 */

(function(window) {
    'use strict';

    // Modal configuration
    const config = {
        animationDuration: 300,
        backdropBlur: true,
        closeOnOverlayClick: true,
        closeOnEscape: true,
        focusTrap: true
    };

    // Active modals tracking
    let activeModals = [];
    let modalIdCounter = 0;

    /**
     * Modal templates for common use cases
     */
    const templates = {
        error: {
            icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
            iconClass: 'modal-icon-error',
            primaryButtonClass: 'btn-danger',
            primaryButtonText: 'OK'
        },
        confirm: {
            icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
            iconClass: 'modal-icon-warning',
            primaryButtonClass: 'btn-primary',
            primaryButtonText: 'Confirm',
            secondaryButtonText: 'Cancel'
        },
        info: {
            icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            iconClass: 'modal-icon-info',
            primaryButtonClass: 'btn-primary',
            primaryButtonText: 'OK'
        },
        success: {
            icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            iconClass: 'modal-icon-success',
            primaryButtonClass: 'btn-success',
            primaryButtonText: 'OK'
        }
    };

    /**
     * Create and show a modal
     * @param {Object} options - Modal options
     * @returns {Object} Modal instance with methods
     */
    function showModal(options = {}) {
        const defaults = {
            type: 'info',
            title: '',
            message: '',
            description: '',
            primaryButton: null,
            secondaryButton: null,
            onPrimary: null,
            onSecondary: null,
            onClose: null,
            closeOnOverlay: config.closeOnOverlayClick,
            closeOnEscape: config.closeOnEscape,
            focusTrap: config.focusTrap,
            customContent: null
        };

        const settings = { ...defaults, ...options };
        const modalId = `modal-${++modalIdCounter}`;
        const template = templates[settings.type] || templates.info;

        // Create modal element
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', `${modalId}-title`);
        modal.setAttribute('aria-describedby', `${modalId}-description`);
        modal.setAttribute('aria-hidden', 'false');

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        if (config.backdropBlur) {
            overlay.classList.add('modal-overlay-blur');
        }

        // Create content container
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.setAttribute('role', 'document');

        // Build modal content
        if (settings.customContent) {
            content.innerHTML = settings.customContent;
        } else {
            // Header
            const header = document.createElement('div');
            header.className = 'modal-header';
            
            if (template.icon) {
                const iconWrapper = document.createElement('div');
                iconWrapper.className = `modal-icon ${template.iconClass}`;
                iconWrapper.innerHTML = template.icon;
                header.appendChild(iconWrapper);
            }

            if (settings.title) {
                const title = document.createElement('h2');
                title.id = `${modalId}-title`;
                title.className = 'modal-title';
                title.textContent = settings.title;
                header.appendChild(title);
            }

            content.appendChild(header);

            // Body
            const body = document.createElement('div');
            body.className = 'modal-body';

            if (settings.message) {
                const message = document.createElement('p');
                message.id = `${modalId}-description`;
                message.className = 'modal-message';
                message.textContent = settings.message;
                body.appendChild(message);
            }

            if (settings.description) {
                const description = document.createElement('p');
                description.className = 'modal-description';
                description.textContent = settings.description;
                body.appendChild(description);
            }

            content.appendChild(body);

            // Footer
            const footer = document.createElement('div');
            footer.className = 'modal-footer';

            // Secondary button (if confirm type or explicitly provided)
            if (settings.secondaryButton !== false && (settings.type === 'confirm' || settings.secondaryButton)) {
                const secondaryBtn = document.createElement('button');
                secondaryBtn.className = 'btn btn-secondary';
                secondaryBtn.textContent = settings.secondaryButton || template.secondaryButtonText || 'Cancel';
                secondaryBtn.onclick = () => {
                    if (settings.onSecondary) settings.onSecondary();
                    dismissModal(modalId);
                };
                footer.appendChild(secondaryBtn);
            }

            // Primary button
            const primaryBtn = document.createElement('button');
            primaryBtn.className = `btn ${template.primaryButtonClass}`;
            primaryBtn.textContent = settings.primaryButton || template.primaryButtonText;
            primaryBtn.onclick = () => {
                if (settings.onPrimary) settings.onPrimary();
                dismissModal(modalId);
            };
            footer.appendChild(primaryBtn);

            content.appendChild(footer);
        }

        // Assemble modal
        modal.appendChild(overlay);
        modal.appendChild(content);

        // Add to DOM
        document.body.appendChild(modal);

        // Track modal instance
        const modalInstance = {
            id: modalId,
            element: modal,
            settings,
            previousFocus: document.activeElement,
            focusableElements: null
        };
        activeModals.push(modalInstance);

        // Show modal with animation
        requestAnimationFrame(() => {
            modal.classList.add('modal-show');
            setupModalBehavior(modalInstance);
        });

        // Return control methods
        return {
            dismiss: () => dismissModal(modalId),
            update: (newOptions) => updateModal(modalId, newOptions)
        };
    }

    /**
     * Setup modal behavior (focus, keyboard, click handlers)
     * @param {Object} modalInstance - Modal instance
     */
    function setupModalBehavior(modalInstance) {
        const modal = modalInstance.element;
        const content = modal.querySelector('.modal-content');

        // Focus management
        if (modalInstance.settings.focusTrap) {
            modalInstance.focusableElements = content.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (modalInstance.focusableElements.length > 0) {
                modalInstance.focusableElements[0].focus();
            }
        }

        // Event handlers
        modalInstance.handleKeydown = (e) => handleModalKeydown(e, modalInstance);
        modalInstance.handleClick = (e) => handleModalClick(e, modalInstance);

        document.addEventListener('keydown', modalInstance.handleKeydown);
        modal.addEventListener('click', modalInstance.handleClick);
    }

    /**
     * Handle modal keyboard events
     * @param {Event} e - Keyboard event
     * @param {Object} modalInstance - Modal instance
     */
    function handleModalKeydown(e, modalInstance) {
        if (e.key === 'Escape' && modalInstance.settings.closeOnEscape) {
            dismissModal(modalInstance.id);
        } else if (e.key === 'Tab' && modalInstance.settings.focusTrap) {
            handleFocusTrap(e, modalInstance);
        }
    }

    /**
     * Handle focus trap for Tab key
     * @param {Event} e - Keyboard event
     * @param {Object} modalInstance - Modal instance
     */
    function handleFocusTrap(e, modalInstance) {
        const focusable = modalInstance.focusableElements;
        if (!focusable || focusable.length === 0) return;

        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    /**
     * Handle modal click events
     * @param {Event} e - Click event
     * @param {Object} modalInstance - Modal instance
     */
    function handleModalClick(e, modalInstance) {
        if (modalInstance.settings.closeOnOverlay) {
            if (e.target === modalInstance.element || e.target.classList.contains('modal-overlay')) {
                dismissModal(modalInstance.id);
            }
        }
    }

    /**
     * Dismiss a modal
     * @param {string} modalId - Modal ID to dismiss
     */
    function dismissModal(modalId) {
        const modalIndex = activeModals.findIndex(m => m.id === modalId);
        if (modalIndex === -1) return;

        const modalInstance = activeModals[modalIndex];
        const modal = modalInstance.element;

        // Remove event listeners
        document.removeEventListener('keydown', modalInstance.handleKeydown);
        modal.removeEventListener('click', modalInstance.handleClick);

        // Animate out
        modal.classList.remove('modal-show');
        modal.classList.add('modal-hide');

        // Remove after animation
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            activeModals.splice(modalIndex, 1);

            // Restore focus
            if (modalInstance.previousFocus && modalInstance.previousFocus.focus) {
                modalInstance.previousFocus.focus();
            }

            // Call close callback
            if (modalInstance.settings.onClose) {
                modalInstance.settings.onClose();
            }
        }, config.animationDuration);
    }

    /**
     * Update modal content
     * @param {string} modalId - Modal ID to update
     * @param {Object} newOptions - New options to apply
     */
    function updateModal(modalId, newOptions) {
        const modalInstance = activeModals.find(m => m.id === modalId);
        if (!modalInstance) return;

        const modal = modalInstance.element;
        
        if (newOptions.title) {
            const titleEl = modal.querySelector('.modal-title');
            if (titleEl) titleEl.textContent = newOptions.title;
        }

        if (newOptions.message) {
            const messageEl = modal.querySelector('.modal-message');
            if (messageEl) messageEl.textContent = newOptions.message;
        }

        if (newOptions.description) {
            const descriptionEl = modal.querySelector('.modal-description');
            if (descriptionEl) descriptionEl.textContent = newOptions.description;
        }
    }

    /**
     * Dismiss all modals
     */
    function dismissAllModals() {
        [...activeModals].forEach(modal => dismissModal(modal.id));
    }

    /**
     * Configure modal settings
     * @param {Object} newConfig - Configuration options
     */
    function configure(newConfig) {
        Object.assign(config, newConfig);
    }

    // Convenience methods for common modal types
    const modalHelpers = {
        error: (title, message, options = {}) => 
            showModal({ ...options, type: 'error', title, message }),
        
        confirm: (title, message, onConfirm, onCancel, options = {}) =>
            showModal({ 
                ...options, 
                type: 'confirm', 
                title, 
                message, 
                onPrimary: onConfirm,
                onSecondary: onCancel
            }),
        
        info: (title, message, options = {}) =>
            showModal({ ...options, type: 'info', title, message }),
        
        success: (title, message, options = {}) =>
            showModal({ ...options, type: 'success', title, message })
    };

    // Expose API
    window.Modal = {
        show: showModal,
        dismissAll: dismissAllModals,
        configure: configure,
        ...modalHelpers
    };

})(window);