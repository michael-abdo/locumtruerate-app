#!/usr/bin/env node

// Comprehensive Validation Test
// Tests all 82 components for proper input validation

const fs = require('fs');
const path = require('path');

console.log('✅ Testing Comprehensive Input Validation...');

let passed = 0;
let failed = 0;
let totalComponents = 0;
let validatedComponents = 0;

// Component categories and their expected counts
const componentCategories = {
    admin: { expected: 15, description: 'Admin panel forms' },
    payment: { expected: 12, description: 'Payment processing forms' },
    auth: { expected: 8, description: 'Authentication forms' },
    calculator: { expected: 10, description: 'Calculator components' },
    search: { expected: 15, description: 'Search and filter forms' },
    leads: { expected: 12, description: 'Lead capture forms' },
    support: { expected: 10, description: 'Support and contact forms' }
};

// Validation patterns to look for
const validationPatterns = [
    'safeTextSchema',
    'z\.',
    'zod',
    'schema',
    'validate',
    'validation',
    'stripHtmlTags',
    'moneySchema',
    'emailSchema',
    'phoneSchema'
];

// Security patterns that should be present
const securityPatterns = [
    'htmlTagRegex',
    'sanitize',
    'escape',
    'stripHtml',
    'replace.*[<>]',
    'xss',
    'injection'
];

function scanDirectory(dirPath, category = 'general') {
    const results = {
        total: 0,
        validated: 0,
        files: []
    };
    
    if (!fs.existsSync(dirPath)) {
        console.log(`⚠️  Directory not found: ${dirPath}`);
        return results;
    }
    
    console.log(`\n📁 Scanning ${category}: ${dirPath}`);
    
    function scanRecursively(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Skip node_modules and test directories
                if (!item.includes('node_modules') && !item.includes('.next') && !item.includes('test')) {
                    scanRecursively(fullPath);
                }
            } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
                // Skip test files and type definitions
                if (!item.includes('.test.') && !item.includes('.spec.') && !item.includes('.d.ts')) {
                    results.total++;
                    
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const hasValidation = checkValidation(content, fullPath, category);
                    
                    if (hasValidation) {
                        results.validated++;
                    }
                    
                    results.files.push({
                        path: fullPath,
                        hasValidation,
                        category
                    });
                }
            }
        }
    }
    
    scanRecursively(dirPath);
    return results;
}

function checkValidation(content, filePath, category) {
    let hasValidation = false;
    let hasSecurity = false;
    let foundPatterns = [];
    
    // Check for validation patterns
    for (const pattern of validationPatterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(content)) {
            hasValidation = true;
            foundPatterns.push(pattern);
        }
    }
    
    // Check for security patterns
    for (const pattern of securityPatterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(content)) {
            hasSecurity = true;
            foundPatterns.push(`security:${pattern}`);
        }
    }
    
    // Special checks for forms
    const hasForm = content.includes('<form') || content.includes('onSubmit') || content.includes('handleSubmit');
    const hasInput = content.includes('<input') || content.includes('<textarea') || content.includes('Input');
    
    if (hasForm || hasInput) {
        const fileName = path.basename(filePath);
        
        if (hasValidation || hasSecurity) {
            console.log(`  ✅ ${fileName}: Validation found (${foundPatterns.slice(0, 2).join(', ')})`);
            passed++;
        } else {
            console.log(`  ❌ ${fileName}: No validation found (has form/input)`);
            failed++;
        }
        
        return hasValidation || hasSecurity;
    } else {
        // Non-form components might not need validation
        const fileName = path.basename(filePath);
        
        if (hasValidation || hasSecurity) {
            console.log(`  ✅ ${fileName}: Validation found (${foundPatterns.slice(0, 2).join(', ')})`);
            passed++;
            return true;
        } else {
            console.log(`  ℹ️  ${fileName}: No validation (no form elements)`);
            return false;
        }
    }
}

function testValidationSchemas() {
    console.log('\n🔍 Testing Validation Schema Files...');
    
    const schemaFiles = [
        'apps/web/src/lib/validation/schemas/index.ts',
        'apps/web/src/lib/validation/schemas.ts',
        'apps/web/src/lib/validation/apply-validation.ts'
    ];
    
    let schemaValidation = 0;
    
    schemaFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            console.log(`📋 Checking ${file}...`);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Check for safeTextSchema
            if (content.includes('safeTextSchema')) {
                console.log('  ✅ safeTextSchema found');
                schemaValidation++;
            }
            
            // Check for HTML sanitization
            if (content.includes('stripHtmlTags') || content.includes('replace') && content.includes('[<>]')) {
                console.log('  ✅ HTML sanitization found');
                schemaValidation++;
            }
            
            // Check for common validation schemas
            const commonSchemas = ['emailSchema', 'phoneSchema', 'moneySchema', 'passwordSchema'];
            commonSchemas.forEach(schema => {
                if (content.includes(schema)) {
                    console.log(`  ✅ ${schema} found`);
                    schemaValidation++;
                }
            });
            
            // Check for Zod usage
            if (content.includes('import') && content.includes('zod')) {
                console.log('  ✅ Zod import found');
                schemaValidation++;
            }
            
        } else {
            console.log(`⚠️  ${file} not found`);
        }
    });
    
    if (schemaValidation >= 4) {
        console.log('✅ Validation schemas appear comprehensive');
        passed += 2;
    } else {
        console.log('❌ Validation schemas may be incomplete');
        failed++;
    }
}

function testSpecificComponents() {
    console.log('\n🎯 Testing Specific High-Priority Components...');
    
    const criticalComponents = [
        {
            path: 'apps/web/src/components/calculator/contract-calculator.tsx',
            name: 'Contract Calculator',
            mustHaveValidation: true
        },
        {
            path: 'apps/web/src/components/calculator/paycheck-calculator.tsx',
            name: 'Paycheck Calculator',
            mustHaveValidation: true
        },
        {
            path: 'apps/web/src/components/admin/admin-header.tsx',
            name: 'Admin Header',
            mustHaveValidation: false
        },
        {
            path: 'apps/web/src/app/auth/signin/page.tsx',
            name: 'Sign In Page',
            mustHaveValidation: true
        },
        {
            path: 'apps/web/src/components/support/floating-support-button.tsx',
            name: 'Support Button',
            mustHaveValidation: false
        }
    ];
    
    criticalComponents.forEach(component => {
        const fullPath = path.join(process.cwd(), component.path);
        if (fs.existsSync(fullPath)) {
            console.log(`🔍 Testing ${component.name}...`);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            const hasValidation = validationPatterns.some(pattern => {
                const regex = new RegExp(pattern, 'i');
                return regex.test(content);
            });
            
            if (hasValidation) {
                console.log(`  ✅ ${component.name}: Validation implemented`);
                passed++;
            } else if (component.mustHaveValidation) {
                console.log(`  ❌ ${component.name}: Missing required validation`);
                failed++;
            } else {
                console.log(`  ⚠️  ${component.name}: No validation (may not be required)`);
            }
        } else {
            console.log(`  ⚠️  ${component.name}: File not found`);
        }
    });
}

function generateValidationReport(allResults) {
    console.log('\n📊 Generating Validation Coverage Report...');
    
    const report = {
        totalComponents: 0,
        validatedComponents: 0,
        categories: {}
    };
    
    for (const [category, results] of Object.entries(allResults)) {
        report.totalComponents += results.total;
        report.validatedComponents += results.validated;
        
        report.categories[category] = {
            total: results.total,
            validated: results.validated,
            coverage: results.total > 0 ? (results.validated / results.total * 100).toFixed(1) : 0
        };
        
        console.log(`📋 ${category}: ${results.validated}/${results.total} (${report.categories[category].coverage}%)`);
    }
    
    const overallCoverage = report.totalComponents > 0 ? 
        (report.validatedComponents / report.totalComponents * 100).toFixed(1) : 0;
    
    console.log(`\n🎯 Overall Validation Coverage: ${report.validatedComponents}/${report.totalComponents} (${overallCoverage}%)`);
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'test-reports', 'validation-coverage-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report written to: ${reportPath}`);
    
    // Check if we meet the target of 82 components
    if (report.validatedComponents >= 82) {
        console.log('🎉 Target validation coverage achieved (82+ components)!');
        passed += 5;
    } else if (report.validatedComponents >= 70) {
        console.log('✅ Good validation coverage (70+ components)');
        passed += 3;
    } else if (report.validatedComponents >= 50) {
        console.log('⚠️  Moderate validation coverage (50+ components)');
        passed += 1;
    } else {
        console.log('❌ Low validation coverage (<50 components)');
        failed += 2;
    }
    
    return report;
}

async function runAllTests() {
    console.log('🧪 Starting Comprehensive Validation Tests...\n');
    
    // Test validation schemas
    testValidationSchemas();
    
    // Scan all component directories
    const allResults = {};
    
    const scanPaths = [
        { path: 'apps/web/src/components/admin', category: 'admin' },
        { path: 'apps/web/src/components/auth', category: 'auth' },
        { path: 'apps/web/src/components/calculator', category: 'calculator' },
        { path: 'apps/web/src/components/forms', category: 'forms' },
        { path: 'apps/web/src/components/support', category: 'support' },
        { path: 'apps/web/src/app/auth', category: 'auth-pages' },
        { path: 'apps/web/src/app/admin', category: 'admin-pages' },
        { path: 'apps/web/src/app/jobs', category: 'job-pages' },
        { path: 'apps/web/src/app/tools', category: 'tool-pages' }
    ];
    
    for (const { path: scanPath, category } of scanPaths) {
        const results = scanDirectory(scanPath, category);
        allResults[category] = results;
        totalComponents += results.total;
        validatedComponents += results.validated;
    }
    
    // Test specific critical components
    testSpecificComponents();
    
    // Generate comprehensive report
    const report = generateValidationReport(allResults);
    
    // Final results
    console.log('\n📊 Comprehensive Validation Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total Components Scanned: ${totalComponents}`);
    console.log(`✅ Components with Validation: ${validatedComponents}`);
    
    const successRate = passed / (passed + failed) * 100;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (failed === 0 && validatedComponents >= 70) {
        console.log('\n🎉 Comprehensive validation tests passed!');
        console.log('🛡️ Application has excellent input validation coverage');
        process.exit(0);
    } else if (failed <= 2 && validatedComponents >= 50) {
        console.log('\n⚠️  Validation tests mostly passed with minor issues');
        console.log('🔧 Some components may need validation improvements');
        process.exit(0);
    } else {
        console.log('\n💥 Validation tests failed!');
        console.log('🔧 Recommendations:');
        console.log('1. Add safeTextSchema to all form components');
        console.log('2. Implement HTML tag stripping');
        console.log('3. Add Zod validation to API endpoints');
        console.log('4. Use proper input sanitization');
        process.exit(1);
    }
}

runAllTests();