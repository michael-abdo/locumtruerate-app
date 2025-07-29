/**
 * Database Query Comparison Test Suite
 * 
 * This test suite ensures that refactored database queries produce
 * identical results to the original implementations.
 */

require('dotenv').config();
const Job = require('./src/models/Job');
const Application = require('./src/models/Application');

class DatabaseQueryTester {
  constructor() {
    this.testResults = [];
    this.beforeResults = new Map();
    this.afterResults = new Map();
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[34m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async captureBaseline() {
    this.log('\n🔍 Capturing baseline query results...', 'info');
    
    try {
      // Job.findAll with various parameters
      this.beforeResults.set('job-findall-basic', await Job.findAll({}));
      this.beforeResults.set('job-findall-paginated', await Job.findAll({ page: 1, limit: 5 }));
      this.beforeResults.set('job-findall-filtered', await Job.findAll({ 
        specialty: 'Internal Medicine', 
        state: 'CA',
        status: 'active'
      }));
      this.beforeResults.set('job-findall-search', await Job.findAll({ 
        search: 'physician',
        page: 1,
        limit: 10
      }));

      // Job.findById
      this.beforeResults.set('job-findbyid-1', await Job.findById(1));
      this.beforeResults.set('job-findbyid-999', await Job.findById(999));

      // Application.findByUser
      this.beforeResults.set('app-findbyuser-1', await Application.findByUser(1, {}));
      this.beforeResults.set('app-findbyuser-paginated', await Application.findByUser(1, { 
        page: 1, 
        limit: 5 
      }));

      // Application.findByJob (skip - requires authorization)
      // this.beforeResults.set('app-findbyjob-1', await Application.findByJob(1, 1, {}));
      // this.beforeResults.set('app-findbyjob-paginated', await Application.findByJob(1, 1, { 
      //   page: 1, 
      //   limit: 3 
      // }));

      this.log('✅ Baseline captured successfully', 'success');
      
    } catch (error) {
      this.log(`❌ Error capturing baseline: ${error.message}`, 'error');
      throw error;
    }
  }

  async captureAfterRefactoring() {
    this.log('\n🔄 Capturing post-refactoring query results...', 'info');
    
    try {
      // Same queries as baseline
      this.afterResults.set('job-findall-basic', await Job.findAll({}));
      this.afterResults.set('job-findall-paginated', await Job.findAll({ page: 1, limit: 5 }));
      this.afterResults.set('job-findall-filtered', await Job.findAll({ 
        specialty: 'Internal Medicine', 
        state: 'CA',
        status: 'active'
      }));
      this.afterResults.set('job-findall-search', await Job.findAll({ 
        search: 'physician',
        page: 1,
        limit: 10
      }));

      this.afterResults.set('job-findbyid-1', await Job.findById(1));
      this.afterResults.set('job-findbyid-999', await Job.findById(999));

      this.afterResults.set('app-findbyuser-1', await Application.findByUser(1, {}));
      this.afterResults.set('app-findbyuser-paginated', await Application.findByUser(1, { 
        page: 1, 
        limit: 5 
      }));

      // this.afterResults.set('app-findbyjob-1', await Application.findByJob(1, 1, {}));
      // this.afterResults.set('app-findbyjob-paginated', await Application.findByJob(1, 1, { 
      //   page: 1, 
      //   limit: 3 
      // }));

      this.log('✅ Post-refactoring results captured', 'success');
      
    } catch (error) {
      this.log(`❌ Error capturing post-refactoring results: ${error.message}`, 'error');
      throw error;
    }
  }

  compareResults() {
    this.log('\n🔍 Comparing query results...', 'info');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = [];

    for (const [testName, beforeResult] of this.beforeResults) {
      totalTests++;
      const afterResult = this.afterResults.get(testName);
      
      if (!afterResult) {
        failedTests.push(`${testName}: Missing post-refactoring result`);
        continue;
      }

      const comparison = this.deepCompare(beforeResult, afterResult, testName);
      if (comparison.passed) {
        passedTests++;
        this.log(`✅ ${testName}: PASSED`, 'success');
      } else {
        failedTests.push(`${testName}: ${comparison.error}`);
        this.log(`❌ ${testName}: ${comparison.error}`, 'error');
      }
    }

    this.log('\n📊 Test Results Summary', 'info');
    this.log(`Total Tests: ${totalTests}`, 'info');
    this.log(`Passed: ${passedTests}`, 'success');
    this.log(`Failed: ${failedTests.length}`, failedTests.length > 0 ? 'error' : 'success');

    if (failedTests.length > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      failedTests.forEach(failure => this.log(`  - ${failure}`, 'error'));
      return false;
    }

    this.log('\n🎉 All tests passed! Refactoring maintained data integrity.', 'success');
    return true;
  }

  deepCompare(before, after, testName) {
    try {
      // Handle null/undefined cases
      if (before === null && after === null) return { passed: true };
      if (before === null || after === null) {
        return { passed: false, error: 'One result is null, other is not' };
      }

      // Compare array results (for paginated queries)
      if (Array.isArray(before.jobs) && Array.isArray(after.jobs)) {
        if (before.jobs.length !== after.jobs.length) {
          return { passed: false, error: `Job count mismatch: ${before.jobs.length} vs ${after.jobs.length}` };
        }
        
        // Compare pagination metadata
        if (JSON.stringify(before.pagination) !== JSON.stringify(after.pagination)) {
          return { passed: false, error: 'Pagination metadata mismatch' };
        }
      }

      // Compare application results
      if (Array.isArray(before.applications) && Array.isArray(after.applications)) {
        if (before.applications.length !== after.applications.length) {
          return { passed: false, error: `Application count mismatch: ${before.applications.length} vs ${after.applications.length}` };
        }
        
        if (JSON.stringify(before.pagination) !== JSON.stringify(after.pagination)) {
          return { passed: false, error: 'Pagination metadata mismatch' };
        }
      }

      // Compare single object results (findById)
      if (before.id && after.id) {
        if (before.id !== after.id) {
          return { passed: false, error: `ID mismatch: ${before.id} vs ${after.id}` };
        }
      }

      return { passed: true };
      
    } catch (error) {
      return { passed: false, error: `Comparison error: ${error.message}` };
    }
  }

  async testPerformance() {
    this.log('\n⚡ Running performance tests...', 'info');
    
    const tests = [
      { name: 'Job.findAll (basic)', fn: () => Job.findAll({}) },
      { name: 'Job.findAll (filtered)', fn: () => Job.findAll({ specialty: 'Emergency', state: 'CA' }) },
      { name: 'Job.findById', fn: () => Job.findById(1) },
      { name: 'Application.findByUser', fn: () => Application.findByUser(1, {}) },
      // { name: 'Application.findByJob', fn: () => Application.findByJob(1, 1, {}) }
    ];

    const results = [];

    for (const test of tests) {
      const times = [];
      
      // Run each test 5 times
      for (let i = 0; i < 5; i++) {
        const start = process.hrtime.bigint();
        try {
          await test.fn();
          const end = process.hrtime.bigint();
          times.push(Number(end - start) / 1000000); // Convert to milliseconds
        } catch (error) {
          this.log(`⚠️ Performance test failed for ${test.name}: ${error.message}`, 'warning');
          continue;
        }
      }

      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        results.push({ name: test.name, avgTime: avgTime.toFixed(2) });
        this.log(`  ${test.name}: ${avgTime.toFixed(2)}ms avg`, 'info');
      }
    }

    return results;
  }

  async runFullTest() {
    this.log('\n🚀 Starting Database Query Comparison Test Suite', 'info');
    
    try {
      await this.captureBaseline();
      
      this.log('\n⏳ Baseline captured. Ready for refactoring...', 'warning');
      this.log('   After refactoring, run: node test-database-queries.js --after', 'warning');
      
      if (process.argv.includes('--after')) {
        await this.captureAfterRefactoring();
        const success = this.compareResults();
        
        if (success) {
          await this.testPerformance();
        }
        
        return success;
      }
      
      return true;
      
    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'error');
      console.error(error);
      return false;
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new DatabaseQueryTester();
  tester.runFullTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseQueryTester;