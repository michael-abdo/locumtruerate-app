/**
 * Locum True Rate™ Calculator - Calculations Worker
 * 
 * This Cloudflare Worker handles calculation-related operations:
 * - Saving calculations
 * - Retrieving calculations
 * - Deleting calculations
 * 
 * To deploy this worker:
 * 1. Set up your wrangler.toml configuration
 * 2. Run `wrangler deploy` from the command line
 */

// Define the JWT secret for validating tokens (must match auth worker)
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
    
    // Get user from request
    const user = await getUserFromRequest(request, env);
    
    // Check if user is authenticated for protected routes
    if (!user && path !== '/api/calculations/public') {
      return createJsonResponse({ error: 'Unauthorized' }, 401);
    }
    
    // Route to the appropriate handler based on the path
    if (path === '/api/calculations/save' && request.method === 'POST') {
      return handleSaveCalculation(request, env, user);
    } else if (path === '/api/calculations' && request.method === 'GET') {
      return handleGetCalculations(request, env, user);
    } else if (path.match(/^\/api\/calculations\/\w+$/) && request.method === 'GET') {
      const id = path.split('/').pop();
      return handleGetCalculation(request, env, user, id);
    } else if (path.match(/^\/api\/calculations\/\w+$/) && request.method === 'DELETE') {
      const id = path.split('/').pop();
      return handleDeleteCalculation(request, env, user, id);
    } else if (path === '/api/calculations/public' && request.method === 'GET') {
      return handleGetPublicCalculations(request, env);
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
 * Handle saving a calculation
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 */
async function handleSaveCalculation(request, env, user) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.contract_state || !data.practitioner_type || !data.hourly_rate || 
        !data.weeks || !data.hours_per_week || !data.true_rate || !data.gross_contract_value) {
      return createJsonResponse({ 
        error: 'Missing required fields' 
      }, 400);
    }
    
    // Generate calculation ID
    const calculationId = crypto.randomUUID();
    
    // Store calculation in database
    await env.DB.prepare(`
      INSERT INTO saved_calculations (
        id, user_id, contract_state, practitioner_type, hourly_rate, 
        overtime_rate, beeper_rate, beeper_hours_per_month, weekly_stipend, 
        daily_stipend, weeks, pto, hours_per_week, shifts_per_week, 
        daily_miles, completion_bonus, true_rate, gross_contract_value, 
        created_at, is_public
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).bind(
      calculationId,
      user.id,
      data.contract_state,
      data.practitioner_type,
      data.hourly_rate,
      data.overtime_rate || null,
      data.beeper_rate || null,
      data.beeper_hours_per_month || null,
      data.weekly_stipend || null,
      data.daily_stipend || null,
      data.weeks,
      data.pto || null,
      data.hours_per_week,
      data.shifts_per_week || null,
      data.daily_miles || null,
      data.completion_bonus || null,
      data.true_rate,
      data.gross_contract_value,
      Math.floor(Date.now() / 1000), // Current timestamp
      data.is_public || false
    ).run();
    
    // Return success
    return createJsonResponse({ 
      success: true, 
      calculation_id: calculationId 
    }, 201);
  } catch (error) {
    console.error('Save calculation error:', error);
    return createJsonResponse({ 
      error: 'Failed to save calculation' 
    }, 500);
  }
}

/**
 * Handle retrieving all calculations for a user
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 */
async function handleGetCalculations(request, env, user) {
  try {
    // Get calculations from database
    const calculations = await env.DB.prepare(`
      SELECT * FROM saved_calculations 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user.id).all();
    
    // Return calculations
    return createJsonResponse({ 
      calculations: calculations.results 
    });
  } catch (error) {
    console.error('Get calculations error:', error);
    return createJsonResponse({ 
      error: 'Failed to retrieve calculations' 
    }, 500);
  }
}

/**
 * Handle retrieving a specific calculation
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 * @param {string} id - Calculation ID
 */
async function handleGetCalculation(request, env, user, id) {
  try {
    // Get calculation from database
    const calculation = await env.DB.prepare(`
      SELECT * FROM saved_calculations 
      WHERE id = ? AND (user_id = ? OR is_public = 1)
    `).bind(id, user.id).first();
    
    // Check if calculation exists
    if (!calculation) {
      return createJsonResponse({ 
        error: 'Calculation not found' 
      }, 404);
    }
    
    // Return calculation
    return createJsonResponse(calculation);
  } catch (error) {
    console.error('Get calculation error:', error);
    return createJsonResponse({ 
      error: 'Failed to retrieve calculation' 
    }, 500);
  }
}

/**
 * Handle deleting a calculation
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 * @param {string} id - Calculation ID
 */
async function handleDeleteCalculation(request, env, user, id) {
  try {
    // Check if calculation exists and belongs to user
    const calculation = await env.DB.prepare(`
      SELECT * FROM saved_calculations 
      WHERE id = ? AND user_id = ?
    `).bind(id, user.id).first();
    
    // Check if calculation exists
    if (!calculation) {
      return createJsonResponse({ 
        error: 'Calculation not found' 
      }, 404);
    }
    
    // Delete calculation
    await env.DB.prepare(`
      DELETE FROM saved_calculations 
      WHERE id = ? AND user_id = ?
    `).bind(id, user.id).run();
    
    // Return success
    return createJsonResponse({ 
      success: true 
    });
  } catch (error) {
    console.error('Delete calculation error:', error);
    return createJsonResponse({ 
      error: 'Failed to delete calculation' 
    }, 500);
  }
}

/**
 * Handle retrieving public calculations
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 */
async function handleGetPublicCalculations(request, env) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const state = url.searchParams.get('state');
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    // Build query
    let query = `
      SELECT * FROM saved_calculations 
      WHERE is_public = 1
    `;
    
    const params = [];
    
    // Add filters
    if (state) {
      query += ` AND contract_state = ?`;
      params.push(state);
    }
    
    if (type) {
      query += ` AND practitioner_type = ?`;
      params.push(type);
    }
    
    // Add order and limit
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    // Get calculations from database
    const calculations = await env.DB.prepare(query).bind(...params).all();
    
    // Return calculations
    return createJsonResponse({ 
      calculations: calculations.results 
    });
  } catch (error) {
    console.error('Get public calculations error:', error);
    return createJsonResponse({ 
      error: 'Failed to retrieve public calculations' 
    }, 500);
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