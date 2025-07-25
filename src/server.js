const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/config');
const { testConnection } = require('./db/connection');
const { createErrorResponse } = require('./middleware/auth');

// Create Express app
const app = express();

// Get configuration from centralized config
const PORT = config.server.port;
const API_VERSION = config.server.apiVersion;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: config.server.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (config.server.env === 'development') {
  app.use((req, res, next) => {
    console.log(config.utils.formatLogMessage(req.method, req.path));
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'locumtruerate-api',
    version: API_VERSION,
    timestamp: config.utils.timestamp(),
    environment: config.server.env
  });
});

// API info endpoint
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({
    message: 'LocumTrueRate API',
    version: API_VERSION,
    endpoints: {
      health: '/health',
      auth: `/api/${API_VERSION}/auth`,
      users: `/api/${API_VERSION}/users`,
      jobs: `/api/${API_VERSION}/jobs`,
      applications: `/api/${API_VERSION}/applications`
    }
  });
});

// Database connection test endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/db-test', async (req, res) => {
    try {
      const connected = await testConnection();
      res.json({
        database: connected ? 'connected' : 'disconnected',
        timestamp: config.utils.timestamp()
      });
    } catch (error) {
      return createErrorResponse(res, 500, error.message, 'database_connection_test_failed');
    }
  });
}

// Authentication routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  return createErrorResponse(res, 404, `The requested resource ${req.path} was not found`, 'not_found');
});

// Global error handler
app.use((err, req, res, next) => {
  config.logger.error('Global error handler triggered', err, 'SERVER');
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const meta = process.env.NODE_ENV === 'development' ? { stack: err.stack } : {};
  
  return createErrorResponse(res, status, message, 'server_error', meta);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    config.logger.info('Testing database connection...', 'SERVER_STARTUP');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      config.logger.warn('Database connection failed. API will start but database operations will fail.', 'SERVER_STARTUP');
    }

    // Start listening
    app.listen(PORT, () => {
      config.logger.startup(`LocumTrueRate API Server`);
      config.logger.info(`Version: ${API_VERSION}`, 'SERVER_STARTUP');
      config.logger.info(`Port: ${PORT}`, 'SERVER_STARTUP');
      config.logger.info(`Environment: ${config.server.env}`, 'SERVER_STARTUP');
      config.logger.info(`Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`, 'SERVER_STARTUP');
      config.logger.info(`URL: http://localhost:${PORT}`, 'SERVER_STARTUP');
      config.logger.info(`API Base: http://localhost:${PORT}/api/${API_VERSION}`, 'SERVER_STARTUP');
    });
  } catch (error) {
    config.logger.error('Failed to start server', error, 'SERVER_STARTUP');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  config.logger.info('SIGTERM received, shutting down gracefully...', 'SERVER_SHUTDOWN');
  process.exit(0);
});

process.on('SIGINT', async () => {
  config.logger.info('SIGINT received, shutting down gracefully...', 'SERVER_SHUTDOWN');
  process.exit(0);
});

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  config.logger.error('Unhandled Promise Rejection', reason, 'GLOBAL_ERROR');
  config.logger.error('Promise that rejected:', promise, 'GLOBAL_ERROR');
  // Don't exit process, just log the error to prevent crashes
});

process.on('uncaughtException', (error) => {
  config.logger.error('Uncaught Exception', error, 'GLOBAL_ERROR');
  // Log error but don't exit immediately to allow graceful cleanup
  setTimeout(() => {
    config.logger.error('Exiting due to uncaught exception', null, 'GLOBAL_ERROR');
    process.exit(1);
  }, 1000);
});

// Start the server
startServer();

module.exports = app;