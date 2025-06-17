/**
 * Secrets Manager
 * Central management of application secrets and credentials
 */

import { EventEmitter } from 'events';
import { Logger } from '@locumtruerate/shared';
import { Encryption } from './encryption';
import { SecretsValidator } from './validators';
import type {
  Secret,
  SecretsConfig,
  SecretProvider,
  ServiceSecrets,
  SecretAuditLog,
  SecretRotationResult
} from './types';

export class SecretsManager extends EventEmitter {
  private provider: SecretProvider;
  private encryption: Encryption;
  private validator: SecretsValidator;
  private logger: Logger;
  private cache: Map<string, { value: string; expires: number }> = new Map();
  private auditLogs: SecretAuditLog[] = [];

  constructor(
    private config: SecretsConfig,
    provider: SecretProvider
  ) {
    super();
    this.provider = provider;
    this.encryption = new Encryption(config.encryption);
    this.validator = new SecretsValidator(config.validation);
    this.logger = new Logger('SecretsManager');
  }

  /**
   * Get a secret value
   */
  async get(name: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.getFromCache(name);
      if (cached) {
        return cached;
      }

      // Get from provider
      const encryptedValue = await this.provider.get(name);
      if (!encryptedValue) {
        return null;
      }

      // Decrypt value
      const decryptedValue = await this.encryption.decrypt(encryptedValue);

      // Cache for 5 minutes
      this.setCache(name, decryptedValue, 5 * 60 * 1000);

      // Audit log
      this.logAccess('READ', name, true);

      return decryptedValue;
    } catch (error) {
      this.logger.error(`Failed to get secret ${name}:`, error);
      this.logAccess('READ', name, false, error as Error);
      throw error;
    }
  }

  /**
   * Set a secret value
   */
  async set(name: string, value: string, metadata?: any): Promise<void> {
    try {
      // Validate secret
      const validation = this.validator.validate(value, name);
      if (!validation.isValid) {
        throw new Error(`Invalid secret: ${validation.errors.join(', ')}`);
      }

      // Encrypt value
      const encryptedValue = await this.encryption.encrypt(value);

      // Store in provider
      await this.provider.set(name, encryptedValue, {
        ...metadata,
        encrypted: true,
        version: Date.now(),
        lastUpdated: new Date().toISOString()
      });

      // Clear cache
      this.cache.delete(name);

      // Audit log
      this.logAccess('CREATE', name, true);

      // Emit event
      this.emit('secret:created', { name, metadata });
    } catch (error) {
      this.logger.error(`Failed to set secret ${name}:`, error);
      this.logAccess('CREATE', name, false, error as Error);
      throw error;
    }
  }

  /**
   * Delete a secret
   */
  async delete(name: string): Promise<void> {
    try {
      await this.provider.delete(name);
      this.cache.delete(name);
      
      this.logAccess('DELETE', name, true);
      this.emit('secret:deleted', { name });
    } catch (error) {
      this.logger.error(`Failed to delete secret ${name}:`, error);
      this.logAccess('DELETE', name, false, error as Error);
      throw error;
    }
  }

  /**
   * Rotate a secret
   */
  async rotate(name: string): Promise<SecretRotationResult> {
    const startTime = Date.now();
    
    try {
      // Get current secret
      const currentValue = await this.get(name);
      if (!currentValue) {
        throw new Error(`Secret ${name} not found`);
      }

      // Generate new secret value
      const newValue = await this.generateSecretValue(name);

      // Validate new secret
      const validation = this.validator.validate(newValue, name);
      if (!validation.isValid) {
        throw new Error(`Invalid new secret: ${validation.errors.join(', ')}`);
      }

      // Store new version
      await this.set(name, newValue, {
        rotatedAt: new Date().toISOString(),
        previousVersion: Date.now() - 1
      });

      // Log rotation
      const result: SecretRotationResult = {
        secretName: name,
        oldVersion: Date.now() - 1,
        newVersion: Date.now(),
        rotatedAt: new Date(),
        success: true,
        notificationsSent: []
      };

      this.logAccess('ROTATE', name, true);
      this.emit('secret:rotated', result);

      return result;
    } catch (error) {
      const result: SecretRotationResult = {
        secretName: name,
        oldVersion: Date.now() - 1,
        newVersion: Date.now(),
        rotatedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        notificationsSent: []
      };

      this.logger.error(`Failed to rotate secret ${name}:`, error);
      this.logAccess('ROTATE', name, false, error as Error);
      
      return result;
    }
  }

  /**
   * Get all service secrets
   */
  async getServiceSecrets(): Promise<ServiceSecrets> {
    const secrets: any = {};

    // R2 Storage
    secrets.r2 = {
      accountId: await this.get('R2_ACCOUNT_ID'),
      accessKeyId: await this.get('R2_ACCESS_KEY_ID'),
      secretAccessKey: await this.get('R2_SECRET_ACCESS_KEY'),
      bucket: await this.get('R2_BUCKET')
    };

    // Database
    secrets.database = {
      url: await this.get('DATABASE_URL'),
      host: await this.get('DB_HOST'),
      port: parseInt(await this.get('DB_PORT') || '5432'),
      database: await this.get('DB_NAME'),
      username: await this.get('DB_USER'),
      password: await this.get('DB_PASSWORD'),
      ssl: (await this.get('DB_SSL')) === 'true'
    };

    // Clerk
    secrets.clerk = {
      publishableKey: await this.get('CLERK_PUBLISHABLE_KEY'),
      secretKey: await this.get('CLERK_SECRET_KEY'),
      webhookSecret: await this.get('CLERK_WEBHOOK_SECRET'),
      jwtKey: await this.get('CLERK_JWT_KEY')
    };

    // Stripe
    secrets.stripe = {
      publishableKey: await this.get('STRIPE_PUBLISHABLE_KEY'),
      secretKey: await this.get('STRIPE_SECRET_KEY'),
      webhookSecret: await this.get('STRIPE_WEBHOOK_SECRET'),
      priceIds: {
        basic: await this.get('STRIPE_PRICE_BASIC') || '',
        professional: await this.get('STRIPE_PRICE_PROFESSIONAL') || '',
        enterprise: await this.get('STRIPE_PRICE_ENTERPRISE') || ''
      }
    };

    // Email
    secrets.email = {
      apiKey: await this.get('SENDGRID_API_KEY'),
      fromEmail: await this.get('EMAIL_FROM'),
      fromName: await this.get('EMAIL_FROM_NAME'),
      replyToEmail: await this.get('EMAIL_REPLY_TO'),
      templates: {
        welcome: await this.get('EMAIL_TEMPLATE_WELCOME') || '',
        passwordReset: await this.get('EMAIL_TEMPLATE_PASSWORD_RESET') || '',
        jobAlert: await this.get('EMAIL_TEMPLATE_JOB_ALERT') || '',
        applicationStatus: await this.get('EMAIL_TEMPLATE_APPLICATION_STATUS') || ''
      }
    };

    // JWT
    secrets.jwt = {
      secret: await this.get('JWT_SECRET') || '',
      expiresIn: await this.get('JWT_EXPIRES_IN') || '7d',
      refreshSecret: await this.get('JWT_REFRESH_SECRET'),
      refreshExpiresIn: await this.get('JWT_REFRESH_EXPIRES_IN') || '30d'
    };

    // Encryption
    secrets.encryption = {
      masterKey: await this.get('ENCRYPTION_MASTER_KEY') || '',
      dataKey: await this.get('ENCRYPTION_DATA_KEY'),
      backupKey: await this.get('ENCRYPTION_BACKUP_KEY')
    };

    return secrets as ServiceSecrets;
  }

  /**
   * Validate all secrets
   */
  async validateAll(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const requiredSecrets = [
      'DATABASE_URL',
      'JWT_SECRET',
      'CLERK_SECRET_KEY',
      'STRIPE_SECRET_KEY',
      'SENDGRID_API_KEY',
      'ENCRYPTION_MASTER_KEY'
    ];

    for (const secretName of requiredSecrets) {
      const value = await this.get(secretName);
      if (!value) {
        errors.push(`Missing required secret: ${secretName}`);
        continue;
      }

      const validation = this.validator.validate(value, secretName);
      if (!validation.isValid) {
        errors.push(`Invalid ${secretName}: ${validation.errors.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a new secret value
   */
  private async generateSecretValue(name: string): Promise<string> {
    const type = this.getSecretType(name);
    
    switch (type) {
      case 'API_KEY':
        return this.generateApiKey();
      case 'JWT_SECRET':
        return this.generateJwtSecret();
      case 'ENCRYPTION_KEY':
        return this.generateEncryptionKey();
      case 'DATABASE_URL':
        throw new Error('Database URLs cannot be auto-generated');
      default:
        return this.generateRandomSecret();
    }
  }

  /**
   * Get secret type from name
   */
  private getSecretType(name: string): string {
    if (name.includes('API_KEY')) return 'API_KEY';
    if (name.includes('JWT')) return 'JWT_SECRET';
    if (name.includes('ENCRYPTION')) return 'ENCRYPTION_KEY';
    if (name.includes('DATABASE')) return 'DATABASE_URL';
    return 'GENERIC';
  }

  /**
   * Generate API key
   */
  private generateApiKey(): string {
    const prefix = 'ltr_';
    const randomBytes = require('crypto').randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  /**
   * Generate JWT secret
   */
  private generateJwtSecret(): string {
    return require('crypto').randomBytes(64).toString('hex');
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return require('crypto').randomBytes(32).toString('base64');
  }

  /**
   * Generate random secret
   */
  private generateRandomSecret(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Get from cache
   */
  private getFromCache(name: string): string | null {
    const cached = this.cache.get(name);
    if (!cached) return null;
    
    if (cached.expires < Date.now()) {
      this.cache.delete(name);
      return null;
    }
    
    return cached.value;
  }

  /**
   * Set cache
   */
  private setCache(name: string, value: string, ttl: number): void {
    this.cache.set(name, {
      value,
      expires: Date.now() + ttl
    });
  }

  /**
   * Log access
   */
  private logAccess(
    action: SecretAuditLog['action'],
    secretName: string,
    success: boolean,
    error?: Error
  ): void {
    const log: SecretAuditLog = {
      id: require('uuid').v4(),
      timestamp: new Date(),
      action,
      secretName,
      success,
      error: error?.message
    };

    this.auditLogs.push(log);

    // Keep only last 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit: number = 100): SecretAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}