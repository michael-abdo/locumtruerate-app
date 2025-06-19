#!/usr/bin/env node

/**
 * Quick Visual Validation Script
 * 
 * Usage: npm run visual-test
 * 
 * Takes screenshots and validates the current state of the application
 * Provides immediate visual feedback for development iteration
 */

const VisualValidator = require('./visual-validator');

async function quickValidation() {
  console.log('🚀 Starting Quick Visual Validation...\n');
  
  const validator = new VisualValidator();
  const report = await validator.validateApplication();
  
  // Quick feedback
  if (report.summary.passed === report.summary.total) {
    console.log('\n🎉 ALL TESTS PASSED! Application is visually validated.');
  } else {
    console.log(`\n⚠️  ${report.summary.failed} issues found. Check screenshots for details.`);
  }
  
  return report;
}

// Run immediately
quickValidation().catch(console.error);