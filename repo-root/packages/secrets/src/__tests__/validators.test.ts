/**
 * Validators Tests
 * Testing secret validation rules and complexity requirements
 */

import { SecretsValidator } from '../validators';

describe('SecretsValidator', () => {
  beforeEach(() => {
    // Reset validation rules before each test
    SecretsValidator.clearRules();
    
    // Add default rules
    SecretsValidator.addRules({
      'API_KEY': {
        pattern: /^[A-Za-z0-9]{32,}$/,
        minLength: 32,
        message: 'API key must be at least 32 alphanumeric characters'
      },
      'DATABASE_URL': {
        pattern: /^postgres(ql)?:\/\/.+$/,
        message: 'Database URL must be a valid PostgreSQL connection string'
      },
      'EMAIL': {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Must be a valid email address'
      },
      'JWT_SECRET': {
        minLength: 64,
        requireComplexity: true,
        message: 'JWT secret must be at least 64 characters with high complexity'
      }
    });
  });

  describe('validate', () => {
    it('should validate correct API key', () => {
      const result = SecretsValidator.validate('API_KEY', 'abcdef1234567890abcdef1234567890');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short API key', () => {
      const result = SecretsValidator.validate('API_KEY', 'short');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key must be at least 32 alphanumeric characters');
    });

    it('should reject API key with invalid characters', () => {
      const result = SecretsValidator.validate('API_KEY', 'abcdef1234567890abcdef1234567890!@#');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key must be at least 32 alphanumeric characters');
    });

    it('should validate correct database URL', () => {
      const result = SecretsValidator.validate('DATABASE_URL', 'postgresql://user:pass@host:5432/db');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid database URL', () => {
      const result = SecretsValidator.validate('DATABASE_URL', 'mysql://user:pass@host/db');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Database URL must be a valid PostgreSQL connection string');
    });

    it('should validate correct email', () => {
      const result = SecretsValidator.validate('EMAIL', 'test@example.com');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid email', () => {
      const result = SecretsValidator.validate('EMAIL', 'invalid-email');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must be a valid email address');
    });

    it('should validate complex JWT secret', () => {
      const complexSecret = 'MyVeryComplexJWTSecret123!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef';
      const result = SecretsValidator.validate('JWT_SECRET', complexSecret);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short JWT secret', () => {
      const result = SecretsValidator.validate('JWT_SECRET', 'short');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeTruthy();
    });

    it('should pass unknown secret types', () => {
      const result = SecretsValidator.validate('UNKNOWN_SECRET', 'any_value');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateAll', () => {
    it('should validate all secrets correctly', () => {
      const secrets = {
        'API_KEY': 'abcdef1234567890abcdef1234567890',
        'DATABASE_URL': 'postgresql://user:pass@host:5432/db',
        'EMAIL': 'test@example.com'
      };
      
      const result = SecretsValidator.validateAll(secrets);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const secrets = {
        'API_KEY': 'short',
        'DATABASE_URL': 'invalid-url',
        'EMAIL': 'invalid-email'
      };
      
      const result = SecretsValidator.validateAll(secrets);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('API_KEY: API key must be at least 32 alphanumeric characters');
      expect(result.errors).toContain('DATABASE_URL: Database URL must be a valid PostgreSQL connection string');
      expect(result.errors).toContain('EMAIL: Must be a valid email address');
    });

    it('should handle empty secrets object', () => {
      const result = SecretsValidator.validateAll({});
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateSecureSecret', () => {
    it('should generate secret of specified length', () => {
      const secret = SecretsValidator.generateSecureSecret(32);
      
      expect(secret).toBeDefined();
      expect(secret.length).toBe(32);
    });

    it('should generate secret with default length', () => {
      const secret = SecretsValidator.generateSecureSecret();
      
      expect(secret).toBeDefined();
      expect(secret.length).toBe(32); // Default length
    });

    it('should generate different secrets each time', () => {
      const secret1 = SecretsValidator.generateSecureSecret(32);
      const secret2 = SecretsValidator.generateSecureSecret(32);
      
      expect(secret1).not.toBe(secret2);
    });

    it('should include specified character types', () => {
      const secret = SecretsValidator.generateSecureSecret(64, {
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecial: true
      });
      
      expect(secret).toMatch(/[A-Z]/); // Contains uppercase
      expect(secret).toMatch(/[a-z]/); // Contains lowercase
      expect(secret).toMatch(/[0-9]/); // Contains numbers
      expect(secret).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // Contains special chars
    });

    it('should exclude specified character types', () => {
      const secret = SecretsValidator.generateSecureSecret(32, {
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: false,
        includeSpecial: false
      });
      
      expect(secret).not.toMatch(/[0-9]/); // No numbers
      expect(secret).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // No special chars
    });
  });

  describe('checkComplexity', () => {
    it('should pass high complexity password', () => {
      const result = SecretsValidator.checkComplexity('MyVeryComplexPassword123!@#');
      
      expect(result.score).toBeGreaterThan(70);
      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumbers).toBe(true);
      expect(result.hasSpecial).toBe(true);
      expect(result.length).toBe(25);
    });

    it('should fail low complexity password', () => {
      const result = SecretsValidator.checkComplexity('password');
      
      expect(result.score).toBeLessThan(50);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasNumbers).toBe(false);
      expect(result.hasSpecial).toBe(false);
    });

    it('should handle empty string', () => {
      const result = SecretsValidator.checkComplexity('');
      
      expect(result.score).toBe(0);
      expect(result.length).toBe(0);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(false);
      expect(result.hasNumbers).toBe(false);
      expect(result.hasSpecial).toBe(false);
    });
  });

  describe('HIPAA compliance', () => {
    it('should validate HIPAA encryption key format', () => {
      SecretsValidator.addRules({
        'HIPAA_ENCRYPTION_KEY': {
          minLength: 64,
          requireComplexity: true,
          pattern: /^[A-Za-z0-9+/]+=*$/,
          message: 'HIPAA encryption key must be base64 encoded and at least 64 characters'
        }
      });

      const validKey = 'QWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo=';
      const result = SecretsValidator.validate('HIPAA_ENCRYPTION_KEY', validKey);
      
      expect(result.valid).toBe(true);
    });

    it('should reject weak HIPAA keys', () => {
      SecretsValidator.addRules({
        'HIPAA_ENCRYPTION_KEY': {
          minLength: 64,
          requireComplexity: true,
          message: 'HIPAA encryption key must be strong'
        }
      });

      const weakKey = 'weak';
      const result = SecretsValidator.validate('HIPAA_ENCRYPTION_KEY', weakKey);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('custom rules', () => {
    it('should allow adding custom validation rules', () => {
      SecretsValidator.addRules({
        'CUSTOM_SECRET': {
          pattern: /^custom_[a-z0-9]{16}$/,
          message: 'Custom secret must start with custom_ followed by 16 lowercase alphanumeric characters'
        }
      });

      const validSecret = 'custom_1234567890abcdef';
      const result = SecretsValidator.validate('CUSTOM_SECRET', validSecret);
      
      expect(result.valid).toBe(true);
    });

    it('should allow clearing all rules', () => {
      SecretsValidator.clearRules();
      
      // Should pass any validation after clearing rules
      const result = SecretsValidator.validate('API_KEY', 'short');
      expect(result.valid).toBe(true);
    });
  });
});