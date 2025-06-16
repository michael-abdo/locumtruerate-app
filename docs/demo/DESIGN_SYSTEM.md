# Design System - Contract Calculator & Job Board Platform

## 1. Global Navigation Structure

### Main Navigation Menu Items
- **Home** - Main landing page with calculator previews
- **Job Board** - Browse available positions with filters
- **Paycheck Calculator** - Calculate weekly/biweekly/monthly paychecks  
- **Contract Calculator** - Evaluate contract compensation and rates
- **Recruiter Dashboard** - Job posting management (mockup)
- **Locum Dashboard** - Saved contracts and profile (mockup)
- **Admin Panel** - User analytics and management (mockup)

### Navigation Behavior
- Fixed top navigation bar on all pages
- Active page highlighting with primary color
- Smooth hover transitions
- Dropdown menus for dashboard sections
- Responsive collapse for smaller desktop screens

## 2. Shared CSS Variables & Styling

### Color Palette
```css
:root {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --secondary-color: #64748b;
  --accent-color: #10b981;
  --background-color: #f8fafc;
  --surface-color: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}
```

### Typography
```css
/* Headers */
h1 { font-size: 2.5rem; font-weight: 700; color: var(--text-primary); }
h2 { font-size: 2rem; font-weight: 600; color: var(--text-primary); }
h3 { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); }
h4 { font-size: 1.25rem; font-weight: 500; color: var(--text-primary); }

/* Body Text */
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 1rem; line-height: 1.6; color: var(--text-primary); }
.text-lg { font-size: 1.125rem; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
```

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:hover { background-color: var(--primary-hover); transform: translateY(-1px); }

/* Secondary Button */
.btn-secondary {
  background-color: transparent;
  color: var(--secondary-color);
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover { border-color: var(--primary-color); color: var(--primary-color); }

/* Accent Button */
.btn-accent {
  background-color: var(--accent-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
```

### Spacing Standards
```css
/* Margins */
.m-1 { margin: 0.25rem; }
.m-2 { margin: 0.5rem; }
.m-4 { margin: 1rem; }
.m-6 { margin: 1.5rem; }
.m-8 { margin: 2rem; }

/* Padding */
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }

/* Gaps */
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }
```

### Card Component Styling
```css
.card {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}
.card:hover { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }

.card-header { margin-bottom: 1rem; }
.card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
.card-subtitle { color: var(--text-secondary); font-size: 0.875rem; }
```

### Form Input Styling
```css
.form-group { margin-bottom: 1rem; }
.form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-primary); }
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}
.form-input:focus { outline: none; border-color: var(--primary-color); }
.form-select { appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23666" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>'); background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 0.65rem; }
```

## 3. Component Templates

### Navigation Template
```html
<nav class="navbar">
  <div class="nav-container">
    <div class="nav-brand">
      <h2>ContractCalc Pro</h2>
    </div>
    <ul class="nav-menu">
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="job-board.html" class="nav-link">Job Board</a></li>
      <li><a href="paycheck-calculator.html" class="nav-link">Paycheck Calculator</a></li>
      <li><a href="contract-calculator.html" class="nav-link">Contract Calculator</a></li>
      <li class="nav-dropdown">
        <a href="#" class="nav-link">Dashboards</a>
        <ul class="dropdown-menu">
          <li><a href="recruiter-dashboard.html">Recruiter</a></li>
          <li><a href="locum-dashboard.html">Locum</a></li>
          <li><a href="admin-dashboard.html">Admin</a></li>
        </ul>
      </li>
    </ul>
  </div>
</nav>
```

### Footer Template
```html
<footer class="footer">
  <div class="footer-container">
    <div class="footer-section">
      <h4>ContractCalc Pro</h4>
      <p>Empowering healthcare professionals with accurate contract analysis and job matching.</p>
    </div>
    <div class="footer-section">
      <h5>Tools</h5>
      <ul>
        <li><a href="paycheck-calculator.html">Paycheck Calculator</a></li>
        <li><a href="contract-calculator.html">Contract Calculator</a></li>
        <li><a href="job-board.html">Job Board</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h5>Support</h5>
      <ul>
        <li><a href="#">Help Center</a></li>
        <li><a href="#">Contact Us</a></li>
        <li><a href="#">Privacy Policy</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2025 ContractCalc Pro. All rights reserved.</p>
  </div>
</footer>
```

### Card Component Template
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-subtitle">Card subtitle or description</p>
  </div>
  <div class="card-content">
    <!-- Card content goes here -->
  </div>
  <div class="card-actions">
    <button class="btn-primary">Primary Action</button>
    <button class="btn-secondary">Secondary Action</button>
  </div>
</div>
```

### Form Element Templates
```html
<div class="form-group">
  <label class="form-label" for="input-id">Label Text</label>
  <input type="text" id="input-id" class="form-input" placeholder="Placeholder text">
</div>

<div class="form-group">
  <label class="form-label" for="select-id">Select Label</label>
  <select id="select-id" class="form-input form-select">
    <option value="">Choose option</option>
    <option value="option1">Option 1</option>
  </select>
</div>
```

## 4. Page Layout Standards

### Page Container
```css
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.section {
  margin-bottom: 4rem;
}
```

### Desktop Layout Standards
- **Container max-width**: 1200px
- **Main content padding**: 2rem vertical, 1rem horizontal
- **Section spacing**: 4rem between major sections
- **Card grid**: CSS Grid with 1fr columns, 2rem gap
- **Sidebar width**: 300px (when applicable)

### Grid Systems
```css
.grid { display: grid; gap: 2rem; }
.grid-2 { grid-template-columns: 1fr 1fr; }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

.flex { display: flex; gap: 1rem; }
.flex-center { justify-content: center; align-items: center; }
.flex-between { justify-content: space-between; }
.flex-wrap { flex-wrap: wrap; }
```

## 5. Responsive Breakpoints (Desktop Focus)

```css
/* Large Desktop */
@media (min-width: 1200px) {
  .container { max-width: 1200px; }
}

/* Standard Desktop */
@media (min-width: 992px) and (max-width: 1199px) {
  .container { max-width: 960px; }
  .grid-4 { grid-template-columns: repeat(3, 1fr); }
}

/* Small Desktop */
@media (min-width: 768px) and (max-width: 991px) {
  .container { max-width: 720px; }
  .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .nav-menu { flex-direction: column; }
}
```

## 6. Interactive States & Animations

```css
/* Loading States */
.loading { opacity: 0.6; pointer-events: none; }
.spinner { animation: spin 1s linear infinite; }

/* Hover Effects */
.hover-scale:hover { transform: scale(1.05); }
.hover-shadow:hover { box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15); }

/* Transitions */
.transition { transition: all 0.2s ease; }
.transition-slow { transition: all 0.3s ease; }

/* Animations */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
```

This design system ensures consistent styling and professional appearance across all pages while maintaining desktop-focused responsiveness and intuitive user experience.