/**
 * SecretsManager Tests
 * Testing the central secrets management functionality
 */

import { SecretsManager } from '../manager';
import { EnvSecretsProvider } from '../providers/env';
import { Encryption } from '../encryption';

// Mock the filesystem and environment
jest.mock('fs');
jest.mock('dotenv');

describe('SecretsManager', () => {
  let manager: SecretsManager;
  let mockProvider: jest.Mocked<EnvSecretsProvider>;

  beforeEach(() => {
    // Create mock provider
    mockProvider = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      list: jest.fn(),
      getAll: jest.fn(),
      exportToEnvFile: jest.fn(),
      createExampleEnvFile: jest.fn()
    } as any;

    // Create secrets manager with test configuration
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
        ttl: 300000, // 5 minutes
        maxSize: 100
      },
      audit: {
        enabled: true,
        logLevel: 'info' as const,
        includeValues: false
      }
    };

    manager = new SecretsManager(config, mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should retrieve and decrypt secret', async () => {
      const secretName = 'TEST_SECRET';
      const secretValue = 'test-secret-value';
      const encryptedValue = 'encrypted-test-value';

      mockProvider.get.mockResolvedValue(encryptedValue);
      // Mock encryption decrypt
      jest.spyOn(Encryption.prototype, 'decrypt').mockResolvedValue(secretValue);

      const result = await manager.get(secretName);

      expect(result).toBe(secretValue);
      expect(mockProvider.get).toHaveBeenCalledWith(secretName);
    });

    it('should return null for non-existent secret', async () => {
      mockProvider.get.mockResolvedValue(null);

      const result = await manager.get('NON_EXISTENT');

      expect(result).toBeNull();
      expect(mockProvider.get).toHaveBeenCalledWith('NON_EXISTENT');
    });

    it('should cache decrypted values', async () => {
      const secretName = 'CACHED_SECRET';
      const secretValue = 'cached-value';
      const encryptedValue = 'encrypted-cached-value';

      mockProvider.get.mockResolvedValue(encryptedValue);
      jest.spyOn(Encryption.prototype, 'decrypt').mockResolvedValue(secretValue);

      // First call
      const result1 = await manager.get(secretName);
      // Second call should use cache
      const result2 = await manager.get(secretName);

      expect(result1).toBe(secretValue);
      expect(result2).toBe(secretValue);
      expect(mockProvider.get).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it('should handle decryption errors', async () => {
      const secretName = 'CORRUPT_SECRET';
      const encryptedValue = 'corrupted-data';

      mockProvider.get.mockResolvedValue(encryptedValue);
      jest.spyOn(Encryption.prototype, 'decrypt').mockRejectedValue(new Error('Decryption failed'));

      await expect(manager.get(secretName)).rejects.toThrow('Decryption failed');
    });
  });

  describe('set', () => {
    it('should encrypt and store secret', async () => {
      const secretName = 'NEW_SECRET';
      const secretValue = 'new-secret-value';
      const encryptedValue = 'encrypted-new-value';
      const metadata = { setBy: 'test', timestamp: new Date().toISOString() };

      jest.spyOn(Encryption.prototype, 'encrypt').mockResolvedValue(encryptedValue);
      mockProvider.set.mockResolvedValue();

      await manager.set(secretName, secretValue, metadata);

      expect(mockProvider.set).toHaveBeenCalledWith(secretName, encryptedValue, metadata);
    });

    it('should validate secret before setting', async () => {
      const secretName = 'WEAK_SECRET';
      const weakValue = 'weak';

      // Mock validation to fail
      jest.spyOn(manager, 'validate').mockReturnValue({
        valid: false,
        errors: ['Secret does not meet complexity requirements']
      });

      await expect(manager.set(secretName, weakValue)).rejects.toThrow('validation failed');
    });

    it('should clear cache when setting new value', async () => {
      const secretName = 'CACHE_TEST';
      const oldValue = 'old-value';
      const newValue = 'new-value';

      // First, get a value to cache it
      mockProvider.get.mockResolvedValue('encrypted-old');
      jest.spyOn(Encryption.prototype, 'decrypt').mockResolvedValue(oldValue);
      await manager.get(secretName);

      // Now set a new value
      jest.spyOn(Encryption.prototype, 'encrypt').mockResolvedValue('encrypted-new');
      mockProvider.set.mockResolvedValue();
      await manager.set(secretName, newValue);

      // Get again should call provider (not use stale cache)
      mockProvider.get.mockResolvedValue('encrypted-new');
      jest.spyOn(Encryption.prototype, 'decrypt').mockResolvedValue(newValue);
      const result = await manager.get(secretName);

      expect(result).toBe(newValue);
    });
  });

  describe('delete', () => {
    it('should delete secret and clear cache', async () => {
      const secretName = 'DELETE_TEST';

      mockProvider.delete.mockResolvedValue();

      await manager.delete(secretName);

      expect(mockProvider.delete).toHaveBeenCalledWith(secretName);
    });
  });

  describe('exists', () => {
    it('should check if secret exists', async () => {
      const secretName = 'EXISTS_TEST';

      mockProvider.exists.mockResolvedValue(true);

      const result = await manager.exists(secretName);

      expect(result).toBe(true);
      expect(mockProvider.exists).toHaveBeenCalledWith(secretName);
    });
  });

  describe('list', () => {
    it('should list secrets with optional prefix', async () => {
      const secrets = ['SECRET_1', 'SECRET_2', 'API_KEY'];
      const prefix = 'SECRET_';

      mockProvider.list.mockResolvedValue(secrets);

      const result = await manager.list(prefix);

      expect(result).toEqual(secrets);
      expect(mockProvider.list).toHaveBeenCalledWith(prefix);
    });
  });

  describe('rotate', () => {
    it('should rotate secret successfully', async () => {
      const secretName = 'ROTATE_TEST';
      const oldValue = 'old-secret-value';
      const newValue = 'new-secret-value';

      // Mock getting old value
      mockProvider.get.mockResolvedValue('encrypted-old');
      jest.spyOn(Encryption.prototype, 'decrypt').mockResolvedValue(oldValue);

      // Mock generating new value
      jest.spyOn(manager, 'generateRotatedSecret').mockReturnValue(newValue);

      // Mock setting new value
      jest.spyOn(Encryption.prototype, 'encrypt').mockResolvedValue('encrypted-new');
      mockProvider.set.mockResolvedValue();

      const result = await manager.rotate(secretName);

      expect(result.success).toBe(true);
      expect(result.secretName).toBe(secretName);
      expect(result.oldVersion).toBeDefined();
      expect(result.newVersion).toBeDefined();
      expect(result.rotatedAt).toBeDefined();
    });

    it('should handle rotation failure', async () => {
      const secretName = 'FAIL_ROTATE';

      mockProvider.get.mockRejectedValue(new Error('Provider error'));

      const result = await manager.rotate(secretName);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateAll', () => {
    it('should validate all secrets', async () => {
      const secrets = {
        'GOOD_SECRET': 'ValidSecret123!@#',
        'BAD_SECRET': 'weak'
      };

      mockProvider.getAll.mockResolvedValue({
        'GOOD_SECRET': 'encrypted-good',
        'BAD_SECRET': 'encrypted-bad'
      });

      jest.spyOn(Encryption.prototype, 'decrypt')
        .mockResolvedValueOnce('ValidSecret123!@#')
        .mockResolvedValueOnce('weak');

      const result = await manager.validateAll();

      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('export/import', () => {
    it('should export specified secrets', async () => {
      const secretNames = ['SECRET_1', 'SECRET_2'];
      const secrets = {
        'SECRET_1': 'value1',
        'SECRET_2': 'value2'
      };

      mockProvider.get.mockImplementation((name) => {
        return Promise.resolve(`encrypted-${secrets[name as keyof typeof secrets]}`);
      });

      jest.spyOn(Encryption.prototype, 'decrypt').mockImplementation((encrypted) => {
        const value = encrypted.replace('encrypted-', '');
        return Promise.resolve(value);
      });

      const result = await manager.exportSecrets(secretNames);

      expect(result).toBeDefined();
      expect(result.secrets).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should import secrets', async () => {
      const exportedData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        secrets: {
          'IMPORT_SECRET': 'import-value'
        },
        metadata: {}
      };

      jest.spyOn(Encryption.prototype, 'encrypt').mockResolvedValue('encrypted-import-value');
      mockProvider.set.mockResolvedValue();

      await manager.importSecrets(exportedData);

      expect(mockProvider.set).toHaveBeenCalledWith(
        'IMPORT_SECRET',
        'encrypted-import-value',
        expect.any(Object)
      );
    });
  });

  describe('event handling', () => {
    it('should emit events for secret operations', async () => {
      const eventSpy = jest.fn();
      manager.on('secret:get', eventSpy);

      const secretName = 'EVENT_TEST';
      mockProvider.get.mockResolvedValue('encrypted-value');
      jest.spyOn(Encryption.prototype, 'decrypt').mockResolvedValue('decrypted-value');

      await manager.get(secretName);

      expect(eventSpy).toHaveBeenCalledWith({
        secretName,
        operation: 'get',
        timestamp: expect.any(Date),
        success: true
      });
    });

    it('should emit error events on failures', async () => {
      const errorSpy = jest.fn();
      manager.on('secret:error', errorSpy);

      const secretName = 'ERROR_TEST';
      mockProvider.get.mockRejectedValue(new Error('Test error'));

      await expect(manager.get(secretName)).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith({
        secretName,
        operation: 'get',
        error: expect.any(Error),
        timestamp: expect.any(Date)
      });
    });
  });

  describe('HIPAA compliance', () => {
    it('should maintain audit logs', async () => {
      const secretName = 'HIPAA_TEST';
      const auditSpy = jest.spyOn(manager, 'auditLog' as any);

      mockProvider.get.mockResolvedValue('encrypted-value');
      jest.spyOn(Encryption.prototype, 'decrypt').mockResolvedValue('decrypted-value');

      await manager.get(secretName);

      expect(auditSpy).toHaveBeenCalledWith('GET', secretName, expect.any(Object));
    });

    it('should not log secret values in audit', async () => {
      const secretName = 'SENSITIVE_TEST';
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      mockProvider.get.mockResolvedValue('encrypted-sensitive');
      jest.spyOn(Encryption.prototype, 'decrypt').mockResolvedValue('sensitive-value');

      await manager.get(secretName);

      // Check that no log contains the actual secret value
      const logCalls = logSpy.mock.calls.flat();
      const containsSensitiveValue = logCalls.some(call => 
        typeof call === 'string' && call.includes('sensitive-value')
      );

      expect(containsSensitiveValue).toBe(false);

      logSpy.mockRestore();
    });
  });
});