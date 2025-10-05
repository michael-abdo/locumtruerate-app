/**
 * Parameter Validation Middleware
 * 
 * This middleware provides centralized validation for route parameters,
 * eliminating duplicate validation code across route handlers.
 */

const { createErrorResponse } = require('../utils/responses');

/**
 * Middleware to validate integer ID parameters
 * @param {string} paramName - Name of the parameter to validate (default: 'id')
 * @param {string} errorType - Custom error type (optional)
 * @returns {Function} Express middleware function
 */
const validateIdParam = (paramName = 'id', errorType = null) => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);
    
    if (isNaN(id) || id < 1) {
      // Generate appropriate error message and type based on parameter name
      let errorMessage, errorTypeCode;
      
      if (paramName === 'jobId') {
        errorMessage = 'Invalid job ID';
        errorTypeCode = 'invalid_job_id';
      } else if (paramName === 'id' && req.route?.path?.includes('/applications/')) {
        errorMessage = 'Invalid application ID';
        errorTypeCode = 'invalid_application_id';
      } else {
        errorMessage = `Invalid ${paramName}`;
        errorTypeCode = errorType || `invalid_${paramName}`;
      }
      
      return createErrorResponse(res, 400, errorMessage, errorTypeCode);
    }
    
    // Store parsed ID for use in route handlers (converted to integer)
    req.params[paramName] = id;
    next();
  };
};

/**
 * Convenience middleware for validating job ID parameters
 * @returns {Function} Express middleware function
 */
const validateJobId = () => validateIdParam('id', 'invalid_job_id');

/**
 * Convenience middleware for validating application ID parameters  
 * @returns {Function} Express middleware function
 */
const validateApplicationId = () => validateIdParam('id', 'invalid_application_id');

/**
 * Convenience middleware for validating jobId route parameters
 * @returns {Function} Express middleware function
 */
const validateJobIdParam = () => validateIdParam('jobId', 'invalid_job_id');

module.exports = { 
  validateIdParam,
  validateJobId,
  validateApplicationId, 
  validateJobIdParam
};