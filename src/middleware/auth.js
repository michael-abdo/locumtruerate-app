const jwt = require('jsonwebtoken');
const config = require('../config/config');

// In-memory token blacklist (for logout functionality)
// In production, use Redis or database
const tokenBlacklist = new Set();

/**
 * Centralized error response utility
 * Creates consistent error responses across the API
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
    timestamp: new Date().toISOString(),
    ...meta
  });
};

/**
 * Generate JWT token for a user
 * @param {number} userId - User ID to encode in token
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  const payload = {
    userId,
    iat: Date.now()
  };
  
  // Token expires in 24 hours
  const options = {
    expiresIn: '24h'
  };
  
  return jwt.sign(payload, config.security.jwtSecret, options);
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    throw new Error('Token has been revoked');
  }
  
  try {
    return jwt.verify(token, config.security.jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Middleware to require authentication
 * Extracts and verifies JWT token from Authorization header
 */
const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return createErrorResponse(res, 401, 'No authorization header provided', 'authentication_required');
    }
    
    // Extract token (format: "Bearer <token>")
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return createErrorResponse(res, 401, 'Invalid authorization header format. Use: Bearer <token>', 'invalid_auth_format');
    }
    
    const token = parts[1];
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Add user info to request
      req.user = {
        id: decoded.userId,
        token
      };
      
      next();
    } catch (error) {
      return createErrorResponse(res, 401, error.message, 'authentication_failed');
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return createErrorResponse(res, 500, 'Error processing authentication', 'internal_server_error');
  }
};

/**
 * Add token to blacklist (for logout)
 * @param {string} token - Token to blacklist
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // Clean up expired tokens from blacklist periodically
  // In production, this would be handled by Redis TTL
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 24 * 60 * 60 * 1000); // Remove after 24 hours
};

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 * @returns {boolean} True if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  blacklistToken,
  isTokenBlacklisted,
  createErrorResponse
};