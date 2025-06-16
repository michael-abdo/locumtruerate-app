/**
 * Comprehensive Error Handling Strategy
 * 
 * This module provides a unified error handling system for all applications
 * in the LocumTrueRate.com platform (web, mobile, API).
 */

export enum ErrorCode {
  // Authentication & Authorization (1000-1999)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation (2000-2999)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Business Logic (3000-3999)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  
  // Rate Limiting (4000-4999)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // External Services (5000-5999)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  PAYMENT_SERVICE_ERROR = 'PAYMENT_SERVICE_ERROR',
  STORAGE_SERVICE_ERROR = 'STORAGE_SERVICE_ERROR',
  
  // System Errors (9000-9999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  stack?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * Specific error classes for common scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: Record<string, any>) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, any>) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(ErrorCode.RESOURCE_NOT_FOUND, message, 404, { resource, id });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.DUPLICATE_RESOURCE, message, 409, details);
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, window: string, retryAfter?: number) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: ${limit} requests per ${window}`,
      429,
      { limit, window, retryAfter }
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service error: ${service}`,
      503,
      { 
        service, 
        originalError: originalError?.message,
        originalStack: process.env.NODE_ENV === 'development' ? originalError?.stack : undefined
      }
    );
  }
}

/**
 * Error handler middleware for Express/tRPC
 */
export function errorHandler(error: Error, req?: any, res?: any, next?: any) {
  // Default error
  let appError: AppError;
  
  if (error instanceof AppError) {
    appError = error;
  } else {
    // Unknown errors
    appError = new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred'
        : error.message,
      500,
      undefined,
      false // Unknown errors are not operational
    );
  }
  
  // Log error
  if (!appError.isOperational) {
    console.error('Non-operational error:', error);
    // In production, you would send this to Sentry or similar
  }
  
  // Send response if in Express context
  if (res && res.status) {
    res.status(appError.statusCode).json(appError.toJSON());
  }
  
  return appError;
}

/**
 * Global error boundary for React
 */
export class ErrorBoundary {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  static logErrorToService(error: Error, errorInfo: any) {
    // Log to Sentry or similar service
    console.error('React Error Boundary:', error, errorInfo);
  }
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return ((...args: any[]) => {
    const result = fn(...args);
    if (result && typeof result.catch === 'function') {
      result.catch((error: Error) => {
        throw errorHandler(error);
      });
    }
    return result;
  }) as T;
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: Error): error is AppError {
  return error instanceof AppError && error.isOperational;
}

/**
 * Format error for client consumption
 */
export function formatErrorForClient(error: AppError): ErrorDetails {
  const formatted = error.toJSON();
  
  // Remove sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    delete formatted.stack;
    if (formatted.details) {
      // Remove any sensitive fields
      delete formatted.details.originalStack;
      delete formatted.details.databaseQuery;
      delete formatted.details.internalError;
    }
  }
  
  return formatted;
}