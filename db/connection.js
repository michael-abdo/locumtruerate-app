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
        
        // Create job_listings table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS job_listings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recruiter_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                specialty VARCHAR(100) NOT NULL,
                location VARCHAR(255) NOT NULL,
                hourly_rate DECIMAL(10, 2),
                hours_per_week INT,
                contract_length_weeks INT,
                housing_stipend DECIMAL(10, 2),
                description TEXT,
                requirements TEXT,
                benefits TEXT,
                image_url VARCHAR(500),
                status ENUM('active', 'filled', 'closed') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_recruiter_id (recruiter_id),
                INDEX idx_specialty (specialty),
                INDEX idx_status (status)
            ) ENGINE=InnoDB
        `);
        
        // Create leads table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                recruiter_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                contact_preference ENUM('call', 'email') DEFAULT 'email',
                status ENUM('new', 'contacted', 'converted', 'rejected') DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                contacted_at TIMESTAMP NULL,
                FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE,
                FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_job_id (job_id),
                INDEX idx_recruiter_id (recruiter_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB
        `);
        
        // Create lead_charges table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS lead_charges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lead_id INT NOT NULL,
                recruiter_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL DEFAULT 39.99,
                payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                payment_method VARCHAR(50),
                transaction_id VARCHAR(255),
                charged_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
                FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_lead_id (lead_id),
                INDEX idx_payment_status (payment_status)
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