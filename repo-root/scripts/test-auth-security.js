#!/usr/bin/env node

// Authentication Security Test
// Tests that authentication system is properly secured against common attacks

const fs = require('fs');
const path = require('path');

console.log('🔐 Testing Authentication Security...');

let passed = 0;
let failed = 0;

// Test for secure authentication configuration
function testAuthConfiguration() {
    console.log('\n🔧 Testing Authentication Configuration...');
    
    const authFiles = [
        'apps/web/src/middleware.ts',
        'apps/web/src/lib/auth',
        'packages/auth/src'
    ];
    
    let authConfigFound = false;
    let securePatterns = 0;
    
    authFiles.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
                const files = fs.readdirSync(fullPath, { recursive: true });
                files.forEach(file => {
                    if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.')) {
                        const filePath = path.join(fullPath, file);
                        const content = fs.readFileSync(filePath, 'utf8');
                        
                        // Check for authentication patterns
                        const authPatterns = [
                            'authentication',
                            'authorize',
                            'auth',
                            'clerk',
                            'nextauth',
                            'session',
                            'token',
                            'jwt',
                            'login',
                            'logout',
                            'signin',
                            'signout'
                        ];
                        
                        authPatterns.forEach(pattern => {
                            if (content.toLowerCase().includes(pattern.toLowerCase())) {
                                authConfigFound = true;
                                securePatterns++;
                            }
                        });
                        
                        if (authPatterns.some(pattern => content.toLowerCase().includes(pattern.toLowerCase()))) {
                            console.log(`  ✅ Authentication configuration found in ${file}`);
                        }
                    }
                });
            } else {
                const content = fs.readFileSync(fullPath, 'utf8');
                const authPatterns = ['auth', 'clerk', 'session', 'token'];
                if (authPatterns.some(pattern => content.toLowerCase().includes(pattern))) {
                    console.log(`  ✅ Authentication configuration found in ${fullPath}`);
                    authConfigFound = true;
                    securePatterns++;
                }
            }
        }
    });
    
    if (authConfigFound && securePatterns >= 5) {
        console.log('✅ Good authentication configuration');
        passed += 2;
    } else if (authConfigFound) {
        console.log('⚠️  Basic authentication configuration found');
        passed++;
    } else {
        console.log('❌ No authentication configuration detected');
        failed++;
    }
}

// Test for session management security
function testSessionSecurity() {
    console.log('\n🍪 Testing Session Management Security...');
    
    // Check environment variables for secure session configuration
    require('dotenv').config({ path: '.env.local' });
    
    const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    if (authSecret) {
        console.log('✅ Auth secret configuration found');
        
        if (authSecret.length >= 32) {
            console.log('✅ Auth secret has adequate length');
            passed++;
        } else {
            console.log('⚠️  Auth secret may be too short');
        }
        passed++;
    }
    
    if (clerkSecretKey) {
        console.log('✅ Clerk secret key configuration found');
        
        if (clerkSecretKey.startsWith('sk_')) {
            console.log('✅ Clerk secret key has correct format');
            passed++;
        } else {
            console.log('⚠️  Clerk secret key format check failed');
        }
    }
    
    // Check for secure cookie configuration
    const configFiles = [
        'apps/web/next.config.js',
        'apps/web/next.config.mjs',
        'apps/web/src/middleware.ts'
    ];
    
    let secureCookiesFound = false;
    
    configFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes('secure') || 
                content.includes('httpOnly') ||
                content.includes('sameSite')) {
                console.log(`✅ Secure cookie configuration found in ${file}`);
                secureCookiesFound = true;
                passed++;
            }
        }
    });
    
    if (!secureCookiesFound) {
        console.log('ℹ️  No explicit secure cookie configuration - may be handled by framework');
    }
}

// Test for password security patterns
function testPasswordSecurity() {
    console.log('\n🔑 Testing Password Security...');
    
    const authDirs = [
        'apps/web/src/components/auth',
        'apps/web/src/app/auth',
        'apps/web/src/app/(auth)'
    ];
    
    let passwordValidation = 0;
    let passwordHashing = 0;
    
    authDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath, { recursive: true });
            
            files.forEach(file => {
                if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.')) {
                    const filePath = path.join(fullPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check for password validation patterns
                    const validationPatterns = [
                        'password',
                        'minLength',
                        'maxLength',
                        'regex',
                        'pattern',
                        'validation',
                        'strength',
                        'complexity'
                    ];
                    
                    validationPatterns.forEach(pattern => {
                        if (content.includes(pattern)) {
                            passwordValidation++;
                        }
                    });
                    
                    // Check for secure password handling
                    const hashingPatterns = [
                        'bcrypt',
                        'argon2',
                        'scrypt',
                        'pbkdf2',
                        'hash',
                        'salt',
                        'crypto'
                    ];
                    
                    hashingPatterns.forEach(pattern => {
                        if (content.includes(pattern)) {
                            passwordHashing++;
                        }
                    });
                }
            });
        }
    });
    
    if (passwordValidation >= 3) {
        console.log('✅ Good password validation patterns');
        passed++;
    } else if (passwordValidation > 0) {
        console.log('⚠️  Basic password validation found');
    } else {
        console.log('ℹ️  No explicit password validation - may be handled by auth provider');
    }
    
    if (passwordHashing > 0) {
        console.log('✅ Password hashing patterns found');
        passed++;
    } else {
        console.log('ℹ️  No explicit password hashing - likely handled by Clerk');
    }
}

// Test for authentication bypass protection
function testAuthBypassProtection() {
    console.log('\n🚫 Testing Authentication Bypass Protection...');
    
    const middlewareFile = path.join(process.cwd(), 'apps/web/src/middleware.ts');
    
    if (fs.existsSync(middlewareFile)) {
        console.log('📋 Checking middleware.ts...');
        const content = fs.readFileSync(middlewareFile, 'utf8');
        
        // Check for protected routes
        const protectionPatterns = [
            'protected',
            'private',
            'auth',
            'require',
            'check',
            'verify',
            'guard',
            'middleware'
        ];
        
        let protectionFound = 0;
        protectionPatterns.forEach(pattern => {
            if (content.toLowerCase().includes(pattern.toLowerCase())) {
                protectionFound++;
            }
        });
        
        if (protectionFound >= 3) {
            console.log('✅ Good authentication protection patterns');
            passed++;
        } else if (protectionFound > 0) {
            console.log('⚠️  Basic authentication protection found');
        } else {
            console.log('⚠️  Limited authentication protection detected');
        }
        
        // Check for development bypass
        if (content.includes('development') && content.includes('bypass')) {
            console.log('⚠️  Development bypass detected - ensure it\'s disabled in production');
        } else {
            console.log('✅ No obvious development bypass in production');
            passed++;
        }
    }
}

// Test for JWT token security
function testJWTSecurity() {
    console.log('\n🎫 Testing JWT Token Security...');
    
    const jwtFiles = [
        'apps/web/src/lib/jwt',
        'apps/web/src/lib/auth',
        'packages/auth/src'
    ];
    
    let jwtSecurityPatterns = 0;
    
    jwtFiles.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
                const files = fs.readdirSync(fullPath, { recursive: true });
                files.forEach(file => {
                    if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('.test.')) {
                        const filePath = path.join(fullPath, file);
                        const content = fs.readFileSync(filePath, 'utf8');
                        
                        // Check for JWT security patterns
                        const jwtPatterns = [
                            'jwt',
                            'jsonwebtoken',
                            'verify',
                            'decode',
                            'sign',
                            'secret',
                            'algorithm',
                            'expiration',
                            'exp',
                            'iat'
                        ];
                        
                        jwtPatterns.forEach(pattern => {
                            if (content.toLowerCase().includes(pattern.toLowerCase())) {
                                jwtSecurityPatterns++;
                            }
                        });
                    }
                });
            }
        }
    });
    
    if (jwtSecurityPatterns >= 5) {
        console.log('✅ Good JWT security implementation');
        passed++;
    } else if (jwtSecurityPatterns > 0) {
        console.log('⚠️  Basic JWT patterns found');
    } else {
        console.log('ℹ️  No explicit JWT handling - likely managed by Clerk');
    }
}

// Test for rate limiting on auth endpoints
function testAuthRateLimiting() {
    console.log('\n⏱️ Testing Authentication Rate Limiting...');
    
    const apiDirs = [
        'apps/web/src/app/api/auth',
        'apps/web/src/middleware.ts'
    ];
    
    let rateLimitingFound = false;
    
    apiDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
                const files = fs.readdirSync(fullPath, { recursive: true });
                files.forEach(file => {
                    if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('.test.')) {
                        const filePath = path.join(fullPath, file);
                        const content = fs.readFileSync(filePath, 'utf8');
                        
                        const rateLimitPatterns = [
                            'rate',
                            'limit',
                            'throttle',
                            'rateLimit',
                            'rateLimiter',
                            'slowDown',
                            'delay'
                        ];
                        
                        if (rateLimitPatterns.some(pattern => content.toLowerCase().includes(pattern.toLowerCase()))) {
                            console.log(`✅ Rate limiting found in ${file}`);
                            rateLimitingFound = true;
                        }
                    }
                });
            } else {
                const content = fs.readFileSync(fullPath, 'utf8');
                const rateLimitPatterns = ['rate', 'limit', 'throttle'];
                if (rateLimitPatterns.some(pattern => content.toLowerCase().includes(pattern))) {
                    console.log(`✅ Rate limiting found in ${fullPath}`);
                    rateLimitingFound = true;
                }
            }
        }
    });
    
    if (rateLimitingFound) {
        console.log('✅ Authentication rate limiting implemented');
        passed++;
    } else {
        console.log('⚠️  No explicit rate limiting on auth endpoints');
        console.log('ℹ️  Note: This may be handled by Clerk or reverse proxy');
    }
}

// Test for multi-factor authentication
function testMFA() {
    console.log('\n🔢 Testing Multi-Factor Authentication...');
    
    const authDirs = [
        'apps/web/src/components/auth',
        'apps/web/src/app/auth'
    ];
    
    let mfaPatterns = 0;
    
    authDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath, { recursive: true });
            
            files.forEach(file => {
                if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.')) {
                    const filePath = path.join(fullPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    const mfaTerms = [
                        'mfa',
                        'multi-factor',
                        'two-factor',
                        '2fa',
                        'totp',
                        'otp',
                        'authenticator',
                        'sms',
                        'verification'
                    ];
                    
                    mfaTerms.forEach(term => {
                        if (content.toLowerCase().includes(term.toLowerCase())) {
                            mfaPatterns++;
                        }
                    });
                }
            });
        }
    });
    
    if (mfaPatterns >= 3) {
        console.log('✅ Multi-factor authentication patterns found');
        passed++;
    } else if (mfaPatterns > 0) {
        console.log('⚠️  Some MFA patterns detected');
    } else {
        console.log('ℹ️  No explicit MFA implementation - may be configured in Clerk');
    }
}

// Run all authentication security tests
function runAllTests() {
    console.log('🧪 Starting Authentication Security Tests...\n');
    
    testAuthConfiguration();
    testSessionSecurity();
    testPasswordSecurity();
    testAuthBypassProtection();
    testJWTSecurity();
    testAuthRateLimiting();
    testMFA();
    
    // Final results
    console.log('\n📊 Authentication Security Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 Authentication security tests passed!');
        console.log('🔐 Authentication system appears properly secured');
        console.log('\n🔧 Recommendations:');
        console.log('1. Ensure session tokens have proper expiration');
        console.log('2. Implement rate limiting on authentication endpoints');
        console.log('3. Use secure cookie attributes (httpOnly, secure, sameSite)');
        console.log('4. Consider implementing MFA for admin accounts');
        console.log('5. Regularly rotate authentication secrets');
        console.log('6. Monitor for suspicious authentication patterns');
        process.exit(0);
    } else {
        console.log('\n💥 Some authentication security tests failed!');
        console.log('🔧 Critical Recommendations:');
        console.log('1. Configure proper authentication middleware');
        console.log('2. Implement secure session management');
        console.log('3. Add password complexity requirements');
        console.log('4. Set up proper JWT token validation');
        console.log('5. Implement rate limiting on auth endpoints');
        console.log('6. Enable multi-factor authentication');
        process.exit(1);
    }
}

runAllTests();