const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./db/connection');

// Create Express app
const app = express();

// Get port from environment or default
const PORT = process.env.PORT || 4000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'locumtruerate-api',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Database connection test failed',
        message: error.message
      });
    }
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource ${req.path} was not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('WARNING: Database connection failed. API will start but database operations will fail.');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 LocumTrueRate API Server`);
      console.log(`   Version: ${API_VERSION}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   API Base: http://localhost:${PORT}/api/${API_VERSION}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;