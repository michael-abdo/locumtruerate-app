/**
 * API Documentation Generator
 * Generates OpenAPI/Swagger documentation with versioning support
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import type { OpenAPIV3 } from 'openapi-types';
import type { DocumentationConfig, ApiEndpoint, ApiVersion } from './types';

export class ApiDocumentation {
  private router: Router;
  private specs: Map<string, OpenAPIV3.Document> = new Map();
  
  constructor(private config: DocumentationConfig) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Generate OpenAPI specification for a specific version
   */
  generateSpec(version: string, endpoints: ApiEndpoint[]): OpenAPIV3.Document {
    const paths: OpenAPIV3.PathsObject = {};
    
    // Group endpoints by path
    for (const endpoint of endpoints) {
      if (!endpoint.versions[version]) continue;
      
      const versionedEndpoint = endpoint.versions[version];
      const pathItem = paths[endpoint.path] || {};
      
      const operation: OpenAPIV3.OperationObject = {
        summary: versionedEndpoint.documentation?.summary || '',
        description: versionedEndpoint.documentation?.description,
        tags: versionedEndpoint.documentation?.tags,
        deprecated: versionedEndpoint.deprecated,
        security: versionedEndpoint.documentation?.security,
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: versionedEndpoint.schema?.response || {}
              }
            }
          },
          '400': {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: this.getErrorSchema()
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: this.getErrorSchema()
              }
            }
          },
          '404': {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: this.getErrorSchema()
              }
            }
          },
          '500': {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: this.getErrorSchema()
              }
            }
          }
        }
      };
      
      // Add request body if applicable
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && versionedEndpoint.schema?.request) {
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: versionedEndpoint.schema.request
            }
          }
        };
      }
      
      (pathItem as any)[endpoint.method.toLowerCase()] = operation;
      paths[endpoint.path] = pathItem;
    }
    
    const spec: OpenAPIV3.Document = {
      openapi: '3.0.3',
      info: {
        title: `${this.config.title} - v${version}`,
        version,
        description: this.config.description,
        contact: this.config.contact,
        license: this.config.license
      },
      servers: this.config.servers.map(server => ({
        ...server,
        url: `${server.url}/v${version}`
      })),
      paths,
      components: this.getComponents(),
      security: this.getSecurity(),
      tags: this.config.tags,
      externalDocs: this.config.externalDocs
    };
    
    this.specs.set(version, spec);
    return spec;
  }

  /**
   * Setup documentation routes
   */
  private setupRoutes(): void {
    // Version list endpoint
    this.router.get('/', (req, res) => {
      const versions = Array.from(this.specs.keys());
      res.json({
        title: this.config.title,
        description: this.config.description,
        versions: versions.map(v => ({
          version: v,
          url: `/api/docs/${v}`,
          spec: `/api/docs/${v}/spec`
        }))
      });
    });
    
    // Swagger UI for each version
    this.specs.forEach((spec, version) => {
      this.router.use(
        `/${version}`,
        swaggerUi.serveFiles(spec),
        swaggerUi.setup(spec, {
          customCss: this.getCustomCss(),
          customSiteTitle: `${this.config.title} - v${version}`,
          customfavIcon: '/favicon.ico'
        })
      );
      
      // Raw spec endpoint
      this.router.get(`/${version}/spec`, (req, res) => {
        res.json(spec);
      });
    });
    
    // ReDoc alternative documentation
    this.router.get('/:version/redoc', (req, res) => {
      const version = req.params.version;
      const spec = this.specs.get(version);
      
      if (!spec) {
        return res.status(404).json({ error: 'Version not found' });
      }
      
      res.send(this.getRedocHtml(version));
    });
  }

  /**
   * Get common components for OpenAPI spec
   */
  private getComponents(): OpenAPIV3.ComponentsObject {
    return {
      schemas: {
        Error: this.getErrorSchema(),
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {}
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        },
        VersionedResponse: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            data: {}
          }
        },
        
        // Healthcare-specific schemas
        HealthcareProvider: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            specialty: { type: 'string' },
            licenseNumber: { type: 'string' },
            licenseState: { type: 'string' },
            npiNumber: { type: 'string' }
          }
        },
        
        JobPosting: {
          type: 'object',
          required: ['title', 'description', 'location', 'specialty'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            specialty: {
              type: 'string',
              enum: [
                'FAMILY_MEDICINE', 'INTERNAL_MEDICINE', 'EMERGENCY_MEDICINE',
                'PEDIATRICS', 'SURGERY', 'ANESTHESIOLOGY', 'RADIOLOGY',
                'PATHOLOGY', 'PSYCHIATRY', 'OTHER'
              ]
            },
            employmentType: {
              type: 'string',
              enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'LOCUM', 'PERMANENT']
            },
            salaryMin: { type: 'number' },
            salaryMax: { type: 'number' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' }
          }
        }
      },
      
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      
      parameters: {
        Version: {
          name: 'version',
          in: 'query',
          description: 'API version',
          required: false,
          schema: {
            type: 'string',
            default: this.config.version
          }
        },
        Page: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        Limit: {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          }
        }
      }
    };
  }

  /**
   * Get security configuration
   */
  private getSecurity(): OpenAPIV3.SecurityRequirementObject[] {
    return [
      { bearerAuth: [] },
      { apiKey: [] }
    ];
  }

  /**
   * Get error schema
   */
  private getErrorSchema(): OpenAPIV3.SchemaObject {
    return {
      type: 'object',
      properties: {
        error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        version: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Get custom CSS for Swagger UI
   */
  private getCustomCss(): string {
    return `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 40px }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 8px; }
      .swagger-ui .btn.authorize { background: #667eea; border-color: #667eea; }
      .swagger-ui .btn.authorize:hover { background: #764ba2; border-color: #764ba2; }
      .swagger-ui select { padding: 5px 10px; }
      .swagger-ui .opblock.opblock-post { border-color: #49cc90; }
      .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #49cc90; }
      .swagger-ui .opblock.opblock-get { border-color: #61affe; }
      .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #61affe; }
      .swagger-ui .opblock.opblock-put { border-color: #fca130; }
      .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #fca130; }
      .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; }
      .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #f93e3e; }
    `;
  }

  /**
   * Get ReDoc HTML
   */
  private getRedocHtml(version: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.config.title} - v${version} - ReDoc</title>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; font-family: Roboto, sans-serif; }
            redoc { display: block; }
          </style>
        </head>
        <body>
          <redoc spec-url="/api/docs/${version}/spec"></redoc>
          <script src="https://cdn.jsdelivr.net/npm/redoc/bundles/redoc.standalone.js"></script>
        </body>
      </html>
    `;
  }

  /**
   * Generate changelog documentation
   */
  generateChangelog(versions: ApiVersion[]): string {
    let changelog = `# API Changelog\n\n`;
    
    const sortedVersions = versions.sort((a, b) => 
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
    
    for (const version of sortedVersions) {
      changelog += `## [${version.version}] - ${version.releaseDate.toISOString().split('T')[0]}\n\n`;
      
      if (version.deprecated) {
        changelog += `> ⚠️ **DEPRECATED**: This version is deprecated`;
        if (version.sunsetDate) {
          changelog += ` and will be removed on ${version.sunsetDate.toISOString().split('T')[0]}`;
        }
        changelog += '\n\n';
      }
      
      if (version.breakingChanges && version.breakingChanges.length > 0) {
        changelog += `### Breaking Changes\n`;
        for (const change of version.breakingChanges) {
          changelog += `- ${change}\n`;
        }
        changelog += '\n';
      }
      
      if (version.changes.length > 0) {
        changelog += `### Changes\n`;
        for (const change of version.changes) {
          changelog += `- ${change}\n`;
        }
        changelog += '\n';
      }
    }
    
    return changelog;
  }

  /**
   * Get router for mounting in Express app
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Add a new version spec
   */
  addVersionSpec(version: string, spec: OpenAPIV3.Document): void {
    this.specs.set(version, spec);
    this.setupRoutes(); // Refresh routes
  }
}