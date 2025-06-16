/**
 * Encryption Tests
 * Testing AES-256-GCM encryption with key derivation
 */

import { Encryption } from '../encryption';

describe('Encryption', () => {
  let encryption: Encryption;
  const testMasterKey = 'test-master-key-with-sufficient-length-for-security';

  beforeEach(() => {
    encryption = new Encryption({
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      masterKey: testMasterKey
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const plaintext = 'test-secret-value';
      
      const encrypted = await encryption.encrypt(plaintext);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);

      const decrypted = await encryption.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should generate different ciphertext for same plaintext', async () => {
      const plaintext = 'test-secret-value';
      
      const encrypted1 = await encryption.encrypt(plaintext);
      const encrypted2 = await encryption.encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      const decrypted1 = await encryption.decrypt(encrypted1);
      const decrypted2 = await encryption.decrypt(encrypted2);
      
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('should handle empty strings', async () => {
      const plaintext = '';
      
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters and unicode', async () => {
      const plaintext = 'Special chars: !@#$%^&*()_+ 🔑 Üñîçödé';
      
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid encrypted data', async () => {
      await expect(encryption.decrypt('invalid-encrypted-data')).rejects.toThrow();
      await expect(encryption.decrypt('')).rejects.toThrow();
      await expect(encryption.decrypt('too-short')).rejects.toThrow();
    });
  });

  describe('key generation', () => {
    it('should generate secure keys', () => {
      const key = Encryption.generateKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(32);
      expect(key).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 pattern
    });

    it('should generate different keys each time', () => {
      const key1 = Encryption.generateKey();
      const key2 = Encryption.generateKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('key derivation', () => {
    it('should derive consistent keys from same password and salt', async () => {
      const password = 'test-password';
      const salt = 'test-salt';
      
      const key1 = await Encryption.deriveKey(password, salt);
      const key2 = await Encryption.deriveKey(password, salt);
      
      expect(key1).toEqual(key2);
    });

    it('should derive different keys for different salts', async () => {
      const password = 'test-password';
      
      const key1 = await Encryption.deriveKey(password, 'salt1');
      const key2 = await Encryption.deriveKey(password, 'salt2');
      
      expect(key1).not.toEqual(key2);
    });

    it('should derive different keys for different passwords', async () => {
      const salt = 'test-salt';
      
      const key1 = await Encryption.deriveKey('password1', salt);
      const key2 = await Encryption.deriveKey('password2', salt);
      
      expect(key1).not.toEqual(key2);
    });
  });

  describe('algorithm support', () => {
    it('should support AES-256-GCM', () => {
      const encAes = new Encryption({
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2',
        masterKey: testMasterKey
      });
      
      expect(encAes).toBeDefined();
    });

    it('should support PBKDF2 key derivation', () => {
      const encPbkdf2 = new Encryption({
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2',
        masterKey: testMasterKey
      });
      
      expect(encPbkdf2).toBeDefined();
    });

    it('should support SCRYPT key derivation', () => {
      const encScrypt = new Encryption({
        algorithm: 'AES-256-GCM',
        keyDerivation: 'SCRYPT',
        masterKey: testMasterKey
      });
      
      expect(encScrypt).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should encrypt/decrypt within reasonable time', async () => {
      const plaintext = 'test-secret-value';
      const startTime = Date.now();
      
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(decrypted).toBe(plaintext);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});