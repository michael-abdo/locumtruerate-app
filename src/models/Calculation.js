const { pool } = require('../db/connection');
const { executeTransaction } = require('../utils/database');

class Calculation {
  /**
   * Create a new calculation
   * @param {Object} calculationData - Calculation data object
   * @param {number} calculationData.user_id - User ID
   * @param {string} calculationData.calculation_type - Type: 'paycheck' or 'contract'
   * @param {string} calculationData.title - Optional title for the calculation
   * @param {number} calculationData.hourly_rate - Primary hourly rate
   * @param {Object} calculationData.data - Additional calculation fields
   * @returns {Promise<Object>} Created calculation
   */
  static async create(calculationData) {
    const {
      user_id,
      calculation_type,
      title,
      description,
      hourly_rate,
      hours_per_week,
      regular_hours,
      regular_rate,
      overtime_hours,
      overtime_rate,
      call_hours,
      call_rate,
      callback_hours,
      callback_rate,
      pay_period,
      contract_weeks,
      contract_type,
      housing_stipend,
      meal_stipend,
      travel_reimbursement,
      mileage_reimbursement,
      other_stipends,
      tax_state,
      work_state,
      filing_status,
      custom_tax_rate,
      gross_pay,
      federal_tax,
      state_tax,
      fica_tax,
      net_pay,
      total_stipends,
      total_contract_value,
      true_hourly_rate,
      annual_equivalent,
      notes
    } = calculationData;

    const query = `
      INSERT INTO calculations (
        user_id, calculation_type, title, description, hourly_rate, hours_per_week,
        regular_hours, regular_rate, overtime_hours, overtime_rate, call_hours, call_rate,
        callback_hours, callback_rate, pay_period, contract_weeks, contract_type,
        housing_stipend, meal_stipend, travel_reimbursement, mileage_reimbursement, other_stipends,
        tax_state, work_state, filing_status, custom_tax_rate,
        gross_pay, federal_tax, state_tax, fica_tax, net_pay, total_stipends,
        total_contract_value, true_hourly_rate, annual_equivalent, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        $33, $34, $35, $36
      )
      RETURNING *
    `;

    const values = [
      user_id, calculation_type, title, description, hourly_rate, hours_per_week,
      regular_hours, regular_rate, overtime_hours, overtime_rate, call_hours, call_rate,
      callback_hours, callback_rate, pay_period, contract_weeks, contract_type,
      housing_stipend, meal_stipend, travel_reimbursement, mileage_reimbursement, other_stipends,
      tax_state, work_state, filing_status, custom_tax_rate,
      gross_pay, federal_tax, state_tax, fica_tax, net_pay, total_stipends,
      total_contract_value, true_hourly_rate, annual_equivalent, notes
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find calculations by user ID
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @param {string} options.type - Filter by calculation type
   * @param {boolean} options.favorites - Filter favorites only
   * @param {boolean} options.archived - Include archived calculations
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} Array of calculations
   */
  static async findByUserId(userId, options = {}) {
    const { type, favorites, archived = false, limit = 50, offset = 0 } = options;
    
    let whereClause = 'WHERE user_id = $1';
    let params = [userId];
    let paramCount = 1;

    if (type) {
      whereClause += ` AND calculation_type = $${++paramCount}`;
      params.push(type);
    }

    if (favorites) {
      whereClause += ` AND is_favorite = $${++paramCount}`;
      params.push(true);
    }

    if (!archived) {
      whereClause += ` AND is_archived = $${++paramCount}`;
      params.push(false);
    }

    const query = `
      SELECT * FROM calculations
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Find calculation by ID
   * @param {number} id - Calculation ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Calculation object or null
   */
  static async findById(id, userId) {
    const query = `
      SELECT * FROM calculations
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  /**
   * Update calculation
   * @param {number} id - Calculation ID
   * @param {number} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated calculation or null
   */
  static async update(id, userId, updateData) {
    const allowedFields = [
      'title', 'description', 'hourly_rate', 'hours_per_week',
      'regular_hours', 'regular_rate', 'overtime_hours', 'overtime_rate',
      'call_hours', 'call_rate', 'callback_hours', 'callback_rate', 'pay_period',
      'contract_weeks', 'contract_type', 'housing_stipend', 'meal_stipend',
      'travel_reimbursement', 'mileage_reimbursement', 'other_stipends',
      'tax_state', 'work_state', 'filing_status', 'custom_tax_rate',
      'gross_pay', 'federal_tax', 'state_tax', 'fica_tax', 'net_pay',
      'total_stipends', 'total_contract_value', 'true_hourly_rate',
      'annual_equivalent', 'is_favorite', 'is_archived', 'notes'
    ];

    const updateFields = Object.keys(updateData).filter(key => allowedFields.includes(key));
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const values = [id, userId, ...updateFields.map(field => updateData[field])];

    const query = `
      UPDATE calculations
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete calculation
   * @param {number} id - Calculation ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id, userId) {
    const query = `
      DELETE FROM calculations
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rowCount > 0;
  }

  /**
   * Toggle favorite status
   * @param {number} id - Calculation ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Updated calculation or null
   */
  static async toggleFavorite(id, userId) {
    const query = `
      UPDATE calculations
      SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  /**
   * Archive/unarchive calculation
   * @param {number} id - Calculation ID
   * @param {number} userId - User ID (for authorization)
   * @param {boolean} archived - Archive status
   * @returns {Promise<Object|null>} Updated calculation or null
   */
  static async setArchived(id, userId, archived = true) {
    const query = `
      UPDATE calculations
      SET is_archived = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId, archived]);
    return result.rows[0] || null;
  }

  /**
   * Get calculation statistics for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Statistics object
   */
  static async getStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_calculations,
        COUNT(CASE WHEN calculation_type = 'paycheck' THEN 1 END) as paycheck_calculations,
        COUNT(CASE WHEN calculation_type = 'contract' THEN 1 END) as contract_calculations,
        COUNT(CASE WHEN is_favorite THEN 1 END) as favorite_calculations,
        COUNT(CASE WHEN is_archived THEN 1 END) as archived_calculations,
        AVG(CASE WHEN calculation_type = 'paycheck' THEN true_hourly_rate END) as avg_paycheck_rate,
        AVG(CASE WHEN calculation_type = 'contract' THEN true_hourly_rate END) as avg_contract_rate,
        MAX(created_at) as latest_calculation
      FROM calculations
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Duplicate calculation
   * @param {number} id - Original calculation ID
   * @param {number} userId - User ID (for authorization)
   * @param {string} newTitle - Optional new title
   * @returns {Promise<Object|null>} New calculation or null
   */
  static async duplicate(id, userId, newTitle) {
    return executeTransaction(async (client) => {
      // Get original calculation
      const originalQuery = `
        SELECT * FROM calculations
        WHERE id = $1 AND user_id = $2
      `;
      const originalResult = await client.query(originalQuery, [id, userId]);
      
      if (originalResult.rows.length === 0) {
        return null;
      }

      const original = originalResult.rows[0];
      
      // Create duplicate (exclude id, created_at, updated_at)
      const duplicateData = { ...original };
      delete duplicateData.id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;
      
      // Set new title
      duplicateData.title = newTitle || `Copy of ${original.title || 'Calculation'}`;
      duplicateData.is_favorite = false; // Reset favorite status
      
      // Insert duplicate
      const fields = Object.keys(duplicateData);
      const values = Object.values(duplicateData);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      
      const insertQuery = `
        INSERT INTO calculations (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, values);
      return result.rows[0];
    });
  }
}

module.exports = Calculation;