const mysql = require('mysql2');
require('dotenv').config();

// Parse JAWSDB_URL or DATABASE_URL if provided (for Heroku MySQL)
let config;

// Check JAWSDB_URL first (JawsDB MySQL addon), then fall back to DATABASE_URL
const databaseURL = process.env.JAWSDB_URL || process.env.DATABASE_URL;

if (databaseURL && databaseURL.startsWith('mysql://')) {
    // Parse Heroku MySQL URL format: mysql://user:password@host:port/database
    const url = new URL(databaseURL);
    config = {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1), // Remove leading slash
        port: url.port || 3306,
        ssl: false, // ClearDB doesn't require SSL
        reconnect: true,
        timeout: 60000
    };
} else {
    // Local development configuration
    config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'locumtruerate',
        port: process.env.DB_PORT || 3306,
        ssl: false
    };
}

// Create connection pool
const pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
});

// Create promise wrapper for async/await support
const promisePool = pool.promise();

// Test connection function
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully');
        console.log(`📊 Connected to: ${config.host}:${config.port}/${config.database}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Initialize database tables
const initializeDatabase = async () => {
    try {
        // Create users table if it doesn't exist
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('locum', 'recruiter', 'admin') DEFAULT 'locum',
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);
        
        console.log('✅ Database tables initialized');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
};

module.exports = {
    pool: promisePool,
    testConnection,
    initializeDatabase
};