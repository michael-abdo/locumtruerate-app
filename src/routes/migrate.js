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
    
    // Read the init.sql file
    const sqlPath = path.join(__dirname, '../db/init.sql');
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

module.exports = router;