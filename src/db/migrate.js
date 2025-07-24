const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { dbConfig } = require('./connection');
const { logError, exitOnError } = require('../utils/errorHandler');

const migrate = async () => {
  const client = new Client(dbConfig);

  try {
    // Connect to database
    await client.connect();
    console.log(`Connected to database: ${dbConfig.database}`);

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'schema.sql');
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
    await client.end();
    exitOnError('❌ Migration failed', error);
  } finally {
    await client.end();
  }
};

// Run migrations if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };