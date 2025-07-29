const express = require('express');
const { requireAuth, createErrorResponse } = require('../middleware/auth');
const Application = require('../models/Application');
const config = require('../config/config');
const { dataExportSchemas, validateWithSchema } = require('../validation/schemas');

const router = express.Router();


/**
 * GET /api/v1/data-export/my-data
 * Export user's application data for GDPR compliance
 */
router.get('/my-data', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Data export request by user: ${req.user.id}`, 'DATA_EXPORT');
    
    // Validate query parameters
    const validation = validateWithSchema(req.query, dataExportSchemas.exportRequest);
    if (!validation.isValid) {
      config.logger.warn(`Data export validation failed: ${validation.error}`, 'DATA_EXPORT');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }
    const value = validation.value;

    try {
      // Get user's applications with full details
      const exportData = await Application.exportUserData(req.user.id, {
        includeHistory: value.includeHistory,
        dateFrom: value.dateFrom,
        dateTo: value.dateTo
      });

      // Add metadata about the export
      const exportResponse = {
        exportMetadata: {
          userId: req.user.id,
          exportDate: new Date().toISOString(),
          dataTypes: ['applications', 'application_history', 'user_activity'],
          format: value.format,
          totalRecords: exportData.applications.length,
          dateRange: {
            from: value.dateFrom || 'all-time',
            to: value.dateTo || 'present'
          },
          gdprCompliance: {
            rightsExercised: 'data_portability',
            legalBasis: 'article_20_gdpr',
            dataController: 'LocumTrueRate Platform'
          }
        },
        userData: exportData
      };

      // Handle different export formats
      if (value.format === 'csv') {
        const csv = convertToCSV(exportData);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="my_application_data_${req.user.id}_${new Date().toISOString().split('T')[0]}.csv"`);
        
        config.logger.info(`Data export completed (CSV) for user: ${req.user.id} - ${exportData.applications.length} records`, 'DATA_EXPORT');
        
        return res.send(csv);
      } else {
        // JSON format (default)
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="my_application_data_${req.user.id}_${new Date().toISOString().split('T')[0]}.json"`);
        
        config.logger.info(`Data export completed (JSON) for user: ${req.user.id} - ${exportData.applications.length} records`, 'DATA_EXPORT');
        
        return res.json(exportResponse);
      }

    } catch (exportError) {
      config.logger.error(`Data export failed for user ${req.user.id}:`, exportError, 'DATA_EXPORT');
      return createErrorResponse(res, 500, 'Failed to export user data', 'export_failed');
    }

  } catch (error) {
    config.logger.error('Data export error', error, 'DATA_EXPORT');
    return createErrorResponse(res, 500, 'Internal server error during data export', 'data_export_failed');
  }
});

/**
 * GET /api/v1/data-export/request-deletion
 * Generate deletion request information (GDPR Article 17 - Right to be forgotten)
 */
router.get('/request-deletion', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Data deletion request info by user: ${req.user.id}`, 'DATA_DELETION');
    
    // Get summary of user's data
    const userDataSummary = await Application.getUserDataSummary(req.user.id);
    
    const deletionInfo = {
      userId: req.user.id,
      requestDate: new Date().toISOString(),
      gdprRights: {
        article: 'Article 17 - Right to erasure (right to be forgotten)',
        description: 'You have the right to obtain erasure of personal data concerning you'
      },
      dataToBeDeleted: {
        applications: userDataSummary.totalApplications,
        applicationHistory: userDataSummary.totalStatusChanges,
        userActivity: userDataSummary.totalActivities,
        estimatedProcessingTime: '30 days',
        retentionExceptions: [
          'Legal compliance requirements',
          'Contract fulfillment obligations',
          'Accounting records (as required by law)'
        ]
      },
      nextSteps: [
        'Contact our data protection officer',
        'Provide identity verification',
        'Confirm deletion request in writing',
        'Allow up to 30 days for processing'
      ],
      contact: {
        email: 'privacy@locumtruerate.com',
        subject: `Data Deletion Request - User ID: ${req.user.id}`
      }
    };

    config.logger.info(`Deletion request info provided for user: ${req.user.id}`, 'DATA_DELETION');

    res.json(deletionInfo);

  } catch (error) {
    config.logger.error('Data deletion request error', error, 'DATA_DELETION');
    return createErrorResponse(res, 500, 'Internal server error during deletion request', 'deletion_request_failed');
  }
});

/**
 * GET /api/v1/data-export/privacy-summary
 * Get summary of user's data processing activities
 */
router.get('/privacy-summary', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Privacy summary request by user: ${req.user.id}`, 'PRIVACY_SUMMARY');
    
    const userDataSummary = await Application.getUserDataSummary(req.user.id);
    
    const privacySummary = {
      userId: req.user.id,
      generatedDate: new Date().toISOString(),
      dataProcessingSummary: {
        personalDataCollected: [
          'Job application data',
          'Cover letters and personal statements', 
          'Expected salary information',
          'Availability dates',
          'Application timestamps and status history'
        ],
        purposeOfProcessing: [
          'Job application management',
          'Matching with employment opportunities',
          'Communication with recruiters',
          'Service improvement and analytics'
        ],
        legalBasisForProcessing: [
          'Contract performance (job applications)',
          'Legitimate interests (service improvement)',
          'Consent (marketing communications)'
        ],
        dataRetentionPeriod: '3 years after last activity or as required by law',
        thirdPartySharing: [
          'Recruiters (for job matching purposes only)',
          'Service providers (hosting, analytics)',
          'Legal authorities (when required by law)'
        ]
      },
      yourRights: {
        access: 'Request access to your personal data',
        rectification: 'Request correction of inaccurate data',
        erasure: 'Request deletion of your data',
        portability: 'Request data in machine-readable format',
        restriction: 'Request restriction of processing',
        objection: 'Object to processing based on legitimate interests',
        withdrawConsent: 'Withdraw consent for marketing communications'
      },
      dataStatistics: userDataSummary
    };

    config.logger.info(`Privacy summary provided for user: ${req.user.id}`, 'PRIVACY_SUMMARY');

    res.json(privacySummary);

  } catch (error) {
    config.logger.error('Privacy summary error', error, 'PRIVACY_SUMMARY');
    return createErrorResponse(res, 500, 'Internal server error during privacy summary', 'privacy_summary_failed');
  }
});

/**
 * Convert application data to CSV format
 */
function convertToCSV(exportData) {
  const headers = [
    'Application ID',
    'Job ID', 
    'Status',
    'Cover Letter Preview',
    'Expected Rate',
    'Available Date',
    'Applied Date',
    'Last Updated',
    'Notes'
  ];

  const csvRows = [headers.join(',')];

  exportData.applications.forEach(app => {
    const row = [
      app.id,
      app.job_id,
      app.status,
      `"${app.cover_letter ? app.cover_letter.substring(0, 100).replace(/"/g, '""') + (app.cover_letter.length > 100 ? '...' : '') : ''}"`,
      app.expected_rate || '',
      app.available_date || '',
      app.created_at,
      app.updated_at,
      `"${app.notes ? app.notes.replace(/"/g, '""') : ''}"`
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

module.exports = router;