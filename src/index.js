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