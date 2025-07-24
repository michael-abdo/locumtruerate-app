const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { dbConfig } = require('./connection');
const { logError, exitOnError } = require('../utils/errorHandler');

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
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExists = await adminClient.query(checkDbQuery, [dbName]);

    if (dbExists.rows.length === 0) {
      // Create database if it doesn't exist
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    await adminClient.end();

    // Now connect to our newly created database
    const dbConnectionConfig = {
      ...adminConfig,
      database: dbName
    };

    const client = new Client(dbConnectionConfig);
    await client.connect();
    console.log(`Connected to database ${dbName}`);

    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await client.query(sql);
    console.log('Database schema created successfully');

    await client.end();
    console.log('Database initialization completed');

  } catch (error) {
    exitOnError('Database initialization error', error);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };