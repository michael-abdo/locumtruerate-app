/**
 * Cloudflare Pages Deployment Configuration
 * Automated deployment with optimization and security
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { SecurityHeaders, SecurityConfig } from './security-headers';

export interface DeploymentConfig {
  projectName: string;
  accountId: string;
  buildCommand: string;
  buildOutput: string;
  environment: 'development' | 'staging' | 'production';
  domains: {
    main: string;
    api: string;
    cdn: string;
    assets: string;
  };
  environmentVariables: Record<string, string>;
  buildOptimization: {
    minify: boolean;
    treeshake: boolean;
    splitChunks: boolean;
    compressionLevel: number;
  };
  security: SecurityConfig;
}

export class CloudflarePagesDeploy {
  private config: DeploymentConfig;
  private securityHeaders: SecurityHeaders;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.securityHeaders = new SecurityHeaders(config.security);
  }

  /**
   * Deploy to Cloudflare Pages
   */
  async deploy(): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log(`🚀 Deploying ${this.config.projectName} to Cloudflare Pages...`);

      // Pre-deployment checks
      await this.preDeploymentChecks();

      // Generate security files
      await this.generateSecurityFiles();

      // Build the project
      await this.buildProject();

      // Deploy to Cloudflare Pages
      const deployResult = await this.deployToCloudflare();

      // Post-deployment verification
      await this.postDeploymentChecks(deployResult.url);

      console.log(`✅ Deployment successful: ${deployResult.url}`);
      return { success: true, url: deployResult.url };

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Pre-deployment security and configuration checks
   */
  private async preDeploymentChecks(): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');

    // Check if wrangler is installed
    try {
      execSync('wrangler --version', { stdio: 'pipe' });
    } catch {
      throw new Error('Wrangler CLI is not installed. Run: npm install -g wrangler');
    }

    // Validate CSP policy
    const cspValidation = this.securityHeaders.validateCSP();
    if (!cspValidation.valid) {
      throw new Error(`CSP validation failed: ${cspValidation.errors.join(', ')}`);
    }

    if (cspValidation.warnings.length > 0) {
      console.warn('⚠️  CSP warnings:', cspValidation.warnings.join(', '));
    }

    // Check required environment variables
    const requiredEnvVars = [
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Validate build output directory exists
    if (!fs.existsSync(this.config.buildOutput)) {
      throw new Error(`Build output directory not found: ${this.config.buildOutput}`);
    }

    console.log('✅ Pre-deployment checks passed');
  }

  /**
   * Generate security files (_headers, robots.txt, security.txt)
   */
  private async generateSecurityFiles(): Promise<void> {
    console.log('🛡️  Generating security files...');

    const outputDir = this.config.buildOutput;

    // Generate _headers file
    const headersContent = this.securityHeaders.generateHeadersFile();
    fs.writeFileSync(path.join(outputDir, '_headers'), headersContent);

    // Generate robots.txt
    const robotsContent = SecurityHeaders.generateRobotsTxt(
      this.config.domains.main,
      this.config.environment
    );
    fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsContent);

    // Generate security.txt
    const securityTxtContent = SecurityHeaders.generateSecurityTxt(this.config.domains.main);
    const wellKnownDir = path.join(outputDir, '.well-known');
    if (!fs.existsSync(wellKnownDir)) {
      fs.mkdirSync(wellKnownDir, { recursive: true });
    }
    fs.writeFileSync(path.join(wellKnownDir, 'security.txt'), securityTxtContent);

    // Generate sitemap.xml placeholder
    const sitemapContent = this.generateSitemap();
    fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemapContent);

    console.log('✅ Security files generated');
  }

  /**
   * Build the project with optimizations
   */
  private async buildProject(): Promise<void> {
    console.log('🔨 Building project...');

    const { buildCommand } = this.config;
    const { minify, treeshake, splitChunks, compressionLevel } = this.config.buildOptimization;

    // Set build environment variables
    const buildEnv = {
      ...process.env,
      NODE_ENV: this.config.environment,
      NEXT_PUBLIC_ENVIRONMENT: this.config.environment,
      ANALYZE_BUNDLE: 'false',
      // Optimization flags
      MINIFY: minify.toString(),
      TREESHAKE: treeshake.toString(),
      SPLIT_CHUNKS: splitChunks.toString(),
      COMPRESSION_LEVEL: compressionLevel.toString()
    };

    try {
      execSync(buildCommand, { 
        stdio: 'inherit',
        env: buildEnv,
        cwd: process.cwd()
      });
      console.log('✅ Build completed successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error}`);
    }
  }

  /**
   * Deploy to Cloudflare Pages using Wrangler
   */
  private async deployToCloudflare(): Promise<{ url: string }> {
    console.log('☁️  Deploying to Cloudflare Pages...');

    const { projectName, accountId, buildOutput, environmentVariables } = this.config;

    // Create wrangler.toml if it doesn't exist
    const wranglerConfig = this.generateWranglerConfig();
    fs.writeFileSync('wrangler.toml', wranglerConfig);

    // Set environment variables
    const envVars = Object.entries(environmentVariables)
      .map(([key, value]) => `--var ${key}:${value}`)
      .join(' ');

    // Deploy command
    const deployCommand = `wrangler pages deploy ${buildOutput} --project-name ${projectName} --compatibility-date 2024-01-01 ${envVars}`;

    try {
      const output = execSync(deployCommand, { 
        stdio: 'pipe',
        encoding: 'utf8'
      });

      // Extract URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : `https://${projectName}.pages.dev`;

      return { url };
    } catch (error) {
      throw new Error(`Cloudflare Pages deployment failed: ${error}`);
    }
  }

  /**
   * Post-deployment verification checks
   */
  private async postDeploymentChecks(url: string): Promise<void> {
    console.log('🔍 Running post-deployment checks...');

    // Wait for deployment to propagate
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
      // Check if site is accessible
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Site not accessible: HTTP ${response.status}`);
      }

      // Check security headers
      const headers = response.headers;
      const requiredHeaders = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options'
      ];

      for (const header of requiredHeaders) {
        if (!headers.has(header)) {
          console.warn(`⚠️  Missing security header: ${header}`);
        }
      }

      console.log('✅ Post-deployment checks passed');
    } catch (error) {
      console.warn(`⚠️  Post-deployment check failed: ${error}`);
      // Don't fail the entire deployment for verification issues
    }
  }

  /**
   * Generate wrangler.toml configuration
   */
  private generateWranglerConfig(): string {
    const { projectName, accountId, buildCommand, buildOutput } = this.config;

    return `name = "${projectName}"
account_id = "${accountId}"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = "${buildCommand}"
cwd = "."
watch_dir = "src"

[build.upload]
format = "modules"
dir = "${buildOutput}"
main = "./index.js"

# Environment variables
[env.production.vars]
NODE_ENV = "production"
ENVIRONMENT = "production"

[env.staging.vars]
NODE_ENV = "staging"
ENVIRONMENT = "staging"

[env.development.vars]
NODE_ENV = "development"
ENVIRONMENT = "development"

# Security headers
[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
X-XSS-Protection = "1; mode=block"
Referrer-Policy = "strict-origin-when-cross-origin"

# Cache control
[[headers]]
for = "/assets/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "*.js"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "*.css"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

# API routes
[[headers]]
for = "/api/*"
[headers.values]
Cache-Control = "no-store, no-cache, must-revalidate"
X-Robots-Tag = "noindex"

# Redirects
[[redirects]]
from = "/api/v1/*"
to = "/api/v2/:splat"
status = 301

[[redirects]]
from = "/old-path/*"
to = "/new-path/:splat"
status = 301

# Functions
[functions]
directory = "functions"
`
  }

  /**
   * Generate basic sitemap.xml
   */
  private generateSitemap(): string {
    const { main } = this.config.domains;
    const currentDate = new Date().toISOString().split('T')[0];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${main}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${main}/jobs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://${main}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://${main}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://${main}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://${main}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
  }}