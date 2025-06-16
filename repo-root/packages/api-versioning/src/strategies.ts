/**
 * API Versioning Strategies
 * Different strategies for implementing API versioning
 */

import type { Request, Response, NextFunction } from 'express';
import type { VersioningConfig } from './types';

export abstract class VersioningStrategy {
  constructor(protected config: VersioningConfig) {}
  
  abstract extractVersion(req: Request): string | undefined;
  abstract applyVersion(req: Request, res: Response, version: string): void;
  
  /**
   * Get middleware function for this strategy
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const version = this.extractVersion(req) || this.config.defaultVersion;
        this.applyVersion(req, res, version);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

/**
 * Header-based versioning strategy
 * Example: API-Version: 1.0.0
 */
export class HeaderVersioning extends VersioningStrategy {
  private headerName: string;
  
  constructor(config: VersioningConfig) {
    super(config);
    this.headerName = config.header || 'api-version';
  }
  
  extractVersion(req: Request): string | undefined {
    const version = req.headers[this.headerName.toLowerCase()] as string;
    return version?.replace(/^v/, ''); // Remove 'v' prefix if present
  }
  
  applyVersion(req: Request, res: Response, version: string): void {
    req.apiVersion = version;
    res.setHeader('API-Version', version);
    res.setHeader('Vary', this.headerName);
  }
}

/**
 * URL path versioning strategy
 * Example: /v1/users, /v2/users
 */
export class UrlVersioning extends VersioningStrategy {
  private versionPrefix: string;
  
  constructor(config: VersioningConfig) {
    super(config);
    this.versionPrefix = config.versionPrefix || 'v';
  }
  
  extractVersion(req: Request): string | undefined {
    const pattern = new RegExp(`^\\/${this.versionPrefix}(\\d+(?:\\.\\d+)*)`);
    const match = req.path.match(pattern);
    
    if (match) {
      // Strip version from path for downstream routing
      req.url = req.url.replace(pattern, '');
      req.path = req.path.replace(pattern, '');
      return match[1];
    }
    
    return undefined;
  }
  
  applyVersion(req: Request, res: Response, version: string): void {
    req.apiVersion = version;
    res.setHeader('API-Version', version);
    
    // Store original path
    (req as any).originalPath = req.path;
    (req as any).versionedPath = `/${this.versionPrefix}${version}${req.path}`;
  }
}

/**
 * Query parameter versioning strategy
 * Example: /users?version=1.0.0
 */
export class QueryVersioning extends VersioningStrategy {
  private paramName: string;
  
  constructor(config: VersioningConfig) {
    super(config);
    this.paramName = config.queryParam || 'version';
  }
  
  extractVersion(req: Request): string | undefined {
    const version = req.query[this.paramName] as string;
    return version?.replace(/^v/, '');
  }
  
  applyVersion(req: Request, res: Response, version: string): void {
    req.apiVersion = version;
    res.setHeader('API-Version', version);
    
    // Remove version from query params to avoid pollution
    delete req.query[this.paramName];
  }
}

/**
 * Accept header versioning strategy
 * Example: Accept: application/vnd.api+json;version=1.0
 */
export class AcceptHeaderVersioning extends VersioningStrategy {
  extractVersion(req: Request): string | undefined {
    const acceptHeader = req.headers.accept || '';
    
    // Look for version in media type parameters
    const versionMatch = acceptHeader.match(/version=(\d+(?:\.\d+)*)/);
    if (versionMatch) {
      return versionMatch[1];
    }
    
    // Look for version in vendor media type
    const vendorMatch = acceptHeader.match(/application\/vnd\.[\w-]+\.v(\d+(?:\.\d+)*)\+json/);
    if (vendorMatch) {
      return vendorMatch[1];
    }
    
    return undefined;
  }
  
  applyVersion(req: Request, res: Response, version: string): void {
    req.apiVersion = version;
    res.setHeader('API-Version', version);
    res.setHeader('Vary', 'Accept');
    
    // Set appropriate content type
    const mediaType = `application/vnd.locumtruerate.v${version}+json`;
    res.setHeader('Content-Type', mediaType);
  }
}

/**
 * Custom versioning strategy
 * Allows for completely custom version extraction and application
 */
export class CustomVersioning extends VersioningStrategy {
  constructor(
    config: VersioningConfig,
    private extractFn: (req: Request) => string | undefined,
    private applyFn: (req: Request, res: Response, version: string) => void
  ) {
    super(config);
  }
  
  extractVersion(req: Request): string | undefined {
    return this.extractFn(req);
  }
  
  applyVersion(req: Request, res: Response, version: string): void {
    this.applyFn(req, res, version);
  }
}

/**
 * Composite versioning strategy
 * Tries multiple strategies in order
 */
export class CompositeVersioning extends VersioningStrategy {
  constructor(
    config: VersioningConfig,
    private strategies: VersioningStrategy[]
  ) {
    super(config);
  }
  
  extractVersion(req: Request): string | undefined {
    for (const strategy of this.strategies) {
      const version = strategy.extractVersion(req);
      if (version) {
        return version;
      }
    }
    return undefined;
  }
  
  applyVersion(req: Request, res: Response, version: string): void {
    // Apply version using the first strategy
    if (this.strategies.length > 0) {
      this.strategies[0].applyVersion(req, res, version);
    }
  }
}

/**
 * Factory function to create versioning strategy
 */
export function createVersioningStrategy(config: VersioningConfig): VersioningStrategy {
  switch (config.method) {
    case 'header':
      return new HeaderVersioning(config);
    case 'url':
      return new UrlVersioning(config);
    case 'query':
      return new QueryVersioning(config);
    case 'accept':
      return new AcceptHeaderVersioning(config);
    default:
      throw new Error(`Unsupported versioning method: ${config.method}`);
  }
}

/**
 * Healthcare-specific versioning strategy
 * Includes FHIR and HL7 version negotiation
 */
export class HealthcareVersioning extends VersioningStrategy {
  extractVersion(req: Request): string | undefined {
    // Check for FHIR version header
    const fhirVersion = req.headers['fhir-version'] as string;
    if (fhirVersion) {
      return this.mapFhirVersion(fhirVersion);
    }
    
    // Check for HL7 version
    const hl7Version = req.headers['hl7-version'] as string;
    if (hl7Version) {
      return this.mapHl7Version(hl7Version);
    }
    
    // Fall back to standard header
    return req.headers['api-version'] as string;
  }
  
  applyVersion(req: Request, res: Response, version: string): void {
    req.apiVersion = version;
    res.setHeader('API-Version', version);
    
    // Add healthcare-specific headers
    res.setHeader('X-Healthcare-Compliance', 'HIPAA');
    res.setHeader('X-Data-Classification', 'PHI');
  }
  
  private mapFhirVersion(fhirVersion: string): string {
    // Map FHIR versions to API versions
    const fhirMapping: Record<string, string> = {
      '4.0.1': '2.0.0',
      '4.0.0': '2.0.0',
      '3.0.2': '1.5.0',
      '3.0.1': '1.5.0'
    };
    
    return fhirMapping[fhirVersion] || this.config.defaultVersion;
  }
  
  private mapHl7Version(hl7Version: string): string {
    // Map HL7 versions to API versions
    const hl7Mapping: Record<string, string> = {
      '2.9': '2.0.0',
      '2.8': '1.5.0',
      '2.7': '1.0.0'
    };
    
    return hl7Mapping[hl7Version] || this.config.defaultVersion;
  }
}