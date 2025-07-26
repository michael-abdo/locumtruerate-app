const { pool } = require('../db/connection');
const config = require('../config/config');
const { 
  buildWhereClause, 
  buildPaginationClause, 
  executePaginatedQuery, 
  buildSearchCondition,
  buildArrayFilterCondition,
  buildRangeFilterCondition,
  executeTransaction 
} = require('../utils/database');

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

    try {
      // First, check if the job exists and is active
      const jobQuery = 'SELECT * FROM jobs WHERE id = $1 AND status = $2';
      const jobResult = await pool.query(jobQuery, [jobId, 'active']);
      
      if (jobResult.rows.length === 0) {
        throw new Error('Job not found or no longer active');
      }

      const job = jobResult.rows[0];

      // Check if user is trying to apply to their own job
      if (job.posted_by === userId) {
        throw new Error('Cannot apply to your own job posting');
      }

      // Check if user has already applied
      const existingQuery = 'SELECT id FROM applications WHERE user_id = $1 AND job_id = $2';
      const existingResult = await pool.query(existingQuery, [userId, jobId]);
      
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
        RETURNING id, user_id, job_id, status, cover_letter, expected_rate, 
                  available_date, notes, created_at, updated_at
      `;

      const values = [userId, jobId, coverLetter, expectedRate, availableDate, notes];
      const result = await pool.query(insertQuery, values);
      const application = result.rows[0];

      // Return properly formatted application data
      return {
        id: application.id,
        userId: application.user_id,
        jobId: application.job_id,
        status: application.status,
        coverLetter: application.cover_letter,
        expectedRate: application.expected_rate ? parseFloat(application.expected_rate) : null,
        availableDate: application.available_date,
        notes: application.notes,
        createdAt: application.created_at,
        updatedAt: application.updated_at
      };
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error('You have already applied to this job');
      }
      
      throw error;
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

    // Build WHERE conditions using utilities
    const conditions = ['a.user_id = $1'];
    const values = [userId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    // Build WHERE clause using utility
    const whereClause = buildWhereClause(conditions);

    // Define base query and count query
    const baseQuery = `
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
    `;

    const countQuery = `SELECT COUNT(*) FROM applications a ${whereClause}`;

    // Use paginated query utility
    const validSortFields = ['created_at', 'updated_at', 'status', 'expected_rate'];
    const result = await executePaginatedQuery(
      baseQuery,
      countQuery,
      values,
      { page, limit, sortBy, sortOrder, validSortFields }
    );

    return {
      applications: result.items.map(row => Application.formatApplication(row)),
      pagination: result.pagination
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

    const whereClause = buildWhereClause(conditions);

    // Base query for applications with user details
    const baseQuery = `
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
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM applications a 
      ${whereClause}
    `;

    // Valid sort fields
    const validSortFields = ['created_at', 'status', 'expected_rate', 'reviewed_at'];

    // Execute paginated query
    const result = await executePaginatedQuery(
      baseQuery,
      countQuery,
      values,
      { page, limit, sortBy, sortOrder, validSortFields }
    );

    return {
      applications: result.items.map(row => Application.formatApplicationForRecruiter(row)),
      pagination: result.pagination
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
        p.last_name as applicant_last_name,
        p.phone as applicant_phone,
        p.specialty as applicant_specialty,
        p.years_experience as applicant_years_experience,
        poster_u.email as job_poster_email,
        poster_p.first_name as job_poster_first_name,
        poster_p.last_name as job_poster_last_name
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      INNER JOIN users poster_u ON j.posted_by = poster_u.id
      LEFT JOIN profiles poster_p ON poster_u.id = poster_p.user_id
      WHERE a.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? Application.formatApplication(result.rows[0]) : null;
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

    return executeTransaction(async (client) => {
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

      return Application.formatApplication(updatedApplication);
    });
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
    const formatted = Application.formatApplication(row);
    // Recruiters see applicant details but not job details (they already know the job)
    delete formatted.job;
    return formatted;
  }

  /**
   * Export all user data for GDPR compliance
   * @param {number} userId - User ID
   * @param {Object} options - Export options
   * @param {boolean} options.includeHistory - Include status change history
   * @param {Date} options.dateFrom - Start date filter
   * @param {Date} options.dateTo - End date filter
   * @returns {Promise<Object>} Complete user data export
   */
  static async exportUserData(userId, options = {}) {
    const {
      includeHistory = true,
      dateFrom,
      dateTo
    } = options;

    // Build date filter
    let dateFilter = '';
    const queryParams = [userId];
    let paramIndex = 2;

    if (dateFrom) {
      dateFilter += ` AND a.created_at >= $${paramIndex}`;
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      dateFilter += ` AND a.created_at <= $${paramIndex}`;
      queryParams.push(dateTo);
      paramIndex++;
    }

    // Get all user applications with complete details
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
        j.description as job_description,
        poster.email as job_poster_email,
        poster_profile.first_name as job_poster_first_name,
        poster_profile.last_name as job_poster_last_name
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      LEFT JOIN users poster ON j.posted_by = poster.id
      LEFT JOIN profiles poster_profile ON poster.id = poster_profile.user_id
      WHERE a.user_id = $1 ${dateFilter}
      ORDER BY a.created_at DESC
    `;

    const applicationsResult = await pool.query(applicationsQuery, queryParams);
    const applications = applicationsResult.rows.map(row => ({
      id: row.id,
      job_id: row.job_id,
      status: row.status,
      cover_letter: row.cover_letter,
      expected_rate: row.expected_rate,
      available_date: row.available_date,
      notes: row.notes,
      reviewed_at: row.reviewed_at,
      reviewed_by: row.reviewed_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      job_details: {
        title: row.job_title,
        location: row.job_location,
        state: row.job_state,
        specialty: row.job_specialty,
        hourly_rate_min: row.job_hourly_rate_min,
        hourly_rate_max: row.job_hourly_rate_max,
        company_name: row.job_company_name,
        status: row.job_status,
        description: row.job_description,
        poster: {
          email: row.job_poster_email,
          name: row.job_poster_first_name && row.job_poster_last_name 
            ? `${row.job_poster_first_name} ${row.job_poster_last_name}` 
            : null
        }
      }
    }));

    const exportData = {
      user_id: userId,
      export_date: new Date().toISOString(),
      applications: applications,
      summary: {
        total_applications: applications.length,
        applications_by_status: Application.groupByStatus(applications),
        date_range: {
          earliest_application: applications.length > 0 ? applications[applications.length - 1].created_at : null,
          latest_application: applications.length > 0 ? applications[0].created_at : null
        }
      }
    };

    // Add status change history if requested
    if (includeHistory && applications.length > 0) {
      const applicationIds = applications.map(app => app.id);
      const historyQuery = `
        SELECT 
          application_id,
          old_status,
          new_status,
          changed_by,
          changed_at,
          notes
        FROM application_status_history 
        WHERE application_id = ANY($1)
        ORDER BY changed_at DESC
      `;
      
      try {
        const historyResult = await pool.query(historyQuery, [applicationIds]);
        exportData.status_history = historyResult.rows;
        exportData.summary.total_status_changes = historyResult.rows.length;
      } catch (historyError) {
        // History table might not exist, just skip this part
        config.logger.warn('Status history table not found, skipping history export', 'DATA_EXPORT');
        exportData.status_history = [];
        exportData.summary.total_status_changes = 0;
      }
    }

    return exportData;
  }

  /**
   * Get summary of user's data for GDPR compliance
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User data summary statistics
   */
  static async getUserDataSummary(userId) {
    // Get application statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_applications,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_applications,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
        COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn_applications,
        MIN(created_at) as first_application_date,
        MAX(created_at) as last_application_date,
        COUNT(CASE WHEN reviewed_at IS NOT NULL THEN 1 END) as applications_reviewed
      FROM applications 
      WHERE user_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    // Get unique companies applied to
    const companiesQuery = `
      SELECT COUNT(DISTINCT j.company_name) as unique_companies
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      WHERE a.user_id = $1 AND j.company_name IS NOT NULL
    `;

    const companiesResult = await pool.query(companiesQuery, [userId]);
    const uniqueCompanies = parseInt(companiesResult.rows[0].unique_companies);

    // Try to get status change history count
    let totalStatusChanges = 0;
    try {
      const historyQuery = `
        SELECT COUNT(*) as total_changes
        FROM application_status_history ash
        INNER JOIN applications a ON ash.application_id = a.id
        WHERE a.user_id = $1
      `;
      const historyResult = await pool.query(historyQuery, [userId]);
      totalStatusChanges = parseInt(historyResult.rows[0].total_changes);
    } catch (historyError) {
      // History table might not exist, just skip this part
      totalStatusChanges = 0;
    }

    return {
      userId: userId,
      totalApplications: parseInt(stats.total_applications),
      applicationsByStatus: {
        pending: parseInt(stats.pending_applications),
        reviewed: parseInt(stats.reviewed_applications),
        accepted: parseInt(stats.accepted_applications),
        rejected: parseInt(stats.rejected_applications),
        withdrawn: parseInt(stats.withdrawn_applications)
      },
      uniqueCompaniesAppliedTo: uniqueCompanies,
      firstApplicationDate: stats.first_application_date,
      lastApplicationDate: stats.last_application_date,
      applicationsReviewed: parseInt(stats.applications_reviewed),
      totalStatusChanges: totalStatusChanges,
      dataRetentionInfo: {
        oldestData: stats.first_application_date,
        newestData: stats.last_application_date,
        retentionPeriod: '3 years from last activity',
        eligibleForDeletion: Application.calculateDeletionEligibility(stats.last_application_date)
      }
    };
  }

  /**
   * Group applications by status for summary
   * @param {Array} applications - Array of applications
   * @returns {Object} Applications grouped by status
   */
  static groupByStatus(applications) {
    return applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Calculate if user data is eligible for deletion
   * @param {Date} lastActivityDate - Date of last activity
   * @returns {boolean} True if eligible for deletion
   */
  static calculateDeletionEligibility(lastActivityDate) {
    if (!lastActivityDate) return true;
    
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    return new Date(lastActivityDate) < threeYearsAgo;
  }

  /**
   * Advanced search and filter applications for users
   * @param {number} userId - User ID
   * @param {Object} filters - Search and filter options
   * @param {string} filters.search - Search text for job titles, companies, or locations
   * @param {Array} filters.statuses - Array of statuses to filter by
   * @param {Array} filters.specialties - Array of specialties to filter by
   * @param {string} filters.state - State filter
   * @param {Date} filters.dateFrom - Applications created after this date
   * @param {Date} filters.dateTo - Applications created before this date
   * @param {number} filters.minRate - Minimum expected rate filter
   * @param {number} filters.maxRate - Maximum expected rate filter
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Filtered applications with pagination
   */
  static async searchUserApplications(userId, filters = {}, pagination = {}) {
    const {
      search,
      statuses = [],
      specialties = [],
      state,
      dateFrom,
      dateTo,
      minRate,
      maxRate
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = pagination;

    // Build WHERE conditions
    const conditions = ['a.user_id = $1'];
    const values = [userId];
    let valueIndex = 2;

    // Search across job titles, company names, and locations
    if (search && search.trim()) {
      conditions.push(`(
        j.title ILIKE $${valueIndex} OR 
        j.company_name ILIKE $${valueIndex} OR 
        j.location ILIKE $${valueIndex} OR
        a.cover_letter ILIKE $${valueIndex}
      )`);
      values.push(`%${search.trim()}%`);
      valueIndex++;
    }

    // Status filters
    if (statuses.length > 0) {
      const statusPlaceholders = statuses.map(() => `$${valueIndex++}`).join(',');
      conditions.push(`a.status IN (${statusPlaceholders})`);
      values.push(...statuses);
    }

    // Specialty filters
    if (specialties.length > 0) {
      const specialtyPlaceholders = specialties.map(() => `$${valueIndex++}`).join(',');
      conditions.push(`j.specialty IN (${specialtyPlaceholders})`);
      values.push(...specialties);
    }

    // State filter
    if (state) {
      conditions.push(`j.state = $${valueIndex}`);
      values.push(state);
      valueIndex++;
    }

    // Date range filters
    if (dateFrom) {
      conditions.push(`a.created_at >= $${valueIndex}`);
      values.push(dateFrom);
      valueIndex++;
    }

    if (dateTo) {
      conditions.push(`a.created_at <= $${valueIndex}`);
      values.push(dateTo);
      valueIndex++;
    }

    // Rate range filters
    if (minRate !== undefined) {
      conditions.push(`a.expected_rate >= $${valueIndex}`);
      values.push(minRate);
      valueIndex++;
    }

    if (maxRate !== undefined) {
      conditions.push(`a.expected_rate <= $${valueIndex}`);
      values.push(maxRate);
      valueIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Count total items
    const countQuery = `
      SELECT COUNT(*) 
      FROM applications a 
      INNER JOIN jobs j ON a.job_id = j.id
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
      applications: applicationsResult.rows.map(row => Application.formatApplication(row)),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      appliedFilters: {
        search: search || null,
        statuses: statuses.length > 0 ? statuses : null,
        specialties: specialties.length > 0 ? specialties : null,
        state: state || null,
        dateRange: {
          from: dateFrom || null,
          to: dateTo || null
        },
        rateRange: {
          min: minRate !== undefined ? minRate : null,
          max: maxRate !== undefined ? maxRate : null
        }
      }
    };
  }

  /**
   * Advanced search and filter applications for recruiters
   * @param {number} jobId - Job ID
   * @param {number} recruiterId - Recruiter ID (must own the job)
   * @param {Object} filters - Search and filter options
   * @param {string} filters.search - Search text for applicant names, emails, or cover letters
   * @param {Array} filters.statuses - Array of statuses to filter by
   * @param {Date} filters.dateFrom - Applications created after this date
   * @param {Date} filters.dateTo - Applications created before this date
   * @param {number} filters.minRate - Minimum expected rate filter
   * @param {number} filters.maxRate - Maximum expected rate filter
   * @param {number} filters.minExperience - Minimum years of experience
   * @param {string} filters.applicantSpecialty - Filter by applicant specialty
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Filtered applications with pagination
   */
  static async searchJobApplications(jobId, recruiterId, filters = {}, pagination = {}) {
    // First verify that the user owns this job
    const jobOwnerQuery = 'SELECT posted_by FROM jobs WHERE id = $1';
    const jobOwnerResult = await pool.query(jobOwnerQuery, [jobId]);
    
    if (jobOwnerResult.rows.length === 0) {
      throw new Error('Job not found');
    }
    
    if (jobOwnerResult.rows[0].posted_by !== recruiterId) {
      throw new Error('Unauthorized to view applications for this job');
    }

    const {
      search,
      statuses = [],
      dateFrom,
      dateTo,
      minRate,
      maxRate,
      minExperience,
      applicantSpecialty
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = pagination;

    // Build WHERE conditions
    const conditions = ['a.job_id = $1'];
    const values = [jobId];
    let valueIndex = 2;

    // Search across applicant details and cover letters
    if (search && search.trim()) {
      conditions.push(`(
        u.email ILIKE $${valueIndex} OR 
        p.first_name ILIKE $${valueIndex} OR 
        p.last_name ILIKE $${valueIndex} OR
        a.cover_letter ILIKE $${valueIndex} OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $${valueIndex}
      )`);
      values.push(`%${search.trim()}%`);
      valueIndex++;
    }

    // Status filters
    if (statuses.length > 0) {
      const statusPlaceholders = statuses.map(() => `$${valueIndex++}`).join(',');
      conditions.push(`a.status IN (${statusPlaceholders})`);
      values.push(...statuses);
    }

    // Date range filters
    if (dateFrom) {
      conditions.push(`a.created_at >= $${valueIndex}`);
      values.push(dateFrom);
      valueIndex++;
    }

    if (dateTo) {
      conditions.push(`a.created_at <= $${valueIndex}`);
      values.push(dateTo);
      valueIndex++;
    }

    // Rate range filters
    if (minRate !== undefined) {
      conditions.push(`a.expected_rate >= $${valueIndex}`);
      values.push(minRate);
      valueIndex++;
    }

    if (maxRate !== undefined) {
      conditions.push(`a.expected_rate <= $${valueIndex}`);
      values.push(maxRate);
      valueIndex++;
    }

    // Experience filter
    if (minExperience !== undefined) {
      conditions.push(`p.years_experience >= $${valueIndex}`);
      values.push(minExperience);
      valueIndex++;
    }

    // Applicant specialty filter
    if (applicantSpecialty) {
      conditions.push(`p.specialty = $${valueIndex}`);
      values.push(applicantSpecialty);
      valueIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Count total items
    const countQuery = `
      SELECT COUNT(*) 
      FROM applications a 
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
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
      applications: applicationsResult.rows.map(row => Application.formatApplicationForRecruiter(row)),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      appliedFilters: {
        search: search || null,
        statuses: statuses.length > 0 ? statuses : null,
        dateRange: {
          from: dateFrom || null,
          to: dateTo || null
        },
        rateRange: {
          min: minRate !== undefined ? minRate : null,
          max: maxRate !== undefined ? maxRate : null
        },
        minExperience: minExperience !== undefined ? minExperience : null,
        applicantSpecialty: applicantSpecialty || null
      }
    };
  }

  /**
   * Get filter options for applications (for UI dropdowns)
   * @param {number} userId - User ID (optional, for user-specific filters)
   * @returns {Promise<Object>} Available filter options
   */
  static async getFilterOptions(userId = null) {
    let baseQuery = `
      SELECT DISTINCT
        j.specialty,
        j.state,
        a.status
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
    `;

    let values = [];
    if (userId) {
      baseQuery += ' WHERE a.user_id = $1';
      values = [userId];
    }

    const result = await pool.query(baseQuery, values);

    const specialties = [...new Set(result.rows.map(row => row.specialty).filter(Boolean))];
    const states = [...new Set(result.rows.map(row => row.state).filter(Boolean))];
    const statuses = [...new Set(result.rows.map(row => row.status).filter(Boolean))];

    // Get rate range
    const rateQuery = userId 
      ? 'SELECT MIN(expected_rate) as min_rate, MAX(expected_rate) as max_rate FROM applications WHERE user_id = $1 AND expected_rate IS NOT NULL'
      : 'SELECT MIN(expected_rate) as min_rate, MAX(expected_rate) as max_rate FROM applications WHERE expected_rate IS NOT NULL';
    
    const rateValues = userId ? [userId] : [];
    const rateResult = await pool.query(rateQuery, rateValues);
    const rateRange = rateResult.rows[0];

    return {
      specialties: specialties.sort(),
      states: states.sort(),
      statuses: statuses.sort(),
      rateRange: {
        min: rateRange.min_rate ? parseFloat(rateRange.min_rate) : 0,
        max: rateRange.max_rate ? parseFloat(rateRange.max_rate) : 1000
      }
    };
  }
}

module.exports = Application;