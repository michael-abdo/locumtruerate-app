const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function captureAnimationSequence() {
  console.log('🎬 Mobile Menu Animation Timing Validation');
  console.log('==========================================\n');

  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 0 // No slow motion - we want real timing
  });
  
  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewport({ width: 375, height: 667 });
  
  // Create screenshot directory
  const screenshotDir = 'testing/screenshots/animation-sequence';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  try {
    console.log('🔗 Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully\n');
    
    // PHASE 1: Baseline
    console.log('📸 PHASE 1: Capturing baseline state...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-baseline.png'),
      fullPage: false 
    });
    
    // PHASE 2: Open mobile menu
    console.log('📱 PHASE 2: Opening mobile menu...');
    const menuButton = await page.$('button[aria-label*="menu"]');
    if (!menuButton) {
      console.error('❌ Mobile menu button not found!');
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(b => ({ 
          ariaLabel: b.getAttribute('aria-label'), 
          text: b.innerText,
          visible: window.getComputedStyle(b).display !== 'none'
        }))
      );
      console.log('Available buttons:', buttons);
      return;
    }
    
    await menuButton.click();
    await page.waitForTimeout(300); // Wait for open animation
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-menu-open.png'),
      fullPage: false 
    });
    
    // PHASE 3: Click navigation and capture sequence
    console.log('🎯 PHASE 3: Clicking navigation item and capturing sequence...');
    
    const timestamps = [];
    const startTime = Date.now();
    
    // Start capturing screenshots before clicking
    const captureInterval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) { // Capture for 500ms
        await page.screenshot({ 
          path: path.join(screenshotDir, `03-sequence-${elapsed}ms.png`),
          fullPage: false 
        });
        timestamps.push(elapsed);
      }
    }, 25); // Capture every 25ms
    
    // Click the dashboard link
    await page.evaluate(() => {
      const dashboardLink = document.querySelector('a[href="/dashboard"]');
      if (dashboardLink) dashboardLink.click();
    });
    
    // Wait for navigation and menu close
    await page.waitForTimeout(500);
    clearInterval(captureInterval);
    
    // PHASE 4: Final state
    console.log('🏁 PHASE 4: Capturing final state...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-final.png'),
      fullPage: false 
    });
    
    // Analyze results
    console.log('\n📊 ANIMATION TIMING ANALYSIS:');
    console.log('============================');
    
    // Check if menu element exists and get its state
    const menuState = await page.evaluate(() => {
      const menu = document.querySelector('#mobile-menu');
      if (!menu) return { exists: false };
      
      const styles = window.getComputedStyle(menu);
      return {
        exists: true,
        display: styles.display,
        opacity: styles.opacity,
        height: styles.height,
        visibility: styles.visibility
      };
    });
    
    console.log('\n🔍 Mobile Menu State:');
    console.log('   Menu element exists:', menuState.exists);
    if (menuState.exists) {
      console.log('   Display:', menuState.display);
      console.log('   Opacity:', menuState.opacity);
      console.log('   Height:', menuState.height);
    }
    
    console.log('\n📷 Captured frames:');
    timestamps.forEach(ts => {
      console.log(`   ${ts}ms - Frame captured`);
    });
    
    // Check navigation
    const currentUrl = page.url();
    console.log('\n🔗 Navigation:');
    console.log('   Current URL:', currentUrl);
    console.log('   Navigation successful:', currentUrl.includes('/dashboard'));
    
    // Count visible nav elements
    const navCount = await page.$$eval('nav', navs => navs.length);
    console.log('\n🎯 Double Nav Check:');
    console.log('   Navigation elements found:', navCount);
    console.log('   Status:', navCount > 1 ? 'ISSUE PRESENT ❌' : 'RESOLVED ✅');
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('   Review the screenshot sequence in:');
    console.log('   ' + screenshotDir);
    console.log('   Look for any "double nav bar" effect in the transition frames');
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
  } finally {
    console.log('\n🏁 Test complete. Browser will remain open for manual inspection.');
    console.log('   Close the browser window when done.');
    
    // Keep browser open for manual inspection
    await new Promise(() => {}); // Infinite wait
  }
}

// Run the validation
captureAnimationSequence().catch(console.error);