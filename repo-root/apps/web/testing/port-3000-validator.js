const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class VisualValidator {
  constructor() {
    this.screenshotsDir = path.join(__dirname, 'screenshots');
    this.reportsDir = path.join(__dirname, 'reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create directories
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.screenshotsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Create timestamped session directory
    this.sessionDir = path.join(this.screenshotsDir, this.timestamp);
    fs.mkdirSync(this.sessionDir, { recursive: true });
  }

  async validateApplication() {
    let browser;
    const report = {
      timestamp: this.timestamp,
      session: this.sessionDir,
      pages: [],
      summary: { total: 0, passed: 0, failed: 0 }
    };

    try {
      console.log('🚀 Starting LocumTrueRate Visual Validation Session...');
      console.log(`📁 Screenshots will be saved to: ${this.sessionDir}`);
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
      });

      const page = await browser.newPage();
      
      // Set up error capture
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(`[CONSOLE ERROR] ${msg.text()}`);
        }
      });
      
      page.on('pageerror', error => {
        errors.push(`[PAGE ERROR] ${error.message}`);
      });
      
      page.on('requestfailed', request => {
        errors.push(`[REQUEST FAILED] ${request.url()}: ${request.failure().errorText}`);
      });

      // Test each page
      const testPages = [
        { name: 'homepage', url: 'http://localhost:3000/', expectedContent: ['LocumTrueRate', 'Find Your Perfect Healthcare'] },
        { name: 'dashboard', url: 'http://localhost:3000/dashboard', expectedContent: ['Welcome back', 'Active Applications'] },
        { name: 'calculator', url: 'http://localhost:3000/tools/calculator', expectedContent: ['Calculator', 'Contract Details'] },
        { name: 'search-jobs', url: 'http://localhost:3000/search/jobs', expectedContent: ['Find Healthcare Jobs'] }
      ];

      for (const testPage of testPages) {
        const pageResult = await this.validatePage(page, testPage, errors);
        report.pages.push(pageResult);
        report.summary.total++;
        if (pageResult.status === 'passed') {
          report.summary.passed++;
        } else {
          report.summary.failed++;
        }
      }

    } catch (error) {
      console.error('❌ Critical validation error:', error.message);
      report.criticalError = error.message;
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    // Save report
    await this.saveReport(report);
    this.printSummary(report);
    
    return report;
  }

  async validatePage(page, testConfig, globalErrors) {
    const { name, url, expectedContent } = testConfig;
    console.log(`\n📄 Testing ${name.toUpperCase()}: ${url}...`);
    
    const pageResult = {
      name,
      url,
      timestamp: new Date().toISOString(),
      status: 'failed',
      screenshots: {},
      metrics: {},
      errors: [],
      validation: {
        content: false,
        css: false,
        functionality: false,
        responsive: false
      }
    };

    try {
      // Navigate to page
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      pageResult.httpStatus = response.status();
      console.log(`[HTTP STATUS] ${response.status()}`);
      
      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Take initial screenshot
      const mainScreenshot = path.join(this.sessionDir, `${name}-full.png`);
      await page.screenshot({ 
        path: mainScreenshot, 
        fullPage: true 
      });
      pageResult.screenshots.full = mainScreenshot;
      console.log(`[SCREENSHOT] Full page: ${mainScreenshot}`);
      
      // Take above-the-fold screenshot
      const foldScreenshot = path.join(this.sessionDir, `${name}-fold.png`);
      await page.screenshot({ 
        path: foldScreenshot,
        clip: { x: 0, y: 0, width: 1280, height: 800 }
      });
      pageResult.screenshots.fold = foldScreenshot;
      console.log(`[SCREENSHOT] Above fold: ${foldScreenshot}`);

      // Mobile screenshot
      await page.setViewport({ width: 375, height: 667 });
      const mobileScreenshot = path.join(this.sessionDir, `${name}-mobile.png`);
      await page.screenshot({ 
        path: mobileScreenshot,
        fullPage: true
      });
      pageResult.screenshots.mobile = mobileScreenshot;
      console.log(`[SCREENSHOT] Mobile view: ${mobileScreenshot}`);
      
      // Reset to desktop
      await page.setViewport({ width: 1280, height: 800 });

      // Collect page metrics
      const metrics = await page.evaluate(() => {
        const stylesheets = Array.from(document.styleSheets);
        const computedStyle = window.getComputedStyle(document.body);
        
        return {
          domElements: document.querySelectorAll('*').length,
          stylesheetCount: stylesheets.length,
          bodyBackgroundColor: computedStyle.backgroundColor,
          bodyColor: computedStyle.color,
          hasTailwindClasses: !!document.querySelector('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"]'),
          formElements: {
            inputs: document.querySelectorAll('input').length,
            buttons: document.querySelectorAll('button').length,
            selects: document.querySelectorAll('select').length
          },
          images: document.querySelectorAll('img').length,
          links: document.querySelectorAll('a').length
        };
      });
      
      pageResult.metrics = metrics;
      console.log(`[METRICS] ${metrics.domElements} DOM elements, ${metrics.stylesheetCount} stylesheets`);
      
      // Get page content
      const content = await page.evaluate(() => document.body.innerText);
      
      // Validate content
      const contentFound = expectedContent.every(text => content.includes(text));
      pageResult.validation.content = contentFound;
      console.log(`[CONTENT] ${contentFound ? '✅ Expected content found' : '❌ Expected content missing'}`);
      
      // Validate CSS
      const hasCSS = metrics.stylesheetCount > 0 && metrics.hasTailwindClasses;
      pageResult.validation.css = hasCSS;
      console.log(`[CSS] ${hasCSS ? '✅ Styling applied' : '❌ No styling detected'}`);
      
      // Validate functionality (basic form elements for interactive pages)
      const hasFunctionality = name === 'calculator' ? 
        metrics.formElements.inputs > 5 && metrics.formElements.buttons > 5 :
        metrics.links > 3;
      pageResult.validation.functionality = hasFunctionality;
      console.log(`[FUNCTIONALITY] ${hasFunctionality ? '✅ Interactive elements present' : '❌ Limited interactivity'}`);
      
      // Validate responsive design (check if mobile screenshot worked)
      pageResult.validation.responsive = fs.existsSync(mobileScreenshot);
      console.log(`[RESPONSIVE] ${pageResult.validation.responsive ? '✅ Mobile view captured' : '❌ Mobile view failed'}`);
      
      // Determine overall status
      const allValidationsPassed = Object.values(pageResult.validation).every(v => v === true);
      const httpOk = response.status() === 200;
      pageResult.status = allValidationsPassed && httpOk ? 'passed' : 'failed';
      
      console.log(`[RESULT] ${pageResult.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);

    } catch (error) {
      pageResult.errors.push(error.message);
      console.log(`[ERROR] ${error.message}`);
    }

    // Add any global errors that occurred during this page test
    pageResult.errors.push(...globalErrors.splice(0));
    
    return pageResult;
  }

  async saveReport(report) {
    const reportPath = path.join(this.reportsDir, `validation-${this.timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Create HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(this.reportsDir, `validation-${this.timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`\n📋 Reports saved:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  generateHTMLReport(report) {
    const { pages, summary, timestamp, session } = report;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>LocumTrueRate Visual Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { background: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .page { border: 1px solid #e5e7eb; margin: 20px 0; padding: 20px; border-radius: 8px; }
        .passed { border-left: 4px solid #10b981; }
        .failed { border-left: 4px solid #ef4444; }
        .screenshots { display: flex; gap: 10px; margin: 15px 0; }
        .screenshot { border: 1px solid #d1d5db; border-radius: 4px; }
        .metrics { background: #f9fafb; padding: 10px; border-radius: 4px; font-family: monospace; }
        .validation { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0; }
        .validation-item { text-align: center; padding: 8px; border-radius: 4px; }
        .validation-pass { background: #dcfce7; color: #16a34a; }
        .validation-fail { background: #fee2e2; color: #dc2626; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 LocumTrueRate Visual Validation Report</h1>
        <p><strong>Session:</strong> ${timestamp}</p>
        <p><strong>Screenshots Location:</strong> ${session}</p>
    </div>
    
    <div class="summary">
        <h2>📊 Summary</h2>
        <p><strong>Total Pages:</strong> ${summary.total}</p>
        <p><strong>Passed:</strong> ${summary.passed} ✅</p>
        <p><strong>Failed:</strong> ${summary.failed} ${summary.failed > 0 ? '❌' : ''}</p>
        <p><strong>Success Rate:</strong> ${((summary.passed / summary.total) * 100).toFixed(1)}%</p>
    </div>
    
    ${pages.map(page => `
    <div class="page ${page.status}">
        <h3>📄 ${page.name.toUpperCase()} - ${page.status.toUpperCase()}</h3>
        <p><strong>URL:</strong> <a href="${page.url}" target="_blank">${page.url}</a></p>
        <p><strong>HTTP Status:</strong> ${page.httpStatus}</p>
        
        <div class="validation">
            <div class="validation-item ${page.validation.content ? 'validation-pass' : 'validation-fail'}">
                Content ${page.validation.content ? '✅' : '❌'}
            </div>
            <div class="validation-item ${page.validation.css ? 'validation-pass' : 'validation-fail'}">
                CSS ${page.validation.css ? '✅' : '❌'}
            </div>
            <div class="validation-item ${page.validation.functionality ? 'validation-pass' : 'validation-fail'}">
                Functionality ${page.validation.functionality ? '✅' : '❌'}
            </div>
            <div class="validation-item ${page.validation.responsive ? 'validation-pass' : 'validation-fail'}">
                Responsive ${page.validation.responsive ? '✅' : '❌'}
            </div>
        </div>
        
        <div class="screenshots">
            ${Object.entries(page.screenshots).map(([type, path]) => `
                <div>
                    <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                    <img src="${path}" alt="${page.name} ${type}" class="screenshot" style="max-width: 300px; height: auto;" />
                </div>
            `).join('')}
        </div>
        
        <div class="metrics">
            <strong>Page Metrics:</strong><br>
            DOM Elements: ${page.metrics.domElements}<br>
            Stylesheets: ${page.metrics.stylesheetCount}<br>
            Form Elements: ${page.metrics.formElements?.inputs || 0} inputs, ${page.metrics.formElements?.buttons || 0} buttons<br>
            Images: ${page.metrics.images}<br>
            Links: ${page.metrics.links}
        </div>
        
        ${page.errors.length > 0 ? `
        <div style="background: #fef2f2; padding: 10px; border-radius: 4px; margin: 10px 0;">
            <strong>Errors:</strong>
            <ul>
                ${page.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </div>
    `).join('')}
    
</body>
</html>`;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 VISUAL VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📅 Session: ${report.timestamp}`);
    console.log(`📁 Screenshots: ${report.session}`);
    console.log(`📊 Results: ${report.summary.passed}/${report.summary.total} passed (${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%)`);
    
    report.pages.forEach(page => {
      const status = page.status === 'passed' ? '✅' : '❌';
      console.log(`   ${status} ${page.name}: ${page.httpStatus} - ${Object.values(page.validation).filter(v => v).length}/4 validations passed`);
    });
    
    console.log('='.repeat(60));
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new VisualValidator();
  validator.validateApplication().then(() => {
    console.log('🏁 Visual validation complete');
  }).catch(error => {
    console.error('💥 Validation failed:', error);
    process.exit(1);
  });
}

module.exports = VisualValidator;