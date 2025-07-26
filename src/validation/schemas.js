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
// CALCULATOR SCHEMAS
// =============================================================================

const calculatorSchemas = {
  contract: Joi.object({
    hourlyRate: Joi.number()
      .min(0.01)
      .max(10000)
      .required()
      .messages({
        'number.min': 'Hourly rate must be at least $0.01',
        'number.max': 'Hourly rate cannot exceed $10,000',
        'any.required': 'Hourly rate is required'
      }),
    hoursPerWeek: Joi.number()
      .min(1)
      .max(80)
      .required()
      .messages({
        'number.min': 'Hours per week must be at least 1',
        'number.max': 'Hours per week cannot exceed 80',
        'any.required': 'Hours per week is required'
      }),
    weeksPerYear: Joi.number()
      .min(1)
      .max(52)
      .required()
      .messages({
        'number.min': 'Weeks per year must be at least 1',
        'number.max': 'Weeks per year cannot exceed 52',
        'any.required': 'Weeks per year is required'
      }),
    state: Joi.string()
      .length(2)
      .uppercase()
      .pattern(/^[A-Z]{2}$/)
      .default('CA')
      .messages({
        'string.length': 'State must be a 2-letter abbreviation',
        'string.pattern.base': 'State must be a valid 2-letter state code'
      }),
    expenseRate: Joi.number()
      .min(0)
      .max(0.5)
      .default(0.15)
      .messages({
        'number.min': 'Expense rate cannot be negative',
        'number.max': 'Expense rate cannot exceed 50%'
      })
  }),
  
  paycheck: Joi.object({
    regularHours: Joi.number()
      .min(0)
      .max(168)
      .default(0)
      .messages({
        'number.min': 'Regular hours cannot be negative',
        'number.max': 'Regular hours cannot exceed 168 per week'
      }),
    regularRate: Joi.number()
      .min(0)
      .max(10000)
      .default(0)
      .messages({
        'number.min': 'Regular rate cannot be negative',
        'number.max': 'Regular rate cannot exceed $10,000'
      }),
    overtimeHours: Joi.number()
      .min(0)
      .max(80)
      .default(0)
      .messages({
        'number.min': 'Overtime hours cannot be negative',
        'number.max': 'Overtime hours cannot exceed 80'
      }),
    overtimeRate: Joi.number()
      .min(0)
      .max(10000)
      .default(0)
      .messages({
        'number.min': 'Overtime rate cannot be negative',
        'number.max': 'Overtime rate cannot exceed $10,000'
      }),
    callHours: Joi.number()
      .min(0)
      .max(168)
      .default(0)
      .messages({
        'number.min': 'Call hours cannot be negative',
        'number.max': 'Call hours cannot exceed 168 per week'
      }),
    callRate: Joi.number()
      .min(0)
      .max(10000)
      .default(0)
      .messages({
        'number.min': 'Call rate cannot be negative',
        'number.max': 'Call rate cannot exceed $10,000'
      }),
    callbackHours: Joi.number()
      .min(0)
      .max(168)
      .default(0)
      .messages({
        'number.min': 'Callback hours cannot be negative',
        'number.max': 'Callback hours cannot exceed 168 per week'
      }),
    callbackRate: Joi.number()
      .min(0)
      .max(10000)
      .default(0)
      .messages({
        'number.min': 'Callback rate cannot be negative',
        'number.max': 'Callback rate cannot exceed $10,000'
      }),
    housingStipend: Joi.number()
      .min(0)
      .max(50000)
      .default(0)
      .messages({
        'number.min': 'Housing stipend cannot be negative',
        'number.max': 'Housing stipend cannot exceed $50,000'
      }),
    mealStipend: Joi.number()
      .min(0)
      .max(10000)
      .default(0)
      .messages({
        'number.min': 'Meal stipend cannot be negative',
        'number.max': 'Meal stipend cannot exceed $10,000'
      }),
    mileageReimbursement: Joi.number()
      .min(0)
      .max(10000)
      .default(0)
      .messages({
        'number.min': 'Mileage reimbursement cannot be negative',
        'number.max': 'Mileage reimbursement cannot exceed $10,000'
      }),
    state: Joi.string()
      .length(2)
      .uppercase()
      .pattern(/^[A-Z]{2}$/)
      .default('CA')
      .messages({
        'string.length': 'State must be a 2-letter abbreviation',
        'string.pattern.base': 'State must be a valid 2-letter state code'
      }),
    period: Joi.string()
      .valid('weekly', 'biweekly', 'semimonthly', 'monthly', 'annual')
      .default('weekly')
      .messages({
        'any.only': 'Period must be one of: weekly, biweekly, semimonthly, monthly, annual'
      })
  }),
  
  simplePaycheck: Joi.object({
    grossPay: Joi.number()
      .min(0.01)
      .max(1000000)
      .required()
      .messages({
        'number.min': 'Gross pay must be at least $0.01',
        'number.max': 'Gross pay cannot exceed $1,000,000',
        'any.required': 'Gross pay is required'
      }),
    additionalDeductions: Joi.number()
      .min(0)
      .max(Joi.ref('grossPay'))
      .default(0)
      .messages({
        'number.min': 'Additional deductions cannot be negative',
        'number.max': 'Additional deductions cannot exceed gross pay'
      }),
    state: Joi.string()
      .length(2)
      .uppercase()
      .pattern(/^[A-Z]{2}$/)
      .default('CA')
      .messages({
        'string.length': 'State must be a 2-letter abbreviation',
        'string.pattern.base': 'State must be a valid 2-letter state code'
      }),
    period: Joi.string()
      .valid('weekly', 'biweekly', 'semimonthly', 'monthly', 'annual')
      .default('weekly')
      .messages({
        'any.only': 'Period must be one of: weekly, biweekly, semimonthly, monthly, annual'
      })
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
  calculatorSchemas,
  
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