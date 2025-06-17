#!/usr/bin/env node

/**
 * Cloudflare Pages Security CLI
 * Command-line tool for managing security headers and CSP
 */

const { Command } = require('commander');
const { SecurityHeaders, defaultConfigs } = require('../dist/index.js');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs');

const program = new Command();

program
  .name('cf-pages-security')
  .description('Manage Cloudflare Pages security configuration')
  .version('0.1.0');

// Generate headers command
program
  .command('generate-headers')
  .description('Generate _headers file with security headers')
  .option('-e, --environment <env>', 'Environment (development, staging, production)', 'production')
  .option('-o, --output <path>', 'Output file path', '_headers')
  .option('--no-csp', 'Disable Content Security Policy')
  .option('--no-hsts', 'Disable HSTS (HTTPS Strict Transport Security)')
  .action(async (options) => {
    const spinner = ora('Generating security headers...').start();

    try {
      const config = defaultConfigs[options.environment];
      
      if (options.noCsp) {
        config.enableCSP = false;
      }
      
      if (options.noHsts) {
        config.enableHSTS = false;
      }

      const securityHeaders = new SecurityHeaders(config);
      const headersContent = securityHeaders.generateHeadersFile();

      fs.writeFileSync(options.output, headersContent);

      spinner.succeed(`Security headers generated: ${options.output}`);
      
      console.log(chalk.blue('Generated headers for environment:'), chalk.bold(options.environment));
      console.log(chalk.green('✅ Content Security Policy:'), config.enableCSP ? 'Enabled' : 'Disabled');
      console.log(chalk.green('✅ HSTS:'), config.enableHSTS ? 'Enabled' : 'Disabled');
      console.log(chalk.green('✅ CORS:'), config.enableCORS ? 'Enabled' : 'Disabled');

    } catch (error) {
      spinner.fail('Failed to generate headers');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Validate CSP command
program
  .command('validate-csp')
  .description('Validate Content Security Policy')
  .option('-e, --environment <env>', 'Environment to validate', 'production')
  .option('-u, --url <url>', 'Test against live URL')
  .action(async (options) => {
    const spinner = ora('Validating CSP...').start();

    try {
      const config = defaultConfigs[options.environment];
      const securityHeaders = new SecurityHeaders(config);
      const validation = securityHeaders.validateCSP();

      spinner.stop();

      if (validation.valid) {
        console.log(chalk.green('✅ CSP validation passed!'));
      } else {
        console.log(chalk.red('❌ CSP validation failed!'));
        console.log(chalk.red('Errors:'));
        validation.errors.forEach(error => console.log(`  - ${error}`));
      }

      if (validation.warnings.length > 0) {
        console.log(chalk.yellow('⚠️  Warnings:'));
        validation.warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      // Show generated CSP
      console.log('\\n' + chalk.bold('Generated CSP:'));
      console.log(chalk.gray(securityHeaders.generateCSP()));

      // Test against live URL if provided
      if (options.url) {
        await testLiveCSP(options.url);
      }

    } catch (error) {
      spinner.fail('CSP validation failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Security audit command
program
  .command('audit')
  .description('Run security audit on headers configuration')
  .option('-u, --url <url>', 'URL to audit', 'https://locumtruerate.com')
  .option('-e, --environment <env>', 'Environment to compare against', 'production')
  .action(async (options) => {
    const spinner = ora(`Auditing security headers for ${options.url}...`).start();

    try {
      // Fetch headers from live site
      const response = await fetch(options.url);
      const liveHeaders = Object.fromEntries(response.headers.entries());

      // Generate expected headers
      const config = defaultConfigs[options.environment];
      const securityHeaders = new SecurityHeaders(config);
      const expectedHeaders = securityHeaders.generateHeaders();

      spinner.succeed('Security audit completed');

      console.log(chalk.bold('🔍 Security Header Audit Results\\n'));

      // Check each expected header
      const results = {
        present: [],
        missing: [],
        different: []
      };

      Object.entries(expectedHeaders).forEach(([header, expectedValue]) => {
        const liveValue = liveHeaders[header.toLowerCase()];
        
        if (!liveValue) {
          results.missing.push(header);
        } else if (liveValue !== expectedValue) {
          results.different.push({ header, expected: expectedValue, actual: liveValue });
        } else {
          results.present.push(header);
        }
      });

      // Display results
      if (results.present.length > 0) {
        console.log(chalk.green('✅ Correctly configured headers:'));
        results.present.forEach(header => console.log(`  - ${header}`));
        console.log();
      }

      if (results.missing.length > 0) {
        console.log(chalk.red('❌ Missing headers:'));
        results.missing.forEach(header => console.log(`  - ${header}`));
        console.log();
      }

      if (results.different.length > 0) {
        console.log(chalk.yellow('⚠️  Headers with different values:'));
        results.different.forEach(({ header, expected, actual }) => {
          console.log(`  - ${header}:`);
          console.log(`    Expected: ${chalk.green(expected)}`);
          console.log(`    Actual:   ${chalk.red(actual)}`);
        });
        console.log();
      }

      // Security score
      const totalHeaders = Object.keys(expectedHeaders).length;
      const correctHeaders = results.present.length;
      const score = Math.round((correctHeaders / totalHeaders) * 100);

      console.log(chalk.bold('Security Score:'), getScoreColor(score)(`${score}%`));

      if (score < 80) {
        console.log(chalk.red('🚨 Security score is below recommended threshold (80%)'));
      } else if (score < 95) {
        console.log(chalk.yellow('⚠️  Security score is good but could be improved'));
      } else {
        console.log(chalk.green('🎉 Excellent security configuration!'));
      }

    } catch (error) {
      spinner.fail('Security audit failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Interactive CSP builder
program
  .command('build-csp')
  .description('Interactive CSP policy builder')
  .action(async () => {
    console.log(chalk.blue('🛡️  Interactive CSP Policy Builder\\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: 'Select environment:',
        choices: ['development', 'staging', 'production']
      },
      {
        type: 'input',
        name: 'mainDomain',
        message: 'Main domain:',
        default: 'locumtruerate.com'
      },
      {
        type: 'input',
        name: 'apiDomain',
        message: 'API domain:',
        default: 'api.locumtruerate.com'
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select enabled features:',
        choices: [
          { name: 'Analytics (Google Analytics, Mixpanel)', value: 'analytics' },
          { name: 'Monitoring (Sentry)', value: 'monitoring' },
          { name: 'WebGL', value: 'webGL' },
          { name: 'Geolocation', value: 'geolocation' }
        ]
      },
      {
        type: 'checkbox',
        name: 'integrations',
        message: 'Select third-party integrations:',
        choices: [
          { name: 'Stripe (Payments)', value: 'stripe' },
          { name: 'Clerk (Authentication)', value: 'clerk' },
          { name: 'SendGrid (Email)', value: 'sendgrid' }
        ]
      }
    ]);

    // Build custom configuration
    const config = {
      enableCSP: true,
      enableHSTS: answers.environment === 'production',
      enableCORS: answers.environment === 'development',
      environment: answers.environment,
      domains: {
        main: answers.mainDomain,
        api: answers.apiDomain,
        cdn: `cdn.${answers.mainDomain}`,
        assets: `assets.${answers.mainDomain}`
      },
      features: {
        analytics: answers.features.includes('analytics'),
        monitoring: answers.features.includes('monitoring'),
        webGL: answers.features.includes('webGL'),
        geolocation: answers.features.includes('geolocation')
      }
    };

    const securityHeaders = new SecurityHeaders(config);
    const csp = securityHeaders.generateCSP();

    console.log('\\n' + chalk.bold('Generated CSP Policy:'));
    console.log(chalk.gray(csp));

    const { saveToFile } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveToFile',
        message: 'Save CSP to file?',
        default: true
      }
    ]);

    if (saveToFile) {
      const { filename } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filename',
          message: 'Filename:',
          default: 'csp-policy.txt'
        }
      ]);

      fs.writeFileSync(filename, csp);
      console.log(chalk.green('✅ CSP policy saved to:'), filename);
    }
  });

// Generate security.txt
program
  .command('generate-security-txt')
  .description('Generate security.txt file for responsible disclosure')
  .option('-d, --domain <domain>', 'Main domain', 'locumtruerate.com')
  .option('-o, --output <path>', 'Output directory', '.well-known')
  .action((options) => {
    const securityTxt = SecurityHeaders.generateSecurityTxt(options.domain);
    
    // Create .well-known directory if it doesn't exist
    if (!fs.existsSync(options.output)) {
      fs.mkdirSync(options.output, { recursive: true });
    }

    const filePath = `${options.output}/security.txt`;
    fs.writeFileSync(filePath, securityTxt);

    console.log(chalk.green('✅ security.txt generated:'), filePath);
    console.log(chalk.blue('Remember to:'));
    console.log('1. Add your PGP key to /.well-known/pgp-key.txt');
    console.log('2. Create security policy page');
    console.log('3. Set up security acknowledgments page');
  });

/**
 * Test CSP against live URL
 */
async function testLiveCSP(url) {
  console.log('\\n' + chalk.bold('Testing live CSP...'));
  
  try {
    const response = await fetch(url);
    const cspHeader = response.headers.get('content-security-policy');
    
    if (!cspHeader) {
      console.log(chalk.red('❌ No CSP header found on live site'));
      return;
    }
    
    console.log(chalk.green('✅ CSP header found on live site'));
    console.log(chalk.gray('Live CSP:'), cspHeader);
    
  } catch (error) {
    console.log(chalk.red('❌ Failed to fetch live CSP:'), error.message);
  }
}

/**
 * Get color for security score
 */
function getScoreColor(score) {
  if (score >= 95) return chalk.green;
  if (score >= 80) return chalk.yellow;
  return chalk.red;
}

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}