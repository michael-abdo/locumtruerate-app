/**
 * Integration Tests
 * End-to-end testing of secrets management workflows
 */

import { SecretsManager } from '../manager';
import { EnvSecretsProvider } from '../providers/env';
import { Encryption } from '../encryption';
import { SecretsValidator } from '../validators';
import * as fs from 'fs';
import * as path from 'path';

describe('Secrets Management Integration', () => {
  let tempDir: string;
  let envFilePath: string;
  let manager: SecretsManager;
  let provider: EnvSecretsProvider;

  beforeAll(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-'));
    envFilePath = path.join(tempDir, '.env.test');
  });

  afterAll(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Create test environment file
    const testEnvContent = `
# Test Environment Variables
DATABASE_URL=postgresql://test:test@localhost:5432/testdb
JWT_SECRET=test-jwt-secret-with-high-complexity-123!@#$%^&*()_+ABCDEFGHIJKLMNOP
ENCRYPTION_MASTER_KEY=dGVzdC1tYXN0ZXItZW5jcnlwdGlvbi1rZXktYmFzZTY0LWVuY29kZWQtdmFsdWU=
CLERK_SECRET_KEY=sk_test_clerk_secret_key_value
STRIPE_SECRET_KEY=sk_test_stripe_secret_key_value
SENDGRID_API_KEY=SG.test_sendgrid_api_key_value
API_KEY_INTERNAL=ltr_internal_test_key_12345678901234567890
`.trim();

    fs.writeFileSync(envFilePath, testEnvContent);

    // Initialize provider and manager
    provider = new EnvSecretsProvider({
      envFile: envFilePath
    });

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
      },
      cache: {
        enabled: true,
        ttl: 60000, // 1 minute for testing
        maxSize: 50
      },
      audit: {
        enabled: true,
        logLevel: 'info' as const,
        includeValues: false
      }
    };

    manager = new SecretsManager(config, provider);
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(envFilePath)) {
      fs.unlinkSync(envFilePath);
    }
  });

  describe('Complete Workflow', () => {
    it('should handle complete secret lifecycle', async () => {
      const secretName = 'WORKFLOW_TEST_SECRET';
      const secretValue = 'ComplexSecret123!@#$%^&*()';

      // 1. Set a new secret
      await manager.set(secretName, secretValue, {
        setBy: 'integration-test',
        environment: 'test'
      });

      // 2. Verify it exists
      const exists = await manager.exists(secretName);
      expect(exists).toBe(true);

      // 3. Retrieve the secret
      const retrievedValue = await manager.get(secretName);
      expect(retrievedValue).toBe(secretValue);

      // 4. List secrets and verify it's included
      const secrets = await manager.list();
      expect(secrets).toContain(secretName);

      // 5. Validate the secret
      const validation = manager.validate(secretName, secretValue);
      expect(validation.valid).toBe(true);

      // 6. Rotate the secret
      const rotationResult = await manager.rotate(secretName);
      expect(rotationResult.success).toBe(true);
      expect(rotationResult.newVersion).toBeDefined();

      // 7. Verify the rotated value is different
      const newValue = await manager.get(secretName);
      expect(newValue).not.toBe(secretValue);
      expect(newValue).toBeDefined();

      // 8. Delete the secret
      await manager.delete(secretName);

      // 9. Verify it no longer exists
      const existsAfterDelete = await manager.exists(secretName);
      expect(existsAfterDelete).toBe(false);

      const deletedValue = await manager.get(secretName);
      expect(deletedValue).toBeNull();
    });

    it('should handle bulk operations', async () => {
      const testSecrets = {
        'BULK_SECRET_1': 'BulkSecret1!@#',
        'BULK_SECRET_2': 'BulkSecret2$%^',
        'BULK_SECRET_3': 'BulkSecret3&*()'
      };

      // Set multiple secrets
      for (const [name, value] of Object.entries(testSecrets)) {
        await manager.set(name, value);
      }

      // Validate all secrets
      const validationResult = await manager.validateAll();
      expect(validationResult.valid).toBe(true);

      // Export secrets
      const exportResult = await manager.exportSecrets(Object.keys(testSecrets));
      expect(exportResult.secrets).toBeDefined();
      expect(Object.keys(exportResult.secrets)).toHaveLength(3);

      // Clear secrets
      for (const name of Object.keys(testSecrets)) {
        await manager.delete(name);
      }

      // Import secrets back
      await manager.importSecrets(exportResult);

      // Verify all secrets are back
      for (const [name, expectedValue] of Object.entries(testSecrets)) {
        const value = await manager.get(name);
        expect(value).toBe(expectedValue);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle validation failures gracefully', async () => {
      const weakSecret = 'weak';
      
      await expect(manager.set('WEAK_SECRET', weakSecret)).rejects.toThrow();
      
      // Verify the weak secret was not stored
      const exists = await manager.exists('WEAK_SECRET');
      expect(exists).toBe(false);
    });

    it('should handle encryption/decryption errors', async () => {
      // Manually corrupt a secret in the environment file
      const corruptedValue = 'not-encrypted-data';
      fs.appendFileSync(envFilePath, `\nCORRUPTED_SECRET=${corruptedValue}`);

      // Provider should get the corrupted value, but decryption should fail
      await expect(manager.get('CORRUPTED_SECRET')).rejects.toThrow();
    });

    it('should handle provider errors', async () => {
      // Create a provider that will fail
      const failingProvider = {
        get: jest.fn().mockRejectedValue(new Error('Provider failure')),
        set: jest.fn().mockRejectedValue(new Error('Provider failure')),
        delete: jest.fn().mockRejectedValue(new Error('Provider failure')),
        exists: jest.fn().mockRejectedValue(new Error('Provider failure')),
        list: jest.fn().mockRejectedValue(new Error('Provider failure')),
        getAll: jest.fn().mockRejectedValue(new Error('Provider failure')),
        exportToEnvFile: jest.fn().mockRejectedValue(new Error('Provider failure'))
      };

      const failingManager = new SecretsManager({
        provider: 'env',
        encryption: {
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          masterKeySource: 'env'
        }
      } as any, failingProvider as any);

      await expect(failingManager.get('ANY_SECRET')).rejects.toThrow('Provider failure');
      await expect(failingManager.set('ANY_SECRET', 'value')).rejects.toThrow('Provider failure');
      await expect(failingManager.delete('ANY_SECRET')).rejects.toThrow('Provider failure');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent operations', async () => {
      const concurrentOps = 10;
      const baseSecretName = 'CONCURRENT_SECRET_';

      // Prepare secrets
      const setPromises = Array.from({ length: concurrentOps }, (_, i) => {
        const name = `${baseSecretName}${i}`;
        const value = `ConcurrentValue${i}!@#`;
        return manager.set(name, value);
      });

      // Execute all sets concurrently
      await Promise.all(setPromises);

      // Execute all gets concurrently
      const getPromises = Array.from({ length: concurrentOps }, (_, i) => {
        const name = `${baseSecretName}${i}`;
        return manager.get(name);
      });

      const results = await Promise.all(getPromises);

      // Verify all results
      results.forEach((value, i) => {
        expect(value).toBe(`ConcurrentValue${i}!@#`);
      });

      // Clean up
      const deletePromises = Array.from({ length: concurrentOps }, (_, i) => {
        const name = `${baseSecretName}${i}`;
        return manager.delete(name);
      });

      await Promise.all(deletePromises);
    });

    it('should cache frequently accessed secrets', async () => {
      const secretName = 'CACHE_PERFORMANCE_TEST';
      const secretValue = 'CachedValue123!@#';

      // Set secret
      await manager.set(secretName, secretValue);

      // First access (should hit provider)
      const startTime1 = Date.now();
      const value1 = await manager.get(secretName);
      const time1 = Date.now() - startTime1;

      // Second access (should hit cache)
      const startTime2 = Date.now();
      const value2 = await manager.get(secretName);
      const time2 = Date.now() - startTime2;

      expect(value1).toBe(secretValue);
      expect(value2).toBe(secretValue);
      expect(time2).toBeLessThan(time1); // Cache should be faster
    });
  });

  describe('HIPAA Compliance', () => {
    it('should maintain audit trail', async () => {
      const secretName = 'HIPAA_AUDIT_TEST';
      const secretValue = 'HIPAACompliantSecret123!@#';

      const auditEvents: any[] = [];
      
      // Listen for audit events
      manager.on('audit', (event) => {
        auditEvents.push(event);
      });

      // Perform operations
      await manager.set(secretName, secretValue);
      await manager.get(secretName);
      await manager.delete(secretName);

      // Verify audit events were captured
      expect(auditEvents.length).toBeGreaterThan(0);
      
      // Verify audit events contain required fields
      auditEvents.forEach(event => {
        expect(event.operation).toBeDefined();
        expect(event.secretName).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.success).toBeDefined();
        // Verify sensitive values are not logged
        expect(event.value).toBeUndefined();
      });
    });

    it('should support encrypted storage', async () => {
      const secretName = 'ENCRYPTION_TEST';
      const plaintext = 'PlaintextSecret123!@#';

      // Set secret (should be encrypted)
      await manager.set(secretName, plaintext);

      // Verify the stored value is encrypted (not plaintext)
      const rawValue = fs.readFileSync(envFilePath, 'utf8');
      expect(rawValue).not.toContain(plaintext);
      expect(rawValue).toContain(secretName);

      // Verify decryption works
      const decryptedValue = await manager.get(secretName);
      expect(decryptedValue).toBe(plaintext);
    });

    it('should validate secret complexity for healthcare compliance', async () => {
      const testCases = [
        { name: 'WEAK_PASSWORD', value: 'weak', shouldPass: false },
        { name: 'MEDIUM_PASSWORD', value: 'MediumPassword123', shouldPass: false },
        { name: 'STRONG_PASSWORD', value: 'VeryStrongPassword123!@#$%^&*()', shouldPass: true }
      ];

      for (const testCase of testCases) {
        const validation = manager.validate(testCase.name, testCase.value);
        
        if (testCase.shouldPass) {
          expect(validation.valid).toBe(true);
        } else {
          expect(validation.valid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle application startup scenario', async () => {
      // Simulate application loading all required secrets at startup
      const requiredSecrets = [
        'DATABASE_URL',
        'JWT_SECRET',
        'ENCRYPTION_MASTER_KEY',
        'CLERK_SECRET_KEY',
        'STRIPE_SECRET_KEY',
        'SENDGRID_API_KEY'
      ];

      const secretValues: Record<string, string> = {};

      // Load all secrets (as an app would do)
      for (const secretName of requiredSecrets) {
        const value = await manager.get(secretName);
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
        secretValues[secretName] = value!;
      }

      // Verify all secrets are loaded
      expect(Object.keys(secretValues)).toHaveLength(requiredSecrets.length);

      // Validate all secrets
      const validationResult = await manager.validateAll();
      expect(validationResult.valid).toBe(true);
    });

    it('should handle secret rotation in production', async () => {
      const secretName = 'PRODUCTION_API_KEY';
      const initialValue = 'InitialAPIKey123!@#$%^&*()';

      // Set initial secret
      await manager.set(secretName, initialValue);

      // Simulate production rotation
      const rotationResult = await manager.rotate(secretName);
      expect(rotationResult.success).toBe(true);

      // Verify new secret works
      const newValue = await manager.get(secretName);
      expect(newValue).toBeDefined();
      expect(newValue).not.toBe(initialValue);

      // Verify new secret is valid
      const validation = manager.validate(secretName, newValue!);
      expect(validation.valid).toBe(true);
    });

    it('should handle backup and restore scenario', async () => {
      const originalSecrets = {
        'BACKUP_SECRET_1': 'BackupValue1!@#',
        'BACKUP_SECRET_2': 'BackupValue2$%^',
        'BACKUP_SECRET_3': 'BackupValue3&*()'
      };

      // Set original secrets
      for (const [name, value] of Object.entries(originalSecrets)) {
        await manager.set(name, value);
      }

      // Export for backup
      const backupData = await manager.exportSecrets(Object.keys(originalSecrets));

      // Simulate data loss (delete secrets)
      for (const name of Object.keys(originalSecrets)) {
        await manager.delete(name);
      }

      // Verify secrets are gone
      for (const name of Object.keys(originalSecrets)) {
        const value = await manager.get(name);
        expect(value).toBeNull();
      }

      // Restore from backup
      await manager.importSecrets(backupData);

      // Verify all secrets are restored
      for (const [name, expectedValue] of Object.entries(originalSecrets)) {
        const value = await manager.get(name);
        expect(value).toBe(expectedValue);
      }
    });
  });
});