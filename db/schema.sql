-- LocumTrueRate Database Schema
-- Minimal User Authentication Tables

-- Users table for authentication and basic profile
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('locum', 'recruiter', 'admin') DEFAULT 'locum',
    first_name VARCHAR(100),
    last_name VARCHAR(100), 
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table for JWT blacklisting (optional)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    jwt_token_id VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_token_id (jwt_token_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a test admin user (password: 'admin123')
-- Password hash generated with bcrypt rounds=10
INSERT IGNORE INTO users (email, password_hash, role, first_name, last_name) VALUES 
('admin@locumtruerate.com', '$2b$10$8K1p/a0dYR3rHkHb9m4dF.NdwqOw5JQ5vKEWy/ZZT7YLvxHGmn6AO', 'admin', 'Admin', 'User'),
('demo@example.com', '$2b$10$8K1p/a0dYR3rHkHb9m4dF.NdwqOw5JQ5vKEWy/ZZT7YLvxHGmn6AO', 'locum', 'Demo', 'User');