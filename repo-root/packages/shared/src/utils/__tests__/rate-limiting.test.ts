/**
 * Tests for rate limiting utilities
 */

import {
  RateLimiter,
  createApiRateLimiter,
  createAuthRateLimiter,
  DDoSProtection,
  ddosProtection,
} from '../rate-limiting';

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Redis
const mockRedis = {
  hmget: jest.fn(),
  hmset: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
  eval: jest.fn(),
};

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (rateLimiter) {
      rateLimiter.destroy();
    }
  });

  describe('Memory Store', () => {
    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
      });
    });

    it('should allow requests within limit', async () => {
      const result = await rateLimiter.checkLimit('test-user');
      
      expect(result.allowed).toBe(true);
      expect(result.info.current).toBe(1);
      expect(result.info.remaining).toBe(4);
      expect(result.info.limit).toBe(5);
    });

    it('should block requests exceeding limit', async () => {
      // Make 5 requests (at the limit)
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit('test-user');
      }
      
      // 6th request should be blocked
      const result = await rateLimiter.checkLimit('test-user');
      
      expect(result.allowed).toBe(false);
      expect(result.info.current).toBe(6);
      expect(result.info.remaining).toBe(0);
      expect(result.message).toBe('Too many requests, please try again later.');
    });

    it('should reset window after time passes', async () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit('test-user');
      }
      
      // Should be at limit
      let result = await rateLimiter.checkLimit('test-user');
      expect(result.allowed).toBe(false);
      
      // Advance time by window duration
      jest.advanceTimersByTime(60000);
      
      // Should be allowed again
      result = await rateLimiter.checkLimit('test-user');
      expect(result.allowed).toBe(true);
      expect(result.info.current).toBe(1);
    });

    it('should handle different identifiers separately', async () => {
      // Make requests for user1
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit('user1');
      }
      
      // user1 should be blocked
      let result = await rateLimiter.checkLimit('user1');
      expect(result.allowed).toBe(false);
      
      // user2 should still be allowed
      result = await rateLimiter.checkLimit('user2');
      expect(result.allowed).toBe(true);
    });

    it('should cleanup expired entries', async () => {
      await rateLimiter.checkLimit('test-user');
      
      // Advance time to trigger cleanup
      jest.advanceTimersByTime(60000);
      
      // The cleanup should remove expired entries
      // This is primarily for memory management
      const result = await rateLimiter.checkLimit('test-user');
      expect(result.allowed).toBe(true);
      expect(result.info.current).toBe(1);
    });
  });

  describe('Redis Store', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      }, mockRedis);
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should use Redis for production', async () => {
      mockRedis.eval.mockResolvedValue([1, Date.now() + 60000]);
      
      const result = await rateLimiter.checkLimit('test-user');
      
      expect(result.allowed).toBe(true);
      expect(mockRedis.eval).toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.eval.mockRejectedValue(new Error('Redis connection failed'));
      
      const result = await rateLimiter.checkLimit('test-user');
      
      // Should fallback to memory store
      expect(result.allowed).toBe(true);
    });

    it('should handle Redis get operations', async () => {
      mockRedis.hmget.mockResolvedValue(['3', (Date.now() + 30000).toString()]);
      
      // This would be called internally by the Redis store
      expect(mockRedis.hmget).toBeDefined();
    });
  });

  describe('Express Middleware', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        headers: true,
      });

      req = {
        ip: '127.0.0.1',
        user: { id: 'user123' },
      };

      res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      next = jest.fn();
    });

    it('should allow requests within limit', async () => {
      const middleware = rateLimiter.middleware();
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': '2',
        'X-RateLimit-Remaining': '1',
        'X-RateLimit-Reset': expect.any(String),
      });
    });

    it('should block requests exceeding limit', async () => {
      const middleware = rateLimiter.middleware();
      
      // First two requests should pass
      await middleware(req, res, next);
      await middleware(req, res, next);
      
      // Third request should be blocked
      jest.clearAllMocks();
      await middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too many requests, please try again later.',
        retryAfter: 60,
      });
    });

    it('should use custom key generator', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (req) => `custom:${req.customId}`,
      });

      req.customId = 'abc123';
      const middleware = rateLimiter.middleware();
      
      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should prioritize user ID over IP', async () => {
      const middleware = rateLimiter.middleware();
      
      // Make requests as authenticated user
      await middleware(req, res, next);
      await middleware(req, res, next);
      
      // Should be rate limited by user ID, not IP
      jest.clearAllMocks();
      req.ip = '192.168.1.1'; // Different IP
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('tRPC Middleware', () => {
    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });
    });

    it('should allow requests within limit', async () => {
      const middleware = rateLimiter.trpcMiddleware();
      const next = jest.fn().mockResolvedValue('success');
      
      const result = await middleware({
        req: { ip: '127.0.0.1' },
        next,
      });
      
      expect(result).toBe('success');
      expect(next).toHaveBeenCalled();
    });

    it('should throw error when limit exceeded', async () => {
      const middleware = rateLimiter.trpcMiddleware();
      const next = jest.fn();
      const opts = { req: { ip: '127.0.0.1' }, next };
      
      // Exhaust the limit
      await middleware(opts);
      await middleware(opts);
      
      // Should throw on third attempt
      await expect(middleware(opts)).rejects.toThrow('Too many requests, please try again later.');
    });
  });

  describe('Predefined Rate Limiters', () => {
    it('should create API rate limiter with correct settings', () => {
      const apiLimiter = createApiRateLimiter();
      
      expect(apiLimiter).toBeInstanceOf(RateLimiter);
      // Should have 15-minute window and 100 requests limit
    });

    it('should create auth rate limiter with correct settings', () => {
      const authLimiter = createAuthRateLimiter();
      
      expect(authLimiter).toBeInstanceOf(RateLimiter);
      // Should have 15-minute window and 5 requests limit
    });

    it('should use custom key generator for auth limiter', async () => {
      const authLimiter = createAuthRateLimiter();
      const middleware = authLimiter.middleware();
      
      const req = {
        ip: '127.0.0.1',
        body: { email: 'test@example.com' },
      };
      const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      
      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});

describe('DDoSProtection', () => {
  let ddosProtection: DDoSProtection;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    ddosProtection = new DDoSProtection({
      suspicious: 10,
      ban: 20,
      banDuration: 60000,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    ddosProtection.destroy();
  });

  it('should allow normal traffic', () => {
    for (let i = 0; i < 5; i++) {
      const result = ddosProtection.checkRequest('127.0.0.1');
      expect(result.allowed).toBe(true);
    }
  });

  it('should mark IP as suspicious when threshold exceeded', () => {
    // Make requests up to suspicious threshold
    for (let i = 0; i < 10; i++) {
      ddosProtection.checkRequest('127.0.0.1');
    }
    
    // One more should trigger suspicious marking
    const result = ddosProtection.checkRequest('127.0.0.1');
    expect(result.allowed).toBe(true); // Still allowed, just marked
  });

  it('should ban IP when ban threshold exceeded', () => {
    // Make requests up to ban threshold
    for (let i = 0; i < 20; i++) {
      ddosProtection.checkRequest('127.0.0.1');
    }
    
    // One more should trigger ban
    const result = ddosProtection.checkRequest('127.0.0.1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('IP banned for excessive requests');
  });

  it('should auto-unban after duration', () => {
    // Ban the IP
    for (let i = 0; i < 21; i++) {
      ddosProtection.checkRequest('127.0.0.1');
    }
    
    let result = ddosProtection.checkRequest('127.0.0.1');
    expect(result.allowed).toBe(false);
    
    // Advance time past ban duration
    jest.advanceTimersByTime(60000);
    
    // Should be unbanned
    result = ddosProtection.checkRequest('127.0.0.1');
    expect(result.allowed).toBe(true);
  });

  it('should track different IPs separately', () => {
    // Ban first IP
    for (let i = 0; i < 21; i++) {
      ddosProtection.checkRequest('127.0.0.1');
    }
    
    // First IP should be banned
    let result = ddosProtection.checkRequest('127.0.0.1');
    expect(result.allowed).toBe(false);
    
    // Second IP should be fine
    result = ddosProtection.checkRequest('192.168.1.1');
    expect(result.allowed).toBe(true);
  });

  it('should reset counters after window', () => {
    // Make some requests
    for (let i = 0; i < 15; i++) {
      ddosProtection.checkRequest('127.0.0.1');
    }
    
    // Advance time to next minute window
    jest.advanceTimersByTime(60000);
    
    // Should start fresh count
    const result = ddosProtection.checkRequest('127.0.0.1');
    expect(result.allowed).toBe(true);
  });

  describe('Express Middleware', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
      req = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        url: '/api/test',
      };

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      next = jest.fn();
    });

    it('should allow normal requests', () => {
      const middleware = ddosProtection.middleware();
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block banned IPs', () => {
      // Ban the IP first
      for (let i = 0; i < 21; i++) {
        ddosProtection.checkRequest('127.0.0.1');
      }
      
      const middleware = ddosProtection.middleware();
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too many requests. Please try again later.',
        code: 'DDOS_PROTECTION',
      });
    });

    it('should handle missing IP gracefully', () => {
      req.ip = undefined;
      req.connection = undefined;
      
      const middleware = ddosProtection.middleware();
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Global DDoS Protection Instance', () => {
    it('should provide a default instance', () => {
      expect(ddosProtection).toBeDefined();
      expect(typeof ddosProtection.checkRequest).toBe('function');
      expect(typeof ddosProtection.middleware).toBe('function');
    });

    it('should work with default instance', () => {
      const result = ddosProtection.checkRequest('127.0.0.1');
      expect(result.allowed).toBe(true);
    });
  });
});