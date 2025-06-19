const puppeteer = require('puppeteer');

async function checkCSS() {
  console.log('🔍 Quick CSS Check');
  console.log('=================\n');
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    console.log('📄 Loading homepage...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Check if CSS is loaded
    const cssInfo = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      const styles = window.getComputedStyle(document.body);
      
      return {
        stylesheetCount: stylesheets.length,
        backgroundColor: styles.backgroundColor,
        fontFamily: styles.fontFamily,
        hasTailwind: document.documentElement.className.includes('tw-') || 
                     document.querySelector('[class*="text-"]') !== null ||
                     document.querySelector('[class*="bg-"]') !== null,
        bodyClasses: document.body.className,
        htmlClasses: document.documentElement.className,
        firstHeading: document.querySelector('h1')?.textContent || 'No H1 found',
        hasStyledElements: document.querySelector('[class*="rounded"]') !== null ||
                          document.querySelector('[class*="shadow"]') !== null ||
                          document.querySelector('[class*="px-"]') !== null
      };
    });
    
    console.log('\n📊 CSS Analysis:');
    console.log('================');
    console.log(`Stylesheets loaded: ${cssInfo.stylesheetCount}`);
    console.log(`Background color: ${cssInfo.backgroundColor}`);
    console.log(`Font family: ${cssInfo.fontFamily}`);
    console.log(`Has Tailwind classes: ${cssInfo.hasTailwind ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Has styled elements: ${cssInfo.hasStyledElements ? 'YES ✅' : 'NO ❌'}`);
    console.log(`HTML classes: "${cssInfo.htmlClasses}"`);
    console.log(`Body classes: "${cssInfo.bodyClasses}"`);
    console.log(`First heading: "${cssInfo.firstHeading}"`);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'testing/css-check-screenshot.png',
      fullPage: false 
    });
    console.log('\n📸 Screenshot saved to: testing/css-check-screenshot.png');
    
    // Final verdict
    const cssWorking = cssInfo.stylesheetCount > 0 && 
                      (cssInfo.hasTailwind || cssInfo.hasStyledElements);
    
    console.log('\n🎯 CSS Status:', cssWorking ? 'WORKING ✅' : 'BROKEN ❌');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkCSS();