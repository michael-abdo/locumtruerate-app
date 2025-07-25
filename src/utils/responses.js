/**
 * Centralized Response Utilities
 * 
 * This module provides consistent response formatting across all API endpoints
 * to eliminate duplication and ensure standardized response structures.
 */

const config = require('../config/config');

/**
 * Create a standardized success response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code (default: 200)
 * @param {Object|Array} data - Response data
 * @param {string} message - Success message (optional)
 * @param {Object} meta - Additional metadata (optional)
 * @returns {Object} JSON success response
 */
const createSuccessResponse = (res, status = 200, data, message = null, meta = {}) => {
  const response = {
    success: true,
    data,
    timestamp: config.utils.timestamp(),
    ...meta
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(status).json(response);
};

/**
 * Create a standardized error response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {string} type - Error type (optional)
 * @param {Object} meta - Additional metadata (optional)
 * @returns {Object} JSON error response
 */
const createErrorResponse = (res, status, message, type = 'error', meta = {}) => {
  return res.status(status).json({
    error: type,
    message,
    timestamp: config.utils.timestamp(),
    ...meta
  });
};

/**
 * Create a paginated response with consistent structure
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items for current page
 * @param {Object} pagination - Pagination metadata
 * @param {Object} meta - Additional metadata (optional)
 * @returns {Object} JSON paginated response
 */
const createPaginatedResponse = (res, items, pagination, meta = {}) => {
  return createSuccessResponse(res, 200, items, null, {
    pagination,
    ...meta
  });
};

/**
 * Create a validation error response with detailed field errors
 * @param {Object} res - Express response object
 * @param {Array} validationErrors - Array of validation error details
 * @returns {Object} JSON validation error response
 */
const createValidationErrorResponse = (res, validationErrors) => {
  return createErrorResponse(res, 400, 'Validation failed', 'validation_error', {
    errors: validationErrors
  });
};

/**
 * Create an authentication error response
 * @param {Object} res - Express response object
 * @param {string} message - Auth error message
 * @returns {Object} JSON auth error response
 */
const createAuthErrorResponse = (res, message = 'Authentication required') => {
  return createErrorResponse(res, 401, message, 'authentication_error');
};

/**
 * Create an authorization error response
 * @param {Object} res - Express response object
 * @param {string} message - Authorization error message
 * @returns {Object} JSON authorization error response
 */
const createAuthorizationErrorResponse = (res, message = 'Insufficient permissions') => {
  return createErrorResponse(res, 403, message, 'authorization_error');
};

/**
 * Create a not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource type that was not found
 * @returns {Object} JSON not found error response
 */
const createNotFoundResponse = (res, resource = 'Resource') => {
  return createErrorResponse(res, 404, `${resource} not found`, 'not_found');
};

/**
 * Handle async route errors consistently
 * @param {Function} asyncFn - Async route handler function
 * @returns {Function} Express middleware that handles errors
 */
const asyncHandler = (asyncFn) => {
  return (req, res, next) => {
    Promise.resolve(asyncFn(req, res, next)).catch(next);
  };
};

/**
 * Create a response with applied filters metadata
 * @param {Object} res - Express response object
 * @param {Array} items - Filtered items
 * @param {Object} pagination - Pagination metadata
 * @param {Object} appliedFilters - Applied filter values
 * @returns {Object} JSON response with filters
 */
const createFilteredResponse = (res, items, pagination, appliedFilters) => {
  return createPaginatedResponse(res, items, pagination, {
    appliedFilters
  });
};

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createAuthorizationErrorResponse,
  createNotFoundResponse,
  asyncHandler,
  createFilteredResponse
};