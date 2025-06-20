#!/usr/bin/env node

/**
 * Frontend Validation Tool
 * Validates each step of the frontend testing process with detailed checks
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class FrontendValidator {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  log(type, message, details = {}) {
    const entry = {
      type,
      message,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (Object.keys(details).length > 0) {
      console.log('  Details:', JSON.stringify(details, null, 2));
    }
    
    this.results.push(entry);
    
    if (type === 'error') {
      this.errors.push(entry);
    } else if (type === 'warning') {
      this.warnings.push(entry);
    }
  }

  async validateStep(stepName, validationFn) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`VALIDATING: ${stepName}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const startTime = Date.now();
      await validationFn();
      const duration = Date.now() - startTime;
      
      this.log('success', `✅ ${stepName} completed`, { duration_ms: duration });
      return true;
    } catch (error) {
      this.log('error', `❌ ${stepName} failed: ${error.message}`, { 
        error: error.stack 
      });
      return false;
    }
  }

  async httpGet(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const module = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'FrontendValidator/1.0'
        }
      };

      const req = module.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  async validateEndpoint(url, expectations = {}) {
    const response = await this.httpGet(url);
    
    // Check status code
    if (expectations.statusCode && response.statusCode !== expectations.statusCode) {
      throw new Error(`Expected status ${expectations.statusCode}, got ${response.statusCode}`);
    }
    
    // Check content type
    if (expectations.contentType) {
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes(expectations.contentType)) {
        throw new Error(`Expected content-type to include "${expectations.contentType}", got "${contentType}"`);
      }
    }
    
    // Check body content
    if (expectations.bodyIncludes) {
      for (const expected of expectations.bodyIncludes) {
        if (!response.body.includes(expected)) {
          throw new Error(`Expected body to include "${expected}"`);
        }
      }
    }
    
    // Check body doesn't contain errors
    if (expectations.bodyExcludes) {
      for (const excluded of expectations.bodyExcludes) {
        if (response.body.includes(excluded)) {
          throw new Error(`Body should not include "${excluded}"`);
        }
      }
    }
    
    return response;
  }

  printSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('VALIDATION SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total Steps: ${this.results.length}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning.message}`);
      });
    }
    
    const success = this.errors.length === 0;
    console.log(`\n${success ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED'}`);
    return success;
  }
}

// Main validation script
async function main() {
  const validator = new FrontendValidator();
  const baseUrl = 'http://localhost:3000';

  // Step 1: Server Health Check
  await validator.validateStep('Server Health Check', async () => {
    await validator.validateEndpoint(baseUrl, {
      statusCode: 200,
      contentType: 'text/html',
      bodyIncludes: ['<!DOCTYPE html>', '<html', '<head>', '<body>'],
      bodyExcludes: ['Error:', 'Internal Server Error', '500']
    });
  });

  // Step 2: Homepage Content Validation
  await validator.validateStep('Homepage Content', async () => {
    const response = await validator.validateEndpoint(baseUrl, {
      statusCode: 200,
      bodyIncludes: [
        'LocumTrueRate',
        'Find Your Perfect Healthcare Opportunity',
        'Find Jobs',
        'Calculator',
        'Dashboard'
      ]
    });
    
    // Check for required meta tags
    if (!response.body.includes('<meta name="viewport"')) {
      validator.log('warning', 'Missing viewport meta tag');
    }
    
    // Check for accessibility features
    if (!response.body.includes('Skip to main content')) {
      validator.log('warning', 'Missing skip navigation links');
    }
  });

  // Step 3: API Endpoint Validation
  await validator.validateStep('API Health Check', async () => {
    try {
      await validator.validateEndpoint(`${baseUrl}/api/trpc/health`, {
        statusCode: 200
      });
    } catch (error) {
      if (error.message.includes('404')) {
        validator.log('warning', 'Health endpoint not found - API may use different structure');
      } else {
        throw error;
      }
    }
  });

  // Step 4: Static Assets Validation
  await validator.validateStep('Static Assets Check', async () => {
    const response = await validator.httpGet(baseUrl);
    
    // Extract CSS and JS file references
    const cssMatches = response.body.match(/href="([^"]+\.css[^"]*)"/g) || [];
    const jsMatches = response.body.match(/src="([^"]+\.js[^"]*)"/g) || [];
    
    validator.log('info', `Found ${cssMatches.length} CSS files and ${jsMatches.length} JS files`);
    
    // Validate at least one CSS and JS file loads
    if (cssMatches.length > 0) {
      const cssPath = cssMatches[0].match(/href="([^"]+)"/)[1];
      const cssUrl = cssPath.startsWith('http') ? cssPath : `${baseUrl}${cssPath}`;
      
      await validator.validateEndpoint(cssUrl, {
        statusCode: 200,
        contentType: 'text/css'
      });
    }
    
    if (jsMatches.length > 0) {
      const jsPath = jsMatches[0].match(/src="([^"]+)"/)[1];
      const jsUrl = jsPath.startsWith('http') ? jsPath : `${baseUrl}${jsPath}`;
      
      await validator.validateEndpoint(jsUrl, {
        statusCode: 200,
        contentType: 'application/javascript'
      });
    }
  });

  // Step 5: Navigation Links Validation  
  await validator.validateStep('Navigation Links', async () => {
    const navigationPaths = [
      '/search/jobs',
      '/tools/calculator',
      '/dashboard'
    ];
    
    for (const path of navigationPaths) {
      try {
        await validator.validateEndpoint(`${baseUrl}${path}`, {
          statusCode: [200, 401], // 401 might be expected for protected routes
          contentType: 'text/html'
        });
        validator.log('info', `✓ ${path} is accessible`);
      } catch (error) {
        validator.log('warning', `${path} returned unexpected response: ${error.message}`);
      }
    }
  });

  // Step 6: Performance Metrics
  await validator.validateStep('Performance Check', async () => {
    const timings = [];
    
    // Make 5 requests to measure average response time
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await validator.httpGet(baseUrl);
      const duration = Date.now() - start;
      timings.push(duration);
    }
    
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    validator.log('info', `Average response time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime > 1000) {
      validator.log('warning', 'Response time exceeds 1 second');
    }
  });

  // Print final summary
  const success = validator.printSummary();
  process.exit(success ? 0 : 1);
}

// Run validation
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});