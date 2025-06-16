/**
 * CLI Tests
 * Testing the command-line interface functionality
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock filesystem operations
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('CLI', () => {
  const cliPath = path.join(__dirname, '../cli.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Mock process.exit
    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process exit called');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('init command', () => {
    it('should create .env.example file', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation();

      try {
        require('../cli');
        // Simulate running: locumtruerate-secrets init
        process.argv = ['node', 'cli.js', 'init'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('✅ Created .env.example file');
    });

    it('should not overwrite existing file without --force', () => {
      mockFs.existsSync.mockReturnValue(true);

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'init'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith('❌ .env.example already exists. Use --force to overwrite.');
    });

    it('should overwrite existing file with --force', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation();

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'init', '--force'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('✅ Created .env.example file');
    });
  });

  describe('generate command', () => {
    beforeEach(() => {
      // Mock crypto functions for secret generation
      jest.mock('crypto', () => ({
        randomBytes: jest.fn().mockReturnValue(Buffer.from('mockrandomdata')),
        createCipheriv: jest.fn(),
        createDecipheriv: jest.fn()
      }));
    });

    it('should generate API key', () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'generate', 'api-key'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('🔑 Generated api-key secret:');
    });

    it('should generate JWT secret', () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'generate', 'jwt'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('🔑 Generated jwt secret:');
    });

    it('should generate encryption key', () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'generate', 'encryption'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('🔑 Generated encryption secret:');
    });

    it('should generate password with specified length', () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'generate', 'password', '--length', '20'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('🔑 Generated password secret:');
    });
  });

  describe('validate command', () => {
    beforeEach(() => {
      // Mock environment variables
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.JWT_SECRET = 'very-long-jwt-secret-with-high-complexity-123!@#$%^&*()';
      process.env.ENCRYPTION_MASTER_KEY = 'master-encryption-key-base64-encoded-value';
    });

    it('should pass validation for valid secrets', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'validate'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('✅ All secrets are valid!');
    });

    it('should fail validation for invalid secrets', async () => {
      process.env.JWT_SECRET = 'weak'; // Weak secret

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'validate'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith('❌ Validation errors:');
    });

    it('should validate specific environment', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'validate', '--env', 'production'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('🔍 Validating secrets for production environment...');
    });
  });

  describe('set/get commands', () => {
    it('should set a secret', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'set', 'TEST_SECRET', 'test_value'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('✅ Secret TEST_SECRET set successfully');
    });

    it('should get a secret without revealing', async () => {
      process.env.TEST_SECRET = 'encrypted_test_value';

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'get', 'TEST_SECRET'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('🔑 TEST_SECRET: ****** (use --reveal to show)');
    });

    it('should get a secret with reveal flag', async () => {
      process.env.TEST_SECRET = 'test_value';

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'get', 'TEST_SECRET', '--reveal'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🔑 TEST_SECRET:'));
    });

    it('should handle non-existent secret', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'get', 'NON_EXISTENT'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith('❌ Secret NON_EXISTENT not found');
    });
  });

  describe('list command', () => {
    beforeEach(() => {
      process.env.SECRET_1 = 'value1';
      process.env.SECRET_2 = 'value2';
      process.env.API_KEY = 'api_value';
    });

    it('should list all secrets', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'list'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('📋 Secrets:');
    });

    it('should list secrets with prefix filter', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'list', '--prefix', 'SECRET_'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('📋 Secrets:');
    });

    it('should handle empty secret list', async () => {
      // Clear environment
      delete process.env.SECRET_1;
      delete process.env.SECRET_2;
      delete process.env.API_KEY;

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'list'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('No secrets found');
    });
  });

  describe('rotate command', () => {
    it('should rotate a secret successfully', async () => {
      process.env.ROTATE_SECRET = 'old_value';

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'rotate', 'ROTATE_SECRET'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('🔄 Rotating ROTATE_SECRET...');
    });

    it('should handle rotation failure', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'rotate', 'NON_EXISTENT'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('❌ Failed to rotate'));
    });
  });

  describe('check command', () => {
    it('should pass security check', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.JWT_SECRET = 'very-secure-jwt-secret-123!@#';
      process.env.ENCRYPTION_MASTER_KEY = 'secure-master-key';
      process.env.CLERK_SECRET_KEY = 'clerk-secret-key';
      process.env.STRIPE_SECRET_KEY = 'stripe-secret-key';
      process.env.SENDGRID_API_KEY = 'sendgrid-api-key';

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'check'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('✅ No security issues found!');
    });

    it('should detect test values in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.API_KEY = 'test_api_key';

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'check'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith('❌ Security issues found:');
    });

    it('should detect missing required secrets', async () => {
      // Clear required secrets
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'check'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith('❌ Security issues found:');
    });
  });

  describe('export command', () => {
    beforeEach(() => {
      process.env.EXPORT_SECRET_1 = 'value1';
      process.env.EXPORT_SECRET_2 = 'value2';
      mockFs.writeFileSync.mockImplementation();
    });

    it('should export all secrets to default file', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'export'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ Exported'));
    });

    it('should export specific secrets to custom file', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'export', '--file', 'custom.env', '--secrets', 'EXPORT_SECRET_1'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ Exported'));
    });
  });

  describe('setup command', () => {
    it('should display setup wizard', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'setup'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('🚀 LocumTrueRate Secrets Setup Wizard');
      expect(console.log).toHaveBeenCalledWith('This wizard will help you set up all required secrets.\n');
    });
  });

  describe('error handling', () => {
    it('should handle command errors gracefully', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'invalid-command'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      // Should not crash, commander will handle unknown commands
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('❌ Error:'));
    });

    it('should handle provider errors', async () => {
      // Mock a provider error
      jest.doMock('../providers/env', () => ({
        EnvSecretsProvider: jest.fn().mockImplementation(() => {
          throw new Error('Provider initialization failed');
        })
      }));

      try {
        require('../cli');
        process.argv = ['node', 'cli.js', 'validate'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('❌ Error:'));
    });
  });

  describe('help and version', () => {
    it('should display help information', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', '--help'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      // Commander automatically handles --help
      expect(console.log).toHaveBeenCalled();
    });

    it('should display version information', async () => {
      try {
        require('../cli');
        process.argv = ['node', 'cli.js', '--version'];
      } catch (error) {
        // Expected due to process.exit mock
      }

      // Commander automatically handles --version
      expect(console.log).toHaveBeenCalled();
    });
  });
});