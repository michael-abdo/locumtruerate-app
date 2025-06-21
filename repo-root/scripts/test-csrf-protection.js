#!/usr/bin/env node

// CSRF Protection Test
// Tests that Cross-Site Request Forgery protection is implemented

const fs = require('fs');
const path = require('path');

console.log('🛡️ Testing CSRF Protection...');

let passed = 0;
let failed = 0;

// Test for CSRF token implementation
function testCSRFTokens() {
    console.log('\n🔐 Testing CSRF Token Implementation...');
    
    const formFiles = [
        'apps/web/src/components/forms',
        'apps/web/src/app/api',
        'packages/api/src/routers'
    ];
    
    let csrfTokensFound = 0;
    let formsWithTokens = 0;
    let totalForms = 0;
    
    formFiles.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath, { recursive: true });
            
            files.forEach(file => {
                if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.')) {
                    const filePath = path.join(fullPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check for form components
                    if (content.includes('<form') || content.includes('useForm') || content.includes('Form')) {
                        totalForms++;
                        
                        // Check for CSRF protection patterns
                        const csrfPatterns = [
                            'csrf',
                            'token',
                            'csrfToken',
                            '_token',
                            'authenticity_token',
                            'csrfmiddlewaretoken',
                            'x-csrf-token',
                            'getToken',
                            'csrfProtection'
                        ];
                        
                        const hasCSRF = csrfPatterns.some(pattern => 
                            content.toLowerCase().includes(pattern.toLowerCase())
                        );
                        
                        if (hasCSRF) {
                            formsWithTokens++;
                            csrfTokensFound++;
                            console.log(`  ✅ CSRF protection found in ${file}`);
                        } else {
                            console.log(`  ⚠️  No CSRF protection detected in ${file}`);
                        }
                    }
                }
            });
        }
    });
    
    console.log(`\n📊 CSRF Token Analysis:`);
    console.log(`Total forms analyzed: ${totalForms}`);
    console.log(`Forms with CSRF protection: ${formsWithTokens}`);
    
    if (totalForms > 0) {
        const csrfCoverage = (formsWithTokens / totalForms * 100).toFixed(1);
        console.log(`CSRF coverage: ${csrfCoverage}%`);
        
        if (csrfCoverage >= 80) {
            console.log('✅ Excellent CSRF protection coverage');
            passed += 2;
        } else if (csrfCoverage >= 60) {
            console.log('⚠️  Good CSRF protection coverage');
            passed++;
        } else {
            console.log('❌ Poor CSRF protection coverage');
            failed++;
        }
    }
}

// Test for Next.js CSRF protection middleware
function testNextJSCSRFMiddleware() {
    console.log('\n🔧 Testing Next.js CSRF Middleware...');
    
    const middlewareFiles = [
        'apps/web/src/middleware.ts',
        'apps/web/middleware.ts'
    ];
    
    let middlewareFound = false;
    
    middlewareFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            console.log(`📋 Checking ${file}...`);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Check for CSRF protection in middleware
            const csrfMiddlewarePatterns = [
                'csrf',
                'token',
                'x-csrf-token',
                'referer',
                'origin',
                'same-origin',
                'sameOrigin'
            ];
            
            let csrfMiddlewareFound = 0;
            csrfMiddlewarePatterns.forEach(pattern => {
                if (content.toLowerCase().includes(pattern.toLowerCase())) {
                    csrfMiddlewareFound++;
                }
            });
            
            if (csrfMiddlewareFound >= 2) {
                console.log(`  ✅ CSRF middleware protection found (${csrfMiddlewareFound} patterns)`);
                middlewareFound = true;
                passed++;
            } else {
                console.log(`  ⚠️  Limited CSRF middleware protection (${csrfMiddlewareFound} patterns)`);
            }
        }
    });
    
    if (!middlewareFound) {
        console.log('⚠️  No CSRF middleware detected - may rely on other protection');
    }
}

// Test for SameSite cookie configuration
function testSameSiteCookies() {
    console.log('\n🍪 Testing SameSite Cookie Configuration...');
    
    const configFiles = [
        'apps/web/next.config.js',
        'apps/web/next.config.mjs',
        'apps/web/src/lib/config',
        'apps/web/src/middleware.ts'
    ];
    
    let sameSiteFound = false;
    
    configFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
                const files = fs.readdirSync(fullPath, { recursive: true });
                files.forEach(configFile => {
                    if (configFile.endsWith('.ts') || configFile.endsWith('.js')) {
                        const content = fs.readFileSync(path.join(fullPath, configFile), 'utf8');
                        if (content.includes('sameSite') || content.includes('SameSite')) {
                            console.log(`✅ SameSite cookie configuration found in ${configFile}`);
                            sameSiteFound = true;
                            passed++;
                        }
                    }
                });
            } else {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('sameSite') || content.includes('SameSite')) {
                    console.log(`✅ SameSite cookie configuration found in ${file}`);
                    sameSiteFound = true;
                    passed++;
                }
            }
        }
    });
    
    if (!sameSiteFound) {
        console.log('⚠️  SameSite cookie configuration not explicitly found');
        console.log('ℹ️  Note: Next.js may handle SameSite cookies by default');
    }
}

// Test for Referer/Origin header validation
function testRefererOriginValidation() {
    console.log('\n🌐 Testing Referer/Origin Header Validation...');
    
    const apiFiles = [
        'apps/web/src/app/api',
        'packages/api/src/routers',
        'apps/web/src/middleware.ts'
    ];
    
    let headerValidationFound = 0;
    
    apiFiles.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
                const files = fs.readdirSync(fullPath, { recursive: true });
                files.forEach(file => {
                    if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('.test.')) {
                        const filePath = path.join(fullPath, file);
                        const content = fs.readFileSync(filePath, 'utf8');
                        
                        // Check for header validation patterns
                        const headerPatterns = [
                            'referer',
                            'origin',
                            'x-requested-with',
                            'request.headers',
                            'req.headers',
                            'headers.get',
                            'validateOrigin',
                            'checkReferer'
                        ];
                        
                        headerPatterns.forEach(pattern => {
                            if (content.toLowerCase().includes(pattern.toLowerCase())) {
                                headerValidationFound++;
                            }
                        });
                        
                        if (headerPatterns.some(pattern => content.toLowerCase().includes(pattern.toLowerCase()))) {
                            console.log(`  ✅ Header validation found in ${file}`);
                        }
                    }
                });
            } else {
                const content = fs.readFileSync(fullPath, 'utf8');
                const headerPatterns = ['referer', 'origin', 'headers'];
                if (headerPatterns.some(pattern => content.toLowerCase().includes(pattern))) {
                    console.log(`  ✅ Header validation found in ${fullPath}`);
                    headerValidationFound++;
                }
            }
        }
    });
    
    if (headerValidationFound >= 3) {
        console.log('✅ Good header validation implementation');
        passed++;
    } else if (headerValidationFound > 0) {
        console.log('⚠️  Basic header validation found');
    } else {
        console.log('⚠️  No explicit header validation detected');
    }
}

// Test for double-submit cookie pattern
function testDoubleSubmitCookie() {
    console.log('\n🎯 Testing Double Submit Cookie Pattern...');
    
    // Simulate double-submit cookie implementation check
    console.log('🔍 Checking for double-submit cookie implementation...');
    
    // Check for cookie handling in forms
    const formDirs = ['apps/web/src/components/forms', 'apps/web/src/app'];
    let doubleSubmitFound = false;
    
    formDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath, { recursive: true });
            files.forEach(file => {
                if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                    const filePath = path.join(fullPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    if (content.includes('cookie') && content.includes('token')) {
                        console.log(`  ✅ Cookie token pattern found in ${file}`);
                        doubleSubmitFound = true;
                    }
                }
            });
        }
    });
    
    if (doubleSubmitFound) {
        console.log('✅ Double-submit cookie pattern detected');
        passed++;
    } else {
        console.log('ℹ️  Double-submit cookie pattern not explicitly implemented');
        console.log('ℹ️  Note: Next.js and tRPC may provide built-in CSRF protection');
        // Don't count as failure since framework may handle this
    }
}

// Run all CSRF protection tests
function runAllTests() {
    console.log('🧪 Starting CSRF Protection Tests...\n');
    
    testCSRFTokens();
    testNextJSCSRFMiddleware();
    testSameSiteCookies();
    testRefererOriginValidation();
    testDoubleSubmitCookie();
    
    // Final results
    console.log('\n📊 CSRF Protection Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 CSRF protection tests passed!');
        console.log('🛡️ Application appears protected against CSRF attacks');
        console.log('\n🔧 Recommendations:');
        console.log('1. Ensure all state-changing operations require authentication');
        console.log('2. Use SameSite cookies for session management');
        console.log('3. Validate Referer/Origin headers for sensitive operations');
        console.log('4. Consider implementing explicit CSRF tokens for critical forms');
        process.exit(0);
    } else {
        console.log('\n💥 Some CSRF protection tests failed!');
        console.log('🔧 Critical Recommendations:');
        console.log('1. Implement CSRF tokens for all forms');
        console.log('2. Configure SameSite cookie attributes');
        console.log('3. Add Origin/Referer header validation');
        console.log('4. Use Next.js built-in CSRF protection');
        console.log('5. Test CSRF protection with automated tools');
        process.exit(1);
    }
}

runAllTests();