/**
 * Comprehensive Test Utilities
 * Supports all testing categories in the 29-step test plan
 */

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../src/config/config');

class TestUtils {
  constructor() {
    this.testResults = [];
    this.dbPool = null;
    this.serverInstance = null;
    this.startTime = null;
  }

  // =========================================
  // CORE TEST INFRASTRUCTURE
  // =========================================

  /**
   * Initialize test environment
   */
  async initializeTestEnvironment() {
    this.startTime = Date.now();
    console.log('🚀 Initializing comprehensive test environment...');
    
    // Initialize test database pool
    this.dbPool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: `${config.database.name}_test`,
      user: config.database.user,
      password: config.database.password,
      max: 5, // Smaller pool for testing
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    return true;
  }

  /**
   * Cleanup test environment
   */
  async cleanupTestEnvironment() {
    console.log('🧹 Cleaning up test environment...');
    
    if (this.dbPool) {
      await this.dbPool.end();
    }
    
    if (this.serverInstance) {
      this.serverInstance.close();
    }

    const duration = Date.now() - this.startTime;
    console.log(`⏱️  Total test duration: ${duration}ms`);
  }

  /**
   * Log test result
   */
  logTestResult(testName, passed, message = '', details = {}) {
    const result = {
      test: testName,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
    
    if (!passed && details.error) {
      console.error(`   Error: ${details.error}`);
    }
  }

  // =========================================
  // DATABASE TEST UTILITIES
  // =========================================

  /**
   * Test database connection pool
   */
  async testDatabaseConnection() {
    try {
      const client = await this.dbPool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      this.logTestResult('Database Connection', true, 'Connection successful');
      return true;
    } catch (error) {
      this.logTestResult('Database Connection', false, 'Connection failed', { error: error.message });
      return false;
    }
  }

  /**
   * Test database transaction rollback
   */
  async testTransactionRollback() {
    const client = await this.dbPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create a test table
      await client.query(`
        CREATE TEMPORARY TABLE test_rollback (
          id SERIAL PRIMARY KEY,
          data TEXT
        )
      `);
      
      // Insert test data
      await client.query('INSERT INTO test_rollback (data) VALUES ($1)', ['test']);
      
      // Verify data exists
      const beforeRollback = await client.query('SELECT COUNT(*) FROM test_rollback');
      
      // Rollback transaction
      await client.query('ROLLBACK');
      
      // Try to query the table (should fail since it was rolled back)
      try {
        await client.query('SELECT COUNT(*) FROM test_rollback');
        this.logTestResult('Transaction Rollback', false, 'Table still exists after rollback');
        return false;
      } catch (rollbackError) {
        // This is expected - table should not exist
        this.logTestResult('Transaction Rollback', true, 'Rollback successful');
        return true;
      }
    } catch (error) {
      await client.query('ROLLBACK');
      this.logTestResult('Transaction Rollback', false, 'Transaction test failed', { error: error.message });
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Test SQL injection protection
   */
  async testSQLInjectionProtection() {
    try {
      // Attempt SQL injection in parameterized query
      const maliciousInput = "'; DROP TABLE users; --";
      
      // This should be safely parameterized and not execute the injection
      const result = await this.dbPool.query(
        'SELECT $1 as safe_input',
        [maliciousInput]
      );
      
      // If we get here, parameterization worked
      const returnedValue = result.rows[0].safe_input;
      const injectionPrevented = returnedValue === maliciousInput;
      
      this.logTestResult('SQL Injection Protection', injectionPrevented, 
        injectionPrevented ? 'Parameterized queries prevented injection' : 'Injection may have been executed');
      
      return injectionPrevented;
    } catch (error) {
      this.logTestResult('SQL Injection Protection', false, 'SQL injection test failed', { error: error.message });
      return false;
    }
  }

  // =========================================
  // AUTHENTICATION TEST UTILITIES
  // =========================================

  /**
   * Generate test JWT token
   */
  generateTestToken(userId = 1, expiresIn = '1h') {
    return jwt.sign(
      { userId, role: 'locum' },
      config.security.jwtSecret,
      { expiresIn }
    );
  }

  /**
   * Generate expired JWT token
   */
  generateExpiredToken(userId = 1) {
    return jwt.sign(
      { userId, role: 'locum' },
      config.security.jwtSecret,
      { expiresIn: '-1h' } // Already expired
    );
  }

  /**
   * Generate malformed JWT token
   */
  generateMalformedToken() {
    return 'malformed.jwt.token.structure';
  }

  /**
   * Test JWT token verification
   */
  testTokenVerification(token) {
    try {
      const decoded = jwt.verify(token, config.security.jwtSecret);
      return { valid: true, decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // =========================================
  // SERVER TEST UTILITIES
  // =========================================

  /**
   * Start test server
   */
  async startTestServer() {
    return new Promise((resolve, reject) => {
      try {
        const app = require('../../src/server');
        const testPort = 4001; // Different from main server
        
        this.serverInstance = app.listen(testPort, () => {
          console.log(`🧪 Test server started on port ${testPort}`);
          resolve(testPort);
        });
        
        this.serverInstance.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Make HTTP request to test server
   */
  async makeHttpRequest(method, path, data = null, headers = {}) {
    const http = require('http');
    const querystring = require('querystring');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 4001,
        path: path,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data && method.toUpperCase() === 'GET') {
        options.path += '?' + querystring.stringify(data);
        data = null;
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: parsedData,
              rawBody: responseData
            });
          } catch (parseError) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: responseData,
              rawBody: responseData
            });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  // =========================================
  // PERFORMANCE TEST UTILITIES
  // =========================================

  /**
   * Measure response time
   */
  async measureResponseTime(requestFunction) {
    const startTime = process.hrtime.bigint();
    const result = await requestFunction();
    const endTime = process.hrtime.bigint();
    
    const responseTimeMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return {
      result,
      responseTime: responseTimeMs
    };
  }

  /**
   * Run concurrent requests
   */
  async runConcurrentRequests(requestFunction, concurrency = 10) {
    const promises = [];
    
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.measureResponseTime(requestFunction));
    }
    
    const results = await Promise.all(promises);
    
    const responseTimes = results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    return {
      results,
      stats: {
        concurrency,
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
        totalRequests: concurrency
      }
    };
  }

  // =========================================
  // SECURITY TEST UTILITIES
  // =========================================

  /**
   * Test XSS payload handling
   */
  generateXSSPayloads() {
    return [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
      '"><script>alert("XSS")</script>',
      "'><script>alert('XSS')</script>"
    ];
  }

  /**
   * Test CSRF token validation
   */
  async testCSRFProtection(endpoint, method = 'POST') {
    // Test request without CSRF token
    const response = await this.makeHttpRequest(method, endpoint, {
      data: 'test'
    });
    
    // Should be rejected due to missing CSRF protection
    return response.statusCode === 403 || response.statusCode === 400;
  }

  // =========================================
  // REPORTING UTILITIES
  // =========================================

  /**
   * Generate test summary report
   */
  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0;
    
    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        passRate: `${passRate}%`,
        duration: this.startTime ? Date.now() - this.startTime : 0
      },
      results: this.testResults,
      failedTests: this.testResults.filter(r => !r.passed)
    };
    
    return report;
  }

  /**
   * Print test summary
   */
  printTestSummary() {
    const report = this.generateTestReport();
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed} ✅`);
    console.log(`Failed: ${report.summary.failed} ❌`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`Duration: ${report.summary.duration}ms`);
    
    if (report.failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      report.failedTests.forEach(test => {
        console.log(`  - ${test.test}: ${test.message}`);
      });
    }
    
    console.log('='.repeat(50));
  }
}

module.exports = TestUtils;