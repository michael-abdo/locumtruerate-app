const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { dbConfig } = require('./connection');
const config = require('../config/config');

const initDatabase = async () => {
  // Connection config for postgres database (to create our database)
  const adminConfig = {
    ...dbConfig,
    database: 'postgres' // Connect to default postgres database first
  };

  const dbName = dbConfig.database;
  
  const adminClient = new Client(adminConfig);
  
  try {
    // Connect to postgres database
    await adminClient.connect();
    config.logger.info('Connected to PostgreSQL server', 'DB_INIT');

    // Check if database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExists = await adminClient.query(checkDbQuery, [dbName]);

    if (dbExists.rows.length === 0) {
      // Create database if it doesn't exist
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      config.logger.info(`Database ${dbName} created successfully`, 'DB_INIT');
    } else {
      config.logger.info(`Database ${dbName} already exists`, 'DB_INIT');
    }

    await adminClient.end();

    // Now connect to our newly created database using centralized config
    const targetDbConfig = dbConfig;

    const client = new Client(targetDbConfig);
    await client.connect();
    config.logger.info(`Connected to database ${dbName}`, 'DB_INIT');

    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await client.query(sql);
    config.logger.info('Database schema created successfully', 'DB_INIT');

    await client.end();
    config.logger.info('Database initialization completed', 'DB_INIT');

  } catch (error) {
    config.logger.error('Database initialization error', error, 'DB_INIT');
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };