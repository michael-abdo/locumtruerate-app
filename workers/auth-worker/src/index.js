/**
 * Locum True Rate™ Calculator - Authentication Worker
 * 
 * This Cloudflare Worker handles user authentication:
 * - User registration
 * - Login
 * - Logout
 * - Status checks
 * 
 * To deploy this worker:
 * 1. Set up your wrangler.toml configuration
 * 2. Run `wrangler deploy` from the command line
 */

// Define the JWT secret for signing tokens (should be in environment variables)
const JWT_SECRET = 'your-secure-jwt-secret'; // Replace with actual secret

// Handle requests
export default {
  async fetch(request, env, ctx) {
    // Parse request URL
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS for development
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    // Route to the appropriate handler based on the path
    if (path === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env);
    } else if (path === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    } else if (path === '/api/auth/logout' && request.method === 'POST') {
      return handleLogout(request);
    } else if (path === '/api/auth/status' && request.method === 'GET') {
      return handleStatus(request, env);
    } else {
      return new Response('Not Found', { status: 404 });
    }
  }
};

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

/**
 * Handle user registration
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 */
async function handleRegister(request, env) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.email || !data.password || !data.user_type) {
      return createJsonResponse({ 
        error: 'Missing required fields' 
      }, 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return createJsonResponse({ 
        error: 'Invalid email format' 
      }, 400);
    }
    
    // Validate user type
    if (!['locum', 'recruiter'].includes(data.user_type)) {
      return createJsonResponse({ 
        error: 'Invalid user type. Must be "locum" or "recruiter"' 
      }, 400);
    }
    
    // Check if user already exists
    const existingUser = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(data.email.toLowerCase()).first();
    
    if (existingUser) {
      return createJsonResponse({ 
        error: 'Email already registered' 
      }, 409);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Generate user ID
    const userId = crypto.randomUUID();
    
    // Store user in database
    await env.DB.prepare(
      `INSERT INTO users (
        id, email, hashed_password, user_type, created_at
      ) VALUES (?, ?, ?, ?, ?)`
    ).bind(
      userId,
      data.email.toLowerCase(),
      hashedPassword,
      data.user_type,
      Math.floor(Date.now() / 1000) // Current timestamp
    ).run();
    
    // Create session token
    const token = await createJWT(userId, data.user_type);
    
    // Return success with token
    return createJsonResponse(
      { 
        success: true, 
        user: {
          id: userId,
          email: data.email,
          user_type: data.user_type
        }
      }, 
      201, // Created
      {
        'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800` // 7 days
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return createJsonResponse({ 
      error: 'Registration failed' 
    }, 500);
  }
}

/**
 * Handle user login
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 */
async function handleLogin(request, env) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.email || !data.password) {
      return createJsonResponse({ 
        error: 'Email and password are required' 
      }, 400);
    }
    
    // Find user
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(data.email.toLowerCase()).first();
    
    // Check if user exists
    if (!user) {
      return createJsonResponse({ 
        error: 'Invalid email or password' 
      }, 401);
    }
    
    // Verify password
    const passwordValid = await verifyPassword(data.password, user.hashed_password);
    
    if (!passwordValid) {
      return createJsonResponse({ 
        error: 'Invalid email or password' 
      }, 401);
    }
    
    // Update last login timestamp
    await env.DB.prepare(
      'UPDATE users SET last_login = ? WHERE id = ?'
    ).bind(
      Math.floor(Date.now() / 1000),
      user.id
    ).run();
    
    // Create session token
    const token = await createJWT(user.id, user.user_type);
    
    // Return success with token
    return createJsonResponse(
      { 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          user_type: user.user_type,
          first_name: user.first_name || null,
          last_name: user.last_name || null
        }
      }, 
      200,
      {
        'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800` // 7 days
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return createJsonResponse({ 
      error: 'Login failed' 
    }, 500);
  }
}

/**
 * Handle user logout
 * @param {Request} request - Incoming request
 */
async function handleLogout(request) {
  // Clear cookie
  return createJsonResponse(
    { success: true }, 
    200,
    {
      'Set-Cookie': 'auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
    }
  );
}

/**
 * Check authentication status
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 */
async function handleStatus(request, env) {
  try {
    // Get user from cookie
    const user = await getUserFromRequest(request, env);
    
    if (user) {
      return createJsonResponse({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          user_type: user.user_type,
          first_name: user.first_name || null,
          last_name: user.last_name || null
        }
      });
    } else {
      return createJsonResponse({
        authenticated: false
      });
    }
  } catch (error) {
    console.error('Status check error:', error);
    return createJsonResponse({ 
      error: 'Status check failed',
      authenticated: false
    }, 500);
  }
}

/**
 * Hash a password using PBKDF2
 * @param {string} password - Plain text password
 * @returns {string} - Hashed password
 */
async function hashPassword(password) {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Convert password string to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as a key
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 310000, // High iteration count for security
      hash: 'SHA-256'
    },
    passwordKey,
    256 // 256 bits
  );
  
  // Convert derived key to base64
  const hashArray = Array.from(new Uint8Array(derivedKey));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Convert salt to hex
  const saltArray = Array.from(salt);
  const saltHex = saltArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt and hash in a format that can be stored
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against stored hash
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Stored hash from database
 * @returns {boolean} - True if password is valid
 */
async function verifyPassword(password, storedHash) {
  // Split hash and salt
  const [saltHex, hashHex] = storedHash.split(':');
  
  // Convert hex salt to Uint8Array
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  // Convert password string to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as a key
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using same parameters as during hashing
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 310000,
      hash: 'SHA-256'
    },
    passwordKey,
    256
  );
  
  // Convert derived key to hex
  const hashArray = Array.from(new Uint8Array(derivedKey));
  const newHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Compare with stored hash
  return newHashHex === hashHex;
}

/**
 * Create JWT token
 * @param {string} userId - User ID
 * @param {string} userType - User type (locum or recruiter)
 * @returns {string} - JWT token
 */
async function createJWT(userId, userType) {
  // Create JWT payload
  const payload = {
    sub: userId,
    type: userType,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 604800 // 7 days
  };
  
  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Base64 encode header and payload
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));
  
  // Create signature input
  const signatureInput = `${base64Header}.${base64Payload}`;
  
  // Sign the input
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureInput);
  const keyData = encoder.encode(JWT_SECRET);
  
  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign
  const signature = await crypto.subtle.sign('HMAC', key, data);
  
  // Convert signature to base64
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  // Return complete JWT
  return `${base64Header}.${base64Payload}.${base64Signature}`;
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Payload if valid, null if invalid
 */
async function verifyJWT(token) {
  try {
    // Split token
    const [header, payload, signature] = token.split('.');
    
    // Verify signature
    const signatureInput = `${header}.${payload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureInput);
    const keyData = encoder.encode(JWT_SECRET);
    
    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Convert signature from base64
    const signatureData = new Uint8Array(
      atob(signature)
        .split('')
        .map(c => c.charCodeAt(0))
    );
    
    // Verify signature
    const valid = await crypto.subtle.verify('HMAC', key, signatureData, data);
    
    if (!valid) {
      return null;
    }
    
    // Decode payload
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check expiration
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    console.error('JWT validation error:', error);
    return null;
  }
}

/**
 * Get user from request (using JWT in cookie)
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @returns {Object} - User object if authenticated, null if not
 */
async function getUserFromRequest(request, env) {
  try {
    // Get cookie
    const cookies = request.headers.get('Cookie') || '';
    const tokenMatch = cookies.match(/auth_token=([^;]+)/);
    
    if (!tokenMatch) {
      return null;
    }
    
    const token = tokenMatch[1];
    
    // Verify token
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return null;
    }
    
    // Get user from database
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(payload.sub).first();
    
    return user || null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Create JSON response with appropriate headers
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @param {Object} headers - Additional headers
 * @returns {Response} - Formatted Response object
 */
function createJsonResponse(data, status = 200, additionalHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...additionalHeaders
  };
  
  return new Response(
    JSON.stringify(data),
    { status, headers }
  );
}