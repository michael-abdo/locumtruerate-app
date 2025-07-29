const express = require('express');
const Calculation = require('../models/Calculation');
const { requireAuth, createErrorResponse } = require('../middleware/auth');
const config = require('../config/config');
const { calculationSchemas, validateWithSchema } = require('../validation/schemas');
const { sendSuccessResponse } = require('../utils/responses');

const router = express.Router();

/**
 * POST /api/calculations
 * Create a new calculation
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    config.logger.info('Creating new calculation', 'CALCULATIONS_CREATE');
    
    // Validate input
    const validation = validateWithSchema(req.body, calculationSchemas.create);
    if (!validation.isValid) {
      config.logger.warn(`Calculation creation validation failed: ${validation.error}`, 'CALCULATIONS_CREATE');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }

    const calculationData = {
      ...validation.value,
      user_id: req.user.id
    };

    const calculation = await Calculation.create(calculationData);
    config.logger.info(`Calculation created successfully: ${calculation.id}`, 'CALCULATIONS_CREATE');

    return sendSuccessResponse(res, {
      message: 'Calculation created successfully',
      data: calculation
    }, 201);

  } catch (error) {
    config.logger.error(`Error creating calculation: ${error.message}`, 'CALCULATIONS_CREATE');
    return createErrorResponse(res, 500, 'Internal server error', 'server_error');
  }
});

/**
 * GET /api/calculations
 * Get user's calculations with filtering and pagination
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    config.logger.info('Fetching user calculations', 'CALCULATIONS_LIST');
    
    // Validate query parameters
    const validation = validateWithSchema(req.query, calculationSchemas.query);
    if (!validation.isValid) {
      config.logger.warn(`Calculation query validation failed: ${validation.error}`, 'CALCULATIONS_LIST');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }

    const options = {
      type: validation.value.calculation_type,
      favorites: validation.value.favorites,
      archived: validation.value.archived,
      limit: validation.value.limit,
      offset: (validation.value.page - 1) * validation.value.limit
    };

    const calculations = await Calculation.findByUserId(req.user.id, options);
    
    // Get user stats for additional context
    const stats = await Calculation.getStats(req.user.id);

    config.logger.info(`Retrieved ${calculations.length} calculations for user ${req.user.id}`, 'CALCULATIONS_LIST');

    return sendSuccessResponse(res, {
      message: 'Calculations retrieved successfully',
      data: calculations,
      meta: {
        page: validation.value.page,
        limit: validation.value.limit,
        stats: stats
      }
    });

  } catch (error) {
    config.logger.error(`Error fetching calculations: ${error.message}`, 'CALCULATIONS_LIST');
    return createErrorResponse(res, 500, 'Internal server error', 'server_error');
  }
});

/**
 * GET /api/calculations/:id
 * Get a specific calculation by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const calculationId = parseInt(req.params.id);
    
    if (isNaN(calculationId)) {
      return createErrorResponse(res, 400, 'Invalid calculation ID', 'invalid_id');
    }

    config.logger.info(`Fetching calculation ${calculationId}`, 'CALCULATIONS_GET');

    const calculation = await Calculation.findById(calculationId, req.user.id);
    
    if (!calculation) {
      config.logger.warn(`Calculation not found: ${calculationId}`, 'CALCULATIONS_GET');
      return createErrorResponse(res, 404, 'Calculation not found', 'not_found');
    }

    config.logger.info(`Retrieved calculation ${calculationId}`, 'CALCULATIONS_GET');

    return sendSuccessResponse(res, {
      message: 'Calculation retrieved successfully',
      data: calculation
    });

  } catch (error) {
    config.logger.error(`Error fetching calculation: ${error.message}`, 'CALCULATIONS_GET');
    return createErrorResponse(res, 500, 'Internal server error', 'server_error');
  }
});

/**
 * PUT /api/calculations/:id
 * Update a calculation
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const calculationId = parseInt(req.params.id);
    
    if (isNaN(calculationId)) {
      return createErrorResponse(res, 400, 'Invalid calculation ID', 'invalid_id');
    }

    config.logger.info(`Updating calculation ${calculationId}`, 'CALCULATIONS_UPDATE');

    // Validate input
    const validation = validateWithSchema(req.body, calculationSchemas.update);
    if (!validation.isValid) {
      config.logger.warn(`Calculation update validation failed: ${validation.error}`, 'CALCULATIONS_UPDATE');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }

    const updatedCalculation = await Calculation.update(calculationId, req.user.id, validation.value);
    
    if (!updatedCalculation) {
      config.logger.warn(`Calculation not found for update: ${calculationId}`, 'CALCULATIONS_UPDATE');
      return createErrorResponse(res, 404, 'Calculation not found', 'not_found');
    }

    config.logger.info(`Calculation updated successfully: ${calculationId}`, 'CALCULATIONS_UPDATE');

    return sendSuccessResponse(res, {
      message: 'Calculation updated successfully',
      data: updatedCalculation
    });

  } catch (error) {
    config.logger.error(`Error updating calculation: ${error.message}`, 'CALCULATIONS_UPDATE');
    return createErrorResponse(res, 500, 'Internal server error', 'server_error');
  }
});

/**
 * DELETE /api/calculations/:id
 * Delete a calculation
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const calculationId = parseInt(req.params.id);
    
    if (isNaN(calculationId)) {
      return createErrorResponse(res, 400, 'Invalid calculation ID', 'invalid_id');
    }

    config.logger.info(`Deleting calculation ${calculationId}`, 'CALCULATIONS_DELETE');

    const deleted = await Calculation.delete(calculationId, req.user.id);
    
    if (!deleted) {
      config.logger.warn(`Calculation not found for deletion: ${calculationId}`, 'CALCULATIONS_DELETE');
      return createErrorResponse(res, 404, 'Calculation not found', 'not_found');
    }

    config.logger.info(`Calculation deleted successfully: ${calculationId}`, 'CALCULATIONS_DELETE');

    return sendSuccessResponse(res, {
      message: 'Calculation deleted successfully'
    });

  } catch (error) {
    config.logger.error(`Error deleting calculation: ${error.message}`, 'CALCULATIONS_DELETE');
    return createErrorResponse(res, 500, 'Internal server error', 'server_error');
  }
});

/**
 * POST /api/calculations/:id/duplicate
 * Duplicate an existing calculation
 */
router.post('/:id/duplicate', requireAuth, async (req, res) => {
  try {
    const calculationId = parseInt(req.params.id);
    
    if (isNaN(calculationId)) {
      return createErrorResponse(res, 400, 'Invalid calculation ID', 'invalid_id');
    }

    config.logger.info(`Duplicating calculation ${calculationId}`, 'CALCULATIONS_DUPLICATE');

    // Validate input (optional title)
    const validation = validateWithSchema(req.body, calculationSchemas.duplicate);
    if (!validation.isValid) {
      config.logger.warn(`Calculation duplicate validation failed: ${validation.error}`, 'CALCULATIONS_DUPLICATE');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }

    const duplicatedCalculation = await Calculation.duplicate(
      calculationId, 
      req.user.id, 
      validation.value.title
    );
    
    if (!duplicatedCalculation) {
      config.logger.warn(`Calculation not found for duplication: ${calculationId}`, 'CALCULATIONS_DUPLICATE');
      return createErrorResponse(res, 404, 'Calculation not found', 'not_found');
    }

    config.logger.info(`Calculation duplicated successfully: ${calculationId} -> ${duplicatedCalculation.id}`, 'CALCULATIONS_DUPLICATE');

    return sendSuccessResponse(res, {
      message: 'Calculation duplicated successfully',
      data: duplicatedCalculation
    }, 201);

  } catch (error) {
    config.logger.error(`Error duplicating calculation: ${error.message}`, 'CALCULATIONS_DUPLICATE');
    return createErrorResponse(res, 500, 'Internal server error', 'server_error');
  }
});

/**
 * PATCH /api/calculations/:id/favorite
 * Toggle favorite status of a calculation
 */
router.patch('/:id/favorite', requireAuth, async (req, res) => {
  try {
    const calculationId = parseInt(req.params.id);
    
    if (isNaN(calculationId)) {
      return createErrorResponse(res, 400, 'Invalid calculation ID', 'invalid_id');
    }

    config.logger.info(`Toggling favorite for calculation ${calculationId}`, 'CALCULATIONS_FAVORITE');

    const updatedCalculation = await Calculation.toggleFavorite(calculationId, req.user.id);
    
    if (!updatedCalculation) {
      config.logger.warn(`Calculation not found for favorite toggle: ${calculationId}`, 'CALCULATIONS_FAVORITE');
      return createErrorResponse(res, 404, 'Calculation not found', 'not_found');
    }

    config.logger.info(`Calculation favorite status toggled: ${calculationId}`, 'CALCULATIONS_FAVORITE');

    return sendSuccessResponse(res, {
      message: `Calculation ${updatedCalculation.is_favorite ? 'added to' : 'removed from'} favorites`,
      data: updatedCalculation
    });

  } catch (error) {
    config.logger.error(`Error toggling favorite: ${error.message}`, 'CALCULATIONS_FAVORITE');
    return createErrorResponse(res, 500, 'Internal server error', 'server_error');
  }
});

/**
 * PATCH /api/calculations/:id/archive
 * Archive or unarchive a calculation
 */
router.patch('/:id/archive', requireAuth, async (req, res) => {
  try {
    const calculationId = parseInt(req.params.id);
    
    if (isNaN(calculationId)) {
      return createErrorResponse(res, 400, 'Invalid calculation ID', 'invalid_id');
    }

    config.logger.info(`Setting archive status for calculation ${calculationId}`, 'CALCULATIONS_ARCHIVE');

    // Validate input
    const validation = validateWithSchema(req.body, calculationSchemas.setArchived);
    if (!validation.isValid) {
      config.logger.warn(`Calculation archive validation failed: ${validation.error}`, 'CALCULATIONS_ARCHIVE');
      return createErrorResponse(res, 400, validation.error, 'validation_error');
    }

    const updatedCalculation = await Calculation.setArchived(
      calculationId, 
      req.user.id, 
      validation.value.archived
    );
    
    if (!updatedCalculation) {
      config.logger.warn(`Calculation not found for archive: ${calculationId}`, 'CALCULATIONS_ARCHIVE');
      return createErrorResponse(res, 404, 'Calculation not found', 'not_found');
    }

    config.logger.info(`Calculation archive status updated: ${calculationId}`, 'CALCULATIONS_ARCHIVE');

    return sendSuccessResponse(res, {
      message: `Calculation ${updatedCalculation.is_archived ? 'archived' : 'unarchived'} successfully`,
      data: updatedCalculation
    });

  } catch (error) {
    config.logger.error(`Error setting archive status: ${error.message}`, 'CALCULATIONS_ARCHIVE');
    return createErrorResponse(res, 500, 'Internal server error', 'server_error');
  }
});

/**
 * GET /api/calculations/stats
 * Get calculation statistics for the user
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    config.logger.info(`Fetching calculation stats for user ${req.user.id}`, 'CALCULATIONS_STATS');

    const stats = await Calculation.getStats(req.user.id);

    config.logger.info(`Retrieved calculation stats for user ${req.user.id}`, 'CALCULATIONS_STATS');

    return sendSuccessResponse(res, {
      message: 'Calculation statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    config.logger.error(`Error fetching calculation stats: ${error.message}`, 'CALCULATIONS_STATS');
    return createErrorResponse(res, 500, 'Internal server error', 'server_error');
  }
});

module.exports = router;