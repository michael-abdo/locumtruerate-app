const http = require('http');
const port = process.env.PORT || 3000;
const environment = process.env.ENVIRONMENT || 'development';

const server = http.createServer((req, res) => {
  const statusClass = environment === 'staging' ? 'staging' : environment === 'production' ? 'production' : 'demo';
  const deployTime = new Date().toISOString();
  const processType = environment === 'staging' ? 'Auto-deployed from GitHub push' : 'Manual deployment demo';
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html>
<head>
  <title>LocumTrueRate Deployment Demo</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
    .staging { background: #fff3cd; border: 1px solid #ffc107; color: #856404; }
    .production { background: #d4edda; border: 1px solid #28a745; color: #155724; }
    .demo { background: #d1ecf1; border: 1px solid #17a2b8; color: #0c5460; }
    h1 { color: #333; }
    .timestamp { color: #666; font-size: 0.9em; }
    .success { color: #28a745; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 LocumTrueRate Deployment Demo</h1>
    
    <div class="status ${statusClass}">
      <strong>Environment:</strong> ${environment.toUpperCase()}
    </div>
    
    <h2>✅ Automatic Deployment SUCCESS!</h2>
    
    <p>This page proves that our GitHub Actions automatic deployment is working!</p>
    
    <ul>
      <li><strong>Deployment Time:</strong> <span class="timestamp">${deployTime}</span></li>
      <li><strong>Environment:</strong> ${environment}</li>
      <li><strong>Process:</strong> ${processType}</li>
    </ul>
    
    <h3>🎯 Problem Solved:</h3>
    <p class="success">✓ No more commit/deployment mismatches!</p>
    <p class="success">✓ Every push automatically deploys to staging!</p>
    <p class="success">✓ Version tags automatically deploy to production!</p>
    
    <h3>📋 Our Deployment Workflow:</h3>
    <ol>
      <li>Developer pushes code to GitHub</li>
      <li>GitHub Actions automatically triggers</li>
      <li>Code deploys to staging (this environment)</li>
      <li>After testing, promote to production via tag</li>
    </ol>
    
    <p><em>File: DEMO_DEPLOYMENT_TEST.md was created at: 2025-07-11 02:53 UTC</em></p>
  </div>
</body>
</html>`);
});

server.listen(port, () => {
  console.log(`🚀 LocumTrueRate Demo Server running on port ${port}`);
  console.log(`📍 Environment: ${environment}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});