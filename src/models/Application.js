const { pool } = require('../db/connection');
const config = require('../config/config');

class Application {
  /**
   * Create a new job application
   * @param {Object} applicationData - Application data object
   * @param {number} applicationData.userId - ID of the user applying
   * @param {number} applicationData.jobId - ID of the job being applied to
   * @param {string} applicationData.coverLetter - Cover letter text
   * @param {number} applicationData.expectedRate - Expected hourly rate (optional)
   * @param {Date} applicationData.availableDate - Date available to start (optional)
   * @param {string} applicationData.notes - Additional notes (optional)
   * @returns {Promise<Object>} Created application with job details
   */
  static async create(applicationData) {
    const {
      userId,
      jobId,
      coverLetter,
      expectedRate,
      availableDate,
      notes
    } = applicationData;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // First, check if the job exists and is active
      const jobQuery = 'SELECT * FROM jobs WHERE id = $1 AND status = $2';
      const jobResult = await client.query(jobQuery, [jobId, 'active']);
      
      if (jobResult.rows.length === 0) {
        throw new Error('Job not found or no longer active');
      }

      const job = jobResult.rows[0];

      // Check if user is trying to apply to their own job
      if (job.posted_by === userId) {
        throw new Error('Cannot apply to your own job posting');
      }

      // Check if user has already applied (unique constraint will catch this too, but better UX)
      const existingQuery = 'SELECT id FROM applications WHERE user_id = $1 AND job_id = $2';
      const existingResult = await client.query(existingQuery, [userId, jobId]);
      
      if (existingResult.rows.length > 0) {
        throw new Error('You have already applied to this job');
      }

      // Create the application
      const insertQuery = `
        INSERT INTO applications (
          user_id, job_id, cover_letter, expected_rate, 
          available_date, notes, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
      `;

      const values = [userId, jobId, coverLetter, expectedRate, availableDate, notes];
      const result = await client.query(insertQuery, values);
      const application = result.rows[0];

      await client.query('COMMIT');

      // Return application with job details
      return await this.findByIdWithDetails(application.id);

    } catch (error) {
      await client.query('ROLLBACK');
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error('You have already applied to this job');
      }
      
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find applications by user ID with job details
   * @param {number} userId - User ID
   * @param {Object} options - Pagination and filtering options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 20)
   * @param {string} options.status - Filter by status (optional)
   * @param {string} options.sortBy - Sort field (default: created_at)
   * @param {string} options.sortOrder - Sort order (default: DESC)
   * @returns {Promise<Object>} Applications array with pagination info
   */
  static async findByUser(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    // Build WHERE clause
    const conditions = ['a.user_id = $1'];
    const values = [userId];
    let valueIndex = 2;

    if (status) {
      conditions.push(`a.status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Count total items
    const countQuery = `
      SELECT COUNT(*) 
      FROM applications a 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    // Get applications with job details
    const applicationsQuery = `
      SELECT 
        a.*,
        j.title as job_title,
        j.location as job_location,
        j.state as job_state,
        j.specialty as job_specialty,
        j.hourly_rate_min as job_hourly_rate_min,
        j.hourly_rate_max as job_hourly_rate_max,
        j.company_name as job_company_name,
        j.status as job_status,
        poster.email as job_poster_email,
        poster_profile.first_name as job_poster_first_name,
        poster_profile.last_name as job_poster_last_name
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      LEFT JOIN users poster ON j.posted_by = poster.id
      LEFT JOIN profiles poster_profile ON poster.id = poster_profile.user_id
      ${whereClause}
      ORDER BY a.${sortBy} ${sortOrder}
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;

    values.push(limit, offset);
    const applicationsResult = await pool.query(applicationsQuery, values);

    return {
      applications: applicationsResult.rows.map(row => this.formatApplication(row)),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Find applications for a specific job (for recruiters)
   * @param {number} jobId - Job ID
   * @param {number} recruiterId - ID of user requesting (must be job poster)
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Object>} Applications array with user details
   */
  static async findByJob(jobId, recruiterId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    // First verify that the user owns this job
    const jobOwnerQuery = 'SELECT posted_by FROM jobs WHERE id = $1';
    const jobOwnerResult = await pool.query(jobOwnerQuery, [jobId]);
    
    if (jobOwnerResult.rows.length === 0) {
      throw new Error('Job not found');
    }
    
    if (jobOwnerResult.rows[0].posted_by !== recruiterId) {
      throw new Error('Unauthorized to view applications for this job');
    }

    // Build WHERE clause
    const conditions = ['a.job_id = $1'];
    const values = [jobId];
    let valueIndex = 2;

    if (status) {
      conditions.push(`a.status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Count total items
    const countQuery = `
      SELECT COUNT(*) 
      FROM applications a 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    // Get applications with user details
    const applicationsQuery = `
      SELECT 
        a.*,
        u.email as applicant_email,
        p.first_name as applicant_first_name,
        p.last_name as applicant_last_name,
        p.phone as applicant_phone,
        p.specialty as applicant_specialty,
        p.years_experience as applicant_years_experience
      FROM applications a
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      ${whereClause}
      ORDER BY a.${sortBy} ${sortOrder}
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;

    values.push(limit, offset);
    const applicationsResult = await pool.query(applicationsQuery, values);

    return {
      applications: applicationsResult.rows.map(row => this.formatApplicationForRecruiter(row)),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Find application by ID with full details
   * @param {number} id - Application ID
   * @returns {Promise<Object|null>} Application object or null
   */
  static async findByIdWithDetails(id) {
    const query = `
      SELECT 
        a.*,
        j.title as job_title,
        j.location as job_location,
        j.state as job_state,
        j.specialty as job_specialty,
        j.hourly_rate_min as job_hourly_rate_min,
        j.hourly_rate_max as job_hourly_rate_max,
        j.company_name as job_company_name,
        j.status as job_status,
        u.email as applicant_email,
        p.first_name as applicant_first_name,
        p.last_name as applicant_last_name
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE a.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? this.formatApplication(result.rows[0]) : null;
  }

  /**
   * Update application status (for recruiters)
   * @param {number} id - Application ID
   * @param {number} recruiterId - ID of user making the update
   * @param {string} newStatus - New status
   * @param {string} notes - Optional notes about the status change
   * @returns {Promise<Object>} Updated application
   */
  static async updateStatus(id, recruiterId, newStatus, notes = null) {
    // Validate status
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status value');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get application and verify permissions
      const appQuery = `
        SELECT a.*, j.posted_by 
        FROM applications a 
        INNER JOIN jobs j ON a.job_id = j.id 
        WHERE a.id = $1
      `;
      const appResult = await client.query(appQuery, [id]);

      if (appResult.rows.length === 0) {
        throw new Error('Application not found');
      }

      const application = appResult.rows[0];

      // Check if user is the job poster (only they can update status)
      if (application.posted_by !== recruiterId) {
        throw new Error('Unauthorized to update this application');
      }

      // Update the application
      const updateQuery = `
        UPDATE applications 
        SET 
          status = $1,
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = $2,
          notes = COALESCE($3, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [newStatus, recruiterId, notes, id]);
      const updatedApplication = updateResult.rows[0];

      await client.query('COMMIT');

      return this.formatApplication(updatedApplication);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Withdraw application (for applicants)
   * @param {number} id - Application ID
   * @param {number} userId - ID of user withdrawing
   * @returns {Promise<boolean>} True if successful
   */
  static async withdraw(id, userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if application exists and user owns it
      const checkQuery = 'SELECT user_id, status FROM applications WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        throw new Error('Application not found');
      }

      const application = checkResult.rows[0];

      if (application.user_id !== userId) {
        throw new Error('Unauthorized to withdraw this application');
      }

      if (application.status === 'withdrawn') {
        throw new Error('Application is already withdrawn');
      }

      if (application.status === 'accepted') {
        throw new Error('Cannot withdraw an accepted application');
      }

      // Update status to withdrawn
      const updateQuery = `
        UPDATE applications 
        SET status = 'withdrawn', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await client.query(updateQuery, [id]);
      await client.query('COMMIT');

      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Format application object for API response (applicant view)
   * @param {Object} row - Raw application data from database
   * @returns {Object} Formatted application object
   */
  static formatApplication(row) {
    return {
      id: row.id,
      userId: row.user_id,
      jobId: row.job_id,
      status: row.status,
      coverLetter: row.cover_letter,
      expectedRate: row.expected_rate ? parseFloat(row.expected_rate) : null,
      availableDate: row.available_date,
      notes: row.notes,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Job details (if included)
      job: row.job_title ? {
        id: row.job_id,
        title: row.job_title,
        location: row.job_location,
        state: row.job_state,
        specialty: row.job_specialty,
        hourlyRateMin: row.job_hourly_rate_min ? parseFloat(row.job_hourly_rate_min) : null,
        hourlyRateMax: row.job_hourly_rate_max ? parseFloat(row.job_hourly_rate_max) : null,
        companyName: row.job_company_name,
        status: row.job_status,
        poster: {
          email: row.job_poster_email,
          name: row.job_poster_first_name && row.job_poster_last_name 
            ? `${row.job_poster_first_name} ${row.job_poster_last_name}` 
            : null
        }
      } : undefined,
      // Applicant details (if included)
      applicant: row.applicant_email ? {
        email: row.applicant_email,
        firstName: row.applicant_first_name,
        lastName: row.applicant_last_name,
        phone: row.applicant_phone,
        specialty: row.applicant_specialty,
        yearsExperience: row.applicant_years_experience
      } : undefined
    };
  }

  /**
   * Format application object for recruiter view
   * @param {Object} row - Raw application data from database
   * @returns {Object} Formatted application object for recruiters
   */
  static formatApplicationForRecruiter(row) {
    const formatted = this.formatApplication(row);
    // Recruiters see applicant details but not job details (they already know the job)
    delete formatted.job;
    return formatted;
  }
}

module.exports = Application;