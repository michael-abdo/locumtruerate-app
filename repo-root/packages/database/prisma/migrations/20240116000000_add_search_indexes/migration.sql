-- Add GIN indexes for full-text search on PostgreSQL
-- These indexes enable efficient text search across job listings and user profiles

-- Create text search configuration for healthcare terms
CREATE TEXT SEARCH CONFIGURATION healthcare_search (COPY = english);

-- Add custom dictionary for medical specialties and terms
CREATE TEXT SEARCH DICTIONARY healthcare_dict (
    TEMPLATE = simple,
    STOPWORDS = english
);

ALTER TEXT SEARCH CONFIGURATION healthcare_search
    ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
    WITH healthcare_dict, english_stem;

-- Add search vector columns to jobs table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector for jobs
CREATE OR REPLACE FUNCTION update_job_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('healthcare_search', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('healthcare_search', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('healthcare_search', COALESCE(NEW.requirements, '')), 'C') ||
        setweight(to_tsvector('healthcare_search', COALESCE(NEW.location, '')), 'B') ||
        setweight(to_tsvector('healthcare_search', COALESCE(NEW.category, '')), 'A') ||
        setweight(to_tsvector('healthcare_search', COALESCE(NEW.type, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER update_job_search_vector_trigger
    BEFORE INSERT OR UPDATE OF title, description, requirements, location, category, type
    ON "Job"
    FOR EACH ROW
    EXECUTE FUNCTION update_job_search_vector();

-- Create GIN index on search vector
CREATE INDEX IF NOT EXISTS idx_job_search_vector ON "Job" USING GIN (search_vector);

-- Add additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_location ON "Job" USING GIST (location gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_category ON "Job" (category);
CREATE INDEX IF NOT EXISTS idx_job_type ON "Job" (type);
CREATE INDEX IF NOT EXISTS idx_job_salary_range ON "Job" (salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_job_created_at ON "Job" (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_status ON "Job" (status) WHERE status = 'ACTIVE';

-- Add search vector for users
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector for users
CREATE OR REPLACE FUNCTION update_user_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('healthcare_search', 
            COALESCE(NEW."firstName", '') || ' ' || COALESCE(NEW."lastName", '')
        ), 'A') ||
        setweight(to_tsvector('healthcare_search', COALESCE(NEW.role, '')), 'A') ||
        setweight(to_tsvector('healthcare_search', COALESCE(NEW.specialty, '')), 'A') ||
        setweight(to_tsvector('healthcare_search', COALESCE(NEW.location, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user search vector
CREATE TRIGGER update_user_search_vector_trigger
    BEFORE INSERT OR UPDATE OF "firstName", "lastName", role, specialty, location
    ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_search_vector();

-- Create GIN index on user search vector
CREATE INDEX IF NOT EXISTS idx_user_search_vector ON "User" USING GIN (search_vector);

-- Add trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_job_title_trgm ON "Job" USING GIST (title gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_name_trgm ON "User" USING GIST (("firstName" || ' ' || "lastName") gist_trgm_ops);

-- Update existing records to populate search vectors
UPDATE "Job" SET search_vector = search_vector WHERE search_vector IS NULL;
UPDATE "User" SET search_vector = search_vector WHERE search_vector IS NULL;