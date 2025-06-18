const puppeteer = require('puppeteer');
const fs = require('fs');

// Validation script adapted from debug-browser.js for Week 2 Demo
async function validateWeek2Demo() {
  let browser;
  const results = {
    timestamp: new Date().toISOString(),
    summary: { total: 0, passed: 0, failed: 0 },
    tests: [],
    errors: [],
    performance: {}
  };

  try {
    console.log('🚀 Starting Week 2 Demo Validation...\n');
    
    // Check if server is running
    console.log('⏳ Checking if demo server is running on port 3000...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set up error capturing
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          type: 'console',
          text: msg.text(),
          location: msg.location()
        });
      }
    });
    
    page.on('pageerror', error => {
      errors.push({
        type: 'page',
        message: error.message,
        stack: error.stack
      });
    });
    
    page.on('requestfailed', request => {
      errors.push({
        type: 'request',
        url: request.url(),
        reason: request.failure()?.errorText
      });
    });

    // Test configuration
    const baseUrl = 'http://localhost:3000';
    const pagesToTest = [
      { path: '/', name: 'Homepage', requiredContent: ['Week 2 Achievements', 'Legal Compliance', 'Support System'] },
      { path: '/legal/privacy', name: 'Privacy Policy', requiredContent: ['Privacy Policy', 'Personal Information', 'GDPR', 'Your Rights'] },
      { path: '/legal/terms', name: 'Terms of Service', requiredContent: ['Terms of Service', 'Healthcare', 'User Responsibilities'] },
      { path: '/legal/cookies', name: 'Cookie Policy', requiredContent: ['Cookie Policy', 'Essential Cookies', 'Analytics'] },
      { path: '/legal/gdpr', name: 'GDPR Compliance', requiredContent: ['GDPR Compliance', 'Data Protection', 'Your Rights'] },
      { path: '/support', name: 'Support Page', requiredContent: ['Support Center', 'How can we help'] }
    ];

    // Test 1: Page Load Tests
    console.log('📄 Testing page loads...\n');
    for (const pageTest of pagesToTest) {
      const testResult = {
        name: `Load ${pageTest.name}`,
        url: baseUrl + pageTest.path,
        status: 'pending',
        details: {}
      };
      
      try {
        console.log(`Testing ${pageTest.name} (${pageTest.path})...`);
        const startTime = Date.now();
        
        const response = await page.goto(baseUrl + pageTest.path, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        const loadTime = Date.now() - startTime;
        testResult.details.loadTime = loadTime;
        
        // Check response status
        if (response.status() !== 200) {
          throw new Error(`HTTP ${response.status()}`);
        }
        
        // Wait for content to render
        await page.waitForTimeout(2000);
        
        // Get page content
        const content = await page.evaluate(() => document.body.innerText);
        
        // Check for required content
        const missingContent = [];
        for (const required of pageTest.requiredContent) {
          if (!content.includes(required)) {
            missingContent.push(required);
          }
        }
        
        if (missingContent.length > 0) {
          testResult.status = 'failed';
          testResult.error = `Missing content: ${missingContent.join(', ')}`;
        } else {
          testResult.status = 'passed';
          console.log(`✅ ${pageTest.name} - Loaded in ${loadTime}ms`);
        }
        
        // Check for JavaScript errors
        if (errors.length > 0) {
          testResult.warnings = errors;
          errors.length = 0; // Clear for next test
        }
        
      } catch (error) {
        testResult.status = 'failed';
        testResult.error = error.message;
        console.log(`❌ ${pageTest.name} - ${error.message}`);
      }
      
      results.tests.push(testResult);
    }

    // Test 2: Interactive Elements
    console.log('\n🖱️ Testing interactive elements...\n');
    
    // Test floating support button
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    const supportButtonTest = {
      name: 'Floating Support Button',
      status: 'pending'
    };
    
    try {
      // Look for floating button
      const buttonExists = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => 
          btn.textContent.includes('Support') || 
          btn.textContent.includes('Help') ||
          btn.className.includes('floating')
        );
      });
      
      if (buttonExists) {
        supportButtonTest.status = 'passed';
        console.log('✅ Floating support button found');
      } else {
        supportButtonTest.status = 'failed';
        supportButtonTest.error = 'Support button not found';
        console.log('❌ Floating support button not found');
      }
    } catch (error) {
      supportButtonTest.status = 'failed';
      supportButtonTest.error = error.message;
    }
    
    results.tests.push(supportButtonTest);

    // Test 3: Mobile Responsiveness
    console.log('\n📱 Testing mobile responsiveness...\n');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      const responsiveTest = {
        name: `Responsive Layout - ${viewport.name}`,
        viewport: viewport,
        status: 'pending'
      };
      
      try {
        await page.setViewport(viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(1000);
        
        // Check if content is visible
        const isVisible = await page.evaluate(() => {
          const main = document.querySelector('main');
          return main && main.offsetHeight > 100;
        });
        
        if (isVisible) {
          responsiveTest.status = 'passed';
          console.log(`✅ ${viewport.name} layout working`);
        } else {
          responsiveTest.status = 'failed';
          responsiveTest.error = 'Content not visible';
          console.log(`❌ ${viewport.name} layout issues`);
        }
      } catch (error) {
        responsiveTest.status = 'failed';
        responsiveTest.error = error.message;
      }
      
      results.tests.push(responsiveTest);
    }

    // Test 4: Performance Metrics
    console.log('\n⚡ Measuring performance...\n');
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      
      // Calculate total JS size
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const jsSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        jsSize: jsSize,
        totalResources: resources.length
      };
    });
    
    results.performance = performanceMetrics;
    console.log(`DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`Page Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`JavaScript Size: ${(performanceMetrics.jsSize / 1024).toFixed(2)}KB`);
    console.log(`Total Resources: ${performanceMetrics.totalResources}`);

    // Test 5: Cookie Policy Functionality
    console.log('\n🍪 Testing cookie preferences...\n');
    
    const cookieTest = {
      name: 'Cookie Preferences',
      status: 'pending'
    };
    
    try {
      await page.goto(baseUrl + '/legal/cookies', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
      
      // Test checkbox interaction
      const checkboxes = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="checkbox"]');
        return inputs.length;
      });
      
      if (checkboxes > 0) {
        cookieTest.status = 'passed';
        cookieTest.details = { checkboxCount: checkboxes };
        console.log(`✅ Cookie preferences - ${checkboxes} options found`);
      } else {
        cookieTest.status = 'failed';
        cookieTest.error = 'No cookie preference checkboxes found';
        console.log('❌ Cookie preferences - No checkboxes found');
      }
    } catch (error) {
      cookieTest.status = 'failed';
      cookieTest.error = error.message;
    }
    
    results.tests.push(cookieTest);

    // Calculate summary
    results.summary.total = results.tests.length;
    results.summary.passed = results.tests.filter(t => t.status === 'passed').length;
    results.summary.failed = results.tests.filter(t => t.status === 'failed').length;
    results.summary.score = Math.round((results.summary.passed / results.summary.total) * 100);

    // Save results
    fs.writeFileSync(
      'VALIDATION_RESULTS.json',
      JSON.stringify(results, null, 2)
    );

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed} ✅`);
    console.log(`Failed: ${results.summary.failed} ❌`);
    console.log(`Score: ${results.summary.score}%`);
    console.log('\nDetailed results saved to VALIDATION_RESULTS.json');

    // Print failures
    if (results.summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.tests
        .filter(t => t.status === 'failed')
        .forEach(t => {
          console.log(`- ${t.name}: ${t.error}`);
        });
    }

  } catch (error) {
    console.error('Fatal error:', error);
    results.errors.push({
      type: 'fatal',
      message: error.message,
      stack: error.stack
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return results;
}

// Check if puppeteer is installed
try {
  require.resolve('puppeteer');
} catch (error) {
  console.log('📦 Puppeteer not found. Installing...');
  console.log('Run: npm install puppeteer');
  console.log('Then run this script again.');
  process.exit(1);
}

// Run validation
console.log('Week 2 Demo Validation Tool');
console.log('==========================\n');
console.log('Make sure the demo server is running:');
console.log('  cd repo-root/demo/week2-showcase');
console.log('  npm run dev\n');
console.log('Then run this script in another terminal.\n');

validateWeek2Demo()
  .then(results => {
    if (results.summary.failed > 0) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });