const express = require('express');
const Application = require('../models/Application');
const { requireAuth, createErrorResponse } = require('../middleware/auth');
const { applicationSchemas, validateWithSchema } = require('../validation/schemas');
const config = require('../config/config');

const router = express.Router();

// =============================================================================
// APPLICATION CRUD ENDPOINTS
// =============================================================================

/**
 * POST /api/v1/applications
 * Create a new job application
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        // Validate input data
        const validation = validateWithSchema(req.body, applicationSchemas.create);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error', {
                details: validation.details
            });
        }

        // Add authenticated user ID to application data
        const applicationData = {
            ...validation.value,
            user_id: req.user.id
        };

        // Check if user has already applied to this job
        const hasApplied = await Application.hasUserApplied(req.user.id, applicationData.job_id);
        if (hasApplied) {
            return createErrorResponse(res, 400, 'You have already applied to this job', 'duplicate_application');
        }

        // Create the application
        const application = await Application.create(applicationData);

        config.logger.info(`Application created: ${application.id} by user ${req.user.id} for job ${applicationData.job_id}`, 'APPLICATION_CREATE');

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });

    } catch (error) {
        config.logger.error('Error creating application', error, 'APPLICATION_CREATE');
        console.error('Application creation error details:', error.message, error.stack);
        return createErrorResponse(res, 500, 'Failed to create application', 'application_creation_failed', {
            error_detail: error.message
        });
    }
});

/**
 * GET /api/v1/applications
 * Get all applications with filtering and pagination
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        // Validate query parameters
        const validation = validateWithSchema(req.query, applicationSchemas.query);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        // Get applications based on user role
        const options = {
            ...validation.value,
            user_id: req.user.role === 'admin' ? validation.value.user_id : req.user.id
        };

        const result = await Application.getAll(options);

        res.json({
            success: true,
            data: result.applications,
            pagination: result.pagination
        });

    } catch (error) {
        config.logger.error('Error fetching applications', error, 'APPLICATION_FETCH');
        return createErrorResponse(res, 500, 'Failed to fetch applications', 'application_fetch_failed');
    }
});

/**
 * GET /api/v1/applications/stats
 * Get application statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
    try {
        // Validate query parameters
        const validation = validateWithSchema(req.query, applicationSchemas.statisticsQuery);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        // Only allow users to see their own stats unless they're admin
        const userId = req.user.role === 'admin' ? validation.value.user_id : req.user.id;
        
        const stats = await Application.getStatistics(userId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        config.logger.error('Error fetching application statistics', error, 'APPLICATION_STATS');
        return createErrorResponse(res, 500, 'Failed to fetch statistics', 'stats_fetch_failed');
    }
});

/**
 * GET /api/v1/applications/by-status/:status
 * Get applications by status
 */
router.get('/by-status/:status', requireAuth, async (req, res) => {
    try {
        const { status } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const applications = await Application.getByStatus(status, { limit, offset });

        res.json({
            success: true,
            data: applications
        });

    } catch (error) {
        config.logger.error('Error fetching applications by status', error, 'APPLICATION_BY_STATUS');
        return createErrorResponse(res, 500, 'Failed to fetch applications', 'applications_fetch_failed');
    }
});

/**
 * GET /api/v1/applications/recent
 * Get recent applications
 */
router.get('/recent', requireAuth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const limit = parseInt(req.query.limit) || 20;

        const applications = await Application.getRecent(days, limit);

        res.json({
            success: true,
            data: applications
        });

    } catch (error) {
        config.logger.error('Error fetching recent applications', error, 'APPLICATION_RECENT');
        return createErrorResponse(res, 500, 'Failed to fetch recent applications', 'recent_fetch_failed');
    }
});

/**
 * POST /api/v1/applications/search
 * Advanced search for applications
 */
router.post('/search', requireAuth, async (req, res) => {
    try {
        // Validate search parameters
        const validation = validateWithSchema(req.body, applicationSchemas.advancedSearch);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        // Restrict search to user's own applications unless admin
        const searchOptions = {
            ...validation.value,
            user_id: req.user.role === 'admin' ? validation.value.user_id : req.user.id
        };

        const result = await Application.getAll(searchOptions);

        res.json({
            success: true,
            data: result.applications,
            pagination: result.pagination
        });

    } catch (error) {
        config.logger.error('Error performing application search', error, 'APPLICATION_SEARCH');
        return createErrorResponse(res, 500, 'Failed to search applications', 'search_failed');
    }
});

/**
 * GET /api/v1/applications/:id
 * Get a specific application by ID with full details
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id);
        if (isNaN(applicationId)) {
            return createErrorResponse(res, 400, 'Invalid application ID', 'invalid_id');
        }

        const application = await Application.getById(applicationId);
        
        if (!application) {
            return createErrorResponse(res, 404, 'Application not found', 'application_not_found');
        }

        // Check authorization - users can only see their own applications, admins can see all
        if (req.user.role !== 'admin' && application.user_id !== req.user.id) {
            return createErrorResponse(res, 403, 'Unauthorized to view this application', 'unauthorized');
        }

        res.json({
            success: true,
            data: application
        });

    } catch (error) {
        config.logger.error('Error fetching application', error, 'APPLICATION_FETCH');
        return createErrorResponse(res, 500, 'Failed to fetch application', 'application_fetch_failed');
    }
});

/**
 * PUT /api/v1/applications/:id
 * Update an existing application
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id);
        if (isNaN(applicationId)) {
            return createErrorResponse(res, 400, 'Invalid application ID', 'invalid_id');
        }

        // Validate input data
        const validation = validateWithSchema(req.body, applicationSchemas.update);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error', {
                details: validation.details
            });
        }

        // Update the application
        const updatedApplication = await Application.update(applicationId, validation.value, req.user.id);
        
        if (!updatedApplication) {
            return createErrorResponse(res, 404, 'Application not found', 'application_not_found');
        }

        config.logger.info(`Application updated: ${applicationId} by user ${req.user.id}`, 'APPLICATION_UPDATE');

        res.json({
            success: true,
            message: 'Application updated successfully',
            data: updatedApplication
        });

    } catch (error) {
        config.logger.error('Error updating application', error, 'APPLICATION_UPDATE');
        return createErrorResponse(res, 500, 'Failed to update application', 'application_update_failed');
    }
});

/**
 * DELETE /api/v1/applications/:id
 * Soft delete an application
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id);
        if (isNaN(applicationId)) {
            return createErrorResponse(res, 400, 'Invalid application ID', 'invalid_id');
        }

        const success = await Application.delete(applicationId);
        
        if (!success) {
            return createErrorResponse(res, 404, 'Application not found', 'application_not_found');
        }

        config.logger.info(`Application deleted: ${applicationId} by user ${req.user.id}`, 'APPLICATION_DELETE');

        res.json({
            success: true,
            message: 'Application deleted successfully'
        });

    } catch (error) {
        config.logger.error('Error deleting application', error, 'APPLICATION_DELETE');
        return createErrorResponse(res, 500, 'Failed to delete application', 'application_delete_failed');
    }
});

// =============================================================================
// APPLICATION STATUS MANAGEMENT
// =============================================================================

/**
 * PATCH /api/v1/applications/:id/status
 * Update application status
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id);
        if (isNaN(applicationId)) {
            return createErrorResponse(res, 400, 'Invalid application ID', 'invalid_id');
        }

        // Validate status update data
        const validation = validateWithSchema(req.body, applicationSchemas.statusUpdate);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        const updateData = {
            application_status: validation.value.application_status,
            status_change_reason: validation.value.status_change_reason,
            status_notes: validation.value.status_notes
        };

        const updatedApplication = await Application.update(applicationId, updateData, req.user.id);
        
        if (!updatedApplication) {
            return createErrorResponse(res, 404, 'Application not found', 'application_not_found');
        }

        config.logger.info(`Application status updated: ${applicationId} to ${updateData.application_status} by user ${req.user.id}`, 'APPLICATION_STATUS_UPDATE');

        res.json({
            success: true,
            message: 'Application status updated successfully',
            data: updatedApplication
        });

    } catch (error) {
        config.logger.error('Error updating application status', error, 'APPLICATION_STATUS_UPDATE');
        return createErrorResponse(res, 500, 'Failed to update application status', 'status_update_failed');
    }
});

// =============================================================================
// DOCUMENT MANAGEMENT
// =============================================================================

/**
 * POST /api/v1/applications/:id/documents
 * Add a document to an application
 */
router.post('/:id/documents', requireAuth, async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id);
        if (isNaN(applicationId)) {
            return createErrorResponse(res, 400, 'Invalid application ID', 'invalid_id');
        }

        // Validate document data
        const validation = validateWithSchema(req.body, applicationSchemas.addDocument);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        const document = await Application.addDocument(applicationId, validation.value);

        config.logger.info(`Document added to application: ${applicationId} by user ${req.user.id}`, 'APPLICATION_DOCUMENT_ADD');

        res.status(201).json({
            success: true,
            message: 'Document added successfully',
            data: document
        });

    } catch (error) {
        config.logger.error('Error adding document to application', error, 'APPLICATION_DOCUMENT_ADD');
        return createErrorResponse(res, 500, 'Failed to add document', 'document_add_failed');
    }
});

// =============================================================================
// COMMUNICATION TRACKING
// =============================================================================

/**
 * POST /api/v1/applications/:id/communications
 * Add a communication record to an application
 */
router.post('/:id/communications', requireAuth, async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id);
        if (isNaN(applicationId)) {
            return createErrorResponse(res, 400, 'Invalid application ID', 'invalid_id');
        }

        // Validate communication data
        const validation = validateWithSchema(req.body, applicationSchemas.addCommunication);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        const communicationData = {
            ...validation.value,
            from_user_id: req.user.id
        };

        const communication = await Application.addCommunication(applicationId, communicationData);

        config.logger.info(`Communication added to application: ${applicationId} by user ${req.user.id}`, 'APPLICATION_COMMUNICATION_ADD');

        res.status(201).json({
            success: true,
            message: 'Communication recorded successfully',
            data: communication
        });

    } catch (error) {
        config.logger.error('Error adding communication to application', error, 'APPLICATION_COMMUNICATION_ADD');
        return createErrorResponse(res, 500, 'Failed to record communication', 'communication_add_failed');
    }
});

// =============================================================================
// REMINDER MANAGEMENT
// =============================================================================

/**
 * POST /api/v1/applications/:id/reminders
 * Add a reminder for an application
 */
router.post('/:id/reminders', requireAuth, async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id);
        if (isNaN(applicationId)) {
            return createErrorResponse(res, 400, 'Invalid application ID', 'invalid_id');
        }

        // Validate reminder data
        const validation = validateWithSchema(req.body, applicationSchemas.addReminder);
        if (!validation.isValid) {
            return createErrorResponse(res, 400, validation.error, 'validation_error');
        }

        const reminder = await Application.addReminder(applicationId, req.user.id, validation.value);

        config.logger.info(`Reminder added to application: ${applicationId} by user ${req.user.id}`, 'APPLICATION_REMINDER_ADD');

        res.status(201).json({
            success: true,
            message: 'Reminder created successfully',
            data: reminder
        });

    } catch (error) {
        config.logger.error('Error adding reminder to application', error, 'APPLICATION_REMINDER_ADD');
        return createErrorResponse(res, 500, 'Failed to create reminder', 'reminder_add_failed');
    }
});

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

/**
 * POST /api/v1/applications/archive-old
 * Archive old applications (admin only)
 */
router.post('/archive-old', requireAuth, async (req, res) => {
    try {
        // Check admin role
        if (req.user.role !== 'admin') {
            return createErrorResponse(res, 403, 'Admin access required', 'unauthorized');
        }

        const days = parseInt(req.body.days) || 365;
        const archivedCount = await Application.archiveOld(days);

        config.logger.info(`Archived ${archivedCount} old applications (older than ${days} days) by admin ${req.user.id}`, 'APPLICATION_ARCHIVE');

        res.json({
            success: true,
            message: `Successfully archived ${archivedCount} old applications`,
            data: { archived_count: archivedCount, days }
        });

    } catch (error) {
        config.logger.error('Error archiving old applications', error, 'APPLICATION_ARCHIVE');
        return createErrorResponse(res, 500, 'Failed to archive applications', 'archive_failed');
    }
});

module.exports = router;