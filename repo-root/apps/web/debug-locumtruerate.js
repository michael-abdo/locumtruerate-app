const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function debugLocumTrueRate() {
  let browser;
  try {
    console.log('🚀 Starting LocumTrueRate validation session with screenshots...');
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
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
    
    // Test Homepage
    console.log('\n🏠 Testing Homepage: http://localhost:3000/...');
    try {
      await page.goto('http://localhost:3000/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the page content
      const content = await page.evaluate(() => {
        return document.body.innerText;
      });
      
      console.log('[HOMEPAGE CONTENT]', content || 'Homepage appears to be blank');
      
      // Check for LocumTrueRate specific content
      const hasLocumContent = content.includes('LocumTrueRate') || 
                             content.includes('locum') || 
                             content.includes('Locum') ||
                             content.includes('True Rate');
      
      console.log(`[LOCUM CONTENT] ${hasLocumContent ? '✅ LocumTrueRate content found' : '❌ No LocumTrueRate content detected'}`);
      
      // Check DOM structure
      const elementCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
      
      console.log(`[HOMEPAGE ELEMENTS] ${elementCount} DOM elements found`);
      
      // Check for errors
      const hasErrors = content.includes('Error') || content.includes('404');
      console.log(`[HOMEPAGE ERRORS] ${hasErrors ? '❌ Errors detected' : '✅ No errors detected'}`);
      
    } catch (error) {
      console.log(`[HOMEPAGE NAVIGATION ERROR] ${error.message}`);
    }
    
    // Test Calculator Page
    console.log('\n🧮 Testing Calculator: http://localhost:3000/tools/calculator...');
    try {
      await page.goto('http://localhost:3000/tools/calculator', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the page content
      const content = await page.evaluate(() => {
        return document.body.innerText;
      });
      
      console.log('[CALCULATOR CONTENT]', content || 'Calculator page appears to be blank');
      
      // Check for calculator specific content
      const hasCalculatorContent = content.includes('Calculator') || 
                                  content.includes('Contract') || 
                                  content.includes('Paycheck') ||
                                  content.includes('Calculate');
      
      console.log(`[CALCULATOR CONTENT] ${hasCalculatorContent ? '✅ Calculator content found' : '❌ No calculator content detected'}`);
      
      // Check for form elements
      const formElementCount = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input').length;
        const buttons = document.querySelectorAll('button').length;
        const selects = document.querySelectorAll('select').length;
        return { inputs, buttons, selects, total: inputs + buttons + selects };
      });
      
      console.log(`[CALCULATOR FORM ELEMENTS] ${formElementCount.total} form elements (${formElementCount.inputs} inputs, ${formElementCount.buttons} buttons, ${formElementCount.selects} selects)`);
      
      // Check for errors
      const hasErrors = content.includes('Error') || content.includes('404');
      console.log(`[CALCULATOR ERRORS] ${hasErrors ? '❌ Errors detected' : '✅ No errors detected'}`);
      
    } catch (error) {
      console.log(`[CALCULATOR NAVIGATION ERROR] ${error.message}`);
    }
    
    // Test Search Jobs Page
    console.log('\n🔍 Testing Search Jobs: http://localhost:3000/search/jobs...');
    try {
      await page.goto('http://localhost:3000/search/jobs', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for React to render and potential API calls
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Get the page content
      const content = await page.evaluate(() => {
        return document.body.innerText;
      });
      
      console.log('[SEARCH JOBS CONTENT]', content || 'Search Jobs page appears to be blank');
      
      // Check for search/jobs specific content
      const hasSearchContent = content.includes('Search') || 
                               content.includes('Jobs') || 
                               content.includes('job') ||
                               content.includes('Position');
      
      console.log(`[SEARCH CONTENT] ${hasSearchContent ? '✅ Search/Jobs content found' : '❌ No search content detected'}`);
      
      // Check for loading state
      const hasLoading = content.includes('Loading') || content.includes('loading');
      console.log(`[SEARCH LOADING] ${hasLoading ? '⏳ Still loading' : '✅ Load complete'}`);
      
      // Check DOM structure
      const searchElementCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
      
      console.log(`[SEARCH ELEMENTS] ${searchElementCount} DOM elements found`);
      
      // Check for errors
      const hasErrors = content.includes('Error') || content.includes('404');
      console.log(`[SEARCH ERRORS] ${hasErrors ? '❌ Errors detected' : '✅ No errors detected'}`);
      
    } catch (error) {
      console.log(`[SEARCH NAVIGATION ERROR] ${error.message}`);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the debug session
debugLocumTrueRate().then(() => {
  console.log('\n🏁 LocumTrueRate validation complete');
}).catch(error => {
  console.error('Fatal error:', error);
});