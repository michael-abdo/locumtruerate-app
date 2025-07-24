const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const migrate = async () => {
  // Database configuration
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'vanilla_api_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  };

  const client = new Client(config);

  try {
    // Connect to database
    await client.connect();
    console.log(`Connected to database: ${config.database}`);

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'day2-init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    console.log('Running migrations...');
    await client.query(sql);
    console.log('✅ Migrations completed successfully!');

    // List created tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    
    console.log('\nCreated tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

// Run migrations if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };