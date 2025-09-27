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

-- Job listings table
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
    INDEX idx_location (location),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leads table for job applications
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
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead charges table to track payments
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
    INDEX idx_recruiter_id (recruiter_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a test admin user (password: 'admin123')
-- Password hash generated with bcrypt rounds=10
INSERT IGNORE INTO users (email, password_hash, role, first_name, last_name) VALUES 
('admin@locumtruerate.com', '$2b$10$8K1p/a0dYR3rHkHb9m4dF.NdwqOw5JQ5vKEWy/ZZT7YLvxHGmn6AO', 'admin', 'Admin', 'User'),
('demo@example.com', '$2b$10$8K1p/a0dYR3rHkHb9m4dF.NdwqOw5JQ5vKEWy/ZZT7YLvxHGmn6AO', 'locum', 'Demo', 'User'),
('recruiter@example.com', '$2b$10$8K1p/a0dYR3rHkHb9m4dF.NdwqOw5JQ5vKEWy/ZZT7YLvxHGmn6AO', 'recruiter', 'Demo', 'Recruiter');