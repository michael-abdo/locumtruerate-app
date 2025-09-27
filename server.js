const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { pool, testConnection, initializeDatabase } = require('./db/connection');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // In production, use cloud storage like S3
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'job-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG and PNG are allowed.'));
        }
    }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

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
// Serve uploaded images
app.use('/uploads', express.static('uploads'));

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

// Middleware to verify JWT token for protected routes
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'No valid authorization token provided',
                code: 'NO_TOKEN'
            });
        }
        
        const token = authHeader.substring(7);
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'dev_secret_key_change_in_production'
        );
        
        // Add user info to request
        req.user = decoded;
        next();
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
        
        res.status(500).json({ 
            error: 'Internal server error during authentication',
            code: 'AUTH_ERROR'
        });
    }
};

// Submit lead for a job (from job board)
app.post('/api/leads/submit', async (req, res) => {
    try {
        const { jobId, name, email, phone, contactPreference } = req.body;
        
        // Validation
        if (!jobId || !name || !email || !phone) {
            return res.status(400).json({
                error: 'All fields are required',
                code: 'MISSING_FIELDS'
            });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                code: 'INVALID_EMAIL'
            });
        }
        
        // Get job details and recruiter ID
        const [jobs] = await pool.execute(
            'SELECT id, recruiter_id, title FROM job_listings WHERE id = ? AND status = "active"',
            [jobId]
        );
        
        if (jobs.length === 0) {
            return res.status(404).json({
                error: 'Job listing not found or inactive',
                code: 'JOB_NOT_FOUND'
            });
        }
        
        const job = jobs[0];
        
        // Check if lead already exists for this job and email
        const [existingLeads] = await pool.execute(
            'SELECT id FROM leads WHERE job_id = ? AND email = ?',
            [jobId, email]
        );
        
        if (existingLeads.length > 0) {
            return res.status(409).json({
                error: 'You have already applied for this position',
                code: 'DUPLICATE_APPLICATION'
            });
        }
        
        // Begin transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // Insert lead
            const [leadResult] = await connection.execute(
                'INSERT INTO leads (job_id, recruiter_id, name, email, phone, contact_preference) VALUES (?, ?, ?, ?, ?, ?)',
                [jobId, job.recruiter_id, name, email, phone, contactPreference || 'email']
            );
            
            const leadId = leadResult.insertId;
            
            // Create pending charge record
            await connection.execute(
                'INSERT INTO lead_charges (lead_id, recruiter_id) VALUES (?, ?)',
                [leadId, job.recruiter_id]
            );
            
            // Commit transaction
            await connection.commit();
            
            // Process payment charge (placeholder - would use Stripe in production)
            // For demo purposes, we'll mark it as pending
            console.log(`💰 Pending charge: $39.99 to recruiter ${job.recruiter_id} for lead ${leadId}`);
            
            // Send notification to recruiter (placeholder)
            console.log(`📧 Notification queued: New lead for job "${job.title}" - ${name} (${contactPreference})`);
            
            // In production:
            // 1. Use Stripe API to charge recruiter's saved payment method
            // 2. Send email notification with lead details
            // 3. Update lead_charges table with transaction_id and payment_status
            
            res.status(201).json({
                success: true,
                message: 'Your application has been submitted successfully',
                leadId: leadId
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Lead submission error:', error);
        res.status(500).json({
            error: 'Failed to submit application',
            code: 'SUBMISSION_ERROR'
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

// Get all job listings (public)
app.get('/api/jobs', async (req, res) => {
    try {
        const { specialty, location, search } = req.query;
        let query = `
            SELECT j.*, u.first_name, u.last_name, u.email as recruiter_email
            FROM job_listings j
            JOIN users u ON j.recruiter_id = u.id
            WHERE j.status = 'active'
        `;
        const params = [];
        
        if (specialty) {
            query += ' AND j.specialty = ?';
            params.push(specialty);
        }
        
        if (location) {
            query += ' AND j.location LIKE ?';
            params.push(`%${location}%`);
        }
        
        if (search) {
            query += ' AND (j.title LIKE ? OR j.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY j.created_at DESC';
        
        const [jobs] = await pool.execute(query, params);
        
        res.json({
            success: true,
            jobs: jobs
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({
            error: 'Failed to fetch job listings',
            code: 'FETCH_ERROR'
        });
    }
});

// Post a new job listing with optional image (recruiters only)
app.post('/api/jobs', verifyToken, upload.single('jobImage'), async (req, res) => {
    try {
        // Check if user is a recruiter
        if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Only recruiters can post jobs',
                code: 'FORBIDDEN'
            });
        }
        
        const {
            title,
            specialty,
            location,
            hourlyRate,
            hoursPerWeek,
            contractLengthWeeks,
            housingStipend,
            description,
            requirements,
            benefits,
            imageUrl
        } = req.body;
        
        // Validation
        if (!title || !specialty || !location) {
            return res.status(400).json({
                error: 'Title, specialty, and location are required',
                code: 'MISSING_FIELDS'
            });
        }
        
        // Handle uploaded image
        let finalImageUrl = imageUrl || null;
        if (req.file) {
            // In production, upload to cloud storage and get URL
            // For now, use local path
            finalImageUrl = `/uploads/${req.file.filename}`;
        }
        
        // Insert job listing
        const [result] = await pool.execute(
            `INSERT INTO job_listings (
                recruiter_id, title, specialty, location, 
                hourly_rate, hours_per_week, contract_length_weeks, housing_stipend,
                description, requirements, benefits, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                title,
                specialty,
                location,
                hourlyRate || null,
                hoursPerWeek || null,
                contractLengthWeeks || null,
                housingStipend || null,
                description || null,
                requirements || null,
                benefits || null,
                finalImageUrl
            ]
        );
        
        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            jobId: result.insertId
        });
        
    } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({
            error: 'Failed to post job listing',
            code: 'POST_ERROR'
        });
    }
});

// Get recruiter's leads
app.get('/api/leads', verifyToken, async (req, res) => {
    try {
        // Check if user is a recruiter
        if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Only recruiters can view leads',
                code: 'FORBIDDEN'
            });
        }
        
        const [leads] = await pool.execute(
            `SELECT l.*, j.title as job_title, j.location, c.payment_status
            FROM leads l
            JOIN job_listings j ON l.job_id = j.id
            LEFT JOIN lead_charges c ON l.id = c.lead_id
            WHERE l.recruiter_id = ?
            ORDER BY l.created_at DESC`,
            [req.user.id]
        );
        
        res.json({
            success: true,
            leads: leads
        });
        
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({
            error: 'Failed to fetch leads',
            code: 'FETCH_ERROR'
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