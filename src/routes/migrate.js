const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { pool } = require('../db/connection');
const config = require('../config/config');

/**
 * Database migration endpoint for Heroku deployment
 * POST /api/v1/migrate/init - Initialize database tables
 */
router.post('/init', async (req, res) => {
  try {
    config.logger.info('Starting database migration...', 'MIGRATION');
    
    // Read the simple-init.sql file
    const sqlPath = path.join(__dirname, '../db/simple-init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Clean and split SQL statements
    const cleanSql = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');
    
    const statements = cleanSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    config.logger.info(`Found ${statements.length} SQL statements to execute`, 'MIGRATION');
    
    let executedCount = 0;
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          config.logger.debug(`Executing: ${statement.substring(0, 50)}...`, 'MIGRATION');
          await pool.query(statement);
          executedCount++;
        } catch (error) {
          // Log but continue - some statements might fail if tables already exist
          config.logger.warn(`Migration statement warning: ${error.message}`, 'MIGRATION');
        }
      }
    }
    
    config.logger.info(`Database migration completed. Executed ${executedCount} statements.`, 'MIGRATION');
    
    res.json({
      success: true,
      message: `Database migration completed successfully. Executed ${executedCount} statements.`,
      timestamp: config.utils.timestamp()
    });
    
  } catch (error) {
    config.logger.error('Database migration failed', error, 'MIGRATION');
    res.status(500).json({
      error: 'migration_failed',
      message: 'Database migration failed',
      details: error.message,
      timestamp: config.utils.timestamp()
    });
  }
});

/**
 * Check database status
 * GET /api/v1/migrate/status - Check if tables exist
 */
router.get('/status', async (req, res) => {
  try {
    const tables = ['users', 'profiles', 'jobs', 'applications'];
    const status = {};
    
    for (const table of tables) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`,
          [table]
        );
        status[table] = parseInt(result.rows[0].count) > 0;
      } catch (error) {
        status[table] = false;
      }
    }
    
    const allTablesExist = Object.values(status).every(exists => exists);
    
    res.json({
      success: true,
      database_ready: allTablesExist,
      tables: status,
      timestamp: config.utils.timestamp()
    });
    
  } catch (error) {
    config.logger.error('Failed to check database status', error, 'MIGRATION');
    res.status(500).json({
      error: 'status_check_failed',
      message: 'Failed to check database status',
      timestamp: config.utils.timestamp()
    });
  }
});

/**
 * Simple table creation endpoint
 * POST /api/v1/migrate/create-tables - Create basic tables
 */
router.post('/create-tables', async (req, res) => {
  try {
    config.logger.info('Creating basic tables...', 'MIGRATION');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'locum',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create basic sample user
    await pool.query(`
      INSERT INTO users (email, password_hash, role) VALUES
      ('john.doe@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye/6/SYG8ZnS3J8YqGw0L2OiQSfEf4LSu', 'locum')
      ON CONFLICT (email) DO NOTHING
    `);
    
    // Create jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        state VARCHAR(2) NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        description TEXT,
        hourly_rate_min DECIMAL(10,2),
        hourly_rate_max DECIMAL(10,2),
        posted_by INTEGER NOT NULL REFERENCES users(id),
        company_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        status VARCHAR(20) DEFAULT 'pending',
        cover_letter TEXT,
        expected_rate DECIMAL(10,2),
        available_date DATE,
        notes TEXT,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, job_id)
      )
    `);
    
    config.logger.info('Basic tables created successfully', 'MIGRATION');
    
    res.json({
      success: true,
      message: 'Basic database tables created successfully',
      timestamp: config.utils.timestamp()
    });
    
  } catch (error) {
    config.logger.error('Failed to create tables', error, 'MIGRATION');
    res.status(500).json({
      error: 'table_creation_failed',
      message: 'Failed to create database tables',
      details: error.message,
      timestamp: config.utils.timestamp()
    });
  }
});

/**
 * Debug endpoint to show database configuration (staging only)
 * GET /api/v1/migrate/debug - Show database config
 */
router.get('/debug', async (req, res) => {
  try {
    const { database } = require('../config/config');
    
    res.json({
      success: true,
      database_config: {
        host: database.host,
        port: database.port,
        database: database.name,
        user: database.user,
        password: database.password ? '***hidden***' : 'undefined',
        pool: database.pool
      },
      env_vars: {
        DATABASE_URL: process.env.DATABASE_URL ? 'present' : 'missing',
        DB_HOST: process.env.DB_HOST || 'undefined',
        NODE_ENV: process.env.NODE_ENV
      },
      timestamp: require('../config/config').utils.timestamp()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'debug_failed',
      message: error.message,
      timestamp: require('../config/config').utils.timestamp()
    });
  }
});

/**
 * POST /api/v1/migrate/fix-applications-schema
 * Drop and recreate applications table with correct schema
 */
router.post('/fix-applications-schema', async (req, res) => {
  try {
    config.logger.info('Fixing applications table schema...', 'MIGRATION');
    
    // Drop existing applications table
    await pool.query('DROP TABLE IF EXISTS applications CASCADE');
    
    // Create applications table with correct schema
    await pool.query(`
      CREATE TABLE applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        status VARCHAR(20) DEFAULT 'pending',
        cover_letter TEXT,
        expected_rate DECIMAL(10,2),
        available_date DATE,
        notes TEXT,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, job_id)
      )
    `);
    
    config.logger.info('Applications table schema fixed successfully', 'MIGRATION');
    
    res.json({
      success: true,
      message: 'Applications table schema fixed successfully',
      timestamp: config.utils.timestamp()
    });
    
  } catch (error) {
    config.logger.error('Failed to fix applications schema', error, 'MIGRATION');
    res.status(500).json({
      error: 'applications_schema_fix_failed',
      message: 'Failed to fix applications table schema',
      details: error.message,
      timestamp: config.utils.timestamp()
    });
  }
});

/**
 * GET /api/v1/migrate/schema
 * Get detailed schema information for all tables
 */
router.get('/schema', async (req, res) => {
  try {
    config.logger.info('Fetching database schema information', 'MIGRATION');
    
    // Query to get all columns for our tables
    const schemaQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'profiles', 'jobs', 'applications', 'job_requirements')
      ORDER BY table_name, ordinal_position
    `;
    
    const result = await pool.query(schemaQuery);
    
    // Group columns by table
    const schema = {};
    result.rows.forEach(row => {
      if (!schema[row.table_name]) {
        schema[row.table_name] = [];
      }
      schema[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default,
        maxLength: row.character_maximum_length
      });
    });
    
    res.json({
      success: true,
      schema,
      tableCount: Object.keys(schema).length,
      timestamp: config.utils.timestamp()
    });
    
  } catch (error) {
    config.logger.error('Schema fetch error', error, 'MIGRATION');
    res.status(500).json({
      error: 'schema_fetch_failed',
      message: 'Failed to fetch schema information',
      details: error.message,
      timestamp: config.utils.timestamp()
    });
  }
});

module.exports = router;