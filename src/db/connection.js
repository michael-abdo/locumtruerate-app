const { Pool } = require('pg');
const { logError } = require('../utils/errorHandler');
const config = require('../config/config');

// Database configuration from centralized config
const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ...config.database.pool
};

// Create pool instance
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  logError('Unexpected error on idle database client', err);
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected successfully at:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    logError('Database connection error', error);
    return false;
  }
};

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.logging.debug) {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    logError('Database query error', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get a client from the pool
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Close all connections
const closePool = async () => {
  await pool.end();
};

module.exports = {
  pool,
  dbConfig,
  testConnection,
  query,
  transaction,
  getClient,
  closePool
};