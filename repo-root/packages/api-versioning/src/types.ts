/**
 * API Versioning Type Definitions
 */

import type { Request, Response, NextFunction } from 'express';
import type { OpenAPIV3 } from 'openapi-types';

export type VersioningMethod = 'header' | 'url' | 'query' | 'accept';

export interface ApiVersion {
  version: string;
  releaseDate: Date;
  deprecated?: boolean;
  deprecationDate?: Date;
  sunsetDate?: Date;
  changes: string[];
  breakingChanges?: string[];
}

export interface VersioningConfig {
  method: VersioningMethod;
  defaultVersion: string;
  supportedVersions: string[];
  header?: string; // For header versioning
  queryParam?: string; // For query versioning
  versionPrefix?: string; // For URL versioning (e.g., /v1/, /v2/)
  strict?: boolean; // Reject requests without version
  enableDocumentation?: boolean;
  deprecationWarningDays?: number;
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  versions: {
    [version: string]: {
      handler: (req: Request, res: Response, next: NextFunction) => void;
      deprecated?: boolean;
      schema?: {
        request?: any;
        response?: any;
      };
      documentation?: {
        summary: string;
        description?: string;
        tags?: string[];
        security?: Array<{ [key: string]: string[] }>;
      };
    };
  };
}

export interface ApiDeprecation {
  version: string;
  endpoints: string[];
  reason: string;
  deprecatedDate: Date;
  sunsetDate: Date;
  migrationGuide?: string;
  alternativeVersion?: string;
}

export interface DocumentationConfig {
  title: string;
  description: string;
  version: string;
  servers: Array<{
    url: string;
    description: string;
  }>;
  contact?: {
    name: string;
    email: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
  externalDocs?: {
    description: string;
    url: string;
  };
  tags?: Array<{
    name: string;
    description: string;
  }>;
}

export interface OpenApiConfig extends DocumentationConfig {
  openapi: '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3' | '3.1.0';
  components?: OpenAPIV3.ComponentsObject;
  security?: OpenAPIV3.SecurityRequirementObject[];
  webhooks?: { [key: string]: OpenAPIV3.PathItemObject };
}

export interface VersionTransformer {
  fromVersion: string;
  toVersion: string;
  transformRequest?: (data: any) => any;
  transformResponse?: (data: any) => any;
  transformHeaders?: (headers: any) => any;
}

export interface VersionConstraint {
  minimum?: string;
  maximum?: string;
  exclude?: string[];
  beta?: boolean;
  requireAuth?: boolean;
}

export interface ApiMetrics {
  version: string;
  endpoint: string;
  method: string;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastAccessed: Date;
}

export interface VersionMigration {
  from: string;
  to: string;
  automatic: boolean;
  migrationSteps: Array<{
    step: number;
    description: string;
    action: string;
    breaking?: boolean;
  }>;
  estimatedDowntime?: number; // in minutes
  rollbackPlan?: string;
}

// Healthcare-specific API versioning
export interface HealthcareApiCompliance {
  hipaaCompliant: boolean;
  fhirVersion?: string;
  hl7Version?: string;
  encryptionRequired: boolean;
  auditLogging: boolean;
  dataRetentionDays: number;
}

export interface ApiRateLimiting {
  version: string;
  limits: {
    authenticated: {
      requestsPerHour: number;
      requestsPerDay: number;
    };
    unauthenticated: {
      requestsPerHour: number;
      requestsPerDay: number;
    };
    premium?: {
      requestsPerHour: number;
      requestsPerDay: number;
    };
  };
}

export interface ApiChangeLog {
  version: string;
  date: Date;
  changes: Array<{
    type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
    description: string;
    endpoints?: string[];
    breaking?: boolean;
  }>;
}

export interface ApiVersionResponse {
  currentVersion: string;
  supportedVersions: string[];
  deprecatedVersions: Array<{
    version: string;
    deprecatedDate: string;
    sunsetDate: string;
  }>;
  documentation: string;
  changelog: string;
}