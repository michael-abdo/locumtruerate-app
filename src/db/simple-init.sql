CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'locum',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    status VARCHAR(20) DEFAULT 'pending',
    cover_letter TEXT,
    expected_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);

INSERT INTO users (email, password_hash, role) VALUES
('john.doe@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye/6/SYG8ZnS3J8YqGw0L2OiQSfEf4LSu', 'locum'),
('jane.recruiter@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye/6/SYG8ZnS3J8YqGw0L2OiQSfEf4LSu', 'recruiter')
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name) VALUES
(1, 'John', 'Doe'),
(2, 'Jane', 'Recruiter')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO jobs (title, location, state, specialty, description, hourly_rate_min, hourly_rate_max, posted_by, company_name) VALUES
('Internal Medicine Physician', 'New York, NY', 'NY', 'Internal Medicine', 'Seeking experienced IM physician for 3-month assignment', 300, 350, 2, 'NYC Medical Center'),
('Emergency Medicine Physician', 'Los Angeles, CA', 'CA', 'Emergency Medicine', 'ER coverage needed for busy Level II trauma center', 350, 400, 2, 'LA County Hospital')
ON CONFLICT DO NOTHING;