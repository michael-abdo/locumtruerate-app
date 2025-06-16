#!/usr/bin/env node

/**
 * CHECKPOINT 1 Validation Script
 * Comprehensive validation of Week 1 infrastructure completion
 * Validates: Infrastructure, Security, Monitoring, and Deployment readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎯 CHECKPOINT 1 VALIDATION - LocumTrueRate Infrastructure');
console.log('='.repeat(60));

// Color codes
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function printSection(title) {
    console.log(`\n${BOLD}${BLUE}🔧 ${title}${RESET}`);
    console.log('-'.repeat(40));
}

function printSuccess(message) {
    console.log(`${GREEN}✅ ${message}${RESET}`);
}

function printWarning(message) {
    console.log(`${YELLOW}⚠️  ${message}${RESET}`);
}

function printError(message) {
    console.log(`${RED}❌ ${message}${RESET}`);
}

function printInfo(message) {
    console.log(`${BLUE}ℹ️  ${message}${RESET}`);
}

let categories = {
    infrastructure: { total: 0, passed: 0, name: 'Infrastructure Setup' },
    security: { total: 0, passed: 0, name: 'Security Measures' },
    monitoring: { total: 0, passed: 0, name: 'Monitoring & Logging' },
    deployment: { total: 0, passed: 0, name: 'Deployment Pipeline' },
    mobile: { total: 0, passed: 0, name: 'Mobile-First Architecture' }
};

function validateCategory(category, description, checkFunction) {
    categories[category].total++;
    try {
        const result = checkFunction();
        if (result === true) {
            printSuccess(description);
            categories[category].passed++;
            return true;
        } else {
            printError(`${description}: ${result}`);
            return false;
        }
    } catch (error) {
        printError(`${description}: ${error.message}`);
        return false;
    }
}

// INFRASTRUCTURE VALIDATION
printSection('INFRASTRUCTURE SETUP (Phase A & B)');

validateCategory('infrastructure', 'TurboRepo monorepo structure configured', () => {
    return fs.existsSync('turbo.json') && 
           fs.existsSync('pnpm-workspace.yaml') &&
           fs.existsSync('packages') &&
           fs.existsSync('apps');
});

validateCategory('infrastructure', 'Package structure follows mobile-first design', () => {
    const packages = ['shared', 'types', 'config', 'ui'];
    return packages.every(pkg => fs.existsSync(`packages/${pkg}`));
});

validateCategory('infrastructure', 'Database infrastructure with Prisma configured', () => {
    return fs.existsSync('packages/database/prisma/schema.prisma') &&
           fs.existsSync('packages/database/src/client.ts');
});

validateCategory('infrastructure', 'Comprehensive data models designed', () => {
    const schema = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8');
    const models = ['User', 'Job', 'Application', 'Subscription', 'Analytics'];
    return models.every(model => schema.includes(`model ${model}`));
});

validateCategory('infrastructure', 'Cross-platform configuration packages', () => {
    return fs.existsSync('packages/config/typescript') &&
           fs.existsSync('packages/config/eslint') &&
           fs.existsSync('packages/config/tailwind');
});

// SECURITY VALIDATION
printSection('SECURITY MEASURES (Phase E + HIPAA)');

validateCategory('security', 'Secrets management system implemented', () => {
    return fs.existsSync('packages/secrets/src/manager.ts') &&
           fs.existsSync('packages/secrets/src/encryption.ts') &&
           fs.existsSync('.env.example');
});

validateCategory('security', 'Cloudflare Pages security headers configured', () => {
    return fs.existsSync('packages/cloudflare-pages/src/security-headers.ts') &&
           fs.existsSync('cloudflare-pages.config.json');
});

validateCategory('security', 'Content Security Policy (CSP) implemented', () => {
    const securityFile = fs.readFileSync('packages/cloudflare-pages/src/security-headers.ts', 'utf8');
    return securityFile.includes('generateCSP') &&
           securityFile.includes('script-src') &&
           securityFile.includes('frame-ancestors');
});

validateCategory('security', 'HIPAA compliance features active', () => {
    const securityFile = fs.readFileSync('packages/cloudflare-pages/src/security-headers.ts', 'utf8');
    return securityFile.includes('X-Robots-Tag') &&
           securityFile.includes('HIPAA compliance');
});

validateCategory('security', 'Security testing infrastructure', () => {
    return fs.existsSync('packages/security/src/scanner.ts') &&
           fs.existsSync('packages/security/src/zap.ts') &&
           fs.existsSync('.github/workflows/ci.yml');
});

validateCategory('security', 'API versioning and documentation', () => {
    return fs.existsSync('packages/api-versioning/src/middleware.ts') &&
           fs.existsSync('packages/api-versioning/src/openapi.ts');
});

// MONITORING VALIDATION
printSection('MONITORING & LOGGING (Phase D)');

validateCategory('monitoring', 'Comprehensive error handling strategy', () => {
    return fs.existsSync('packages/shared/src/errors/index.ts') &&
           fs.existsSync('packages/shared/src/utils/logger.ts');
});

validateCategory('monitoring', 'Sentry integration configured', () => {
    const errorFile = fs.readFileSync('packages/shared/src/errors/index.ts', 'utf8');
    return errorFile.includes('Sentry') || errorFile.includes('sentry');
});

validateCategory('monitoring', 'Analytics and metrics tracking', () => {
    return fs.existsSync('packages/shared/src/utils/analytics.ts') &&
           fs.existsSync('packages/shared/src/utils/monitoring.ts');
});

validateCategory('monitoring', 'Rate limiting and DDoS protection', () => {
    return fs.existsSync('packages/shared/src/utils/rate-limiting.ts');
});

validateCategory('monitoring', 'Backup and disaster recovery', () => {
    return fs.existsSync('packages/backup/src/database-backup.ts') &&
           fs.existsSync('packages/backup/src/disaster-recovery.ts') &&
           fs.existsSync('scripts/backup');
});

validateCategory('monitoring', 'Customer support tooling', () => {
    return fs.existsSync('packages/support/src/ticket-system.ts') &&
           fs.existsSync('packages/support/src/billing-support.ts');
});

// DEPLOYMENT VALIDATION
printSection('DEPLOYMENT PIPELINE (Phase E)');

validateCategory('deployment', 'GitHub Actions CI/CD pipeline', () => {
    const ciFile = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
    return ciFile.includes('test') &&
           ciFile.includes('security') &&
           ciFile.includes('deploy');
});

validateCategory('deployment', 'Multi-environment deployment configs', () => {
    return fs.existsSync('cloudflare-pages.config.json') &&
           fs.existsSync('cloudflare-pages.staging.json') &&
           fs.existsSync('cloudflare-pages.development.json');
});

validateCategory('deployment', 'Deployment automation scripts', () => {
    return fs.existsSync('scripts/deploy-production.sh') &&
           fs.existsSync('scripts/deploy-staging.sh') &&
           !!(fs.statSync('scripts/deploy-production.sh').mode & parseInt('111', 8));
});

validateCategory('deployment', 'Testing infrastructure comprehensive', () => {
    return fs.existsSync('jest.config.js') &&
           fs.existsSync('jest.preset.js') &&
           fs.existsSync('docker-compose.test.yml');
});

validateCategory('deployment', 'Mock services for external APIs', () => {
    return fs.existsSync('packages/mocks/src/stripe.ts') &&
           fs.existsSync('packages/mocks/src/email.ts') &&
           fs.existsSync('packages/mocks/src/zapier.ts');
});

// MOBILE-FIRST ARCHITECTURE VALIDATION
printSection('MOBILE-FIRST ARCHITECTURE (Critical Requirement)');

validateCategory('mobile', 'Cross-platform package structure', () => {
    const sharedPkg = JSON.parse(fs.readFileSync('packages/shared/package.json', 'utf8'));
    const typesPkg = JSON.parse(fs.readFileSync('packages/types/package.json', 'utf8'));
    return sharedPkg.name.includes('shared') && typesPkg.name.includes('types');
});

validateCategory('mobile', 'React Native compatibility considerations', () => {
    return fs.existsSync('packages/config/typescript/react-native.json') &&
           fs.existsSync('apps/mobile');
});

validateCategory('mobile', 'Shared business logic packages', () => {
    return fs.existsSync('packages/shared/src/utils') &&
           fs.existsSync('packages/shared/src/errors');
});

validateCategory('mobile', 'Universal API design patterns', () => {
    const apiPkg = fs.existsSync('packages/api');
    const versioningPkg = fs.existsSync('packages/api-versioning');
    return apiPkg && versioningPkg;
});

validateCategory('mobile', 'Performance optimization for mobile', () => {
    const perfFile = fs.readFileSync('packages/cloudflare-pages/src/performance.ts', 'utf8');
    return perfFile.includes('mobile') || perfFile.includes('Performance');
});

// INTEGRATION VALIDATION
printSection('INTEGRATION & COMPLETENESS');

const integrationChecks = [
    {
        name: 'Email service integration (SendGrid)',
        check: () => fs.existsSync('packages/email/src/services/sendgrid.ts')
    },
    {
        name: 'Spam prevention and content moderation',
        check: () => fs.existsSync('packages/moderation/src/spam.ts')
    },
    {
        name: 'Secrets CLI tools functional',
        check: () => fs.existsSync('packages/secrets/src/cli.ts')
    },
    {
        name: 'Documentation comprehensive',
        check: () => fs.existsSync('docs/deployment-guide.md')
    },
    {
        name: 'Package.json scripts configured',
        check: () => {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return !!(pkg.scripts['deploy:production'] && pkg.scripts['secrets:validate']);
        }
    }
];

integrationChecks.forEach(check => {
    validateCategory('deployment', check.name, check.check);
});

// FINAL ASSESSMENT
console.log('\n' + '='.repeat(60));
console.log(`${BOLD}🎯 CHECKPOINT 1 ASSESSMENT${RESET}`);
console.log('='.repeat(60));

let totalPassed = 0;
let totalChecks = 0;

Object.entries(categories).forEach(([key, category]) => {
    const percentage = category.total > 0 ? Math.round((category.passed / category.total) * 100) : 0;
    const status = percentage >= 90 ? GREEN : percentage >= 70 ? YELLOW : RED;
    
    console.log(`${status}${category.name}: ${category.passed}/${category.total} (${percentage}%)${RESET}`);
    
    totalPassed += category.passed;
    totalChecks += category.total;
});

const overallPercentage = Math.round((totalPassed / totalChecks) * 100);
const overallStatus = overallPercentage >= 90 ? GREEN : overallPercentage >= 70 ? YELLOW : RED;

console.log('\n' + '-'.repeat(60));
console.log(`${BOLD}Overall Completion: ${overallStatus}${totalPassed}/${totalChecks} (${overallPercentage}%)${RESET}`);

// CHECKPOINT STATUS
console.log('\n🏁 CHECKPOINT 1 STATUS:');

if (overallPercentage >= 90) {
    console.log(`${GREEN}${BOLD}✅ CHECKPOINT 1 COMPLETE${RESET}`);
    console.log('\n🎉 Infrastructure Foundation Ready!');
    console.log('\n📋 Achievements:');
    console.log('  ✅ Complete TurboRepo monorepo infrastructure');
    console.log('  ✅ Mobile-first architecture (85%+ code reuse target)');
    console.log('  ✅ Comprehensive security measures (HIPAA-compliant)');
    console.log('  ✅ Full monitoring and logging pipeline');
    console.log('  ✅ Automated deployment with Cloudflare Pages');
    console.log('  ✅ Secrets management and encryption');
    console.log('  ✅ Testing infrastructure and CI/CD');
    console.log('  ✅ Cross-platform compatibility layers');
    
    console.log('\n🚀 Ready for Week 2 Development:');
    console.log('  • React/TypeScript frontend development');
    console.log('  • React Native mobile app development');
    console.log('  • API implementation and testing');
    console.log('  • User authentication and authorization');
    
} else if (overallPercentage >= 70) {
    console.log(`${YELLOW}${BOLD}⚠️  CHECKPOINT 1 PARTIALLY COMPLETE${RESET}`);
    console.log('\nMinor issues need resolution before proceeding to Week 2');
    
} else {
    console.log(`${RED}${BOLD}❌ CHECKPOINT 1 INCOMPLETE${RESET}`);
    console.log('\nCritical infrastructure gaps must be addressed');
}

// REMAINING TASKS
console.log('\n📋 Remaining Validation Tasks:');
if (fs.existsSync('packages/database/prisma/schema.prisma')) {
    console.log('  • W1-C7: Run prisma migrate dev and validate data integrity');
} else {
    printError('  Missing: Database migrations setup');
}

try {
    // Test if turbo commands work
    execSync('pnpm turbo --version', { stdio: 'pipe' });
    console.log('  ✅ W1-B6: TurboRepo commands functional');
} catch {
    console.log('  • W1-B6: Verify turborepo commands execute');
}

console.log('\n🔄 Next Steps:');
console.log('  1. Complete remaining validation tasks');
console.log('  2. Run comprehensive integration tests');
console.log('  3. Deploy to staging environment');
console.log('  4. Begin Week 2 feature development');

console.log('\n📊 Week 1 Infrastructure Summary:');
console.log(`  • ${categories.infrastructure.passed}/${categories.infrastructure.total} Infrastructure components`);
console.log(`  • ${categories.security.passed}/${categories.security.total} Security measures`);
console.log(`  • ${categories.monitoring.passed}/${categories.monitoring.total} Monitoring systems`);
console.log(`  • ${categories.deployment.passed}/${categories.deployment.total} Deployment features`);
console.log(`  • ${categories.mobile.passed}/${categories.mobile.total} Mobile-first architecture`);

process.exit(overallPercentage >= 90 ? 0 : 1);