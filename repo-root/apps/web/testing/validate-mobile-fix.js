const puppeteer = require('puppeteer');
const fs = require('fs');

async function validateMobileFix() {
  console.log('🔍 Validating Mobile Menu Fix');
  console.log('==============================\n');
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Mobile viewport
  await page.setViewport({ width: 390, height: 844 });
  
  try {
    // Test 1: Check animation timing in code
    console.log('📝 TEST 1: Verify Animation Timing Change');
    await page.goto('http://localhost:3000');
    
    const animationTiming = await page.evaluate(() => {
      // Find the header component source
      const scripts = Array.from(document.querySelectorAll('script'));
      const headerScript = scripts.find(s => s.innerHTML && s.innerHTML.includes('exit:{duration:'));
      
      if (headerScript && headerScript.innerHTML.includes('exit:{duration:0.05}')) {
        return { success: true, timing: '0.05s' };
      }
      return { success: false, timing: 'unknown' };
    });
    
    console.log(`   Exit animation timing: ${animationTiming.timing}`);
    console.log(`   Status: ${animationTiming.success ? 'PASS ✅' : 'FAIL ❌'}\n`);
    
    // Test 2: Mobile menu interaction
    console.log('📱 TEST 2: Mobile Menu Behavior');
    
    // Open menu
    const menuButton = await page.$('button[aria-label*="menu"]');
    if (!menuButton) {
      console.log('   ❌ No mobile menu button found');
      return;
    }
    
    await menuButton.click();
    await page.waitForTimeout(500); // Wait for menu to open
    
    // Check if menu is open
    const menuOpen = await page.$eval('#mobile-menu', el => {
      return window.getComputedStyle(el).height !== '0px';
    }).catch(() => false);
    
    console.log(`   Menu opened: ${menuOpen ? 'YES ✅' : 'NO ❌'}`);
    
    // Click navigation
    const startTime = Date.now();
    await page.click('#mobile-menu a[href="/dashboard"]');
    
    // Wait for menu to close
    try {
      await page.waitForSelector('#mobile-menu', { 
        hidden: true, 
        timeout: 200 
      });
      const closeTime = Date.now() - startTime;
      console.log(`   Menu close time: ${closeTime}ms`);
      console.log(`   Fast close (<100ms): ${closeTime < 100 ? 'YES ✅' : 'NO ❌'}`);
    } catch (e) {
      console.log('   ❌ Menu did not close quickly');
    }
    
    // Test 3: Check for double nav
    console.log('\n🔎 TEST 3: Double Navigation Check');
    const navElements = await page.$$('nav');
    console.log(`   Navigation elements found: ${navElements.length}`);
    console.log(`   Double nav issue: ${navElements.length > 1 ? 'PRESENT ❌' : 'RESOLVED ✅'}`);
    
  } catch (error) {
    console.error('\n❌ Error during validation:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Validation complete');
  }
}

// Run validation
validateMobileFix().catch(console.error);