const puppeteer = require('puppeteer');

async function validateFrontend() {
  let browser;
  try {
    console.log('🚀 Starting frontend validation...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text });
      console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
    });
    
    // Capture errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`[PAGE ERROR] ${error.message}`);
    });
    
    // Test homepage
    console.log('📱 Testing http://localhost:3000...');
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log(`✅ Page loaded with status: ${response.status()}\n`);
    
    // Wait for React to render
    await page.waitForTimeout(2000);
    
    // Check for key elements
    const validations = {
      'Page Title': await page.title(),
      'Has Header': await page.$('header') !== null,
      'Has Main Content': await page.$('main') !== null,
      'Has Footer': await page.$('footer') !== null,
      'Has Navigation': await page.$('nav') !== null,
    };
    
    console.log('🔍 Element Validation:');
    Object.entries(validations).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Check for text content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n📄 Page Content Preview:');
    console.log(bodyText.substring(0, 500) + '...');
    
    // Check for errors
    console.log(`\n⚠️  Console Errors: ${errors.length}`);
    console.log(`⚠️  Console Warnings: ${consoleLogs.filter(l => l.type === 'warning').length}`);
    
    // Test navigation
    console.log('\n🧭 Testing Navigation:');
    const links = await page.$$eval('a[href^="/"]', links => 
      links.slice(0, 5).map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }))
    );
    
    links.forEach(link => {
      console.log(`   - ${link.text}: ${link.href}`);
    });
    
    console.log('\n✅ Frontend validation complete!');
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

validateFrontend();