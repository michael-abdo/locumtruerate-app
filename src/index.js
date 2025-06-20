import { EmailService } from './emailService.js';
import { ApplicationScoringService } from './scoringService.js';
import { AdvancedSearchService } from './searchService.js';
import { AutoRenewalService } from './autoRenewalService.js';
import { EnterpriseService } from './enterpriseService.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Input validation and sanitization utilities
function sanitizeString(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  const sanitized = input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, maxLength);
  
  return sanitized;
}

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  
  // At least 8 characters, with uppercase, lowercase, number
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasMinLength && hasUppercase && hasLowercase && hasNumber;
}

function validateURL(url) {
  if (!url) return true; // Optional field
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function validateJobData(job) {
  const errors = [];
  
  if (!job.title || job.title.length < 3 || job.title.length > 100) {
    errors.push('Job title must be between 3 and 100 characters');
  }
  
  if (!job.company || job.company.length < 2 || job.company.length > 100) {
    errors.push('Company name must be between 2 and 100 characters');
  }
  
  if (!job.location || job.location.length < 2 || job.location.length > 100) {
    errors.push('Location must be between 2 and 100 characters');
  }
  
  if (!job.description || job.description.length < 50 || job.description.length > 5000) {
    errors.push('Description must be between 50 and 5000 characters');
  }
  
  if (job.salary && job.salary.length > 50) {
    errors.push('Salary must be less than 50 characters');
  }
  
  const validTypes = ['full-time', 'part-time', 'contract', 'remote', 'internship'];
  if (job.type && !validTypes.includes(job.type)) {
    errors.push('Invalid job type');
  }
  
  const validCategories = ['engineering', 'design', 'marketing', 'sales', 'product', 'finance', 'hr', 'operations', 'other'];
  if (job.category && !validCategories.includes(job.category)) {
    errors.push('Invalid job category');
  }
  
  return errors;
}

function validateApplicationData(application) {
  const errors = [];
  
  if (!application.name || application.name.length < 2 || application.name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }
  
  if (!validateEmail(application.email)) {
    errors.push('Invalid email address');
  }
  
  if (!application.phone || application.phone.length < 10 || application.phone.length > 20) {
    errors.push('Phone number must be between 10 and 20 characters');
  }
  
  if (application.experience !== undefined && (isNaN(application.experience) || application.experience < 0 || application.experience > 50)) {
    errors.push('Experience must be a number between 0 and 50');
  }
  
  if (application.resume && !validateURL(application.resume)) {
    errors.push('Invalid resume URL');
  }
  
  if (!application.coverLetter || application.coverLetter.length < 50 || application.coverLetter.length > 2000) {
    errors.push('Cover letter must be between 50 and 2000 characters');
  }
  
  return errors;
}

// Rate limiting utility (simple in-memory implementation)
const rateLimitStore = new Map();

function checkRateLimit(ip, endpoint, maxRequests = 10, windowMs = 60000) {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get existing requests for this IP/endpoint
  let requests = rateLimitStore.get(key) || [];
  
  // Remove old requests outside the window
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (requests.length >= maxRequests) {
    return false;
  }
  
  // Add current request
  requests.push(now);
  rateLimitStore.set(key, requests);
  
  return true;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (url.pathname === '/') {
      return new Response('Job Board API', {
        headers: { 
          'content-type': 'text/plain',
          ...corsHeaders 
        },
      });
    }
    
    if (url.pathname === '/api/jobs' && request.method === 'GET') {
      return handleGetJobs(env);
    }
    
    if (url.pathname === '/api/jobs' && request.method === 'POST') {
      return handleCreateJob(request, env);
    }
    
    if (url.pathname.startsWith('/api/jobs/') && request.method === 'GET') {
      const id = url.pathname.split('/').pop();
      return handleGetJob(id, env);
    }
    
    if (url.pathname.startsWith('/api/jobs/') && request.method === 'PUT') {
      const id = url.pathname.split('/').pop();
      return handleUpdateJob(id, request, env);
    }
    
    if (url.pathname.startsWith('/api/jobs/') && request.method === 'DELETE') {
      const id = url.pathname.split('/').pop();
      return handleDeleteJob(id, env);
    }
    
    if (url.pathname === '/api/applications' && request.method === 'GET') {
      return handleGetApplications(env);
    }
    
    if (url.pathname === '/api/applications' && request.method === 'POST') {
      return handleCreateApplication(request, env);
    }
    
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }
    
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }
    
    if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
      return handleVerifyToken(request, env);
    }
    
    if (url.pathname.startsWith('/api/applications/') && url.pathname.endsWith('/status') && request.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      return handleUpdateApplicationStatus(id, request, env);
    }
    
    if (url.pathname === '/api/notifications' && request.method === 'GET') {
      return handleGetNotifications(request, env);
    }
    
    if (url.pathname.startsWith('/api/jobs/') && url.pathname.endsWith('/status') && request.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      return handleUpdateJobStatus(id, request, env);
    }
    
    if (url.pathname === '/api/jobs/expired' && request.method === 'GET') {
      return handleGetExpiredJobs(env);
    }
    
    if (url.pathname.startsWith('/api/jobs/') && url.pathname.endsWith('/extend') && request.method === 'POST') {
      const id = url.pathname.split('/')[3];
      return handleExtendJob(id, request, env);
    }
    
    if (url.pathname === '/api/jobs/bulk' && request.method === 'POST') {
      return handleBulkJobOperation(request, env);
    }
    
    if (url.pathname === '/api/jobs/bulk/delete' && request.method === 'POST') {
      return handleBulkDeleteJobs(request, env);
    }
    
    if (url.pathname === '/api/jobs/bulk/status' && request.method === 'PUT') {
      return handleBulkUpdateJobStatus(request, env);
    }
    
    if (url.pathname === '/api/jobs/bulk/extend' && request.method === 'POST') {
      return handleBulkExtendJobs(request, env);
    }
    
    if (url.pathname.startsWith('/api/applications/') && url.pathname.endsWith('/score') && request.method === 'GET') {
      const id = url.pathname.split('/')[3];
      return handleScoreApplication(id, env);
    }
    
    if (url.pathname.startsWith('/api/jobs/') && url.pathname.endsWith('/rankings') && request.method === 'GET') {
      const id = url.pathname.split('/')[3];
      return handleGetJobRankings(id, env);
    }
    
    if (url.pathname.startsWith('/api/jobs/') && url.pathname.endsWith('/analytics') && request.method === 'GET') {
      const id = url.pathname.split('/')[3];
      return handleGetJobAnalytics(id, env);
    }
    
    if (url.pathname === '/api/applications/batch-score' && request.method === 'POST') {
      return handleBatchScoreApplications(request, env);
    }
    
    if (url.pathname === '/api/search/jobs' && request.method === 'GET') {
      return handleAdvancedJobSearch(request, env);
    }
    
    if (url.pathname === '/api/search/suggestions' && request.method === 'GET') {
      return handleSearchSuggestions(request, env);
    }
    
    if (url.pathname === '/api/recommendations' && request.method === 'POST') {
      return handleJobRecommendations(request, env);
    }
    
    if (url.pathname === '/api/search/intelligent' && request.method === 'POST') {
      return handleIntelligentSearch(request, env);
    }
    
    if (url.pathname === '/api/renewals/process' && request.method === 'POST') {
      return handleProcessAutoRenewals(env);
    }
    
    if (url.pathname.startsWith('/api/jobs/') && url.pathname.endsWith('/recommendations') && request.method === 'GET') {
      const id = url.pathname.split('/')[3];
      return handleGetJobRecommendations(id, env);
    }
    
    if (url.pathname.startsWith('/api/jobs/') && url.pathname.endsWith('/auto-renewal') && request.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      return handleUpdateAutoRenewalSettings(id, request, env);
    }
    
    if (url.pathname === '/api/renewals/status' && request.method === 'GET') {
      return handleGetRenewalStatus(request, env);
    }
    
    // Enterprise endpoints
    if (url.pathname === '/api/enterprise/organizations' && request.method === 'POST') {
      return handleCreateOrganization(request, env);
    }
    
    if (url.pathname.startsWith('/api/enterprise/organizations/') && request.method === 'GET') {
      const orgId = url.pathname.split('/')[4];
      if (url.pathname.endsWith('/dashboard')) {
        return handleGetOrganizationDashboard(orgId, request, env);
      }
      return handleGetOrganization(orgId, env);
    }
    
    if (url.pathname.startsWith('/api/enterprise/organizations/') && url.pathname.includes('/companies') && request.method === 'POST') {
      const orgId = url.pathname.split('/')[4];
      return handleAddCompany(orgId, request, env);
    }
    
    if (url.pathname.startsWith('/api/enterprise/organizations/') && url.pathname.includes('/users') && request.method === 'POST') {
      const orgId = url.pathname.split('/')[4];
      return handleAddUser(orgId, request, env);
    }
    
    if (url.pathname.startsWith('/api/enterprise/companies/') && url.pathname.endsWith('/jobs') && request.method === 'POST') {
      const companyId = url.pathname.split('/')[4];
      return handleCreateCompanyJob(companyId, request, env);
    }
    
    if (url.pathname.startsWith('/api/enterprise/organizations/') && url.pathname.endsWith('/analytics') && request.method === 'GET') {
      const orgId = url.pathname.split('/')[4];
      return handleGetEnterpriseAnalytics(orgId, request, env);
    }
    
    // Public company profile endpoints
    if (url.pathname === '/api/companies' && request.method === 'GET') {
      return handleGetPublicCompanies(request, env);
    }
    
    if (url.pathname.startsWith('/api/companies/') && url.pathname.endsWith('/jobs') && request.method === 'GET') {
      const companyId = url.pathname.split('/')[3];
      return handleGetCompanyJobs(companyId, env);
    }
    
    if (url.pathname.startsWith('/api/companies/') && request.method === 'GET') {
      const companyId = url.pathname.split('/').pop();
      return handleGetCompanyProfile(companyId, env);
    }
    
    if (url.pathname.startsWith('/api/companies/') && url.pathname.endsWith('/profile') && request.method === 'PUT') {
      const companyId = url.pathname.split('/')[3];
      return handleUpdateCompanyProfile(companyId, request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  },
};

async function handleGetJobs(env) {
  const jobs = await env.JOBS.list();
  const jobList = [];
  const now = new Date();
  
  for (const key of jobs.keys) {
    const job = await env.JOBS.get(key.name);
    if (job) {
      const jobData = JSON.parse(job);
      
      // Check if job is expired and update status
      if (jobData.expiresAt && new Date(jobData.expiresAt) < now && jobData.status === 'active') {
        jobData.status = 'expired';
        await env.JOBS.put(key.name, JSON.stringify(jobData));
      }
      
      // Only return active jobs for public listings
      if (jobData.status === 'active') {
        jobList.push(jobData);
      }
    }
  }
  
  return new Response(JSON.stringify(jobList), {
    headers: { 
      'content-type': 'application/json',
      ...corsHeaders 
    },
  });
}

async function handleCreateJob(request, env) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, 'create-job', 5, 60000)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const rawJob = await request.json();
    
    // Validate job data
    const validationErrors = validateJobData(rawJob);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: validationErrors 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    // Sanitize input data
    const job = {
      title: sanitizeString(rawJob.title, 100),
      company: sanitizeString(rawJob.company, 100),
      location: sanitizeString(rawJob.location, 100),
      description: sanitizeString(rawJob.description, 5000),
      salary: sanitizeString(rawJob.salary, 50),
      type: rawJob.type,
      category: rawJob.category,
      tags: sanitizeString(rawJob.tags, 200),
      requirements: sanitizeString(rawJob.requirements, 2000),
      responsibilities: sanitizeString(rawJob.responsibilities, 2000),
      benefits: sanitizeString(rawJob.benefits, 1000),
      expirationDays: Math.min(Math.max(parseInt(rawJob.expirationDays) || 30, 1), 365)
    };
    
    const id = crypto.randomUUID();
    
    // Calculate expiration date (default: 30 days from now)
    const expirationDays = job.expirationDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    const jobWithId = { 
      ...job, 
      id, 
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      viewCount: 0
    };
    
    await env.JOBS.put(id, JSON.stringify(jobWithId));
    
    return new Response(JSON.stringify(jobWithId), {
      status: 201,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response('Invalid request', { 
      status: 400,
      headers: corsHeaders 
    });
  }
}

async function handleGetJob(id, env) {
  const job = await env.JOBS.get(id);
  
  if (!job) {
    return new Response('Job not found', { 
      status: 404,
      headers: corsHeaders 
    });
  }
  
  const jobData = JSON.parse(job);
  
  // Increment view count
  jobData.viewCount = (jobData.viewCount || 0) + 1;
  jobData.lastViewedAt = new Date().toISOString();
  
  // Check expiration status
  const now = new Date();
  if (jobData.expiresAt && new Date(jobData.expiresAt) < now && jobData.status === 'active') {
    jobData.status = 'expired';
  }
  
  // Update the job with new view count and status
  await env.JOBS.put(id, JSON.stringify(jobData));
  
  return new Response(JSON.stringify(jobData), {
    headers: { 
      'content-type': 'application/json',
      ...corsHeaders 
    },
  });
}

async function handleUpdateJob(id, request, env) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, 'update-job', 10, 60000)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    const existingJob = await env.JOBS.get(id);
    
    if (!existingJob) {
      return new Response(JSON.stringify({ error: 'Job not found' }), { 
        status: 404,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const rawUpdates = await request.json();
    const existingJobData = JSON.parse(existingJob);
    
    // Validate updated job data if provided
    if (Object.keys(rawUpdates).length > 0) {
      const mergedJob = { ...existingJobData, ...rawUpdates };
      const validationErrors = validateJobData(mergedJob);
      if (validationErrors.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed',
          details: validationErrors 
        }), {
          status: 400,
          headers: { 
            'content-type': 'application/json',
            ...corsHeaders 
          },
        });
      }
    }
    
    // Sanitize update data
    const sanitizedUpdates = {};
    Object.keys(rawUpdates).forEach(key => {
      switch (key) {
        case 'title':
          sanitizedUpdates[key] = sanitizeString(rawUpdates[key], 100);
          break;
        case 'company':
          sanitizedUpdates[key] = sanitizeString(rawUpdates[key], 100);
          break;
        case 'location':
          sanitizedUpdates[key] = sanitizeString(rawUpdates[key], 100);
          break;
        case 'description':
          sanitizedUpdates[key] = sanitizeString(rawUpdates[key], 5000);
          break;
        case 'salary':
          sanitizedUpdates[key] = sanitizeString(rawUpdates[key], 50);
          break;
        case 'tags':
          sanitizedUpdates[key] = sanitizeString(rawUpdates[key], 200);
          break;
        case 'requirements':
          sanitizedUpdates[key] = sanitizeString(rawUpdates[key], 2000);
          break;
        case 'responsibilities':
          sanitizedUpdates[key] = sanitizeString(rawUpdates[key], 2000);
          break;
        case 'benefits':
          sanitizedUpdates[key] = sanitizeString(rawUpdates[key], 1000);
          break;
        case 'type':
        case 'category':
        case 'status':
          sanitizedUpdates[key] = rawUpdates[key]; // These are controlled values
          break;
        case 'expirationDays':
          sanitizedUpdates[key] = Math.min(Math.max(parseInt(rawUpdates[key]) || 30, 1), 365);
          break;
      }
    });
    
    const updatedJob = { 
      ...existingJobData, 
      ...sanitizedUpdates, 
      id, 
      updatedAt: new Date().toISOString() 
    };
    
    await env.JOBS.put(id, JSON.stringify(updatedJob));
    
    return new Response(JSON.stringify(updatedJob), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { 
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

async function handleDeleteJob(id, env) {
  const job = await env.JOBS.get(id);
  
  if (!job) {
    return new Response('Job not found', { 
      status: 404,
      headers: corsHeaders 
    });
  }
  
  await env.JOBS.delete(id);
  
  return new Response('Job deleted successfully', {
    headers: corsHeaders,
  });
}

async function handleGetApplications(env) {
  const applications = await env.APPLICATIONS.list();
  const applicationList = [];
  
  for (const key of applications.keys) {
    const application = await env.APPLICATIONS.get(key.name);
    if (application) {
      applicationList.push(JSON.parse(application));
    }
  }
  
  return new Response(JSON.stringify(applicationList), {
    headers: { 
      'content-type': 'application/json',
      ...corsHeaders 
    },
  });
}

async function handleCreateApplication(request, env) {
  try {
    // Rate limiting for applications
    const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, 'create-application', 3, 300000)) { // 3 applications per 5 minutes
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before submitting another application.' }), {
        status: 429,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const rawApplication = await request.json();
    
    // Validate application data
    const validationErrors = validateApplicationData(rawApplication);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: validationErrors 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    // Sanitize input data
    const application = {
      jobId: rawApplication.jobId,
      name: sanitizeString(rawApplication.name, 100),
      email: sanitizeString(rawApplication.email, 254),
      phone: sanitizeString(rawApplication.phone, 20),
      experience: Math.max(0, Math.min(parseInt(rawApplication.experience) || 0, 50)),
      resume: rawApplication.resume && validateURL(rawApplication.resume) ? rawApplication.resume : '',
      coverLetter: sanitizeString(rawApplication.coverLetter, 2000),
      clientIP: clientIP
    };
    
    const id = crypto.randomUUID();
    const applicationWithId = { 
      ...application, 
      id, 
      appliedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    await env.APPLICATIONS.put(id, JSON.stringify(applicationWithId));
    
    // Send email notifications asynchronously (fire and forget)
    sendApplicationNotifications(applicationWithId, env).catch(error => {
      console.error('Failed to send application notifications:', error);
    });
    
    return new Response(JSON.stringify(applicationWithId), {
      status: 201,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response('Invalid request', { 
      status: 400,
      headers: corsHeaders 
    });
  }
}

// Send email notifications for new applications
async function sendApplicationNotifications(application, env) {
  try {
    const emailService = new EmailService(env);
    
    // Get job details
    const jobData = await env.JOBS.get(application.jobId);
    if (!jobData) return;
    
    const job = JSON.parse(jobData);
    
    // Send confirmation to applicant
    await emailService.confirmApplicationSubmission(application, job);
    
    // For demo purposes, we'll skip employer notification
    // In production, you would:
    // 1. Get employer details from job or separate lookup
    // 2. Send notification to employer
    // const employer = await getEmployerForJob(job, env);
    // await emailService.notifyNewApplication(application, job, employer);
    
  } catch (error) {
    console.error('Failed to send application notifications:', error);
  }
}

// Secure password hashing using PBKDF2
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Combine salt and hash
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Return base64 encoded result
  return Array.from(combined)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify password against hash
async function verifyPassword(password, hash) {
  try {
    // Convert hex string back to bytes
    const combined = new Uint8Array(hash.match(/.{2}/g).map(byte => parseInt(byte, 16)));
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);
    
    // Hash the provided password with the stored salt
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const newHash = new Uint8Array(derivedBits);
    
    // Compare hashes
    if (newHash.length !== storedHash.length) return false;
    for (let i = 0; i < newHash.length; i++) {
      if (newHash[i] !== storedHash[i]) return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

// JWT secret key (in production, use environment variable)
const JWT_SECRET = 'your-secret-key-change-in-production';

// Helper function to check authentication
async function requireAuth(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  
  if (!payload) {
    throw new Error('Invalid or expired token');
  }
  
  return payload;
}

// Centralized error handling
function createErrorResponse(error, status = 500) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  // Log error for debugging (in production, use proper logging service)
  console.error('API Error:', error);
  
  return new Response(JSON.stringify({ 
    error: errorMessage,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: { 
      'content-type': 'application/json',
      ...corsHeaders 
    },
  });
}

// Wrapper for protected endpoints
async function withAuth(handler) {
  return async (request, env, ...args) => {
    try {
      const payload = await requireAuth(request);
      return await handler(request, env, payload, ...args);
    } catch (error) {
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        return createErrorResponse(error, 401);
      }
      return createErrorResponse(error);
    }
  };
}

// Wrapper for all endpoints with error handling
async function withErrorHandling(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}

// Generate proper JWT token
async function generateToken(employerId, email) {
  const payload = {
    sub: employerId,
    email: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iss: 'job-board-api'
  };
  
  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
  
  // Create signature
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  
  return `${data}.${encodedSignature}`;
}

// Verify JWT token
async function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data));
    
    if (!isValid) return null;
    
    // Decode and verify payload
    const payload = JSON.parse(atob(payloadB64));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    
    return payload;
  } catch (error) {
    return null; // Invalid token
  }
}

async function handleRegister(request, env) {
  try {
    // Rate limiting for registration
    const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, 'register', 3, 300000)) { // 3 registrations per 5 minutes
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    const { companyName, contactName, email, password } = await request.json();
    
    // Validate input data
    if (!email || !validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    if (!password || !validatePassword(password)) {
      return new Response(JSON.stringify({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    if (!companyName || companyName.length < 2 || companyName.length > 100) {
      return new Response(JSON.stringify({ error: 'Company name must be between 2 and 100 characters' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    if (!contactName || contactName.length < 2 || contactName.length > 100) {
      return new Response(JSON.stringify({ error: 'Contact name must be between 2 and 100 characters' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    // Check if employer already exists
    const existingEmployer = await env.EMPLOYERS.get(email);
    if (existingEmployer) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Sanitize input data
    const employer = {
      id: crypto.randomUUID(),
      companyName: sanitizeString(companyName, 100),
      contactName: sanitizeString(contactName, 100),
      email: sanitizeString(email, 254),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      isVerified: true // Auto-verify for demo
    };
    
    await env.EMPLOYERS.put(email, JSON.stringify(employer));
    
    // Return employer data without password
    const { password: _, ...employerData } = employer;
    
    return new Response(JSON.stringify({ 
      message: 'Registration successful',
      employer: employerData 
    }), {
      status: 201,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();
    
    // Get employer record
    const employerData = await env.EMPLOYERS.get(email);
    if (!employerData) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const employer = JSON.parse(employerData);
    
    // Verify password using new secure method
    const isValidPassword = await verifyPassword(password, employer.password);
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    // Generate token
    const token = await generateToken(employer.id, employer.email);
    
    // Return employer data without password
    const { password: _, ...employerInfo } = employer;
    
    return new Response(JSON.stringify({ 
      token,
      employer: employerInfo 
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

async function handleVerifyToken(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No token provided' }), {
        status: 401,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    return new Response(JSON.stringify({ 
      valid: true,
      employerId: payload.sub,
      email: payload.email
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Token verification failed' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Update application status and send notifications
async function handleUpdateApplicationStatus(applicationId, request, env) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, 'update-application', 20, 60000)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    const { status, message = '' } = await request.json();
    
    // Validate status
    const validStatuses = ['pending', 'reviewing', 'interviewing', 'hired', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    // Validate and sanitize message
    const sanitizedMessage = sanitizeString(message, 500);
    
    // Get existing application
    const applicationData = await env.APPLICATIONS.get(applicationId);
    if (!applicationData) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const application = JSON.parse(applicationData);
    
    // Update application status
    const updatedApplication = {
      ...application,
      status,
      statusUpdatedAt: new Date().toISOString(),
      statusMessage: sanitizedMessage
    };
    
    await env.APPLICATIONS.put(applicationId, JSON.stringify(updatedApplication));
    
    // Send status update notification asynchronously
    if (status !== application.status) {
      try {
        const emailService = new EmailService(env);
        const jobData = await env.JOBS.get(application.jobId);
        
        if (jobData) {
          const job = JSON.parse(jobData);
          await emailService.notifyApplicationStatusChange(updatedApplication, job, status, sanitizedMessage);
        }
      } catch (emailError) {
        console.error('Failed to send status update notification:', emailError);
      }
    }
    
    return new Response(JSON.stringify(updatedApplication), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update application status' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get notification history
async function handleGetNotifications(request, env) {
  try {
    const url = new URL(request.url);
    const filters = {
      type: url.searchParams.get('type'),
      status: url.searchParams.get('status'),
      recipientId: url.searchParams.get('recipientId')
    };
    
    // Remove null values
    Object.keys(filters).forEach(key => filters[key] === null && delete filters[key]);
    
    const emailService = new EmailService(env);
    const notifications = await emailService.getNotificationHistory(filters);
    
    return new Response(JSON.stringify(notifications), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get notifications' }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Update job status (active, inactive, expired)
async function handleUpdateJobStatus(jobId, request, env) {
  try {
    const { status } = await request.json();
    
    if (!['active', 'inactive', 'expired'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const jobData = await env.JOBS.get(jobId);
    if (!jobData) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const job = JSON.parse(jobData);
    job.status = status;
    job.statusUpdatedAt = new Date().toISOString();
    
    await env.JOBS.put(jobId, JSON.stringify(job));
    
    return new Response(JSON.stringify(job), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update job status' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get expired jobs for management
async function handleGetExpiredJobs(env) {
  try {
    const jobs = await env.JOBS.list();
    const expiredJobs = [];
    const now = new Date();
    
    for (const key of jobs.keys) {
      const job = await env.JOBS.get(key.name);
      if (job) {
        const jobData = JSON.parse(job);
        
        if (jobData.expiresAt && new Date(jobData.expiresAt) < now) {
          expiredJobs.push(jobData);
        }
      }
    }
    
    return new Response(JSON.stringify(expiredJobs), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get expired jobs' }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Extend job expiration date
async function handleExtendJob(jobId, request, env) {
  try {
    const { days = 30 } = await request.json();
    
    const jobData = await env.JOBS.get(jobId);
    if (!jobData) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const job = JSON.parse(jobData);
    
    // Extend expiration date
    const newExpirationDate = new Date();
    newExpirationDate.setDate(newExpirationDate.getDate() + days);
    
    job.expiresAt = newExpirationDate.toISOString();
    job.extendedAt = new Date().toISOString();
    job.status = 'active'; // Reactivate if expired
    
    await env.JOBS.put(jobId, JSON.stringify(job));
    
    return new Response(JSON.stringify(job), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to extend job' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Generic bulk operation handler
async function handleBulkJobOperation(request, env) {
  try {
    const { operation, jobIds, params = {} } = await request.json();
    
    if (!operation || !jobIds || !Array.isArray(jobIds)) {
      return new Response(JSON.stringify({ error: 'Invalid bulk operation request' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const results = [];
    
    for (const jobId of jobIds) {
      try {
        let result;
        
        switch (operation) {
          case 'activate':
          case 'deactivate':
            result = await updateJobStatusById(jobId, operation === 'activate' ? 'active' : 'inactive', env);
            break;
          case 'extend':
            result = await extendJobById(jobId, params.days || 30, env);
            break;
          case 'delete':
            result = await deleteJobById(jobId, env);
            break;
          default:
            result = { success: false, error: `Unknown operation: ${operation}` };
        }
        
        results.push({ jobId, ...result });
      } catch (error) {
        results.push({ jobId, success: false, error: error.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    return new Response(JSON.stringify({ 
      success: true,
      summary: { total: results.length, successful, failed },
      results 
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Bulk operation failed' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Bulk delete jobs
async function handleBulkDeleteJobs(request, env) {
  try {
    const { jobIds } = await request.json();
    
    if (!jobIds || !Array.isArray(jobIds)) {
      return new Response(JSON.stringify({ error: 'Invalid job IDs provided' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const results = [];
    
    for (const jobId of jobIds) {
      try {
        const result = await deleteJobById(jobId, env);
        results.push({ jobId, ...result });
      } catch (error) {
        results.push({ jobId, success: false, error: error.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    
    return new Response(JSON.stringify({ 
      success: true,
      deleted: successful,
      total: jobIds.length,
      results 
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Bulk delete failed' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Bulk update job status
async function handleBulkUpdateJobStatus(request, env) {
  try {
    const { jobIds, status } = await request.json();
    
    if (!jobIds || !Array.isArray(jobIds) || !status) {
      return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    if (!['active', 'inactive', 'expired'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status value' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const results = [];
    
    for (const jobId of jobIds) {
      try {
        const result = await updateJobStatusById(jobId, status, env);
        results.push({ jobId, ...result });
      } catch (error) {
        results.push({ jobId, success: false, error: error.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    
    return new Response(JSON.stringify({ 
      success: true,
      updated: successful,
      total: jobIds.length,
      results 
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Bulk status update failed' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Bulk extend jobs
async function handleBulkExtendJobs(request, env) {
  try {
    const { jobIds, days = 30 } = await request.json();
    
    if (!jobIds || !Array.isArray(jobIds)) {
      return new Response(JSON.stringify({ error: 'Invalid job IDs provided' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const results = [];
    
    for (const jobId of jobIds) {
      try {
        const result = await extendJobById(jobId, days, env);
        results.push({ jobId, ...result });
      } catch (error) {
        results.push({ jobId, success: false, error: error.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    
    return new Response(JSON.stringify({ 
      success: true,
      extended: successful,
      total: jobIds.length,
      results 
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Bulk extend failed' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Helper functions for bulk operations
async function updateJobStatusById(jobId, status, env) {
  const jobData = await env.JOBS.get(jobId);
  
  if (!jobData) {
    return { success: false, error: 'Job not found' };
  }
  
  const job = JSON.parse(jobData);
  job.status = status;
  job.statusUpdatedAt = new Date().toISOString();
  
  await env.JOBS.put(jobId, JSON.stringify(job));
  
  return { success: true, message: `Status updated to ${status}` };
}

async function extendJobById(jobId, days, env) {
  const jobData = await env.JOBS.get(jobId);
  
  if (!jobData) {
    return { success: false, error: 'Job not found' };
  }
  
  const job = JSON.parse(jobData);
  
  // Extend expiration date
  const newExpirationDate = new Date();
  newExpirationDate.setDate(newExpirationDate.getDate() + days);
  
  job.expiresAt = newExpirationDate.toISOString();
  job.extendedAt = new Date().toISOString();
  job.status = 'active'; // Reactivate if expired
  
  await env.JOBS.put(jobId, JSON.stringify(job));
  
  return { success: true, message: `Extended by ${days} days` };
}

async function deleteJobById(jobId, env) {
  const jobData = await env.JOBS.get(jobId);
  
  if (!jobData) {
    return { success: false, error: 'Job not found' };
  }
  
  await env.JOBS.delete(jobId);
  
  return { success: true, message: 'Job deleted successfully' };
}

// Score a single application
async function handleScoreApplication(applicationId, env) {
  try {
    const applicationData = await env.APPLICATIONS.get(applicationId);
    if (!applicationData) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    const application = JSON.parse(applicationData);
    
    // Get the job details
    const jobData = await env.JOBS.get(application.jobId);
    if (!jobData) {
      return new Response(JSON.stringify({ error: 'Associated job not found' }), {
        status: 404,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    const job = JSON.parse(jobData);
    const scoringService = new ApplicationScoringService(env);
    const scoring = await scoringService.scoreApplication(application, job);

    // Store the scoring in the application record
    const updatedApplication = {
      ...application,
      scoring,
      scoringUpdatedAt: new Date().toISOString()
    };
    
    await env.APPLICATIONS.put(applicationId, JSON.stringify(updatedApplication));

    return new Response(JSON.stringify({ 
      applicationId,
      scoring 
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to score application' }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get ranked applications for a job
async function handleGetJobRankings(jobId, env) {
  try {
    const scoringService = new ApplicationScoringService(env);
    const rankedApplications = await scoringService.rankApplicationsForJob(jobId);

    return new Response(JSON.stringify({ 
      jobId,
      applications: rankedApplications,
      count: rankedApplications.length,
      generatedAt: new Date().toISOString()
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get job rankings' }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get application analytics for a job
async function handleGetJobAnalytics(jobId, env) {
  try {
    const scoringService = new ApplicationScoringService(env);
    const analytics = await scoringService.generateJobApplicationAnalytics(jobId);

    if (!analytics) {
      return new Response(JSON.stringify({ error: 'Failed to generate analytics' }), {
        status: 500,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    return new Response(JSON.stringify({ 
      jobId,
      analytics,
      generatedAt: new Date().toISOString()
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get job analytics' }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Batch score multiple applications
async function handleBatchScoreApplications(request, env) {
  try {
    const { applicationIds } = await request.json();
    
    if (!applicationIds || !Array.isArray(applicationIds)) {
      return new Response(JSON.stringify({ error: 'Invalid application IDs provided' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    const scoringService = new ApplicationScoringService(env);
    const results = [];

    for (const applicationId of applicationIds) {
      try {
        const applicationData = await env.APPLICATIONS.get(applicationId);
        if (!applicationData) {
          results.push({ applicationId, error: 'Application not found' });
          continue;
        }

        const application = JSON.parse(applicationData);
        const jobData = await env.JOBS.get(application.jobId);
        
        if (!jobData) {
          results.push({ applicationId, error: 'Associated job not found' });
          continue;
        }

        const job = JSON.parse(jobData);
        const scoring = await scoringService.scoreApplication(application, job);

        // Update application with scoring
        const updatedApplication = {
          ...application,
          scoring,
          scoringUpdatedAt: new Date().toISOString()
        };
        
        await env.APPLICATIONS.put(applicationId, JSON.stringify(updatedApplication));

        results.push({ 
          applicationId, 
          scoring: scoring.totalScore, 
          recommendation: scoring.recommendation,
          success: true 
        });
      } catch (error) {
        results.push({ applicationId, error: error.message, success: false });
      }
    }

    const successful = results.filter(r => r.success).length;

    return new Response(JSON.stringify({ 
      results,
      summary: {
        total: applicationIds.length,
        successful,
        failed: applicationIds.length - successful
      },
      processedAt: new Date().toISOString()
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Batch scoring failed' }), {
      status: 400,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Advanced job search with AI-powered matching
async function handleAdvancedJobSearch(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category');
    const location = url.searchParams.get('location');
    const experience = url.searchParams.get('experience');
    const jobType = url.searchParams.get('type');
    const minSalary = url.searchParams.get('minSalary');
    const maxSalary = url.searchParams.get('maxSalary');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    
    const filters = {};
    if (category) filters.category = category;
    if (location) filters.location = location;
    if (experience) filters.experience = experience;
    if (jobType) filters.jobType = jobType;
    if (minSalary) filters.minSalary = minSalary;
    if (maxSalary) filters.maxSalary = maxSalary;
    
    const searchService = new AdvancedSearchService(env);
    const results = await searchService.searchJobs(query, filters);
    
    // Apply limit
    const limitedResults = {
      ...results,
      jobs: results.jobs.slice(0, limit)
    };
    
    return new Response(JSON.stringify(limitedResults), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get search suggestions and autocomplete
async function handleSearchSuggestions(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    const searchService = new AdvancedSearchService(env);
    const suggestions = await searchService.getSearchSuggestions(query, limit);
    
    return new Response(JSON.stringify({ 
      suggestions,
      query,
      count: suggestions.length 
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get suggestions' }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get personalized job recommendations
async function handleJobRecommendations(request, env) {
  try {
    const userProfile = await request.json();
    const limit = userProfile.limit || 10;
    
    // Validate user profile
    if (!userProfile.skills && !userProfile.experience && !userProfile.preferredCategories) {
      return new Response(JSON.stringify({ error: 'User profile must include skills, experience, or preferred categories' }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const searchService = new AdvancedSearchService(env);
    const recommendations = await searchService.getPersonalizedRecommendations(userProfile, limit);
    
    return new Response(JSON.stringify(recommendations), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate recommendations' }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Intelligent search with semantic understanding
async function handleIntelligentSearch(request, env) {
  try {
    const { query, userContext, preferences } = await request.json();
    
    const searchService = new AdvancedSearchService(env);
    
    // Combine search with personalization if user context provided
    let results;
    if (userContext && Object.keys(userContext).length > 0) {
      // First get search results
      const searchResults = await searchService.searchJobs(query, preferences || {});
      
      // Then get personalized recommendations
      const recommendations = await searchService.getPersonalizedRecommendations(userContext, 20);
      
      // Merge and re-rank results
      const combinedJobs = new Map();
      
      // Add search results with search scores
      searchResults.jobs.forEach(job => {
        combinedJobs.set(job.id, {
          ...job,
          combinedScore: job.searchScore * 0.7,
          sources: ['search']
        });
      });
      
      // Add recommendation results with recommendation scores
      recommendations.recommendations.forEach(job => {
        if (combinedJobs.has(job.id)) {
          const existing = combinedJobs.get(job.id);
          existing.combinedScore += job.recommendationScore * 0.3;
          existing.sources.push('recommendation');
        } else {
          combinedJobs.set(job.id, {
            ...job,
            combinedScore: job.recommendationScore * 0.3,
            sources: ['recommendation']
          });
        }
      });
      
      // Sort by combined score
      const finalResults = Array.from(combinedJobs.values())
        .sort((a, b) => b.combinedScore - a.combinedScore);
      
      results = {
        jobs: finalResults,
        query,
        totalResults: finalResults.length,
        searchTime: Date.now(),
        isPersonalized: true,
        userContext
      };
    } else {
      // Standard search without personalization
      results = await searchService.searchJobs(query, preferences || {});
    }
    
    return new Response(JSON.stringify(results), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Intelligent search failed' }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Process auto-renewals (typically called by cron job)
async function handleProcessAutoRenewals(env) {
  try {
    const autoRenewalService = new AutoRenewalService(env);
    const results = await autoRenewalService.processAutoRenewals();
    
    return new Response(JSON.stringify({
      success: true,
      processedAt: new Date().toISOString(),
      results
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Auto-renewal processing failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get smart recommendations for job optimization
async function handleGetJobRecommendations(jobId, env) {
  try {
    const autoRenewalService = new AutoRenewalService(env);
    const recommendations = await autoRenewalService.generateJobRecommendations(jobId);
    
    return new Response(JSON.stringify(recommendations), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to generate recommendations',
      jobId,
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Update auto-renewal settings for a specific job
async function handleUpdateAutoRenewalSettings(jobId, request, env) {
  try {
    const settings = await request.json();
    
    // Validate settings
    const validKeys = ['enabled', 'maxRenewals', 'renewalPeriodDays', 'warningDaysBefore', 'autoRenewConditions'];
    const invalidKeys = Object.keys(settings).filter(key => !validKeys.includes(key));
    
    if (invalidKeys.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid settings keys',
        invalidKeys 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    // Get existing job
    const jobData = await env.JOBS.get(jobId);
    if (!jobData) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const job = JSON.parse(jobData);
    
    // Update auto-renewal settings
    const updatedJob = {
      ...job,
      autoRenewal: settings.enabled !== false, // Default to enabled
      renewalSettings: {
        ...job.renewalSettings,
        ...settings
      },
      updatedAt: new Date().toISOString()
    };
    
    await env.JOBS.put(jobId, JSON.stringify(updatedJob));
    
    return new Response(JSON.stringify({ 
      success: true,
      jobId,
      updatedSettings: updatedJob.renewalSettings
    }), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to update auto-renewal settings',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get renewal status and upcoming renewals
async function handleGetRenewalStatus(request, env) {
  try {
    const url = new URL(request.url);
    const daysAhead = parseInt(url.searchParams.get('days')) || 30;
    
    const autoRenewalService = new AutoRenewalService(env);
    const allJobs = await autoRenewalService.getAllJobs();
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
    
    const upcomingRenewals = [];
    const autoRenewalEnabled = [];
    const recentlyRenewed = [];
    
    allJobs.forEach(job => {
      const expiresAt = new Date(job.expiresAt);
      const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      
      // Upcoming renewals (within specified days)
      if (expiresAt <= cutoffDate && job.status === 'active') {
        upcomingRenewals.push({
          jobId: job.id,
          title: job.title,
          company: job.company,
          expiresAt: job.expiresAt,
          daysUntilExpiry,
          autoRenewalEnabled: job.autoRenewal !== false,
          renewalCount: job.renewalCount || 0
        });
      }
      
      // Jobs with auto-renewal enabled
      if (job.autoRenewal !== false) {
        autoRenewalEnabled.push({
          jobId: job.id,
          title: job.title,
          renewalCount: job.renewalCount || 0,
          maxRenewals: job.renewalSettings?.maxRenewals || 3
        });
      }
      
      // Recently renewed jobs (last 7 days)
      if (job.lastRenewalAt) {
        const renewalDate = new Date(job.lastRenewalAt);
        const daysSinceRenewal = Math.ceil((now - renewalDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceRenewal <= 7) {
          recentlyRenewed.push({
            jobId: job.id,
            title: job.title,
            renewedAt: job.lastRenewalAt,
            daysSinceRenewal
          });
        }
      }
    });
    
    // Sort upcoming renewals by expiry date
    upcomingRenewals.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
    
    const status = {
      totalJobs: allJobs.length,
      activeJobs: allJobs.filter(job => job.status === 'active').length,
      autoRenewalEnabledCount: autoRenewalEnabled.length,
      upcomingRenewalsCount: upcomingRenewals.length,
      recentlyRenewedCount: recentlyRenewed.length,
      upcomingRenewals: upcomingRenewals.slice(0, 20), // Limit to 20 for performance
      autoRenewalEnabled: autoRenewalEnabled.slice(0, 20),
      recentlyRenewed,
      generatedAt: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(status), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get renewal status',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Enterprise Management Endpoints

// Create new organization
async function handleCreateOrganization(request, env) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.createdBy || !data.creatorEmail) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: name, createdBy, creatorEmail' 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const enterpriseService = new EnterpriseService(env);
    const result = await enterpriseService.createOrganization(data);
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to create organization',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get organization details
async function handleGetOrganization(organizationId, env) {
  try {
    const enterpriseService = new EnterpriseService(env);
    const organization = await enterpriseService.getOrganization(organizationId);
    
    if (!organization) {
      return new Response(JSON.stringify({ 
        error: 'Organization not found' 
      }), {
        status: 404,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    return new Response(JSON.stringify(organization), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get organization',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get organization dashboard
async function handleGetOrganizationDashboard(organizationId, request, env) {
  try {
    // Extract user ID from auth header (in production, would verify JWT)
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader ? authHeader.split(' ')[1] : 'demo-user';
    
    const enterpriseService = new EnterpriseService(env);
    const dashboard = await enterpriseService.getOrganizationDashboard(organizationId, userId);
    
    return new Response(JSON.stringify(dashboard), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get dashboard',
      details: error.message 
    }), {
      status: error.message.includes('permissions') ? 403 : 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Add company to organization
async function handleAddCompany(organizationId, request, env) {
  try {
    const companyData = await request.json();
    
    if (!companyData.name) {
      return new Response(JSON.stringify({ 
        error: 'Company name is required' 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const enterpriseService = new EnterpriseService(env);
    const companyId = await enterpriseService.addCompanyToOrganization(organizationId, companyData);
    
    return new Response(JSON.stringify({ 
      success: true,
      companyId,
      message: 'Company added successfully'
    }), {
      status: 201,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to add company',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Add user to organization
async function handleAddUser(organizationId, request, env) {
  try {
    const userData = await request.json();
    
    if (!userData.email || !userData.name || !userData.role) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: email, name, role' 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    const enterpriseService = new EnterpriseService(env);
    const result = await enterpriseService.addUserToOrganization(organizationId, userData);
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), {
        status: 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to add user',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Create job for company
async function handleCreateCompanyJob(companyId, request, env) {
  try {
    const jobData = await request.json();
    
    // Extract user ID from auth header
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader ? authHeader.split(' ')[1] : 'demo-user';
    
    const enterpriseService = new EnterpriseService(env);
    const result = await enterpriseService.createJobForCompany(companyId, jobData, userId);
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), {
        status: result.error.includes('permissions') ? 403 : 400,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to create job',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Get enterprise analytics
async function handleGetEnterpriseAnalytics(organizationId, request, env) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const groupBy = url.searchParams.get('groupBy') || 'day';
    
    const enterpriseService = new EnterpriseService(env);
    const analytics = await enterpriseService.getEnterpriseAnalytics(organizationId, {
      startDate,
      endDate,
      groupBy
    });
    
    return new Response(JSON.stringify(analytics), {
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get analytics',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'content-type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}

// Public Company Profile Endpoints

// Get list of companies with public profiles
async function handleGetPublicCompanies(request, env) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 20;
    const industry = url.searchParams.get("industry");
    const location = url.searchParams.get("location");
    const search = url.searchParams.get("search");
    
    const companies = await env.COMPANIES.list();
    const publicCompanies = [];
    
    for (const key of companies.keys) {
      const companyData = await env.COMPANIES.get(key.name);
      if (companyData) {
        const company = JSON.parse(companyData);
        
        // Check if company has public profile enabled
        const orgData = await env.ORGANIZATIONS.get(company.organizationId);
        if (orgData) {
          const org = JSON.parse(orgData);
          if (org.settings?.allowPublicProfiles && company.status === "active") {
            // Apply filters
            if (industry && company.industry !== industry) continue;
            if (location && !company.location?.toLowerCase().includes(location.toLowerCase())) continue;
            if (search && !company.name.toLowerCase().includes(search.toLowerCase()) &&
                !company.description?.toLowerCase().includes(search.toLowerCase())) continue;
            
            // Get job count
            const jobCount = await getActiveJobCountForCompany(company.id, env);
            
            // Build public profile data
            const publicProfile = {
              id: company.id,
              name: company.name,
              logo: company.logo,
              industry: company.industry,
              location: company.location,
              size: company.size,
              website: company.website,
              description: company.publicProfile?.description || company.description,
              activeJobCount: jobCount,
              benefits: company.publicProfile?.benefits || [],
              culture: company.publicProfile?.culture || "",
              founded: company.publicProfile?.founded,
              socialLinks: company.publicProfile?.socialLinks || {}
            };
            
            publicCompanies.push(publicProfile);
          }
        }
      }
    }
    
    // Sort by active job count
    publicCompanies.sort((a, b) => b.activeJobCount - a.activeJobCount);
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedCompanies = publicCompanies.slice(startIndex, endIndex);
    
    return new Response(JSON.stringify({
      companies: paginatedCompanies,
      total: publicCompanies.length,
      page,
      limit,
      hasMore: endIndex < publicCompanies.length
    }), {
      headers: { 
        "content-type": "application/json",
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get companies" }), {
      status: 500,
      headers: { 
        "content-type": "application/json",
        ...corsHeaders 
      },
    });
  }
}

// Get company public profile
async function handleGetCompanyProfile(companyId, env) {
  try {
    const companyData = await env.COMPANIES.get(companyId);
    if (!companyData) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { 
          "content-type": "application/json",
          ...corsHeaders 
        },
      });
    }
    
    const company = JSON.parse(companyData);
    
    // Check if public profiles are enabled
    const orgData = await env.ORGANIZATIONS.get(company.organizationId);
    if (!orgData) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { 
          "content-type": "application/json",
          ...corsHeaders 
        },
      });
    }
    
    const org = JSON.parse(orgData);
    if (!org.settings?.allowPublicProfiles) {
      return new Response(JSON.stringify({ error: "Public profiles not enabled" }), {
        status: 403,
        headers: { 
          "content-type": "application/json",
          ...corsHeaders 
        },
      });
    }
    
    // Get additional stats
    const jobCount = await getActiveJobCountForCompany(companyId, env);
    const recentJobs = await getRecentJobsForCompany(companyId, env, 5);
    
    // Build comprehensive public profile
    const publicProfile = {
      id: company.id,
      name: company.name,
      logo: company.logo,
      industry: company.industry,
      location: company.location,
      size: company.size,
      website: company.website,
      description: company.publicProfile?.description || company.description,
      longDescription: company.publicProfile?.longDescription,
      mission: company.publicProfile?.mission,
      values: company.publicProfile?.values || [],
      benefits: company.publicProfile?.benefits || [],
      culture: company.publicProfile?.culture || "",
      techStack: company.publicProfile?.techStack || [],
      founded: company.publicProfile?.founded,
      employeeCount: company.publicProfile?.employeeCount,
      socialLinks: company.publicProfile?.socialLinks || {},
      photos: company.publicProfile?.photos || [],
      videos: company.publicProfile?.videos || [],
      awards: company.publicProfile?.awards || [],
      stats: {
        activeJobs: jobCount,
        totalApplications: company.stats?.totalApplications || 0,
        responseTime: company.publicProfile?.avgResponseTime || "Within 1 week"
      },
      recentJobs,
      lastUpdated: company.publicProfile?.lastUpdated || company.createdAt
    };
    
    return new Response(JSON.stringify(publicProfile), {
      headers: { 
        "content-type": "application/json",
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get company profile" }), {
      status: 500,
      headers: { 
        "content-type": "application/json",
        ...corsHeaders 
      },
    });
  }
}

// Get active jobs for a company
async function handleGetCompanyJobs(companyId, env) {
  try {
    const companyData = await env.COMPANIES.get(companyId);
    if (!companyData) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { 
          "content-type": "application/json",
          ...corsHeaders 
        },
      });
    }
    
    const company = JSON.parse(companyData);
    
    // Get all jobs for this company
    const jobs = await env.JOBS.list();
    const companyJobs = [];
    
    for (const key of jobs.keys) {
      const jobData = await env.JOBS.get(key.name);
      if (jobData) {
        const job = JSON.parse(jobData);
        if (job.companyId === companyId && job.status === "active") {
          // Add company info to job
          const jobWithCompany = {
            ...job,
            company: {
              id: company.id,
              name: company.name,
              logo: company.logo,
              location: company.location
            }
          };
          companyJobs.push(jobWithCompany);
        }
      }
    }
    
    // Sort by created date (newest first)
    companyJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return new Response(JSON.stringify({
      company: {
        id: company.id,
        name: company.name,
        logo: company.logo
      },
      jobs: companyJobs,
      total: companyJobs.length
    }), {
      headers: { 
        "content-type": "application/json",
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get company jobs" }), {
      status: 500,
      headers: { 
        "content-type": "application/json",
        ...corsHeaders 
      },
    });
  }
}

// Update company public profile
async function handleUpdateCompanyProfile(companyId, request, env) {
  try {
    // Verify authorization (in production, check JWT token)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { 
          "content-type": "application/json",
          ...corsHeaders 
        },
      });
    }
    
    const companyData = await env.COMPANIES.get(companyId);
    if (!companyData) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { 
          "content-type": "application/json",
          ...corsHeaders 
        },
      });
    }
    
    const company = JSON.parse(companyData);
    const profileUpdates = await request.json();
    
    // Update public profile fields
    const updatedCompany = {
      ...company,
      publicProfile: {
        ...company.publicProfile,
        ...profileUpdates,
        lastUpdated: new Date().toISOString()
      }
    };
    
    await env.COMPANIES.put(companyId, JSON.stringify(updatedCompany));
    
    return new Response(JSON.stringify({
      success: true,
      message: "Company profile updated successfully",
      publicProfile: updatedCompany.publicProfile
    }), {
      headers: { 
        "content-type": "application/json",
        ...corsHeaders 
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to update company profile" }), {
      status: 500,
      headers: { 
        "content-type": "application/json",
        ...corsHeaders 
      },
    });
  }
}

// Helper function to get active job count for a company
async function getActiveJobCountForCompany(companyId, env) {
  const jobs = await env.JOBS.list();
  let count = 0;
  
  for (const key of jobs.keys) {
    const jobData = await env.JOBS.get(key.name);
    if (jobData) {
      const job = JSON.parse(jobData);
      if (job.companyId === companyId && job.status === "active") {
        count++;
      }
    }
  }
  
  return count;
}

// Helper function to get recent jobs for a company
async function getRecentJobsForCompany(companyId, env, limit = 5) {
  const jobs = await env.JOBS.list();
  const companyJobs = [];
  
  for (const key of jobs.keys) {
    const jobData = await env.JOBS.get(key.name);
    if (jobData) {
      const job = JSON.parse(jobData);
      if (job.companyId === companyId && job.status === "active") {
        companyJobs.push({
          id: job.id,
          title: job.title,
          location: job.location,
          jobType: job.jobType,
          createdAt: job.createdAt
        });
      }
    }
  }
  
  // Sort by created date and return limited results
  return companyJobs
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}
