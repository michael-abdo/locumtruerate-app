/**
 * Configuration validation and helpers
 * Utilities for managing Cloudflare Pages configuration
 */

import type { SecurityConfig, DeploymentConfig } from './index';

/**
 * Create default configuration based on environment
 */
export function createDefaultConfig(
  environment: 'development' | 'staging' | 'production',
  projectName: string,
  accountId: string
): DeploymentConfig {
  const isDev = environment === 'development';
  const isProd = environment === 'production';

  return {
    projectName,
    accountId,
    buildCommand: isProd ? 'npm run build:prod' : 'npm run build',
    buildOutput: 'dist',
    environment,
    domains: {
      main: isDev ? 'localhost:3000' : 
            environment === 'staging' ? 'staging.locumtruerate.com' : 
            'locumtruerate.com',
      api: isDev ? 'localhost:3001' : 
           environment === 'staging' ? 'api-staging.locumtruerate.com' : 
           'api.locumtruerate.com',
      cdn: isDev ? 'localhost:3002' : 
           environment === 'staging' ? 'cdn-staging.locumtruerate.com' : 
           'cdn.locumtruerate.com',
      assets: isDev ? 'localhost:3003' : 
              environment === 'staging' ? 'assets-staging.locumtruerate.com' : 
              'assets.locumtruerate.com'
    },
    environmentVariables: getDefaultEnvironmentVariables(environment),
    buildOptimization: {
      minify: !isDev,
      treeshake: true,
      splitChunks: true,
      compressionLevel: isProd ? 9 : 6
    },
    security: {
      enableCSP: true,
      enableHSTS: isProd,
      enableCORS: isDev,
      environment,
      domains: {
        main: isDev ? 'localhost:3000' : 
              environment === 'staging' ? 'staging.locumtruerate.com' : 
              'locumtruerate.com',
        api: isDev ? 'localhost:3001' : 
             environment === 'staging' ? 'api-staging.locumtruerate.com' : 
             'api.locumtruerate.com',
        cdn: isDev ? 'localhost:3002' : 
             environment === 'staging' ? 'cdn-staging.locumtruerate.com' : 
             'cdn.locumtruerate.com',
        assets: isDev ? 'localhost:3003' : 
                environment === 'staging' ? 'assets-staging.locumtruerate.com' : 
                'assets.locumtruerate.com'
      },
      features: {
        analytics: !isDev,
        monitoring: true,
        webGL: false,
        geolocation: !isDev
      }
    }
  };
}

/**
 * Get default environment variables for each environment
 */
function getDefaultEnvironmentVariables(environment: string): Record<string, string> {
  const base = {
    NODE_ENV: environment,
    ENVIRONMENT: environment,
    NEXT_PUBLIC_ENVIRONMENT: environment
  };

  switch (environment) {
    case 'development':
      return {
        ...base,
        LOG_LEVEL: 'debug',
        ENABLE_ANALYTICS: 'false',
        ENABLE_MONITORING: 'true'
      };
    
    case 'staging':
      return {
        ...base,
        LOG_LEVEL: 'info',
        ENABLE_ANALYTICS: 'true',
        ENABLE_MONITORING: 'true',
        ROBOTS_NOINDEX: 'true'
      };
    
    case 'production':
      return {
        ...base,
        LOG_LEVEL: 'warn',
        ENABLE_ANALYTICS: 'true',
        ENABLE_MONITORING: 'true',
        ROBOTS_NOINDEX: 'false'
      };
    
    default:
      return base;
  }
}

/**
 * Validate deployment configuration
 */
export function validateConfig(config: DeploymentConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!config.projectName) {
    errors.push('Project name is required');
  }

  if (!config.accountId) {
    errors.push('Cloudflare account ID is required');
  }

  if (!config.buildCommand) {
    errors.push('Build command is required');
  }

  if (!config.buildOutput) {
    errors.push('Build output directory is required');
  }

  // Validate domains
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$|^localhost:\d+$/;
  
  if (!domainRegex.test(config.domains.main)) {
    errors.push(`Invalid main domain: ${config.domains.main}`);
  }

  if (!domainRegex.test(config.domains.api)) {
    errors.push(`Invalid API domain: ${config.domains.api}`);
  }

  // Validate environment
  if (!['development', 'staging', 'production'].includes(config.environment)) {
    errors.push('Environment must be development, staging, or production');
  }

  // Security validation
  if (config.environment === 'production') {
    if (!config.security.enableHSTS) {
      warnings.push('HSTS should be enabled in production');
    }

    if (config.security.enableCORS) {
      warnings.push('CORS should be restricted in production');
    }

    if (!config.security.enableCSP) {
      errors.push('CSP must be enabled in production');
    }
  }

  // Build optimization validation
  if (config.environment === 'production') {
    if (!config.buildOptimization.minify) {
      warnings.push('Minification should be enabled in production');
    }

    if (config.buildOptimization.compressionLevel < 6) {
      warnings.push('Compression level should be higher in production');
    }
  }

  // Environment variables validation
  const requiredEnvVars = ['NODE_ENV', 'ENVIRONMENT'];
  for (const envVar of requiredEnvVars) {
    if (!config.environmentVariables[envVar]) {
      warnings.push(`Missing recommended environment variable: ${envVar}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Merge configurations with deep merge
 */
export function mergeConfigs(
  base: DeploymentConfig, 
  override: Partial<DeploymentConfig>
): DeploymentConfig {
  return {
    ...base,
    ...override,
    domains: {
      ...base.domains,
      ...override.domains
    },
    environmentVariables: {
      ...base.environmentVariables,
      ...override.environmentVariables
    },
    buildOptimization: {
      ...base.buildOptimization,
      ...override.buildOptimization
    },
    security: {
      ...base.security,
      ...override.security,
      domains: {
        ...base.security.domains,
        ...override.security?.domains
      },
      features: {
        ...base.security.features,
        ...override.security?.features
      }
    }
  };
}

/**
 * Generate configuration templates
 */
export const configTemplates = {
  /**
   * Basic SPA configuration
   */
  spa: (projectName: string, accountId: string, environment: string) => ({
    ...createDefaultConfig(environment as any, projectName, accountId),
    buildCommand: 'npm run build',
    buildOutput: 'build'
  }),

  /**
   * Next.js configuration
   */
  nextjs: (projectName: string, accountId: string, environment: string) => ({
    ...createDefaultConfig(environment as any, projectName, accountId),
    buildCommand: 'npm run build && npm run export',
    buildOutput: 'out'
  }),

  /**
   * Vite configuration
   */
  vite: (projectName: string, accountId: string, environment: string) => ({
    ...createDefaultConfig(environment as any, projectName, accountId),
    buildCommand: 'npm run build',
    buildOutput: 'dist'
  }),

  /**
   * Nuxt.js configuration
   */
  nuxt: (projectName: string, accountId: string, environment: string) => ({
    ...createDefaultConfig(environment as any, projectName, accountId),
    buildCommand: 'npm run generate',
    buildOutput: 'dist'
  })
};

/**
 * Validate project structure
 */
export function validateProjectStructure(projectRoot: string): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const fs = require('fs');
  const path = require('path');
  
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for package.json
  if (!fs.existsSync(path.join(projectRoot, 'package.json'))) {
    issues.push('package.json not found');
  }

  // Check for build script
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    if (!packageJson.scripts?.build) {
      suggestions.push('Add a build script to package.json');
    }
  } catch {
    issues.push('package.json is not valid JSON');
  }

  // Check for common build outputs
  const commonBuildDirs = ['dist', 'build', 'out', '.next'];
  const buildDirExists = commonBuildDirs.some(dir => 
    fs.existsSync(path.join(projectRoot, dir))
  );

  if (!buildDirExists) {
    suggestions.push('Run build command to create build output directory');
  }

  // Check for wrangler.toml
  if (!fs.existsSync(path.join(projectRoot, 'wrangler.toml'))) {
    suggestions.push('Consider adding wrangler.toml for advanced configuration');
  }

  // Check for _headers file
  const possibleHeadersLocations = [
    'public/_headers',
    'static/_headers',
    '_headers'
  ];

  const hasHeaders = possibleHeadersLocations.some(location =>
    fs.existsSync(path.join(projectRoot, location))
  );

  if (!hasHeaders) {
    suggestions.push('Add _headers file for custom HTTP headers');
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions
  };
}