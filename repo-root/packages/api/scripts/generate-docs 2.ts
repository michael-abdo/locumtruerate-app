#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { appRouter } from '../src/index';
import { API_VERSION } from '../src/versioning';

/**
 * Generate API documentation in markdown format
 */
function generateApiDocs() {
  const outputDir = path.join(__dirname, '../docs');
  const outputFile = path.join(outputDir, 'api-reference.md');

  // Ensure docs directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let markdown = `# LocumTrueRate API Reference\n\n`;
  markdown += `Version: ${API_VERSION.current}\n\n`;
  markdown += `Base URL: \`https://api.locumtruerate.com\`\n\n`;

  // API Versioning
  markdown += `## API Versioning\n\n`;
  markdown += `The API uses header-based versioning. Include the \`X-API-Version\` header in your requests:\n\n`;
  markdown += `\`\`\`http\nX-API-Version: ${API_VERSION.current}\n\`\`\`\n\n`;
  markdown += `If no version is specified, the current version (${API_VERSION.current}) will be used.\n\n`;

  // Authentication
  markdown += `## Authentication\n\n`;
  markdown += `Most endpoints require authentication using JWT tokens:\n\n`;
  markdown += `\`\`\`http\nAuthorization: Bearer <your-jwt-token>\n\`\`\`\n\n`;
  markdown += `Tokens can be obtained through the authentication endpoints.\n\n`;

  // Rate Limiting
  markdown += `## Rate Limiting\n\n`;
  markdown += `API requests are rate limited based on your account type:\n\n`;
  markdown += `| Account Type | Requests/Hour | Burst Limit |\n`;
  markdown += `|--------------|---------------|-------------|\n`;
  markdown += `| Anonymous | 100 | 10/minute |\n`;
  markdown += `| Free | 1,000 | 50/minute |\n`;
  markdown += `| Pro | 10,000 | 200/minute |\n`;
  markdown += `| Enterprise | 100,000 | 1000/minute |\n\n`;

  // Error Responses
  markdown += `## Error Responses\n\n`;
  markdown += `Errors follow a consistent format:\n\n`;
  markdown += `\`\`\`json\n{\n  "error": {\n    "code": "ERROR_CODE",\n    "message": "Human-readable error message",\n    "details": {}\n  }\n}\n\`\`\`\n\n`;

  // Endpoints by Router
  markdown += `## Endpoints\n\n`;

  // Auth Router
  markdown += `### Authentication\n\n`;
  markdown += `#### POST /api/auth/signup\n`;
  markdown += `Create a new user account.\n\n`;
  markdown += `**Request Body:**\n`;
  markdown += `\`\`\`json\n{\n  "email": "user@example.com",\n  "password": "SecurePassword123!",\n  "name": "John Doe",\n  "role": "professional"\n}\n\`\`\`\n\n`;

  markdown += `#### POST /api/auth/login\n`;
  markdown += `Authenticate and receive JWT token.\n\n`;
  markdown += `**Request Body:**\n`;
  markdown += `\`\`\`json\n{\n  "email": "user@example.com",\n  "password": "SecurePassword123!"\n}\n\`\`\`\n\n`;

  markdown += `#### POST /api/auth/logout\n`;
  markdown += `Invalidate current session.\n\n`;

  markdown += `#### GET /api/auth/me\n`;
  markdown += `Get current user profile. Requires authentication.\n\n`;

  // Jobs Router
  markdown += `### Jobs\n\n`;
  markdown += `#### GET /api/jobs\n`;
  markdown += `List all active job postings.\n\n`;
  markdown += `**Query Parameters:**\n`;
  markdown += `- \`page\` (number): Page number, default 1\n`;
  markdown += `- \`limit\` (number): Items per page, default 20\n`;
  markdown += `- \`location\` (string): Filter by location\n`;
  markdown += `- \`specialty\` (string): Filter by specialty\n`;
  markdown += `- \`minRate\` (number): Minimum hourly rate\n`;
  markdown += `- \`maxRate\` (number): Maximum hourly rate\n\n`;

  markdown += `#### GET /api/jobs/:id\n`;
  markdown += `Get specific job details.\n\n`;

  markdown += `#### POST /api/jobs\n`;
  markdown += `Create a new job posting. Requires employer authentication.\n\n`;
  markdown += `**Request Body:**\n`;
  markdown += `\`\`\`json\n{\n  "title": "Emergency Medicine Physician",\n  "location": "New York, NY",\n  "description": "...",\n  "hourlyRate": 250,\n  "startDate": "2024-02-01",\n  "duration": "3 months",\n  "requirements": ["MD/DO", "Board Certified"]\n}\n\`\`\`\n\n`;

  // Applications Router
  markdown += `### Applications\n\n`;
  markdown += `#### POST /api/applications\n`;
  markdown += `Submit application for a job. Requires professional authentication.\n\n`;

  markdown += `#### GET /api/applications\n`;
  markdown += `List user's applications. Requires authentication.\n\n`;

  markdown += `#### PATCH /api/applications/:id\n`;
  markdown += `Update application status. Requires employer authentication.\n\n`;

  // Search Router
  markdown += `### Search\n\n`;
  markdown += `#### POST /api/search/jobs\n`;
  markdown += `Advanced job search with full-text and filters.\n\n`;
  markdown += `**Request Body:**\n`;
  markdown += `\`\`\`json\n{\n  "query": "emergency medicine",\n  "filters": {\n    "location": ["NY", "NJ"],\n    "minRate": 200,\n    "specialty": ["Emergency Medicine", "Critical Care"]\n  },\n  "sort": "rate_desc",\n  "page": 1,\n  "limit": 20\n}\n\`\`\`\n\n`;

  // Admin Router
  markdown += `### Admin\n\n`;
  markdown += `All admin endpoints require admin role authentication.\n\n`;
  markdown += `#### GET /api/admin/users\n`;
  markdown += `List all users with pagination.\n\n`;

  markdown += `#### GET /api/admin/jobs\n`;
  markdown += `List all jobs including inactive ones.\n\n`;

  markdown += `#### PATCH /api/admin/jobs/:id/moderate\n`;
  markdown += `Approve or reject job postings.\n\n`;

  // Analytics Router
  markdown += `### Analytics\n\n`;
  markdown += `#### GET /api/analytics/dashboard\n`;
  markdown += `Get dashboard metrics. Requires authentication.\n\n`;

  markdown += `#### GET /api/analytics/trends\n`;
  markdown += `Get trend data for various metrics.\n\n`;

  // Support Router
  markdown += `### Support\n\n`;
  markdown += `#### POST /api/support/tickets\n`;
  markdown += `Create a support ticket.\n\n`;

  markdown += `#### GET /api/support/tickets\n`;
  markdown += `List user's support tickets. Requires authentication.\n\n`;

  // Webhooks
  markdown += `## Webhooks\n\n`;
  markdown += `LocumTrueRate can send webhooks for various events:\n\n`;
  markdown += `- \`job.created\`: New job posting\n`;
  markdown += `- \`application.submitted\`: New application\n`;
  markdown += `- \`application.status_changed\`: Application status update\n`;
  markdown += `- \`lead.captured\`: New lead from calculator\n\n`;

  markdown += `Webhook payloads are signed with HMAC-SHA256 using your webhook secret.\n\n`;

  // Code Examples
  markdown += `## Code Examples\n\n`;
  markdown += `### JavaScript/TypeScript\n`;
  markdown += `\`\`\`typescript\nimport { createTRPCProxyClient, httpBatchLink } from '@trpc/client';\nimport type { AppRouter } from '@locumtruerate/api';\n\nconst client = createTRPCProxyClient<AppRouter>({\n  links: [\n    httpBatchLink({\n      url: 'https://api.locumtruerate.com/trpc',\n      headers: {\n        'Authorization': 'Bearer YOUR_TOKEN',\n        'X-API-Version': '${API_VERSION.current}'\n      },\n    }),\n  ],\n});\n\n// Example: Search jobs\nconst jobs = await client.jobs.list.query({\n  page: 1,\n  limit: 20,\n  location: 'New York'\n});\n\`\`\`\n\n`;

  markdown += `### cURL\n`;
  markdown += `\`\`\`bash\n# Get job listings\ncurl -X GET 'https://api.locumtruerate.com/api/jobs?page=1&limit=20' \\\n  -H 'Authorization: Bearer YOUR_TOKEN' \\\n  -H 'X-API-Version: ${API_VERSION.current}'\n\n# Create job posting\ncurl -X POST 'https://api.locumtruerate.com/api/jobs' \\\n  -H 'Authorization: Bearer YOUR_TOKEN' \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-API-Version: ${API_VERSION.current}' \\\n  -d '{\n    "title": "Emergency Medicine Physician",\n    "location": "New York, NY",\n    "hourlyRate": 250\n  }'\n\`\`\`\n\n`;

  // Write to file
  fs.writeFileSync(outputFile, markdown);
  console.log(`API documentation generated at: ${outputFile}`);

  // Also generate a JSON version for automated tools
  const jsonDoc = {
    version: API_VERSION.current,
    baseUrl: 'https://api.locumtruerate.com',
    authentication: {
      type: 'Bearer',
      header: 'Authorization',
    },
    versioning: {
      type: 'header',
      header: 'X-API-Version',
      current: API_VERSION.current,
      deprecated: API_VERSION.deprecated,
    },
    endpoints: [
      // Auth endpoints
      { method: 'POST', path: '/api/auth/signup', auth: false },
      { method: 'POST', path: '/api/auth/login', auth: false },
      { method: 'POST', path: '/api/auth/logout', auth: true },
      { method: 'GET', path: '/api/auth/me', auth: true },
      // Jobs endpoints
      { method: 'GET', path: '/api/jobs', auth: false },
      { method: 'GET', path: '/api/jobs/:id', auth: false },
      { method: 'POST', path: '/api/jobs', auth: true, role: 'employer' },
      { method: 'PATCH', path: '/api/jobs/:id', auth: true, role: 'employer' },
      { method: 'DELETE', path: '/api/jobs/:id', auth: true, role: 'employer' },
      // Applications endpoints
      { method: 'GET', path: '/api/applications', auth: true },
      { method: 'POST', path: '/api/applications', auth: true, role: 'professional' },
      { method: 'PATCH', path: '/api/applications/:id', auth: true },
      // Search endpoints
      { method: 'POST', path: '/api/search/jobs', auth: false },
      // Admin endpoints
      { method: 'GET', path: '/api/admin/users', auth: true, role: 'admin' },
      { method: 'GET', path: '/api/admin/jobs', auth: true, role: 'admin' },
      { method: 'PATCH', path: '/api/admin/jobs/:id/moderate', auth: true, role: 'admin' },
      // Analytics endpoints
      { method: 'GET', path: '/api/analytics/dashboard', auth: true },
      { method: 'GET', path: '/api/analytics/trends', auth: true },
      // Support endpoints
      { method: 'GET', path: '/api/support/tickets', auth: true },
      { method: 'POST', path: '/api/support/tickets', auth: true },
    ],
  };

  const jsonFile = path.join(outputDir, 'api-spec.json');
  fs.writeFileSync(jsonFile, JSON.stringify(jsonDoc, null, 2));
  console.log(`API specification generated at: ${jsonFile}`);
}

// Run the generator
generateApiDocs();