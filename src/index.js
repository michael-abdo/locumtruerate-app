const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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
    
    return new Response('Not Found', { status: 404 });
  },
};

async function handleGetJobs(env) {
  const jobs = await env.JOBS.list();
  const jobList = [];
  
  for (const key of jobs.keys) {
    const job = await env.JOBS.get(key.name);
    if (job) {
      jobList.push(JSON.parse(job));
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
    const job = await request.json();
    const id = crypto.randomUUID();
    const jobWithId = { ...job, id, createdAt: new Date().toISOString() };
    
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
  
  return new Response(job, {
    headers: { 
      'content-type': 'application/json',
      ...corsHeaders 
    },
  });
}

async function handleUpdateJob(id, request, env) {
  try {
    const existingJob = await env.JOBS.get(id);
    
    if (!existingJob) {
      return new Response('Job not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }
    
    const updates = await request.json();
    const existingJobData = JSON.parse(existingJob);
    const updatedJob = { 
      ...existingJobData, 
      ...updates, 
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
    return new Response('Invalid request', { 
      status: 400,
      headers: corsHeaders 
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
    const application = await request.json();
    const id = crypto.randomUUID();
    const applicationWithId = { 
      ...application, 
      id, 
      appliedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    await env.APPLICATIONS.put(id, JSON.stringify(applicationWithId));
    
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

// Simple hash function for passwords (use a proper crypto library in production)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Simple JWT-like token generation
function generateToken(employerId) {
  const payload = {
    employerId,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return btoa(JSON.stringify(payload));
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return payload;
  } catch (error) {
    return null; // Invalid token
  }
}

async function handleRegister(request, env) {
  try {
    const { companyName, contactName, email, password } = await request.json();
    
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
    
    // Create employer record
    const employer = {
      id: crypto.randomUUID(),
      companyName,
      contactName,
      email,
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
    
    // Verify password
    const hashedPassword = await hashPassword(password);
    if (employer.password !== hashedPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 
          'content-type': 'application/json',
          ...corsHeaders 
        },
      });
    }
    
    // Generate token
    const token = generateToken(employer.id);
    
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
    const payload = verifyToken(token);
    
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
      employerId: payload.employerId 
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