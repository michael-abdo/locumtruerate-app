/**
 * Secrets Validator
 * Validates secret values based on type and complexity requirements
 */

import Joi from 'joi';
import type { SecretValidation } from './types';

export class SecretsValidator {
  private config: SecretValidation;

  constructor(config?: SecretValidation) {
    this.config = config || {
      enforceComplexity: true,
      minLength: 12,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true
    };
  }

  /**
   * Validate a secret value
   */
  validate(value: string, secretName: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if empty
    if (!value || value.trim() === '') {
      errors.push('Secret value cannot be empty');
      return { isValid: false, errors };
    }

    // Check minimum length
    if (value.length < this.config.minLength) {
      errors.push(`Secret must be at least ${this.config.minLength} characters long`);
    }

    // Apply complexity rules based on secret type
    const secretType = this.getSecretType(secretName);
    
    switch (secretType) {
      case 'API_KEY':
        this.validateApiKey(value, errors);
        break;
      case 'DATABASE_URL':
        this.validateDatabaseUrl(value, errors);
        break;
      case 'JWT_SECRET':
        this.validateJwtSecret(value, errors);
        break;
      case 'EMAIL':
        this.validateEmail(value, errors);
        break;
      case 'WEBHOOK_SECRET':
        this.validateWebhookSecret(value, errors);
        break;
      default:
        this.validateGenericSecret(value, errors);
    }

    // Apply custom validators if any
    if (this.config.customValidators?.[secretName]) {
      const customResult = this.config.customValidators[secretName](value);
      if (typeof customResult === 'string') {
        errors.push(customResult);
      } else if (!customResult) {
        errors.push(`Custom validation failed for ${secretName}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get secret type from name
   */
  private getSecretType(name: string): string {
    const upperName = name.toUpperCase();
    
    if (upperName.includes('API_KEY') || upperName.includes('APIKEY')) {
      return 'API_KEY';
    }
    if (upperName.includes('DATABASE_URL') || upperName.includes('DB_')) {
      return 'DATABASE_URL';
    }
    if (upperName.includes('JWT')) {
      return 'JWT_SECRET';
    }
    if (upperName.includes('EMAIL') || upperName.includes('SENDGRID')) {
      return 'EMAIL';
    }
    if (upperName.includes('WEBHOOK')) {
      return 'WEBHOOK_SECRET';
    }
    
    return 'GENERIC';
  }

  /**
   * Validate API key format
   */
  private validateApiKey(value: string, errors: string[]): void {
    // API keys should be alphanumeric with optional underscores/hyphens
    const apiKeyPattern = /^[a-zA-Z0-9_-]+$/;
    
    if (!apiKeyPattern.test(value)) {
      errors.push('API key must contain only letters, numbers, underscores, and hyphens');
    }

    if (value.length < 32) {
      errors.push('API key must be at least 32 characters long');
    }

    // Check for common weak patterns
    if (value.includes('test') || value.includes('demo') || value.includes('example')) {
      errors.push('API key contains weak patterns (test/demo/example)');
    }
  }

  /**
   * Validate database URL
   */
  private validateDatabaseUrl(value: string, errors: string[]): void {
    const schema = Joi.string().uri({
      scheme: ['postgres', 'postgresql', 'mysql', 'mongodb']
    });

    const { error } = schema.validate(value);
    if (error) {
      errors.push('Invalid database URL format');
    }

    // Check for default/weak credentials
    if (value.includes('root:root') || 
        value.includes('admin:admin') || 
        value.includes('postgres:postgres')) {
      errors.push('Database URL contains default credentials');
    }

    // Ensure SSL for production
    if (process.env.NODE_ENV === 'production' && !value.includes('ssl=true')) {
      errors.push('Database URL must use SSL in production');
    }
  }

  /**
   * Validate JWT secret
   */
  private validateJwtSecret(value: string, errors: string[]): void {
    if (value.length < 64) {
      errors.push('JWT secret must be at least 64 characters long');
    }

    // Should be high entropy
    const entropy = this.calculateEntropy(value);
    if (entropy < 4.0) {
      errors.push('JWT secret has low entropy - use a more random value');
    }

    // Check for common weak secrets
    const weakSecrets = ['secret', 'password', 'changeme', 'yoursecret'];
    if (weakSecrets.some(weak => value.toLowerCase().includes(weak))) {
      errors.push('JWT secret contains common weak patterns');
    }
  }

  /**
   * Validate email configuration
   */
  private validateEmail(value: string, errors: string[]): void {
    // If it's an API key (SendGrid)
    if (value.startsWith('SG.')) {
      if (value.length < 69) {
        errors.push('SendGrid API key appears invalid');
      }
    } else if (value.includes('@')) {
      // Validate email format
      const emailSchema = Joi.string().email();
      const { error } = emailSchema.validate(value);
      if (error) {
        errors.push('Invalid email format');
      }
    }
  }

  /**
   * Validate webhook secret
   */
  private validateWebhookSecret(value: string, errors: string[]): void {
    if (value.length < 32) {
      errors.push('Webhook secret must be at least 32 characters long');
    }

    // Should contain mix of characters
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
      errors.push('Webhook secret should contain lowercase, uppercase, and numbers');
    }
  }

  /**
   * Validate generic secret
   */
  private validateGenericSecret(value: string, errors: string[]): void {
    if (!this.config.enforceComplexity) {
      return;
    }

    // Check for uppercase
    if (this.config.requireUppercase && !/[A-Z]/.test(value)) {
      errors.push('Secret must contain at least one uppercase letter');
    }

    // Check for numbers
    if (this.config.requireNumbers && !/[0-9]/.test(value)) {
      errors.push('Secret must contain at least one number');
    }

    // Check for special characters
    if (this.config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      errors.push('Secret must contain at least one special character');
    }
  }

  /**
   * Calculate entropy of a string
   */
  private calculateEntropy(value: string): number {
    const charFrequency: Record<string, number> = {};
    const len = value.length;

    // Calculate character frequency
    for (const char of value) {
      charFrequency[char] = (charFrequency[char] || 0) + 1;
    }

    // Calculate entropy
    let entropy = 0;
    for (const char in charFrequency) {
      const frequency = charFrequency[char] / len;
      entropy -= frequency * Math.log2(frequency);
    }

    return entropy;
  }

  /**
   * Generate secure random secret
   */
  static generateSecureSecret(length: number = 32, options?: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSpecial?: boolean;
  }): string {
    const opts = {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSpecial: true,
      ...options
    };

    let charset = '';
    if (opts.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (opts.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (opts.includeNumbers) charset += '0123456789';
    if (opts.includeSpecial) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      throw new Error('At least one character set must be included');
    }

    const crypto = require('crypto');
    let secret = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      secret += charset[randomIndex];
    }

    return secret;
  }

  /**
   * Validate environment-specific requirements
   */
  validateForEnvironment(
    value: string,
    secretName: string,
    environment: 'development' | 'staging' | 'production'
  ): { isValid: boolean; errors: string[] } {
    const baseValidation = this.validate(value, secretName);
    const errors = [...baseValidation.errors];

    // Production-specific validations
    if (environment === 'production') {
      // No test/demo values in production
      if (value.toLowerCase().includes('test') || 
          value.toLowerCase().includes('demo') ||
          value.toLowerCase().includes('example')) {
        errors.push('Production secrets cannot contain test/demo/example');
      }

      // Stronger requirements for production
      if (value.length < 24) {
        errors.push('Production secrets must be at least 24 characters');
      }

      // Database URLs must use SSL
      if (secretName.includes('DATABASE') && !value.includes('ssl')) {
        errors.push('Production database connections must use SSL');
      }
    }

    // Development warnings (not errors)
    if (environment === 'development') {
      // These are warnings, not blocking errors
      console.warn(`⚠️  Development secret ${secretName} validation warnings:`);
      if (value.length < this.config.minLength) {
        console.warn(`   - Consider using longer secrets even in development`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Healthcare-specific validations
   */
  validateHealthcareCompliance(value: string, secretName: string): { isValid: boolean; errors: string[] } {
    const baseValidation = this.validate(value, secretName);
    const errors = [...baseValidation.errors];

    // HIPAA compliance requirements
    if (secretName.includes('HIPAA') || secretName.includes('PHI')) {
      if (value.length < 32) {
        errors.push('HIPAA-related secrets must be at least 32 characters');
      }

      // Must be high entropy
      const entropy = this.calculateEntropy(value);
      if (entropy < 4.5) {
        errors.push('HIPAA-related secrets require higher entropy');
      }
    }

    // Medical API keys
    if (secretName.includes('NPI') || secretName.includes('MEDICAL')) {
      if (!value.match(/^[A-Z0-9]{20,}$/)) {
        errors.push('Medical API keys must be uppercase alphanumeric, minimum 20 characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}