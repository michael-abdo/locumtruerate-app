/**
 * Authentication Guard for LocumCalc Protected Pages
 * Ensures only authenticated users can access protected routes
 */

/**
 * Initialize authentication guard on page load
 * Call this function to protect a page
 */
function initAuthGuard(requiredRole = null) {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        console.warn('User not authenticated, redirecting to login');
        redirectToLogin();
        return false;
    }

    // Check role-based permissions if required
    if (requiredRole && !hasPermission(requiredRole)) {
        console.warn(`User does not have required role: ${requiredRole}`);
        showToast(`You don't have permission to access this page.`, 'error');
        
        // Redirect to appropriate dashboard based on user role
        setTimeout(() => {
            const userRole = getUserRole();
            switch (userRole) {
                case 'admin':
                    window.location.href = 'admin-dashboard.html';
                    break;
                case 'recruiter':
                    window.location.href = 'recruiter-dashboard.html';
                    break;
                case 'locum':
                default:
                    window.location.href = 'locum-dashboard.html';
                    break;
            }
        }, 2000);
        
        return false;
    }

    // User is authenticated and authorized
    console.log('User authenticated successfully');
    return true;
}

/**
 * Initialize dashboard navigation with user info
 * Updates navigation elements with user data
 */
function initDashboardNavigation() {
    const user = getUserInfo();
    if (!user) return;

    // Update user name displays
    const userNameElements = document.querySelectorAll('.user-name, .username, [data-user-name]');
    const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
    
    userNameElements.forEach(element => {
        element.textContent = displayName;
    });

    // Update user email displays
    const userEmailElements = document.querySelectorAll('.user-email, [data-user-email]');
    userEmailElements.forEach(element => {
        element.textContent = user.email;
    });

    // Update user role displays
    const userRoleElements = document.querySelectorAll('.user-role, [data-user-role]');
    const roleDisplayName = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    userRoleElements.forEach(element => {
        element.textContent = roleDisplayName;
    });

    // Show/hide role-specific elements
    showRoleSpecificElements(user.role);
}

/**
 * Show/hide elements based on user role
 */
function showRoleSpecificElements(userRole) {
    // Elements that should only show for specific roles
    const roleElements = {
        'admin': document.querySelectorAll('[data-role="admin"], .admin-only'),
        'recruiter': document.querySelectorAll('[data-role="recruiter"], .recruiter-only'),
        'locum': document.querySelectorAll('[data-role="locum"], .locum-only')
    };

    // Hide all role-specific elements first
    Object.values(roleElements).flat().forEach(element => {
        element.style.display = 'none';
    });

    // Show elements for current role
    if (roleElements[userRole]) {
        roleElements[userRole].forEach(element => {
            element.style.display = '';
        });
    }

    // Show elements for roles the user has access to (admin can see recruiter, etc.)
    if (userRole === 'admin') {
        roleElements['recruiter'].forEach(element => {
            element.style.display = '';
        });
        roleElements['locum'].forEach(element => {
            element.style.display = '';
        });
    } else if (userRole === 'recruiter') {
        roleElements['locum'].forEach(element => {
            element.style.display = '';
        });
    }
}

/**
 * Setup logout handlers for navigation
 */
function setupLogoutHandlers() {
    const logoutButtons = document.querySelectorAll('.logout-btn, [data-action="logout"]');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Direct logout without confirmation (per project guidelines)
            logout();
        });
    });
}

/**
 * Complete page initialization for protected pages
 */
function initProtectedPage(options = {}) {
    const {
        requiredRole = null,
        enableRoleDisplay = true,
        enableLogoutHandlers = true,
        onAuthSuccess = null
    } = options;

    // Guard the page
    if (!initAuthGuard(requiredRole)) {
        return false;
    }

    // Initialize dashboard features
    if (enableRoleDisplay) {
        initDashboardNavigation();
    }

    if (enableLogoutHandlers) {
        setupLogoutHandlers();
    }

    // Call custom initialization function if provided
    if (typeof onAuthSuccess === 'function') {
        onAuthSuccess();
    }

    return true;
}

/**
 * Auto-initialize on DOM content loaded
 * Pages can override this by setting window.skipAutoAuthGuard = true
 */
document.addEventListener('DOMContentLoaded', function() {
    // Skip auto-initialization if disabled
    if (window.skipAutoAuthGuard) {
        return;
    }

    // Auto-detect page type and initialize accordingly
    const path = window.location.pathname;
    
    if (path.includes('admin-dashboard')) {
        initProtectedPage({ requiredRole: 'admin' });
    } else if (path.includes('recruiter-dashboard')) {
        initProtectedPage({ requiredRole: 'recruiter' });
    } else if (path.includes('locum-dashboard')) {
        initProtectedPage({ requiredRole: 'locum' });
    } else if (path.includes('job-board') && path !== '/index.html') {
        // Job board requires authentication for posting jobs
        initProtectedPage();
    } else if (path.includes('calculator') || path.includes('dashboard')) {
        // Other protected pages
        initProtectedPage();
    }
});

// Export functions for manual usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAuthGuard,
        initDashboardNavigation,
        setupLogoutHandlers,
        initProtectedPage,
        showRoleSpecificElements
    };
}