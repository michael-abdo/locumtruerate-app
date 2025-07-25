const { Pool } = require('pg');
const config = require('../config/config');

// Use centralized database configuration
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
  config.logger.error('Unexpected error on idle database client', err, 'DB_POOL');
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    config.logger.info(`Database connected successfully at: ${result.rows[0].now}`, 'DB_CONNECTION');
    client.release();
    return true;
  } catch (error) {
    config.logger.error('Database connection error', error, 'DB_CONNECTION');
    return false;
  }
};

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    config.logger.debug(`Executed query: ${text} (${duration}ms, ${result.rowCount} rows)`, 'DB_QUERY');
    return result;
  } catch (error) {
    config.logger.error('Database query error', error, 'DB_QUERY');
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

// NOTE: getClient() function removed to prevent connection leaks
// Use transaction() or query() helpers instead for proper connection management

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
  closePool
};