const express = require('express');
const Application = require('../models/Application');
const { requireAuth, createErrorResponse } = require('../middleware/auth');
const { validateApplicationId, validateJobIdParam } = require('../middleware/params');
const { metricsInstance } = require('../middleware/metrics');
const config = require('../config/config');
const { applicationSchemas, validateWithSchema } = require('../validation/schemas');

const router = express.Router();


/**
 * POST /api/applications
 * Apply to a job
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Application creation attempt by user: ${req.user.id}`, 'APPLICATION_CREATE');
    
    // Validate input
    const validation = validateWithSchema(req.body, applicationSchemas.create);
    if (!validation.isValid) {
      config.logger.warn(`Application validation failed: ${validation.error}`, 'APPLICATION_CREATE');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

    // Add user ID to application data
    const applicationData = {
      ...value,
      userId: req.user.id
    };

    try {
      const startTime = Date.now();
      const newApplication = await Application.create(applicationData);
      const responseTime = Date.now() - startTime;
      
      // Track successful application creation
      // metricsInstance.recordApplicationCreated(req.user.id, value.jobId, responseTime);
      
      // config.logger.info(`Application created successfully: ${newApplication.id} for job: ${value.jobId} by user: ${req.user.id}`, 'APPLICATION_CREATE');

      return res.status(201).json({
        message: 'Application submitted successfully',
        applicationId: newApplication.id,
        timestamp: new Date().toISOString()
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
        // Track duplicate application attempt
        metricsInstance.recordDuplicateAttempt(req.user.id, value.jobId);
        
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
    const validation = validateWithSchema(req.query, applicationSchemas.query);
    if (!validation.isValid) {
      config.logger.warn(`My applications query validation failed: ${validation.error}`, 'APPLICATIONS_MY');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

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
router.get('/for-job/:jobId', validateJobIdParam(), requireAuth, async (req, res) => {
  try {
    const jobId = req.params.jobId; // Already validated and converted by middleware
    
    config.logger.info(`Job applications request for job: ${jobId} by user: ${req.user.id}`, 'JOB_APPLICATIONS');
    
    // Validate query parameters
    const validation = validateWithSchema(req.query, applicationSchemas.query);
    if (!validation.isValid) {
      config.logger.warn(`Job applications query validation failed: ${validation.error}`, 'JOB_APPLICATIONS');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

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
router.put('/:id/status', validateApplicationId(), requireAuth, async (req, res) => {
  try {
    const applicationId = req.params.id; // Already validated and converted by middleware
    
    config.logger.info(`Application status update attempt for ID: ${applicationId} by user: ${req.user.id}`, 'APPLICATION_STATUS_UPDATE');
    
    // Validate input
    const validation = validateWithSchema(req.body, applicationSchemas.updateStatus);
    if (!validation.isValid) {
      config.logger.warn(`Application status update validation failed: ${validation.error}`, 'APPLICATION_STATUS_UPDATE');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

    try {
      const startTime = Date.now();
      const updatedApplication = await Application.updateStatus(
        applicationId, 
        req.user.id, 
        value.status, 
        value.notes
      );
      const responseTime = Date.now() - startTime;
      
      // Track status update
      metricsInstance.recordStatusUpdate(req.user.id, applicationId, value.status, responseTime);
      
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
 * GET /api/applications/search
 * Advanced search and filter user's applications
 */
router.get('/search', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Application search request by user: ${req.user.id}`, 'APPLICATIONS_SEARCH');
    
    // Validate search parameters
    const validation = validateWithSchema(req.query, applicationSchemas.search);
    if (!validation.isValid) {
      config.logger.warn(`Application search validation failed: ${validation.error}`, 'APPLICATIONS_SEARCH');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

    // Separate filters from pagination
    const { page, limit, sortBy, sortOrder, ...filters } = value;
    
    const result = await Application.searchUserApplications(
      req.user.id, 
      filters, 
      { page, limit, sortBy, sortOrder }
    );
    
    config.logger.info(`Search completed for user: ${req.user.id} - ${result.applications.length} results (page ${result.pagination.currentPage}/${result.pagination.totalPages})`, 'APPLICATIONS_SEARCH');

    res.json({
      ...result,
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    config.logger.error('Application search error', error, 'APPLICATIONS_SEARCH');
    return createErrorResponse(res, 500, 'Internal server error during search', 'applications_search_failed');
  }
});

/**
 * GET /api/applications/for-job/:jobId/search
 * Advanced search and filter applications for a specific job (for recruiters)
 */
router.get('/for-job/:jobId/search', validateJobIdParam(), requireAuth, async (req, res) => {
  try {
    const jobId = req.params.jobId; // Already validated and converted by middleware
    
    config.logger.info(`Job application search request for job: ${jobId} by user: ${req.user.id}`, 'JOB_APPLICATIONS_SEARCH');
    
    // Validate search parameters
    const validation = validateWithSchema(req.query, applicationSchemas.recruiterSearch);
    if (!validation.isValid) {
      config.logger.warn(`Job application search validation failed: ${validation.error}`, 'JOB_APPLICATIONS_SEARCH');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

    // Separate filters from pagination
    const { page, limit, sortBy, sortOrder, ...filters } = value;
    
    try {
      const result = await Application.searchJobApplications(
        jobId, 
        req.user.id, 
        filters, 
        { page, limit, sortBy, sortOrder }
      );
      
      config.logger.info(`Job application search completed for job: ${jobId} - ${result.applications.length} results (page ${result.pagination.currentPage}/${result.pagination.totalPages})`, 'JOB_APPLICATIONS_SEARCH');

      res.json({
        ...result,
        timestamp: config.utils.timestamp()
      });

    } catch (searchError) {
      if (searchError.message === 'Job not found') {
        config.logger.warn(`Job not found: ${jobId}`, 'JOB_APPLICATIONS_SEARCH');
        return createErrorResponse(res, 404, 'Job not found', 'job_not_found');
      }
      
      if (searchError.message === 'Unauthorized to view applications for this job') {
        config.logger.warn(`Unauthorized job applications search attempt: Job ${jobId} by user: ${req.user.id}`, 'JOB_APPLICATIONS_SEARCH');
        return createErrorResponse(res, 403, 'You are not authorized to search applications for this job', 'unauthorized');
      }
      
      throw searchError;
    }

  } catch (error) {
    config.logger.error('Job applications search error', error, 'JOB_APPLICATIONS_SEARCH');
    return createErrorResponse(res, 500, 'Internal server error during job applications search', 'job_applications_search_failed');
  }
});

/**
 * GET /api/applications/filter-options
 * Get available filter options for applications
 */
router.get('/filter-options', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Filter options request by user: ${req.user.id}`, 'FILTER_OPTIONS');
    
    const includeUserSpecific = req.query.userSpecific === 'true';
    const userId = includeUserSpecific ? req.user.id : null;
    
    const filterOptions = await Application.getFilterOptions(userId);
    
    config.logger.info(`Filter options provided for user: ${req.user.id} (user-specific: ${includeUserSpecific})`, 'FILTER_OPTIONS');

    res.json({
      filterOptions,
      timestamp: config.utils.timestamp()
    });

  } catch (error) {
    config.logger.error('Filter options error', error, 'FILTER_OPTIONS');
    return createErrorResponse(res, 500, 'Internal server error while fetching filter options', 'filter_options_failed');
  }
});

/**
 * DELETE /api/applications/:id
 * Withdraw application (for applicants)
 */
router.delete('/:id', validateApplicationId(), requireAuth, async (req, res) => {
  try {
    const applicationId = req.params.id; // Already validated and converted by middleware
    
    config.logger.info(`Application withdrawal attempt for ID: ${applicationId} by user: ${req.user.id}`, 'APPLICATION_WITHDRAW');
    
    try {
      const startTime = Date.now();
      await Application.withdraw(applicationId, req.user.id);
      const responseTime = Date.now() - startTime;
      
      // Track application withdrawal
      metricsInstance.recordApplicationWithdrawn(req.user.id, applicationId, responseTime);
      
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