/**
 * Security Validators
 * Input validation and sanitization for security
 */

import Joi from 'joi';
import { escape } from 'html-escaper';
import type { ValidationRule } from './types';

export class SecurityValidators {
  
  /**
   * Validate user registration data
   */
  static validateUserRegistration(data: any) {
    const schema = Joi.object({
      email: Joi.string()
        .email({ minDomainSegments: 2 })
        .required()
        .max(255)
        .lowercase()
        .trim(),
      
      password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }),
      
      name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-Z\s\-\.\']+$/)
        .required()
        .trim(),
      
      phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional(),
      
      role: Joi.string()
        .valid('CANDIDATE', 'EMPLOYER', 'ADMIN')
        .required()
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate job posting data
   */
  static validateJobPosting(data: any) {
    const schema = Joi.object({
      title: Joi.string()
        .min(10)
        .max(200)
        .required()
        .trim(),
      
      description: Joi.string()
        .min(50)
        .max(5000)
        .required()
        .trim(),
      
      company: Joi.string()
        .min(2)
        .max(100)
        .required()
        .trim(),
      
      location: Joi.string()
        .min(2)
        .max(200)
        .required()
        .trim(),
      
      salaryMin: Joi.number()
        .integer()
        .min(0)
        .max(10000000)
        .optional(),
      
      salaryMax: Joi.number()
        .integer()
        .min(Joi.ref('salaryMin'))
        .max(10000000)
        .optional(),
      
      employmentType: Joi.string()
        .valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'LOCUM', 'PERMANENT')
        .required(),
      
      specialty: Joi.string()
        .valid(
          'FAMILY_MEDICINE', 'INTERNAL_MEDICINE', 'EMERGENCY_MEDICINE',
          'PEDIATRICS', 'SURGERY', 'ANESTHESIOLOGY', 'RADIOLOGY',
          'PATHOLOGY', 'PSYCHIATRY', 'OTHER'
        )
        .required(),
      
      requirements: Joi.array()
        .items(Joi.string().max(500))
        .max(20)
        .optional(),
      
      benefits: Joi.array()
        .items(Joi.string().max(500))
        .max(20)
        .optional(),
      
      contactEmail: Joi.string()
        .email()
        .required(),
      
      contactPhone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional(),
      
      remote: Joi.boolean()
        .default(false),
      
      urgent: Joi.boolean()
        .default(false)
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate job application data
   */
  static validateJobApplication(data: any) {
    const schema = Joi.object({
      jobId: Joi.string()
        .pattern(/^[a-zA-Z0-9_-]+$/)
        .required(),
      
      candidateId: Joi.string()
        .pattern(/^[a-zA-Z0-9_-]+$/)
        .required(),
      
      coverLetter: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .trim(),
      
      resume: Joi.string()
        .uri()
        .optional(),
      
      availableStartDate: Joi.date()
        .min('now')
        .optional(),
      
      expectedSalary: Joi.number()
        .integer()
        .min(0)
        .max(10000000)
        .optional()
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate profile update data
   */
  static validateProfileUpdate(data: any) {
    const schema = Joi.object({
      bio: Joi.string()
        .max(1000)
        .optional()
        .trim(),
      
      website: Joi.string()
        .uri()
        .optional(),
      
      licenseNumber: Joi.string()
        .pattern(/^[A-Z0-9]{5,20}$/)
        .optional(),
      
      licenseState: Joi.string()
        .length(2)
        .uppercase()
        .optional(),
      
      certifications: Joi.array()
        .items(Joi.string().max(100))
        .max(20)
        .optional(),
      
      experience: Joi.array()
        .items(Joi.string().max(500))
        .max(10)
        .optional(),
      
      education: Joi.array()
        .items(Joi.string().max(500))
        .max(10)
        .optional(),
      
      socialLinks: Joi.object({
        linkedin: Joi.string().uri().optional(),
        twitter: Joi.string().uri().optional(),
        facebook: Joi.string().uri().optional()
      }).optional()
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate search query parameters
   */
  static validateSearchQuery(data: any) {
    const schema = Joi.object({
      q: Joi.string()
        .max(200)
        .optional()
        .trim(),
      
      location: Joi.string()
        .max(200)
        .optional()
        .trim(),
      
      specialty: Joi.string()
        .valid(
          'FAMILY_MEDICINE', 'INTERNAL_MEDICINE', 'EMERGENCY_MEDICINE',
          'PEDIATRICS', 'SURGERY', 'ANESTHESIOLOGY', 'RADIOLOGY',
          'PATHOLOGY', 'PSYCHIATRY', 'OTHER'
        )
        .optional(),
      
      employmentType: Joi.string()
        .valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'LOCUM', 'PERMANENT')
        .optional(),
      
      salaryMin: Joi.number()
        .integer()
        .min(0)
        .max(10000000)
        .optional(),
      
      salaryMax: Joi.number()
        .integer()
        .min(Joi.ref('salaryMin'))
        .max(10000000)
        .optional(),
      
      remote: Joi.boolean()
        .optional(),
      
      page: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .default(1),
      
      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Validate support ticket data
   */
  static validateSupportTicket(data: any) {
    const schema = Joi.object({
      subject: Joi.string()
        .min(5)
        .max(200)
        .required()
        .trim(),
      
      description: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .trim(),
      
      category: Joi.string()
        .valid('TECHNICAL', 'BILLING', 'ACCOUNT', 'GENERAL')
        .required(),
      
      priority: Joi.string()
        .valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
        .default('MEDIUM'),
      
      email: Joi.string()
        .email()
        .required(),
      
      name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .trim()
    });

    return schema.validate(data, { abortEarly: false });
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    return escape(input);
  }

  /**
   * Sanitize text input for database storage
   */
  static sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 10000); // Limit length
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: any) {
    const schema = Joi.object({
      filename: Joi.string()
        .pattern(/^[a-zA-Z0-9._-]+$/)
        .max(255)
        .required(),
      
      mimetype: Joi.string()
        .valid(
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/gif'
        )
        .required(),
      
      size: Joi.number()
        .integer()
        .max(10 * 1024 * 1024) // 10MB max
        .required()
    });

    return schema.validate(file, { abortEarly: false });
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    // API keys should be at least 32 characters and contain only safe characters
    const pattern = /^[a-zA-Z0-9_-]{32,}$/;
    return pattern.test(apiKey);
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 20;
    else feedback.push('Password should be at least 8 characters long');

    if (password.length >= 12) score += 10;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 15;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    else feedback.push('Include special characters');

    // Common password patterns
    if (!/(.)\1{2,}/.test(password)) score += 10;
    else feedback.push('Avoid repeating characters');

    return {
      isValid: score >= 70,
      score,
      feedback
    };
  }

  /**
   * Validate email domain for healthcare organizations
   */
  static validateHealthcareEmailDomain(email: string): boolean {
    const healthcareDomains = [
      // Common healthcare domains
      '.health', '.med', '.hospital', '.clinic', '.medical'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    // Allow common business domains for now
    const allowedDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'icloud.com', 'aol.com'
    ];

    return allowedDomains.includes(domain) || 
           healthcareDomains.some(hDomain => domain.includes(hDomain));
  }

  /**
   * Custom validation rule executor
   */
  static executeCustomValidation(value: any, rules: ValidationRule[]): {
    isValid: boolean;
    errors: string[];
    sanitizedValue: any;
  } {
    const errors: string[] = [];
    let sanitizedValue = value;

    for (const rule of rules) {
      // Required check
      if (rule.required && (!value || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (!value && !rule.required) continue;

      // Type-specific validation
      switch (rule.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(`${rule.field} must be a valid email`);
          }
          break;

        case 'phone':
          if (!/^\+?[1-9]\d{1,14}$/.test(value)) {
            errors.push(`${rule.field} must be a valid phone number`);
          }
          break;

        case 'password':
          const passwordCheck = this.validatePasswordStrength(value);
          if (!passwordCheck.isValid) {
            errors.push(`${rule.field}: ${passwordCheck.feedback.join(', ')}`);
          }
          break;
      }

      // Length checks
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.field} must be no more than ${rule.maxLength} characters`);
      }

      // Pattern check
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`);
      }

      // Custom validator
      if (rule.customValidator) {
        const result = rule.customValidator(value);
        if (typeof result === 'string') {
          errors.push(result);
        } else if (!result) {
          errors.push(`${rule.field} is invalid`);
        }
      }

      // Sanitization
      if (rule.sanitize && typeof value === 'string') {
        sanitizedValue = this.sanitizeText(value);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };
  }
}