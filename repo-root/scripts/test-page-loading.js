#!/usr/bin/env node

// Page Loading Test
// Tests that all critical pages load without errors

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('📄 Testing Page Loading...');

let passed = 0;
let failed = 0;

// Critical pages to test
const criticalPages = [
    { path: '/', name: 'Homepage' },
    { path: '/jobs', name: 'Jobs Listing' },
    { path: '/jobs/search', name: 'Job Search' },
    { path: '/tools/calculator', name: 'Calculator' },
    { path: '/auth/signin', name: 'Sign In' },
    { path: '/auth/signup', name: 'Sign Up' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/admin', name: 'Admin Panel' },
    { path: '/support', name: 'Support' },
    { path: '/legal/privacy', name: 'Privacy Policy' },
    { path: '/legal/terms', name: 'Terms of Service' },
    { path: '/legal/cookies', name: 'Cookie Policy' },
    { path: '/api/health', name: 'Health Check API' }
];

// Development server settings
const DEV_PORT = 3000;
const TEST_TIMEOUT = 30000; // 30 seconds

let devServer = null;

function startDevServer() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting development server...');
        
        // Change to web app directory
        const webAppPath = path.join(process.cwd(), 'apps/web');
        
        // Start Next.js dev server
        devServer = spawn('npm', ['run', 'dev'], {
            cwd: webAppPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, PORT: DEV_PORT }
        });
        
        let serverOutput = '';
        
        devServer.stdout.on('data', (data) => {
            serverOutput += data.toString();
            console.log(`[DEV] ${data.toString().trim()}`);
            
            // Check if server is ready
            if (data.toString().includes('Ready') || data.toString().includes('ready')) {
                console.log('✅ Development server is ready');
                setTimeout(resolve, 2000); // Give it a moment to fully start
            }
        });
        
        devServer.stderr.on('data', (data) => {
            console.log(`[DEV ERROR] ${data.toString().trim()}`);
        });
        
        devServer.on('error', (error) => {
            console.log(`❌ Failed to start dev server: ${error.message}`);
            reject(error);
        });
        
        // Timeout if server doesn't start
        setTimeout(() => {
            if (!serverOutput.includes('Ready') && !serverOutput.includes('ready')) {
                reject(new Error('Development server failed to start within timeout'));
            }
        }, TEST_TIMEOUT);
    });
}

function stopDevServer() {
    if (devServer) {
        console.log('🛑 Stopping development server...');
        devServer.kill('SIGTERM');
        
        // Force kill after 5 seconds if not stopped
        setTimeout(() => {
            if (devServer && !devServer.killed) {
                devServer.kill('SIGKILL');
            }
        }, 5000);
    }
}

function testPageLoad(page) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        console.log(`🔍 Testing ${page.name} (${page.path})...`);
        
        const options = {
            hostname: 'localhost',
            port: DEV_PORT,
            path: page.path,
            method: 'GET',
            timeout: 10000
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const loadTime = Date.now() - startTime;
                
                // Check response status
                if (res.statusCode === 200) {
                    console.log(`  ✅ ${page.name}: Loaded successfully (${loadTime}ms)`);
                    
                    // Basic content validation
                    if (page.path === '/' && data.includes('<html')) {
                        console.log(`  ✅ ${page.name}: HTML content detected`);
                    } else if (page.path.startsWith('/api/')) {
                        console.log(`  ✅ ${page.name}: API response received`);
                    } else if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
                        console.log(`  ✅ ${page.name}: Valid HTML page`);
                    } else {
                        console.log(`  ⚠️  ${page.name}: Unexpected content format`);
                    }
                    
                    // Check for common errors in content
                    if (data.includes('Error') && !page.path.includes('error')) {
                        console.log(`  ⚠️  ${page.name}: Contains error text`);
                    }
                    
                    if (data.includes('404') && page.path !== '/404') {
                        console.log(`  ⚠️  ${page.name}: Contains 404 error`);
                    }
                    
                    resolve({ success: true, loadTime, statusCode: res.statusCode });
                } else if (res.statusCode === 404 && page.path === '/404') {
                    console.log(`  ✅ ${page.name}: 404 page working correctly`);
                    resolve({ success: true, loadTime, statusCode: res.statusCode });
                } else if (res.statusCode === 302 || res.statusCode === 301) {
                    console.log(`  ⚠️  ${page.name}: Redirected (${res.statusCode}) to ${res.headers.location}`);
                    resolve({ success: true, loadTime, statusCode: res.statusCode, redirect: true });
                } else {
                    console.log(`  ❌ ${page.name}: HTTP ${res.statusCode}`);
                    resolve({ success: false, loadTime, statusCode: res.statusCode });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`  ❌ ${page.name}: Request failed - ${error.message}`);
            resolve({ success: false, error: error.message });
        });
        
        req.on('timeout', () => {
            console.log(`  ❌ ${page.name}: Request timeout`);
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });
        
        req.end();
    });
}

async function testAllPages() {
    console.log('\n📄 Testing all critical pages...\n');
    
    const results = [];
    
    for (const page of criticalPages) {
        const result = await testPageLoad(page);
        results.push({ page, result });
        
        if (result.success) {
            passed++;
        } else {
            failed++;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
}

function analyzeResults(results) {
    console.log('\n📊 Page Loading Analysis:');
    
    // Performance analysis
    const loadTimes = results
        .filter(r => r.result.success && r.result.loadTime)
        .map(r => r.result.loadTime);
    
    if (loadTimes.length > 0) {
        const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
        const maxLoadTime = Math.max(...loadTimes);
        const minLoadTime = Math.min(...loadTimes);
        
        console.log(`⚡ Average load time: ${avgLoadTime.toFixed(0)}ms`);
        console.log(`⚡ Fastest page: ${minLoadTime}ms`);
        console.log(`⚡ Slowest page: ${maxLoadTime}ms`);
        
        if (avgLoadTime < 2000) {
            console.log('✅ Good performance: Average load time under 2 seconds');
            passed++;
        } else if (avgLoadTime < 5000) {
            console.log('⚠️  Moderate performance: Average load time under 5 seconds');
        } else {
            console.log('❌ Poor performance: Average load time over 5 seconds');
            failed++;
        }
    }
    
    // Status code analysis
    const statusCodes = results.reduce((acc, r) => {
        const code = r.result.statusCode || 'error';
        acc[code] = (acc[code] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\n📈 Status Code Distribution:');
    Object.entries(statusCodes).forEach(([code, count]) => {
        console.log(`  ${code}: ${count} pages`);
    });
    
    // Error analysis
    const errors = results.filter(r => !r.result.success);
    if (errors.length > 0) {
        console.log('\n❌ Failed Pages:');
        errors.forEach(({ page, result }) => {
            console.log(`  ${page.name} (${page.path}): ${result.error || `HTTP ${result.statusCode}`}`);
        });
    }
    
    // Redirect analysis
    const redirects = results.filter(r => r.result.redirect);
    if (redirects.length > 0) {
        console.log('\n🔄 Redirected Pages:');
        redirects.forEach(({ page, result }) => {
            console.log(`  ${page.name} (${page.path}): HTTP ${result.statusCode}`);
        });
    }
}

// Check if we can use the build version instead
function testBuildVersion() {
    return new Promise((resolve) => {
        console.log('🏗️ Checking if build version is available...');
        
        const buildPath = path.join(process.cwd(), 'apps/web/.next');
        const fs = require('fs');
        
        if (fs.existsSync(buildPath)) {
            console.log('✅ Next.js build found, could test production build');
            resolve(true);
        } else {
            console.log('⚠️  No build found, using development server');
            resolve(false);
        }
    });
}

async function runAllTests() {
    console.log('🧪 Starting Page Loading Tests...\n');
    
    try {
        // Check for build version
        await testBuildVersion();
        
        // Start development server
        await startDevServer();
        
        // Test all pages
        const results = await testAllPages();
        
        // Analyze results
        analyzeResults(results);
        
        // Final results
        console.log('\n📊 Page Loading Test Results:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📄 Total pages tested: ${criticalPages.length}`);
        
        if (failed === 0) {
            console.log('\n🎉 All page loading tests passed!');
            process.exit(0);
        } else {
            console.log('\n💥 Some page loading tests failed!');
            console.log('🔧 Check server logs and page implementations');
            process.exit(1);
        }
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        process.exit(1);
    } finally {
        stopDevServer();
    }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Test interrupted, cleaning up...');
    stopDevServer();
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test terminated, cleaning up...');
    stopDevServer();
    process.exit(1);
});

// Check if we have Node.js and npm available
if (!process.versions.node) {
    console.log('❌ Node.js not available');
    process.exit(1);
}

console.log(`🟢 Node.js version: ${process.versions.node}`);

runAllTests();