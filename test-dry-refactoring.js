#!/usr/bin/env node

/**
 * DRY Refactoring Verification Test Script
 * 
 * This script tests all the DRY refactoring changes to ensure:
 * 1. Centralized validation schemas work correctly
 * 2. Response utilities format consistently  
 * 3. Database utilities function properly
 * 4. Configuration management works
 * 5. No functionality was broken during refactoring
 */

const assert = require('assert');
const path = require('path');

// Test color output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    log(`✅ ${testName}`, 'green');
    passedTests++;
  } catch (error) {
    log(`❌ ${testName}: ${error.message}`, 'red');
    failedTests++;
  }
}

async function testDRYRefactoring() {
  log('\n🧪 Starting DRY Refactoring Verification Tests\n', 'blue');

  // ==========================================================================
  // Test 1: Centralized Configuration
  // ==========================================================================
  
  runTest('Configuration module loads without errors', () => {
    const config = require('./src/config/config');
    assert(config, 'Config should be defined');
    assert(config.server, 'Server config should exist');
    assert(config.database, 'Database config should exist');
    assert(config.utils, 'Utils should exist');
    assert(config.logger, 'Logger should exist');
  });

  runTest('Development token management is available', () => {
    const config = require('./src/config/config');
    if (process.env.NODE_ENV === 'development') {
      assert(config.devTokens, 'DevTokens should exist in development');
      assert(typeof config.devTokens.getByRole === 'function', 'getByRole should be a function');
    }
  });

  // ==========================================================================
  // Test 2: Centralized Validation Schemas
  // ==========================================================================

  runTest('Validation schemas module loads correctly', () => {
    const schemas = require('./src/validation/schemas');
    assert(schemas.authSchemas, 'Auth schemas should exist');
    assert(schemas.jobSchemas, 'Job schemas should exist'); 
    assert(schemas.applicationSchemas, 'Application schemas should exist');
    assert(schemas.validateWithSchema, 'Validation helper should exist');
  });

  runTest('Auth registration schema validates correctly', () => {
    const { authSchemas, validateWithSchema } = require('./src/validation/schemas');
    
    // Valid data should pass
    const validData = {
      email: 'test@example.com',
      password: 'test123',
      firstName: 'Test',
      lastName: 'User',
      role: 'locum'
    };
    
    const result = validateWithSchema(validData, authSchemas.register);
    assert(result.isValid, 'Valid registration data should pass validation');
    assert(result.value, 'Validated value should be returned');
  });

  runTest('Auth registration schema rejects invalid data', () => {
    const { authSchemas, validateWithSchema } = require('./src/validation/schemas');
    
    // Invalid data should fail
    const invalidData = {
      email: 'not-an-email',
      password: '123', // too short
      firstName: '',
      lastName: 'User'
    };
    
    const result = validateWithSchema(invalidData, authSchemas.register);
    assert(!result.isValid, 'Invalid registration data should fail validation');
    assert(result.error, 'Error message should be provided');
  });

  runTest('Job schema validates with custom validation', () => {
    const { jobSchemas, validateWithSchema } = require('./src/validation/schemas');
    
    // Test custom validation (min rate > max rate should fail)
    const invalidJobData = {
      title: 'Test Job',
      location: 'Test City',
      state: 'CA',
      specialty: 'Test Specialty',
      hourlyRateMin: 100,
      hourlyRateMax: 50  // Invalid: min > max
    };
    
    const result = validateWithSchema(invalidJobData, jobSchemas.create);
    assert(!result.isValid, 'Job with min rate > max rate should fail validation');
  });

  runTest('Pagination schema provides correct defaults', () => {
    const { paginationSchema, validateWithSchema } = require('./src/validation/schemas');
    
    const result = validateWithSchema({}, paginationSchema);
    assert(result.isValid, 'Empty pagination should be valid with defaults');
    assert(result.value.page === 1, 'Default page should be 1');
    assert(result.value.limit === 20, 'Default limit should be 20');
    assert(result.value.sortOrder === 'DESC', 'Default sort order should be DESC');
  });

  // ==========================================================================
  // Test 3: Response Utilities
  // ==========================================================================

  runTest('Response utilities module loads correctly', () => {
    const responses = require('./src/utils/responses');
    assert(responses.createSuccessResponse, 'createSuccessResponse should exist');
    assert(responses.createErrorResponse, 'createErrorResponse should exist');
    assert(responses.createPaginatedResponse, 'createPaginatedResponse should exist');
    assert(responses.asyncHandler, 'asyncHandler should exist');
  });

  runTest('Response utilities create consistent formats', () => {
    const { createSuccessResponse, createErrorResponse } = require('./src/utils/responses');
    
    // Mock response object
    const mockRes = {
      status: (code) => mockRes,
      json: (data) => data
    };
    
    // Test success response format
    const successResponse = createSuccessResponse(mockRes, 200, { test: 'data' });
    assert(successResponse.success === true, 'Success response should have success: true');
    assert(successResponse.data, 'Success response should have data');
    assert(successResponse.timestamp, 'Success response should have timestamp');
    
    // Test error response format  
    const errorResponse = createErrorResponse(mockRes, 400, 'Test error', 'test_error');
    assert(errorResponse.error === 'test_error', 'Error response should have error type');
    assert(errorResponse.message === 'Test error', 'Error response should have message');
    assert(errorResponse.timestamp, 'Error response should have timestamp');
  });

  // ==========================================================================
  // Test 4: Database Utilities
  // ==========================================================================

  runTest('Database utilities module loads correctly', () => {
    const dbUtils = require('./src/utils/database');
    assert(dbUtils.buildWhereClause, 'buildWhereClause should exist');
    assert(dbUtils.buildPaginationClause, 'buildPaginationClause should exist');
    assert(dbUtils.buildOrderClause, 'buildOrderClause should exist');
    assert(dbUtils.buildSearchCondition, 'buildSearchCondition should exist');
  });

  runTest('WHERE clause builder works correctly', () => {
    const { buildWhereClause } = require('./src/utils/database');
    
    assert(buildWhereClause([]) === '', 'Empty conditions should return empty string');
    
    const conditions = ['user_id = $1', 'status = $2'];
    const whereClause = buildWhereClause(conditions);
    assert(whereClause === 'WHERE user_id = $1 AND status = $2', 'WHERE clause should be properly formatted');
  });

  runTest('Pagination clause builder calculates correctly', () => {
    const { buildPaginationClause } = require('./src/utils/database');
    
    const page1 = buildPaginationClause(1, 20);
    assert(page1.offset === 0, 'Page 1 offset should be 0');
    assert(page1.limit === 20, 'Limit should match input');
    
    const page2 = buildPaginationClause(2, 20);
    assert(page2.offset === 20, 'Page 2 offset should be 20');
    
    const page3 = buildPaginationClause(3, 10);
    assert(page3.offset === 20, 'Page 3 with limit 10 should have offset 20');
  });

  runTest('Search condition builder formats correctly', () => {
    const { buildSearchCondition } = require('./src/utils/database');
    
    const result = buildSearchCondition('test search', ['title', 'description'], 1);
    assert(result.condition.includes('ILIKE'), 'Search condition should use ILIKE');
    assert(result.condition.includes('OR'), 'Multiple fields should be joined with OR');
    assert(result.values[0] === '%test search%', 'Search term should be wrapped with %');
  });

  // ==========================================================================
  // Test 5: File Structure Validation
  // ==========================================================================

  runTest('Required new files exist', () => {
    const fs = require('fs');
    
    const requiredFiles = [
      './src/validation/schemas.js',
      './src/utils/responses.js',
      './src/utils/database.js',
      './DRY_REFACTORING_COMPLETE.md'
    ];
    
    for (const file of requiredFiles) {
      assert(fs.existsSync(file), `Required file should exist: ${file}`);
    }
  });

  runTest('Token files were removed', () => {
    const fs = require('fs');
    
    // Check for specific token files that should have been removed
    const tokenFiles = [
      'token.txt',
      'applicant_token.txt', 
      'recruiter_token.txt',
      'fresh_token.txt',
      'standard_token.txt',
      'test_token.txt',
      'recruiter_token2.txt'
    ];
    
    let remainingTokens = [];
    for (const file of tokenFiles) {
      if (fs.existsSync(file)) {
        remainingTokens.push(file);
      }
    }
    
    assert(remainingTokens.length === 0, `Token files should be removed, found: ${remainingTokens.join(', ')}`);
  });

  // ==========================================================================
  // Test 6: Integration Tests
  // ==========================================================================

  runTest('Route files can import centralized modules', () => {
    // Test that route files can successfully import new modules
    const schemas = require('./src/validation/schemas');
    const responses = require('./src/utils/responses');
    const dbUtils = require('./src/utils/database');
    
    // These should all be available for route files to import
    assert(schemas && responses && dbUtils, 'All centralized modules should be importable');
  });

  // ==========================================================================
  // Results Summary
  // ==========================================================================

  log('\n📊 Test Results Summary', 'blue');
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, 'green'); 
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
  
  if (failedTests === 0) {
    log('\n🎉 All DRY refactoring tests passed! The refactoring was successful.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the failing tests and fix issues.', 'red');
    process.exit(1);
  }
}

// Handle module import vs direct execution
if (require.main === module) {
  testDRYRefactoring().catch(error => {
    log(`\n💥 Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testDRYRefactoring };