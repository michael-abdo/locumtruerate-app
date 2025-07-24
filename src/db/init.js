const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const initDatabase = async () => {
  // Connection config for postgres database (to create our database)
  const adminConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default postgres database first
  };

  const dbName = process.env.DB_NAME || 'locumtruerate_dev';
  
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
    const dbConfig = {
      ...adminConfig,
      database: dbName
    };

    const client = new Client(dbConfig);
    await client.connect();
    console.log(`Connected to database ${dbName}`);

    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await client.query(sql);
    console.log('Database schema created successfully');

    await client.end();
    console.log('Database initialization completed');

  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };