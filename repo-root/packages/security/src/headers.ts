/**
 * Security Headers
 * HTTP security headers configuration for enhanced protection
 */

import helmet from 'helmet';
import type { SecurityMiddlewareConfig } from './types';

export class SecurityHeaders {
  
  /**
   * Get comprehensive helmet configuration for LocumTrueRate
   */
  static getHelmetConfig() {
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Next.js
            "'unsafe-eval'", // Required for development
            "https://js.stripe.com",
            "https://checkout.stripe.com",
            "https://maps.googleapis.com",
            "https://www.google-analytics.com",
            "https://www.googletagmanager.com",
            "https://cdnjs.cloudflare.com",
            "https://unpkg.com"
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for styled-components
            "https://fonts.googleapis.com",
            "https://cdnjs.cloudflare.com"
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://cdnjs.cloudflare.com"
          ],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https:",
            "https://i.pravatar.cc", // For test avatars
            "https://images.unsplash.com",
            "https://via.placeholder.com"
          ],
          connectSrc: [
            "'self'",
            "https://api.stripe.com",
            "https://checkout.stripe.com",
            "https://maps.googleapis.com",
            "https://www.google-analytics.com",
            "https://vitals.vercel-insights.com",
            process.env.NODE_ENV === 'development' ? "ws://localhost:*" : "",
            process.env.NODE_ENV === 'development' ? "http://localhost:*" : ""
          ].filter(Boolean),
          frameSrc: [
            "'self'",
            "https://js.stripe.com",
            "https://hooks.stripe.com"
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "https:"],
          workerSrc: ["'self'", "blob:"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        },
        reportOnly: process.env.NODE_ENV === 'development'
      },

      // HTTPS enforcement
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },

      // Prevent MIME type sniffing
      noSniff: true,

      // X-Frame-Options
      frameguard: {
        action: 'deny'
      },

      // X-XSS-Protection
      xssFilter: true,

      // Referrer Policy
      referrerPolicy: {
        policy: ["no-referrer", "strict-origin-when-cross-origin"]
      },

      // Permissions Policy (formerly Feature Policy)
      permissionsPolicy: {
        features: {
          camera: ["'none'"],
          microphone: ["'none'"],
          geolocation: ["'self'"],
          payment: ["'self'", "https://js.stripe.com"],
          usb: ["'none'"],
          magnetometer: ["'none'"],
          gyroscope: ["'none'"],
          accelerometer: ["'none'"]
        }
      },

      // DNS Prefetch Control
      dnsPrefetchControl: {
        allow: false
      },

      // Cross-Origin policies
      crossOriginEmbedderPolicy: false, // Disabled for third-party integrations
      crossOriginOpenerPolicy: {
        policy: "same-origin-allow-popups" // Required for OAuth flows
      },
      crossOriginResourcePolicy: {
        policy: "cross-origin"
      }
    });
  }

  /**
   * Get development-specific helmet configuration
   */
  static getDevHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:*", "ws://localhost:*"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
          imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
          fontSrc: ["'self'", "data:", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"]
        },
        reportOnly: true
      },
      hsts: false, // Disabled in development
      frameguard: { action: 'sameorigin' },
      noSniff: true,
      xssFilter: true
    });
  }

  /**
   * Custom security headers middleware
   */
  static customSecurityHeaders() {
    return (req: any, res: any, next: any) => {
      // HIPAA compliance headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Custom headers for healthcare compliance
      res.setHeader('X-Healthcare-Compliance', 'HIPAA');
      res.setHeader('X-Data-Classification', 'PHI');
      
      // Cache control for sensitive data
      if (req.path?.includes('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      // Remove server identification
      res.removeHeader('X-Powered-By');
      res.removeHeader('Server');
      
      next();
    };
  }

  /**
   * CORS configuration for API endpoints
   */
  static getCorsConfig() {
    const allowedOrigins = [
      'https://locumtruerate.com',
      'https://www.locumtruerate.com',
      'https://app.locumtruerate.com',
      ...(process.env.NODE_ENV === 'development' ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080'
      ] : [])
    ];

    return {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-CSRF-Token'
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204
    };
  }

  /**
   * Security headers for static assets
   */
  static staticAssetHeaders() {
    return (req: any, res: any, next: any) => {
      // Cache control for static assets
      if (req.path?.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }

      // Security headers for uploads
      if (req.path?.includes('/uploads/')) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'attachment');
      }

      next();
    };
  }

  /**
   * API rate limiting headers
   */
  static rateLimitHeaders(limit: number, remaining: number, resetTime: number) {
    return {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString(),
      'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
    };
  }

  /**
   * Healthcare-specific security headers
   */
  static healthcareSecurityHeaders() {
    return (req: any, res: any, next: any) => {
      // HIPAA compliance indicators
      res.setHeader('X-Healthcare-Standard', 'HIPAA');
      res.setHeader('X-Data-Encryption', 'AES-256');
      res.setHeader('X-Audit-Logging', 'Enabled');
      
      // Data retention policy
      res.setHeader('X-Data-Retention', '7-years');
      
      // Patient privacy headers
      if (req.path?.includes('/patient/') || req.path?.includes('/phi/')) {
        res.setHeader('X-Data-Classification', 'PHI');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
      }

      next();
    };
  }

  /**
   * Content Security Policy for different environments
   */
  static getCSPForEnvironment(env: 'development' | 'staging' | 'production') {
    const baseDirectives = {
      defaultSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    };

    switch (env) {
      case 'development':
        return {
          ...baseDirectives,
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:*"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
          imgSrc: ["'self'", "data:", "blob:", "http:", "https:"]
        };

      case 'staging':
        return {
          ...baseDirectives,
          scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          connectSrc: ["'self'", "https://api.stripe.com"],
          imgSrc: ["'self'", "data:", "blob:", "https:"]
        };

      case 'production':
        return {
          ...baseDirectives,
          scriptSrc: ["'self'", "https://js.stripe.com", "https://www.google-analytics.com"],
          styleSrc: ["'self'", "https://fonts.googleapis.com"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://www.google-analytics.com"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          frameSrc: ["'self'", "https://js.stripe.com"]
        };

      default:
        return baseDirectives;
    }
  }

  /**
   * Complete security middleware configuration
   */
  static getCompleteSecurityMiddleware(config?: SecurityMiddlewareConfig) {
    const middleware = [];

    // Helmet with environment-specific config
    if (config?.enableHelmet !== false) {
      middleware.push(
        process.env.NODE_ENV === 'production' 
          ? this.getHelmetConfig()
          : this.getDevHelmetConfig()
      );
    }

    // Custom security headers
    middleware.push(this.customSecurityHeaders());

    // Healthcare-specific headers
    middleware.push(this.healthcareSecurityHeaders());

    // Static asset headers
    middleware.push(this.staticAssetHeaders());

    return middleware;
  }
}