import { TRPCError } from '@trpc/server';
import { Context } from './context';

export const API_VERSION = {
  v1: '1.0.0',
  current: '1.0.0',
  deprecated: [] as string[],
} as const;

export type ApiVersion = keyof typeof API_VERSION;

/**
 * Middleware to handle API versioning
 * Checks the x-api-version header and ensures compatibility
 */
export function versionMiddleware(opts: {
  ctx: Context;
  next: () => Promise<any>;
  input: any;
}) {
  const { ctx } = opts;
  const requestedVersion = ctx.req?.headers?.['x-api-version'] as string;

  // If no version specified, use current version
  if (!requestedVersion) {
    return opts.next();
  }

  // Check if requested version is deprecated
  if (API_VERSION.deprecated.includes(requestedVersion)) {
    console.warn(`API version ${requestedVersion} is deprecated`);
    // Add deprecation warning to response headers if possible
    if (ctx.res) {
      ctx.res.setHeader('X-API-Deprecation-Warning', `Version ${requestedVersion} is deprecated. Please upgrade to ${API_VERSION.current}`);
    }
  }

  // Check if version is supported
  const supportedVersions = Object.values(API_VERSION).filter(v => typeof v === 'string');
  if (!supportedVersions.includes(requestedVersion)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Unsupported API version: ${requestedVersion}. Supported versions: ${supportedVersions.join(', ')}`,
    });
  }

  // Store version in context for use in procedures
  (ctx as any).apiVersion = requestedVersion;

  return opts.next();
}

/**
 * Helper to create versioned procedures
 * Allows different implementations based on API version
 */
export function createVersionedProcedure<T extends Record<string, any>>(
  versions: T
): (ctx: Context) => any {
  return (ctx: Context) => {
    const version = (ctx as any).apiVersion || API_VERSION.current;
    const implementation = versions[version] || versions[API_VERSION.current];
    
    if (!implementation) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `No implementation found for API version ${version}`,
      });
    }
    
    return implementation;
  };
}

/**
 * Deprecation helper for marking procedures as deprecated
 */
export function deprecated(message: string, removeInVersion?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      console.warn(`[DEPRECATED] ${propertyKey}: ${message}. ${removeInVersion ? `Will be removed in version ${removeInVersion}` : ''}`);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}