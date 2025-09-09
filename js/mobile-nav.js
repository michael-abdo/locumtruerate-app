/**
 * Mobile Navigation System
 * Handles hamburger menu functionality across all pages
 * Created: 2025-01-09
 */

class MobileNav {
    constructor() {
        this.menuToggle = null;
        this.navMenu = null;
        this.overlay = null;
        this.isOpen = false;
        
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        // Create mobile navigation elements if they don't exist
        this.createMobileNav();
        
        // Get references to elements
        this.menuToggle = document.querySelector('.mobile-menu-toggle');
        this.navMenu = document.querySelector('.mobile-menu');
        this.overlay = document.querySelector('.mobile-menu-overlay');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Handle window resize
        this.handleResize();
    }
    
    createMobileNav() {
        // Check if mobile nav already exists
        if (document.querySelector('.mobile-nav')) {
            return;
        }
        
        // Get existing desktop navigation
        const desktopNav = document.querySelector('.navbar');
        if (!desktopNav) {
            console.warn('Desktop navigation not found');
            return;
        }
        
        // Extract brand name
        const brandElement = desktopNav.querySelector('.nav-brand h2, .nav-brand');
        const brandName = brandElement ? brandElement.textContent.trim() : 'Menu';
        
        // Extract navigation links
        const navLinks = Array.from(desktopNav.querySelectorAll('.nav-menu > li')).map(li => {
            const link = li.querySelector('a');
            const submenu = li.querySelector('.dropdown-menu');
            
            return {
                text: link ? link.textContent.trim() : '',
                href: link ? link.getAttribute('href') : '#',
                hasSubmenu: !!submenu,
                submenuItems: submenu ? Array.from(submenu.querySelectorAll('a')).map(a => ({
                    text: a.textContent.trim(),
                    href: a.getAttribute('href')
                })) : []
            };
        });
        
        // Create mobile navigation HTML
        const mobileNavHTML = `
            <nav class="mobile-nav" role="navigation" aria-label="Mobile navigation">
                <div class="mobile-nav-container">
                    <div class="mobile-nav-brand">${brandName}</div>
                    <button class="mobile-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-menu">
                        <span class="hamburger-line" aria-hidden="true"></span>
                        <span class="hamburger-line" aria-hidden="true"></span>
                        <span class="hamburger-line" aria-hidden="true"></span>
                    </button>
                </div>
            </nav>
            
            <div class="mobile-menu-overlay" aria-hidden="true"></div>
            
            <nav class="mobile-menu" id="mobile-menu" role="navigation" aria-label="Mobile menu">
                <ul class="mobile-menu-list" role="menubar">
                    ${navLinks.map((item, index) => this.createMenuItem(item, index)).join('')}
                </ul>
            </nav>
        `;
        
        // Insert mobile navigation at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', mobileNavHTML);
    }
    
    createMenuItem(item, index) {
        if (item.hasSubmenu) {
            return `
                <li class="mobile-menu-item" role="none">
                    <button class="mobile-menu-link mobile-menu-dropdown" 
                            data-submenu-index="${index}"
                            role="menuitem" 
                            aria-haspopup="true" 
                            aria-expanded="false">
                        ${item.text}
                        <svg class="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        </svg>
                    </button>
                    <ul class="mobile-submenu" role="menu" aria-label="${item.text} submenu">
                        ${item.submenuItems.map(subitem => `
                            <li class="mobile-menu-item" role="none">
                                <a href="${subitem.href}" class="mobile-menu-link" role="menuitem">${subitem.text}</a>
                            </li>
                        `).join('')}
                    </ul>
                </li>
            `;
        } else {
            return `
                <li class="mobile-menu-item" role="none">
                    <a href="${item.href}" class="mobile-menu-link" role="menuitem">${item.text}</a>
                </li>
            `;
        }
    }
    
    setupEventListeners() {
        // Toggle menu on hamburger click
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMenu();
            });
        }
        
        // Close menu on overlay click
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.closeMenu();
            });
        }
        
        // Handle dropdown toggles
        const dropdownButtons = document.querySelectorAll('.mobile-menu-dropdown');
        dropdownButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDropdown(button);
            });
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Prevent body scroll when menu is open
        this.preventBodyScroll();
    }
    
    toggleMenu() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.openMenu();
        } else {
            this.closeMenu();
        }
    }
    
    openMenu() {
        this.isOpen = true;
        
        // Update classes
        this.menuToggle?.classList.add('active');
        this.navMenu?.classList.add('active');
        this.overlay?.classList.add('active');
        
        // Update ARIA attributes
        this.menuToggle?.setAttribute('aria-expanded', 'true');
        this.overlay?.setAttribute('aria-hidden', 'false');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus management
        setTimeout(() => {
            const firstLink = this.navMenu?.querySelector('.mobile-menu-link');
            firstLink?.focus();
        }, 300);
    }
    
    closeMenu() {
        this.isOpen = false;
        
        // Update classes
        this.menuToggle?.classList.remove('active');
        this.navMenu?.classList.remove('active');
        this.overlay?.classList.remove('active');
        
        // Update ARIA attributes
        this.menuToggle?.setAttribute('aria-expanded', 'false');
        this.overlay?.setAttribute('aria-hidden', 'true');
        
        // Close all dropdowns
        this.closeAllDropdowns();
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to toggle button
        this.menuToggle?.focus();
    }
    
    toggleDropdown(button) {
        const submenu = button.nextElementSibling;
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        
        if (isOpen) {
            // Close dropdown
            button.setAttribute('aria-expanded', 'false');
            submenu?.classList.remove('active');
        } else {
            // Close other dropdowns first
            this.closeAllDropdowns();
            
            // Open this dropdown
            button.setAttribute('aria-expanded', 'true');
            submenu?.classList.add('active');
        }
    }
    
    closeAllDropdowns() {
        const dropdownButtons = document.querySelectorAll('.mobile-menu-dropdown');
        dropdownButtons.forEach(button => {
            button.setAttribute('aria-expanded', 'false');
            const submenu = button.nextElementSibling;
            submenu?.classList.remove('active');
        });
    }
    
    handleResize() {
        // Close menu if window is resized to desktop
        if (window.innerWidth > 768 && this.isOpen) {
            this.closeMenu();
        }
    }
    
    preventBodyScroll() {
        let scrollY = 0;
        
        // Store scroll position when menu opens
        const observer = new MutationObserver(() => {
            if (this.isOpen && document.body.style.overflow === 'hidden') {
                scrollY = window.scrollY;
                document.body.style.position = 'fixed';
                document.body.style.top = `-${scrollY}px`;
                document.body.style.width = '100%';
            } else if (!this.isOpen && document.body.style.position === 'fixed') {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, scrollY);
            }
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
}

// Initialize mobile navigation
const mobileNav = new MobileNav();

// Export for use in other scripts if needed
window.MobileNav = MobileNav;