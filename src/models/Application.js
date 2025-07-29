const { pool } = require('../db/connection');

class Application {
    /**
     * Create a new application
     * @param {Object} applicationData - Application data
     * @returns {Promise<Object>} Created application
     */
    static async create(applicationData) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Insert main application record
            const applicationQuery = `
                INSERT INTO applications (
                    user_id, job_id, application_status, applicant_name, applicant_email, 
                    applicant_phone, cover_letter, resume_text, additional_notes,
                    availability_start, availability_end, salary_expectation, hourly_rate_expectation,
                    preferred_location, willing_to_relocate, years_experience, specialty,
                    board_certifications, licenses, source, consent_to_contact,
                    privacy_policy_accepted, terms_accepted, submitted_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
                ) RETURNING *
            `;

            const applicationValues = [
                applicationData.user_id,
                applicationData.job_id,
                applicationData.application_status || 'draft',
                applicationData.applicant_name,
                applicationData.applicant_email,
                applicationData.applicant_phone || null,
                applicationData.cover_letter || null,
                applicationData.resume_text || null,
                applicationData.additional_notes || null,
                applicationData.availability_start || null,
                applicationData.availability_end || null,
                applicationData.salary_expectation || null,
                applicationData.hourly_rate_expectation || null,
                applicationData.preferred_location || null,
                applicationData.willing_to_relocate || false,
                applicationData.years_experience || null,
                applicationData.specialty || null,
                applicationData.board_certifications || '{}',
                applicationData.licenses || '{}',
                applicationData.source || null,
                applicationData.consent_to_contact !== false,
                applicationData.privacy_policy_accepted || false,
                applicationData.terms_accepted || false,
                applicationData.submitted_at || null
            ];

            const applicationResult = await client.query(applicationQuery, applicationValues);
            const application = applicationResult.rows[0];

            // Create initial status history entry
            await client.query(`
                INSERT INTO application_status_history (application_id, new_status, change_reason, notes)
                VALUES ($1, $2, $3, $4)
            `, [application.id, application.application_status, 'Application created', 'Initial application creation']);

            await client.query('COMMIT');
            return application;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get all applications with optional filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Applications with pagination info
     */
    static async getAll(options = {}) {
        const {
            user_id,
            job_id,
            status,
            search,
            page = 1,
            limit = 10,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = options;

        // Build WHERE clause dynamically
        const conditions = ['a.is_active = true'];
        const values = [];
        let paramCount = 0;

        if (user_id) {
            paramCount++;
            conditions.push(`a.user_id = $${paramCount}`);
            values.push(user_id);
        }

        if (job_id) {
            paramCount++;
            conditions.push(`a.job_id = $${paramCount}`);
            values.push(job_id);
        }

        if (status) {
            paramCount++;
            conditions.push(`a.application_status = $${paramCount}`);
            values.push(status);
        }

        if (search) {
            paramCount++;
            conditions.push(`(
                a.applicant_name ILIKE $${paramCount} OR
                a.applicant_email ILIKE $${paramCount} OR
                a.cover_letter ILIKE $${paramCount} OR
                a.additional_notes ILIKE $${paramCount} OR
                j.title ILIKE $${paramCount} OR
                j.company_name ILIKE $${paramCount}
            )`);
            values.push(`%${search}%`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Validate sort column to prevent SQL injection
        const validSortColumns = [
            'created_at', 'updated_at', 'submitted_at', 'applicant_name', 
            'application_status', 'salary_expectation', 'hourly_rate_expectation'
        ];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM applications a
            LEFT JOIN jobs j ON a.job_id = j.id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results
        const offset = (page - 1) * limit;
        paramCount += 2;
        const dataQuery = `
            SELECT 
                a.*,
                u.email as user_email,
                j.title as job_title,
                j.company_name as job_company,
                j.location as job_location,
                j.hourly_rate_min as job_hourly_rate
            FROM applications a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN jobs j ON a.job_id = j.id
            ${whereClause}
            ORDER BY a.${sortColumn} ${sortDirection}
            LIMIT $${paramCount - 1} OFFSET $${paramCount}
        `;

        values.push(limit, offset);
        const dataResult = await pool.query(dataQuery, values);

        return {
            applications: dataResult.rows,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total_records: total,
                per_page: limit,
                has_next: page < Math.ceil(total / limit),
                has_prev: page > 1
            }
        };
    }

    /**
     * Get application by ID with related data
     * @param {number} id - Application ID
     * @returns {Promise<Object|null>} Application with related data
     */
    static async getById(id) {
        const query = `
            SELECT * FROM applications
            WHERE id = $1 AND is_active = true
        `;

        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }

    /**
     * Update application
     * @param {number} id - Application ID
     * @param {Object} updateData - Data to update
     * @param {number} updatedBy - User ID making the update
     * @returns {Promise<Object|null>} Updated application
     */
    static async update(id, updateData, updatedBy = null) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get current application for status tracking
            const currentResult = await client.query(
                'SELECT * FROM applications WHERE id = $1 AND is_active = true',
                [id]
            );

            if (currentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            const currentApplication = currentResult.rows[0];

            // Build dynamic update query
            const updateFields = [];
            const values = [];
            let paramCount = 0;

            const updatableFields = [
                'application_status', 'applicant_name', 'applicant_email', 'applicant_phone',
                'cover_letter', 'resume_text', 'additional_notes', 'availability_start',
                'availability_end', 'salary_expectation', 'hourly_rate_expectation',
                'preferred_location', 'willing_to_relocate', 'years_experience', 'specialty',
                'board_certifications', 'licenses', 'source', 'recruiter_notes',
                'interview_date', 'interview_type', 'interview_notes', 'employer_response',
                'response_date', 'rejection_reason', 'offer_amount', 'offer_hourly_rate',
                'offer_start_date', 'offer_end_date', 'offer_benefits', 'offer_expiry_date',
                'consent_to_contact', 'is_archived'
            ];

            updatableFields.forEach(field => {
                if (updateData.hasOwnProperty(field)) {
                    paramCount++;
                    updateFields.push(`${field} = $${paramCount}`);
                    values.push(updateData[field]);
                }
            });

            if (updateFields.length === 0) {
                await client.query('ROLLBACK');
                return currentApplication;
            }

            // Add updated_at timestamp
            paramCount++;
            updateFields.push(`updated_at = $${paramCount}`);
            values.push(new Date());

            // Add submitted_at if status is changing to submitted
            if (updateData.application_status === 'submitted' && currentApplication.application_status !== 'submitted') {
                paramCount++;
                updateFields.push(`submitted_at = $${paramCount}`);
                values.push(new Date());
            }

            paramCount++;
            values.push(id);

            const updateQuery = `
                UPDATE applications 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCount} AND is_active = true
                RETURNING *
            `;

            const updateResult = await client.query(updateQuery, values);
            const updatedApplication = updateResult.rows[0];

            // Create status history entry if status changed
            if (updateData.application_status && updateData.application_status !== currentApplication.application_status) {
                await client.query(`
                    INSERT INTO application_status_history (
                        application_id, previous_status, new_status, changed_by, change_reason, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    id,
                    currentApplication.application_status,
                    updateData.application_status,
                    updatedBy,
                    updateData.status_change_reason || 'Status updated',
                    updateData.status_notes || null
                ]);
            }

            await client.query('COMMIT');
            return updatedApplication;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Soft delete application
     * @param {number} id - Application ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        const query = `
            UPDATE applications 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND is_active = true
            RETURNING id
        `;

        const result = await pool.query(query, [id]);
        return result.rows.length > 0;
    }

    /**
     * Get application statistics for a user
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Statistics object
     */
    static async getStatistics(userId = null) {
        const whereClause = userId ? 'WHERE user_id = $1 AND is_active = true' : 'WHERE is_active = true';
        const values = userId ? [userId] : [];

        const query = `
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN application_status = 'draft' THEN 1 END) as draft_count,
                COUNT(CASE WHEN application_status = 'submitted' THEN 1 END) as submitted_count,
                COUNT(CASE WHEN application_status = 'under_review' THEN 1 END) as under_review_count,
                COUNT(CASE WHEN application_status = 'interview_scheduled' THEN 1 END) as interview_scheduled_count,
                COUNT(CASE WHEN application_status = 'interviewed' THEN 1 END) as interviewed_count,
                COUNT(CASE WHEN application_status = 'offer_extended' THEN 1 END) as offer_extended_count,
                COUNT(CASE WHEN application_status = 'accepted' THEN 1 END) as accepted_count,
                COUNT(CASE WHEN application_status = 'rejected' THEN 1 END) as rejected_count,
                COUNT(CASE WHEN application_status = 'withdrawn' THEN 1 END) as withdrawn_count,
                COUNT(CASE WHEN application_status = 'expired' THEN 1 END) as expired_count,
                AVG(salary_expectation) as avg_salary_expectation,
                AVG(hourly_rate_expectation) as avg_hourly_rate_expectation,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days
            FROM applications
            ${whereClause}
        `;

        const result = await pool.query(query, values);
        const stats = result.rows[0];

        // Convert string numbers to integers
        Object.keys(stats).forEach(key => {
            if (key.includes('count') || key === 'total_applications' || key.includes('last_')) {
                stats[key] = parseInt(stats[key]) || 0;
            } else if (key.includes('avg_')) {
                stats[key] = parseFloat(stats[key]) || 0;
            }
        });

        return stats;
    }

    /**
     * Add document to application
     * @param {number} applicationId - Application ID
     * @param {Object} documentData - Document data
     * @returns {Promise<Object>} Created document
     */
    static async addDocument(applicationId, documentData) {
        const query = `
            INSERT INTO application_documents (
                application_id, document_type, file_name, file_path, file_size, mime_type
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [
            applicationId,
            documentData.document_type,
            documentData.file_name,
            documentData.file_path,
            documentData.file_size || null,
            documentData.mime_type || null
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Add communication to application
     * @param {number} applicationId - Application ID
     * @param {Object} communicationData - Communication data
     * @returns {Promise<Object>} Created communication
     */
    static async addCommunication(applicationId, communicationData) {
        const query = `
            INSERT INTO application_communications (
                application_id, communication_type, direction, from_user_id, 
                to_email, subject, message_body
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            applicationId,
            communicationData.communication_type,
            communicationData.direction,
            communicationData.from_user_id || null,
            communicationData.to_email || null,
            communicationData.subject || null,
            communicationData.message_body || null
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Add reminder for application
     * @param {number} applicationId - Application ID
     * @param {number} userId - User ID
     * @param {Object} reminderData - Reminder data
     * @returns {Promise<Object>} Created reminder
     */
    static async addReminder(applicationId, userId, reminderData) {
        const query = `
            INSERT INTO application_reminders (
                application_id, user_id, reminder_type, title, description, due_date
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [
            applicationId,
            userId,
            reminderData.reminder_type,
            reminderData.title,
            reminderData.description || null,
            reminderData.due_date
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Check if user has already applied to a job
     * @param {number} userId - User ID
     * @param {number} jobId - Job ID
     * @returns {Promise<boolean>} Whether application exists
     */
    static async hasUserApplied(userId, jobId) {
        const query = `
            SELECT id FROM applications 
            WHERE user_id = $1 AND job_id = $2 AND is_active = true
            LIMIT 1
        `;

        const result = await pool.query(query, [userId, jobId]);
        return result.rows.length > 0;
    }

    /**
     * Get applications by status
     * @param {string} status - Application status
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Applications
     */
    static async getByStatus(status, options = {}) {
        const { limit = 50, offset = 0 } = options;

        const query = `
            SELECT 
                a.*,
                u.email as user_email,
                j.title as job_title,
                j.company_name as job_company
            FROM applications a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN jobs j ON a.job_id = j.id
            WHERE a.application_status = $1 AND a.is_active = true
            ORDER BY a.updated_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [status, limit, offset]);
        return result.rows;
    }

    /**
     * Get recent applications
     * @param {number} days - Number of days to look back
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Array>} Recent applications
     */
    static async getRecent(days = 7, limit = 20) {
        const query = `
            SELECT 
                a.*,
                u.email as user_email,
                j.title as job_title,
                j.company_name as job_company
            FROM applications a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN jobs j ON a.job_id = j.id
            WHERE a.created_at >= CURRENT_DATE - INTERVAL '${days} days'
            AND a.is_active = true
            ORDER BY a.created_at DESC
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    /**
     * Archive old applications
     * @param {number} days - Applications older than this many days
     * @returns {Promise<number>} Number of applications archived
     */
    static async archiveOld(days = 365) {
        const query = `
            UPDATE applications 
            SET is_archived = true, updated_at = CURRENT_TIMESTAMP
            WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'
            AND is_archived = false
            AND is_active = true
            AND application_status IN ('rejected', 'withdrawn', 'expired')
            RETURNING id
        `;

        const result = await pool.query(query);
        return result.rows.length;
    }
}

module.exports = Application;