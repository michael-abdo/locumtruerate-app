/* Database schema for Locum True Rate Calculator
 * 
 * This SQL script creates all the necessary tables for the application:
 * - users: Stores user accounts (locums and recruiters)
 * - saved_calculations: Stores user calculations
 * - job_board: Stores job listings
 * - job_applications: Stores job applications
 * - saved_jobs: Stores saved/favorited jobs
 */

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'locum' or 'recruiter'
  first_name TEXT,
  last_name TEXT,
  specialty TEXT, -- For locum practitioners
  created_at INTEGER NOT NULL, -- UNIX timestamp
  last_login INTEGER
);

-- Create saved_calculations table
CREATE TABLE saved_calculations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  contract_state TEXT NOT NULL,
  practitioner_type TEXT NOT NULL,
  hourly_rate REAL NOT NULL,
  overtime_rate REAL,
  beeper_rate REAL,
  beeper_hours_per_month INTEGER,
  weekly_stipend REAL,
  daily_stipend REAL,
  weeks INTEGER NOT NULL,
  pto INTEGER,
  hours_per_week INTEGER NOT NULL,
  shifts_per_week INTEGER,
  daily_miles INTEGER,
  completion_bonus REAL,
  true_rate REAL NOT NULL,
  gross_contract_value REAL NOT NULL,
  created_at INTEGER NOT NULL, -- UNIX timestamp
  is_public BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create job_board table
CREATE TABLE job_board (
  id TEXT PRIMARY KEY,
  poster_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  contract_state TEXT NOT NULL,
  practitioner_type TEXT NOT NULL,
  hourly_rate REAL NOT NULL,
  overtime_rate REAL,
  beeper_rate REAL,
  weekly_stipend REAL,
  daily_stipend REAL,
  weeks INTEGER NOT NULL,
  hours_per_week INTEGER NOT NULL,
  shifts_per_week INTEGER,
  completion_bonus REAL,
  posted_at INTEGER NOT NULL, -- UNIX timestamp
  expires_at INTEGER, -- UNIX timestamp
  FOREIGN KEY (poster_id) REFERENCES users(id)
);

-- Create job_applications table
CREATE TABLE job_applications (
  id TEXT PRIMARY KEY,
  applicant_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'reviewed', 'contacted', 'accepted', 'declined', 'withdrawn'
  applied_at INTEGER NOT NULL, -- UNIX timestamp
  updated_at INTEGER,
  notes TEXT,
  FOREIGN KEY (applicant_id) REFERENCES users(id),
  FOREIGN KEY (listing_id) REFERENCES job_board(id)
);

-- Create saved_jobs table
CREATE TABLE saved_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  saved_at INTEGER NOT NULL, -- UNIX timestamp
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (listing_id) REFERENCES job_board(id),
  UNIQUE(user_id, listing_id)
);

-- Create indexes for performance
CREATE INDEX idx_saved_calculations_user ON saved_calculations(user_id);
CREATE INDEX idx_job_board_poster ON job_board(poster_id);
CREATE INDEX idx_job_board_state ON job_board(contract_state);
CREATE INDEX idx_job_board_type ON job_board(practitioner_type);
CREATE INDEX idx_job_applications_applicant ON job_applications(applicant_id);
CREATE INDEX idx_job_applications_listing ON job_applications(listing_id);
CREATE INDEX idx_saved_jobs_user ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_listing ON saved_jobs(listing_id);

-- Sample data for testing (optional)
INSERT INTO users (id, email, hashed_password, user_type, created_at) VALUES 
('00000000-0000-0000-0000-000000000001', 'demo-locum@example.com', '7b1e6e5df75d8d6752f5724085ecc9f46d45f43128b3a9d8f53e5e8d9d8e2e82', 'locum', 1714262400),
('00000000-0000-0000-0000-000000000002', 'demo-recruiter@example.com', '7b1e6e5df75d8d6752f5724085ecc9f46d45f43128b3a9d8f53e5e8d9d8e2e82', 'recruiter', 1714262400);