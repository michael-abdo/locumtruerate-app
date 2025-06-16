/**
 * Cloudflare Pages Security Headers Configuration
 * HIPAA-compliant security headers for LocumTrueRate platform
 */

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableCORS: boolean;
  environment: 'development' | 'staging' | 'production';
  domains: {
    main: string;
    api: string;
    cdn: string;
    assets: string;
  };
  features: {
    analytics: boolean;
    monitoring: boolean;
    webGL: boolean;
    geolocation: boolean;
  };
}

export class SecurityHeaders {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Generate Content Security Policy
   */
  generateCSP(): string {
    const { domains, features, environment } = this.config;
    
    const policies: Record<string, string[]> = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'strict-dynamic'",
        // Clerk authentication
        'https://clerk.locumtruerate.com',
        'https://clerk.dev',
        // Stripe payments
        'https://js.stripe.com',
        'https://checkout.stripe.com',
        // Analytics (conditional)
        ...(features.analytics ? [
          'https://www.google-analytics.com',
          'https://www.googletagmanager.com',
          'https://cdn.amplitude.com',
          'https://api.mixpanel.com'
        ] : []),
        // Development only
        ...(environment === 'development' ? [
          "'unsafe-eval'",
          "'unsafe-inline'",
          'localhost:*',
          '127.0.0.1:*'
        ] : [])
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS libraries
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        `https://${domains.cdn}`,
        `https://${domains.assets}`,
        // Profile images, logos, etc.
        'https://images.clerk.dev',
        'https://img.clerk.com',
        // Analytics pixels
        ...(features.analytics ? [
          'https://www.google-analytics.com',
          'https://stats.g.doubleclick.net'
        ] : [])
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net'
      ],
      'connect-src': [
        "'self'",
        `https://${domains.api}`,
        // Clerk API
        'https://api.clerk.com',
        'https://clerk.locumtruerate.com',
        // Stripe API
        'https://api.stripe.com',
        // Analytics APIs
        ...(features.analytics ? [
          'https://www.google-analytics.com',
          'https://api.mixpanel.com',
          'https://api2.amplitude.com'
        ] : []),
        // Monitoring
        ...(features.monitoring ? [
          'https://sentry.io',
          'https://*.sentry.io'
        ] : []),
        // Development
        ...(environment === 'development' ? [
          'localhost:*',
          '127.0.0.1:*',
          'ws://localhost:*',
          'wss://localhost:*'
        ] : [])
      ],
      'frame-src': [
        "'self'",
        // Stripe checkout
        'https://checkout.stripe.com',
        'https://js.stripe.com',
        // Clerk auth
        'https://clerk.locumtruerate.com'
      ],
      'worker-src': [
        "'self'",
        'blob:'
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': [
        "'self'",
        `https://${domains.api}`,
        'https://api.stripe.com'
      ],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    };

    // Add geolocation if enabled
    if (features.geolocation) {
      policies['geolocation-src'] = ["'self'"];
    }

    // Add WebGL if enabled
    if (features.webGL) {
      policies['webgl-src'] = ["'self'"];
    } else {
      policies['webgl-src'] = ["'none'"];
    }

    // Convert to CSP string
    const cspString = Object.entries(policies)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');

    return cspString;
  }

  /**
   * Generate all security headers
   */
  generateHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = this.generateCSP();
    }

    // HSTS (HTTPS Strict Transport Security)
    if (this.config.enableHSTS && this.config.environment === 'production') {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    // X-Frame-Options (backup to CSP frame-ancestors)
    headers['X-Frame-Options'] = 'DENY';

    // X-Content-Type-Options
    headers['X-Content-Type-Options'] = 'nosniff';

    // X-XSS-Protection (legacy browsers)
    headers['X-XSS-Protection'] = '1; mode=block';

    // Referrer Policy
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

    // Permissions Policy (Feature Policy replacement)
    const permissions = [
      'geolocation=(self)',
      'camera=()',
      'microphone=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
      'payment=(self "https://checkout.stripe.com")',
      'fullscreen=(self)'
    ];
    headers['Permissions-Policy'] = permissions.join(', ');

    // CORS headers (if enabled)
    if (this.config.enableCORS) {
      headers['Access-Control-Allow-Origin'] = this.config.environment === 'development' 
        ? '*' 
        : `https://${this.config.domains.main}`;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      headers['Access-Control-Max-Age'] = '86400';
    }

    // Cross-Origin policies
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';

    // Cache control for security
    if (this.config.environment === 'production') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    // HIPAA compliance headers
    headers['X-Robots-Tag'] = 'noindex, nofollow, nosnippet, noarchive';
    headers['X-DNS-Prefetch-Control'] = 'off';

    return headers;
  }

  /**
   * Generate _headers file content for Cloudflare Pages
   */
  generateHeadersFile(): string {
    const headers = this.generateHeaders();
    const lines = ['# LocumTrueRate Security Headers Configuration'];
    
    // Apply to all pages
    lines.push('/*');
    Object.entries(headers).forEach(([key, value]) => {
      lines.push(`  ${key}: ${value}`);
    });

    // Special rules for API routes
    lines.push('');
    lines.push('/api/*');
    lines.push('  X-Robots-Tag: noindex');
    lines.push('  Cache-Control: no-store, no-cache, must-revalidate');

    // Special rules for assets
    lines.push('');
    lines.push('/assets/*');
    lines.push('  Cache-Control: public, max-age=31536000, immutable');

    // Special rules for uploads
    lines.push('');
    lines.push('/uploads/*');
    lines.push('  X-Content-Type-Options: nosniff');
    lines.push('  Content-Disposition: attachment');

    return lines.join('\n');
  }

  /**
   * Validate CSP policy
   */
  validateCSP(): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const csp = this.generateCSP();

    // Check for unsafe practices
    if (csp.includes("'unsafe-inline'") && this.config.environment === 'production') {
      warnings.push("Using 'unsafe-inline' in production reduces security");
    }

    if (csp.includes("'unsafe-eval'") && this.config.environment === 'production') {
      errors.push("'unsafe-eval' should not be used in production");
    }

    // Check for missing directives
    const requiredDirectives = ['default-src', 'script-src', 'style-src', 'img-src'];
    requiredDirectives.forEach(directive => {
      if (!csp.includes(directive)) {
        errors.push(`Missing required directive: ${directive}`);
      }
    });

    // Check for overly permissive policies
    if (csp.includes('*') && this.config.environment === 'production') {
      warnings.push('Wildcard (*) sources reduce security in production');
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Generate security.txt file for responsible disclosure
   */
  static generateSecurityTxt(domain: string): string {
    return `Contact: security@${domain}
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
Encryption: https://${domain}/.well-known/pgp-key.txt
Preferred-Languages: en
Canonical: https://${domain}/.well-known/security.txt
Policy: https://${domain}/security-policy
Acknowledgments: https://${domain}/security-acknowledgments
Hiring: https://${domain}/careers

# LocumTrueRate Security Team
# We take security seriously and appreciate responsible disclosure
# Please allow up to 48 hours for initial response`;
  }

  /**
   * Generate robots.txt for production
   */
  static generateRobotsTxt(domain: string, environment: string): string {
    if (environment === 'production') {
      return `User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /uploads/
Disallow: /auth/
Disallow: /_next/
Disallow: /sitemap.xml
Allow: /

Sitemap: https://${domain}/sitemap.xml

# LocumTrueRate - Medical Staffing Platform
# Protecting healthcare professional privacy`;
    } else {
      return `User-agent: *
Disallow: /

# Development/Staging environment - not for indexing`;
    }
  }
}