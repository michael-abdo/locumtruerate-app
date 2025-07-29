-- Migration 002: Add Applications Tables
-- Creates comprehensive applications system with status tracking, documents, and communications
-- Safe to run multiple times

-- Start transaction for atomic migration
BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'applications'
    ) THEN
        RAISE NOTICE 'Applications tables already exist. Skipping migration.';
    ELSE
        RAISE NOTICE 'Creating applications tables...';
        
        -- Main applications table
        CREATE TABLE applications (
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
            board_certifications TEXT[], -- Array of certifications
            licenses TEXT[], -- Array of license numbers/states
            
            -- Application process tracking
            source VARCHAR(100), -- How they found the job
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

        -- Application status history table
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

        -- Application documents table
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

        -- Application communications table
        CREATE TABLE application_communications (
            id SERIAL PRIMARY KEY,
            application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
            communication_type VARCHAR(50) NOT NULL CHECK (
                communication_type IN (
                    'email', 'phone_call', 'text_message', 
                    'video_call', 'in_person', 'system_notification'
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
        CREATE TABLE application_reminders (
            id SERIAL PRIMARY KEY,
            application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reminder_type VARCHAR(50) NOT NULL CHECK (
                reminder_type IN (
                    'follow_up', 'interview_prep', 'document_deadline',
                    'offer_expiry', 'availability_update'
                )
            ),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            due_date TIMESTAMP NOT NULL,
            completed BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create performance indexes
        CREATE INDEX idx_applications_user_id ON applications(user_id);
        CREATE INDEX idx_applications_job_id ON applications(job_id);
        CREATE INDEX idx_applications_status ON applications(application_status);
        CREATE INDEX idx_applications_created_at ON applications(created_at);
        CREATE INDEX idx_applications_submitted_at ON applications(submitted_at);
        CREATE INDEX idx_applications_active ON applications(is_active) WHERE is_active = true;

        CREATE INDEX idx_application_status_history_application_id ON application_status_history(application_id);
        CREATE INDEX idx_application_status_history_created_at ON application_status_history(created_at);

        CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
        CREATE INDEX idx_application_documents_type ON application_documents(document_type);

        CREATE INDEX idx_application_communications_application_id ON application_communications(application_id);
        CREATE INDEX idx_application_communications_sent_at ON application_communications(sent_at);

        CREATE INDEX idx_application_reminders_user_id ON application_reminders(user_id);
        CREATE INDEX idx_application_reminders_due_date ON application_reminders(due_date);
        CREATE INDEX idx_application_reminders_completed ON application_reminders(completed) WHERE completed = false;

        -- Create trigger functions
        CREATE OR REPLACE FUNCTION update_applications_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        CREATE OR REPLACE FUNCTION create_application_status_history()
        RETURNS TRIGGER AS $func$
        BEGIN
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
        $func$ LANGUAGE plpgsql;

        -- Create triggers
        CREATE TRIGGER trigger_applications_updated_at
            BEFORE UPDATE ON applications
            FOR EACH ROW
            EXECUTE FUNCTION update_applications_updated_at();

        CREATE TRIGGER trigger_application_status_history
            AFTER UPDATE ON applications
            FOR EACH ROW
            EXECUTE FUNCTION create_application_status_history();

        -- Create views
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

        RAISE NOTICE 'Applications tables created successfully!';
    END IF;
END;
$$;

-- Insert sample data for testing (only if tables are empty)
DO $$
DECLARE
    sample_user_id INTEGER;
    sample_job_id INTEGER;
    sample_application_id INTEGER;
BEGIN
    -- Check if we have sample data already
    IF NOT EXISTS (SELECT 1 FROM applications LIMIT 1) THEN
        RAISE NOTICE 'Inserting sample application data...';
        
        -- Get sample user and job IDs (create if they don't exist)
        SELECT id INTO sample_user_id FROM users WHERE email = 'locum@example.com' LIMIT 1;
        SELECT id INTO sample_job_id FROM jobs LIMIT 1;
        
        IF sample_user_id IS NOT NULL AND sample_job_id IS NOT NULL THEN
            -- Insert sample application
            INSERT INTO applications (
                user_id,
                job_id,
                application_status,
                applicant_name,
                applicant_email,
                applicant_phone,
                cover_letter,
                resume_text,
                additional_notes,
                availability_start,
                salary_expectation,
                hourly_rate_expectation,
                preferred_location,
                willing_to_relocate,
                years_experience,
                specialty,
                board_certifications,
                licenses,
                source,
                consent_to_contact,
                privacy_policy_accepted,
                terms_accepted,
                submitted_at
            ) VALUES (
                sample_user_id,
                sample_job_id,
                'submitted',
                'Dr. Jane Smith',
                'locum@example.com',
                '+1-555-0123',
                'Dear Hiring Manager,

I am writing to express my strong interest in the locum tenens position at your facility. With over 8 years of experience in emergency medicine, I am confident in my ability to provide exceptional patient care and seamlessly integrate with your medical team.

My experience includes working in both urban and rural emergency departments, handling high-volume patient loads, and managing complex medical cases. I am particularly skilled in trauma care, pediatric emergencies, and critical care procedures.

I am available for the full duration of the assignment and am willing to relocate as needed. I look forward to the opportunity to discuss how my skills and experience can benefit your team.

Sincerely,
Dr. Jane Smith',
                'Dr. Jane Smith, MD
Emergency Medicine Physician

EXPERIENCE:
- 2018-Present: Emergency Medicine Physician, City General Hospital
- 2016-2018: Emergency Medicine Resident, Metro Medical Center
- 2012-2016: Medical School, State University School of Medicine

BOARD CERTIFICATIONS:
- American Board of Emergency Medicine (2018)
- Advanced Cardiac Life Support (ACLS)
- Pediatric Advanced Life Support (PALS)

LICENSES:
- California Medical License: CA12345
- DEA Registration: BC1234567

SKILLS:
- Trauma care and resuscitation
- Pediatric emergency medicine
- Critical care procedures
- Electronic medical records (Epic, Cerner)
- Bilingual (English/Spanish)',
                'I have experience with your preferred EMR system and am comfortable working in fast-paced environments. I can provide references from my current and previous positions upon request.',
                CURRENT_DATE + INTERVAL '30 days',
                200000.00,
                120.00,
                'California, Nevada, Arizona',
                true,
                8,
                'Emergency Medicine',
                ARRAY['American Board of Emergency Medicine', 'ABEM Certified'],
                ARRAY['CA Medical License #CA12345', 'DEA #BC1234567'],
                'company_website',
                true,
                true,
                true,
                CURRENT_TIMESTAMP - INTERVAL '2 hours'
            ) RETURNING id INTO sample_application_id;

            -- Insert sample status history
            INSERT INTO application_status_history (
                application_id,
                previous_status,
                new_status,
                change_reason,
                notes
            ) VALUES (
                sample_application_id,
                NULL,
                'submitted',
                'Application submitted',
                'Initial application submission'
            );

            -- Insert sample document
            INSERT INTO application_documents (
                application_id,
                document_type,
                file_name,
                file_path,
                file_size,
                mime_type
            ) VALUES (
                sample_application_id,
                'resume',
                'jane_smith_resume.pdf',
                '/uploads/applications/' || sample_application_id || '/jane_smith_resume.pdf',
                245760,
                'application/pdf'
            );

            -- Insert sample communication
            INSERT INTO application_communications (
                application_id,
                communication_type,
                direction,
                to_email,
                subject,
                message_body
            ) VALUES (
                sample_application_id,
                'email',
                'outbound',
                'hr@hospital.com',
                'Application for Emergency Medicine Locum Position',
                'Thank you for considering my application. I have attached my resume and cover letter for your review.'
            );

            -- Insert sample reminder
            INSERT INTO application_reminders (
                application_id,
                user_id,
                reminder_type,
                title,
                description,
                due_date
            ) VALUES (
                sample_application_id,
                sample_user_id,
                'follow_up',
                'Follow up on Emergency Medicine application',
                'Send follow-up email if no response received within one week',
                CURRENT_TIMESTAMP + INTERVAL '7 days'
            );

            RAISE NOTICE 'Sample application data inserted successfully!';
        ELSE
            RAISE NOTICE 'Skipping sample data - required user or job not found';
        END IF;
    ELSE
        RAISE NOTICE 'Sample application data already exists';
    END IF;
END;
$$;

-- Commit the transaction
COMMIT;

-- Verify the migration
DO $$
DECLARE
    table_count INTEGER;
    sample_count INTEGER;
BEGIN
    -- Count tables created
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('applications', 'application_status_history', 'application_documents', 'application_communications', 'application_reminders');
    
    -- Count sample records
    SELECT COUNT(*) INTO sample_count FROM applications;
    
    RAISE NOTICE 'Migration 002 completed successfully!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Sample applications: %', sample_count;
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ All applications tables created successfully';
    ELSE
        RAISE WARNING '⚠️  Expected 5 tables, found %', table_count;
    END IF;
END;
$$;