import { createCallerFactory } from '../trpc';
import { appRouter } from '../index';
import { createContext } from '../context';
import type { Context } from '../context';

const createCaller = createCallerFactory(appRouter);

describe('Auth Router', () => {
  let caller: ReturnType<typeof createCaller>;
  let mockContext: Context;

  beforeEach(() => {
    mockContext = createContext({
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    });
    caller = createCaller(mockContext);
  });

  describe('Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        contactName: 'Test User',
        companyName: 'Test Company',
        role: 'EMPLOYER' as const
      };

      const result = await caller.auth.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.contactName).toBe(userData.contactName);
      expect(result.user.role).toBe('EMPLOYER');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        contactName: 'Test User',
        role: 'EMPLOYER' as const
      };

      await expect(caller.auth.register(userData)).rejects.toThrow();
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        contactName: 'Test User',
        role: 'EMPLOYER' as const
      };

      await expect(caller.auth.register(userData)).rejects.toThrow();
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        contactName: 'Test User',
        role: 'EMPLOYER' as const
      };

      // Register first user
      await caller.auth.register(userData);

      // Try to register with same email
      await expect(caller.auth.register(userData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await caller.auth.register({
        email: 'login@example.com',
        password: 'password123',
        contactName: 'Login User',
        role: 'EMPLOYER' as const
      });
    });

    it('should login with valid credentials', async () => {
      const result = await caller.auth.login({
        email: 'login@example.com',
        password: 'password123'
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('login@example.com');
    });

    it('should reject login with invalid email', async () => {
      await expect(caller.auth.login({
        email: 'nonexistent@example.com',
        password: 'password123'
      })).rejects.toThrow('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      await expect(caller.auth.login({
        email: 'login@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid email or password');
    });

    it('should track failed login attempts', async () => {
      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        try {
          await caller.auth.login({
            email: 'login@example.com',
            password: 'wrongpassword'
          });
        } catch (error) {
          // Expected to fail
        }
      }

      // Check that user still exists and failed attempts are tracked
      const user = await mockContext.db.user.findUnique({
        where: { email: 'login@example.com' }
      });

      expect(user?.failedLoginAttempts).toBe(3);
    });
  });

  describe('Token Refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const result = await caller.auth.register({
        email: 'refresh@example.com',
        password: 'password123',
        contactName: 'Refresh User',
        role: 'EMPLOYER' as const
      });
      refreshToken = result.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const result = await caller.auth.refreshToken({ refreshToken });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
    });

    it('should reject invalid refresh token', async () => {
      await expect(caller.auth.refreshToken({ 
        refreshToken: 'invalid.token.here' 
      })).rejects.toThrow();
    });
  });

  describe('Protected Routes', () => {
    let userId: string;
    let accessToken: string;

    beforeEach(async () => {
      const result = await caller.auth.register({
        email: 'protected@example.com',
        password: 'password123',
        contactName: 'Protected User',
        role: 'EMPLOYER' as const
      });
      
      userId = result.user.id;
      accessToken = result.accessToken;

      // Update context to include authenticated user
      mockContext = createContext({
        userId,
        userRole: 'EMPLOYER',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      });
      caller = createCaller(mockContext);
    });

    it('should get current user when authenticated', async () => {
      const user = await caller.auth.getCurrentUser();

      expect(user.id).toBe(userId);
      expect(user.email).toBe('protected@example.com');
      expect(user.contactName).toBe('Protected User');
    });

    it('should logout successfully', async () => {
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);

      // Verify sessions were deleted
      const sessions = await mockContext.db.session.findMany({
        where: { userId }
      });
      expect(sessions).toHaveLength(0);
    });
  });

  describe('Unauthenticated Access', () => {
    it('should reject getCurrentUser when not authenticated', async () => {
      await expect(caller.auth.getCurrentUser()).rejects.toThrow('Authentication required');
    });

    it('should reject logout when not authenticated', async () => {
      await expect(caller.auth.logout()).rejects.toThrow('Authentication required');
    });
  });

  describe('Password Security', () => {
    it('should hash passwords before storing', async () => {
      const userData = {
        email: 'security@example.com',
        password: 'password123',
        contactName: 'Security User',
        role: 'EMPLOYER' as const
      };

      await caller.auth.register(userData);

      const user = await mockContext.db.user.findUnique({
        where: { email: 'security@example.com' }
      });

      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe('password123');
      expect(user?.passwordHash?.length).toBeGreaterThan(50); // bcrypt hashes are long
    });
  });
});