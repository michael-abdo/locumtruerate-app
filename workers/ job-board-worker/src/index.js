/**
 * Locum True Rate™ Calculator - Job Board Worker
 * 
 * This Cloudflare Worker handles job board operations:
 * - Job listings
 * - Job applications
 * - Saved jobs
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
    
    // Get user from request for protected routes
    const user = await getUserFromRequest(request, env);
    
    // Public routes (no authentication required)
    if (path === '/api/job-board/listings' && request.method === 'GET') {
      return handleGetJobListings(request, env);
    } else if (path.match(/^\/api\/job-board\/listing\/\w+$/) && request.method === 'GET') {
      const id = path.split('/').pop();
      return handleGetJobListing(request, env, id);
    }
    
    // Protected routes (authentication required)
    if (!user) {
      return createJsonResponse({ error: 'Unauthorized' }, 401);
    }
    
    // Recruiter-only routes
    if (path === '/api/job-board/listing' && request.method === 'POST') {
      if (user.user_type !== 'recruiter') {
        return createJsonResponse({ error: 'Only recruiters can post job listings' }, 403);
      }
      return handleCreateJobListing(request, env, user);
    } else if (path.match(/^\/api\/job-board\/listing\/\w+$/) && request.method === 'DELETE') {
      if (user.user_type !== 'recruiter') {
        return createJsonResponse({ error: 'Only recruiters can delete job listings' }, 403);
      }
      const id = path.split('/').pop();
      return handleDeleteJobListing(request, env, user, id);
    }
    
    // Locum-only routes
    if (path === '/api/job-board/apply' && request.method === 'POST') {
      if (user.user_type !== 'locum') {
        return createJsonResponse({ error: 'Only locums can apply for jobs' }, 403);
      }
      return handleApplyForJob(request, env, user);
    }
    
    // Common protected routes
    if (path === '/api/job-board/applications' && request.method === 'GET') {
      return handleGetApplications(request, env, user);
    } else if (path.match(/^\/api\/job-board\/applications\/\w+\/withdraw$/) && request.method === 'POST') {
      const id = path.split('/')[3];
      return handleWithdrawApplication(request, env, user, id);
    } else if (path === '/api/job-board/save' && request.method === 'POST') {
      return handleSaveJob(request, env, user);
    } else if (path === '/api/job-board/saved' && request.method === 'GET') {
      return handleGetSavedJobs(request, env, user);
    } else if (path.match(/^\/api\/job-board\/saved\/\w+$/) && request.method === 'DELETE') {
      const id = path.split('/').pop();
      return handleRemoveSavedJob(request, env, user, id);
    }
    
    // If no matching route is found
    return new Response('Not Found', { status: 404 });
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
 * Handle retrieving job listings with optional filters
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 */
async function handleGetJobListings(request, env) {
  try {
    // Get URL parameters for filtering
    const url = new URL(request.url);
    const state = url.searchParams.get('state');
    const type = url.searchParams.get('type');
    const minRate = parseFloat(url.searchParams.get('min_rate') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    // Build query
    let query = `
      SELECT * FROM job_board 
      WHERE expires_at > ?
    `;
    
    // Params array starting with current time
    const params = [Math.floor(Date.now() / 1000)];
    
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
    query += ` ORDER BY posted_at DESC LIMIT ?`;
    params.push(limit);
    
    // Get listings from database
    const listings = await env.DB.prepare(query).bind(...params).all();
    
    // Filter by true rate if needed (calculated field)
    let filteredListings = listings.results;
    if (minRate > 0) {
      filteredListings = filteredListings.filter(listing => {
        // Calculate true rate for this listing
        const trueRate = calculateTrueRateForListing(listing);
        return trueRate >= minRate;
      });
    }
    
    // Return listings
    return createJsonResponse({ 
      listings: filteredListings
    });
  } catch (error) {
    console.error('Get job listings error:', error);
    return createJsonResponse({ 
      error: 'Failed to retrieve job listings' 
    }, 500);
  }
}

/**
 * Calculate the true rate for a job listing
 * @param {Object} listing - Job listing
 * @returns {number} - Calculated true rate
 */
function calculateTrueRateForListing(listing) {
  const workedWeeks = listing.weeks;
  const totalHours = listing.hours_per_week * workedWeeks;
  
  // Calculate base components
  const regularHours = Math.min(listing.hours_per_week, 40);
  const overtimeHours = Math.max(listing.hours_per_week - 40, 0);
  
  // Calculate hourly compensation
  const hourlyComp = regularHours * listing.hourly_rate;
  const overtimeComp = overtimeHours * (listing.overtime_rate || listing.hourly_rate * 1.5);
  
  // Calculate weekly compensation
  const weeklyComp = hourlyComp + overtimeComp;
  
  // Calculate total compensation over contract
  const totalHourlyComp = weeklyComp * workedWeeks;
  
  // Add stipends if available
  const weeklyStipend = listing.weekly_stipend || 0;
  const dailyStipend = listing.daily_stipend || 0;
  const shiftsPerWeek = listing.shifts_per_week || 5; // Default to 5 shifts
  
  const totalStipends = (weeklyStipend * workedWeeks) + 
                        (dailyStipend * shiftsPerWeek * workedWeeks);
  
  // Add beeper compensation if available
  const beeperRate = listing.beeper_rate || 0;
  const beeperHours = listing.beeper_hours_per_month || 0;
  const months = workedWeeks / 4;
  const totalBeeperComp = beeperRate * beeperHours * months;
  
  // Add completion bonus if available
  const completionBonus = listing.completion_bonus || 0;
  
  // Calculate total contract value
  const totalValue = totalHourlyComp + totalStipends + totalBeeperComp + completionBonus;
  
  // Calculate true rate (total value / total hours)
  return totalHours > 0 ? totalValue / totalHours : 0;
}

/**
 * Handle retrieving a specific job listing
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {string} id - Listing ID
 */
async function handleGetJobListing(request, env, id) {
  try {
    // Get listing from database
    const listing = await env.DB.prepare(`
      SELECT * FROM job_board 
      WHERE id = ?
    `).bind(id).first();
    
    // Check if listing exists
    if (!listing) {
      return createJsonResponse({ 
        error: 'Job listing not found' 
      }, 404);
    }
    
    // Return listing
    return createJsonResponse(listing);
  } catch (error) {
    console.error('Get job listing error:', error);
    return createJsonResponse({ 
      error: 'Failed to retrieve job listing' 
    }, 500);
  }
}

/**
 * Handle creating a job listing (recruiters only)
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 */
async function handleCreateJobListing(request, env, user) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.contract_state || !data.practitioner_type || 
        !data.hourly_rate || !data.weeks || !data.hours_per_week) {
      return createJsonResponse({ 
        error: 'Missing required fields' 
      }, 400);
    }
    
    // Generate listing ID
    const listingId = crypto.randomUUID();
    
    // Set expiration date (default to 30 days)
    const expiresAt = data.expires_at || Math.floor(Date.now() / 1000) + 2592000;
    
    // Store listing in database
    await env.DB.prepare(`
      INSERT INTO job_board (
        id, poster_id, title, description, contract_state, 
        practitioner_type, hourly_rate, overtime_rate, beeper_rate, 
        weekly_stipend, daily_stipend, weeks, hours_per_week, 
        shifts_per_week, completion_bonus, posted_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      listingId,
      user.id,
      data.title,
      data.description || null,
      data.contract_state,
      data.practitioner_type,
      data.hourly_rate,
      data.overtime_rate || null,
      data.beeper_rate || null,
      data.weekly_stipend || null,
      data.daily_stipend || null,
      data.weeks,
      data.hours_per_week,
      data.shifts_per_week || null,
      data.completion_bonus || null,
      Math.floor(Date.now() / 1000), // Current timestamp
      expiresAt
    ).run();
    
    // Return success
    return createJsonResponse({ 
      success: true, 
      listing_id: listingId 
    }, 201);
  } catch (error) {
    console.error('Create job listing error:', error);
    return createJsonResponse({ 
      error: 'Failed to create job listing' 
    }, 500);
  }
}

/**
 * Handle deleting a job listing (recruiters only)
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 * @param {string} id - Listing ID
 */
async function handleDeleteJobListing(request, env, user, id) {
  try {
    // Check if listing exists and belongs to user
    const listing = await env.DB.prepare(`
      SELECT * FROM job_board 
      WHERE id = ? AND poster_id = ?
    `).bind(id, user.id).first();
    
    // Check if listing exists
    if (!listing) {
      return createJsonResponse({ 
        error: 'Job listing not found' 
      }, 404);
    }
    
    // Delete listing
    await env.DB.prepare(`
      DELETE FROM job_board 
      WHERE id = ? AND poster_id = ?
    `).bind(id, user.id).run();
    
    // Return success
    return createJsonResponse({ 
      success: true 
    });
  } catch (error) {
    console.error('Delete job listing error:', error);
    return createJsonResponse({ 
      error: 'Failed to delete job listing' 
    }, 500);
  }
}

/**
 * Handle applying for a job (locums only)
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 */
async function handleApplyForJob(request, env, user) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.listing_id) {
      return createJsonResponse({ 
        error: 'Missing listing ID' 
      }, 400);
    }
    
    // Check if listing exists
    const listing = await env.DB.prepare(`
      SELECT * FROM job_board 
      WHERE id = ? AND expires_at > ?
    `).bind(
      data.listing_id,
      Math.floor(Date.now() / 1000) // Current timestamp
    ).first();
    
    if (!listing) {
      return createJsonResponse({ 
        error: 'Job listing not found or has expired' 
      }, 404);
    }
    
    // Check if already applied
    const existingApplication = await env.DB.prepare(`
      SELECT * FROM job_applications 
      WHERE applicant_id = ? AND listing_id = ?
    `).bind(user.id, data.listing_id).first();
    
    if (existingApplication) {
      return createJsonResponse({ 
        error: 'You have already applied for this job' 
      }, 409);
    }
    
    // Generate application ID
    const applicationId = crypto.randomUUID();
    
    // Store application in database
    await env.DB.prepare(`
      INSERT INTO job_applications (
        id, applicant_id, listing_id, status, applied_at, updated_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      applicationId,
      user.id,
      data.listing_id,
      'pending', // Initial status
      Math.floor(Date.now() / 1000), // Current timestamp
      Math.floor(Date.now() / 1000), // Current timestamp
      data.notes || null
    ).run();
    
    // Return success
    return createJsonResponse({ 
      success: true, 
      application_id: applicationId 
    }, 201);
  } catch (error) {
    console.error('Apply for job error:', error);
    return createJsonResponse({ 
      error: 'Failed to apply for job' 
    }, 500);
  }
}

/**
 * Handle retrieving job applications
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 */
async function handleGetApplications(request, env, user) {
  try {
    let applications;
    
    if (user.user_type === 'locum') {
      // Get applications where user is the applicant
      applications = await env.DB.prepare(`
        SELECT a.*, j.title, j.contract_state, j.practitioner_type
        FROM job_applications a
        JOIN job_board j ON a.listing_id = j.id
        WHERE a.applicant_id = ?
        ORDER BY a.applied_at DESC
      `).bind(user.id).all();
    } else if (user.user_type === 'recruiter') {
      // Get applications for jobs posted by the user
      applications = await env.DB.prepare(`
        SELECT a.*, j.title, u.email as applicant_email, 
               u.first_name as applicant_first_name, 
               u.last_name as applicant_last_name,
               j.contract_state, j.practitioner_type
        FROM job_applications a
        JOIN job_board j ON a.listing_id = j.id
        JOIN users u ON a.applicant_id = u.id
        WHERE j.poster_id = ?
        ORDER BY a.applied_at DESC
      `).bind(user.id).all();
    }
    
    // Return applications
    return createJsonResponse({ 
      applications: applications.results 
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return createJsonResponse({ 
      error: 'Failed to retrieve applications' 
    }, 500);
  }
}

/**
 * Handle withdrawing an application
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 * @param {string} id - Application ID
 */
async function handleWithdrawApplication(request, env, user, id) {
  try {
    let application;
    
    if (user.user_type === 'locum') {
      // Check if application exists and belongs to user
      application = await env.DB.prepare(`
        SELECT * FROM job_applications 
        WHERE id = ? AND applicant_id = ?
      `).bind(id, user.id).first();
    } else if (user.user_type === 'recruiter') {
      // Check if application is for a job posted by the user
      application = await env.DB.prepare(`
        SELECT a.* 
        FROM job_applications a
        JOIN job_board j ON a.listing_id = j.id
        WHERE a.id = ? AND j.poster_id = ?
      `).bind(id, user.id).first();
    }
    
    // Check if application exists
    if (!application) {
      return createJsonResponse({ 
        error: 'Application not found' 
      }, 404);
    }
    
    // Update application status to withdrawn
    await env.DB.prepare(`
      UPDATE job_applications 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `).bind(
      'withdrawn',
      Math.floor(Date.now() / 1000), // Current timestamp
      id
    ).run();
    
    // Return success
    return createJsonResponse({ 
      success: true 
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    return createJsonResponse({ 
      error: 'Failed to withdraw application' 
    }, 500);
  }
}

/**
 * Handle saving a job
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 */
async function handleSaveJob(request, env, user) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.listing_id) {
      return createJsonResponse({ 
        error: 'Missing listing ID' 
      }, 400);
    }
    
    // Check if listing exists
    const listing = await env.DB.prepare(`
      SELECT * FROM job_board 
      WHERE id = ?
    `).bind(data.listing_id).first();
    
    if (!listing) {
      return createJsonResponse({ 
        error: 'Job listing not found' 
      }, 404);
    }
    
    // Check if already saved
    const existingSave = await env.DB.prepare(`
      SELECT * FROM saved_jobs 
      WHERE user_id = ? AND listing_id = ?
    `).bind(user.id, data.listing_id).first();
    
    if (existingSave) {
      return createJsonResponse({ 
        error: 'Job already saved' 
      }, 409);
    }
    
    // Generate saved job ID
    const savedJobId = crypto.randomUUID();
    
    // Store saved job in database
    await env.DB.prepare(`
      INSERT INTO saved_jobs (
        id, user_id, listing_id, saved_at
      ) VALUES (?, ?, ?, ?)
    `).bind(
      savedJobId,
      user.id,
      data.listing_id,
      Math.floor(Date.now() / 1000) // Current timestamp
    ).run();
    
    // Return success
    return createJsonResponse({ 
      success: true, 
      saved_job_id: savedJobId 
    }, 201);
  } catch (error) {
    console.error('Save job error:', error);
    return createJsonResponse({ 
      error: 'Failed to save job' 
    }, 500);
  }
}

/**
 * Handle retrieving saved jobs
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 */
async function handleGetSavedJobs(request, env, user) {
  try {
    // Get saved jobs from database
    const savedJobs = await env.DB.prepare(`
      SELECT s.id, s.saved_at, j.*
      FROM saved_jobs s
      JOIN job_board j ON s.listing_id = j.id
      WHERE s.user_id = ?
      ORDER BY s.saved_at DESC
    `).bind(user.id).all();
    
    // Return saved jobs
    return createJsonResponse({ 
      savedJobs: savedJobs.results 
    });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    return createJsonResponse({ 
      error: 'Failed to retrieve saved jobs' 
    }, 500);
  }
}

/**
 * Handle removing a saved job
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} user - Authenticated user
 * @param {string} id - Saved job ID
 */
async function handleRemoveSavedJob(request, env, user, id) {
  try {
    // Check if saved job exists and belongs to user
    const savedJob = await env.DB.prepare(`
      SELECT * FROM saved_jobs 
      WHERE id = ? AND user_id = ?
    `).bind(id, user.id).first();
    
    // Check if saved job exists
    if (!savedJob) {
      return createJsonResponse({ 
        error: 'Saved job not found' 
      }, 404);
    }
    
    // Delete saved job
    await env.DB.prepare(`
      DELETE FROM saved_jobs 
      WHERE id = ? AND user_id = ?
    `).bind(id, user.id).run();
    
    // Return success
    return createJsonResponse({ 
      success: true 
    });
  } catch (error) {
    console.error('Remove saved job error:', error);
    return createJsonResponse({ 
      error: 'Failed to remove saved job' 
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