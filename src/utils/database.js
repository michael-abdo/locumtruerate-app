/**
 * Centralized Database Query Utilities
 * 
 * This module provides reusable database query patterns to eliminate
 * duplication across model files and ensure consistent data handling.
 */

const { pool } = require('../db/connection');

/**
 * Build a standardized WHERE clause from conditions array
 * @param {Array} conditions - Array of condition strings
 * @returns {string} Formatted WHERE clause
 */
const buildWhereClause = (conditions) => {
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
};

/**
 * Build pagination LIMIT and OFFSET clause
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Object with offset, limit, and SQL clause
 */
const buildPaginationClause = (page, limit) => {
  const offset = (page - 1) * limit;
  return {
    offset,
    limit,
    clause: `LIMIT ${limit} OFFSET ${offset}`
  };
};

/**
 * Build ORDER BY clause with validation
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - ASC or DESC
 * @param {Array} validFields - Array of valid sort fields
 * @param {string} defaultField - Default sort field
 * @returns {string} ORDER BY clause
 */
const buildOrderClause = (sortBy, sortOrder, validFields, defaultField = 'created_at') => {
  const field = validFields.includes(sortBy) ? sortBy : defaultField;
  const order = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
  return `ORDER BY ${field} ${order}`;
};

/**
 * Execute a paginated query with consistent structure
 * @param {string} baseQuery - Base SQL query without pagination
 * @param {string} countQuery - Count query for total items
 * @param {Array} queryParams - Parameters for the queries
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Result with items and pagination metadata
 */
const executePaginatedQuery = async (baseQuery, countQuery, queryParams, pagination) => {
  const { page = 1, limit = 20, sortBy, sortOrder, validSortFields } = pagination;
  
  // Get total count
  const countResult = await pool.query(countQuery, queryParams);
  const totalItems = parseInt(countResult.rows[0].count);
  
  // Calculate pagination
  const totalPages = Math.ceil(totalItems / limit);
  const { offset, clause: paginationClause } = buildPaginationClause(page, limit);
  
  // Build order clause if sort fields provided
  let orderClause = '';
  if (validSortFields) {
    orderClause = buildOrderClause(sortBy, sortOrder, validSortFields);
  }
  
  // Execute main query with pagination
  const finalQuery = `${baseQuery} ${orderClause} ${paginationClause}`;
  const result = await pool.query(finalQuery, [...queryParams, limit, offset]);
  
  return {
    items: result.rows,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Build search conditions for ILIKE queries
 * @param {string} searchTerm - Search term
 * @param {Array} searchFields - Fields to search in
 * @param {number} paramIndex - Starting parameter index
 * @returns {Object} Search condition and updated param index
 */
const buildSearchCondition = (searchTerm, searchFields, paramIndex) => {
  if (!searchTerm || !searchFields.length) {
    return { condition: '', paramIndex, values: [] };
  }
  
  const conditions = searchFields.map(field => `${field} ILIKE $${paramIndex}`);
  const condition = `(${conditions.join(' OR ')})`;
  
  return {
    condition,
    paramIndex: paramIndex + 1,
    values: [`%${searchTerm.trim()}%`]
  };
};

/**
 * Build array filter conditions (IN clauses)
 * @param {Array} values - Array of values to filter by
 * @param {string} field - Database field name
 * @param {number} paramIndex - Starting parameter index
 * @returns {Object} Filter condition and updated param index
 */
const buildArrayFilterCondition = (values, field, paramIndex) => {
  if (!values || !values.length) {
    return { condition: '', paramIndex, values: [] };
  }
  
  const placeholders = values.map(() => `$${paramIndex++}`).join(',');
  const condition = `${field} IN (${placeholders})`;
  
  return {
    condition,
    paramIndex,
    values
  };
};

/**
 * Build range filter conditions (BETWEEN or >= / <=)
 * @param {number} minValue - Minimum value
 * @param {number} maxValue - Maximum value
 * @param {string} field - Database field name
 * @param {number} paramIndex - Starting parameter index
 * @returns {Object} Range condition and updated param index
 */
const buildRangeFilterCondition = (minValue, maxValue, field, paramIndex) => {
  const conditions = [];
  const values = [];
  
  if (minValue !== undefined && minValue !== null) {
    conditions.push(`${field} >= $${paramIndex++}`);
    values.push(minValue);
  }
  
  if (maxValue !== undefined && maxValue !== null) {
    conditions.push(`${field} <= $${paramIndex++}`);
    values.push(maxValue);
  }
  
  return {
    condition: conditions.join(' AND '),
    paramIndex,
    values
  };
};

/**
 * Safely execute a database transaction
 * @param {Function} callback - Transaction callback function
 * @returns {Promise<any>} Transaction result
 */
const executeTransaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  buildWhereClause,
  buildPaginationClause,
  buildOrderClause,
  executePaginatedQuery,
  buildSearchCondition,
  buildArrayFilterCondition,
  buildRangeFilterCondition,
  executeTransaction
};