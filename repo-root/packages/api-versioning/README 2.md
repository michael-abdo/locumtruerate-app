# API Versioning Package

Comprehensive API versioning and documentation solution for the LocumTrueRate platform.

## Features

- **Multiple Versioning Strategies**: Header, URL, Query parameter, and Accept header versioning
- **Automatic Documentation**: OpenAPI/Swagger documentation generation with version support
- **Version Negotiation**: Automatic version compatibility and transformation
- **Deprecation Management**: Graceful API version deprecation with sunset dates
- **Metrics & Analytics**: Track API usage by version and endpoint
- **Healthcare Compliance**: FHIR and HL7 version mapping support

## Installation

```bash
npm install @locumtruerate/api-versioning
```

## Quick Start

```typescript
import { ApiVersionManager, VersioningConfig } from '@locumtruerate/api-versioning';
import express from 'express';

const app = express();

// Configure versioning
const versionConfig: VersioningConfig = {
  method: 'header',
  defaultVersion: '2.0.0',
  supportedVersions: ['1.0.0', '2.0.0'],
  header: 'api-version',
  strict: true,
  enableDocumentation: true
};

// Create version manager
const versionManager = new ApiVersionManager(versionConfig);

// Apply versioning middleware
app.use(versionManager.getMiddleware());

// Register versioned endpoints
versionManager.registerEndpoint({
  path: '/api/jobs',
  method: 'GET',
  versions: {
    '1.0.0': {
      handler: (req, res) => {
        res.json({ version: '1.0.0', jobs: [] });
      },
      deprecated: true,
      documentation: {
        summary: 'List all jobs (deprecated)',
        tags: ['Jobs']
      }
    },
    '2.0.0': {
      handler: (req, res) => {
        res.json({ 
          version: '2.0.0', 
          data: { jobs: [] },
          pagination: { page: 1, limit: 20 }
        });
      },
      documentation: {
        summary: 'List all jobs with pagination',
        tags: ['Jobs']
      }
    }
  }
});

// Mount API routes
app.use('/api', versionManager.getRouter());

// Mount documentation
app.use('/api/docs', versionManager.getDocumentationRouter());
```

## Versioning Strategies

### Header Versioning (Recommended)
```typescript
// Client request
fetch('/api/jobs', {
  headers: {
    'API-Version': '2.0.0'
  }
});
```

### URL Versioning
```typescript
const config: VersioningConfig = {
  method: 'url',
  versionPrefix: 'v',
  // ... other config
};

// Client request: GET /v2/api/jobs
```

### Query Parameter Versioning
```typescript
const config: VersioningConfig = {
  method: 'query',
  queryParam: 'version',
  // ... other config
};

// Client request: GET /api/jobs?version=2.0.0
```

### Accept Header Versioning
```typescript
// Client request
fetch('/api/jobs', {
  headers: {
    'Accept': 'application/vnd.locumtruerate.v2+json'
  }
});
```

## Version Transformation

Handle breaking changes between versions:

```typescript
versionManager.registerTransformer({
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  transformRequest: (data) => {
    // Transform v1 request to v2 format
    return {
      ...data,
      newField: 'default value'
    };
  },
  transformResponse: (data) => {
    // Transform v2 response to v1 format
    const { newField, ...v1Data } = data;
    return v1Data;
  }
});
```

## Deprecation Management

Mark versions as deprecated with sunset dates:

```typescript
versionManager.addVersion({
  version: '1.0.0',
  releaseDate: new Date('2023-01-01'),
  deprecated: true,
  deprecationDate: new Date('2024-01-01'),
  sunsetDate: new Date('2024-07-01'),
  changes: ['Initial release'],
  breakingChanges: ['Authentication method changed']
});
```

Deprecated versions will include headers:
```
Deprecation: true
Sunset: Mon, 01 Jul 2024 00:00:00 GMT
Warning: 299 - "API version 1.0.0 is deprecated and will be removed on 2024-07-01"
```

## API Documentation

### Automatic OpenAPI Generation

Documentation is automatically generated for all registered endpoints:

```typescript
// Access Swagger UI
// http://localhost:3000/api/docs/2.0.0

// Access ReDoc
// http://localhost:3000/api/docs/2.0.0/redoc

// Get raw OpenAPI spec
// http://localhost:3000/api/docs/2.0.0/spec
```

### Custom Documentation

Add detailed documentation to endpoints:

```typescript
versionManager.registerEndpoint({
  path: '/api/providers/:id',
  method: 'GET',
  versions: {
    '2.0.0': {
      handler: getProviderHandler,
      documentation: {
        summary: 'Get healthcare provider by ID',
        description: 'Retrieves detailed information about a healthcare provider',
        tags: ['Providers'],
        security: [{ bearerAuth: [] }]
      },
      schema: {
        response: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            specialty: { type: 'string' }
          }
        }
      }
    }
  }
});
```

## Healthcare-Specific Features

### FHIR Version Mapping

```typescript
import { HealthcareVersioning } from '@locumtruerate/api-versioning';

const healthcareVersioning = new HealthcareVersioning(versionConfig);

// Automatically maps FHIR versions to API versions
// FHIR-Version: 4.0.1 → API-Version: 2.0.0
```

### HL7 Compatibility

```typescript
// HL7 version header support
// HL7-Version: 2.9 → API-Version: 2.0.0
```

## Metrics and Analytics

Track API usage by version:

```typescript
// GET /api/metrics
{
  "byVersion": {
    "2.0.0": {
      "totalRequests": 10000,
      "totalErrors": 23,
      "endpoints": 15,
      "averageResponseTime": 124.5
    },
    "1.0.0": {
      "totalRequests": 500,
      "totalErrors": 5,
      "endpoints": 10,
      "averageResponseTime": 156.2
    }
  }
}
```

## Migration Guides

Generate migration guides between versions:

```typescript
// GET /api/migration/1.0.0/2.0.0
{
  "from": "1.0.0",
  "to": "2.0.0",
  "steps": [
    "Update API version header to 2.0.0",
    "Review breaking changes and update integration",
    "Test all API endpoints with new version",
    "Update SDK/client libraries to latest version"
  ],
  "breakingChanges": [
    "Authentication method changed from API key to JWT",
    "Response format now includes version wrapper"
  ]
}
```

## Best Practices

1. **Semantic Versioning**: Follow semver (MAJOR.MINOR.PATCH)
2. **Backward Compatibility**: Maintain compatibility within major versions
3. **Deprecation Period**: Provide at least 6 months notice before sunset
4. **Clear Documentation**: Document all changes in changelog
5. **Version Testing**: Test all supported versions in CI/CD
6. **Default Version**: Always specify a sensible default version
7. **Version Headers**: Include version info in all responses

## Configuration Options

```typescript
interface VersioningConfig {
  method: 'header' | 'url' | 'query' | 'accept';
  defaultVersion: string;
  supportedVersions: string[];
  header?: string;              // For header versioning
  queryParam?: string;          // For query versioning
  versionPrefix?: string;       // For URL versioning (e.g., /v1/)
  strict?: boolean;             // Reject requests without version
  enableDocumentation?: boolean;
  deprecationWarningDays?: number;
}
```

## Testing

```typescript
import { ApiVersionManager } from '@locumtruerate/api-versioning';
import request from 'supertest';

describe('API Versioning', () => {
  it('should handle version negotiation', async () => {
    const response = await request(app)
      .get('/api/jobs')
      .set('API-Version', '2.0.0')
      .expect(200);
    
    expect(response.headers['api-version']).toBe('2.0.0');
    expect(response.body.version).toBe('2.0.0');
  });
  
  it('should warn about deprecated versions', async () => {
    const response = await request(app)
      .get('/api/jobs')
      .set('API-Version', '1.0.0')
      .expect(200);
    
    expect(response.headers.deprecation).toBe('true');
    expect(response.headers.warning).toContain('deprecated');
  });
});
```

## License

MIT