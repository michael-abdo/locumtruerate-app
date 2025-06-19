const puppeteer = require('puppeteer');

async function validateMobileMenuBehavior() {
  console.log('🧪 Mobile Menu Animation Validation Test');
  console.log('=========================================\n');

  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for visual validation
    slowMo: 50 // Slow down actions to see behavior
  });
  
  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewport({ width: 375, height: 667 }); // iPhone 6/7/8 size
  
  try {
    console.log('1️⃣ Opening homepage in mobile view...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    
    console.log('2️⃣ Taking screenshot of initial state...');
    await page.screenshot({ 
      path: 'testing/screenshots/mobile-menu-test/1-initial.png',
      fullPage: false 
    });
    
    console.log('3️⃣ Opening mobile menu...');
    // Click hamburger menu
    await page.click('button[aria-label*="menu"]');
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for open animation
    
    console.log('4️⃣ Taking screenshot with menu open...');
    await page.screenshot({ 
      path: 'testing/screenshots/mobile-menu-test/2-menu-open.png',
      fullPage: false 
    });
    
    console.log('5️⃣ Clicking navigation item...');
    const startTime = Date.now();
    
    // Click "Dashboard" in mobile menu
    await page.click('a[href="/dashboard"]');
    
    // Measure how long until menu is gone
    await page.waitForFunction(
      () => !document.querySelector('#mobile-menu'),
      { timeout: 1000 }
    );
    
    const closeTime = Date.now() - startTime;
    
    console.log('6️⃣ Taking screenshot after navigation...');
    await page.screenshot({ 
      path: 'testing/screenshots/mobile-menu-test/3-after-nav.png',
      fullPage: false 
    });
    
    console.log('\n✅ VALIDATION RESULTS:');
    console.log(`   Menu close time: ${closeTime}ms`);
    console.log(`   Expected: <100ms (with 0.05s animation)`);
    console.log(`   Status: ${closeTime < 100 ? 'PASS ✅' : 'FAIL ❌'}`);
    
    // Check if we're on dashboard
    const url = page.url();
    console.log(`   Navigation successful: ${url.includes('/dashboard') ? 'YES ✅' : 'NO ❌'}`);
    
    // Check for double nav bar
    const navCount = await page.$$eval('nav', navs => navs.length);
    console.log(`   Navigation elements visible: ${navCount}`);
    console.log(`   Double nav bar issue: ${navCount > 1 ? 'PRESENT ❌' : 'RESOLVED ✅'}`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    console.log('\n7️⃣ Test complete. Browser will close in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

// Create screenshot directory
const fs = require('fs');
const dir = 'testing/screenshots/mobile-menu-test';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

validateMobileMenuBehavior();