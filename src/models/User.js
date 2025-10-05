const bcrypt = require('bcrypt');
const config = require('../config/config');
const { pool } = require('../db/connection');
const { executeTransaction } = require('../utils/database');

class User {
  /**
   * Create a new user with profile
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
    
    // Use transaction to create user and profile
    return executeTransaction(async (client) => {
      // Create user
      const userQuery = `
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, role, created_at
      `;
      const userValues = [email, passwordHash, role];
      const userResult = await client.query(userQuery, userValues);
      const user = userResult.rows[0];
      
      // Create profile
      const profileQuery = `
        INSERT INTO profiles (user_id, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING first_name, last_name, phone
      `;
      const profileValues = [user.id, firstName, lastName, phone];
      const profileResult = await client.query(profileQuery, profileValues);
      const profile = profileResult.rows[0];
      
      // Return combined user and profile data
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        created_at: user.created_at
      };
    }).catch(error => {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      throw error;
    });
  }
  
  /**
   * Find user by email with profile
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const query = `
      SELECT 
        u.id, u.email, u.password_hash, u.role, u.created_at,
        p.first_name, p.last_name, p.phone, p.specialty, p.years_experience
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }
  
  /**
   * Find user by ID with profile
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const query = `
      SELECT 
        u.id, u.email, u.role, u.created_at,
        p.first_name, p.last_name, p.phone, p.specialty, p.years_experience
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  static async updateProfile(userId, profileData) {
    const { firstName, lastName, phone, specialty, yearsExperience, bio } = profileData;
    
    const query = `
      UPDATE profiles 
      SET first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          phone = COALESCE($4, phone),
          specialty = COALESCE($5, specialty),
          years_experience = COALESCE($6, years_experience),
          bio = COALESCE($7, bio),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING first_name, last_name, phone, specialty, years_experience, bio
    `;
    
    const values = [userId, firstName, lastName, phone, specialty, yearsExperience, bio];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const saltRounds = config.security.bcryptRounds;
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
  
  /**
   * Set password reset token for user
   * @param {number} userId - User ID
   * @param {string} token - Reset token
   * @param {Date} expires - Token expiration date
   * @returns {Promise<boolean>} Success status
   */
  static async setPasswordResetToken(userId, token, expires) {
    const query = `
      UPDATE users 
      SET reset_token = $2,
          reset_token_expires = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    const values = [userId, token, expires];
    const result = await pool.query(query, values);
    return result.rowCount > 0;
  }
  
  /**
   * Find user by password reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object|null>} User object or null if token invalid/expired
   */
  static async findByPasswordResetToken(token) {
    const query = `
      SELECT 
        u.id, u.email, u.role, u.created_at,
        p.first_name, p.last_name, p.phone, p.specialty, p.years_experience
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.reset_token = $1 
        AND u.reset_token_expires > CURRENT_TIMESTAMP
    `;
    
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }
  
  /**
   * Clear password reset token
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async clearPasswordResetToken(userId) {
    const query = `
      UPDATE users 
      SET reset_token = NULL,
          reset_token_expires = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rowCount > 0;
  }
  
  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New plain text password (will be hashed)
   * @returns {Promise<boolean>} Success status
   */
  static async updatePassword(userId, newPassword) {
    const passwordHash = await this.hashPassword(newPassword);
    
    const query = `
      UPDATE users 
      SET password_hash = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    const values = [userId, passwordHash];
    const result = await pool.query(query, values);
    return result.rowCount > 0;
  }
}

module.exports = User;