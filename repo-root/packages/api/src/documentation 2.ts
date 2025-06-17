import { AppRouter } from './index';
import { generateOpenApiDocument } from 'trpc-openapi';
import { API_VERSION } from './versioning';

/**
 * Generate OpenAPI documentation for the tRPC API
 */
export function generateApiDocumentation(appRouter: AppRouter) {
  const openApiDocument = generateOpenApiDocument(appRouter, {
    title: 'LocumTrueRate API',
    description: 'API for LocumTrueRate healthcare job matching platform',
    version: API_VERSION.current,
    baseUrl: process.env.API_URL || 'https://api.locumtruerate.com',
    docsUrl: 'https://docs.locumtruerate.com',
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'jobs', description: 'Job listing management' },
      { name: 'applications', description: 'Job application handling' },
      { name: 'users', description: 'User profile management' },
      { name: 'search', description: 'Search functionality' },
      { name: 'admin', description: 'Administrative functions' },
      { name: 'analytics', description: 'Analytics and reporting' },
      { name: 'support', description: 'Customer support' },
    ],
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  });

  // Add custom endpoints documentation
  const customEndpoints = {
    '/health': {
      get: {
        summary: 'Health check endpoint',
        description: 'Check if the API is running and healthy',
        tags: ['system'],
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    version: { type: 'string', example: API_VERSION.current },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/version': {
      get: {
        summary: 'API version information',
        description: 'Get current and supported API versions',
        tags: ['system'],
        responses: {
          200: {
            description: 'Version information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    current: { type: 'string', example: API_VERSION.current },
                    supported: {
                      type: 'array',
                      items: { type: 'string' },
                      example: Object.values(API_VERSION).filter(v => typeof v === 'string'),
                    },
                    deprecated: {
                      type: 'array',
                      items: { type: 'string' },
                      example: API_VERSION.deprecated,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  // Merge custom endpoints with generated OpenAPI document
  openApiDocument.paths = {
    ...openApiDocument.paths,
    ...customEndpoints,
  };

  // Add API versioning information to the document
  openApiDocument.info = {
    ...openApiDocument.info,
    'x-api-versioning': {
      current: API_VERSION.current,
      deprecated: API_VERSION.deprecated,
      versionHeader: 'X-API-Version',
    },
  };

  return openApiDocument;
}

/**
 * Generate markdown documentation from OpenAPI spec
 */
export function generateMarkdownDocs(openApiDoc: any): string {
  let markdown = `# ${openApiDoc.info.title}\n\n`;
  markdown += `Version: ${openApiDoc.info.version}\n\n`;
  markdown += `${openApiDoc.info.description}\n\n`;

  // API Versioning section
  markdown += `## API Versioning\n\n`;
  markdown += `Current Version: ${API_VERSION.current}\n\n`;
  markdown += `To specify an API version, include the \`X-API-Version\` header in your requests.\n\n`;
  
  if (API_VERSION.deprecated.length > 0) {
    markdown += `### Deprecated Versions\n\n`;
    markdown += API_VERSION.deprecated.map(v => `- ${v}`).join('\n');
    markdown += '\n\n';
  }

  // Authentication section
  markdown += `## Authentication\n\n`;
  markdown += `This API uses JWT Bearer tokens for authentication. Include the token in the Authorization header:\n\n`;
  markdown += `\`\`\`\nAuthorization: Bearer <your-token>\n\`\`\`\n\n`;

  // Endpoints section
  markdown += `## Endpoints\n\n`;

  // Group endpoints by tag
  const endpointsByTag: Record<string, any[]> = {};
  
  Object.entries(openApiDoc.paths).forEach(([path, methods]: [string, any]) => {
    Object.entries(methods).forEach(([method, endpoint]: [string, any]) => {
      const tags = endpoint.tags || ['other'];
      tags.forEach((tag: string) => {
        if (!endpointsByTag[tag]) {
          endpointsByTag[tag] = [];
        }
        endpointsByTag[tag].push({ path, method, ...endpoint });
      });
    });
  });

  // Generate documentation for each tag group
  Object.entries(endpointsByTag).forEach(([tag, endpoints]) => {
    const tagInfo = openApiDoc.tags?.find((t: any) => t.name === tag);
    markdown += `### ${tag.charAt(0).toUpperCase() + tag.slice(1)}\n\n`;
    if (tagInfo?.description) {
      markdown += `${tagInfo.description}\n\n`;
    }

    endpoints.forEach(endpoint => {
      markdown += `#### ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n`;
      markdown += `${endpoint.summary || 'No summary'}\n\n`;
      if (endpoint.description) {
        markdown += `${endpoint.description}\n\n`;
      }

      // Parameters
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        markdown += `**Parameters:**\n\n`;
        markdown += `| Name | Type | Required | Description |\n`;
        markdown += `|------|------|----------|-------------|\n`;
        endpoint.parameters.forEach((param: any) => {
          markdown += `| ${param.name} | ${param.schema?.type || 'string'} | ${param.required ? 'Yes' : 'No'} | ${param.description || '-'} |\n`;
        });
        markdown += '\n';
      }

      // Request body
      if (endpoint.requestBody) {
        markdown += `**Request Body:**\n\n`;
        markdown += `\`\`\`json\n`;
        markdown += JSON.stringify(endpoint.requestBody.content?.['application/json']?.schema?.example || {}, null, 2);
        markdown += `\n\`\`\`\n\n`;
      }

      // Responses
      markdown += `**Responses:**\n\n`;
      Object.entries(endpoint.responses).forEach(([status, response]: [string, any]) => {
        markdown += `- **${status}**: ${response.description}\n`;
      });
      markdown += '\n';
    });
  });

  // Error codes section
  markdown += `## Error Codes\n\n`;
  markdown += `| Code | Description |\n`;
  markdown += `|------|-------------|\n`;
  markdown += `| 400 | Bad Request - Invalid parameters |\n`;
  markdown += `| 401 | Unauthorized - Invalid or missing authentication |\n`;
  markdown += `| 403 | Forbidden - Insufficient permissions |\n`;
  markdown += `| 404 | Not Found - Resource not found |\n`;
  markdown += `| 429 | Too Many Requests - Rate limit exceeded |\n`;
  markdown += `| 500 | Internal Server Error |\n\n`;

  // Rate limiting section
  markdown += `## Rate Limiting\n\n`;
  markdown += `API requests are rate limited to ensure fair usage:\n\n`;
  markdown += `- Anonymous requests: 100/hour\n`;
  markdown += `- Authenticated requests: 1000/hour\n`;
  markdown += `- Premium accounts: 10000/hour\n\n`;
  markdown += `Rate limit headers are included in responses:\n`;
  markdown += `- \`X-RateLimit-Limit\`: Maximum requests per hour\n`;
  markdown += `- \`X-RateLimit-Remaining\`: Requests remaining\n`;
  markdown += `- \`X-RateLimit-Reset\`: Time when limit resets\n\n`;

  return markdown;
}

/**
 * Type definitions for API documentation
 */
export interface ApiDocumentationConfig {
  title: string;
  version: string;
  description?: string;
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}