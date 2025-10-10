const express = require('express');
const { Pool } = require('pg');
const { createSuccessResponse, createErrorResponse } = require('../utils/responses');
const config = require('../config/config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: config.database.url });

/**
 * @route POST /api/v1/bugs
 * @desc Submit a bug report
 * @access Public (authentication optional)
 */
router.post('/', async (req, res) => {
    try {
        const {
            title,
            type,
            priority,
            steps,
            description,
            additional,
            systemInfo,
            userInfo
        } = req.body;

        // Validate required fields
        if (!title || !description) {
            return createErrorResponse(res, 400, 'Title and description are required', 'missing_fields');
        }

        // Extract user information if authenticated
        let userId = null;
        let userEmail = null;
        
        if (req.headers.authorization) {
            try {
                const authenticateResult = await authenticateToken(req, res, () => {});
                if (req.user) {
                    userId = req.user.id;
                    userEmail = req.user.email;
                }
            } catch (error) {
                // Authentication failed, continue as anonymous
                config.logger.warn('Failed to authenticate user for bug report', error);
            }
        }

        // Use userInfo if provided, otherwise use authenticated user data
        const finalUserInfo = userInfo || {
            id: userId,
            email: userEmail,
            anonymous: !userId
        };

        // Insert bug report into database
        const query = `
            INSERT INTO bug_reports (
                title, 
                type, 
                priority, 
                steps_to_reproduce, 
                description, 
                additional_info,
                system_info,
                user_info,
                user_id,
                status,
                created_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, title, status, created_at
        `;

        const values = [
            title,
            type || 'other',
            priority || 'medium',
            steps || null,
            description,
            additional || null,
            JSON.stringify(systemInfo || {}),
            JSON.stringify(finalUserInfo),
            userId,
            'open',
            new Date()
        ];

        const result = await pool.query(query, values);
        const bugReport = result.rows[0];

        config.logger.info(`Bug report submitted: ${bugReport.id} - ${title}`, 'BUG_REPORT');

        return createSuccessResponse(res, 201, 'Bug report submitted successfully', {
            id: bugReport.id,
            title: bugReport.title,
            status: bugReport.status,
            createdAt: bugReport.created_at
        });

    } catch (error) {
        config.logger.error('Error submitting bug report', error, 'BUG_REPORT');
        return createErrorResponse(res, 500, 'Failed to submit bug report', 'server_error');
    }
});

/**
 * @route GET /api/v1/bugs
 * @desc Get bug reports (admin only)
 * @access Private - Admin
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return createErrorResponse(res, 403, 'Access denied. Admin role required.', 'access_denied');
        }

        const { page = 1, limit = 50, status, priority, type } = req.query;
        const offset = (page - 1) * limit;

        // Build query with filters
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            whereClause += ` AND status = $${paramCount}`;
            queryParams.push(status);
        }

        if (priority) {
            paramCount++;
            whereClause += ` AND priority = $${paramCount}`;
            queryParams.push(priority);
        }

        if (type) {
            paramCount++;
            whereClause += ` AND type = $${paramCount}`;
            queryParams.push(type);
        }

        // Add pagination params
        paramCount++;
        const limitParam = paramCount;
        queryParams.push(parseInt(limit));

        paramCount++;
        const offsetParam = paramCount;
        queryParams.push(parseInt(offset));

        const query = `
            SELECT 
                id,
                title,
                type,
                priority,
                status,
                description,
                steps_to_reproduce,
                additional_info,
                system_info,
                user_info,
                user_id,
                created_at,
                updated_at
            FROM bug_reports 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${limitParam} OFFSET $${offsetParam}
        `;

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM bug_reports 
            ${whereClause}
        `;

        const [bugsResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        return createSuccessResponse(res, 200, 'Bug reports retrieved successfully', {
            bugs: bugsResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        config.logger.error('Error retrieving bug reports', error, 'BUG_REPORT');
        return createErrorResponse(res, 500, 'Failed to retrieve bug reports', 'server_error');
    }
});

/**
 * @route PATCH /api/v1/bugs/:id/status
 * @desc Update bug report status (admin only)
 * @access Private - Admin
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return createErrorResponse(res, 403, 'Access denied. Admin role required.', 'access_denied');
        }

        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'duplicate'];
        if (!status || !validStatuses.includes(status)) {
            return createErrorResponse(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 'invalid_status');
        }

        const query = `
            UPDATE bug_reports 
            SET status = $1, updated_at = $2
            WHERE id = $3
            RETURNING id, title, status, updated_at
        `;

        const result = await pool.query(query, [status, new Date(), id]);

        if (result.rows.length === 0) {
            return createErrorResponse(res, 404, 'Bug report not found', 'not_found');
        }

        const updatedBug = result.rows[0];

        config.logger.info(`Bug report status updated: ${id} -> ${status}`, 'BUG_REPORT');

        return createSuccessResponse(res, 200, 'Bug report status updated successfully', {
            id: updatedBug.id,
            title: updatedBug.title,
            status: updatedBug.status,
            updatedAt: updatedBug.updated_at
        });

    } catch (error) {
        config.logger.error('Error updating bug report status', error, 'BUG_REPORT');
        return createErrorResponse(res, 500, 'Failed to update bug report status', 'server_error');
    }
});

/**
 * @route GET /api/v1/bugs/stats
 * @desc Get bug report statistics (admin only)
 * @access Private - Admin
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return createErrorResponse(res, 403, 'Access denied. Admin role required.', 'access_denied');
        }

        const statsQuery = `
            SELECT 
                status,
                priority,
                type,
                COUNT(*) as count
            FROM bug_reports 
            GROUP BY status, priority, type
            ORDER BY status, priority, type
        `;

        const totalQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_week,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_month
            FROM bug_reports
        `;

        const [statsResult, totalResult] = await Promise.all([
            pool.query(statsQuery),
            pool.query(totalQuery)
        ]);

        // Group stats by category
        const statusStats = {};
        const priorityStats = {};
        const typeStats = {};

        statsResult.rows.forEach(row => {
            statusStats[row.status] = (statusStats[row.status] || 0) + parseInt(row.count);
            priorityStats[row.priority] = (priorityStats[row.priority] || 0) + parseInt(row.count);
            typeStats[row.type] = (typeStats[row.type] || 0) + parseInt(row.count);
        });

        const summary = totalResult.rows[0];

        return createSuccessResponse(res, 200, 'Bug report statistics retrieved successfully', {
            summary: {
                total: parseInt(summary.total),
                lastWeek: parseInt(summary.last_week),
                lastMonth: parseInt(summary.last_month)
            },
            byStatus: statusStats,
            byPriority: priorityStats,
            byType: typeStats
        });

    } catch (error) {
        config.logger.error('Error retrieving bug report statistics', error, 'BUG_REPORT');
        return createErrorResponse(res, 500, 'Failed to retrieve bug report statistics', 'server_error');
    }
});

module.exports = router;