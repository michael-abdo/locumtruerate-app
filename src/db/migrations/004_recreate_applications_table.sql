-- Drop and recreate applications tables to ensure correct structure
BEGIN;

-- Drop dependent tables first
DROP TABLE IF EXISTS application_communications CASCADE;
DROP TABLE IF EXISTS application_documents CASCADE;
DROP TABLE IF EXISTS application_status_history CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- Recreate applications table with all columns
CREATE TABLE applications (
    -- Primary identification
    id SERIAL PRIMARY KEY,
    
    -- Foreign key relationships
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Application metadata
    application_status VARCHAR(50) DEFAULT 'submitted' CHECK (
        application_status IN (
            'draft', 'submitted', 'under_review', 'interview_scheduled',
            'interviewed', 'offer_extended', 'accepted', 'rejected',
            'withdrawn', 'expired'
        )
    ),
    
    -- Applicant information
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(20),
    
    -- Application content
    cover_letter TEXT,
    resume_text TEXT,
    additional_notes TEXT,
    
    -- Job-specific application details
    availability_start DATE,
    availability_end DATE,
    salary_expectation DECIMAL(10,2),
    hourly_rate_expectation DECIMAL(8,2),
    preferred_location VARCHAR(255),
    willing_to_relocate BOOLEAN DEFAULT false,
    
    -- Experience and qualifications
    years_experience INTEGER,
    specialty VARCHAR(100),
    board_certifications TEXT[],
    licenses TEXT[],
    
    -- Application process tracking
    source VARCHAR(100),
    recruiter_notes TEXT,
    interview_date TIMESTAMP,
    interview_type VARCHAR(50),
    interview_notes TEXT,
    
    -- Response tracking
    employer_response TEXT,
    response_date TIMESTAMP,
    rejection_reason VARCHAR(255),
    
    -- Offer details
    offer_amount DECIMAL(10,2),
    offer_hourly_rate DECIMAL(8,2),
    offer_start_date DATE,
    offer_end_date DATE,
    offer_benefits TEXT,
    offer_expiry_date DATE,
    
    -- File attachments
    resume_file_path VARCHAR(500),
    cover_letter_file_path VARCHAR(500),
    portfolio_file_path VARCHAR(500),
    references_file_path VARCHAR(500),
    
    -- Privacy and compliance
    consent_to_contact BOOLEAN DEFAULT true,
    privacy_policy_accepted BOOLEAN DEFAULT false,
    terms_accepted BOOLEAN DEFAULT false,
    
    -- System metadata
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    
    -- Ensure unique application per user per job
    UNIQUE(user_id, job_id)
);

-- Recreate other tables
CREATE TABLE application_status_history (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN (
            'resume', 'cover_letter', 'portfolio', 'references',
            'certification', 'license', 'transcript', 'other'
        )
    ),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE application_communications (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL CHECK (
        communication_type IN (
            'email', 'phone_call', 'text_message', 
            'video_call', 'in_person', 'system_notification'
        )
    ),
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    sender_type VARCHAR(20) CHECK (sender_type IN ('applicant', 'employer', 'system')),
    subject VARCHAR(255),
    content TEXT,
    attachments TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(application_status);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_is_active ON applications(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;