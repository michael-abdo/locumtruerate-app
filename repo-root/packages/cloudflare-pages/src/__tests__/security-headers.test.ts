/**
 * Security Headers Tests
 */

import { SecurityHeaders } from '../security-headers';
import type { SecurityConfig } from '../security-headers';

describe('SecurityHeaders', () => {
  let config: SecurityConfig;
  let securityHeaders: SecurityHeaders;

  beforeEach(() => {
    config = {
      enableCSP: true,
      enableHSTS: true,
      enableCORS: false,
      environment: 'production',
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
    };

    securityHeaders = new SecurityHeaders(config);
  });

  describe('CSP Generation', () => {
    it('should generate basic CSP policy', () => {
      const csp = securityHeaders.generateCSP();
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should include analytics sources when enabled', () => {
      config.features.analytics = true;
      securityHeaders = new SecurityHeaders(config);
      
      const csp = securityHeaders.generateCSP();
      
      expect(csp).toContain('https://www.google-analytics.com');
      expect(csp).toContain('https://api.mixpanel.com');
    });

    it('should exclude analytics sources when disabled', () => {
      config.features.analytics = false;
      securityHeaders = new SecurityHeaders(config);
      
      const csp = securityHeaders.generateCSP();
      
      expect(csp).not.toContain('https://www.google-analytics.com');
      expect(csp).not.toContain('https://api.mixpanel.com');
    });

    it('should include development sources in development environment', () => {
      config.environment = 'development';
      securityHeaders = new SecurityHeaders(config);
      
      const csp = securityHeaders.generateCSP();
      
      expect(csp).toContain('localhost:*');
      expect(csp).toContain("'unsafe-eval'");
    });

    it('should exclude unsafe sources in production', () => {
      config.environment = 'production';
      securityHeaders = new SecurityHeaders(config);
      
      const csp = securityHeaders.generateCSP();
      
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).not.toContain('localhost:*');
    });
  });

  describe('Header Generation', () => {
    it('should generate all security headers for production', () => {
      const headers = securityHeaders.generateHeaders();
      
      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('Strict-Transport-Security');
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(headers).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin');
    });

    it('should include HSTS in production', () => {
      config.environment = 'production';
      config.enableHSTS = true;
      securityHeaders = new SecurityHeaders(config);
      
      const headers = securityHeaders.generateHeaders();
      
      expect(headers).toHaveProperty('Strict-Transport-Security');
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    });

    it('should exclude HSTS in development', () => {
      config.environment = 'development';
      config.enableHSTS = false;
      securityHeaders = new SecurityHeaders(config);
      
      const headers = securityHeaders.generateHeaders();
      
      expect(headers).not.toHaveProperty('Strict-Transport-Security');
    });

    it('should include CORS headers when enabled', () => {
      config.enableCORS = true;
      securityHeaders = new SecurityHeaders(config);
      
      const headers = securityHeaders.generateHeaders();
      
      expect(headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(headers).toHaveProperty('Access-Control-Allow-Methods');
    });
  });

  describe('CSP Validation', () => {
    it('should validate valid CSP policy', () => {
      const validation = securityHeaders.validateCSP();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required directives', () => {
      // Mock a malformed CSP
      jest.spyOn(securityHeaders, 'generateCSP').mockReturnValue('script-src self');
      
      const validation = securityHeaders.validateCSP();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required directive: default-src');
    });

    it('should warn about unsafe-eval in production', () => {
      jest.spyOn(securityHeaders, 'generateCSP').mockReturnValue("default-src 'self'; script-src 'unsafe-eval'");
      
      const validation = securityHeaders.validateCSP();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("'unsafe-eval' should not be used in production");
    });

    it('should warn about wildcard sources in production', () => {
      jest.spyOn(securityHeaders, 'generateCSP').mockReturnValue("default-src 'self'; img-src *");
      
      const validation = securityHeaders.validateCSP();
      
      expect(validation.warnings).toContain('Wildcard (*) sources reduce security in production');
    });
  });

  describe('Headers File Generation', () => {
    it('should generate valid _headers file format', () => {
      const headersFile = securityHeaders.generateHeadersFile();
      
      expect(headersFile).toContain('# LocumTrueRate Security Headers Configuration');
      expect(headersFile).toContain('/*');
      expect(headersFile).toContain('Content-Security-Policy:');
      expect(headersFile).toContain('/api/*');
      expect(headersFile).toContain('/assets/*');
    });

    it('should include API-specific headers', () => {
      const headersFile = securityHeaders.generateHeadersFile();
      
      expect(headersFile).toContain('/api/*');
      expect(headersFile).toContain('X-Robots-Tag: noindex');
      expect(headersFile).toContain('Cache-Control: no-store, no-cache, must-revalidate');
    });

    it('should include asset-specific headers', () => {
      const headersFile = securityHeaders.generateHeadersFile();
      
      expect(headersFile).toContain('/assets/*');
      expect(headersFile).toContain('Cache-Control: public, max-age=31536000, immutable');
    });
  });

  describe('Static Utilities', () => {
    it('should generate security.txt file', () => {
      const securityTxt = SecurityHeaders.generateSecurityTxt('locumtruerate.com');
      
      expect(securityTxt).toContain('Contact: security@locumtruerate.com');
      expect(securityTxt).toContain('Expires:');
      expect(securityTxt).toContain('Policy: https://locumtruerate.com/security-policy');
    });

    it('should generate robots.txt for production', () => {
      const robotsTxt = SecurityHeaders.generateRobotsTxt('locumtruerate.com', 'production');
      
      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Disallow: /api/');
      expect(robotsTxt).toContain('Sitemap: https://locumtruerate.com/sitemap.xml');
    });

    it('should generate restrictive robots.txt for development', () => {
      const robotsTxt = SecurityHeaders.generateRobotsTxt('localhost:3000', 'development');
      
      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Disallow: /');
      expect(robotsTxt).toContain('Development/Staging environment');
    });
  });

  describe('HIPAA Compliance', () => {
    it('should include HIPAA-required headers', () => {
      const headers = securityHeaders.generateHeaders();
      
      // Privacy protection
      expect(headers).toHaveProperty('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
      expect(headers).toHaveProperty('X-DNS-Prefetch-Control', 'off');
      
      // Security requirements
      expect(headers).toHaveProperty('Cross-Origin-Opener-Policy', 'same-origin');
      expect(headers).toHaveProperty('Cross-Origin-Embedder-Policy', 'require-corp');
    });

    it('should restrict frame embedding for patient data protection', () => {
      const headers = securityHeaders.generateHeaders();
      
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      
      const csp = securityHeaders.generateCSP();
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });
});