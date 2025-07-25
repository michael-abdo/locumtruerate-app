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

class Job {
  /**
   * Create a new job posting
   * @param {Object} jobData - Job data object
   * @param {string} jobData.title - Job title
   * @param {string} jobData.location - Job location
   * @param {string} jobData.state - State (2-letter code)
   * @param {string} jobData.specialty - Medical specialty
   * @param {string} jobData.description - Job description
   * @param {number} jobData.hourlyRateMin - Minimum hourly rate
   * @param {number} jobData.hourlyRateMax - Maximum hourly rate
   * @param {Date} jobData.startDate - Start date
   * @param {Date} jobData.endDate - End date
   * @param {string} jobData.duration - Duration description
   * @param {string} jobData.shiftType - Shift type
   * @param {number} jobData.postedBy - User ID who posted the job
   * @param {string} jobData.companyName - Company name
   * @param {string} jobData.status - Job status (draft, active, filled, closed)
   * @param {Array<string>} jobData.requirements - Job requirements array
   * @returns {Promise<Object>} Created job with ID
   */
  static async create(jobData) {
    const {
      title,
      location,
      state,
      specialty,
      description,
      hourlyRateMin,
      hourlyRateMax,
      startDate,
      endDate,
      duration,
      shiftType,
      postedBy,
      companyName,
      status = 'active',
      requirements = []
    } = jobData;

    return executeTransaction(async (client) => {
      // Create job
      const jobQuery = `
        INSERT INTO jobs (
          title, location, state, specialty, description,
          hourly_rate_min, hourly_rate_max, start_date, end_date,
          duration, shift_type, posted_by, company_name, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const jobValues = [
        title, location, state, specialty, description,
        hourlyRateMin, hourlyRateMax, startDate, endDate,
        duration, shiftType, postedBy, companyName, status
      ];
      
      const jobResult = await client.query(jobQuery, jobValues);
      const job = jobResult.rows[0];

      // Add requirements if any
      if (requirements.length > 0) {
        const requirementValues = requirements.map((req, index) => 
          `($1, $${index + 2})`
        ).join(', ');
        
        const requirementQuery = `
          INSERT INTO job_requirements (job_id, requirement)
          VALUES ${requirementValues}
          RETURNING *
        `;
        
        const requirementParams = [job.id, ...requirements];
        const requirementResult = await client.query(requirementQuery, requirementParams);
        job.requirements = requirementResult.rows.map(r => r.requirement);
      } else {
        job.requirements = [];
      }
      
      return this.formatJob(job);
    });
  }

  /**
   * Find jobs with filtering and pagination
   * @param {Object} filters - Filter options
   * @param {string} filters.specialty - Filter by specialty
   * @param {string} filters.state - Filter by state
   * @param {string} filters.status - Filter by status
   * @param {number} filters.minRate - Minimum hourly rate
   * @param {number} filters.maxRate - Maximum hourly rate
   * @param {string} filters.search - Search in title and description
   * @param {number} filters.page - Page number (default: 1)
   * @param {number} filters.limit - Items per page (default: 20)
   * @param {string} filters.sortBy - Sort field (default: created_at)
   * @param {string} filters.sortOrder - Sort order (default: DESC)
   * @returns {Promise<Object>} Jobs array with pagination info
   */
  static async findAll(filters = {}) {
    const {
      specialty,
      state,
      status = 'active',
      minRate,
      maxRate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    // Build WHERE conditions using utilities
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Simple equality filters
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (specialty) {
      conditions.push(`specialty = $${paramIndex}`);
      values.push(specialty);
      paramIndex++;
    }

    if (state) {
      conditions.push(`state = $${paramIndex}`);
      values.push(state);
      paramIndex++;
    }

    // Rate range filters (special case: spans both min and max columns)
    if (minRate) {
      conditions.push(`hourly_rate_max >= $${paramIndex}`);
      values.push(minRate);
      paramIndex++;
    }

    if (maxRate) {
      conditions.push(`hourly_rate_min <= $${paramIndex}`);
      values.push(maxRate);
      paramIndex++;
    }

    // Use search condition utility
    if (search) {
      const searchCondition = buildSearchCondition(search, ['title', 'description'], paramIndex);
      if (searchCondition.condition) {
        conditions.push(searchCondition.condition);
        values.push(...searchCondition.values);
        paramIndex = searchCondition.paramIndex;
      }
    }

    // Build WHERE clause using utility
    const whereClause = buildWhereClause(conditions);

    // Define base query and count query
    const baseQuery = `
      SELECT j.*, u.email as posted_by_email,
             COUNT(r.id) as requirement_count
      FROM jobs j
      LEFT JOIN users u ON j.posted_by = u.id
      LEFT JOIN job_requirements r ON j.id = r.job_id
      ${whereClause}
      GROUP BY j.id, u.email
    `;

    const countQuery = `SELECT COUNT(*) FROM jobs ${whereClause}`;

    // Use paginated query utility
    const validSortFields = ['created_at', 'hourly_rate_min', 'start_date', 'title'];
    const result = await executePaginatedQuery(
      baseQuery,
      countQuery,
      values,
      { page, limit, sortBy, sortOrder, validSortFields }
    );

    return {
      jobs: result.items.map(job => this.formatJob(job)),
      pagination: result.pagination
    };
  }

  /**
   * Find job by ID with requirements
   * @param {number} id - Job ID
   * @returns {Promise<Object|null>} Job object or null
   */
  static async findById(id) {
    const jobQuery = `
      SELECT j.*, u.email as posted_by_email,
             p.first_name as posted_by_first_name,
             p.last_name as posted_by_last_name
      FROM jobs j
      LEFT JOIN users u ON j.posted_by = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE j.id = $1
    `;
    
    const jobResult = await pool.query(jobQuery, [id]);
    
    if (jobResult.rows.length === 0) {
      return null;
    }
    
    const job = jobResult.rows[0];
    
    // Get requirements
    const requirementsQuery = `
      SELECT requirement 
      FROM job_requirements 
      WHERE job_id = $1 
      ORDER BY id
    `;
    
    const requirementsResult = await pool.query(requirementsQuery, [id]);
    job.requirements = requirementsResult.rows.map(r => r.requirement);
    
    // Increment view count
    await pool.query('UPDATE jobs SET views = views + 1 WHERE id = $1', [id]);
    
    return this.formatJob(job);
  }

  /**
   * Update job by ID
   * @param {number} id - Job ID
   * @param {number} userId - User ID (for authorization)
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object|null>} Updated job or null
   */
  static async update(id, userId, updateData) {
    // First check if job exists and user has permission
    const checkQuery = 'SELECT posted_by FROM jobs WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return null;
    }
    
    if (checkResult.rows[0].posted_by !== userId) {
      throw new Error('Unauthorized to update this job');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Build update query dynamically
      const updateFields = [];
      const values = [];
      let valueIndex = 1;

      const allowedFields = [
        'title', 'location', 'state', 'specialty', 'description',
        'hourly_rate_min', 'hourly_rate_max', 'start_date', 'end_date',
        'duration', 'shift_type', 'company_name', 'status'
      ];

      // Convert camelCase to snake_case for database fields
      const camelToSnake = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(camelToSnake(key))) {
          updateFields.push(`${camelToSnake(key)} = $${valueIndex}`);
          values.push(value);
          valueIndex++;
        }
      }

      if (updateFields.length === 0) {
        await client.query('ROLLBACK');
        return await this.findById(id);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const updateQuery = `
        UPDATE jobs 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, values);
      const job = updateResult.rows[0];

      // Update requirements if provided
      if (updateData.requirements && Array.isArray(updateData.requirements)) {
        // Delete existing requirements
        await client.query('DELETE FROM job_requirements WHERE job_id = $1', [id]);
        
        // Add new requirements
        if (updateData.requirements.length > 0) {
          const requirementValues = updateData.requirements.map((req, index) => 
            `($1, $${index + 2})`
          ).join(', ');
          
          const requirementQuery = `
            INSERT INTO job_requirements (job_id, requirement)
            VALUES ${requirementValues}
            RETURNING requirement
          `;
          
          const requirementParams = [id, ...updateData.requirements];
          const requirementResult = await client.query(requirementQuery, requirementParams);
          job.requirements = requirementResult.rows.map(r => r.requirement);
        } else {
          job.requirements = [];
        }
      }

      await client.query('COMMIT');
      
      return this.formatJob(job);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete job by ID
   * @param {number} id - Job ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id, userId) {
    // Check ownership
    const checkQuery = 'SELECT posted_by FROM jobs WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return false;
    }
    
    if (checkResult.rows[0].posted_by !== userId) {
      throw new Error('Unauthorized to delete this job');
    }

    const deleteQuery = 'DELETE FROM jobs WHERE id = $1';
    await pool.query(deleteQuery, [id]);
    
    return true;
  }

  /**
   * Format job object for API response
   * @param {Object} job - Raw job from database
   * @returns {Object} Formatted job object
   */
  static formatJob(job) {
    return {
      id: job.id,
      title: job.title,
      location: job.location,
      state: job.state,
      specialty: job.specialty,
      description: job.description,
      hourlyRateMin: parseFloat(job.hourly_rate_min),
      hourlyRateMax: parseFloat(job.hourly_rate_max),
      startDate: job.start_date,
      endDate: job.end_date,
      duration: job.duration,
      shiftType: job.shift_type,
      postedBy: job.posted_by,
      postedByEmail: job.posted_by_email,
      postedByName: job.posted_by_first_name && job.posted_by_last_name
        ? `${job.posted_by_first_name} ${job.posted_by_last_name}`
        : null,
      companyName: job.company_name,
      status: job.status,
      views: job.views,
      requirements: job.requirements || [],
      requirementCount: parseInt(job.requirement_count || 0),
      createdAt: job.created_at,
      updatedAt: job.updated_at
    };
  }
}

module.exports = Job;