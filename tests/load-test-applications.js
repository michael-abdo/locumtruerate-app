#!/usr/bin/env node

/**
 * Load Testing Script for Application Endpoints
 * Tests concurrent usage scenarios for Day 7 application system
 */

const http = require('http');
const https = require('https');

// Test Configuration
const CONFIG = {
  baseUrl: 'http://localhost:4000',
  concurrent: 50,         // Number of concurrent requests
  totalRequests: 500,     // Total requests per endpoint
  timeout: 10000,         // Request timeout in ms
  
  // Test data
  testUsers: [
    { id: 8, token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsImlhdCI6MTc1MzQwOTg5MDI1OSwiZXhwIjoxNzUzNDA5OTc2NjU5fQ.Xk53uEUnLCPOW7Xx0B18YmYNXHY2eVagrVWs6WJ9Tyo' },
    { id: 6, token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc1MzQxMDEyMjQyMSwiZXhwIjoxNzUzNDEwMjA4ODIxfQ.bvm_PCrK4zrqeRoNtYqz3lrafHuTOPYvIMVOKSQW-pM' }
  ],
  testJobs: [1, 2, 3]
};

// Utility Functions
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          responseTime: Date.now() - startTime
        });
      });
    });

    const startTime = Date.now();
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.setTimeout(CONFIG.timeout);

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateTestApplication() {
  const coverLetters = [
    'I am very interested in this position and have extensive experience.',
    'This role aligns perfectly with my career goals and expertise.',
    'I would be excited to contribute to your team with my skills.',
    'My background makes me an ideal candidate for this opportunity.',
    'I am passionate about this field and eager to join your organization.'
  ];
  
  return {
    jobId: getRandomElement(CONFIG.testJobs),
    coverLetter: getRandomElement(coverLetters),
    expectedRate: Math.floor(Math.random() * 200) + 250, // 250-450
    availableDate: '2025-09-01',
    notes: 'Available for various shifts and schedules'
  };
}

// Test Functions
async function testApplicationCreation() {
  console.log('🔥 Testing Application Creation Load...');
  
  const results = {
    total: 0,
    success: 0,
    errors: 0,
    responseTimes: [],
    errorTypes: {}
  };

  const promises = [];
  
  for (let i = 0; i < CONFIG.totalRequests; i++) {
    const promise = (async () => {
      try {
        const user = getRandomElement(CONFIG.testUsers);
        const applicationData = generateTestApplication();
        
        const options = {
          hostname: 'localhost',
          port: 4000,
          path: '/api/v1/applications',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        };

        const response = await makeRequest(options, applicationData);
        results.total++;
        results.responseTimes.push(response.responseTime);
        
        if (response.statusCode === 201 || response.statusCode === 400) {
          // 201 = success, 400 = expected for duplicates
          results.success++;
        } else {
          results.errors++;
          const errorType = `HTTP_${response.statusCode}`;
          results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
        }
        
      } catch (error) {
        results.total++;
        results.errors++;
        const errorType = error.code || 'UNKNOWN_ERROR';
        results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
      }
    })();
    
    promises.push(promise);
    
    // Control concurrency
    if (promises.length >= CONFIG.concurrent) {
      await Promise.all(promises.splice(0, CONFIG.concurrent));
    }
  }
  
  // Wait for remaining requests
  await Promise.all(promises);
  
  return results;
}

async function testGetMyApplications() {
  console.log('📋 Testing Get My Applications Load...');
  
  const results = {
    total: 0,
    success: 0,
    errors: 0,
    responseTimes: [],
    errorTypes: {}
  };

  const promises = [];
  
  for (let i = 0; i < CONFIG.totalRequests; i++) {
    const promise = (async () => {
      try {
        const user = getRandomElement(CONFIG.testUsers);
        const page = Math.floor(Math.random() * 5) + 1; // Random page 1-5
        
        const options = {
          hostname: 'localhost',
          port: 4000,
          path: `/api/v1/applications/my?page=${page}&limit=20`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        };

        const response = await makeRequest(options);
        results.total++;
        results.responseTimes.push(response.responseTime);
        
        if (response.statusCode === 200) {
          results.success++;
        } else {
          results.errors++;
          const errorType = `HTTP_${response.statusCode}`;
          results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
        }
        
      } catch (error) {
        results.total++;
        results.errors++;
        const errorType = error.code || 'UNKNOWN_ERROR';
        results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
      }
    })();
    
    promises.push(promise);
    
    // Control concurrency
    if (promises.length >= CONFIG.concurrent) {
      await Promise.all(promises.splice(0, CONFIG.concurrent));
    }
  }
  
  // Wait for remaining requests
  await Promise.all(promises);
  
  return results;
}

async function testGetJobApplications() {
  console.log('👥 Testing Get Job Applications Load (Recruiters)...');
  
  const results = {
    total: 0,
    success: 0,
    errors: 0,
    responseTimes: [],
    errorTypes: {}
  };

  const promises = [];
  
  for (let i = 0; i < CONFIG.totalRequests; i++) {
    const promise = (async () => {
      try {
        // Use recruiter token (user 6)
        const recruiterToken = CONFIG.testUsers[1].token;
        const jobId = getRandomElement(CONFIG.testJobs);
        
        const options = {
          hostname: 'localhost',
          port: 4000,
          path: `/api/v1/applications/for-job/${jobId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${recruiterToken}`
          }
        };

        const response = await makeRequest(options);
        results.total++;
        results.responseTimes.push(response.responseTime);
        
        if (response.statusCode === 200 || response.statusCode === 403) {
          // 200 = success, 403 = expected for non-owned jobs
          results.success++;
        } else {
          results.errors++;
          const errorType = `HTTP_${response.statusCode}`;
          results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
        }
        
      } catch (error) {
        results.total++;
        results.errors++;
        const errorType = error.code || 'UNKNOWN_ERROR';
        results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
      }
    })();
    
    promises.push(promise);
    
    // Control concurrency
    if (promises.length >= CONFIG.concurrent) {
      await Promise.all(promises.splice(0, CONFIG.concurrent));
    }
  }
  
  // Wait for remaining requests
  await Promise.all(promises);
  
  return results;
}

// Results Analysis
function analyzeResults(testName, results) {
  const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  const minResponseTime = Math.min(...results.responseTimes);
  const maxResponseTime = Math.max(...results.responseTimes);
  const p95ResponseTime = results.responseTimes.sort((a, b) => a - b)[Math.floor(results.responseTimes.length * 0.95)];
  
  const successRate = (results.success / results.total * 100).toFixed(2);
  const errorRate = (results.errors / results.total * 100).toFixed(2);
  
  console.log(`\n📊 ${testName} Results:`);
  console.log(`   Total Requests: ${results.total}`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(`   Error Rate: ${errorRate}%`);
  console.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   Min Response Time: ${minResponseTime}ms`);
  console.log(`   Max Response Time: ${maxResponseTime}ms`);
  console.log(`   95th Percentile: ${p95ResponseTime}ms`);
  
  if (Object.keys(results.errorTypes).length > 0) {
    console.log(`   Error Breakdown:`);
    Object.entries(results.errorTypes).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
  }
  
  // Performance Assessment
  if (avgResponseTime > 1000) {
    console.log(`   ⚠️  WARNING: Average response time exceeds 1000ms`);
  } else if (avgResponseTime > 500) {
    console.log(`   ⚡ MODERATE: Response times acceptable but could be optimized`);
  } else {
    console.log(`   ✅ EXCELLENT: Response times are optimal`);
  }
  
  if (parseFloat(successRate) < 95) {
    console.log(`   ❌ CRITICAL: Success rate below 95%`);
  } else if (parseFloat(successRate) < 99) {
    console.log(`   ⚠️  WARNING: Success rate below 99%`);
  } else {
    console.log(`   ✅ EXCELLENT: High success rate`);
  }
}

// Main Test Runner
async function runLoadTests() {
  console.log('🚀 Starting Application Endpoints Load Testing');
  console.log(`   Concurrent Users: ${CONFIG.concurrent}`);
  console.log(`   Total Requests per Test: ${CONFIG.totalRequests}`);
  console.log(`   Timeout: ${CONFIG.timeout}ms`);
  console.log(`   Target: ${CONFIG.baseUrl}`);
  console.log('='.repeat(60));

  try {
    // Test 1: Application Creation
    const creationResults = await testApplicationCreation();
    analyzeResults('Application Creation', creationResults);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Get My Applications
    const myAppsResults = await testGetMyApplications();
    analyzeResults('Get My Applications', myAppsResults);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Get Job Applications
    const jobAppsResults = await testGetJobApplications();
    analyzeResults('Get Job Applications', jobAppsResults);
    
    // Overall Summary
    console.log('\n🎯 OVERALL PERFORMANCE SUMMARY');
    console.log('='.repeat(60));
    
    const allResults = [creationResults, myAppsResults, jobAppsResults];
    const totalRequests = allResults.reduce((sum, r) => sum + r.total, 0);
    const totalSuccess = allResults.reduce((sum, r) => sum + r.success, 0);
    const allResponseTimes = allResults.reduce((acc, r) => acc.concat(r.responseTimes), []);
    
    const overallSuccessRate = (totalSuccess / totalRequests * 100).toFixed(2);
    const overallAvgResponseTime = (allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length).toFixed(2);
    
    console.log(`📈 Overall Success Rate: ${overallSuccessRate}%`);
    console.log(`⚡ Overall Avg Response Time: ${overallAvgResponseTime}ms`);
    console.log(`📊 Total Requests Processed: ${totalRequests}`);
    
    if (parseFloat(overallSuccessRate) >= 95 && parseFloat(overallAvgResponseTime) <= 500) {
      console.log(`✅ SYSTEM READY: Application endpoints can handle production load`);
    } else {
      console.log(`⚠️  OPTIMIZATION NEEDED: Review performance bottlenecks`);
    }
    
  } catch (error) {
    console.error('❌ Load testing failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runLoadTests().then(() => {
    console.log('\n🏁 Load testing completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Load testing failed:', error);
    process.exit(1);
  });
}

module.exports = { runLoadTests, CONFIG };