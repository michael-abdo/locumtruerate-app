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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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

module.exports = router;