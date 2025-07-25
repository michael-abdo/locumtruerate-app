const express = require('express');
const User = require('../models/User');
const { 
  generateToken, 
  requireAuth, 
  blacklistToken, 
  createErrorResponse 
} = require('../middleware/auth');
const config = require('../config/config');
const { authSchemas, validateWithSchema } = require('../validation/schemas');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', async (req, res) => {
  try {
    config.logger.info('Registration attempt started', 'AUTH_REGISTER');
    
    // Validate input using centralized schema
    const validation = validateWithSchema(req.body, authSchemas.register);
    if (!validation.isValid) {
      config.logger.warn(`Registration validation failed: ${validation.error}`, 'AUTH_REGISTER');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
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

    const newUser = await User.create(userData);
    config.logger.info(`User registered successfully: ${email}`, 'AUTH_REGISTER');

    // Return success without token (user needs to login)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        role: newUser.role
      },
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    // Handle specific constraint errors (like duplicate email from database level)
    if (error.message === 'Email already exists') {
      config.logger.warn(`Registration failed: ${error.message} - ${email}`, 'AUTH_REGISTER');
      return createErrorResponse(res, 400, error.message, 'email_exists');
    }
    
    // Handle unexpected errors
    config.logger.error('Registration error', error, 'AUTH_REGISTER');
    return createErrorResponse(res, 500, 'Internal server error during registration', 'registration_failed');
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    config.logger.info('Login attempt started', 'AUTH_LOGIN');
    
    // Validate input using centralized schema
    const validation = validateWithSchema(req.body, authSchemas.login);
    if (!validation.isValid) {
      config.logger.warn(`Login validation failed: ${validation.error}`, 'AUTH_LOGIN');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
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
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role
      },
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    config.logger.error('Login error', error, 'AUTH_LOGIN');
    return createErrorResponse(res, 500, 'Internal server error during login', 'login_failed');
  }
});

/**
 * POST /api/auth/logout
 * Logout user by blacklisting their token
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Logout attempt for user: ${req.user.id}`, 'AUTH_LOGOUT');
    
    // Get token from request (set by requireAuth middleware)
    const token = req.user.token;
    
    // Add token to blacklist
    blacklistToken(token);
    config.logger.info(`User logged out successfully: ${req.user.id}`, 'AUTH_LOGOUT');

    res.json({
      message: 'Logout successful',
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    config.logger.error('Logout error', error, 'AUTH_LOGOUT');
    return createErrorResponse(res, 500, 'Internal server error during logout', 'logout_failed');
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (protected route)
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Profile request for user: ${req.user.id}`, 'AUTH_PROFILE');
    
    // Get user details from database
    const user = await User.findById(req.user.id);
    if (!user) {
      config.logger.warn(`Profile request failed: User not found - ${req.user.id}`, 'AUTH_PROFILE');
      return createErrorResponse(res, 404, 'User not found', 'user_not_found');
    }

    res.json({
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
      },
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    config.logger.error('Profile request error', error, 'AUTH_PROFILE');
    return createErrorResponse(res, 500, 'Internal server error while fetching profile', 'profile_failed');
  }
});

module.exports = router;