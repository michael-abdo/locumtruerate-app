const express = require('express');
const Joi = require('joi');
const Application = require('../models/Application');
const { requireAuth, createErrorResponse } = require('../middleware/auth');
const config = require('../config/config');

const router = express.Router();

// Input validation schemas
const createApplicationSchema = Joi.object({
  jobId: Joi.number().integer().positive().required(),
  coverLetter: Joi.string().min(10).max(5000).required(),
  expectedRate: Joi.number().min(0).max(2000).optional(),
  availableDate: Joi.date().iso().min('now').optional(),
  notes: Joi.string().max(1000).optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'reviewed', 'accepted', 'rejected').required(),
  notes: Joi.string().max(1000).optional()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'reviewed', 'accepted', 'rejected', 'withdrawn').optional(),
  sortBy: Joi.string().valid('created_at', 'updated_at', 'status').default('created_at'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

/**
 * POST /api/applications
 * Apply to a job
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Application creation attempt by user: ${req.user.id}`, 'APPLICATION_CREATE');
    
    // Validate input
    const { error, value } = createApplicationSchema.validate(req.body);
    if (error) {
      config.logger.warn(`Application validation failed: ${error.details[0].message}`, 'APPLICATION_CREATE');
      return createErrorResponse(res, 400, error.details[0].message, 'validation_error');
    }

    // Add user ID to application data
    const applicationData = {
      ...value,
      userId: req.user.id
    };

    try {
      const newApplication = await Application.create(applicationData);
      
      config.logger.info(`Application created successfully: ${newApplication.id} for job: ${value.jobId} by user: ${req.user.id}`, 'APPLICATION_CREATE');

      res.status(201).json({
        message: 'Application submitted successfully',
        application: newApplication,
        timestamp: config.utils.timestamp()
      });

    } catch (createError) {
      // Handle specific business logic errors
      if (createError.message === 'Job not found or no longer active') {
        config.logger.warn(`Application failed: Job not found - Job ID: ${value.jobId}`, 'APPLICATION_CREATE');
        return createErrorResponse(res, 404, 'Job not found or no longer accepting applications', 'job_not_found');
      }
      
      if (createError.message === 'Cannot apply to your own job posting') {
        config.logger.warn(`Application failed: User trying to apply to own job - User: ${req.user.id}, Job: ${value.jobId}`, 'APPLICATION_CREATE');
        return createErrorResponse(res, 400, 'You cannot apply to your own job posting', 'invalid_application');
      }
      
      if (createError.message === 'You have already applied to this job') {
        config.logger.warn(`Application failed: Duplicate application - User: ${req.user.id}, Job: ${value.jobId}`, 'APPLICATION_CREATE');
        return createErrorResponse(res, 400, 'You have already applied to this job', 'duplicate_application');
      }
      
      throw createError;
    }

  } catch (error) {
    config.logger.error('Application creation error', error, 'APPLICATION_CREATE');
    return createErrorResponse(res, 500, 'Internal server error during application submission', 'application_creation_failed');
  }
});

/**
 * GET /api/my-applications
 * Get current user's applications
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    config.logger.info(`My applications request by user: ${req.user.id}`, 'APPLICATIONS_MY');
    
    // Validate query parameters
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      config.logger.warn(`My applications query validation failed: ${error.details[0].message}`, 'APPLICATIONS_MY');
      return createErrorResponse(res, 400, error.details[0].message, 'validation_error');
    }

    const result = await Application.findByUser(req.user.id, value);
    
    config.logger.info(`Retrieved ${result.applications.length} applications for user: ${req.user.id} (page ${result.pagination.currentPage}/${result.pagination.totalPages})`, 'APPLICATIONS_MY');

    res.json({
      ...result,
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    config.logger.error('My applications error', error, 'APPLICATIONS_MY');
    return createErrorResponse(res, 500, 'Internal server error while fetching applications', 'applications_fetch_failed');
  }
});

/**
 * GET /api/jobs/:jobId/applications
 * Get applications for a specific job (for job poster/recruiter)
 */
router.get('/for-job/:jobId', requireAuth, async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    
    if (isNaN(jobId)) {
      return createErrorResponse(res, 400, 'Invalid job ID', 'invalid_job_id');
    }
    
    config.logger.info(`Job applications request for job: ${jobId} by user: ${req.user.id}`, 'JOB_APPLICATIONS');
    
    // Validate query parameters
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      config.logger.warn(`Job applications query validation failed: ${error.details[0].message}`, 'JOB_APPLICATIONS');
      return createErrorResponse(res, 400, error.details[0].message, 'validation_error');
    }

    try {
      const result = await Application.findByJob(jobId, req.user.id, value);
      
      config.logger.info(`Retrieved ${result.applications.length} applications for job: ${jobId} (page ${result.pagination.currentPage}/${result.pagination.totalPages})`, 'JOB_APPLICATIONS');

      res.json({
        ...result,
        timestamp: config.utils.timestamp()
      });

    } catch (findError) {
      if (findError.message === 'Job not found') {
        config.logger.warn(`Job not found: ${jobId}`, 'JOB_APPLICATIONS');
        return createErrorResponse(res, 404, 'Job not found', 'job_not_found');
      }
      
      if (findError.message === 'Unauthorized to view applications for this job') {
        config.logger.warn(`Unauthorized job applications access attempt: Job ${jobId} by user: ${req.user.id}`, 'JOB_APPLICATIONS');
        return createErrorResponse(res, 403, 'You are not authorized to view applications for this job', 'unauthorized');
      }
      
      throw findError;
    }

  } catch (error) {
    config.logger.error('Job applications error', error, 'JOB_APPLICATIONS');
    return createErrorResponse(res, 500, 'Internal server error while fetching job applications', 'job_applications_failed');
  }
});

/**
 * PUT /api/applications/:id/status
 * Update application status (for recruiters)
 */
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    
    if (isNaN(applicationId)) {
      return createErrorResponse(res, 400, 'Invalid application ID', 'invalid_application_id');
    }
    
    config.logger.info(`Application status update attempt for ID: ${applicationId} by user: ${req.user.id}`, 'APPLICATION_STATUS_UPDATE');
    
    // Validate input
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
      config.logger.warn(`Application status update validation failed: ${error.details[0].message}`, 'APPLICATION_STATUS_UPDATE');
      return createErrorResponse(res, 400, error.details[0].message, 'validation_error');
    }

    try {
      const updatedApplication = await Application.updateStatus(
        applicationId, 
        req.user.id, 
        value.status, 
        value.notes
      );
      
      config.logger.info(`Application status updated successfully: ${applicationId} to ${value.status} by user: ${req.user.id}`, 'APPLICATION_STATUS_UPDATE');

      res.json({
        message: 'Application status updated successfully',
        application: updatedApplication,
        timestamp: config.utils.timestamp()
      });

    } catch (updateError) {
      if (updateError.message === 'Application not found') {
        config.logger.warn(`Application not found for status update: ${applicationId}`, 'APPLICATION_STATUS_UPDATE');
        return createErrorResponse(res, 404, 'Application not found', 'application_not_found');
      }
      
      if (updateError.message === 'Unauthorized to update this application') {
        config.logger.warn(`Unauthorized application status update attempt: ${applicationId} by user: ${req.user.id}`, 'APPLICATION_STATUS_UPDATE');
        return createErrorResponse(res, 403, 'You are not authorized to update this application', 'unauthorized');
      }
      
      if (updateError.message === 'Invalid status value') {
        config.logger.warn(`Invalid status value in application update: ${applicationId}`, 'APPLICATION_STATUS_UPDATE');
        return createErrorResponse(res, 400, 'Invalid status value', 'invalid_status');
      }
      
      throw updateError;
    }

  } catch (error) {
    config.logger.error('Application status update error', error, 'APPLICATION_STATUS_UPDATE');
    return createErrorResponse(res, 500, 'Internal server error during application status update', 'application_status_update_failed');
  }
});

/**
 * DELETE /api/applications/:id
 * Withdraw application (for applicants)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    
    if (isNaN(applicationId)) {
      return createErrorResponse(res, 400, 'Invalid application ID', 'invalid_application_id');
    }
    
    config.logger.info(`Application withdrawal attempt for ID: ${applicationId} by user: ${req.user.id}`, 'APPLICATION_WITHDRAW');
    
    try {
      await Application.withdraw(applicationId, req.user.id);
      
      config.logger.info(`Application withdrawn successfully: ${applicationId} by user: ${req.user.id}`, 'APPLICATION_WITHDRAW');

      res.json({
        message: 'Application withdrawn successfully',
        timestamp: config.utils.timestamp()
      });

    } catch (withdrawError) {
      if (withdrawError.message === 'Application not found') {
        config.logger.warn(`Application not found for withdrawal: ${applicationId}`, 'APPLICATION_WITHDRAW');
        return createErrorResponse(res, 404, 'Application not found', 'application_not_found');
      }
      
      if (withdrawError.message === 'Unauthorized to withdraw this application') {
        config.logger.warn(`Unauthorized application withdrawal attempt: ${applicationId} by user: ${req.user.id}`, 'APPLICATION_WITHDRAW');
        return createErrorResponse(res, 403, 'You are not authorized to withdraw this application', 'unauthorized');
      }
      
      if (withdrawError.message === 'Application is already withdrawn') {
        config.logger.warn(`Attempt to withdraw already withdrawn application: ${applicationId}`, 'APPLICATION_WITHDRAW');
        return createErrorResponse(res, 400, 'Application is already withdrawn', 'already_withdrawn');
      }
      
      if (withdrawError.message === 'Cannot withdraw an accepted application') {
        config.logger.warn(`Attempt to withdraw accepted application: ${applicationId}`, 'APPLICATION_WITHDRAW');
        return createErrorResponse(res, 400, 'Cannot withdraw an accepted application', 'cannot_withdraw_accepted');
      }
      
      throw withdrawError;
    }

  } catch (error) {
    config.logger.error('Application withdrawal error', error, 'APPLICATION_WITHDRAW');
    return createErrorResponse(res, 500, 'Internal server error during application withdrawal', 'application_withdrawal_failed');
  }
});

module.exports = router;