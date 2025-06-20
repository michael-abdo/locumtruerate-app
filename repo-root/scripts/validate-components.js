#!/usr/bin/env node

/**
 * Component validation test - checks for common runtime issues
 */

const fs = require('fs');
const path = require('path');

function checkComponentForIssues(componentPath) {
  const fullPath = path.join(__dirname, '..', 'apps', 'web', componentPath);
  
  if (!fs.existsSync(fullPath)) {
    return { status: 'error', message: 'File not found' };
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const issues = [];
    
    // Check for missing imports
    if (content.includes('z.') && !content.includes('import { z }') && !content.includes('from "zod"')) {
      issues.push('Using Zod without import');
    }
    
    // Check for validation patterns
    const hasValidation = content.includes('Schema') || content.includes('validation');
    const hasErrorHandling = content.includes('error') || content.includes('Error');
    const hasZodValidation = content.includes('z.object') || content.includes('z.enum') || content.includes('z.string');
    
    // Check for proper React imports
    if (content.includes('React.') && !content.includes('import React')) {
      issues.push('Using React without import');
    }
    
    // Check for proper TypeScript patterns
    if (content.includes(': any') && content.includes('validation')) {
      issues.push('Using "any" type in validation context');
    }
    
    // Check for potential security issues
    if (content.includes('dangerouslySetInnerHTML')) {
      issues.push('Potential XSS risk: dangerouslySetInnerHTML');
    }
    
    if (content.includes('eval(') || content.includes('Function(')) {
      issues.push('Potential security risk: eval/Function');
    }

    const validation = {
      hasValidation,
      hasErrorHandling,
      hasZodValidation
    };

    if (issues.length > 0) {
      return { status: 'warning', issues, validation };
    }
    
    if (hasZodValidation) {
      return { status: 'success', message: 'Validation implemented', validation };
    }
    
    return { status: 'info', message: 'No validation found', validation };
    
  } catch (error) {
    return { status: 'error', message: `Read error: ${error.message}` };
  }
}

console.log('🔬 Component Validation Analysis\n');

const criticalComponents = [
  'src/components/calculator/contract-calculator.tsx',
  'src/components/calculator/paycheck-calculator.tsx',
  'src/components/calculator/save-calculation-dialog.tsx',
  'src/components/leads/ContactFormModal.tsx',
  'src/components/leads/CalculatorLeadCapture.tsx',
  'src/components/leads/DemoRequestForm.tsx',
  'src/components/leads/NewsletterSignup.tsx',
  'src/components/search/search-bar.tsx',
  'src/components/search/advanced-search.tsx',
  'src/components/jobs/application-form.tsx',
  'src/components/jobs/boost-job-modal.tsx',
  'src/components/jobs/job-filters.tsx'
];

let totalComponents = 0;
let validatedComponents = 0;
let issueCount = 0;

criticalComponents.forEach(componentPath => {
  totalComponents++;
  const result = checkComponentForIssues(componentPath);
  const componentName = path.basename(componentPath, '.tsx');
  
  console.log(`📦 ${componentName}:`);
  
  switch (result.status) {
    case 'success':
      console.log(`  ✅ ${result.message}`);
      if (result.validation?.hasZodValidation) validatedComponents++;
      break;
    case 'warning':
      console.log(`  ⚠️  Issues found:`);
      result.issues.forEach(issue => console.log(`     - ${issue}`));
      if (result.validation?.hasZodValidation) validatedComponents++;
      issueCount += result.issues.length;
      break;
    case 'info':
      console.log(`  ℹ️  ${result.message}`);
      break;
    case 'error':
      console.log(`  ❌ ${result.message}`);
      issueCount++;
      break;
  }
  
  if (result.validation) {
    const { hasValidation, hasErrorHandling, hasZodValidation } = result.validation;
    console.log(`     Validation: ${hasValidation ? '✓' : '✗'} | Error Handling: ${hasErrorHandling ? '✓' : '✗'} | Zod: ${hasZodValidation ? '✓' : '✗'}`);
  }
  
  console.log('');
});

console.log('📊 Summary:');
console.log(`  Total Components: ${totalComponents}`);
console.log(`  With Validation: ${validatedComponents}`);
console.log(`  Issues Found: ${issueCount}`);
console.log(`  Coverage: ${Math.round((validatedComponents / totalComponents) * 100)}%`);

if (validatedComponents >= Math.floor(totalComponents * 0.8)) {
  console.log('\n🎉 Excellent validation coverage!');
} else if (validatedComponents >= Math.floor(totalComponents * 0.6)) {
  console.log('\n✅ Good validation coverage');
} else {
  console.log('\n⚠️  Low validation coverage - consider adding more validation');
}

if (issueCount === 0) {
  console.log('🔒 No security or implementation issues detected');
} else {
  console.log(`🔍 ${issueCount} potential issues detected - review recommended`);
}