const puppeteer = require('puppeteer');

async function validateLocumTrueRate() {
  let browser;
  try {
    console.log('🚀 Starting LocumTrueRate validation...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
      console.log(`[STACK] ${error.stack}`);
    });
    
    // Capture failed requests
    page.on('requestfailed', request => {
      console.log(`[REQUEST FAILED] ${request.url()}`);
      console.log(`[FAILURE REASON] ${request.failure().errorText}`);
    });
    
    // Capture all network responses to find 404s
    page.on('response', response => {
      if (response.status() === 404) {
        console.log(`[404 DETECTED] ${response.url()}`);
      }
    });
    
    // Test the main page
    console.log('\n🏠 Testing http://localhost:3000...');
    try {
      await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the page content
      const content = await page.evaluate(() => {
        return document.body.innerText;
      });
      
      console.log('[PAGE LOADED]', content ? '✅ Content found' : '❌ Page appears blank');
      
      // Check if there are any visible elements
      const elementCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
      
      console.log(`[ELEMENT COUNT] ${elementCount} DOM elements found`);
      
      // Check for LocumTrueRate specific content
      const hasLocumContent = content.includes('LocumTrueRate') || content.includes('Healthcare');
      console.log(`[LOCUM CONTENT] ${hasLocumContent ? '✅ Found' : '❌ Missing'}`);
      
      // Check for errors in content
      const hasErrors = content.includes('Error') || content.includes('error') || content.includes('500') || content.includes('404');
      console.log(`[ERROR STATUS] ${hasErrors ? '❌ Errors detected' : '✅ No errors detected'}`);
      
    } catch (error) {
      console.log(`[NAVIGATION ERROR] ${error.message}`);
    }
    
  } catch (error) {
    console.error('Validation script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the validation
validateLocumTrueRate().then(() => {
  console.log('\n🏁 Validation complete');
}).catch(error => {
  console.error('Fatal error:', error);
});