# Mobile Navigation Implementation Template

## Quick Implementation Guide

To add mobile navigation to any page, follow these steps:

### 1. Add CSS and JS Links in `<head>`

```html
<!-- Add before closing </head> tag -->
<link rel="stylesheet" href="css/mobile.css">
```

### 2. Add JavaScript Before Closing `</body>`

```html
<!-- Add before closing </body> tag -->
<script src="js/mobile-nav.js"></script>
```

### 3. Ensure Desktop Navigation Structure

Your existing desktop navigation should follow this structure:

```html
<nav class="navbar">
    <div class="nav-container">
        <div class="nav-brand">
            <h2>Your Site Name</h2>
        </div>
        <ul class="nav-menu">
            <li><a href="index.html" class="nav-link">Home</a></li>
            <li><a href="about.html" class="nav-link">About</a></li>
            <li class="nav-dropdown">
                <a href="#" class="nav-link">Services</a>
                <ul class="dropdown-menu">
                    <li><a href="service1.html">Service 1</a></li>
                    <li><a href="service2.html">Service 2</a></li>
                </ul>
            </li>
            <li><a href="contact.html" class="nav-link">Contact</a></li>
        </ul>
    </div>
</nav>
```

### 4. The mobile navigation will be automatically created!

The `mobile-nav.js` script will:
- Detect your desktop navigation
- Extract all menu items and structure
- Create a mobile-friendly hamburger menu
- Handle all interactions and accessibility

## Manual Mobile Navigation HTML (Optional)

If you prefer to manually add the mobile navigation HTML:

```html
<!-- Mobile Navigation (add after <body> tag) -->
<nav class="mobile-nav" role="navigation" aria-label="Mobile navigation">
    <div class="mobile-nav-container">
        <div class="mobile-nav-brand">Your Site Name</div>
        <button class="mobile-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-menu">
            <span class="hamburger-line" aria-hidden="true"></span>
            <span class="hamburger-line" aria-hidden="true"></span>
            <span class="hamburger-line" aria-hidden="true"></span>
            <span class="sr-only">Menu</span>
        </button>
    </div>
</nav>

<!-- Mobile Menu Overlay -->
<div class="mobile-menu-overlay" aria-hidden="true"></div>

<!-- Mobile Menu -->
<nav class="mobile-menu" id="mobile-menu" role="navigation" aria-label="Mobile menu">
    <ul class="mobile-menu-list" role="menubar">
        <li class="mobile-menu-item" role="none">
            <a href="index.html" class="mobile-menu-link" role="menuitem">Home</a>
        </li>
        <li class="mobile-menu-item" role="none">
            <a href="about.html" class="mobile-menu-link" role="menuitem">About</a>
        </li>
        <li class="mobile-menu-item" role="none">
            <button class="mobile-menu-link mobile-menu-dropdown" 
                    data-submenu-index="0"
                    role="menuitem" 
                    aria-haspopup="true" 
                    aria-expanded="false">
                Services
                <svg class="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
            </button>
            <ul class="mobile-submenu" role="menu" aria-label="Services submenu">
                <li class="mobile-menu-item" role="none">
                    <a href="service1.html" class="mobile-menu-link" role="menuitem">Service 1</a>
                </li>
                <li class="mobile-menu-item" role="none">
                    <a href="service2.html" class="mobile-menu-link" role="menuitem">Service 2</a>
                </li>
            </ul>
        </li>
        <li class="mobile-menu-item" role="none">
            <a href="contact.html" class="mobile-menu-link" role="menuitem">Contact</a>
        </li>
    </ul>
</nav>
```

## Mobile-Specific CSS Classes

### Layout Utilities
- `.mobile-only` - Show only on mobile
- `.desktop-only` - Hide on mobile
- `.mobile-stack` - Stack elements vertically
- `.mobile-grid` - Single column grid on mobile

### Spacing Utilities
- `.mobile-p-{size}` - Padding (xs, sm, md, lg, xl)
- `.mobile-m-{size}` - Margin (xs, sm, md, lg, xl)

### Text Utilities
- `.mobile-text-{size}` - Font sizes (xs, sm, base, lg, xl, 2xl, 3xl)
- `.mobile-text-center` - Center text on mobile
- `.mobile-text-left` - Left align text on mobile
- `.mobile-text-right` - Right align text on mobile

### Form Utilities
- `.mobile-form-group` - Form group wrapper
- `.mobile-form-input` - Touch-friendly input
- `.mobile-form-select` - Touch-friendly select
- `.mobile-form-textarea` - Touch-friendly textarea

### Button Utilities
- `.mobile-btn` - Base mobile button
- `.mobile-btn-primary` - Primary button style
- `.mobile-btn-secondary` - Secondary button style
- `.mobile-btn-full` - Full-width button

## Testing Checklist

- [ ] Navigation appears on screens < 768px
- [ ] Hamburger menu animates correctly
- [ ] Menu opens/closes smoothly
- [ ] Overlay appears when menu is open
- [ ] Clicking overlay closes menu
- [ ] Escape key closes menu
- [ ] Dropdowns work within mobile menu
- [ ] Focus management is correct
- [ ] Body scroll is prevented when menu is open
- [ ] Menu closes when resizing to desktop

## Troubleshooting

### Menu not appearing
1. Check that `mobile.css` is loaded
2. Verify `mobile-nav.js` is loaded after DOM content
3. Ensure desktop nav has class `.navbar`

### Styling issues
1. Check for CSS conflicts with existing styles
2. Verify viewport meta tag is present
3. Use browser dev tools mobile preview

### JavaScript errors
1. Check console for specific errors
2. Ensure no duplicate IDs in HTML
3. Verify all required elements exist