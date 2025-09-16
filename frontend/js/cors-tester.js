/**
 * CORS Testing Utility for LocumTrueRate Frontend
 * 
 * This utility helps diagnose CORS configuration issues during deployment.
 * Use this to test API connectivity and CORS settings.
 */

class CORSTester {
    constructor(apiBaseUrl = null) {
        this.apiBaseUrl = apiBaseUrl || this.detectApiBaseUrl();
        this.results = [];
    }

    /**
     * Detect API base URL using same logic as apiClient
     */
    detectApiBaseUrl() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:4000/api/v1';
        } else if (hostname.includes('locumtruerate-stage') || hostname.includes('staging')) {
            return `${protocol}//${hostname}/api/v1`;
        } else if (hostname.includes('herokuapp.com')) {
            return `${protocol}//${hostname}/api/v1`;
        } else if (hostname.includes('locumtruerate.com') || hostname.includes('truerate.app')) {
            return `${protocol}//api.${hostname}/v1`;
        }
        
        return '/api/v1';
    }

    /**
     * Test basic connectivity to API
     */
    async testConnectivity() {
        const testName = 'API Connectivity';
        console.log(`🧪 Testing: ${testName}`);

        try {
            const response = await fetch(`${this.apiBaseUrl}/health`, {
                method: 'GET',
                mode: 'cors'
            });

            const result = {
                test: testName,
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                details: response.ok ? 'API is reachable' : `HTTP ${response.status}: ${response.statusText}`
            };

            this.results.push(result);
            return result;

        } catch (error) {
            const result = {
                test: testName,
                success: false,
                error: error.message,
                details: 'Cannot connect to API - check URL and network connectivity'
            };

            this.results.push(result);
            return result;
        }
    }

    /**
     * Test CORS preflight request
     */
    async testPreflight() {
        const testName = 'CORS Preflight';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Create a request that will trigger preflight
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                },
                body: JSON.stringify({ test: true })
            });

            const result = {
                test: testName,
                success: response.status !== 0, // Status 0 usually indicates CORS failure
                status: response.status,
                statusText: response.statusText,
                details: response.status === 0 ? 'CORS preflight failed' : 'CORS preflight succeeded'
            };

            this.results.push(result);
            return result;

        } catch (error) {
            const isCorsError = error.message.includes('CORS') || 
                              error.message.includes('cross-origin') ||
                              error.message.includes('preflight');

            const result = {
                test: testName,
                success: false,
                error: error.message,
                details: isCorsError ? 
                    'CORS configuration issue - check backend CORS settings' : 
                    'Network or API error'
            };

            this.results.push(result);
            return result;
        }
    }

    /**
     * Test authentication endpoint with CORS
     */
    async testAuthEndpoint() {
        const testName = 'Authentication Endpoint CORS';
        console.log(`🧪 Testing: ${testName}`);

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer invalid-token'
                }
            });

            // We expect 401 for invalid token, but that means CORS is working
            const result = {
                test: testName,
                success: response.status === 401 || response.status === 200,
                status: response.status,
                statusText: response.statusText,
                details: response.status === 401 ? 
                    'CORS working - got expected 401 for invalid token' :
                    response.status === 200 ?
                    'CORS working - endpoint accessible' :
                    `Unexpected status: ${response.status}`
            };

            this.results.push(result);
            return result;

        } catch (error) {
            const result = {
                test: testName,
                success: false,
                error: error.message,
                details: 'CORS or network error on auth endpoint'
            };

            this.results.push(result);
            return result;
        }
    }

    /**
     * Test jobs endpoint with CORS
     */
    async testJobsEndpoint() {
        const testName = 'Jobs Endpoint CORS';
        console.log(`🧪 Testing: ${testName}`);

        try {
            const response = await fetch(`${this.apiBaseUrl}/jobs`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = {
                test: testName,
                success: response.ok || response.status === 401, // 401 is OK, means auth is required
                status: response.status,
                statusText: response.statusText,
                details: response.ok ? 
                    'Jobs endpoint accessible via CORS' :
                    response.status === 401 ?
                    'Jobs endpoint accessible but requires authentication' :
                    `HTTP ${response.status}: ${response.statusText}`
            };

            this.results.push(result);
            return result;

        } catch (error) {
            const result = {
                test: testName,
                success: false,
                error: error.message,
                details: 'CORS or network error on jobs endpoint'
            };

            this.results.push(result);
            return result;
        }
    }

    /**
     * Test response headers accessibility
     */
    async testResponseHeaders() {
        const testName = 'Response Headers Access';
        console.log(`🧪 Testing: ${testName}`);

        try {
            const response = await fetch(`${this.apiBaseUrl}/jobs`, {
                method: 'GET',
                mode: 'cors'
            });

            // Check if we can access common headers
            const contentType = response.headers.get('content-type');
            const totalCount = response.headers.get('x-total-count');
            const corsHeaders = response.headers.get('access-control-allow-origin');

            const result = {
                test: testName,
                success: contentType !== null,
                details: {
                    'Content-Type': contentType,
                    'X-Total-Count': totalCount,
                    'Access-Control-Allow-Origin': corsHeaders,
                    accessibleHeaders: Array.from(response.headers.keys())
                }
            };

            this.results.push(result);
            return result;

        } catch (error) {
            const result = {
                test: testName,
                success: false,
                error: error.message,
                details: 'Cannot test response headers'
            };

            this.results.push(result);
            return result;
        }
    }

    /**
     * Run all CORS tests
     */
    async runAllTests() {
        console.log('🚀 Starting CORS tests...');
        console.log(`📍 API Base URL: ${this.apiBaseUrl}`);
        console.log(`🌐 Frontend Origin: ${window.location.origin}`);

        this.results = []; // Clear previous results

        // Run tests sequentially
        await this.testConnectivity();
        await this.testPreflight();
        await this.testAuthEndpoint();
        await this.testJobsEndpoint();
        await this.testResponseHeaders();

        return this.generateReport();
    }

    /**
     * Generate test report
     */
    generateReport() {
        const successCount = this.results.filter(r => r.success).length;
        const totalCount = this.results.length;
        const allPassed = successCount === totalCount;

        const report = {
            summary: {
                total: totalCount,
                passed: successCount,
                failed: totalCount - successCount,
                allPassed: allPassed,
                apiBaseUrl: this.apiBaseUrl,
                frontendOrigin: window.location.origin
            },
            tests: this.results,
            recommendations: this.getRecommendations()
        };

        console.log('📊 CORS Test Report:', report);
        return report;
    }

    /**
     * Get recommendations based on test results
     */
    getRecommendations() {
        const recommendations = [];
        const failedTests = this.results.filter(r => !r.success);

        if (failedTests.length === 0) {
            recommendations.push('✅ All CORS tests passed! Configuration looks good.');
            return recommendations;
        }

        // Check for connectivity issues
        const connectivityFailed = failedTests.find(r => r.test === 'API Connectivity');
        if (connectivityFailed) {
            recommendations.push('🔗 API connectivity failed - check if backend is running and accessible');
            recommendations.push(`📍 Verify API URL: ${this.apiBaseUrl}`);
        }

        // Check for CORS issues
        const corsFailed = failedTests.find(r => r.error && r.error.includes('CORS'));
        if (corsFailed) {
            recommendations.push('🌐 CORS configuration issue detected');
            recommendations.push(`🔧 Add "${window.location.origin}" to backend CORS allowed origins`);
            recommendations.push('🔑 Ensure credentials: true if authentication is used');
            recommendations.push('📋 Check that all required headers are in allowedHeaders');
        }

        // Check for auth issues
        const authFailed = failedTests.find(r => r.test.includes('Authentication'));
        if (authFailed && !connectivityFailed && !corsFailed) {
            recommendations.push('🔐 Authentication endpoint may have issues beyond CORS');
            recommendations.push('🔍 Check API authentication implementation');
        }

        return recommendations;
    }

    /**
     * Display results in console with formatting
     */
    displayResults() {
        const report = this.generateReport();
        
        console.log('\n🧪 CORS Test Results Summary:');
        console.log(`📊 ${report.summary.passed}/${report.summary.total} tests passed`);
        console.log(`🌐 Frontend: ${report.summary.frontendOrigin}`);
        console.log(`🔗 API: ${report.summary.apiBaseUrl}`);
        
        console.log('\n📋 Test Details:');
        report.tests.forEach(test => {
            const icon = test.success ? '✅' : '❌';
            console.log(`${icon} ${test.test}: ${test.details || test.error || 'OK'}`);
        });

        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => {
            console.log(rec);
        });

        return report;
    }
}

// Create global instance for easy access
window.corsTest = new CORSTester();

// Add convenience function to window
window.testCORS = async function(apiUrl = null) {
    const tester = apiUrl ? new CORSTester(apiUrl) : window.corsTest;
    const report = await tester.runAllTests();
    tester.displayResults();
    return report;
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CORSTester;
}

// Auto-run basic test if this script is loaded directly
if (typeof window !== 'undefined' && window.location) {
    console.log('🧪 CORS Tester loaded. Run testCORS() to check API connectivity.');
}