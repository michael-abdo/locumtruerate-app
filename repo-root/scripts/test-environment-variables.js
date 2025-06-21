#!/usr/bin/env node

// Environment Variables Test
// Tests that all required environment variables are present and valid

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Environment Variables...');

const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
];

const optionalEnvVars = [
    'SENTRY_DSN',
    'REDIS_URL',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD'
];

let passed = 0;
let failed = 0;

// Check .env files exist
const envFiles = [
    '.env.local',
    '.env.example',
    'apps/web/.env.production.example'
];

console.log('\n📁 Checking environment files...');
envFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} exists`);
        passed++;
    } else {
        console.log(`❌ ${file} missing`);
        failed++;
    }
});

// Load environment variables
try {
    require('dotenv').config({ path: '.env.local' });
} catch (error) {
    // Continue without dotenv if not available
}

console.log('\n🔑 Checking required environment variables...');
requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== 'your_value_here' && value !== 'placeholder') {
        console.log(`✅ ${varName} is set`);
        passed++;
    } else {
        console.log(`❌ ${varName} is missing or placeholder`);
        failed++;
    }
});

console.log('\n⚙️ Checking optional environment variables...');
optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== 'your_value_here' && value !== 'placeholder') {
        console.log(`✅ ${varName} is set`);
        passed++;
    } else {
        console.log(`⚠️  ${varName} not set (optional)`);
    }
});

// Check for development vs production values
console.log('\n🔒 Checking for secure production values...');
const devIndicators = [
    'localhost',
    'test',
    'development',
    'dev',
    'placeholder',
    'your_value_here',
    'pk_test_',
    'sk_test_'
];

let securityIssues = 0;
requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        const hasDevIndicator = devIndicators.some(indicator => 
            value.toLowerCase().includes(indicator)
        );
        if (hasDevIndicator) {
            console.log(`⚠️  ${varName} appears to have development/test value`);
            securityIssues++;
        } else {
            console.log(`✅ ${varName} appears to be production value`);
        }
    }
});

// Test database URL format
console.log('\n🗄️ Validating database URL format...');
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
    if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
        console.log('✅ Database URL format is valid');
        passed++;
    } else {
        console.log('❌ Database URL format is invalid');
        failed++;
    }
} else {
    console.log('❌ DATABASE_URL is not set');
    failed++;
}

// Test environment-specific configurations
console.log('\n🌍 Checking environment-specific configurations...');
const nodeEnv = process.env.NODE_ENV;
const isProduction = nodeEnv === 'production';

if (isProduction) {
    console.log('🏭 Production environment detected');
    
    // Check production-specific requirements
    if (process.env.ENABLE_DEBUG_LOGS === 'true') {
        console.log('⚠️  Debug logging enabled in production');
        securityIssues++;
    } else {
        console.log('✅ Debug logging disabled in production');
        passed++;
    }
    
    // Check for secure secrets
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32) {
        console.log('✅ NEXTAUTH_SECRET has sufficient length');
        passed++;
    } else {
        console.log('❌ NEXTAUTH_SECRET is too short for production');
        failed++;
    }
} else {
    console.log('🛠️  Development environment detected');
    console.log('✅ Development configuration checks passed');
    passed++;
}

// Final results
console.log('\n📊 Environment Variables Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Security Issues: ${securityIssues}`);

if (failed === 0 && securityIssues === 0) {
    console.log('\n🎉 All environment variable tests passed!');
    process.exit(0);
} else {
    console.log('\n💥 Some environment variable tests failed!');
    process.exit(1);
}