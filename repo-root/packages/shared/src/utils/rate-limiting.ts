/**
 * Rate limiting and DDoS protection utilities
 * Supports Redis-based distributed rate limiting
 */

import { logger } from './logger';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
  message?: string;
}

// In-memory store for development/fallback
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanup?: NodeJS.Timeout;
  
  constructor() {
    // Cleanup expired entries every minute
    this.cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime <= now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }
  
  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.store.get(key);
    if (!entry || entry.resetTime <= Date.now()) {
      return null;
    }
    return entry;
  }
  
  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value);
  }
  
  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + windowMs;
    const existing = await this.get(key);
    
    if (!existing) {
      const newEntry = { count: 1, resetTime };
      await this.set(key, newEntry);
      return newEntry;
    }
    
    existing.count += 1;
    await this.set(key, existing);
    return existing;
  }
  
  destroy() {
    if (this.cleanup) {
      clearInterval(this.cleanup);
    }
    this.store.clear();
  }
}

// Redis store for production
class RedisStore {
  private redis: any;
  
  constructor(redis: any) {
    this.redis = redis;
  }
  
  private getKey(key: string): string {
    return `rate_limit:${key}`;
  }
  
  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    try {
      const redisKey = this.getKey(key);
      const result = await this.redis.hmget(redisKey, 'count', 'resetTime');
      
      if (!result[0] || !result[1]) {
        return null;
      }
      
      const resetTime = parseInt(result[1]);
      if (resetTime <= Date.now()) {
        await this.redis.del(redisKey);
        return null;
      }
      
      return {
        count: parseInt(result[0]),
        resetTime,
      };
    } catch (error) {
      logger.error('Redis rate limit get error', error);
      return null;
    }
  }
  
  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    try {
      const redisKey = this.getKey(key);
      const ttl = Math.ceil((value.resetTime - Date.now()) / 1000);
      
      await this.redis.hmset(redisKey, 'count', value.count, 'resetTime', value.resetTime);
      await this.redis.expire(redisKey, ttl);
    } catch (error) {
      logger.error('Redis rate limit set error', error);
    }
  }
  
  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    try {
      const redisKey = this.getKey(key);
      const now = Date.now();
      const resetTime = now + windowMs;
      
      // Use Lua script for atomic increment
      const luaScript = `
        local key = KEYS[1]
        local resetTime = ARGV[1]
        local windowMs = ARGV[2]
        local now = ARGV[3]
        
        local current = redis.call('HMGET', key, 'count', 'resetTime')
        local count = current[1]
        local existingResetTime = current[2]
        
        if not count or not existingResetTime or tonumber(existingResetTime) <= tonumber(now) then
          -- Create new window
          redis.call('HMSET', key, 'count', 1, 'resetTime', resetTime)
          redis.call('EXPIRE', key, math.ceil(tonumber(windowMs) / 1000))
          return {1, resetTime}
        else
          -- Increment existing window
          local newCount = redis.call('HINCRBY', key, 'count', 1)
          return {newCount, existingResetTime}
        end
      `;
      
      const result = await this.redis.eval(
        luaScript,
        1,
        redisKey,
        resetTime.toString(),
        windowMs.toString(),
        now.toString()
      );
      
      return {
        count: parseInt(result[0]),
        resetTime: parseInt(result[1]),
      };
    } catch (error) {
      logger.error('Redis rate limit increment error', error);
      // Fallback to memory store
      const memoryStore = new MemoryStore();
      return memoryStore.increment(key, windowMs);
    }
  }
}

export class RateLimiter {
  private store: MemoryStore | RedisStore;
  private options: RateLimitOptions;
  
  constructor(options: RateLimitOptions, redis?: any) {
    this.options = {
      statusCode: 429,
      headers: true,
      message: 'Too many requests, please try again later.',
      ...options,
    };
    
    if (redis && process.env.NODE_ENV === 'production') {
      this.store = new RedisStore(redis);
      logger.info('Rate limiter initialized with Redis store');
    } else {
      this.store = new MemoryStore();
      logger.info('Rate limiter initialized with memory store');
    }
  }
  
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    try {
      const result = await this.store.increment(identifier, this.options.windowMs);
      
      const info: RateLimitInfo = {
        limit: this.options.maxRequests,
        current: result.count,
        remaining: Math.max(0, this.options.maxRequests - result.count),
        resetTime: new Date(result.resetTime),
        windowMs: this.options.windowMs,
      };
      
      const allowed = result.count <= this.options.maxRequests;
      
      if (!allowed) {
        logger.warn('Rate limit exceeded', {
          identifier,
          current: result.count,
          limit: this.options.maxRequests,
          resetTime: new Date(result.resetTime),
        });
      }
      
      return {
        allowed,
        info,
        message: allowed ? undefined : this.options.message,
      };
    } catch (error) {
      logger.error('Rate limit check failed', error, { identifier });
      // Allow request on error to avoid blocking legitimate traffic
      return {
        allowed: true,
        info: {
          limit: this.options.maxRequests,
          current: 0,
          remaining: this.options.maxRequests,
          resetTime: new Date(Date.now() + this.options.windowMs),
          windowMs: this.options.windowMs,
        },
      };
    }
  }
  
  // Express/HTTP middleware
  middleware() {
    return async (req: any, res: any, next: any) => {
      const identifier = this.options.keyGenerator 
        ? this.options.keyGenerator(req)
        : this.getDefaultKey(req);
      
      const result = await this.checkLimit(identifier);
      
      if (this.options.headers) {
        res.set({
          'X-RateLimit-Limit': result.info.limit.toString(),
          'X-RateLimit-Remaining': result.info.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.info.resetTime.getTime() / 1000).toString(),
        });
      }
      
      if (!result.allowed) {
        if (this.options.headers) {
          res.set('Retry-After', Math.ceil(this.options.windowMs / 1000).toString());
        }
        
        return res.status(this.options.statusCode).json({
          error: result.message,
          retryAfter: Math.ceil(this.options.windowMs / 1000),
        });
      }
      
      next();
    };
  }
  
  // tRPC middleware
  trpcMiddleware() {
    return async (opts: any) => {
      const { req, next } = opts;
      
      const identifier = this.options.keyGenerator 
        ? this.options.keyGenerator(req)
        : this.getDefaultKey(req);
      
      const result = await this.checkLimit(identifier);
      
      if (!result.allowed) {
        throw new Error(result.message || 'Rate limit exceeded');
      }
      
      return next();
    };
  }
  
  private getDefaultKey(req: any): string {
    // Priority order: user ID, IP address, generic
    const userId = req.user?.id || req.userId;
    if (userId) {
      return `user:${userId}`;
    }
    
    const ip = req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress ||
               req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               'unknown';
    
    return `ip:${ip}`;
  }
  
  destroy() {
    if (this.store instanceof MemoryStore) {
      this.store.destroy();
    }
  }
}

// Predefined rate limiters for common use cases
export const createApiRateLimiter = (redis?: any) => new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many API requests. Please try again in 15 minutes.',
}, redis);

export const createAuthRateLimiter = (redis?: any) => new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: (req: any) => `auth:${req.ip}:${req.body?.email || 'unknown'}`,
}, redis);

export const createJobPostingRateLimiter = (redis?: any) => new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many job postings. Please try again in 1 hour.',
  keyGenerator: (req: any) => `job_post:${req.user?.id || req.ip}`,
}, redis);

export const createApplicationRateLimiter = (redis?: any) => new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  message: 'Too many applications submitted. Please try again in 1 hour.',
  keyGenerator: (req: any) => `application:${req.ip}`,
}, redis);

// DDoS protection patterns
export class DDoSProtection {
  private suspiciousIPs = new Set<string>();
  private bannedIPs = new Set<string>();
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval?: NodeJS.Timeout;
  
  constructor(
    private thresholds = {
      suspicious: 1000,    // requests per minute
      ban: 2000,          // requests per minute
      banDuration: 60000, // 1 minute
    }
  ) {
    // Cleanup every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }
  
  checkRequest(ip: string): { allowed: boolean; reason?: string } {
    if (this.bannedIPs.has(ip)) {
      return { allowed: false, reason: 'IP temporarily banned' };
    }
    
    const now = Date.now();
    const key = `${ip}:${Math.floor(now / 60000)}`; // Per minute window
    
    const current = this.requestCounts.get(key) || { count: 0, resetTime: now + 60000 };
    current.count += 1;
    this.requestCounts.set(key, current);
    
    if (current.count > this.thresholds.ban) {
      this.bannedIPs.add(ip);
      logger.warn(`IP banned for excessive requests: ${ip}`, {
        requests: current.count,
        threshold: this.thresholds.ban,
      });
      
      // Auto-unban after duration
      setTimeout(() => {
        this.bannedIPs.delete(ip);
        logger.info(`IP unbanned: ${ip}`);
      }, this.thresholds.banDuration);
      
      return { allowed: false, reason: 'IP banned for excessive requests' };
    }
    
    if (current.count > this.thresholds.suspicious) {
      this.suspiciousIPs.add(ip);
      logger.warn(`Suspicious activity detected: ${ip}`, {
        requests: current.count,
        threshold: this.thresholds.suspicious,
      });
    }
    
    return { allowed: true };
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requestCounts.entries()) {
      if (value.resetTime <= now) {
        this.requestCounts.delete(key);
      }
    }
  }
  
  middleware() {
    return (req: any, res: any, next: any) => {
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const result = this.checkRequest(ip);
      
      if (!result.allowed) {
        logger.warn('Request blocked by DDoS protection', {
          ip,
          reason: result.reason,
          userAgent: req.headers['user-agent'],
          url: req.url,
        });
        
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          code: 'DDOS_PROTECTION',
        });
      }
      
      next();
    };
  }
  
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export utilities
export const ddosProtection = new DDoSProtection();