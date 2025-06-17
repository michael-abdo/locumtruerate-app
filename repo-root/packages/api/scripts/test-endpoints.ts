#!/usr/bin/env ts-node

/**
 * API Endpoint Testing Script
 * Tests all API endpoints for basic functionality
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../src/index';
import superjson from 'superjson';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/trpc';

// Create tRPC client
const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
      headers: {
        'X-API-Version': '1.0.0',
      },
      transformer: superjson,
    }),
  ],
});

// Test results
const testResults: Array<{
  endpoint: string;
  method: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  duration?: number;
}> = [];

// Helper function to run a test
async function runTest(
  name: string,
  method: string,
  testFn: () => Promise<any>
) {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    testResults.push({
      endpoint: name,
      method,
      status: 'pass',
      duration,
    });
    console.log(`✅ ${method} ${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    testResults.push({
      endpoint: name,
      method,
      status: 'fail',
      error: error.message,
      duration,
    });
    console.log(`❌ ${method} ${name} - ${error.message}`);
  }
}

// Run all endpoint tests
async function runAllTests() {
  console.log('🧪 Running API Endpoint Tests...\n');

  // Version endpoint
  await runTest('/version', 'GET', async () => {
    const result = await client.version.get.query();
    if (!result.current) throw new Error('No version returned');
  });

  // Auth endpoints (unauthenticated)
  await runTest('/auth/signup', 'POST', async () => {
    try {
      await client.auth.signup.mutate({
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'professional',
      });
    } catch (error: any) {
      // User might already exist, that's okay for this test
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  });

  await runTest('/auth/login', 'POST', async () => {
    // Skip - requires valid credentials
    testResults[testResults.length - 1].status = 'skip';
    console.log('⏭️  Skipped - requires valid credentials');
  });

  // Jobs endpoints (public)
  await runTest('/jobs', 'GET', async () => {
    const result = await client.jobs.list.query({
      page: 1,
      limit: 5,
    });
    if (!Array.isArray(result.jobs)) {
      throw new Error('Jobs list not returned');
    }
  });

  // Search endpoint
  await runTest('/search/jobs', 'POST', async () => {
    const result = await client.search.jobs.query({
      query: 'physician',
      page: 1,
      limit: 5,
    });
    if (!Array.isArray(result.results)) {
      throw new Error('Search results not returned');
    }
  });

  // Authenticated endpoints - skip without auth token
  const authenticatedEndpoints = [
    { name: '/auth/me', method: 'GET' },
    { name: '/jobs', method: 'POST' },
    { name: '/applications', method: 'GET' },
    { name: '/applications', method: 'POST' },
    { name: '/analytics/dashboard', method: 'GET' },
    { name: '/support/tickets', method: 'GET' },
    { name: '/admin/users', method: 'GET' },
  ];

  for (const endpoint of authenticatedEndpoints) {
    testResults.push({
      endpoint: endpoint.name,
      method: endpoint.method,
      status: 'skip',
    });
    console.log(`⏭️  ${endpoint.method} ${endpoint.name} - Skipped (requires auth)`);
  }

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const skipped = testResults.filter(r => r.status === 'skip').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📋 Total: ${testResults.length}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`  - ${r.method} ${r.endpoint}: ${r.error}`);
      });
  }

  // Save detailed results
  const fs = require('fs');
  const path = require('path');
  const resultsPath = path.join(__dirname, '../test-results.json');
  fs.writeFileSync(
    resultsPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        apiUrl: API_URL,
        results: testResults,
        summary: { passed, failed, skipped, total: testResults.length },
      },
      null,
      2
    )
  );
  console.log(`\n💾 Detailed results saved to: ${resultsPath}`);

  // Exit with error if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});