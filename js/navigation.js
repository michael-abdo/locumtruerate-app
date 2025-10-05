/**
 * Dynamic Navigation Module for LocumCalc
 * Provides authentication-aware navigation across all pages
 */

/**
 * Generate navigation HTML based on authentication state
 */
function generateNavigation() {
    const isAuth = isAuthenticated();
    const user = getUserInfo();
    const currentPath = window.location.pathname;
    
    // Navigation items for different user states
    const publicNavItems = [
        { href: 'index.html', text: 'Home', icon: '🏠' },
        { href: 'job-board.html', text: 'Job Board', icon: '💼' },
        { href: 'paycheck-calculator.html', text: 'Paycheck Calculator', icon: '💰' },
        { href: 'contract-calculator.html', text: 'Contract Calculator', icon: '📊' }
    ];

    const authenticatedNavItems = [
        { href: 'index.html', text: 'Home', icon: '🏠' },
        { href: 'job-board.html', text: 'Job Board', icon: '💼' },
        { href: 'paycheck-calculator.html', text: 'Paycheck Calculator', icon: '💰' },
        { href: 'contract-calculator.html', text: 'Contract Calculator', icon: '📊' }
    ];

    // Add role-specific dashboard links
    if (isAuth && user) {
        switch (user.role) {
            case 'admin':
                authenticatedNavItems.push({ href: 'admin-dashboard.html', text: 'Admin Dashboard', icon: '⚙️' });
                authenticatedNavItems.push({ href: 'recruiter-dashboard.html', text: 'Recruiter Dashboard', icon: '🎯' });
                authenticatedNavItems.push({ href: 'locum-dashboard.html', text: 'Locum Dashboard', icon: '👤' });
                break;
            case 'recruiter':
                authenticatedNavItems.push({ href: 'recruiter-dashboard.html', text: 'Recruiter Dashboard', icon: '🎯' });
                authenticatedNavItems.push({ href: 'locum-dashboard.html', text: 'Locum Dashboard', icon: '👤' });
                break;
            case 'locum':
                authenticatedNavItems.push({ href: 'locum-dashboard.html', text: 'My Dashboard', icon: '👤' });
                break;
        }
    }

    const navItems = isAuth ? authenticatedNavItems : publicNavItems;

    // Generate navigation HTML
    let navHTML = `
        <nav class="main-navigation" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 1rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
        ">
            <div class="nav-container" style="
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 1rem;
            ">
                <div class="nav-brand" style="
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: white;
                    text-decoration: none;
                ">
                    <a href="index.html" style="color: white; text-decoration: none;">
                        LocumCalc
                    </a>
                </div>
                
                <div class="nav-links" style="
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                    flex-wrap: wrap;
                ">`;

    // Add navigation links
    navItems.forEach(item => {
        const isActive = currentPath.endsWith(item.href);
        navHTML += `
                    <a href="${item.href}" 
                       class="nav-link ${isActive ? 'active' : ''}"
                       style="
                           color: white;
                           text-decoration: none;
                           padding: 0.5rem 1rem;
                           border-radius: 6px;
                           transition: all 0.3s ease;
                           font-weight: ${isActive ? 'bold' : 'normal'};
                           background: ${isActive ? 'rgba(255,255,255,0.2)' : 'transparent'};
                       "
                       onmouseover="this.style.background='rgba(255,255,255,0.2)'"
                       onmouseout="this.style.background='${isActive ? 'rgba(255,255,255,0.2)' : 'transparent'}'"
                    >
                        <span style="margin-right: 0.5rem;">${item.icon}</span>
                        ${item.text}
                    </a>`;
    });

    // Add user info or login button
    if (isAuth && user) {
        const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
        const roleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        
        navHTML += `
                    <div class="user-info" style="
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding-left: 1rem;
                        border-left: 1px solid rgba(255,255,255,0.3);
                    ">
                        <div class="user-details" style="
                            text-align: right;
                            color: white;
                            font-size: 0.9rem;
                        ">
                            <div class="user-name" style="font-weight: 600;">${displayName}</div>
                            <div class="user-role" style="opacity: 0.8; font-size: 0.8rem;">${roleDisplay}</div>
                        </div>
                        <button 
                            onclick="logout()" 
                            class="logout-btn"
                            style="
                                background: rgba(255,255,255,0.2);
                                border: 1px solid rgba(255,255,255,0.3);
                                color: white;
                                padding: 0.5rem 1rem;
                                border-radius: 6px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-size: 0.9rem;
                            "
                            onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                            onmouseout="this.style.background='rgba(255,255,255,0.2)'"
                        >
                            Logout
                        </button>
                    </div>`;
    } else {
        navHTML += `
                    <a href="login.html" 
                       class="login-btn"
                       style="
                           background: rgba(255,255,255,0.2);
                           border: 1px solid rgba(255,255,255,0.3);
                           color: white;
                           padding: 0.5rem 1.5rem;
                           border-radius: 6px;
                           text-decoration: none;
                           font-weight: 500;
                           transition: all 0.3s ease;
                       "
                       onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                       onmouseout="this.style.background='rgba(255,255,255,0.2)'"
                    >
                        Login
                    </a>`;
    }

    navHTML += `
                </div>
            </div>
        </nav>
    `;

    return navHTML;
}

/**
 * Initialize navigation on page load
 */
function initNavigation() {
    // Create navigation container if it doesn't exist
    let navContainer = document.querySelector('#navigation-container');
    if (!navContainer) {
        navContainer = document.createElement('div');
        navContainer.id = 'navigation-container';
        
        // Insert at the beginning of body
        const firstChild = document.body.firstChild;
        if (firstChild) {
            document.body.insertBefore(navContainer, firstChild);
        } else {
            document.body.appendChild(navContainer);
        }
    }

    // Generate and insert navigation
    navContainer.innerHTML = generateNavigation();

    // Add responsive styles
    if (!document.querySelector('#navigation-responsive-styles')) {
        const style = document.createElement('style');
        style.id = 'navigation-responsive-styles';
        style.textContent = `
            @media (max-width: 768px) {
                .nav-container {
                    flex-direction: column;
                    gap: 1rem !important;
                }
                
                .nav-links {
                    flex-direction: column;
                    width: 100%;
                    text-align: center;
                }
                
                .nav-link {
                    display: block;
                    width: 100%;
                    padding: 0.75rem !important;
                }
                
                .user-info {
                    flex-direction: column;
                    gap: 0.5rem !important;
                    padding-left: 0 !important;
                    border-left: none !important;
                    border-top: 1px solid rgba(255,255,255,0.3) !important;
                    padding-top: 1rem !important;
                    width: 100%;
                    text-align: center;
                }
                
                .user-details {
                    text-align: center !important;
                }
            }
            
            @media (max-width: 480px) {
                .main-navigation {
                    padding: 0.5rem 1rem !important;
                }
                
                .nav-brand {
                    font-size: 1.25rem !important;
                }
                
                .nav-link span {
                    display: block !important;
                    margin-bottom: 0.25rem !important;
                    margin-right: 0 !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Refresh navigation (useful after login/logout)
 */
function refreshNavigation() {
    const navContainer = document.querySelector('#navigation-container');
    if (navContainer) {
        navContainer.innerHTML = generateNavigation();
    }
}

/**
 * Initialize navigation when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Skip navigation on login page to avoid conflicts
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    initNavigation();
});

// Export functions for manual usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateNavigation,
        initNavigation,
        refreshNavigation
    };
}