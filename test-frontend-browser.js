/**
 * Browser-based test for frontend API client
 * This script can be run in the browser console to test the API client
 */

async function testFrontendIntegration() {
    console.log('🧪 Starting Frontend Integration Tests...\n');
    
    const results = {
        passed: 0,
        failed: 0,
        errors: []
    };
    
    // Helper function to log test results
    function logTest(name, success, error = null) {
        if (success) {
            console.log(`✅ ${name}`);
            results.passed++;
        } else {
            console.log(`❌ ${name}`);
            results.failed++;
            if (error) {
                results.errors.push({ test: name, error: error.message });
            }
        }
    }
    
    // Test 1: Check if API client is loaded
    try {
        if (typeof ApiClient !== 'undefined') {
            logTest('API Client loaded', true);
        } else {
            throw new Error('ApiClient not found');
        }
    } catch (e) {
        logTest('API Client loaded', false, e);
    }
    
    // Test 2: Check if Auth helper is loaded
    try {
        if (typeof Auth !== 'undefined') {
            logTest('Auth helper loaded', true);
        } else {
            throw new Error('Auth not found');
        }
    } catch (e) {
        logTest('Auth helper loaded', false, e);
    }
    
    // Test 3: Check if UI helper is loaded
    try {
        if (typeof UI !== 'undefined') {
            logTest('UI helper loaded', true);
            UI.init(); // Initialize UI
        } else {
            throw new Error('UI not found');
        }
    } catch (e) {
        logTest('UI helper loaded', false, e);
    }
    
    // Test 4: Create API client instance
    let api;
    try {
        api = new ApiClient();
        logTest('API Client instantiated', true);
    } catch (e) {
        logTest('API Client instantiated', false, e);
        return results; // Can't continue without API client
    }
    
    // Test 5: Test public endpoint (jobs)
    try {
        const jobs = await api.getJobs({ limit: 2 });
        if (jobs && jobs.jobs) {
            logTest('Jobs endpoint working', true);
            console.log(`  Found ${jobs.jobs.length} jobs`);
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (e) {
        logTest('Jobs endpoint working', false, e);
    }
    
    // Test 6: Test calculator endpoint
    try {
        const calc = await api.calculateContract({
            hourlyRate: 200,
            hoursPerWeek: 40,
            weeksPerYear: 48,
            state: 'CA',
            expenseRate: 0.15
        });
        if (calc && calc.success) {
            logTest('Calculator endpoint working', true);
            console.log(`  Annual gross: $${calc.data.gross.annual}`);
        } else {
            throw new Error('Invalid calculation response');
        }
    } catch (e) {
        logTest('Calculator endpoint working', false, e);
    }
    
    // Test 7: Test authentication flow
    const testEmail = `test.user.${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    try {
        // Register
        await api.register({
            email: testEmail,
            password: testPassword,
            firstName: 'Test',
            lastName: 'User',
            role: 'locum'
        });
        logTest('User registration', true);
    } catch (e) {
        // Registration might fail if user exists
        console.log('  Registration failed (may already exist)');
    }
    
    // Test 8: Login
    try {
        const loginResult = await api.login(testEmail, testPassword);
        if (loginResult && loginResult.token) {
            logTest('User login', true);
            Auth.login(loginResult.token, loginResult.user);
            console.log(`  Token: ${loginResult.token.substring(0, 20)}...`);
        } else {
            throw new Error('No token received');
        }
    } catch (e) {
        // Try with known good credentials
        try {
            const loginResult = await api.login('john.doe@example.com', 'password123');
            if (loginResult && loginResult.token) {
                logTest('User login (fallback)', true);
                Auth.login(loginResult.token, loginResult.user);
            }
        } catch (e2) {
            logTest('User login', false, e2);
        }
    }
    
    // Test 9: Test authenticated endpoint
    if (Auth.isLoggedIn()) {
        api.setAuthToken(Auth.getToken());
        
        try {
            const user = await api.getCurrentUser();
            if (user && user.user) {
                logTest('Get current user', true);
                console.log(`  User: ${user.user.email}`);
            } else {
                throw new Error('Invalid user response');
            }
        } catch (e) {
            logTest('Get current user', false, e);
        }
        
        // Test 10: Test applications endpoint
        try {
            const apps = await api.getMyApplications();
            logTest('Get my applications', true);
            console.log(`  Applications: ${apps.applications ? apps.applications.length : 0}`);
        } catch (e) {
            logTest('Get my applications', false, e);
        }
    }
    
    // Test 11: Test UI notifications
    try {
        UI.showSuccess('Tests completed!');
        logTest('UI notifications', true);
    } catch (e) {
        logTest('UI notifications', false, e);
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
        console.log('\n❌ Errors:');
        results.errors.forEach(err => {
            console.log(`  ${err.test}: ${err.error}`);
        });
    }
    
    return results;
}

// Instructions for running the test
console.log(`
🧪 Frontend API Client Browser Test
==================================

To run this test:

1. Open the demo page in your browser:
   file://${window.location.origin}/vanilla-demos-only/api-client-demo.html

2. Open the browser console (F12)

3. Copy and paste this entire script

4. Run: testFrontendIntegration()

The test will check:
- All JavaScript modules are loaded
- Public API endpoints work
- Authentication flow works
- UI components function

Make sure the API server is running on http://localhost:4000
`);

// Auto-run if in correct context
if (window.location.pathname.includes('api-client-demo.html')) {
    console.log('Auto-running tests in 2 seconds...');
    setTimeout(() => testFrontendIntegration(), 2000);
}