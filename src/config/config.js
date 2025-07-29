/**
 * Centralized configuration module
 * All application configuration should be accessed through this module
 */

require('dotenv').config();

/**
 * Parse DATABASE_URL into individual database configuration components
 * Supports both postgresql:// and postgres:// protocols
 * Returns null if URL is invalid or missing
 */
const parseDBUrl = (databaseUrl) => {
  if (!databaseUrl) return null;
  
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: { rejectUnauthorized: false } // Required for Heroku PostgreSQL
    };
  } catch (error) {
    console.warn('Failed to parse DATABASE_URL:', error.message);
    return null;
  }
};

// Parse DATABASE_URL if available, otherwise use individual variables
const parsedDbConfig = parseDBUrl(process.env.DATABASE_URL);

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 4000,
    apiVersion: process.env.API_VERSION || 'v1',
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  // Database configuration
  database: {
    host: parsedDbConfig?.host || process.env.DB_HOST || 'localhost',
    port: parsedDbConfig?.port || process.env.DB_PORT || 5432,
    name: parsedDbConfig?.database || process.env.DB_NAME || 'vanilla_api_dev',
    user: parsedDbConfig?.user || process.env.DB_USER || 'postgres',
    password: parsedDbConfig?.password || process.env.DB_PASSWORD || 'postgres',
    ssl: parsedDbConfig?.ssl || undefined,
    pool: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    debug: process.env.NODE_ENV === 'development'
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-this-in-production',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret'
  },
  
  // Feature flags
  features: {
    dbTest: process.env.NODE_ENV === 'development'
  },
  
  // Development tokens (centralized management)
  // In production, tokens should be generated dynamically
  devTokens: process.env.NODE_ENV === 'development' ? {
    standard: process.env.DEV_TOKEN_STANDARD || null,
    applicant: process.env.DEV_TOKEN_APPLICANT || null,
    recruiter: process.env.DEV_TOKEN_RECRUITER || null,
    admin: process.env.DEV_TOKEN_ADMIN || null,
    // Utility function to get token by role
    getByRole: (role) => {
      const roleTokenMap = {
        'locum': process.env.DEV_TOKEN_APPLICANT || process.env.DEV_TOKEN_STANDARD,
        'recruiter': process.env.DEV_TOKEN_RECRUITER,
        'admin': process.env.DEV_TOKEN_ADMIN
      };
      return roleTokenMap[role] || null;
    }
  } : null,
  
  // Utility functions
  utils: {
    // Generate ISO timestamp string
    timestamp: () => new Date().toISOString(),
    
    // Format log message with timestamp
    formatLogMessage: (method, path) => `${config.utils.timestamp()} - ${method} ${path}`,
    
    // Create timestamped response object
    createTimestampedResponse: (data) => ({
      ...data,
      timestamp: config.utils.timestamp()
    })
  },
  
  // Centralized logging utilities
  logger: {
    // Log info messages with timestamp
    info: (message, context = '') => {
      if (config.logging.level === 'info' || config.logging.debug) {
        const contextStr = context ? ` [${context}]` : '';
        console.log(`${config.utils.timestamp()} - INFO${contextStr}: ${message}`);
      }
    },
    
    // Log error messages with timestamp
    error: (message, error = null, context = '') => {
      const contextStr = context ? ` [${context}]` : '';
      console.error(`${config.utils.timestamp()} - ERROR${contextStr}: ${message}`);
      if (error && config.logging.debug) {
        console.error('Error details:', error);
      }
    },
    
    // Log debug messages (development only)
    debug: (message, context = '') => {
      if (config.logging.debug) {
        const contextStr = context ? ` [${context}]` : '';
        console.log(`${config.utils.timestamp()} - DEBUG${contextStr}: ${message}`);
      }
    },
    
    // Log warning messages
    warn: (message, context = '') => {
      const contextStr = context ? ` [${context}]` : '';
      console.warn(`${config.utils.timestamp()} - WARN${contextStr}: ${message}`);
    },
    
    // Log server startup messages
    startup: (message) => {
      console.log(`🚀 ${message}`);
    }
  }
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    'database.user',
    'database.password',
    'database.name'
  ];
  
  const missing = [];
  
  for (const path of required) {
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        missing.push(path);
        break;
      }
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

// Validate on module load
validateConfig();

module.exports = config;