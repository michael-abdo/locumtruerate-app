-- Database initialization script for LocumTrueRate API

-- Create database (run this as superuser)
-- CREATE DATABASE locumtruerate_dev;
-- CREATE DATABASE locumtruerate_test;

-- Connect to the database before running the rest
-- \c locumtruerate_dev

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS job_requirements CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'locum' CHECK (role IN ('locum', 'recruiter', 'admin')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create profiles table
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    specialty VARCHAR(100),
    years_experience INTEGER,
    license_number VARCHAR(100),
    license_state VARCHAR(2),
    resume_url VARCHAR(500),
    photo_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    state VARCHAR(2) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    description TEXT,
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    duration VARCHAR(50),
    shift_type VARCHAR(50),
    posted_by INTEGER NOT NULL REFERENCES users(id),
    company_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'filled', 'closed')),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create job requirements table
CREATE TABLE job_requirements (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    requirement TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create applications table
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected', 'withdrawn')),
    cover_letter TEXT,
    expected_rate DECIMAL(10,2),
    available_date DATE,
    notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_specialty ON jobs(specialty);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for development
INSERT INTO users (email, password_hash, role) VALUES
    ('admin@locumtruerate.com', '$2b$10$YourHashedPasswordHere', 'admin'),
    ('recruiter@example.com', '$2b$10$YourHashedPasswordHere', 'recruiter'),
    ('locum@example.com', '$2b$10$YourHashedPasswordHere', 'locum');

-- Add sample profiles
INSERT INTO profiles (user_id, first_name, last_name, specialty, years_experience) VALUES
    (1, 'Admin', 'User', 'Administration', 10),
    (2, 'Jane', 'Recruiter', 'Healthcare Recruiting', 5),
    (3, 'Dr. John', 'Locum', 'Internal Medicine', 8);

-- Add sample jobs
INSERT INTO jobs (title, location, state, specialty, description, hourly_rate_min, hourly_rate_max, posted_by, company_name) VALUES
    ('Internal Medicine Physician', 'New York, NY', 'NY', 'Internal Medicine', 'Seeking experienced IM physician for 3-month assignment', 300, 350, 2, 'NYC Medical Center'),
    ('Emergency Medicine Physician', 'Los Angeles, CA', 'CA', 'Emergency Medicine', 'ER coverage needed for busy Level II trauma center', 350, 400, 2, 'LA County Hospital');

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;