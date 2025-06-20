/**
 * API Versioning Middleware
 * Express middleware for handling API versioning
 */

import type { Request, Response, NextFunction } from 'express';
import semver from 'semver';
import { AppError, ErrorCode } from '@locumtruerate/shared';
import type { VersioningConfig, ApiVersion } from './types';

declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
      requestedVersion?: string;
      versionWarnings?: string[];
    }
  }
}

export class ApiVersioningMiddleware {
  private versions: Map<string, ApiVersion> = new Map();
  
  constructor(private config: VersioningConfig) {
    this.validateConfig();
    this.initializeVersions();
  }

  /**
   * Express middleware function
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const version = this.extractVersion(req);
        const validatedVersion = this.validateVersion(version);
        
        // Set version on request
        req.apiVersion = validatedVersion;
        req.requestedVersion = version;
        req.versionWarnings = [];

        // Add version headers to response
        res.setHeader('API-Version', validatedVersion);
        res.setHeader('Supported-Versions', this.config.supportedVersions.join(', '));
        
        // Check for deprecation
        this.checkDeprecation(validatedVersion, req, res);
        
        // Add version to response format
        this.setupVersionedResponse(res, validatedVersion);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Extract version from request based on configured method
   */
  private extractVersion(req: Request): string {
    let version: string | undefined;

    switch (this.config.method) {
      case 'header':
        version = req.headers[this.config.header || 'api-version'] as string;
        break;
        
      case 'url':
        // Extract from URL path (e.g., /v1/users -> v1)
        const versionMatch = req.path.match(/^\/?(v\d+(?:\.\d+)*)\//);
        version = versionMatch ? versionMatch[1] : undefined;
        break;
        
      case 'query':
        version = req.query[this.config.queryParam || 'version'] as string;
        break;
        
      case 'accept':
        // Extract from Accept header (e.g., application/vnd.api+json;version=1.0)
        const acceptHeader = req.headers.accept || '';
        const acceptMatch = acceptHeader.match(/version=(\d+(?:\.\d+)*)/);
        version = acceptMatch ? acceptMatch[1] : undefined;
        break;
    }

    // Normalize version format (v1 -> 1.0.0, 1 -> 1.0.0)
    if (version) {
      version = version.replace(/^v/, ''); // Remove 'v' prefix
      if (!version.includes('.')) {
        version = `${version}.0.0`;
      } else if (version.split('.').length === 2) {
        version = `${version}.0`;
      }
    }

    return version || this.config.defaultVersion;
  }

  /**
   * Validate the requested version
   */
  private validateVersion(version: string): string {
    // Check if version is valid semver
    if (!semver.valid(version)) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        `Invalid API version format: ${version}`,
        400
      );
    }

    // Check if version is supported
    const supportedVersions = this.config.supportedVersions.map(v => {
      const normalized = this.normalizeVersion(v);
      return semver.valid(normalized) || normalized;
    });

    const isSupported = supportedVersions.some(supported => {
      return semver.satisfies(version, supported) || 
             semver.eq(version, this.normalizeVersion(supported));
    });

    if (!isSupported && this.config.strict) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        `API version ${version} is not supported. Supported versions: ${this.config.supportedVersions.join(', ')}`,
        400
      );
    }

    return version;
  }

  /**
   * Check if version is deprecated
   */
  private checkDeprecation(version: string, req: Request, res: Response): void {
    const versionInfo = this.versions.get(version);
    
    if (versionInfo?.deprecated) {
      const warning = `API version ${version} is deprecated`;
      const sunset = versionInfo.sunsetDate 
        ? ` and will be removed on ${versionInfo.sunsetDate.toISOString().split('T')[0]}`
        : '';
      
      const fullWarning = `${warning}${sunset}. Please upgrade to ${this.config.defaultVersion}`;
      
      // Add deprecation headers
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', versionInfo.sunsetDate?.toUTCString() || '');
      res.setHeader('Link', `</docs/api/migration>; rel="deprecation"`);
      res.setHeader('Warning', `299 - "${fullWarning}"`);
      
      // Add to request warnings
      req.versionWarnings?.push(fullWarning);
    }
  }

  /**
   * Setup versioned response format
   */
  private setupVersionedResponse(res: Response, version: string): void {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      // Wrap response in versioned envelope if configured
      const versionedResponse = {
        version,
        timestamp: new Date().toISOString(),
        data
      };
      
      return originalJson(versionedResponse);
    };
  }

  /**
   * Normalize version string
   */
  private normalizeVersion(version: string): string {
    version = version.replace(/^v/, '');
    
    if (!version.includes('.')) {
      return `${version}.0.0`;
    }
    
    const parts = version.split('.');
    while (parts.length < 3) {
      parts.push('0');
    }
    
    return parts.join('.');
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.defaultVersion) {
      throw new Error('Default version is required');
    }
    
    if (!this.config.supportedVersions || this.config.supportedVersions.length === 0) {
      throw new Error('At least one supported version is required');
    }
    
    if (!this.config.supportedVersions.includes(this.config.defaultVersion)) {
      this.config.supportedVersions.push(this.config.defaultVersion);
    }
  }

  /**
   * Initialize version information
   */
  private initializeVersions(): void {
    // Initialize with current supported versions
    for (const version of this.config.supportedVersions) {
      const normalized = this.normalizeVersion(version);
      this.versions.set(normalized, {
        version: normalized,
        releaseDate: new Date(),
        changes: []
      });
    }
  }

  /**
   * Register a new version
   */
  registerVersion(versionInfo: ApiVersion): void {
    const normalized = this.normalizeVersion(versionInfo.version);
    this.versions.set(normalized, {
      ...versionInfo,
      version: normalized
    });
    
    if (!this.config.supportedVersions.includes(normalized)) {
      this.config.supportedVersions.push(normalized);
    }
  }

  /**
   * Mark version as deprecated
   */
  deprecateVersion(
    version: string, 
    deprecationDate: Date = new Date(),
    sunsetDate?: Date
  ): void {
    const normalized = this.normalizeVersion(version);
    const versionInfo = this.versions.get(normalized);
    
    if (versionInfo) {
      versionInfo.deprecated = true;
      versionInfo.deprecationDate = deprecationDate;
      versionInfo.sunsetDate = sunsetDate;
      this.versions.set(normalized, versionInfo);
    }
  }

  /**
   * Get version negotiation middleware for specific endpoints
   */
  negotiateVersion(supportedVersions: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const requestedVersion = req.apiVersion || this.config.defaultVersion;
      
      // Find best matching version
      const bestMatch = this.findBestVersionMatch(requestedVersion, supportedVersions);
      
      if (!bestMatch) {
        throw new AppError(
          ErrorCode.INVALID_INPUT,
          `This endpoint does not support version ${requestedVersion}. Supported versions: ${supportedVersions.join(', ')}`,
          400
        );
      }
      
      req.apiVersion = bestMatch;
      next();
    };
  }

  /**
   * Find best matching version
   */
  private findBestVersionMatch(requested: string, supported: string[]): string | null {
    const normalizedRequested = this.normalizeVersion(requested);
    const normalizedSupported = supported.map(v => this.normalizeVersion(v));
    
    // Exact match
    if (normalizedSupported.includes(normalizedRequested)) {
      return normalizedRequested;
    }
    
    // Find compatible version (same major version)
    const requestedMajor = semver.major(normalizedRequested);
    const compatible = normalizedSupported
      .filter(v => semver.major(v) === requestedMajor)
      .sort((a, b) => semver.rcompare(a, b));
    
    return compatible[0] || null;
  }

  /**
   * Version transformation middleware
   */
  transformVersion(fromVersion: string, toVersion: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.apiVersion === fromVersion) {
        // Transform request to target version format
        // This is where version-specific transformations would occur
        req.apiVersion = toVersion;
        
        // Add transformation warning
        req.versionWarnings?.push(
          `Request transformed from version ${fromVersion} to ${toVersion}`
        );
      }
      next();
    };
  }

  /**
   * Get version information endpoint handler
   */
  versionInfoHandler() {
    return (req: Request, res: Response) => {
      const supportedVersions = this.config.supportedVersions
        .map(v => this.normalizeVersion(v))
        .sort(semver.rcompare);
      
      const deprecatedVersions = Array.from(this.versions.entries())
        .filter(([_, info]) => info.deprecated)
        .map(([version, info]) => ({
          version,
          deprecatedDate: info.deprecationDate?.toISOString() || '',
          sunsetDate: info.sunsetDate?.toISOString() || ''
        }));
      
      res.json({
        currentVersion: this.config.defaultVersion,
        supportedVersions,
        deprecatedVersions,
        documentation: '/api/docs',
        changelog: '/api/changelog'
      });
    };
  }
}