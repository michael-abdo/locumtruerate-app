/**
 * Shared error handling utilities
 * Provides consistent error logging and handling across the application
 */

const logError = (context, error) => {
  console.error(`${context}:`, error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
};

const exitOnError = (context, error, exitCode = 1) => {
  logError(context, error);
  process.exit(exitCode);
};

module.exports = { logError, exitOnError };