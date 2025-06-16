/**
 * Tests for error handling utilities
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  ErrorCode,
  createErrorFromCode,
  isAppError,
  isOperationalError,
  formatErrorForLogging,
  formatErrorForUser,
} from '../index';

describe('AppError', () => {
  it('should create an error with all properties', () => {
    const error = new AppError(
      'Test error message',
      ErrorCode.VALIDATION_ERROR,
      400,
      true,
      { field: 'email' }
    );

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.context).toEqual({ field: 'email' });
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.name).toBe('AppError');
  });

  it('should have default values', () => {
    const error = new AppError('Test error');

    expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.context).toEqual({});
  });

  it('should be an instance of Error', () => {
    const error = new AppError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('Specific Error Classes', () => {
  it('should create ValidationError correctly', () => {
    const error = new ValidationError('Invalid email', { field: 'email' });
    
    expect(error.message).toBe('Invalid email');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.context).toEqual({ field: 'email' });
  });

  it('should create AuthenticationError correctly', () => {
    const error = new AuthenticationError('Invalid credentials');
    
    expect(error.message).toBe('Invalid credentials');
    expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
    expect(error.statusCode).toBe(401);
  });

  it('should create AuthorizationError correctly', () => {
    const error = new AuthorizationError('Access denied');
    
    expect(error.message).toBe('Access denied');
    expect(error.code).toBe(ErrorCode.AUTHORIZATION_ERROR);
    expect(error.statusCode).toBe(403);
  });

  it('should create NotFoundError correctly', () => {
    const error = new NotFoundError('User not found');
    
    expect(error.message).toBe('User not found');
    expect(error.code).toBe(ErrorCode.NOT_FOUND_ERROR);
    expect(error.statusCode).toBe(404);
  });

  it('should create ConflictError correctly', () => {
    const error = new ConflictError('Email already exists');
    
    expect(error.message).toBe('Email already exists');
    expect(error.code).toBe(ErrorCode.CONFLICT_ERROR);
    expect(error.statusCode).toBe(409);
  });

  it('should create RateLimitError correctly', () => {
    const error = new RateLimitError('Too many requests');
    
    expect(error.message).toBe('Too many requests');
    expect(error.code).toBe(ErrorCode.RATE_LIMIT_ERROR);
    expect(error.statusCode).toBe(429);
  });

  it('should create ExternalServiceError correctly', () => {
    const error = new ExternalServiceError('Payment service unavailable');
    
    expect(error.message).toBe('Payment service unavailable');
    expect(error.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
    expect(error.statusCode).toBe(502);
  });

  it('should create DatabaseError correctly', () => {
    const error = new DatabaseError('Connection failed');
    
    expect(error.message).toBe('Connection failed');
    expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(error.statusCode).toBe(500);
  });
});

describe('createErrorFromCode', () => {
  it('should create ValidationError for VALIDATION_ERROR code', () => {
    const error = createErrorFromCode(ErrorCode.VALIDATION_ERROR, 'Invalid input');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Invalid input');
  });

  it('should create AuthenticationError for AUTHENTICATION_ERROR code', () => {
    const error = createErrorFromCode(ErrorCode.AUTHENTICATION_ERROR, 'Auth failed');
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe('Auth failed');
  });

  it('should create NotFoundError for NOT_FOUND_ERROR code', () => {
    const error = createErrorFromCode(ErrorCode.NOT_FOUND_ERROR, 'Not found');
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Not found');
  });

  it('should create AppError for unknown code', () => {
    const error = createErrorFromCode('UNKNOWN_CODE' as ErrorCode, 'Unknown error');
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('UNKNOWN_CODE');
    expect(error.message).toBe('Unknown error');
  });
});

describe('isAppError', () => {
  it('should return true for AppError instances', () => {
    const error = new AppError('Test error');
    expect(isAppError(error)).toBe(true);
  });

  it('should return true for subclass instances', () => {
    const error = new ValidationError('Test error');
    expect(isAppError(error)).toBe(true);
  });

  it('should return false for regular Error instances', () => {
    const error = new Error('Test error');
    expect(isAppError(error)).toBe(false);
  });

  it('should return false for non-Error objects', () => {
    expect(isAppError({})).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });
});

describe('isOperationalError', () => {
  it('should return true for operational AppError', () => {
    const error = new AppError('Test error', ErrorCode.VALIDATION_ERROR, 400, true);
    expect(isOperationalError(error)).toBe(true);
  });

  it('should return false for non-operational AppError', () => {
    const error = new AppError('Test error', ErrorCode.INTERNAL_SERVER_ERROR, 500, false);
    expect(isOperationalError(error)).toBe(false);
  });

  it('should return false for regular Error', () => {
    const error = new Error('Test error');
    expect(isOperationalError(error)).toBe(false);
  });

  it('should return false for non-Error objects', () => {
    expect(isOperationalError({})).toBe(false);
    expect(isOperationalError('string')).toBe(false);
  });
});

describe('formatErrorForLogging', () => {
  it('should format AppError for logging', () => {
    const error = new AppError(
      'Test error',
      ErrorCode.VALIDATION_ERROR,
      400,
      true,
      { field: 'email', userId: '123' }
    );

    const formatted = formatErrorForLogging(error);

    expect(formatted).toEqual({
      name: 'AppError',
      message: 'Test error',
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 400,
      isOperational: true,
      context: { field: 'email', userId: '123' },
      timestamp: error.timestamp,
      stack: error.stack,
    });
  });

  it('should format regular Error for logging', () => {
    const error = new Error('Regular error');
    const formatted = formatErrorForLogging(error);

    expect(formatted).toEqual({
      name: 'Error',
      message: 'Regular error',
      stack: error.stack,
    });
  });

  it('should handle string errors', () => {
    const formatted = formatErrorForLogging('String error');

    expect(formatted).toEqual({
      name: 'UnknownError',
      message: 'String error',
    });
  });

  it('should handle object errors', () => {
    const errorObj = { code: 'TEST_ERROR', details: 'Something went wrong' };
    const formatted = formatErrorForLogging(errorObj);

    expect(formatted).toEqual({
      name: 'UnknownError',
      message: JSON.stringify(errorObj),
      originalError: errorObj,
    });
  });
});

describe('formatErrorForUser', () => {
  it('should format operational AppError for user', () => {
    const error = new AppError(
      'Invalid email format',
      ErrorCode.VALIDATION_ERROR,
      400,
      true,
      { field: 'email' }
    );

    const formatted = formatErrorForUser(error);

    expect(formatted).toEqual({
      message: 'Invalid email format',
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 400,
    });
  });

  it('should format non-operational AppError as generic error', () => {
    const error = new AppError(
      'Database connection failed',
      ErrorCode.DATABASE_ERROR,
      500,
      false
    );

    const formatted = formatErrorForUser(error);

    expect(formatted).toEqual({
      message: 'An internal server error occurred. Please try again later.',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      statusCode: 500,
    });
  });

  it('should format regular Error as generic error', () => {
    const error = new Error('Unexpected error');
    const formatted = formatErrorForUser(error);

    expect(formatted).toEqual({
      message: 'An internal server error occurred. Please try again later.',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      statusCode: 500,
    });
  });

  it('should format string errors as generic error', () => {
    const formatted = formatErrorForUser('Something went wrong');

    expect(formatted).toEqual({
      message: 'An internal server error occurred. Please try again later.',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      statusCode: 500,
    });
  });
});

describe('Error Context', () => {
  it('should preserve context through error creation', () => {
    const context = {
      userId: '123',
      action: 'create_job',
      timestamp: new Date().toISOString(),
    };

    const error = new ValidationError('Invalid job data', context);
    expect(error.context).toEqual(context);

    const formatted = formatErrorForLogging(error);
    expect(formatted.context).toEqual(context);
  });

  it('should handle nested context objects', () => {
    const context = {
      user: { id: '123', email: 'test@example.com' },
      request: { method: 'POST', url: '/api/jobs' },
      validation: { field: 'title', value: '' },
    };

    const error = new ValidationError('Title is required', context);
    expect(error.context).toEqual(context);
  });
});

describe('Error Inheritance', () => {
  it('should maintain inheritance chain', () => {
    const error = new ValidationError('Test error');
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should have correct constructor names', () => {
    expect(new AppError('test').constructor.name).toBe('AppError');
    expect(new ValidationError('test').constructor.name).toBe('ValidationError');
    expect(new AuthenticationError('test').constructor.name).toBe('AuthenticationError');
    expect(new NotFoundError('test').constructor.name).toBe('NotFoundError');
  });
});