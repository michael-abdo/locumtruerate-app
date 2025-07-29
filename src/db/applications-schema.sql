-- Applications Database Schema
-- This schema supports comprehensive job application management for the LocumTrueRate platform

-- Main applications table
CREATE TABLE IF NOT EXISTS applications (
    -- Primary identification
    id SERIAL PRIMARY KEY,
    
    -- Foreign key relationships
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Application metadata
    application_status VARCHAR(50) DEFAULT 'submitted' CHECK (
        application_status IN (
            'draft',        -- Application being prepared
            'submitted',    -- Application sent to employer
            'under_review', -- Being reviewed by employer
            'interview_scheduled', -- Interview has been scheduled
            'interviewed',  -- Interview completed
            'offer_extended', -- Job offer made
            'accepted',     -- Offer accepted by applicant
            'rejected',     -- Application rejected
            'withdrawn',    -- Application withdrawn by applicant
            'expired'       -- Application expired
        )
    ),
    
    -- Applicant information (may differ from user profile for different applications)
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
    board_certifications TEXT[], -- Array of certifications
    licenses TEXT[], -- Array of license numbers/states
    
    -- Application process tracking
    source VARCHAR(100), -- How they found the job (website, recruiter, etc.)
    recruiter_notes TEXT, -- Internal notes from recruiter
    interview_date TIMESTAMP,
    interview_type VARCHAR(50), -- phone, video, in-person
    interview_notes TEXT,
    
    -- Response tracking
    employer_response TEXT,
    response_date TIMESTAMP,
    rejection_reason VARCHAR(255),
    
    -- Offer details (if applicable)
    offer_amount DECIMAL(10,2),
    offer_hourly_rate DECIMAL(8,2),
    offer_start_date DATE,
    offer_end_date DATE,
    offer_benefits TEXT,
    offer_expiry_date DATE,
    
    -- File attachments (stored as file paths or URLs)
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
    
    -- Ensure unique application per user per job (prevent duplicates)
    UNIQUE(user_id, job_id)
);

-- Application status history table (tracks all status changes)
CREATE TABLE IF NOT EXISTS application_status_history (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(id), -- Who made the change
    change_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application documents table (for multiple file attachments)
CREATE TABLE IF NOT EXISTS application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN (
            'resume',
            'cover_letter',
            'portfolio',
            'references',
            'certification',
            'license',
            'transcript',
            'other'
        )
    ),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application communications table (emails, messages, etc.)
CREATE TABLE IF NOT EXISTS application_communications (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL CHECK (
        communication_type IN (
            'email',
            'phone_call',
            'text_message',
            'video_call',
            'in_person',
            'system_notification'
        )
    ),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    from_user_id INTEGER REFERENCES users(id),
    to_email VARCHAR(255),
    subject VARCHAR(255),
    message_body TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Application reminders table
CREATE TABLE IF NOT EXISTS application_reminders (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (
        reminder_type IN (
            'follow_up',
            'interview_prep',
            'document_deadline',
            'offer_expiry',
            'availability_update'
        )
    ),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(application_status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_applications_active ON applications(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_created_at ON application_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_type ON application_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_application_communications_application_id ON application_communications(application_id);
CREATE INDEX IF NOT EXISTS idx_application_communications_sent_at ON application_communications(sent_at);

CREATE INDEX IF NOT EXISTS idx_application_reminders_user_id ON application_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_application_reminders_due_date ON application_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_application_reminders_completed ON application_reminders(completed) WHERE completed = false;

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_applications_updated_at();

-- Trigger to automatically create status history entries
CREATE OR REPLACE FUNCTION create_application_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.application_status != NEW.application_status) THEN
        INSERT INTO application_status_history (
            application_id,
            previous_status,
            new_status,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.application_status,
            NEW.application_status,
            'Status updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_application_status_history
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION create_application_status_history();

-- Views for common queries
-- Active applications view
CREATE OR REPLACE VIEW active_applications AS
SELECT 
    a.*,
    u.name as user_name,
    u.email as user_email,
    j.title as job_title,
    j.company as job_company,
    j.location as job_location
FROM applications a
JOIN users u ON a.user_id = u.id
JOIN jobs j ON a.job_id = j.id
WHERE a.is_active = true AND a.is_archived = false;

-- Application summary view with counts
CREATE OR REPLACE VIEW application_summary AS
SELECT 
    user_id,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN application_status = 'submitted' THEN 1 END) as submitted_count,
    COUNT(CASE WHEN application_status = 'under_review' THEN 1 END) as under_review_count,
    COUNT(CASE WHEN application_status = 'interview_scheduled' THEN 1 END) as interview_scheduled_count,
    COUNT(CASE WHEN application_status = 'interviewed' THEN 1 END) as interviewed_count,
    COUNT(CASE WHEN application_status = 'offer_extended' THEN 1 END) as offer_extended_count,
    COUNT(CASE WHEN application_status = 'accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN application_status = 'rejected' THEN 1 END) as rejected_count,
    MAX(created_at) as latest_application_date
FROM applications
WHERE is_active = true
GROUP BY user_id;

-- Recent applications view (last 30 days)
CREATE OR REPLACE VIEW recent_applications AS
SELECT 
    a.*,
    u.name as user_name,
    j.title as job_title,
    j.company as job_company
FROM applications a
JOIN users u ON a.user_id = u.id
JOIN jobs j ON a.job_id = j.id
WHERE a.created_at >= CURRENT_DATE - INTERVAL '30 days'
AND a.is_active = true
ORDER BY a.created_at DESC;

-- Comments for documentation
COMMENT ON TABLE applications IS 'Main table storing all job applications with comprehensive tracking';
COMMENT ON TABLE application_status_history IS 'Audit trail of all status changes for applications';
COMMENT ON TABLE application_documents IS 'File attachments associated with applications';
COMMENT ON TABLE application_communications IS 'Communication history between applicants and employers';
COMMENT ON TABLE application_reminders IS 'User-specific reminders related to applications';

COMMENT ON COLUMN applications.board_certifications IS 'Array of board certifications (e.g., {"ABIM Internal Medicine", "AAFP Family Medicine"})';
COMMENT ON COLUMN applications.licenses IS 'Array of medical licenses (e.g., {"CA12345", "NY67890"})';
COMMENT ON COLUMN applications.source IS 'How the applicant found the job posting';
COMMENT ON COLUMN applications.consent_to_contact IS 'Permission to contact applicant about this and similar opportunities';