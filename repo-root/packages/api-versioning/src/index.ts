/**
 * API Versioning Package Entry Point
 * Comprehensive API versioning and documentation for LocumTrueRate platform
 */

export { ApiVersioningMiddleware } from './middleware';
export { ApiDocumentation } from './documentation';
export { VersioningStrategy, HeaderVersioning, UrlVersioning, QueryVersioning } from './strategies';
export { ApiVersionManager } from './manager';
export { generateOpenApiSpec } from './openapi';

// Re-export types
export type {
  ApiVersion,
  VersioningConfig,
  ApiEndpoint,
  ApiDeprecation,
  DocumentationConfig,
  OpenApiConfig,
  VersionTransformer,
  VersionConstraint
} from './types';