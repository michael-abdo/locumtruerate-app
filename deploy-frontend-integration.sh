#!/bin/bash

# Frontend Integration Deployment Script
# Deploys the API client modules to the frontend directory

set -e # Exit on error

echo "======================================"
echo "Frontend Integration Deployment"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Directories
VANILLA_DEMOS_DIR="vanilla-demos-only"
FRONTEND_DIR="frontend"
FRONTEND_JS_DIR="frontend/js"

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# Function to backup file if it exists
backup_file() {
    if [ -f "$1" ]; then
        cp "$1" "$1.backup-$(date +%Y%m%d-%H%M%S)"
        echo "  Backed up: $1"
    fi
}

echo ""
echo "1. Pre-deployment checks..."

# Check if directories exist
if [ ! -d "$VANILLA_DEMOS_DIR" ]; then
    echo -e "${RED}Error: $VANILLA_DEMOS_DIR directory not found${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: $FRONTEND_DIR directory not found${NC}"
    exit 1
fi

# Check if source files exist
if [ ! -f "$VANILLA_DEMOS_DIR/js/apiClient.js" ]; then
    echo -e "${RED}Error: apiClient.js not found${NC}"
    exit 1
fi

print_status 0 "Pre-deployment checks passed"

echo ""
echo "2. Creating frontend JS directory if needed..."
mkdir -p "$FRONTEND_JS_DIR"
print_status $? "JS directory ready"

echo ""
echo "3. Backing up existing files..."
backup_file "$FRONTEND_JS_DIR/apiClient.js"
backup_file "$FRONTEND_JS_DIR/auth.js"
backup_file "$FRONTEND_JS_DIR/ui.js"
print_status 0 "Backups completed"

echo ""
echo "4. Copying API client modules..."
cp "$VANILLA_DEMOS_DIR/js/apiClient.js" "$FRONTEND_JS_DIR/"
print_status $? "Copied apiClient.js"

cp "$VANILLA_DEMOS_DIR/js/auth.js" "$FRONTEND_JS_DIR/"
print_status $? "Copied auth.js"

cp "$VANILLA_DEMOS_DIR/js/ui.js" "$FRONTEND_JS_DIR/"
print_status $? "Copied ui.js"

echo ""
echo "5. Creating integration helper script..."
cat > "$FRONTEND_JS_DIR/api-integration.js" << 'EOF'
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
EOF

print_status $? "Created integration helper"

echo ""
echo "6. Creating example integration HTML..."
cat > "$FRONTEND_DIR/api-integration-example.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Integration Example</title>
    
    <!-- Include API Client Scripts -->
    <script src="js/apiClient.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/ui.js"></script>
    <script src="js/api-integration.js"></script>
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .auth-info {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
        }
        
        button:hover {
            background: #0056b3;
        }
        
        #results {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            white-space: pre-wrap;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <h1>API Integration Example</h1>
    
    <div class="auth-info">
        <div data-auth-hidden>
            <p>Not logged in. Please login to access all features.</p>
            <button onclick="window.location.href='login.html'">Login</button>
        </div>
        <div data-auth-required style="display:none;">
            <p>Logged in as: <span data-user-display></span></p>
            <button onclick="logout()">Logout</button>
        </div>
    </div>
    
    <h2>Test API Endpoints</h2>
    
    <button onclick="testJobs()">Get Jobs</button>
    <button onclick="testCalculator()">Test Calculator</button>
    <button onclick="testAuth()" data-auth-required>Get My Info</button>
    
    <div id="results"></div>
    
    <script>
        // Example API usage
        async function testJobs() {
            const resultsDiv = document.getElementById('results');
            UI.showLoading(resultsDiv);
            
            try {
                const response = await api.getJobs({ limit: 5 });
                resultsDiv.textContent = JSON.stringify(response, null, 2);
                UI.showSuccess('Jobs loaded successfully!');
            } catch (error) {
                handleApiError(error);
                resultsDiv.textContent = 'Error: ' + error.message;
            } finally {
                UI.hideLoading(resultsDiv);
            }
        }
        
        async function testCalculator() {
            const resultsDiv = document.getElementById('results');
            UI.showLoading(resultsDiv);
            
            try {
                const response = await api.calculateContract({
                    hourlyRate: 200,
                    hoursPerWeek: 40,
                    weeksPerYear: 48,
                    state: 'CA',
                    expenseRate: 0.15
                });
                resultsDiv.textContent = JSON.stringify(response, null, 2);
                UI.showSuccess('Calculation completed!');
            } catch (error) {
                handleApiError(error);
                resultsDiv.textContent = 'Error: ' + error.message;
            } finally {
                UI.hideLoading(resultsDiv);
            }
        }
        
        async function testAuth() {
            const resultsDiv = document.getElementById('results');
            UI.showLoading(resultsDiv);
            
            try {
                const response = await api.getCurrentUser();
                resultsDiv.textContent = JSON.stringify(response, null, 2);
                UI.showSuccess('User info loaded!');
            } catch (error) {
                handleApiError(error);
                resultsDiv.textContent = 'Error: ' + error.message;
            } finally {
                UI.hideLoading(resultsDiv);
            }
        }
        
        function logout() {
            api.logout().then(() => {
                Auth.logout();
                UI.showSuccess('Logged out successfully');
                setTimeout(() => window.location.reload(), 1000);
            });
        }
    </script>
</body>
</html>
EOF

print_status $? "Created example integration page"

echo ""
echo "7. Updating existing pages to include API client..."

# Function to add script tags to HTML file
add_api_scripts() {
    local file=$1
    local filename=$(basename "$file")
    
    # Check if scripts already added
    if grep -q "apiClient.js" "$file"; then
        echo "  $filename - Scripts already included"
        return
    fi
    
    # Backup original
    backup_file "$file"
    
    # Add scripts before closing </head> tag
    sed -i '/<\/head>/i \    <!-- API Client Integration -->\
    <script src="js/apiClient.js"></script>\
    <script src="js/auth.js"></script>\
    <script src="js/ui.js"></script>\
    <script src="js/api-integration.js"></script>' "$file"
    
    echo "  $filename - Scripts added"
}

# Update main pages
for page in job-board.html locum-dashboard.html recruiter-dashboard.html admin-dashboard.html; do
    if [ -f "$FRONTEND_DIR/$page" ]; then
        add_api_scripts "$FRONTEND_DIR/$page"
    fi
done

print_status 0 "Updated existing pages"

echo ""
echo "8. Creating deployment documentation..."
cat > "$FRONTEND_DIR/API_INTEGRATION_GUIDE.md" << 'EOF'
# API Integration Guide

## Overview
The API client has been successfully deployed to the frontend directory.

## Files Deployed
- `js/apiClient.js` - Main API client with all endpoints
- `js/auth.js` - Authentication helper
- `js/ui.js` - UI utilities (toasts, loading states)
- `js/api-integration.js` - Integration helper
- `api-integration-example.html` - Example usage

## Quick Start

### 1. Include Scripts in Your HTML
```html
<script src="js/apiClient.js"></script>
<script src="js/auth.js"></script>
<script src="js/ui.js"></script>
<script src="js/api-integration.js"></script>
```

### 2. Use the Global API Instance
```javascript
// API client is available as window.api
const jobs = await api.getJobs({ limit: 10 });
```

### 3. Handle Authentication
```javascript
// Check if logged in
if (Auth.isLoggedIn()) {
    // User is authenticated
    const user = await api.getCurrentUser();
}

// Login
const result = await api.login(email, password);
Auth.login(result.token, result.user);
```

### 4. Show UI Feedback
```javascript
// Loading states
UI.showLoading(element);
// ... do work
UI.hideLoading(element);

// Notifications
UI.showSuccess('Operation completed!');
UI.showError('Something went wrong');
```

## Data Attributes for HTML

- `data-auth-required` - Show only when authenticated
- `data-auth-hidden` - Hide when authenticated
- `data-user-display` - Auto-populate with username

## Next Steps

1. Test the integration example: `api-integration-example.html`
2. Update existing pages to use live API data
3. Replace static content with API calls
4. Add loading states and error handling
5. Test authentication flow

## API Endpoints Available

See the full list in `apiClient.js` or refer to the API documentation.
EOF

print_status $? "Created integration guide"

echo ""
echo "======================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Files deployed to: $FRONTEND_DIR/js/"
echo ""
echo "Next steps:"
echo "1. Test the example: open $FRONTEND_DIR/api-integration-example.html"
echo "2. Update job-board.html to load jobs from API"
echo "3. Add authentication to dashboard pages"
echo "4. Replace calculator static logic with API calls"
echo ""
echo "To serve and test locally:"
echo "  cd $FRONTEND_DIR"
echo "  python3 -m http.server 8000"
echo "  Visit: http://localhost:8000/api-integration-example.html"
echo ""

# Create a deployment summary
cat > "deployment-summary-$(date +%Y%m%d-%H%M%S).log" << EOF
Frontend Integration Deployment Summary
======================================
Date: $(date)
Deployed by: $(whoami)

Files Deployed:
- apiClient.js
- auth.js  
- ui.js
- api-integration.js
- api-integration-example.html

Pages Updated:
$(ls $FRONTEND_DIR/*.html 2>/dev/null | grep -E "(job-board|dashboard)" | xargs -I {} basename {})

Status: SUCCESS
EOF

echo "Deployment summary saved to: deployment-summary-*.log"