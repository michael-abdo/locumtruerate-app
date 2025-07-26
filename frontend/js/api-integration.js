/**
 * API Integration Helper
 * Initializes the API client for use in frontend pages
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI helpers
    if (typeof UI !== 'undefined') {
        UI.init();
    }
    
    // Create global API client instance
    window.api = new ApiClient();
    
    // Check authentication status
    if (Auth.isLoggedIn()) {
        const token = Auth.getToken();
        window.api.setAuthToken(token);
        
        // Update any user display elements
        const userDisplayElements = document.querySelectorAll('[data-user-display]');
        userDisplayElements.forEach(el => {
            el.textContent = Auth.getUserDisplayName();
        });
        
        // Show/hide auth-dependent elements
        document.querySelectorAll('[data-auth-required]').forEach(el => {
            el.style.display = 'block';
        });
        
        document.querySelectorAll('[data-auth-hidden]').forEach(el => {
            el.style.display = 'none';
        });
    } else {
        // Show login prompts
        document.querySelectorAll('[data-auth-required]').forEach(el => {
            el.style.display = 'none';
        });
        
        document.querySelectorAll('[data-auth-hidden]').forEach(el => {
            el.style.display = 'block';
        });
    }
    
    console.log('API client initialized and ready');
});

// Global error handler for API calls
window.handleApiError = function(error) {
    console.error('API Error:', error);
    
    if (error.statusCode === 401) {
        // Token expired or invalid
        Auth.logout();
        UI.showError('Session expired. Please login again.');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    } else if (error.statusCode === 0) {
        // Network error
        UI.showError('Network error. Please check your connection.');
    } else {
        // Other API errors
        UI.showError(error.message || 'An error occurred');
    }
};
