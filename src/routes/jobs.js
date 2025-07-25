const express = require('express');
const Job = require('../models/Job');
const { requireAuth, createErrorResponse } = require('../middleware/auth');
const { validateJobId } = require('../middleware/params');
const config = require('../config/config');
const { jobSchemas, validateWithSchema } = require('../validation/schemas');

const router = express.Router();


/**
 * GET /api/jobs
 * Get all jobs with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    config.logger.info('Jobs list request', 'JOBS_LIST');
    
    // Validate query parameters
    const validation = validateWithSchema(req.query, jobSchemas.query);
    if (!validation.isValid) {
      config.logger.warn(`Jobs query validation failed: ${validation.error}`, 'JOBS_LIST');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

    // Get jobs with filters
    const result = await Job.findAll(value);
    
    config.logger.info(`Retrieved ${result.jobs.length} jobs (page ${result.pagination.currentPage}/${result.pagination.totalPages})`, 'JOBS_LIST');

    res.json({
      ...result,
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    config.logger.error('Jobs list error', error, 'JOBS_LIST');
    return createErrorResponse(res, 500, 'Internal server error while fetching jobs', 'jobs_list_failed');
  }
});

/**
 * GET /api/jobs/:id
 * Get single job by ID
 */
router.get('/:id', validateJobId(), async (req, res) => {
  try {
    const jobId = req.params.id; // Already validated and converted by middleware
    
    config.logger.info(`Job detail request for ID: ${jobId}`, 'JOB_DETAIL');
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      config.logger.warn(`Job not found: ${jobId}`, 'JOB_DETAIL');
      return createErrorResponse(res, 404, 'Job not found', 'job_not_found');
    }
    
    res.json({
      job,
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    config.logger.error('Job detail error', error, 'JOB_DETAIL');
    return createErrorResponse(res, 500, 'Internal server error while fetching job', 'job_detail_failed');
  }
});

/**
 * POST /api/jobs
 * Create new job posting (requires authentication)
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Job creation attempt by user: ${req.user.id}`, 'JOB_CREATE');
    
    // Validate input
    const validation = validateWithSchema(req.body, jobSchemas.create);
    if (!validation.isValid) {
      config.logger.warn(`Job creation validation failed: ${validation.error}`, 'JOB_CREATE');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

    // Add posted_by from authenticated user
    const jobData = {
      ...value,
      postedBy: req.user.id
    };

    const newJob = await Job.create(jobData);
    
    config.logger.info(`Job created successfully: ${newJob.id} by user: ${req.user.id}`, 'JOB_CREATE');

    res.status(201).json({
      message: 'Job created successfully',
      job: newJob,
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    config.logger.error('Job creation error', error, 'JOB_CREATE');
    return createErrorResponse(res, 500, 'Internal server error during job creation', 'job_creation_failed');
  }
});

/**
 * PUT /api/jobs/:id
 * Update job posting (requires authentication and ownership)
 */
router.put('/:id', validateJobId(), requireAuth, async (req, res) => {
  try {
    const jobId = req.params.id; // Already validated and converted by middleware
    
    config.logger.info(`Job update attempt for ID: ${jobId} by user: ${req.user.id}`, 'JOB_UPDATE');
    
    // Validate input
    const validation = validateWithSchema(req.body, jobSchemas.update);
    if (!validation.isValid) {
      config.logger.warn(`Job update validation failed: ${validation.error}`, 'JOB_UPDATE');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

    // Check if there's anything to update
    if (Object.keys(value).length === 0) {
      return createErrorResponse(res, 400, 'No valid fields to update', 'nothing_to_update');
    }

    try {
      const updatedJob = await Job.update(jobId, req.user.id, value);
      
      if (!updatedJob) {
        config.logger.warn(`Job not found for update: ${jobId}`, 'JOB_UPDATE');
        return createErrorResponse(res, 404, 'Job not found', 'job_not_found');
      }
      
      config.logger.info(`Job updated successfully: ${jobId} by user: ${req.user.id}`, 'JOB_UPDATE');

      res.json({
        message: 'Job updated successfully',
        job: updatedJob,
        timestamp: config.utils.timestamp()
      });
      
    } catch (updateError) {
      if (updateError.message === 'Unauthorized to update this job') {
        config.logger.warn(`Unauthorized job update attempt: ${jobId} by user: ${req.user.id}`, 'JOB_UPDATE');
        return createErrorResponse(res, 403, 'You are not authorized to update this job', 'unauthorized');
      }
      throw updateError;
    }

  } catch (error) {
    config.logger.error('Job update error', error, 'JOB_UPDATE');
    return createErrorResponse(res, 500, 'Internal server error during job update', 'job_update_failed');
  }
});

/**
 * DELETE /api/jobs/:id
 * Delete job posting (requires authentication and ownership)
 */
router.delete('/:id', validateJobId(), requireAuth, async (req, res) => {
  try {
    const jobId = req.params.id; // Already validated and converted by middleware
    
    config.logger.info(`Job deletion attempt for ID: ${jobId} by user: ${req.user.id}`, 'JOB_DELETE');
    
    try {
      const deleted = await Job.delete(jobId, req.user.id);
      
      if (!deleted) {
        config.logger.warn(`Job not found for deletion: ${jobId}`, 'JOB_DELETE');
        return createErrorResponse(res, 404, 'Job not found', 'job_not_found');
      }
      
      config.logger.info(`Job deleted successfully: ${jobId} by user: ${req.user.id}`, 'JOB_DELETE');

      res.json({
        message: 'Job deleted successfully',
        timestamp: config.utils.timestamp()
      });
      
    } catch (deleteError) {
      if (deleteError.message === 'Unauthorized to delete this job') {
        config.logger.warn(`Unauthorized job deletion attempt: ${jobId} by user: ${req.user.id}`, 'JOB_DELETE');
        return createErrorResponse(res, 403, 'You are not authorized to delete this job', 'unauthorized');
      }
      throw deleteError;
    }

  } catch (error) {
    config.logger.error('Job deletion error', error, 'JOB_DELETE');
    return createErrorResponse(res, 500, 'Internal server error during job deletion', 'job_deletion_failed');
  }
});

module.exports = router;