/**
 * Test Configuration
 * Centralized configuration for all test utilities
 */

module.exports = {
  // Test database configuration
  testDatabase: {
    suffix: '_test',
    maxConnections: 5,
    connectionTimeout: 2000
  },
  
  // Test server configuration
  testServer: {
    port: 4001,
    startupTimeout: 5000
  },
  
  // Performance test thresholds
  performance: {
    maxResponseTime: 1000,     // 1 second
    maxErrorRate: 5,           // 5%
    maxConcurrentUsers: 50,
    defaultTestDuration: 30000 // 30 seconds
  },
  
  // Security test configuration
  security: {
    maxXSSVectors: 5,          // Test first 5 XSS vectors for speed
    maxSQLInjectionVectors: 5, // Test first 5 SQL injection vectors
    testMaliciousPayloads: true
  },
  
  // Edge case test configuration
  edgeCases: {
    maxPayloadSize: 1024 * 1024, // 1MB
    maxStringLength: 10000,
    testNullValues: true,
    testUndefinedValues: true
  },
  
  // Test output configuration
  output: {
    verbose: true,
    colorOutput: true,
    generateReport: true,
    reportFormat: 'console' // 'console', 'json', 'html'
  },
  
  // Test execution configuration
  execution: {
    failFast: false,           // Continue tests even if some fail
    parallel: false,           // Run tests sequentially for consistency
    retryFailedTests: 1,       // Retry failed tests once
    timeoutPerTest: 30000      // 30 seconds per test
  }
};