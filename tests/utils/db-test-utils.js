/**
 * Database Testing Utilities
 * Specialized utilities for comprehensive database testing
 */

const { Pool } = require('pg');
const config = require('../../src/config/config');

class DatabaseTestUtils {
  constructor() {
    this.testPool = null;
    this.mainPool = null;
  }

  /**
   * Initialize test database environment
   */
  async initializeTestDB() {
    // Create separate test database pool
    this.testPool = new Pool({
      ...config.database,
      database: `${config.database.name}_test`,
      max: 3, // Smaller pool for testing
      connectionTimeoutMillis: 1000
    });

    // Create main database pool for comparison
    this.mainPool = new Pool(config.database);

    return true;
  }

  /**
   * Cleanup test database
   */
  async cleanupTestDB() {
    if (this.testPool) {
      await this.testPool.end();
    }
    if (this.mainPool) {
      await this.mainPool.end();
    }
  }

  /**
   * Test connection pool behavior
   */
  async testConnectionPoolBehavior() {
    const results = [];
    
    try {
      // Test 1: Maximum connections
      const maxConnections = 3;
      const clients = [];
      
      for (let i = 0; i < maxConnections; i++) {
        const client = await this.testPool.connect();
        clients.push(client);
      }
      
      // Try to get one more connection (should timeout)
      const timeoutStart = Date.now();
      try {
        const extraClient = await this.testPool.connect();
        extraClient.release();
        results.push({
          test: 'Pool Max Connection Limit',
          passed: false,
          message: 'Pool allowed more connections than configured maximum'
        });
      } catch (error) {
        const timeoutDuration = Date.now() - timeoutStart;
        results.push({
          test: 'Pool Max Connection Limit',
          passed: timeoutDuration >= 900, // Should timeout around 1000ms
          message: `Pool correctly limited connections (timeout: ${timeoutDuration}ms)`
        });
      }
      
      // Release all clients
      clients.forEach(client => client.release());
      
      // Test 2: Connection reuse
      const client1 = await this.testPool.connect();
      const client1Id = await client1.query('SELECT pg_backend_pid()');
      client1.release();
      
      const client2 = await this.testPool.connect();
      const client2Id = await client2.query('SELECT pg_backend_pid()');
      client2.release();
      
      results.push({
        test: 'Connection Pool Reuse',
        passed: client1Id.rows[0].pg_backend_pid === client2Id.rows[0].pg_backend_pid,
        message: 'Pool correctly reuses connections'
      });
      
    } catch (error) {
      results.push({
        test: 'Connection Pool Behavior',
        passed: false,
        message: `Pool test failed: ${error.message}`
      });
    }
    
    return results;
  }

  /**
   * Test transaction isolation levels
   */
  async testTransactionIsolation() {
    const results = [];
    
    try {
      // Create test table
      await this.testPool.query(`
        CREATE TABLE IF NOT EXISTS test_isolation (
          id SERIAL PRIMARY KEY,
          value INTEGER
        )
      `);
      
      // Clear any existing data
      await this.testPool.query('DELETE FROM test_isolation');
      
      // Test READ COMMITTED isolation
      const client1 = await this.testPool.connect();
      const client2 = await this.testPool.connect();
      
      try {
        // Start transactions
        await client1.query('BEGIN ISOLATION LEVEL READ COMMITTED');
        await client2.query('BEGIN ISOLATION LEVEL READ COMMITTED');
        
        // Client 1 inserts data
        await client1.query('INSERT INTO test_isolation (value) VALUES (100)');
        
        // Client 2 should not see uncommitted data
        const result1 = await client2.query('SELECT COUNT(*) FROM test_isolation');
        
        // Client 1 commits
        await client1.query('COMMIT');
        
        // Client 2 should now see committed data
        const result2 = await client2.query('SELECT COUNT(*) FROM test_isolation');
        
        await client2.query('COMMIT');
        
        results.push({
          test: 'Transaction Isolation READ COMMITTED',
          passed: result1.rows[0].count === '0' && result2.rows[0].count === '1',
          message: 'READ COMMITTED isolation working correctly'
        });
        
      } finally {
        client1.release();
        client2.release();
      }
      
      // Cleanup
      await this.testPool.query('DROP TABLE IF EXISTS test_isolation');
      
    } catch (error) {
      results.push({
        test: 'Transaction Isolation',
        passed: false,
        message: `Isolation test failed: ${error.message}`
      });
    }
    
    return results;
  }

  /**
   * Test database error handling
   */
  async testDatabaseErrorHandling() {
    const results = [];
    
    try {
      // Test 1: Syntax error
      try {
        await this.testPool.query('INVALID SQL SYNTAX');
        results.push({
          test: 'SQL Syntax Error Handling',
          passed: false,
          message: 'Invalid SQL should have thrown an error'
        });
      } catch (error) {
        results.push({
          test: 'SQL Syntax Error Handling',
          passed: error.code === '42601', // PostgreSQL syntax error code
          message: `Correctly caught syntax error: ${error.code}`
        });
      }
      
      // Test 2: Constraint violation
      await this.testPool.query(`
        CREATE TABLE IF NOT EXISTS test_constraints (
          id SERIAL PRIMARY KEY,
          unique_field TEXT UNIQUE
        )
      `);
      
      // Insert first record
      await this.testPool.query('DELETE FROM test_constraints');
      await this.testPool.query('INSERT INTO test_constraints (unique_field) VALUES ($1)', ['unique_value']);
      
      // Try to insert duplicate
      try {
        await this.testPool.query('INSERT INTO test_constraints (unique_field) VALUES ($1)', ['unique_value']);
        results.push({
          test: 'Unique Constraint Error Handling',
          passed: false,
          message: 'Duplicate insert should have failed'
        });
      } catch (error) {
        results.push({
          test: 'Unique Constraint Error Handling',
          passed: error.code === '23505', // PostgreSQL unique violation code
          message: `Correctly caught unique violation: ${error.code}`
        });
      }
      
      // Test 3: Connection timeout
      const shortTimeoutPool = new Pool({
        ...config.database,
        database: `${config.database.name}_test`,
        connectionTimeoutMillis: 100 // Very short timeout
      });
      
      try {
        // Try to get multiple connections quickly
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(shortTimeoutPool.connect());
        }
        
        await Promise.all(promises);
        results.push({
          test: 'Connection Timeout Handling',
          passed: false,
          message: 'Should have timed out with short timeout'
        });
      } catch (error) {
        results.push({
          test: 'Connection Timeout Handling',
          passed: error.message.includes('timeout'),
          message: `Correctly handled connection timeout: ${error.message}`
        });
      } finally {
        await shortTimeoutPool.end();
      }
      
      // Cleanup
      await this.testPool.query('DROP TABLE IF EXISTS test_constraints');
      
    } catch (error) {
      results.push({
        test: 'Database Error Handling',
        passed: false,
        message: `Error handling test failed: ${error.message}`
      });
    }
    
    return results;
  }

  /**
   * Test advanced SQL injection scenarios
   */
  async testAdvancedSQLInjection() {
    const results = [];
    
    try {
      // Create test table with sensitive data
      await this.testPool.query(`
        CREATE TABLE IF NOT EXISTS test_sensitive (
          id SERIAL PRIMARY KEY,
          username TEXT,
          secret TEXT
        )
      `);
      
      await this.testPool.query('DELETE FROM test_sensitive');
      await this.testPool.query(`
        INSERT INTO test_sensitive (username, secret) VALUES 
        ('admin', 'super_secret'),
        ('user1', 'user_secret')
      `);
      
      const injectionPayloads = [
        "'; DROP TABLE test_sensitive; --",
        "' OR '1'='1",
        "' UNION SELECT username, secret FROM test_sensitive --",
        "'; INSERT INTO test_sensitive (username, secret) VALUES ('hacker', 'injected'); --",
        "' OR 1=1; UPDATE test_sensitive SET secret='hacked' WHERE username='admin'; --"
      ];
      
      let allProtected = true;
      
      for (const payload of injectionPayloads) {
        try {
          // Use parameterized query (should be safe)
          const result = await this.testPool.query(
            'SELECT username FROM test_sensitive WHERE username = $1',
            [payload]
          );
          
          // Should return no results (payload treated as literal string)
          if (result.rows.length === 0) {
            // Good - injection was prevented
            continue;
          } else {
            allProtected = false;
            break;
          }
        } catch (error) {
          // If parameterized query throws error, that's also concerning
          allProtected = false;
          break;
        }
      }
      
      // Verify original data is intact
      const originalData = await this.testPool.query('SELECT COUNT(*) FROM test_sensitive');
      const adminSecret = await this.testPool.query('SELECT secret FROM test_sensitive WHERE username = $1', ['admin']);
      
      results.push({
        test: 'Advanced SQL Injection Protection',
        passed: allProtected && originalData.rows[0].count === '2' && adminSecret.rows[0].secret === 'super_secret',
        message: allProtected ? 'All injection attempts were prevented' : 'Some injection attempts may have succeeded'
      });
      
      // Cleanup
      await this.testPool.query('DROP TABLE IF EXISTS test_sensitive');
      
    } catch (error) {
      results.push({
        test: 'Advanced SQL Injection Protection',
        passed: false,
        message: `SQL injection test failed: ${error.message}`
      });
    }
    
    return results;
  }

  /**
   * Test database performance under load
   */
  async testDatabasePerformance() {
    const results = [];
    
    try {
      // Create test table
      await this.testPool.query(`
        CREATE TABLE IF NOT EXISTS test_performance (
          id SERIAL PRIMARY KEY,
          data TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await this.testPool.query('DELETE FROM test_performance');
      
      // Test 1: Bulk insert performance
      const bulkInsertStart = Date.now();
      const insertPromises = [];
      
      for (let i = 0; i < 100; i++) {
        insertPromises.push(
          this.testPool.query('INSERT INTO test_performance (data) VALUES ($1)', [`test_data_${i}`])
        );
      }
      
      await Promise.all(insertPromises);
      const bulkInsertTime = Date.now() - bulkInsertStart;
      
      results.push({
        test: 'Bulk Insert Performance',
        passed: bulkInsertTime < 5000, // Should complete within 5 seconds
        message: `100 inserts completed in ${bulkInsertTime}ms`
      });
      
      // Test 2: Concurrent query performance
      const concurrentQueryStart = Date.now();
      const queryPromises = [];
      
      for (let i = 0; i < 50; i++) {
        queryPromises.push(
          this.testPool.query('SELECT COUNT(*) FROM test_performance WHERE data LIKE $1', [`%${i}%`])
        );
      }
      
      await Promise.all(queryPromises);
      const concurrentQueryTime = Date.now() - concurrentQueryStart;
      
      results.push({
        test: 'Concurrent Query Performance',
        passed: concurrentQueryTime < 3000, // Should complete within 3 seconds
        message: `50 concurrent queries completed in ${concurrentQueryTime}ms`
      });
      
      // Cleanup
      await this.testPool.query('DROP TABLE IF EXISTS test_performance');
      
    } catch (error) {
      results.push({
        test: 'Database Performance',
        passed: false,
        message: `Performance test failed: ${error.message}`
      });
    }
    
    return results;
  }
}

module.exports = DatabaseTestUtils;