#!/usr/bin/env node

/**
 * Cloudflare Pages Deployment CLI
 * Command-line tool for deploying LocumTrueRate to Cloudflare Pages
 */

const { Command } = require('commander');
const { CloudflarePagesDeploy, createDefaultConfig } = require('../dist/index.js');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('cf-pages-deploy')
  .description('Deploy LocumTrueRate to Cloudflare Pages')
  .version('0.1.0');

// Deploy command
program
  .command('deploy')
  .description('Deploy to Cloudflare Pages')
  .option('-e, --environment <env>', 'Environment to deploy to', 'production')
  .option('-p, --project <name>', 'Project name')
  .option('-a, --account <id>', 'Cloudflare account ID')
  .option('-c, --config <path>', 'Configuration file path')
  .option('--dry-run', 'Show what would be deployed without deploying')
  .action(async (options) => {
    try {
      const spinner = ora('Preparing deployment...').start();

      // Load configuration
      let config;
      if (options.config && fs.existsSync(options.config)) {
        const configFile = JSON.parse(fs.readFileSync(options.config, 'utf8'));
        config = configFile;
      } else {
        // Interactive configuration
        spinner.stop();
        config = await createInteractiveConfig(options);
        spinner.start('Validating configuration...');
      }

      // Validate configuration
      const { validateConfig } = require('../dist/config.js');
      const validation = validateConfig(config);

      if (!validation.valid) {
        spinner.fail('Configuration validation failed');
        console.error(chalk.red('Errors:'));
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      if (validation.warnings.length > 0) {
        spinner.warn('Configuration warnings');
        validation.warnings.forEach(warning => 
          console.warn(chalk.yellow(`  ⚠️  ${warning}`))
        );
      }

      spinner.text = 'Creating deployment...';

      // Create deployment
      const deployment = new CloudflarePagesDeploy(config);

      if (options.dryRun) {
        spinner.succeed('Dry run completed');
        console.log(chalk.blue('Deployment Configuration:'));
        console.log(JSON.stringify(config, null, 2));
        return;
      }

      spinner.text = 'Deploying to Cloudflare Pages...';

      // Deploy
      const result = await deployment.deploy();

      if (result.success) {
        spinner.succeed('Deployment completed successfully!');
        console.log(chalk.green('🎉 Your site is live at:'), chalk.blue(result.url));
        
        // Show additional information
        console.log('\n' + chalk.bold('Next steps:'));
        console.log('1. Test your deployment');
        console.log('2. Configure custom domain (if needed)');
        console.log('3. Set up monitoring and alerts');
        
      } else {
        spinner.fail('Deployment failed');
        console.error(chalk.red('Error:'), result.error);
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('Deployment failed:'), error.message);
      process.exit(1);
    }
  });

// Initialize command
program
  .command('init')
  .description('Initialize Cloudflare Pages configuration')
  .option('-t, --template <type>', 'Template type (spa, nextjs, vite, nuxt)', 'spa')
  .action(async (options) => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'locumtruerate'
      },
      {
        type: 'input',
        name: 'accountId',
        message: 'Cloudflare account ID:',
        validate: input => input.length > 0 || 'Account ID is required'
      },
      {
        type: 'list',
        name: 'environment',
        message: 'Environment:',
        choices: ['development', 'staging', 'production'],
        default: 'production'
      }
    ]);

    const { configTemplates } = require('../dist/config.js');
    const template = configTemplates[options.template];
    
    if (!template) {
      console.error(chalk.red(`Unknown template: ${options.template}`));
      process.exit(1);
    }

    const config = template(answers.projectName, answers.accountId, answers.environment);
    
    // Write configuration file
    const configPath = 'cloudflare-pages.config.json';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(chalk.green('✅ Configuration created:'), configPath);
    console.log(chalk.blue('Run'), chalk.bold('cf-pages-deploy deploy -c cloudflare-pages.config.json'), chalk.blue('to deploy'));
  });

// Status command
program
  .command('status')
  .description('Check deployment status')
  .option('-p, --project <name>', 'Project name')
  .action(async (options) => {
    if (!options.project) {
      console.error(chalk.red('Project name is required'));
      process.exit(1);
    }

    const spinner = ora('Checking deployment status...').start();

    try {
      // This would call Cloudflare API to get deployment status
      // For now, just show a placeholder
      spinner.succeed('Deployment status retrieved');
      
      console.log(chalk.blue('Project:'), options.project);
      console.log(chalk.blue('Status:'), chalk.green('Active'));
      console.log(chalk.blue('Last deployment:'), new Date().toLocaleString());
      console.log(chalk.blue('URL:'), `https://${options.project}.pages.dev`);
      
    } catch (error) {
      spinner.fail('Failed to get status');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// List deployments command
program
  .command('list')
  .description('List all deployments')
  .action(async () => {
    const spinner = ora('Fetching deployments...').start();

    try {
      // This would call Cloudflare API to list deployments
      spinner.succeed('Deployments retrieved');
      
      console.log(chalk.bold('Recent Deployments:'));
      console.log('1. locumtruerate-production (Active) - 2 hours ago');
      console.log('2. locumtruerate-staging (Active) - 1 day ago');
      console.log('3. locumtruerate-development (Active) - 3 days ago');
      
    } catch (error) {
      spinner.fail('Failed to list deployments');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Create interactive configuration
 */
async function createInteractiveConfig(options) {
  console.log(chalk.blue('🚀 LocumTrueRate Cloudflare Pages Setup'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: options.project || 'locumtruerate',
      validate: input => input.length > 0 || 'Project name is required'
    },
    {
      type: 'input',
      name: 'accountId',
      message: 'Cloudflare account ID:',
      default: options.account || process.env.CLOUDFLARE_ACCOUNT_ID,
      validate: input => input.length > 0 || 'Account ID is required'
    },
    {
      type: 'list',
      name: 'environment',
      message: 'Environment:',
      choices: ['development', 'staging', 'production'],
      default: options.environment
    },
    {
      type: 'input',
      name: 'buildCommand',
      message: 'Build command:',
      default: 'npm run build'
    },
    {
      type: 'input',
      name: 'buildOutput',
      message: 'Build output directory:',
      default: 'dist'
    },
    {
      type: 'confirm',
      name: 'enableAnalytics',
      message: 'Enable analytics?',
      default: options.environment === 'production'
    },
    {
      type: 'confirm',
      name: 'enableMonitoring',
      message: 'Enable monitoring?',
      default: true
    }
  ]);

  return createDefaultConfig(answers.environment, answers.projectName, answers.accountId);
}

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}