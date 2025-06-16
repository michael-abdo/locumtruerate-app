#!/usr/bin/env node

/**
 * Secrets Management CLI
 * Command-line tool for managing LocumTrueRate secrets
 */

import { Command } from 'commander';
import { SecretsManager } from './manager';
import { EnvSecretsProvider } from './providers/env';
import { Encryption } from './encryption';
import { SecretsValidator } from './validators';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

// Load configuration
const config = {
  provider: 'env' as const,
  encryption: {
    algorithm: 'AES-256-GCM' as const,
    keyDerivation: 'PBKDF2' as const,
    masterKeySource: 'env' as const
  },
  validation: {
    enforceComplexity: true,
    minLength: 12,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true
  }
};

// Create secrets manager
const provider = new EnvSecretsProvider();
const manager = new SecretsManager(config, provider);

program
  .name('locumtruerate-secrets')
  .description('Secrets management for LocumTrueRate platform')
  .version('0.1.0');

// Init command - create example .env file
program
  .command('init')
  .description('Initialize secrets configuration')
  .option('-f, --force', 'Overwrite existing .env.example file')
  .action(async (options) => {
    try {
      const envExamplePath = '.env.example';
      
      if (fs.existsSync(envExamplePath) && !options.force) {
        console.error('❌ .env.example already exists. Use --force to overwrite.');
        process.exit(1);
      }
      
      EnvSecretsProvider.createExampleEnvFile(envExamplePath);
      console.log('✅ Created .env.example file');
      console.log('📝 Copy to .env and fill in your values');
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate all secrets')
  .option('-e, --env <environment>', 'Environment to validate', 'development')
  .action(async (options) => {
    try {
      console.log(`🔍 Validating secrets for ${options.env} environment...`);
      
      const result = await manager.validateAll();
      
      if (result.valid) {
        console.log('✅ All secrets are valid!');
      } else {
        console.error('❌ Validation errors:');
        result.errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate <type>')
  .description('Generate a new secret value')
  .option('-l, --length <length>', 'Secret length', '32')
  .action((type, options) => {
    try {
      const length = parseInt(options.length);
      let secret: string;
      
      switch (type.toLowerCase()) {
        case 'api-key':
          secret = `ltr_${SecretsValidator.generateSecureSecret(length)}`;
          break;
        case 'jwt':
          secret = SecretsValidator.generateSecureSecret(64);
          break;
        case 'encryption':
          secret = Encryption.generateKey();
          break;
        case 'password':
          secret = SecretsValidator.generateSecureSecret(length, {
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSpecial: true
          });
          break;
        default:
          secret = SecretsValidator.generateSecureSecret(length);
      }
      
      console.log(`🔑 Generated ${type} secret:`);
      console.log(secret);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Set command
program
  .command('set <name> <value>')
  .description('Set a secret value')
  .option('-e, --env <environment>', 'Environment', 'development')
  .action(async (name, value, options) => {
    try {
      await manager.set(name, value, {
        environment: options.env,
        setBy: 'CLI',
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Secret ${name} set successfully`);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Get command
program
  .command('get <name>')
  .description('Get a secret value')
  .option('-r, --reveal', 'Show the actual value')
  .action(async (name, options) => {
    try {
      const value = await manager.get(name);
      
      if (!value) {
        console.error(`❌ Secret ${name} not found`);
        process.exit(1);
      }
      
      if (options.reveal) {
        console.log(`🔑 ${name}: ${value}`);
      } else {
        console.log(`🔑 ${name}: ****** (use --reveal to show)`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List all secrets')
  .option('-p, --prefix <prefix>', 'Filter by prefix')
  .action(async (options) => {
    try {
      const secrets = await provider.list(options.prefix);
      
      if (secrets.length === 0) {
        console.log('No secrets found');
        return;
      }
      
      console.log('📋 Secrets:');
      secrets.forEach(secret => {
        console.log(`   - ${secret}`);
      });
      console.log(`\nTotal: ${secrets.length} secrets`);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Rotate command
program
  .command('rotate <name>')
  .description('Rotate a secret')
  .action(async (name) => {
    try {
      console.log(`🔄 Rotating ${name}...`);
      
      const result = await manager.rotate(name);
      
      if (result.success) {
        console.log(`✅ Secret ${name} rotated successfully`);
        console.log(`   New version: ${result.newVersion}`);
      } else {
        console.error(`❌ Failed to rotate ${name}: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export secrets to file')
  .option('-f, --file <file>', 'Output file', '.env.export')
  .option('-s, --secrets <secrets...>', 'Specific secrets to export')
  .action(async (options) => {
    try {
      const secretsToExport = options.secrets || await provider.list();
      
      provider.exportToEnvFile(options.file, secretsToExport);
      console.log(`✅ Exported ${secretsToExport.length} secrets to ${options.file}`);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Check command
program
  .command('check')
  .description('Check for common security issues')
  .action(async () => {
    try {
      console.log('🔍 Checking for security issues...');
      
      const issues: string[] = [];
      
      // Check for test values in production
      if (process.env.NODE_ENV === 'production') {
        const secrets = await provider.getAll();
        
        for (const [name, value] of Object.entries(secrets)) {
          if (value.toLowerCase().includes('test') || 
              value.toLowerCase().includes('demo') ||
              value.toLowerCase().includes('example')) {
            issues.push(`${name} contains test/demo/example values`);
          }
        }
      }
      
      // Check for missing required secrets
      const required = [
        'DATABASE_URL',
        'JWT_SECRET',
        'ENCRYPTION_MASTER_KEY',
        'CLERK_SECRET_KEY',
        'STRIPE_SECRET_KEY',
        'SENDGRID_API_KEY'
      ];
      
      for (const secret of required) {
        const value = await manager.get(secret);
        if (!value) {
          issues.push(`Missing required secret: ${secret}`);
        }
      }
      
      // Check for weak secrets
      const validation = await manager.validateAll();
      if (!validation.valid) {
        issues.push(...validation.errors);
      }
      
      if (issues.length === 0) {
        console.log('✅ No security issues found!');
      } else {
        console.error('❌ Security issues found:');
        issues.forEach(issue => console.error(`   - ${issue}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Interactive setup
program
  .command('setup')
  .description('Interactive setup wizard')
  .action(async () => {
    console.log('🚀 LocumTrueRate Secrets Setup Wizard');
    console.log('This wizard will help you set up all required secrets.\n');
    
    // This would be interactive in a real implementation
    console.log('Required secrets:');
    console.log('1. Database connection (DATABASE_URL)');
    console.log('2. JWT secret (JWT_SECRET)');
    console.log('3. Encryption master key (ENCRYPTION_MASTER_KEY)');
    console.log('4. Clerk authentication (CLERK_SECRET_KEY)');
    console.log('5. Stripe payments (STRIPE_SECRET_KEY)');
    console.log('6. SendGrid email (SENDGRID_API_KEY)');
    console.log('\nRun individual commands to set each secret.');
  });

program.parse(process.argv);