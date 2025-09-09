const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, testConnection, initializeDatabase } = require('./db/connection');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Handle trailing slashes - redirect to clean URLs
app.use((req, res, next) => {
  if (req.path !== '/' && req.path.endsWith('/')) {
    const cleanPath = req.path.slice(0, -1);
    return res.redirect(301, cleanPath + req.url.slice(req.path.length));
  }
  next();
});

// Serve static files
app.use(express.static('.'));

// Routes for each demo page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint to verify this is vanilla demos
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'locumtruerate-vanilla-demos',
    version: '4.2.4',
    timestamp: new Date().toISOString(),
    message: 'This is the REAL vanilla demos server!',
    deployment: {
      method: process.env.HEROKU_SLUG_COMMIT ? 'github-actions' : 'manual',
      commit: process.env.HEROKU_SLUG_COMMIT || 'unknown',
      dyno: process.env.DYNO || 'local'
    }
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'contract-calculator.html'));
});

app.get('/jobs', (req, res) => {
  res.sendFile(path.join(__dirname, 'job-board.html'));
});

app.get('/locum', (req, res) => {
  res.sendFile(path.join(__dirname, 'locum-dashboard.html'));
});

app.get('/paycheck', (req, res) => {
  res.sendFile(path.join(__dirname, 'paycheck-calculator.html'));
});

app.get('/paycheck-calculator.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'paycheck-calculator.html'));
});

app.get('/recruiter', (req, res) => {
  res.sendFile(path.join(__dirname, 'recruiter-dashboard.html'));
});

// API Routes
// Authentication endpoints

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role = 'locum', first_name, last_name, phone } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        error: 'User with this email already exists',
        code: 'EMAIL_EXISTS'
      });
    }
    
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, role, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [email, passwordHash, role, first_name || null, last_name || null, phone || null]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: result.insertId, 
        email, 
        role 
      },
      process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        email,
        role,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error during registration',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, email, password_hash, role, first_name, last_name, phone FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const user = users[0];
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error during login',
      code: 'LOGIN_ERROR'
    });
  }
});

// Verify JWT token
app.get('/api/auth/verify', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No valid authorization token provided',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'dev_secret_key_change_in_production'
    );
    
    // Get user data from database (in case of updates since token was issued)
    const [users] = await pool.execute(
      'SELECT id, email, role, first_name, last_name, phone FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'User no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = users[0];
    
    // Return user data
    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone
      },
      token: {
        expires: new Date(decoded.exp * 1000),
        issued: new Date(decoded.iat * 1000)
      }
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Token verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error during token verification',
      code: 'VERIFY_ERROR'
    });
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Initialize database tables
    const initialized = await initializeDatabase();
    if (!initialized) {
      console.error('❌ Failed to initialize database. Exiting...');
      process.exit(1);
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 LocumTrueRate with Database running on port ${PORT}`);
      console.log(`🎉 VERCEL DISABLED - This is HEROKU deployment!`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\nAvailable pages:`);
      console.log(`  / - Homepage`);
      console.log(`  /admin - Admin Dashboard`);
      console.log(`  /calculator - Contract Calculator`);
      console.log(`  /jobs - Job Board`);
      console.log(`  /locum - Locum Dashboard`);
      console.log(`  /paycheck - Paycheck Calculator`);
      console.log(`  /recruiter - Recruiter Dashboard`);
      console.log(`\nAPI Endpoints:`);
      console.log(`  POST /api/auth/register - User registration`);
      console.log(`  POST /api/auth/login - User login`);
      console.log(`  GET /api/auth/verify - Verify JWT token`);
    });
    
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();