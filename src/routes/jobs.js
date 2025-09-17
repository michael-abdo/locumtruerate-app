const express = require('express');
const Job = require('../models/Job');
const { requireAuth } = require('../middleware/auth');
const { validateJobId } = require('../middleware/params');
const config = require('../config/config');
const { jobSchemas, validateWithSchema } = require('../validation/schemas');
const { 
  createSuccessResponse, 
  createErrorResponse, 
  asyncHandler,
  createValidationErrorResponse 
} = require('../utils/responses');

const router = express.Router();


/**
 * GET /api/jobs
 * Get all jobs with filtering and pagination
 */
router.get('/', asyncHandler(async (req, res) => {
  config.logger.info('Jobs list request', 'JOBS_LIST');
  
  // Validate query parameters
  const validation = validateWithSchema(req.query, jobSchemas.query);
  if (!validation.isValid) {
    config.logger.warn(`Jobs query validation failed: ${validation.error}`, 'JOBS_LIST');
    return createValidationErrorResponse(res, [{ field: 'query', message: validation.error }]);
  }
  const value = validation.value;

  // Get jobs with filters
  const result = await Job.findAll(value);
  
  config.logger.info(`Retrieved ${result.jobs.length} jobs (page ${result.pagination.currentPage}/${result.pagination.totalPages})`, 'JOBS_LIST');

  return createSuccessResponse(res, 200, result);
}));

/**
 * GET /api/jobs/:id
 * Get single job by ID
 */
router.get('/:id', validateJobId(), asyncHandler(async (req, res) => {
  const jobId = req.params.id; // Already validated and converted by middleware
  
  config.logger.info(`Job detail request for ID: ${jobId}`, 'JOB_DETAIL');
  
  const job = await Job.findById(jobId);
  
  if (!job) {
    config.logger.warn(`Job not found: ${jobId}`, 'JOB_DETAIL');
    return createErrorResponse(res, 404, 'Job not found', 'job_not_found');
  }
  
  return createSuccessResponse(res, 200, { job });
}));

/**
 * POST /api/jobs
 * Create new job posting (requires authentication)
 */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  config.logger.info(`Job creation attempt by user: ${req.user.id}`, 'JOB_CREATE');
  
  // Validate input
  const validation = validateWithSchema(req.body, jobSchemas.create);
  if (!validation.isValid) {
    config.logger.warn(`Job creation validation failed: ${validation.error}`, 'JOB_CREATE');
    return createValidationErrorResponse(res, [{ field: 'body', message: validation.error }]);
  }
  const value = validation.value;

  // Add posted_by from authenticated user
  const jobData = {
    ...value,
    postedBy: req.user.id
  };

  const newJob = await Job.create(jobData);
  
  config.logger.info(`Job created successfully: ${newJob.id} by user: ${req.user.id}`, 'JOB_CREATE');

  return createSuccessResponse(res, 201, { job: newJob }, 'Job created successfully');
}));

/**
 * PUT /api/jobs/:id
 * Update job posting (requires authentication and ownership)
 */
router.put('/:id', validateJobId(), requireAuth, asyncHandler(async (req, res) => {
  const jobId = req.params.id; // Already validated and converted by middleware
  
  config.logger.info(`Job update attempt for ID: ${jobId} by user: ${req.user.id}`, 'JOB_UPDATE');
  
  // Validate input
  const validation = validateWithSchema(req.body, jobSchemas.update);
  if (!validation.isValid) {
    config.logger.warn(`Job update validation failed: ${validation.error}`, 'JOB_UPDATE');
    return createValidationErrorResponse(res, [{ field: 'body', message: validation.error }]);
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

    return createSuccessResponse(res, 200, { job: updatedJob }, 'Job updated successfully');
    
  } catch (updateError) {
    if (updateError.message === 'Unauthorized to update this job') {
      config.logger.warn(`Unauthorized job update attempt: ${jobId} by user: ${req.user.id}`, 'JOB_UPDATE');
      return createErrorResponse(res, 403, 'You are not authorized to update this job', 'unauthorized');
    }
    throw updateError;
  }
}));

/**
 * DELETE /api/jobs/:id
 * Delete job posting (requires authentication and ownership)
 */
router.delete('/:id', validateJobId(), requireAuth, asyncHandler(async (req, res) => {
  const jobId = req.params.id; // Already validated and converted by middleware
  
  config.logger.info(`Job deletion attempt for ID: ${jobId} by user: ${req.user.id}`, 'JOB_DELETE');
  
  try {
    const deleted = await Job.delete(jobId, req.user.id);
    
    if (!deleted) {
      config.logger.warn(`Job not found for deletion: ${jobId}`, 'JOB_DELETE');
      return createErrorResponse(res, 404, 'Job not found', 'job_not_found');
    }
    
    config.logger.info(`Job deleted successfully: ${jobId} by user: ${req.user.id}`, 'JOB_DELETE');

    return createSuccessResponse(res, 200, null, 'Job deleted successfully');
    
  } catch (deleteError) {
    if (deleteError.message === 'Unauthorized to delete this job') {
      config.logger.warn(`Unauthorized job deletion attempt: ${jobId} by user: ${req.user.id}`, 'JOB_DELETE');
      return createErrorResponse(res, 403, 'You are not authorized to delete this job', 'unauthorized');
    }
    throw deleteError;
  }
}));

module.exports = router;