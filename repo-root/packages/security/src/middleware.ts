/**
 * Security Middleware
 * Express middleware for comprehensive security protection
 */

import { RateLimiterRedis } from 'rate-limiter-flexible';
import { SecurityValidators } from './validators';
import { SecurityHeaders } from './headers';
import type { ThreatDetection, SecurityAuditLog } from './types';
import { v4 as uuidv4 } from 'uuid';

export class SecurityMiddleware {
  private static rateLimiters = new Map<string, RateLimiterRedis>();
  private static threatDetections: ThreatDetection[] = [];
  private static auditLogs: SecurityAuditLog[] = [];

  /**
   * Initialize rate limiters
   */
  static initializeRateLimiters(redisClient?: any) {
    // General API rate limiter
    this.rateLimiters.set('api', new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_api',
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 60, // Block for 60 seconds if exceeded
    }));

    // Authentication rate limiter (stricter)
    this.rateLimiters.set('auth', new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_auth',
      points: 5, // Number of attempts
      duration: 900, // Per 15 minutes
      blockDuration: 1800, // Block for 30 minutes
    }));

    // Registration rate limiter
    this.rateLimiters.set('register', new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_register',
      points: 3, // Number of registrations
      duration: 3600, // Per hour
      blockDuration: 3600, // Block for 1 hour
    }));

    // Password reset rate limiter
    this.rateLimiters.set('password_reset', new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_pwd_reset',
      points: 3, // Number of reset attempts
      duration: 3600, // Per hour
      blockDuration: 3600, // Block for 1 hour
    }));

    // File upload rate limiter
    this.rateLimiters.set('upload', new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_upload',
      points: 10, // Number of uploads
      duration: 3600, // Per hour
      blockDuration: 1800, // Block for 30 minutes
    }));
  }

  /**
   * Rate limiting middleware
   */
  static rateLimit(type: string = 'api') {
    return async (req: any, res: any, next: any) => {
      try {
        const rateLimiter = this.rateLimiters.get(type);
        if (!rateLimiter) {
          return next();
        }

        const key = this.getRateLimitKey(req, type);
        const result = await rateLimiter.consume(key);

        // Add rate limit headers
        const headers = SecurityHeaders.rateLimitHeaders(
          rateLimiter.points,
          result.remainingPoints || 0,
          Date.now() + (result.msBeforeNext || 0)
        );

        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        next();
      } catch (rejRes: any) {
        // Rate limit exceeded
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.setHeader('Retry-After', String(secs));
        
        // Log potential attack
        this.logThreatDetection({
          type: 'BRUTE_FORCE',
          level: 'MEDIUM',
          source: { ip: this.getClientIP(req) },
          target: { endpoint: req.path, method: req.method },
          evidence: [`Rate limit exceeded for ${type}`, `${rejRes.hits} attempts`],
          blocked: true,
          action_taken: `Blocked for ${secs} seconds`
        });

        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${secs} seconds.`,
          retryAfter: secs
        });
      }
    };
  }

  /**
   * Input validation middleware
   */
  static validateInput(validator: (data: any) => any) {
    return (req: any, res: any, next: any) => {
      try {
        const { error, value } = validator(req.body);
        
        if (error) {
          // Log validation failure as potential attack
          this.logThreatDetection({
            type: 'SUSPICIOUS_ACTIVITY',
            level: 'LOW',
            source: { ip: this.getClientIP(req), userAgent: req.get('User-Agent') },
            target: { endpoint: req.path, method: req.method, params: req.body },
            evidence: error.details.map((d: any) => d.message),
            blocked: true,
            action_taken: 'Request rejected'
          });

          return res.status(400).json({
            error: 'Validation Error',
            details: error.details.map((detail: any) => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          });
        }

        req.validatedBody = value;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * SQL injection detection middleware
   */
  static sqlInjectionDetection() {
    return (req: any, res: any, next: any) => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /(\'|\"|;|--|\||\*)/,
        /(\bUNION\b.*\bSELECT\b)/i,
        /(\bEXEC\s*\()/i
      ];

      const checkObject = (obj: any, path: string = ''): boolean => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string') {
            for (const pattern of sqlPatterns) {
              if (pattern.test(value)) {
                this.logThreatDetection({
                  type: 'SQL_INJECTION',
                  level: 'HIGH',
                  source: { 
                    ip: this.getClientIP(req), 
                    userAgent: req.get('User-Agent') 
                  },
                  target: { 
                    endpoint: req.path, 
                    method: req.method, 
                    params: { [currentPath]: value } 
                  },
                  evidence: [`Potential SQL injection in ${currentPath}: ${value}`],
                  blocked: true,
                  action_taken: 'Request blocked'
                });
                return true;
              }
            }
          } else if (typeof value === 'object' && value !== null) {
            if (checkObject(value, currentPath)) return true;
          }
        }
        return false;
      };

      // Check query parameters, body, and headers
      const sources = [req.query, req.body, req.params];
      
      for (const source of sources) {
        if (source && typeof source === 'object' && checkObject(source)) {
          return res.status(400).json({
            error: 'Security Violation',
            message: 'Potentially malicious content detected'
          });
        }
      }

      next();
    };
  }

  /**
   * XSS protection middleware
   */
  static xssProtection() {
    return (req: any, res: any, next: any) => {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe[^>]*src\s*=\s*["']?javascript:/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi,
        /javascript\s*:/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi
      ];

      const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
          let sanitized = obj;
          for (const pattern of xssPatterns) {
            if (pattern.test(sanitized)) {
              this.logThreatDetection({
                type: 'XSS',
                level: 'HIGH',
                source: { 
                  ip: this.getClientIP(req), 
                  userAgent: req.get('User-Agent') 
                },
                target: { 
                  endpoint: req.path, 
                  method: req.method 
                },
                evidence: [`Potential XSS detected: ${sanitized}`],
                blocked: false,
                action_taken: 'Content sanitized'
              });
              sanitized = SecurityValidators.sanitizeHtml(sanitized);
            }
          }
          return sanitized;
        } else if (Array.isArray(obj)) {
          return obj.map(sanitizeObject);
        } else if (typeof obj === 'object' && obj !== null) {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
          }
          return sanitized;
        }
        return obj;
      };

      // Sanitize request data
      if (req.body) req.body = sanitizeObject(req.body);
      if (req.query) req.query = sanitizeObject(req.query);

      next();
    };
  }

  /**
   * CSRF protection middleware
   */
  static csrfProtection() {
    return (req: any, res: any, next: any) => {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const token = req.headers['x-csrf-token'] || req.body._csrf;
      const sessionToken = req.session?.csrfToken;

      if (!token || !sessionToken || token !== sessionToken) {
        this.logThreatDetection({
          type: 'CSRF',
          level: 'MEDIUM',
          source: { 
            ip: this.getClientIP(req), 
            userAgent: req.get('User-Agent') 
          },
          target: { 
            endpoint: req.path, 
            method: req.method 
          },
          evidence: ['Missing or invalid CSRF token'],
          blocked: true,
          action_taken: 'Request rejected'
        });

        return res.status(403).json({
          error: 'CSRF Protection',
          message: 'Invalid or missing CSRF token'
        });
      }

      next();
    };
  }

  /**
   * IP whitelist/blacklist middleware
   */
  static ipFilter(whitelist?: string[], blacklist?: string[]) {
    return (req: any, res: any, next: any) => {
      const clientIP = this.getClientIP(req);

      // Check blacklist first
      if (blacklist && blacklist.includes(clientIP)) {
        this.logThreatDetection({
          type: 'SUSPICIOUS_ACTIVITY',
          level: 'HIGH',
          source: { ip: clientIP },
          target: { endpoint: req.path, method: req.method },
          evidence: ['IP address in blacklist'],
          blocked: true,
          action_taken: 'Access denied'
        });

        return res.status(403).json({
          error: 'Access Denied',
          message: 'Your IP address is not allowed'
        });
      }

      // Check whitelist if provided
      if (whitelist && !whitelist.includes(clientIP)) {
        this.logThreatDetection({
          type: 'SUSPICIOUS_ACTIVITY',
          level: 'MEDIUM',
          source: { ip: clientIP },
          target: { endpoint: req.path, method: req.method },
          evidence: ['IP address not in whitelist'],
          blocked: true,
          action_taken: 'Access denied'
        });

        return res.status(403).json({
          error: 'Access Denied',
          message: 'Your IP address is not whitelisted'
        });
      }

      next();
    };
  }

  /**
   * Audit logging middleware
   */
  static auditLog() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();

      // Capture original end method
      const originalEnd = res.end;

      res.end = function(chunk: any, encoding: any) {
        // Log the request
        SecurityMiddleware.logAuditEvent({
          user_id: req.user?.id,
          action: `${req.method} ${req.path}`,
          resource: req.path,
          ip_address: SecurityMiddleware.getClientIP(req),
          user_agent: req.get('User-Agent') || '',
          success: res.statusCode < 400,
          details: {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: Date.now() - startTime,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer')
          },
          risk_level: SecurityMiddleware.calculateRiskLevel(req, res)
        });

        // Call original end
        originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Get client IP address
   */
  private static getClientIP(req: any): string {
    return req.headers['cf-connecting-ip'] || // Cloudflare
           req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }

  /**
   * Generate rate limit key
   */
  private static getRateLimitKey(req: any, type: string): string {
    const ip = this.getClientIP(req);
    const userId = req.user?.id;
    
    // Use user ID if authenticated, otherwise IP
    return userId ? `user:${userId}:${type}` : `ip:${ip}:${type}`;
  }

  /**
   * Log threat detection
   */
  private static logThreatDetection(threat: Omit<ThreatDetection, 'id' | 'timestamp'>) {
    const detection: ThreatDetection = {
      id: uuidv4(),
      timestamp: Date.now(),
      ...threat
    };

    this.threatDetections.push(detection);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Threat detected:', detection);
    }

    // Keep only last 1000 detections in memory
    if (this.threatDetections.length > 1000) {
      this.threatDetections = this.threatDetections.slice(-1000);
    }
  }

  /**
   * Log audit event
   */
  private static logAuditEvent(audit: Omit<SecurityAuditLog, 'id' | 'timestamp'>) {
    const log: SecurityAuditLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      ...audit
    };

    this.auditLogs.push(log);

    // Keep only last 10000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  /**
   * Calculate risk level for audit log
   */
  private static calculateRiskLevel(req: any, res: any) {
    if (res.statusCode >= 500) return 'HIGH';
    if (res.statusCode >= 400) return 'MEDIUM';
    if (req.path.includes('/admin/')) return 'HIGH';
    if (req.path.includes('/api/auth/')) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get threat detections (for monitoring)
   */
  static getThreatDetections(limit: number = 100): ThreatDetection[] {
    return this.threatDetections.slice(-limit);
  }

  /**
   * Get audit logs (for compliance)
   */
  static getAuditLogs(limit: number = 1000): SecurityAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  /**
   * Clear stored data (for testing)
   */
  static clearData(): void {
    this.threatDetections.length = 0;
    this.auditLogs.length = 0;
  }
}