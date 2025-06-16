export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/') {
      return new Response('Job Board API', {
        headers: { 'content-type': 'text/plain' },
      });
    }
    
    if (url.pathname === '/api/jobs' && request.method === 'GET') {
      return handleGetJobs(env);
    }
    
    if (url.pathname === '/api/jobs' && request.method === 'POST') {
      return handleCreateJob(request, env);
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
    headers: { 'content-type': 'application/json' },
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
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response('Invalid request', { status: 400 });
  }
}