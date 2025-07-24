/**
 * Graceful shutdown handler
 * Centralizes shutdown logic across all servers and processes
 */

const { logError } = require('./errorHandler');
const { closePool } = require('../db/connection');

// Track all resources that need cleanup
const resources = {
  servers: [],
  customHandlers: []
};

/**
 * Register a server for graceful shutdown
 * @param {http.Server} server - The server instance to shut down
 * @param {string} name - A descriptive name for the server
 */
const registerServer = (server, name = 'Server') => {
  resources.servers.push({ server, name });
};

/**
 * Register a custom cleanup handler
 * @param {Function} handler - Async function to run during shutdown
 * @param {string} name - A descriptive name for the handler
 */
const registerHandler = (handler, name = 'Custom Handler') => {
  resources.customHandlers.push({ handler, name });
};

/**
 * Perform graceful shutdown
 * @param {string} signal - The signal that triggered shutdown
 */
const gracefulShutdown = async (signal) => {
  console.log(`\\n${signal} received, starting graceful shutdown...`);
  
  let exitCode = 0;
  
  try {
    // Stop accepting new connections on all servers
    for (const { server, name } of resources.servers) {
      console.log(`Closing ${name}...`);
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logError(`Error closing ${name}`, err);
            reject(err);
          } else {
            console.log(`${name} closed successfully`);
            resolve();
          }
        });
      });
    }
    
    // Run custom cleanup handlers
    for (const { handler, name } of resources.customHandlers) {
      try {
        console.log(`Running cleanup handler: ${name}...`);
        await handler();
        console.log(`${name} completed successfully`);
      } catch (error) {
        logError(`Error in cleanup handler ${name}`, error);
        exitCode = 1;
      }
    }
    
    // Close database connections
    console.log('Closing database connections...');
    await closePool();
    console.log('Database connections closed');
    
    console.log('Graceful shutdown completed');
    
  } catch (error) {
    logError('Error during graceful shutdown', error);
    exitCode = 1;
  }
  
  process.exit(exitCode);
};

// Register signal handlers
const registerSignalHandlers = () => {
  // Handle SIGTERM (used by process managers)
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logError('Uncaught Exception', error);
    gracefulShutdown('uncaughtException');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logError('Unhandled Rejection at', promise);
    logError('Rejection reason', reason);
    gracefulShutdown('unhandledRejection');
  });
};

module.exports = {
  registerServer,
  registerHandler,
  registerSignalHandlers,
  gracefulShutdown
};