# LocumTrueRate Tech Stack Documentation

*Generated: September 2025*

## 🏗️ **Framework & Architecture Overview**

### **Primary Framework**
- **Architecture**: Vanilla HTML/CSS/JavaScript (No Framework)
- **Pattern**: Multi-Page Application (MPA)
- **Deployment Model**: Hybrid (Node.js backend + static frontend)
- **Philosophy**: Modern web standards without framework dependencies

## 🎨 **Frontend Technology Stack**

### **Core Technologies**
| Technology | Version | Purpose |
|------------|---------|---------|
| **HTML5** | Standard | 30 pages, 30,334 total lines |
| **Vanilla JavaScript** | ES6+ | Client-side logic and interactivity |
| **Custom CSS** | CSS3 | Styling with Grid/Flexbox layouts |

### **Frontend Architecture**
```
Frontend Structure:
├── 30 HTML Pages (Self-contained)
├── Embedded CSS (28 style blocks)
├── Inline JavaScript (782 DOM operations)
├── External JS Modules (9 files)
└── Responsive CSS (mobile.css)
```

### **Interactive Components**
- **Real-time Calculators**: Contract & Paycheck calculators with live updates
- **Dynamic Dashboards**: Admin, Locum, Recruiter interfaces
- **Form Validation**: Inline JavaScript with immediate feedback
- **State Management**: LocalStorage + Direct DOM manipulation
- **Event Handling**: 88 inline event handlers (onclick, oninput, onchange)

### **JavaScript Module Organization**
```
js/
├── auth.js              # JWT authentication & token management
├── auth-guard.js        # Route protection middleware
├── common-utils.js      # Shared utility functions (20KB)
├── common-utils.css     # Shared component styles
├── contract-calculator.js # Contract calculation logic (12KB)
├── market-data.js       # Market comparison data
├── mobile-nav.js        # Mobile navigation components (10KB)
└── navigation.js        # Site navigation logic (10KB)
```

### **CSS Architecture**
- **Embedded Styles**: Component-specific CSS within HTML files
- **CSS Variables**: Consistent design system colors and spacing
- **Responsive Design**: Mobile-first approach with breakpoints
- **Grid/Flexbox**: Modern layout techniques throughout

## 🔧 **Backend Technology Stack**

### **Server Framework**
| Component | Version | Purpose |
|-----------|---------|---------|
| **Express.js** | 4.18.2 | Web framework and API server |
| **Node.js** | 18.x | Runtime environment |

### **Backend Architecture**
```javascript
Server Structure:
├── server.js            # Main Express application
├── db/connection.js     # MySQL connection management
├── API Routes:
│   ├── POST /api/auth/login
│   ├── POST /api/auth/register
│   ├── POST /api/auth/logout
│   ├── GET  /api/auth/verify
│   └── GET  /* (static files)
└── Middleware:
    ├── Authentication
    ├── JSON parsing
    ├── Static file serving
    └── CORS handling
```

### **Authentication System**
- **JWT Implementation**: Custom token-based authentication
- **Password Security**: bcrypt hashing (10 rounds)
- **Token Management**: 7-day expiration, localStorage storage
- **Route Protection**: Client-side and server-side guards

## 🗄️ **Database Technology Stack**

### **Database Configuration**
| Component | Technology | Configuration |
|-----------|------------|---------------|
| **Database** | MySQL | via mysql2 driver v3.14.3 |
| **Hosting** | Heroku JawsDB | MySQL addon |
| **Connection** | Connection pooling | 60s timeout, auto-reconnect |
| **Schema** | Relational | Users, authentication tables |

### **Database Connection**
```javascript
// Auto-detects Heroku JAWSDB_URL or local configuration
const config = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    port: url.port || 3306,
    ssl: false,
    reconnect: true,
    timeout: 60000
};
```

## 🚀 **Deployment & Infrastructure Stack**

### **Hosting Platform**
| Component | Technology | Configuration |
|-----------|------------|---------------|
| **Platform** | Heroku | locumtruerate-stage app |
| **Process** | Node.js Dyno | `web: node server.js` |
| **Database** | JawsDB MySQL | Heroku addon |
| **Domain** | Heroku subdomain | Auto-SSL enabled |

### **Deployment Architecture**
```
Production Stack:
├── Heroku Dyno
│   ├── Express.js Server (server.js)
│   ├── Static File Serving
│   └── Environment Variables
├── JawsDB MySQL Database
└── Heroku Load Balancer
    └── SSL Termination
```

### **Environment Configuration**
```bash
# Core Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=mysql://[heroku-provided]
DB_HOST=localhost
DB_PORT=3306

# Security
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:4000
```

## 📦 **Dependency Stack**

### **Production Dependencies (Minimal)**
```json
{
  "bcrypt": "^6.0.0",          // Password hashing
  "dotenv": "^17.2.1",         // Environment management
  "express": "^4.18.2",        // Web framework
  "jsonwebtoken": "^9.0.2",    // JWT authentication
  "mysql2": "^3.14.3"          // MySQL database driver
}
```

### **Development Philosophy**
- **Zero Build Process**: No bundlers, transpilers, or preprocessors
- **No Framework Dependencies**: Pure web standards
- **Minimal NPM Surface**: Only 5 production dependencies
- **Direct Deployment**: No compilation or build steps required

## 🔐 **Security Technology Stack**

### **Authentication & Authorization**
- **JWT Tokens**: Stateless authentication with 7-day expiration
- **bcrypt Password Hashing**: 10 rounds for secure password storage
- **Client-side Guards**: Route protection in JavaScript
- **Server-side Validation**: Input sanitization and validation

### **Security Headers**
```html
<!-- Client-side Security Headers -->
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
```

### **Security Measures**
- **CORS Configuration**: Controlled cross-origin requests
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries with mysql2
- **Password Requirements**: Minimum 6 characters with complexity

## 📁 **Project Structure & Organization**

```
staging-deploy/
├── 📄 Core Application Files
│   ├── *.html (30 files)     # Main application pages
│   ├── server.js             # Express.js application server
│   ├── package.json          # Node.js dependencies
│   └── Procfile              # Heroku process definition
├── 🎨 Frontend Assets
│   ├── css/
│   │   └── mobile.css        # Responsive design styles
│   └── js/                   # JavaScript modules (9 files)
├── 🔧 Backend Configuration
│   ├── db/
│   │   └── connection.js     # MySQL connection logic
│   ├── config/
│   │   └── nginx.conf.erb    # NGINX config (unused)
│   └── .env                  # Environment variables
├── 📚 Documentation
│   └── docs/
│       ├── TECH_STACK_DOCUMENTATION.md
│       ├── FRONTEND_BACKEND_COMPATIBILITY_ANALYSIS.md
│       └── BACKEND_VERSIONS_ANALYSIS.md
└── 🔄 Version Control
    ├── .git/                 # Git repository
    └── node_modules/         # NPM dependencies
```

## 🎯 **Architectural Decisions & Rationale**

### **Why Vanilla Stack?**

#### **Benefits**
- ✅ **Performance**: Direct DOM manipulation, no virtual DOM overhead
- ✅ **Simplicity**: No build complexity or framework learning curve
- ✅ **Maintainability**: Pure web standards, no framework lock-in
- ✅ **Deployment**: Simple static files + minimal Node.js backend
- ✅ **Debugging**: Direct browser debugging, no source maps needed
- ✅ **Load Time**: No framework bundles, immediate page loads
- ✅ **SEO**: Server-rendered HTML, perfect search engine compatibility

#### **Trade-offs**
- ❌ **Development Speed**: Manual DOM manipulation vs reactive updates
- ❌ **Code Reusability**: Some repetitive patterns across pages
- ❌ **State Management**: No centralized state management
- ❌ **Component System**: No built-in component abstraction

### **Technical Decision Matrix**

| Aspect | Vanilla Choice | Alternative | Rationale |
|--------|----------------|-------------|-----------|
| **Frontend** | Vanilla JS | React/Vue | Simplicity, performance, no build process |
| **Backend** | Express.js | Next.js API | Proven, simple, widely supported |
| **Database** | MySQL | PostgreSQL | Heroku JawsDB availability, familiarity |
| **Deployment** | Heroku | AWS/Vercel | Easy deployment, addon ecosystem |
| **Styling** | Custom CSS | Tailwind/styled-components | Full control, no dependencies |

## 🔄 **Data Flow Architecture**

### **Request Flow**
```
1. Browser Request → 2. HTML Page Load → 3. Inline JS Execution →
4. API Call (if needed) → 5. Express.js Router → 6. MySQL Query →
7. JSON Response → 8. DOM Update → 9. UI Refresh
```

### **State Management**
```javascript
State Management Strategy:
├── Client State: LocalStorage + DOM
├── Form State: Direct input manipulation  
├── Authentication: JWT in localStorage
├── Cache: Browser cache + manual cache busting
└── Real-time Updates: Event-driven recalculation
```

## 📊 **Performance Characteristics**

### **Frontend Performance**
- **Initial Load**: ~50-100KB per page (including embedded CSS/JS)
- **Interactivity**: Immediate (no framework initialization)
- **Memory Usage**: Minimal (no framework overhead)
- **Bundle Size**: Zero (no bundling required)

### **Backend Performance**
- **Response Time**: <100ms for API calls
- **Memory Usage**: ~30-50MB per dyno
- **Database Queries**: Direct SQL with connection pooling
- **Concurrent Users**: Limited by single Heroku dyno

## 🔮 **Technology Evolution Path**

### **Current State (2025)**
- Stable vanilla implementation
- All core features functional
- Zero technical debt from framework migrations

### **Potential Upgrades (Low Priority)**
```
Incremental Modernization Options:
├── Add TypeScript gradually to existing JavaScript
├── Extract reusable components into ES6 modules
├── Implement CSS custom properties system
├── Add service worker for offline functionality
├── Integrate modern build tools (optional)
└── Consider framework migration only if requirements change
```

## 📈 **Metrics & Monitoring**

### **Application Metrics**
- **Uptime**: Heroku platform reliability
- **Performance**: Browser DevTools + Heroku metrics
- **Errors**: Console logging + server logs
- **Usage**: Google Analytics integration

### **Database Metrics**
- **Connection Health**: Built-in connection pooling
- **Query Performance**: mysql2 logging capabilities
- **Database Size**: JawsDB dashboard monitoring

## 🚀 **Getting Started for Developers**

### **Local Development Setup**
```bash
# 1. Clone repository
git clone [repository-url]
cd locumtruerate-app
git checkout staging-deploy

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with local database credentials

# 4. Start development server
npm start

# 5. Access application
open http://localhost:3000
```

### **Development Workflow**
1. **Edit HTML/CSS/JS** directly in browser-friendly files
2. **Test locally** with `npm start`
3. **Commit changes** to staging-deploy branch
4. **Deploy to Heroku** with git push
5. **Monitor** via Heroku dashboard and browser tools

## 🔧 **Troubleshooting Guide**

### **Common Issues**
- **Database Connection**: Check JAWSDB_URL environment variable
- **Authentication**: Verify JWT_SECRET is set
- **Static Files**: Ensure Express.js static middleware is configured
- **CORS Issues**: Update CORS_ORIGIN environment variable

### **Debug Tools**
- **Browser DevTools**: Primary debugging interface
- **Heroku Logs**: `heroku logs --tail --app locumtruerate-stage`
- **Database**: Direct MySQL client connection
- **Network**: Browser Network tab for API debugging

---

## 📋 **Summary**

LocumTrueRate uses a **modern vanilla web stack** that prioritizes simplicity, performance, and maintainability. The architecture combines the best of traditional web development (server-rendered HTML, direct DOM manipulation) with modern JavaScript features and deployment practices.

This stack choice enables rapid development, easy debugging, and excellent performance while avoiding the complexity and overhead of modern JavaScript frameworks. The result is a robust, maintainable application that serves its purpose effectively with minimal technical overhead.

**Key Philosophy**: *Use the simplest technology that solves the problem effectively.*