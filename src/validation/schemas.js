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
  applicationStatuses: [
    'draft', 'submitted', 'under_review', 'interview_scheduled', 
    'interviewed', 'offer_extended', 'accepted', 'rejected', 'withdrawn', 'expired'
  ],
  jobStatuses: ['draft', 'active', 'filled', 'closed'],
  userRoles: ['locum', 'recruiter', 'admin'],
  documentTypes: [
    'resume', 'cover_letter', 'portfolio', 'references', 
    'certification', 'license', 'transcript', 'other'
  ],
  communicationTypes: [
    'email', 'phone_call', 'text_message', 'video_call', 'in_person', 'system_notification'
  ],
  reminderTypes: [
    'follow_up', 'interview_prep', 'document_deadline', 'offer_expiry', 'availability_update'
  ]
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
// SIMPLE APPLICATION SCHEMAS (Legacy - replaced by comprehensive schemas below)
// =============================================================================

// =============================================================================
// CALCULATION SCHEMAS
// =============================================================================

const calculationSchemas = {
  create: Joi.object({
    calculation_type: Joi.string().valid('paycheck', 'contract').required(),
    title: baseSchemas.shortText.max(255).optional(),
    description: baseSchemas.longText.optional(),
    
    // Common fields
    hourly_rate: Joi.number().min(0).max(2000).required(),
    hours_per_week: Joi.number().min(0).max(168).optional(),
    
    // Paycheck calculator specific fields
    regular_hours: Joi.number().min(0).max(168).when('calculation_type', {
      is: 'paycheck',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
    regular_rate: Joi.number().min(0).max(2000).when('calculation_type', {
      is: 'paycheck',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
    overtime_hours: Joi.number().min(0).max(168).default(0),
    overtime_rate: Joi.number().min(0).max(3000).default(0),
    call_hours: Joi.number().min(0).max(168).default(0),
    call_rate: Joi.number().min(0).max(500).default(0),
    callback_hours: Joi.number().min(0).max(168).default(0),
    callback_rate: Joi.number().min(0).max(3000).default(0),
    pay_period: Joi.string().valid('weekly', 'biweekly', 'monthly').default('weekly'),
    
    // Contract calculator specific fields
    contract_weeks: Joi.number().integer().min(1).max(104).when('calculation_type', {
      is: 'contract',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
    contract_type: Joi.string().max(50).when('calculation_type', {
      is: 'contract',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
    
    // Stipends and benefits (common)
    housing_stipend: Joi.number().min(0).max(50000).default(0),
    meal_stipend: Joi.number().min(0).max(10000).default(0),
    travel_reimbursement: Joi.number().min(0).max(50000).default(0),
    mileage_reimbursement: Joi.number().min(0).max(10000).default(0),
    other_stipends: Joi.number().min(0).max(50000).default(0),
    
    // Tax information
    tax_state: Joi.string().max(20).default('no-tax'),
    work_state: baseSchemas.stateCode.optional(),
    filing_status: Joi.string().valid('single', 'married', 'married-separate', 'head').default('single'),
    custom_tax_rate: Joi.number().min(0).max(1).optional(),
    
    // Calculated results (optional, can be computed on backend)
    gross_pay: Joi.number().min(0).optional(),
    federal_tax: Joi.number().min(0).optional(),
    state_tax: Joi.number().min(0).optional(),
    fica_tax: Joi.number().min(0).optional(),
    net_pay: Joi.number().optional(),
    total_stipends: Joi.number().min(0).optional(),
    total_contract_value: Joi.number().min(0).optional(),
    true_hourly_rate: Joi.number().min(0).optional(),
    annual_equivalent: Joi.number().min(0).optional(),
    
    // Metadata
    notes: baseSchemas.notes.optional()
  }).custom((value, helpers) => {
    // Custom validation for paycheck calculations
    if (value.calculation_type === 'paycheck') {
      if (value.regular_hours && value.regular_rate && value.overtime_rate) {
        // Validate that overtime rate is typically higher than regular rate
        if (value.overtime_rate < value.regular_rate) {
          return helpers.message('Overtime rate should typically be higher than regular rate');
        }
      }
      
      // Validate total weekly hours don't exceed reasonable limits
      const totalHours = (value.regular_hours || 0) + (value.overtime_hours || 0) + 
                        (value.call_hours || 0) + (value.callback_hours || 0);
      if (totalHours > 168) {
        return helpers.error('Total weekly hours cannot exceed 168 hours');
      }
    }
    
    // Custom validation for contract calculations
    if (value.calculation_type === 'contract') {
      if (value.hours_per_week && value.hours_per_week > 168) {
        return helpers.error('Hours per week cannot exceed 168');
      }
      
      if (value.contract_weeks && value.contract_weeks > 52) {
        return helpers.message('Contract duration exceeds one year - please verify');
      }
    }
    
    return value;
  }),
  
  update: Joi.object({
    title: baseSchemas.shortText.max(255).optional(),
    description: baseSchemas.longText.optional(),
    
    // Common fields
    hourly_rate: Joi.number().min(0).max(2000).optional(),
    hours_per_week: Joi.number().min(0).max(168).optional(),
    
    // Paycheck calculator fields
    regular_hours: Joi.number().min(0).max(168).optional(),
    regular_rate: Joi.number().min(0).max(2000).optional(),
    overtime_hours: Joi.number().min(0).max(168).optional(),
    overtime_rate: Joi.number().min(0).max(3000).optional(),
    call_hours: Joi.number().min(0).max(168).optional(),
    call_rate: Joi.number().min(0).max(500).optional(),
    callback_hours: Joi.number().min(0).max(168).optional(),
    callback_rate: Joi.number().min(0).max(3000).optional(),
    pay_period: Joi.string().valid('weekly', 'biweekly', 'monthly').optional(),
    
    // Contract calculator fields
    contract_weeks: Joi.number().integer().min(1).max(104).optional(),
    contract_type: Joi.string().max(50).optional(),
    
    // Stipends
    housing_stipend: Joi.number().min(0).max(50000).optional(),
    meal_stipend: Joi.number().min(0).max(10000).optional(),
    travel_reimbursement: Joi.number().min(0).max(50000).optional(),
    mileage_reimbursement: Joi.number().min(0).max(10000).optional(),
    other_stipends: Joi.number().min(0).max(50000).optional(),
    
    // Tax information
    tax_state: Joi.string().max(20).optional(),
    work_state: baseSchemas.stateCode.optional(),
    filing_status: Joi.string().valid('single', 'married', 'married-separate', 'head').optional(),
    custom_tax_rate: Joi.number().min(0).max(1).optional(),
    
    // Calculated results
    gross_pay: Joi.number().min(0).optional(),
    federal_tax: Joi.number().min(0).optional(),
    state_tax: Joi.number().min(0).optional(),
    fica_tax: Joi.number().min(0).optional(),
    net_pay: Joi.number().optional(),
    total_stipends: Joi.number().min(0).optional(),
    total_contract_value: Joi.number().min(0).optional(),
    true_hourly_rate: Joi.number().min(0).optional(),
    annual_equivalent: Joi.number().min(0).optional(),
    
    // Metadata
    is_favorite: Joi.boolean().optional(),
    is_archived: Joi.boolean().optional(),
    notes: baseSchemas.notes.optional()
  }),
  
  query: paginationSchema.keys({
    calculation_type: Joi.string().valid('paycheck', 'contract').optional(),
    favorites: Joi.boolean().optional(),
    archived: Joi.boolean().default(false),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'title', 'true_hourly_rate').default('created_at')
  }).concat(searchQuerySchema),
  
  duplicate: Joi.object({
    title: baseSchemas.shortText.max(255).optional()
  }),
  
  toggleFavorite: Joi.object({
    // No additional validation needed - just the ID from params
  }),
  
  setArchived: Joi.object({
    archived: Joi.boolean().required()
  })
};

// =============================================================================
// APPLICATION SCHEMAS
// =============================================================================

const applicationSchemas = {
  create: Joi.object({
    // Required fields
    user_id: baseSchemas.positiveInteger.optional(), // Added by authentication middleware
    job_id: baseSchemas.positiveInteger.required(),
    applicant_name: baseSchemas.name.required(),
    applicant_email: baseSchemas.email.required(),
    
    // Optional contact info
    applicant_phone: baseSchemas.phone.optional(),
    
    // Application content
    cover_letter: baseSchemas.longText.optional(),
    resume_text: baseSchemas.longText.optional(),
    additional_notes: baseSchemas.longText.optional(),
    
    // Application status
    application_status: Joi.string().valid(...statusValues.applicationStatuses).default('draft'),
    
    // Availability and preferences
    availability_start: baseSchemas.futureDate.optional(),
    availability_end: baseSchemas.futureDate.optional(),
    salary_expectation: baseSchemas.nonNegativeNumber.max(10000000).optional(),
    hourly_rate_expectation: baseSchemas.hourlyRate.optional(),
    preferred_location: baseSchemas.shortText.optional(),
    willing_to_relocate: Joi.boolean().default(false),
    
    // Experience and qualifications
    years_experience: Joi.number().integer().min(0).max(60).optional(),
    specialty: baseSchemas.shortText.optional(),
    board_certifications: Joi.array().items(Joi.string().max(200)).max(20).optional(),
    licenses: Joi.array().items(Joi.string().max(100)).max(10).optional(),
    
    // Application tracking
    source: baseSchemas.shortText.optional(),
    
    // Consent and legal
    consent_to_contact: Joi.boolean().default(true),
    privacy_policy_accepted: Joi.boolean().required(),
    terms_accepted: Joi.boolean().required()
  }).custom((value, helpers) => {
    // Custom validation: availability end date must be after start date
    if (value.availability_end && value.availability_start && 
        value.availability_end <= value.availability_start) {
      return helpers.error('availability_end must be after availability_start');
    }
    
    // Custom validation: privacy policy and terms must be accepted
    if (!value.privacy_policy_accepted) {
      return helpers.error('Privacy policy must be accepted');
    }
    if (!value.terms_accepted) {
      return helpers.error('Terms and conditions must be accepted');
    }
    
    return value;
  }),
  
  update: Joi.object({
    // Application metadata
    application_status: Joi.string().valid(...statusValues.applicationStatuses).optional(),
    applicant_name: baseSchemas.name.optional(),
    applicant_email: baseSchemas.email.optional(),
    applicant_phone: baseSchemas.phone.optional(),
    
    // Application content
    cover_letter: baseSchemas.longText.optional(),
    resume_text: baseSchemas.longText.optional(),
    additional_notes: baseSchemas.longText.optional(),
    
    // Availability and preferences
    availability_start: baseSchemas.futureDate.optional(),
    availability_end: baseSchemas.futureDate.optional(),
    salary_expectation: baseSchemas.nonNegativeNumber.max(10000000).optional(),
    hourly_rate_expectation: baseSchemas.hourlyRate.optional(),
    preferred_location: baseSchemas.shortText.optional(),
    willing_to_relocate: Joi.boolean().optional(),
    
    // Experience and qualifications
    years_experience: Joi.number().integer().min(0).max(60).optional(),
    specialty: baseSchemas.shortText.optional(),
    board_certifications: Joi.array().items(Joi.string().max(200)).max(20).optional(),
    licenses: Joi.array().items(Joi.string().max(100)).max(10).optional(),
    
    // Application tracking
    source: baseSchemas.shortText.optional(),
    recruiter_notes: baseSchemas.longText.optional(),
    
    // Interview information
    interview_date: baseSchemas.anyDate.optional(),
    interview_type: Joi.string().valid('phone', 'video', 'in-person').optional(),
    interview_notes: baseSchemas.longText.optional(),
    
    // Response tracking
    employer_response: baseSchemas.longText.optional(),
    response_date: baseSchemas.anyDate.optional(),
    rejection_reason: baseSchemas.shortText.optional(),
    
    // Offer details
    offer_amount: baseSchemas.nonNegativeNumber.max(10000000).optional(),
    offer_hourly_rate: baseSchemas.hourlyRate.optional(),
    offer_start_date: baseSchemas.futureDate.optional(),
    offer_end_date: baseSchemas.futureDate.optional(),
    offer_benefits: baseSchemas.longText.optional(),
    offer_expiry_date: baseSchemas.futureDate.optional(),
    
    // Status change metadata
    status_change_reason: baseSchemas.shortText.optional(),
    status_notes: baseSchemas.notes.optional(),
    
    // Consent
    consent_to_contact: Joi.boolean().optional(),
    
    // System flags
    is_archived: Joi.boolean().optional()
  }).custom((value, helpers) => {
    // Custom validation: availability end date must be after start date
    if (value.availability_end && value.availability_start && 
        value.availability_end <= value.availability_start) {
      return helpers.error('availability_end must be after availability_start');
    }
    
    // Custom validation: offer end date must be after start date
    if (value.offer_end_date && value.offer_start_date && 
        value.offer_end_date <= value.offer_start_date) {
      return helpers.error('offer_end_date must be after offer_start_date');
    }
    
    return value;
  }),
  
  query: paginationSchema.keys({
    user_id: baseSchemas.positiveInteger.optional(),
    job_id: baseSchemas.positiveInteger.optional(),
    status: Joi.string().valid(...statusValues.applicationStatuses).optional(),
    search: Joi.string().max(200).optional(),
    specialty: baseSchemas.shortText.optional(),
    min_experience: Joi.number().integer().min(0).optional(),
    max_experience: Joi.number().integer().min(0).max(60).optional(),
    willing_to_relocate: Joi.boolean().optional(),
    archived: Joi.boolean().default(false),
    sortBy: Joi.string().valid(
      'created_at', 'updated_at', 'submitted_at', 'applicant_name', 
      'application_status', 'salary_expectation', 'hourly_rate_expectation'
    ).default('created_at')
  }).concat(searchQuerySchema),
  
  statusUpdate: Joi.object({
    application_status: Joi.string().valid(...statusValues.applicationStatuses).required(),
    status_change_reason: baseSchemas.shortText.optional(),
    status_notes: baseSchemas.notes.optional()
  }),
  
  // Document schemas
  addDocument: Joi.object({
    document_type: Joi.string().valid(...statusValues.documentTypes).required(),
    file_name: baseSchemas.shortText.required(),
    file_path: Joi.string().max(500).required(),
    file_size: baseSchemas.positiveInteger.optional(),
    mime_type: Joi.string().max(100).optional()
  }),
  
  // Communication schemas
  addCommunication: Joi.object({
    communication_type: Joi.string().valid(...statusValues.communicationTypes).required(),
    direction: Joi.string().valid('inbound', 'outbound').required(),
    from_user_id: baseSchemas.positiveInteger.optional(),
    to_email: baseSchemas.email.optional(),
    subject: baseSchemas.shortText.optional(),
    message_body: baseSchemas.longText.optional()
  }),
  
  // Reminder schemas
  addReminder: Joi.object({
    reminder_type: Joi.string().valid(...statusValues.reminderTypes).required(),
    title: baseSchemas.shortText.required(),
    description: baseSchemas.longText.optional(),
    due_date: baseSchemas.futureDate.required()
  }),
  
  // Statistics query schema
  statisticsQuery: Joi.object({
    user_id: baseSchemas.positiveInteger.optional(),
    date_from: baseSchemas.anyDate.optional(),
    date_to: baseSchemas.anyDate.optional()
  }),
  
  // Search schema for advanced filtering
  advancedSearch: Joi.object({
    search: Joi.string().max(200).optional(),
    statuses: Joi.array().items(Joi.string().valid(...statusValues.applicationStatuses)).optional(),
    specialties: Joi.array().items(Joi.string().max(100)).optional(),
    date_from: baseSchemas.anyDate.optional(),
    date_to: baseSchemas.anyDate.optional(),
    min_salary: baseSchemas.nonNegativeNumber.optional(),
    max_salary: baseSchemas.nonNegativeNumber.optional(),
    min_hourly_rate: baseSchemas.nonNegativeNumber.optional(),
    max_hourly_rate: baseSchemas.nonNegativeNumber.optional(),
    min_experience: Joi.number().integer().min(0).optional(),
    max_experience: Joi.number().integer().min(0).max(60).optional(),
    willing_to_relocate: Joi.boolean().optional(),
    has_certifications: Joi.boolean().optional(),
    source: baseSchemas.shortText.optional()
  }).concat(paginationSchema)
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
  calculationSchemas,
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