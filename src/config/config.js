/**
 * Centralized configuration module
 * All application configuration should be accessed through this module
 */

require('dotenv').config();

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
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'vanilla_api_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
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
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret'
  },
  
  // Feature flags
  features: {
    dbTest: process.env.NODE_ENV === 'development'
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