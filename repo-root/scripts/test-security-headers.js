#!/usr/bin/env node

// Security Headers Test
// Tests that proper security headers are configured for production

const fs = require('fs');
const path = require('path');

console.log('🛡️ Testing Security Headers Configuration...');

let passed = 0;
let failed = 0;

// Required security headers for healthcare applications
const requiredSecurityHeaders = {
    'Content-Security-Policy': {
        description: 'Prevents XSS attacks and unauthorized resource loading',
        critical: true
    },
    'X-Frame-Options': {
        description: 'Prevents clickjacking attacks',
        critical: true
    },
    'X-Content-Type-Options': {
        description: 'Prevents MIME type sniffing',
        critical: true
    },
    'Referrer-Policy': {
        description: 'Controls referrer information sent with requests',
        critical: false
    },
    'Permissions-Policy': {
        description: 'Controls browser features and APIs',
        critical: false
    },
    'Strict-Transport-Security': {
        description: 'Enforces HTTPS connections',
        critical: true
    },
    'X-XSS-Protection': {
        description: 'Legacy XSS protection (deprecated but still useful)',
        critical: false
    },
    'Cross-Origin-Embedder-Policy': {
        description: 'Controls cross-origin isolation',
        critical: false
    },
    'Cross-Origin-Opener-Policy': {
        description: 'Controls cross-origin window interactions',
        critical: false
    },
    'Cross-Origin-Resource-Policy': {
        description: 'Controls cross-origin resource access',
        critical: false
    }
};

// Test Next.js configuration for security headers
function testNextJSSecurityHeaders() {
    console.log('\n⚙️ Testing Next.js Security Headers Configuration...');
    
    const configFiles = [
        'apps/web/next.config.js',
        'apps/web/next.config.mjs',
        'apps/web/next.config.ts'
    ];
    
    let configFound = false;
    let headersConfigured = [];
    
    configFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            console.log(`📋 Checking ${file}...`);
            const content = fs.readFileSync(fullPath, 'utf8');
            configFound = true;
            
            // Check for headers configuration
            if (content.includes('headers') || content.includes('securityHeaders')) {
                console.log('  ✅ Headers configuration section found');
                
                // Check for specific security headers
                Object.keys(requiredSecurityHeaders).forEach(header => {
                    const headerVariants = [
                        header,
                        header.toLowerCase(),
                        header.replace(/-/g, ''),
                        header.replace(/-/g, '').toLowerCase()
                    ];
                    
                    if (headerVariants.some(variant => content.includes(variant))) {
                        console.log(`    ✅ ${header} configuration found`);
                        headersConfigured.push(header);
                        if (requiredSecurityHeaders[header].critical) {
                            passed++;
                        }
                    }
                });
            } else {
                console.log('  ⚠️  No headers configuration found');
            }
        }
    });
    
    if (!configFound) {
        console.log('⚠️  No Next.js configuration file found');
    }
    
    return headersConfigured;
}

// Test middleware security headers
function testMiddlewareSecurityHeaders() {
    console.log('\n🔧 Testing Middleware Security Headers...');
    
    const middlewareFile = path.join(process.cwd(), 'apps/web/src/middleware.ts');
    
    if (fs.existsSync(middlewareFile)) {
        console.log('📋 Checking middleware.ts...');
        const content = fs.readFileSync(middlewareFile, 'utf8');
        
        let middlewareHeaders = [];
        
        // Check for security headers in middleware
        Object.keys(requiredSecurityHeaders).forEach(header => {
            const headerVariants = [
                header,
                header.toLowerCase(),
                `'${header}'`,
                `"${header}"`,
                header.replace(/-/g, '')
            ];
            
            if (headerVariants.some(variant => content.includes(variant))) {
                console.log(`  ✅ ${header} found in middleware`);
                middlewareHeaders.push(header);
            }
        });
        
        // Check for NextResponse.next() with headers
        if (content.includes('NextResponse') && content.includes('headers')) {
            console.log('  ✅ NextResponse headers modification found');
            passed++;
        }
        
        // Check for header setting patterns
        const headerPatterns = [
            'response.headers.set',
            'headers.set',
            'setHeader',
            'append'
        ];
        
        if (headerPatterns.some(pattern => content.includes(pattern))) {
            console.log('  ✅ Header setting patterns found');
            passed++;
        }
        
        return middlewareHeaders;
    } else {
        console.log('⚠️  No middleware.ts file found');
        return [];
    }
}

// Test for Content Security Policy configuration
function testCSPConfiguration() {
    console.log('\n🔒 Testing Content Security Policy Configuration...');
    
    const files = [
        'apps/web/next.config.js',
        'apps/web/next.config.mjs',
        'apps/web/src/middleware.ts',
        'apps/web/src/lib/security/csp.ts'
    ];
    
    let cspFound = false;
    let cspDirectives = [];
    
    files.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes('Content-Security-Policy') || 
                content.includes('contentSecurityPolicy') ||
                content.includes('csp')) {
                
                console.log(`📋 CSP configuration found in ${file}`);
                cspFound = true;
                
                // Check for CSP directives
                const commonDirectives = [
                    'default-src',
                    'script-src',
                    'style-src',
                    'img-src',
                    'connect-src',
                    'font-src',
                    'object-src',
                    'media-src',
                    'frame-src',
                    'worker-src',
                    'form-action',
                    'base-uri',
                    'upgrade-insecure-requests'
                ];
                
                commonDirectives.forEach(directive => {
                    if (content.includes(directive)) {
                        console.log(`  ✅ CSP directive found: ${directive}`);
                        cspDirectives.push(directive);
                    }
                });
            }
        }
    });
    
    if (cspFound) {
        console.log('✅ Content Security Policy configuration found');
        passed++;
        
        if (cspDirectives.length >= 5) {
            console.log(`✅ Comprehensive CSP with ${cspDirectives.length} directives`);
            passed++;
        } else if (cspDirectives.length > 0) {
            console.log(`⚠️  Basic CSP with ${cspDirectives.length} directives`);
        }
    } else {
        console.log('⚠️  No Content Security Policy configuration found');
        console.log('ℹ️  CSP is critical for XSS prevention in healthcare apps');
    }
}

// Test for HTTPS and HSTS configuration
function testHTTPSConfiguration() {
    console.log('\n🔐 Testing HTTPS and HSTS Configuration...');
    
    const files = [
        'apps/web/next.config.js',
        'apps/web/next.config.mjs',
        'apps/web/src/middleware.ts'
    ];
    
    let httpsConfig = false;
    let hstsConfig = false;
    
    files.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Check for HTTPS enforcement
            const httpsPatterns = [
                'https',
                'secure',
                'ssl',
                'tls',
                'forceHTTPS',
                'redirectToHTTPS'
            ];
            
            if (httpsPatterns.some(pattern => content.toLowerCase().includes(pattern.toLowerCase()))) {
                console.log(`  ✅ HTTPS configuration found in ${file}`);
                httpsConfig = true;
            }
            
            // Check for HSTS
            if (content.includes('Strict-Transport-Security') || 
                content.includes('strictTransportSecurity') ||
                content.includes('hsts')) {
                console.log(`  ✅ HSTS configuration found in ${file}`);
                hstsConfig = true;
            }
        }
    });
    
    if (httpsConfig) {
        console.log('✅ HTTPS configuration detected');
        passed++;
    } else {
        console.log('⚠️  No explicit HTTPS configuration found');
    }
    
    if (hstsConfig) {
        console.log('✅ HSTS (Strict-Transport-Security) configuration found');
        passed++;
    } else {
        console.log('⚠️  No HSTS configuration found');
        console.log('ℹ️  HSTS is critical for preventing SSL downgrade attacks');
    }
}

// Test for frame options and clickjacking protection
function testClickjackingProtection() {
    console.log('\n🖼️ Testing Clickjacking Protection...');
    
    const files = [
        'apps/web/next.config.js',
        'apps/web/next.config.mjs',
        'apps/web/src/middleware.ts'
    ];
    
    let frameOptionsFound = false;
    
    files.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes('X-Frame-Options') || 
                content.includes('frameOptions') ||
                content.includes('DENY') ||
                content.includes('SAMEORIGIN')) {
                console.log(`  ✅ X-Frame-Options configuration found in ${file}`);
                frameOptionsFound = true;
            }
        }
    });
    
    if (frameOptionsFound) {
        console.log('✅ Clickjacking protection (X-Frame-Options) configured');
        passed++;
    } else {
        console.log('⚠️  No clickjacking protection found');
        console.log('ℹ️  X-Frame-Options should be set to DENY or SAMEORIGIN');
    }
}

// Test for MIME type sniffing protection
function testMIMESniffingProtection() {
    console.log('\n📄 Testing MIME Type Sniffing Protection...');
    
    const files = [
        'apps/web/next.config.js',
        'apps/web/next.config.mjs',
        'apps/web/src/middleware.ts'
    ];
    
    let noSniffFound = false;
    
    files.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes('X-Content-Type-Options') || 
                content.includes('contentTypeOptions') ||
                content.includes('nosniff')) {
                console.log(`  ✅ X-Content-Type-Options configuration found in ${file}`);
                noSniffFound = true;
            }
        }
    });
    
    if (noSniffFound) {
        console.log('✅ MIME type sniffing protection configured');
        passed++;
    } else {
        console.log('⚠️  No MIME type sniffing protection found');
        console.log('ℹ️  X-Content-Type-Options: nosniff should be set');
    }
}

// Test for referrer policy
function testReferrerPolicy() {
    console.log('\n🔗 Testing Referrer Policy...');
    
    const files = [
        'apps/web/next.config.js',
        'apps/web/next.config.mjs',
        'apps/web/src/middleware.ts'
    ];
    
    let referrerPolicyFound = false;
    
    files.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes('Referrer-Policy') || 
                content.includes('referrerPolicy') ||
                content.includes('same-origin') ||
                content.includes('strict-origin')) {
                console.log(`  ✅ Referrer-Policy configuration found in ${file}`);
                referrerPolicyFound = true;
            }
        }
    });
    
    if (referrerPolicyFound) {
        console.log('✅ Referrer policy configured');
        passed++;
    } else {
        console.log('⚠️  No referrer policy found');
        console.log('ℹ️  Referrer-Policy helps protect user privacy');
    }
}

// Generate security headers analysis report
function generateSecurityHeadersReport(nextHeaders, middlewareHeaders) {
    console.log('\n📊 Security Headers Analysis Report...');
    
    const allConfiguredHeaders = [...new Set([...nextHeaders, ...middlewareHeaders])];
    const criticalHeaders = Object.keys(requiredSecurityHeaders).filter(
        header => requiredSecurityHeaders[header].critical
    );
    
    console.log('\n✅ Configured Security Headers:');
    allConfiguredHeaders.forEach(header => {
        const isCritical = requiredSecurityHeaders[header]?.critical ? ' (Critical)' : '';
        console.log(`  - ${header}${isCritical}`);
    });
    
    console.log('\n⚠️  Missing Critical Headers:');
    const missingCritical = criticalHeaders.filter(header => !allConfiguredHeaders.includes(header));
    if (missingCritical.length === 0) {
        console.log('  None - All critical headers configured! 🎉');
        passed += 2;
    } else {
        missingCritical.forEach(header => {
            console.log(`  - ${header}: ${requiredSecurityHeaders[header].description}`);
        });
        failed++;
    }
    
    console.log('\n📋 Recommended Additional Headers:');
    const recommendedHeaders = Object.keys(requiredSecurityHeaders).filter(
        header => !requiredSecurityHeaders[header].critical && !allConfiguredHeaders.includes(header)
    );
    recommendedHeaders.forEach(header => {
        console.log(`  - ${header}: ${requiredSecurityHeaders[header].description}`);
    });
    
    const coveragePercentage = (allConfiguredHeaders.length / Object.keys(requiredSecurityHeaders).length * 100).toFixed(1);
    console.log(`\n📊 Security Headers Coverage: ${allConfiguredHeaders.length}/${Object.keys(requiredSecurityHeaders).length} (${coveragePercentage}%)`);
}

// Run all security headers tests
function runAllTests() {
    console.log('🧪 Starting Security Headers Tests...\n');
    
    const nextHeaders = testNextJSSecurityHeaders();
    const middlewareHeaders = testMiddlewareSecurityHeaders();
    testCSPConfiguration();
    testHTTPSConfiguration();
    testClickjackingProtection();
    testMIMESniffingProtection();
    testReferrerPolicy();
    generateSecurityHeadersReport(nextHeaders, middlewareHeaders);
    
    // Final results
    console.log('\n📊 Security Headers Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 Security headers tests passed!');
        console.log('🛡️ Application has good security header configuration');
        console.log('\n🔧 Recommendations:');
        console.log('1. Regularly audit and update CSP directives');
        console.log('2. Monitor browser console for CSP violations');
        console.log('3. Test headers with online security scanners');
        console.log('4. Consider adding Permissions-Policy for enhanced control');
        console.log('5. Implement HSTS preload for maximum security');
        console.log('6. Use security.txt for responsible disclosure');
        process.exit(0);
    } else {
        console.log('\n💥 Some security headers tests failed!');
        console.log('🔧 Critical Recommendations:');
        console.log('1. Configure Content-Security-Policy to prevent XSS');
        console.log('2. Set X-Frame-Options to prevent clickjacking');
        console.log('3. Enable X-Content-Type-Options: nosniff');
        console.log('4. Implement Strict-Transport-Security (HSTS)');
        console.log('5. Set appropriate Referrer-Policy');
        console.log('6. Test with tools like securityheaders.com');
        process.exit(1);
    }
}

runAllTests();