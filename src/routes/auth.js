const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { 
  generateToken, 
  requireAuth, 
  blacklistToken
} = require('../middleware/auth');
const { 
  createSuccessResponse, 
  createErrorResponse, 
  asyncHandler,
  createValidationErrorResponse 
} = require('../utils/responses');
const config = require('../config/config');
const { authSchemas, validateWithSchema } = require('../validation/schemas');
const emailService = require('../services/emailService');

const router = express.Router();

// Password reset rate limiter - more restrictive than general rate limiting
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password reset attempts. Please try again in 1 hour.',
  handler: (req, res) => {
    config.logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`, 'PASSWORD_RESET_RATE_LIMIT');
    return createErrorResponse(res, 429, 'Too many password reset attempts. Please try again in 1 hour.', 'password_reset_rate_limit');
  }
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', asyncHandler(async (req, res) => {
  config.logger.info('Registration attempt started', 'AUTH_REGISTER');
  
  // Validate input using centralized schema
  const validation = validateWithSchema(req.body, authSchemas.register);
  if (!validation.isValid) {
    config.logger.warn(`Registration validation failed: ${validation.error}`, 'AUTH_REGISTER');
    return createValidationErrorResponse(res, [{ field: 'body', message: validation.error }]);
  }
  const value = validation.value;

  const { email, password, firstName, lastName, phone, role } = value;
  
  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    config.logger.warn(`Registration failed: Email already exists - ${email}`, 'AUTH_REGISTER');
    return createErrorResponse(res, 400, 'Email already exists', 'email_exists');
  }

  // Create new user
  const userData = {
    email,
    password,
    firstName,
    lastName,
    phone,
    role
  };

  try {
    const newUser = await User.create(userData);
    config.logger.info(`User registered successfully: ${email}`, 'AUTH_REGISTER');

    // Return success without token (user needs to login)
    return createSuccessResponse(res, 201, {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        role: newUser.role
      }
    }, 'User registered successfully');
    
  } catch (error) {
    // Handle specific constraint errors (like duplicate email from database level)
    if (error.message === 'Email already exists') {
      config.logger.warn(`Registration failed: ${error.message} - ${email}`, 'AUTH_REGISTER');
      return createErrorResponse(res, 400, error.message, 'email_exists');
    }
    throw error;
  }
}));

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', asyncHandler(async (req, res) => {
  config.logger.info('Login attempt started', 'AUTH_LOGIN');
  
  // Validate input using centralized schema
  const validation = validateWithSchema(req.body, authSchemas.login);
  if (!validation.isValid) {
    config.logger.warn(`Login validation failed: ${validation.error}`, 'AUTH_LOGIN');
    return createValidationErrorResponse(res, [{ field: 'body', message: validation.error }]);
  }
  const value = validation.value;

  const { email, password } = value;
  
  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    config.logger.warn(`Login failed: User not found - ${email}`, 'AUTH_LOGIN');
    return createErrorResponse(res, 401, 'Invalid email or password', 'authentication_failed');
  }

  // Compare password
  const isPasswordValid = await User.comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    config.logger.warn(`Login failed: Invalid password - ${email}`, 'AUTH_LOGIN');
    return createErrorResponse(res, 401, 'Invalid email or password', 'authentication_failed');
  }

  // Generate JWT token
  const token = generateToken(user.id);
  config.logger.info(`User logged in successfully: ${email}`, 'AUTH_LOGIN');

  // Return token and user info (without password)
  return createSuccessResponse(res, 200, {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role
    }
  }, 'Login successful');
}));

/**
 * POST /api/auth/logout
 * Logout user by blacklisting their token
 */
router.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  config.logger.info(`Logout attempt for user: ${req.user.id}`, 'AUTH_LOGOUT');
  
  // Get token from request (set by requireAuth middleware)
  const token = req.user.token;
  
  // Add token to blacklist
  blacklistToken(token);
  config.logger.info(`User logged out successfully: ${req.user.id}`, 'AUTH_LOGOUT');

  return createSuccessResponse(res, 200, null, 'Logout successful');
}));

/**
 * GET /api/auth/me
 * Get current user profile (protected route)
 */
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  config.logger.info(`Profile request for user: ${req.user.id}`, 'AUTH_PROFILE');
  
  // Get user details from database
  const user = await User.findById(req.user.id);
  if (!user) {
    config.logger.warn(`Profile request failed: User not found - ${req.user.id}`, 'AUTH_PROFILE');
    return createErrorResponse(res, 404, 'User not found', 'user_not_found');
  }

  return createSuccessResponse(res, 200, {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      specialty: user.specialty,
      yearsExperience: user.years_experience,
      createdAt: user.created_at
    }
  });
}));

/**
 * POST /api/auth/forgot-password
 * Send password reset email to user
 */
router.post('/forgot-password', passwordResetLimiter, asyncHandler(async (req, res) => {
  config.logger.info('Password reset request started', 'AUTH_FORGOT_PASSWORD');
  
  // Validate input using centralized schema
  const validation = validateWithSchema(req.body, authSchemas.forgotPassword);
  if (!validation.isValid) {
    config.logger.warn(`Password reset validation failed: ${validation.error}`, 'AUTH_FORGOT_PASSWORD');
    return createValidationErrorResponse(res, [{ field: 'body', message: validation.error }]);
  }
  
  const { email } = validation.value;
  
  // Find user by email
  const user = await User.findByEmail(email);
  
  // Always return success to prevent email enumeration attacks
  // But only send email if user exists
  if (user) {
    try {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Save reset token to database
      await User.setPasswordResetToken(user.id, resetToken, resetTokenExpires);
      config.logger.info(`Password reset token generated for user: ${email}`, 'AUTH_FORGOT_PASSWORD');
      
      // Send password reset email
      const emailResult = await emailService.sendPasswordResetEmail(email, resetToken, user.first_name);
      
      if (emailResult.success) {
        config.logger.info(`Password reset email sent successfully to: ${email}`, 'AUTH_FORGOT_PASSWORD');
      } else {
        config.logger.error(`Failed to send password reset email to: ${email}`, emailResult.error, 'AUTH_FORGOT_PASSWORD');
        // Continue with success response to prevent email enumeration
      }
    } catch (error) {
      config.logger.error(`Password reset process failed for: ${email}`, error, 'AUTH_FORGOT_PASSWORD');
      // Continue with success response to prevent email enumeration
    }
  } else {
    config.logger.warn(`Password reset requested for non-existent email: ${email}`, 'AUTH_FORGOT_PASSWORD');
  }
  
  // Always return success response (security measure)
  return createSuccessResponse(res, 200, null, 'If an account with that email exists, a password reset link has been sent.');
}));

/**
 * POST /api/auth/reset-password
 * Reset user password using reset token
 */
router.post('/reset-password', passwordResetLimiter, asyncHandler(async (req, res) => {
  config.logger.info('Password reset attempt started', 'AUTH_RESET_PASSWORD');
  
  // Validate input using centralized schema
  const validation = validateWithSchema(req.body, authSchemas.resetPassword);
  if (!validation.isValid) {
    config.logger.warn(`Password reset validation failed: ${validation.error}`, 'AUTH_RESET_PASSWORD');
    return createValidationErrorResponse(res, [{ field: 'body', message: validation.error }]);
  }
  
  const { token, password } = validation.value;
  
  // Find user by reset token and check if token is still valid
  const user = await User.findByPasswordResetToken(token);
  
  if (!user) {
    config.logger.warn('Password reset failed: Invalid or expired token', 'AUTH_RESET_PASSWORD');
    return createErrorResponse(res, 400, 'Invalid or expired reset token', 'invalid_token');
  }
  
  try {
    // Update user password and clear reset token
    await User.updatePassword(user.id, password);
    await User.clearPasswordResetToken(user.id);
    
    config.logger.info(`Password reset successful for user: ${user.email}`, 'AUTH_RESET_PASSWORD');
    
    return createSuccessResponse(res, 200, null, 'Password has been reset successfully. You can now log in with your new password.');
    
  } catch (error) {
    config.logger.error(`Password reset failed for user: ${user.email}`, error, 'AUTH_RESET_PASSWORD');
    throw error;
  }
}));

module.exports = router;