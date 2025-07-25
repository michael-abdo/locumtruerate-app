-- Application Performance Indexes
-- Optimizes queries for the Application model endpoints

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications (user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);

-- Sorting and filtering indexes
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON applications (updated_at DESC);

-- Composite indexes for common query patterns
-- User applications with status filtering and date sorting
CREATE INDEX IF NOT EXISTS idx_applications_user_status_created ON applications (user_id, status, created_at DESC);

-- Job applications with status filtering and date sorting  
CREATE INDEX IF NOT EXISTS idx_applications_job_status_created ON applications (job_id, status, created_at DESC);

-- Applications by user and job (unique constraint support)
CREATE INDEX IF NOT EXISTS idx_applications_user_job ON applications (user_id, job_id);

-- Status changes tracking (for reviewer queries)
CREATE INDEX IF NOT EXISTS idx_applications_reviewed_by ON applications (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_applications_reviewed_at ON applications (reviewed_at DESC);

-- Additional indexes for related tables to optimize JOINs
-- Jobs table indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs (posted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);

-- Users table indexes (if not already present)  
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Profiles table indexes for user details JOINs
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);

-- Performance monitoring
-- Add statistics update for PostgreSQL query planner
ANALYZE applications;
ANALYZE jobs; 
ANALYZE users;
ANALYZE profiles;