/**
 * Encryption Service
 * Handles encryption and decryption of secret values
 */

import CryptoJS from 'crypto-js';
import { createHash, randomBytes, scrypt, createCipheriv, createDecipheriv } from 'crypto';
import { promisify } from 'util';
import type { EncryptionConfig } from './types';

const scryptAsync = promisify(scrypt);

export class Encryption {
  private masterKey: string;
  private algorithm: string;

  constructor(private config: EncryptionConfig) {
    this.algorithm = config.algorithm || 'AES-256-GCM';
    this.masterKey = this.getMasterKey();
  }

  /**
   * Encrypt a value
   */
  async encrypt(value: string): Promise<string> {
    if (this.algorithm === 'AES-256-GCM') {
      return this.encryptAesGcm(value);
    } else {
      return this.encryptAesCbc(value);
    }
  }

  /**
   * Decrypt a value
   */
  async decrypt(encryptedValue: string): Promise<string> {
    if (this.algorithm === 'AES-256-GCM') {
      return this.decryptAesGcm(encryptedValue);
    } else {
      return this.decryptAesCbc(encryptedValue);
    }
  }

  /**
   * Encrypt using AES-256-GCM
   */
  private async encryptAesGcm(value: string): Promise<string> {
    try {
      // Generate random IV
      const iv = randomBytes(16);
      
      // Derive key from master key
      const key = await this.deriveKey(this.masterKey, iv.toString('hex'));
      
      // Create cipher
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      
      // Encrypt
      const encrypted = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final()
      ]);
      
      // Get auth tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV + authTag + encrypted
      const combined = Buffer.concat([iv, authTag, encrypted]);
      
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt using AES-256-GCM
   */
  private async decryptAesGcm(encryptedValue: string): Promise<string> {
    try {
      const combined = Buffer.from(encryptedValue, 'base64');
      
      // Extract components
      const iv = combined.slice(0, 16);
      const authTag = combined.slice(16, 32);
      const encrypted = combined.slice(32);
      
      // Derive key
      const key = await this.deriveKey(this.masterKey, iv.toString('hex'));
      
      // Create decipher
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Encrypt using AES-256-CBC (fallback)
   */
  private async encryptAesCbc(value: string): Promise<string> {
    const encrypted = CryptoJS.AES.encrypt(value, this.masterKey, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return encrypted.toString();
  }

  /**
   * Decrypt using AES-256-CBC (fallback)
   */
  private async decryptAesCbc(encryptedValue: string): Promise<string> {
    const decrypted = CryptoJS.AES.decrypt(encryptedValue, this.masterKey, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Derive encryption key from master key
   */
  private async deriveKey(masterKey: string, salt: string): Promise<Buffer> {
    if (this.config.keyDerivation === 'SCRYPT') {
      return scryptAsync(masterKey, salt, 32) as Promise<Buffer>;
    } else {
      // PBKDF2 fallback
      const iterations = this.config.saltRounds || 100000;
      return new Promise((resolve, reject) => {
        require('crypto').pbkdf2(masterKey, salt, iterations, 32, 'sha256', (err, key) => {
          if (err) reject(err);
          else resolve(key);
        });
      });
    }
  }

  /**
   * Get master key from configured source
   */
  private getMasterKey(): string {
    switch (this.config.masterKeySource) {
      case 'env':
        const envKey = process.env.ENCRYPTION_MASTER_KEY || this.config.masterKey;
        if (!envKey) {
          throw new Error('Master encryption key not found in environment');
        }
        return envKey;
        
      case 'file':
        // In production, read from secure file
        throw new Error('File-based master key not implemented');
        
      case 'kms':
        // In production, fetch from KMS
        throw new Error('KMS-based master key not implemented');
        
      default:
        throw new Error('Invalid master key source');
    }
  }

  /**
   * Generate a new encryption key
   */
  static generateKey(): string {
    return randomBytes(32).toString('base64');
  }

  /**
   * Generate a new salt
   */
  static generateSalt(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Hash a value (one-way)
   */
  static hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  /**
   * Compare hash
   */
  static verifyHash(value: string, hash: string): boolean {
    return this.hash(value) === hash;
  }

  /**
   * Encrypt for specific services (with service-specific keys)
   */
  async encryptForService(value: string, service: string): Promise<string> {
    // Derive service-specific key
    const serviceKey = await this.deriveKey(this.masterKey, `service:${service}`);
    const serviceKeyString = serviceKey.toString('base64');
    
    // Use service key for encryption
    const encrypted = CryptoJS.AES.encrypt(value, serviceKeyString, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return `${service}:${encrypted.toString()}`;
  }

  /**
   * Decrypt for specific services
   */
  async decryptForService(encryptedValue: string): Promise<string> {
    const [service, encrypted] = encryptedValue.split(':', 2);
    
    // Derive service-specific key
    const serviceKey = await this.deriveKey(this.masterKey, `service:${service}`);
    const serviceKeyString = serviceKey.toString('base64');
    
    // Decrypt with service key
    const decrypted = CryptoJS.AES.decrypt(encrypted, serviceKeyString, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Rotate encryption (re-encrypt with new key)
   */
  async rotateEncryption(
    encryptedValue: string,
    newMasterKey: string
  ): Promise<string> {
    // Decrypt with current key
    const decrypted = await this.decrypt(encryptedValue);
    
    // Create new encryption instance with new key
    const newEncryption = new Encryption({
      ...this.config,
      masterKey: newMasterKey
    });
    
    // Encrypt with new key
    return newEncryption.encrypt(decrypted);
  }

  /**
   * Validate encrypted value format
   */
  isValidEncryptedValue(value: string): boolean {
    try {
      if (this.algorithm === 'AES-256-GCM') {
        const decoded = Buffer.from(value, 'base64');
        return decoded.length >= 48; // IV (16) + authTag (16) + min data (16)
      } else {
        // Check if it's valid CryptoJS format
        return value.includes('U2FsdGVkX1'); // CryptoJS prefix
      }
    } catch {
      return false;
    }
  }
}