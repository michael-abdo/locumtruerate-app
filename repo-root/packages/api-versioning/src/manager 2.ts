/**
 * API Version Manager
 * Central management of API versions, migrations, and compatibility
 */

import { Router, Request, Response, NextFunction } from 'express';
import semver from 'semver';
import { ApiVersioningMiddleware } from './middleware';
import { ApiDocumentation } from './documentation';
import { createVersioningStrategy } from './strategies';
import type {
  ApiVersion,
  VersioningConfig,
  ApiEndpoint,
  VersionTransformer,
  ApiMetrics,
  ApiChangeLog
} from './types';

export class ApiVersionManager {
  private middleware: ApiVersioningMiddleware;
  private documentation: ApiDocumentation;
  private endpoints: Map<string, ApiEndpoint> = new Map();
  private versions: Map<string, ApiVersion> = new Map();
  private transformers: Map<string, VersionTransformer> = new Map();
  private metrics: Map<string, ApiMetrics> = new Map();
  private router: Router;

  constructor(private config: VersioningConfig) {
    this.middleware = new ApiVersioningMiddleware(config);
    this.documentation = new ApiDocumentation({
      title: 'LocumTrueRate API',
      description: 'Healthcare job platform API with comprehensive versioning support',
      version: config.defaultVersion,
      servers: [
        {
          url: process.env.API_URL || 'https://api.locumtruerate.com',
          description: 'Production server'
        },
        {
          url: 'https://staging-api.locumtruerate.com',
          description: 'Staging server'
        },
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      contact: {
        name: 'LocumTrueRate Support',
        email: 'support@locumtruerate.com',
        url: 'https://locumtruerate.com/support'
      },
      tags: [
        { name: 'Authentication', description: 'User authentication and authorization' },
        { name: 'Jobs', description: 'Job posting and management' },
        { name: 'Applications', description: 'Job applications' },
        { name: 'Users', description: 'User management' },
        { name: 'Providers', description: 'Healthcare provider profiles' },
        { name: 'Analytics', description: 'Platform analytics' },
        { name: 'Billing', description: 'Subscription and billing' }
      ]
    });
    
    this.router = Router();
    this.initializeVersions();
    this.setupRoutes();
  }

  /**
   * Initialize default versions
   */
  private initializeVersions(): void {
    // Add current version
    this.addVersion({
      version: '2.0.0',
      releaseDate: new Date('2024-01-01'),
      changes: [
        'Added comprehensive job filtering',
        'Introduced provider profiles',
        'Enhanced analytics dashboard',
        'Mobile API optimization'
      ],
      breakingChanges: [
        'Changed authentication flow to JWT',
        'Restructured job posting schema'
      ]
    });

    // Add previous version (deprecated)
    this.addVersion({
      version: '1.0.0',
      releaseDate: new Date('2023-01-01'),
      deprecated: true,
      deprecationDate: new Date('2024-01-01'),
      sunsetDate: new Date('2024-07-01'),
      changes: [
        'Initial API release',
        'Basic job posting functionality',
        'User authentication'
      ]
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Version information endpoint
    this.router.get('/versions', this.middleware.versionInfoHandler());

    // Changelog endpoint
    this.router.get('/changelog', (req, res) => {
      const changelog = this.documentation.generateChangelog(
        Array.from(this.versions.values())
      );
      res.type('text/markdown').send(changelog);
    });

    // Metrics endpoint
    this.router.get('/metrics', this.authenticate, (req, res) => {
      const metrics = Array.from(this.metrics.values());
      res.json({
        total: metrics.length,
        byVersion: this.groupMetricsByVersion(metrics),
        byEndpoint: this.groupMetricsByEndpoint(metrics)
      });
    });

    // Migration guide endpoint
    this.router.get('/migration/:from/:to', (req, res) => {
      const guide = this.getMigrationGuide(req.params.from, req.params.to);
      if (!guide) {
        return res.status(404).json({ error: 'Migration guide not found' });
      }
      res.json(guide);
    });
  }

  /**
   * Register a new API version
   */
  addVersion(version: ApiVersion): void {
    const normalized = this.normalizeVersion(version.version);
    this.versions.set(normalized, {
      ...version,
      version: normalized
    });
    
    // Update middleware
    this.middleware.registerVersion(version);
    
    // Generate documentation
    const endpoints = Array.from(this.endpoints.values());
    this.documentation.generateSpec(normalized, endpoints);
  }

  /**
   * Register an API endpoint with version-specific handlers
   */
  registerEndpoint(endpoint: ApiEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}`;
    this.endpoints.set(key, endpoint);
    
    // Create route handler
    const method = endpoint.method.toLowerCase() as keyof Router;
    (this.router[method] as any)(
      endpoint.path,
      this.middleware.middleware(),
      this.createVersionedHandler(endpoint)
    );
  }

  /**
   * Create versioned handler for endpoint
   */
  private createVersionedHandler(endpoint: ApiEndpoint) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const version = req.apiVersion || this.config.defaultVersion;
      
      // Find handler for requested version
      const handler = this.findHandlerForVersion(endpoint, version);
      
      if (!handler) {
        return res.status(404).json({
          error: {
            code: 'VERSION_NOT_SUPPORTED',
            message: `Endpoint ${endpoint.path} does not support version ${version}`,
            supportedVersions: Object.keys(endpoint.versions)
          }
        });
      }
      
      // Track metrics
      this.trackMetrics(endpoint, version, req);
      
      // Execute handler
      try {
        await handler(req, res, next);
      } catch (error) {
        this.trackError(endpoint, version);
        next(error);
      }
    };
  }

  /**
   * Find appropriate handler for requested version
   */
  private findHandlerForVersion(endpoint: ApiEndpoint, version: string) {
    // Direct match
    if (endpoint.versions[version]) {
      return endpoint.versions[version].handler;
    }
    
    // Find compatible version (same major)
    const requestedMajor = semver.major(version);
    const compatibleVersions = Object.keys(endpoint.versions)
      .filter(v => semver.major(v) === requestedMajor)
      .sort(semver.rcompare);
    
    if (compatibleVersions.length > 0) {
      const compatibleVersion = compatibleVersions[0];
      const transformer = this.findTransformer(version, compatibleVersion);
      
      if (transformer) {
        return this.createTransformedHandler(
          endpoint.versions[compatibleVersion].handler,
          transformer
        );
      }
      
      return endpoint.versions[compatibleVersion].handler;
    }
    
    return null;
  }

  /**
   * Create transformed handler
   */
  private createTransformedHandler(
    handler: Function,
    transformer: VersionTransformer
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Transform request if needed
      if (transformer.transformRequest) {
        req.body = transformer.transformRequest(req.body);
      }
      
      // Wrap response to transform output
      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        if (transformer.transformResponse) {
          data = transformer.transformResponse(data);
        }
        return originalJson(data);
      };
      
      // Execute handler
      await handler(req, res, next);
    };
  }

  /**
   * Register version transformer
   */
  registerTransformer(transformer: VersionTransformer): void {
    const key = `${transformer.fromVersion}:${transformer.toVersion}`;
    this.transformers.set(key, transformer);
  }

  /**
   * Find transformer between versions
   */
  private findTransformer(from: string, to: string): VersionTransformer | null {
    const key = `${from}:${to}`;
    return this.transformers.get(key) || null;
  }

  /**
   * Track API metrics
   */
  private trackMetrics(endpoint: ApiEndpoint, version: string, req: Request): void {
    const key = `${version}:${endpoint.method}:${endpoint.path}`;
    let metrics = this.metrics.get(key);
    
    if (!metrics) {
      metrics = {
        version,
        endpoint: endpoint.path,
        method: endpoint.method,
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        lastAccessed: new Date()
      };
    }
    
    metrics.requestCount++;
    metrics.lastAccessed = new Date();
    
    // Track response time
    const startTime = Date.now();
    const originalEnd = (req.res as any).end;
    (req.res as any).end = function(...args: any[]) {
      const responseTime = Date.now() - startTime;
      metrics!.averageResponseTime = 
        (metrics!.averageResponseTime * (metrics!.requestCount - 1) + responseTime) / 
        metrics!.requestCount;
      originalEnd.apply(this, args);
    };
    
    this.metrics.set(key, metrics);
  }

  /**
   * Track API errors
   */
  private trackError(endpoint: ApiEndpoint, version: string): void {
    const key = `${version}:${endpoint.method}:${endpoint.path}`;
    const metrics = this.metrics.get(key);
    
    if (metrics) {
      metrics.errorCount++;
      this.metrics.set(key, metrics);
    }
  }

  /**
   * Get migration guide between versions
   */
  private getMigrationGuide(fromVersion: string, toVersion: string) {
    const from = this.normalizeVersion(fromVersion);
    const to = this.normalizeVersion(toVersion);
    
    // Check if versions exist
    if (!this.versions.has(from) || !this.versions.has(to)) {
      return null;
    }
    
    const guide = {
      from,
      to,
      steps: [] as string[],
      breakingChanges: [] as string[],
      newFeatures: [] as string[],
      deprecated: [] as string[]
    };
    
    // Compare versions and generate guide
    const fromMajor = semver.major(from);
    const toMajor = semver.major(to);
    
    if (fromMajor !== toMajor) {
      guide.breakingChanges.push('Major version change - breaking changes expected');
      
      // Add version-specific breaking changes
      const toVersion = this.versions.get(to);
      if (toVersion?.breakingChanges) {
        guide.breakingChanges.push(...toVersion.breakingChanges);
      }
    }
    
    // Add migration steps
    guide.steps.push(
      `Update API version header to ${to}`,
      'Review breaking changes and update integration accordingly',
      'Test all API endpoints with new version',
      'Update SDK/client libraries to latest version'
    );
    
    return guide;
  }

  /**
   * Group metrics by version
   */
  private groupMetricsByVersion(metrics: ApiMetrics[]) {
    const grouped: Record<string, any> = {};
    
    for (const metric of metrics) {
      if (!grouped[metric.version]) {
        grouped[metric.version] = {
          totalRequests: 0,
          totalErrors: 0,
          endpoints: 0,
          averageResponseTime: 0
        };
      }
      
      grouped[metric.version].totalRequests += metric.requestCount;
      grouped[metric.version].totalErrors += metric.errorCount;
      grouped[metric.version].endpoints++;
      grouped[metric.version].averageResponseTime += metric.averageResponseTime;
    }
    
    // Calculate averages
    for (const version in grouped) {
      grouped[version].averageResponseTime /= grouped[version].endpoints;
      grouped[version].errorRate = grouped[version].totalErrors / grouped[version].totalRequests;
    }
    
    return grouped;
  }

  /**
   * Group metrics by endpoint
   */
  private groupMetricsByEndpoint(metrics: ApiMetrics[]) {
    const grouped: Record<string, any> = {};
    
    for (const metric of metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!grouped[key]) {
        grouped[key] = {
          versions: [],
          totalRequests: 0,
          totalErrors: 0
        };
      }
      
      grouped[key].versions.push(metric.version);
      grouped[key].totalRequests += metric.requestCount;
      grouped[key].totalErrors += metric.errorCount;
    }
    
    return grouped;
  }

  /**
   * Normalize version string
   */
  private normalizeVersion(version: string): string {
    version = version.replace(/^v/, '');
    return semver.valid(version) || version;
  }

  /**
   * Simple authentication middleware (placeholder)
   */
  private authenticate(req: Request, res: Response, next: NextFunction): void {
    // TODO: Implement proper authentication
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' }) as any;
    }
    next();
  }

  /**
   * Get Express router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Get middleware
   */
  getMiddleware() {
    return this.middleware.middleware();
  }

  /**
   * Get documentation router
   */
  getDocumentationRouter(): Router {
    return this.documentation.getRouter();
  }

  /**
   * Export API specification
   */
  exportApiSpec(version: string): any {
    const endpoints = Array.from(this.endpoints.values());
    return this.documentation.generateSpec(version, endpoints);
  }
}