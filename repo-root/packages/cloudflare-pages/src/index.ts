/**
 * Cloudflare Pages Configuration Package
 * Export all utilities for LocumTrueRate deployment
 */

export { SecurityHeaders, type SecurityConfig } from './security-headers';
export { CloudflarePagesDeploy, type DeploymentConfig } from './deployment';
export { Performance } from './performance';
export { createDefaultConfig, validateConfig } from './config';

// Import for use in functions below
import { SecurityHeaders } from './security-headers';
import { CloudflarePagesDeploy, DeploymentConfig } from './deployment';

// Default configurations for different environments
export const defaultConfigs = {
  development: {
    enableCSP: true,
    enableHSTS: false,
    enableCORS: true,
    environment: 'development' as const,
    domains: {
      main: 'localhost:3000',
      api: 'localhost:3001',
      cdn: 'localhost:3002',
      assets: 'localhost:3003'
    },
    features: {
      analytics: false,
      monitoring: true,
      webGL: false,
      geolocation: false
    }
  },
  
  staging: {
    enableCSP: true,
    enableHSTS: true,
    enableCORS: true,
    environment: 'staging' as const,
    domains: {
      main: 'staging.locumtruerate.com',
      api: 'api-staging.locumtruerate.com',
      cdn: 'cdn-staging.locumtruerate.com',
      assets: 'assets-staging.locumtruerate.com'
    },
    features: {
      analytics: true,
      monitoring: true,
      webGL: false,
      geolocation: true
    }
  },
  
  production: {
    enableCSP: true,
    enableHSTS: true,
    enableCORS: false,
    environment: 'production' as const,
    domains: {
      main: 'locumtruerate.com',
      api: 'api.locumtruerate.com',
      cdn: 'cdn.locumtruerate.com',
      assets: 'assets.locumtruerate.com'
    },
    features: {
      analytics: true,
      monitoring: true,
      webGL: false,
      geolocation: true
    }
  }
};

/**
 * Quick setup function for common use cases
 */
export function createSecurityHeaders(environment: 'development' | 'staging' | 'production') {
  const config = defaultConfigs[environment];
  return new SecurityHeaders(config);
}

/**
 * Quick deployment setup
 */
export function createDeployment(
  projectName: string,
  accountId: string,
  environment: 'development' | 'staging' | 'production',
  overrides?: Partial<DeploymentConfig>
) {
  const baseConfig: DeploymentConfig = {
    projectName,
    accountId,
    buildCommand: 'npm run build',
    buildOutput: 'dist',
    environment,
    domains: defaultConfigs[environment].domains,
    environmentVariables: {},
    buildOptimization: {
      minify: environment === 'production',
      treeshake: true,
      splitChunks: true,
      compressionLevel: environment === 'production' ? 9 : 6
    },
    security: defaultConfigs[environment]
  };

  const config = { ...baseConfig, ...overrides };
  return new CloudflarePagesDeploy(config);
}