const bcrypt = require('bcrypt');
const { pool } = require('../db/connection');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain text password (will be hashed)
   * @param {string} userData.firstName - User first name
   * @param {string} userData.lastName - User last name
   * @param {string} userData.phone - User phone number
   * @param {string} userData.role - User role (default: 'locum')
   * @returns {Promise<Object>} Created user (without password)
   */
  static async create(userData) {
    const { email, password, firstName, lastName, phone, role = 'locum' } = userData;
    
    // Hash the password
    const passwordHash = await this.hashPassword(password);
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, phone, role, created_at
    `;
    
    const values = [email, passwordHash, firstName, lastName, phone, role];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      throw error;
    }
  }
  
  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, phone, role, created_at
      FROM users
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }
  
  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const query = `
      SELECT id, email, first_name, last_name, phone, role, created_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
  
  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Password hash
   * @returns {Promise<boolean>} True if password matches
   */
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

module.exports = User;