const express = require('express');
const Joi = require('joi');
const Job = require('../models/Job');
const { requireAuth, createErrorResponse } = require('../middleware/auth');
const config = require('../config/config');

const router = express.Router();

// Input validation schemas
const createJobSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  location: Joi.string().min(3).max(255).required(),
  state: Joi.string().length(2).uppercase().required(),
  specialty: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).max(5000).optional(),
  hourlyRateMin: Joi.number().min(0).max(1000).required(),
  hourlyRateMax: Joi.number().min(0).max(1000).required(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  duration: Joi.string().max(50).optional(),
  shiftType: Joi.string().max(50).optional(),
  companyName: Joi.string().max(255).optional(),
  status: Joi.string().valid('draft', 'active', 'filled', 'closed').default('active'),
  requirements: Joi.array().items(Joi.string().max(500)).max(20).optional()
}).custom((value, helpers) => {
  if (value.hourlyRateMin > value.hourlyRateMax) {
    return helpers.error('hourlyRateMin must be less than or equal to hourlyRateMax');
  }
  return value;
});

const updateJobSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  location: Joi.string().min(3).max(255).optional(),
  state: Joi.string().length(2).uppercase().optional(),
  specialty: Joi.string().min(2).max(100).optional(),
  description: Joi.string().min(10).max(5000).optional(),
  hourlyRateMin: Joi.number().min(0).max(1000).optional(),
  hourlyRateMax: Joi.number().min(0).max(1000).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  duration: Joi.string().max(50).optional(),
  shiftType: Joi.string().max(50).optional(),
  companyName: Joi.string().max(255).optional(),
  status: Joi.string().valid('draft', 'active', 'filled', 'closed').optional(),
  requirements: Joi.array().items(Joi.string().max(500)).max(20).optional()
}).custom((value, helpers) => {
  if (value.hourlyRateMin && value.hourlyRateMax && value.hourlyRateMin > value.hourlyRateMax) {
    return helpers.error('hourlyRateMin must be less than or equal to hourlyRateMax');
  }
  if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
    return helpers.error('startDate must be before endDate');
  }
  return value;
});

const querySchema = Joi.object({
  specialty: Joi.string().max(100).optional(),
  state: Joi.string().length(2).uppercase().optional(),
  status: Joi.string().valid('draft', 'active', 'filled', 'closed').optional(),
  minRate: Joi.number().min(0).optional(),
  maxRate: Joi.number().min(0).optional(),
  search: Joi.string().max(200).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('created_at', 'hourly_rate_min', 'start_date', 'title').default('created_at'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

/**
 * GET /api/jobs
 * Get all jobs with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    config.logger.info('Jobs list request', 'JOBS_LIST');
    
    // Validate query parameters
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      config.logger.warn(`Jobs query validation failed: ${error.details[0].message}`, 'JOBS_LIST');
      return createErrorResponse(res, 400, error.details[0].message, 'validation_error');
    }

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
router.get('/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    
    if (isNaN(jobId)) {
      return createErrorResponse(res, 400, 'Invalid job ID', 'invalid_job_id');
    }
    
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
    const { error, value } = createJobSchema.validate(req.body);
    if (error) {
      config.logger.warn(`Job creation validation failed: ${error.details[0].message}`, 'JOB_CREATE');
      return createErrorResponse(res, 400, error.details[0].message, 'validation_error');
    }

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
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    
    if (isNaN(jobId)) {
      return createErrorResponse(res, 400, 'Invalid job ID', 'invalid_job_id');
    }
    
    config.logger.info(`Job update attempt for ID: ${jobId} by user: ${req.user.id}`, 'JOB_UPDATE');
    
    // Validate input
    const { error, value } = updateJobSchema.validate(req.body);
    if (error) {
      config.logger.warn(`Job update validation failed: ${error.details[0].message}`, 'JOB_UPDATE');
      return createErrorResponse(res, 400, error.details[0].message, 'validation_error');
    }

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
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    
    if (isNaN(jobId)) {
      return createErrorResponse(res, 400, 'Invalid job ID', 'invalid_job_id');
    }
    
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