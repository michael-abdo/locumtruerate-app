/**
 * OpenAPI Specification Generator
 * Generates comprehensive OpenAPI specs for the LocumTrueRate API
 */

import type { OpenAPIV3 } from 'openapi-types';
import type { ApiEndpoint, DocumentationConfig } from './types';

/**
 * Generate OpenAPI specification
 */
export function generateOpenApiSpec(
  config: DocumentationConfig,
  endpoints: ApiEndpoint[],
  version: string
): OpenAPIV3.Document {
  return {
    openapi: '3.0.3',
    info: {
      title: config.title,
      version,
      description: config.description,
      contact: config.contact,
      license: config.license,
    },
    servers: config.servers,
    tags: config.tags,
    paths: generatePaths(endpoints, version),
    components: generateComponents(),
    security: [
      { bearerAuth: [] },
      { apiKey: [] }
    ],
    externalDocs: config.externalDocs
  };
}

/**
 * Generate paths from endpoints
 */
function generatePaths(endpoints: ApiEndpoint[], version: string): OpenAPIV3.PathsObject {
  const paths: OpenAPIV3.PathsObject = {};

  for (const endpoint of endpoints) {
    if (!endpoint.versions[version]) continue;

    const versionedEndpoint = endpoint.versions[version];
    const path = endpoint.path;
    const method = endpoint.method.toLowerCase() as keyof OpenAPIV3.PathItemObject;

    if (!paths[path]) {
      paths[path] = {};
    }

    const operation: OpenAPIV3.OperationObject = {
      summary: versionedEndpoint.documentation?.summary || '',
      description: versionedEndpoint.documentation?.description,
      tags: versionedEndpoint.documentation?.tags,
      deprecated: versionedEndpoint.deprecated,
      operationId: `${method}${path.replace(/[^a-zA-Z0-9]/g, '')}`,
      security: versionedEndpoint.documentation?.security,
      parameters: generateParameters(endpoint, versionedEndpoint),
      responses: generateResponses(versionedEndpoint)
    };

    // Add request body for applicable methods
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      operation.requestBody = generateRequestBody(versionedEndpoint);
    }

    (paths[path] as any)[method] = operation;
  }

  return paths;
}

/**
 * Generate parameters for endpoint
 */
function generateParameters(endpoint: ApiEndpoint, versionedEndpoint: any): OpenAPIV3.ParameterObject[] {
  const parameters: OpenAPIV3.ParameterObject[] = [];

  // Extract path parameters
  const pathParams = endpoint.path.match(/:(\w+)/g);
  if (pathParams) {
    pathParams.forEach(param => {
      const name = param.substring(1);
      parameters.push({
        name,
        in: 'path',
        required: true,
        description: `The ${name} identifier`,
        schema: { type: 'string' }
      });
    });
  }

  // Add common query parameters based on endpoint
  if (endpoint.method === 'GET' && endpoint.path.includes('/list')) {
    parameters.push(
      {
        name: 'page',
        in: 'query',
        description: 'Page number',
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      {
        name: 'limit',
        in: 'query',
        description: 'Items per page',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      },
      {
        name: 'sort',
        in: 'query',
        description: 'Sort field and direction (e.g., createdAt:desc)',
        schema: { type: 'string' }
      }
    );
  }

  return parameters;
}

/**
 * Generate request body
 */
function generateRequestBody(versionedEndpoint: any): OpenAPIV3.RequestBodyObject {
  return {
    required: true,
    content: {
      'application/json': {
        schema: versionedEndpoint.schema?.request || { type: 'object' },
        examples: generateExamples(versionedEndpoint)
      }
    }
  };
}

/**
 * Generate responses
 */
function generateResponses(versionedEndpoint: any): OpenAPIV3.ResponsesObject {
  return {
    '200': {
      description: 'Success',
      content: {
        'application/json': {
          schema: versionedEndpoint.schema?.response || { type: 'object' }
        }
      }
    },
    '201': {
      description: 'Created',
      content: {
        'application/json': {
          schema: versionedEndpoint.schema?.response || { type: 'object' }
        }
      }
    },
    '400': {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error400' }
        }
      }
    },
    '401': {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error401' }
        }
      }
    },
    '403': {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error403' }
        }
      }
    },
    '404': {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error404' }
        }
      }
    },
    '429': {
      description: 'Too Many Requests',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error429' }
        }
      }
    },
    '500': {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error500' }
        }
      }
    }
  };
}

/**
 * Generate examples
 */
function generateExamples(versionedEndpoint: any): Record<string, OpenAPIV3.ExampleObject> {
  // Generate examples based on endpoint type
  return {
    default: {
      summary: 'Default example',
      value: {}
    }
  };
}

/**
 * Generate components
 */
function generateComponents(): OpenAPIV3.ComponentsObject {
  return {
    schemas: {
      // Error schemas
      Error400: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid request data' },
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
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Error401: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'UNAUTHORIZED' },
              message: { type: 'string', example: 'Authentication required' }
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Error403: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'FORBIDDEN' },
              message: { type: 'string', example: 'Access denied' }
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Error404: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Resource not found' }
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Error429: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'RATE_LIMITED' },
              message: { type: 'string', example: 'Too many requests' },
              retryAfter: { type: 'integer', example: 60 }
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Error500: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'INTERNAL_ERROR' },
              message: { type: 'string', example: 'An internal error occurred' }
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },

      // Common schemas
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 100 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          pages: { type: 'integer', example: 5 }
        }
      },

      // Healthcare domain schemas
      HealthcareProvider: {
        type: 'object',
        required: ['id', 'name', 'specialty', 'licenseNumber', 'licenseState'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Dr. Jane Smith' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', example: '+1-555-123-4567' },
          specialty: {
            type: 'string',
            enum: ['FAMILY_MEDICINE', 'INTERNAL_MEDICINE', 'EMERGENCY_MEDICINE', 'PEDIATRICS', 'SURGERY', 'ANESTHESIOLOGY', 'RADIOLOGY', 'PATHOLOGY', 'PSYCHIATRY', 'OTHER']
          },
          licenseNumber: { type: 'string', example: 'MD12345' },
          licenseState: { type: 'string', example: 'CA' },
          npiNumber: { type: 'string', example: '1234567890' },
          yearsExperience: { type: 'integer', minimum: 0 },
          bio: { type: 'string' },
          hourlyRate: { type: 'number', minimum: 0 },
          availability: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' }
              }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      JobPosting: {
        type: 'object',
        required: ['title', 'description', 'location', 'specialty', 'employmentType'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Emergency Medicine Physician - Locum Tenens' },
          description: { type: 'string' },
          company: { type: 'string' },
          location: { type: 'string', example: 'San Francisco, CA' },
          specialty: {
            type: 'string',
            enum: ['FAMILY_MEDICINE', 'INTERNAL_MEDICINE', 'EMERGENCY_MEDICINE', 'PEDIATRICS', 'SURGERY', 'ANESTHESIOLOGY', 'RADIOLOGY', 'PATHOLOGY', 'PSYCHIATRY', 'OTHER']
          },
          employmentType: {
            type: 'string',
            enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'LOCUM', 'PERMANENT']
          },
          salaryMin: { type: 'number', minimum: 0 },
          salaryMax: { type: 'number', minimum: 0 },
          hourlyRate: { type: 'number', minimum: 0 },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          requirements: {
            type: 'array',
            items: { type: 'string' }
          },
          benefits: {
            type: 'array',
            items: { type: 'string' }
          },
          remote: { type: 'boolean', default: false },
          urgent: { type: 'boolean', default: false },
          status: {
            type: 'string',
            enum: ['DRAFT', 'ACTIVE', 'FILLED', 'CANCELLED'],
            default: 'DRAFT'
          },
          viewCount: { type: 'integer', minimum: 0, default: 0 },
          applicationCount: { type: 'integer', minimum: 0, default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },

      JobApplication: {
        type: 'object',
        required: ['jobId', 'candidateId', 'coverLetter'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          jobId: { type: 'string', format: 'uuid' },
          candidateId: { type: 'string', format: 'uuid' },
          coverLetter: { type: 'string' },
          resume: { type: 'string', format: 'uri' },
          availableStartDate: { type: 'string', format: 'date' },
          expectedSalary: { type: 'number', minimum: 0 },
          status: {
            type: 'string',
            enum: ['PENDING', 'REVIEWING', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
            default: 'PENDING'
          },
          notes: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    },

    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service communication'
      }
    },

    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        }
      },
      SortParam: {
        name: 'sort',
        in: 'query',
        description: 'Sort field and direction (e.g., createdAt:desc)',
        schema: {
          type: 'string',
          pattern: '^[a-zA-Z]+:(asc|desc)$'
        }
      },
      ApiVersionHeader: {
        name: 'API-Version',
        in: 'header',
        description: 'API version to use',
        schema: {
          type: 'string',
          default: '2.0.0'
        }
      }
    },

    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error401' }
          }
        }
      },
      ForbiddenError: {
        description: 'Access denied',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error403' }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error404' }
          }
        }
      }
    }
  };
}