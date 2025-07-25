/**
 * Centralized Validation Schemas
 * 
 * This module consolidates all Joi validation schemas used across the application
 * to eliminate duplication and ensure consistency in validation rules.
 * 
 * Organization:
 * - Base schemas (reusable components)
 * - Common field schemas
 * - Pagination and query schemas
 * - Feature-specific schema builders
 */

const Joi = require('joi');

// =============================================================================
// BASE REUSABLE SCHEMAS
// =============================================================================

const baseSchemas = {
  // Basic field types
  email: Joi.string().email().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  
  password: Joi.string().min(6).messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  
  name: Joi.string().min(1).max(100).messages({
    'string.min': 'Name is required',
    'string.max': 'Name must be less than 100 characters',
    'any.required': 'Name is required'
  }),
  
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  
  // State code validation
  stateCode: Joi.string().length(2).uppercase(),
  
  // Common text fields
  shortText: Joi.string().max(255),
  longText: Joi.string().max(5000),
  notes: Joi.string().max(1000),
  
  // Numeric fields
  positiveInteger: Joi.number().integer().positive(),
  nonNegativeNumber: Joi.number().min(0),
  hourlyRate: Joi.number().min(0).max(2000),
  
  // Date fields
  futureDate: Joi.date().iso().min('now'),
  pastOrPresentDate: Joi.date().iso().max('now'),
  anyDate: Joi.date().iso()
};

// =============================================================================
// COMMON STATUS VALUES
// =============================================================================

const statusValues = {
  applicationStatuses: ['pending', 'reviewed', 'accepted', 'rejected', 'withdrawn'],
  jobStatuses: ['draft', 'active', 'filled', 'closed'],
  userRoles: ['locum', 'recruiter', 'admin']
};

// =============================================================================
// PAGINATION AND QUERY SCHEMAS
// =============================================================================

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

const searchQuerySchema = Joi.object({
  search: Joi.string().max(200).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional()
});

// =============================================================================
// AUTHENTICATION SCHEMAS
// =============================================================================

const authSchemas = {
  register: Joi.object({
    email: baseSchemas.email.required(),
    password: baseSchemas.password.required(),
    firstName: baseSchemas.name.required(),
    lastName: baseSchemas.name.required(),
    phone: baseSchemas.phone.optional(),
    role: Joi.string().valid(...statusValues.userRoles).default('locum')
  }),
  
  login: Joi.object({
    email: baseSchemas.email.required(),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  })
};

// =============================================================================
// JOB SCHEMAS
// =============================================================================

const jobSchemas = {
  create: Joi.object({
    title: baseSchemas.shortText.min(3).required(),
    location: baseSchemas.shortText.min(3).required(),
    state: baseSchemas.stateCode.required(),
    specialty: Joi.string().min(2).max(100).required(),
    description: baseSchemas.longText.min(10).optional(),
    hourlyRateMin: baseSchemas.hourlyRate.max(1000).required(),
    hourlyRateMax: baseSchemas.hourlyRate.max(1000).required(),
    startDate: baseSchemas.anyDate.optional(),
    endDate: baseSchemas.anyDate.optional(),
    duration: Joi.string().max(50).optional(),
    shiftType: Joi.string().max(50).optional(),
    companyName: baseSchemas.shortText.optional(),
    status: Joi.string().valid(...statusValues.jobStatuses).default('active'),
    requirements: Joi.array().items(Joi.string().max(500)).max(20).optional()
  }).custom((value, helpers) => {
    if (value.hourlyRateMin > value.hourlyRateMax) {
      return helpers.error('hourlyRateMin must be less than or equal to hourlyRateMax');
    }
    if (value.endDate && value.startDate && value.endDate < value.startDate) {
      return helpers.error('endDate must be after startDate');
    }
    return value;
  }),
  
  update: Joi.object({
    title: baseSchemas.shortText.min(3).optional(),
    location: baseSchemas.shortText.min(3).optional(),
    state: baseSchemas.stateCode.optional(),
    specialty: Joi.string().min(2).max(100).optional(),
    description: baseSchemas.longText.min(10).optional(),
    hourlyRateMin: baseSchemas.hourlyRate.max(1000).optional(),
    hourlyRateMax: baseSchemas.hourlyRate.max(1000).optional(),
    startDate: baseSchemas.anyDate.optional(),
    endDate: baseSchemas.anyDate.optional(),
    duration: Joi.string().max(50).optional(),
    shiftType: Joi.string().max(50).optional(),
    companyName: baseSchemas.shortText.optional(),
    status: Joi.string().valid(...statusValues.jobStatuses).optional(),
    requirements: Joi.array().items(Joi.string().max(500)).max(20).optional()
  }).custom((value, helpers) => {
    if (value.hourlyRateMin && value.hourlyRateMax && value.hourlyRateMin > value.hourlyRateMax) {
      return helpers.error('hourlyRateMin must be less than or equal to hourlyRateMax');
    }
    if (value.endDate && value.startDate && value.endDate < value.startDate) {
      return helpers.error('endDate must be after startDate');
    }
    return value;
  }),
  
  query: paginationSchema.keys({
    specialty: Joi.string().max(100).optional(),
    state: baseSchemas.stateCode.optional(),
    minRate: baseSchemas.hourlyRate.optional(),
    maxRate: baseSchemas.hourlyRate.optional(),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'hourly_rate_min', 'title').default('created_at')
  }).concat(searchQuerySchema)
};

// =============================================================================
// APPLICATION SCHEMAS
// =============================================================================

const applicationSchemas = {
  create: Joi.object({
    jobId: baseSchemas.positiveInteger.required(),
    coverLetter: Joi.string().min(10).max(5000).required(),
    expectedRate: baseSchemas.hourlyRate.optional(),
    availableDate: baseSchemas.futureDate.optional(),
    notes: baseSchemas.notes.optional()
  }),
  
  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'accepted', 'rejected').required(),
    notes: baseSchemas.notes.optional()
  }),
  
  query: paginationSchema.keys({
    status: Joi.string().valid(...statusValues.applicationStatuses).optional(),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'status').default('created_at')
  }),
  
  search: paginationSchema.keys({
    search: Joi.string().max(200).optional(),
    statuses: Joi.array().items(Joi.string().valid(...statusValues.applicationStatuses)).optional(),
    specialties: Joi.array().items(Joi.string().max(50)).optional(),
    state: baseSchemas.stateCode.optional(),
    minRate: baseSchemas.hourlyRate.optional(),
    maxRate: baseSchemas.hourlyRate.optional(),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'status', 'expected_rate').default('created_at')
  }).concat(searchQuerySchema),
  
  recruiterSearch: paginationSchema.keys({
    search: Joi.string().max(200).optional(),
    statuses: Joi.array().items(Joi.string().valid(...statusValues.applicationStatuses)).optional(),
    minRate: baseSchemas.hourlyRate.optional(),
    maxRate: baseSchemas.hourlyRate.optional(),
    minExperience: Joi.number().integer().min(0).max(50).optional(),
    applicantSpecialty: Joi.string().max(50).optional(),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'status', 'expected_rate').default('created_at')
  }).concat(searchQuerySchema)
};

// =============================================================================
// DATA EXPORT SCHEMAS
// =============================================================================

const dataExportSchemas = {
  exportRequest: Joi.object({
    format: Joi.string().valid('json', 'csv').default('json'),
    includeHistory: Joi.boolean().default(true),
    dateFrom: baseSchemas.anyDate.optional(),
    dateTo: baseSchemas.anyDate.optional()
  })
};

// =============================================================================
// SCHEMA BUILDERS FOR DYNAMIC VALIDATION
// =============================================================================

const schemaBuilders = {
  /**
   * Create a pagination schema with custom sort fields
   * @param {Array} sortFields - Array of valid sort field names
   * @param {String} defaultSort - Default sort field
   * @returns {Object} Joi schema
   */
  createPaginationSchema: (sortFields = ['created_at'], defaultSort = 'created_at') => {
    return paginationSchema.keys({
      sortBy: Joi.string().valid(...sortFields).default(defaultSort)
    });
  },
  
  /**
   * Create a search schema with custom fields
   * @param {Array} additionalFields - Additional fields to include
   * @returns {Object} Joi schema
   */
  createSearchSchema: (additionalFields = {}) => {
    return searchQuerySchema.keys(additionalFields);
  },
  
  /**
   * Add common timestamp fields to any schema
   * @param {Object} baseSchema - Base Joi schema
   * @returns {Object} Enhanced schema with timestamp fields
   */
  addTimestampFields: (baseSchema) => {
    return baseSchema.keys({
      createdAt: baseSchemas.anyDate.optional(),
      updatedAt: baseSchemas.anyDate.optional()
    });
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Base components
  baseSchemas,
  statusValues,
  paginationSchema,
  searchQuerySchema,
  
  // Feature-specific schemas
  authSchemas,
  jobSchemas,
  applicationSchemas,
  dataExportSchemas,
  
  // Utility builders
  schemaBuilders,
  
  // Convenience method to validate with consistent error formatting
  validateWithSchema: (data, schema) => {
    const { error, value } = schema.validate(data);
    if (error) {
      return {
        isValid: false,
        error: error.details[0].message,
        details: error.details
      };
    }
    return {
      isValid: true,
      value,
      error: null
    };
  }
};