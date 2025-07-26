const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/config');
const { testConnection, closePool } = require('./db/connection');
const { createErrorResponse, cleanup: cleanupAuth } = require('./middleware/auth');
const { metricsMiddleware, metricsInstance } = require('./middleware/metrics');

// Create Express app
const app = express();

// Get configuration from centralized config
const PORT = config.server.port;
const API_VERSION = config.server.apiVersion;

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for demo pages
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// CORS configuration - Allow multiple origins for development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8000', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8000',
      'https://locumtruerate-staging-66ba3177c382.herokuapp.com',
      // Add common frontend deployment domains
      'https://locumtruerate.netlify.app',
      'https://locumtruerate.vercel.app',
      'https://michael-abdo.github.io',
      'https://michael-abdo.github.io/locumtruerate-app'
    ];
    
    // Add environment-specific origin if configured
    if (config.server.corsOrigin && !allowedOrigins.includes(config.server.corsOrigin)) {
      allowedOrigins.push(config.server.corsOrigin);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Performance metrics middleware
app.use(metricsMiddleware);

// Static file serving for frontend assets
app.use(express.static('frontend'));
app.use(express.static('.', { 
  index: false, // Don't auto-serve index files from root
  setHeaders: (res, path) => {
    // Cache CSS and JS files for better performance
    if (path.endsWith('.css') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

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
      jobs: `/api/${API_VERSION}/jobs`,
      applications: `/api/${API_VERSION}/applications`,
      myApplications: `/api/${API_VERSION}/applications/my`,
      jobApplications: `/api/${API_VERSION}/applications/for-job/:jobId`,
      searchApplications: `/api/${API_VERSION}/applications/search`,
      searchJobApplications: `/api/${API_VERSION}/applications/for-job/:jobId/search`,
      filterOptions: `/api/${API_VERSION}/applications/filter-options`,
      dataExport: `/api/${API_VERSION}/data-export/my-data`,
      privacySummary: `/api/${API_VERSION}/data-export/privacy-summary`,
      deletionRequest: `/api/${API_VERSION}/data-export/request-deletion`,
      calculateContract: `/api/${API_VERSION}/calculate/contract`,
      calculatePaycheck: `/api/${API_VERSION}/calculate/paycheck`,
      calculateSimplePaycheck: `/api/${API_VERSION}/calculate/simple-paycheck`,
      taxInfo: `/api/${API_VERSION}/calculate/tax-info`,
      statesList: `/api/${API_VERSION}/calculate/states`
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

// Performance metrics endpoint
app.get('/api/metrics', (req, res) => {
  try {
    const report = metricsInstance.getPerformanceReport();
    res.json(report);
  } catch (error) {
    return createErrorResponse(res, 500, 'Error retrieving metrics', 'metrics_error');
  }
});

// Metrics summary endpoint (lightweight)
app.get('/api/metrics/summary', (req, res) => {
  try {
    const summary = metricsInstance.getMetricsSummary();
    res.json(summary);
  } catch (error) {
    return createErrorResponse(res, 500, 'Error retrieving metrics summary', 'metrics_summary_error');
  }
});

// Authentication routes
const authRoutes = require('./routes/auth');
app.use(`/api/${API_VERSION}/auth`, authRoutes);

// Jobs routes
const jobsRoutes = require('./routes/jobs');
app.use('/api/v1/jobs', jobsRoutes);

// Applications routes
const applicationsRoutes = require('./routes/applications');
app.use(`/api/${API_VERSION}/applications`, applicationsRoutes);

// Data export routes (GDPR compliance)
const dataExportRoutes = require('./routes/data-export');
app.use(`/api/${API_VERSION}/data-export`, dataExportRoutes);

// Calculator routes
const calculateRoutes = require('./routes/calculate');
app.use(`/api/${API_VERSION}/calculate`, calculateRoutes);

// Migration routes (for database initialization)
const migrateRoutes = require('./routes/migrate');
app.use(`/api/${API_VERSION}/migrate`, migrateRoutes);

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

// Graceful shutdown function
const gracefulShutdown = async (signal) => {
  config.logger.info(`${signal} received, shutting down gracefully...`, 'SERVER_SHUTDOWN');
  
  try {
    // Close database connections
    await closePool();
    config.logger.info('Database pool closed', 'SERVER_SHUTDOWN');
  } catch (error) {
    config.logger.error('Error closing database pool', error, 'SERVER_SHUTDOWN');
  }
  
  try {
    // Cleanup auth module (clear intervals, etc.)
    cleanupAuth();
    config.logger.info('Auth module cleaned up', 'SERVER_SHUTDOWN');
  } catch (error) {
    config.logger.error('Error cleaning up auth module', error, 'SERVER_SHUTDOWN');
  }
  
  process.exit(0);
};

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  config.logger.error('Unhandled Promise Rejection', reason, 'GLOBAL_ERROR');
  config.logger.error('Promise that rejected:', promise, 'GLOBAL_ERROR');
  // Don't exit process, just log the error to prevent crashes
});

// Store timeout ID for cleanup if needed
let uncaughtExceptionTimeout = null;

process.on('uncaughtException', (error) => {
  config.logger.error('Uncaught Exception', error, 'GLOBAL_ERROR');
  // Log error but don't exit immediately to allow graceful cleanup
  
  // Clear any existing timeout
  if (uncaughtExceptionTimeout) {
    clearTimeout(uncaughtExceptionTimeout);
  }
  
  uncaughtExceptionTimeout = setTimeout(() => {
    config.logger.error('Exiting due to uncaught exception', null, 'GLOBAL_ERROR');
    process.exit(1);
  }, 1000);
});

// Start the server
startServer();

module.exports = app;