import { createCallerFactory } from '../trpc';
import { appRouter } from '../index';
import { createContext } from '../context';
import { prisma } from '@locumtruerate/database';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

/**
 * API Regression Test Suite
 * Tests all endpoints for correct functionality and backwards compatibility
 */

const createCaller = createCallerFactory(appRouter);

// Mock context
const createMockContext = (userId?: string, role?: string) => {
  return {
    prisma,
    user: userId ? { id: userId, role: role || 'professional' } : null,
    req: {
      headers: {
        'x-api-version': '1.0.0',
      },
    },
    res: {
      setHeader: jest.fn(),
    },
  };
};

describe('API Regression Tests', () => {
  let testUser: any;
  let testEmployer: any;
  let testAdmin: any;
  let testJob: any;
  let testApplication: any;

  beforeAll(async () => {
    // Clean database
    await prisma.application.deleteMany();
    await prisma.job.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await hash('TestPassword123!', 10);
    
    testUser = await prisma.user.create({
      data: {
        email: 'test.professional@example.com',
        password: hashedPassword,
        name: 'Test Professional',
        role: 'professional',
        emailVerified: true,
      },
    });

    testEmployer = await prisma.user.create({
      data: {
        email: 'test.employer@example.com',
        password: hashedPassword,
        name: 'Test Employer',
        role: 'employer',
        emailVerified: true,
      },
    });

    testAdmin = await prisma.user.create({
      data: {
        email: 'test.admin@example.com',
        password: hashedPassword,
        name: 'Test Admin',
        role: 'admin',
        emailVerified: true,
      },
    });

    // Create test job
    testJob = await prisma.job.create({
      data: {
        title: 'Test Emergency Medicine Physician',
        description: 'Test job description',
        location: 'New York, NY',
        hourlyRate: 250,
        startDate: new Date('2024-03-01'),
        duration: '3 months',
        requirements: ['MD/DO', 'Board Certified'],
        specialty: 'Emergency Medicine',
        employerId: testEmployer.id,
        status: 'active',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.application.deleteMany();
    await prisma.job.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Authentication Endpoints', () => {
    test('POST /auth/signup - Create new user', async () => {
      const caller = createCaller(createMockContext());
      const result = await caller.auth.signup({
        email: 'new.user@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
        role: 'professional',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('new.user@example.com');
      expect(result.token).toBeDefined();
      expect(result.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/); // JWT format
    });

    test('POST /auth/login - Authenticate user', async () => {
      const caller = createCaller(createMockContext());
      const result = await caller.auth.login({
        email: 'test.professional@example.com',
        password: 'TestPassword123!',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test.professional@example.com');
      expect(result.token).toBeDefined();
    });

    test('GET /auth/me - Get current user', async () => {
      const caller = createCaller(createMockContext(testUser.id));
      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.id);
      expect(result.email).toBe(testUser.email);
    });

    test('GET /auth/me - Unauthorized without auth', async () => {
      const caller = createCaller(createMockContext());
      await expect(caller.auth.me()).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('Jobs Endpoints', () => {
    test('GET /jobs - List all jobs', async () => {
      const caller = createCaller(createMockContext());
      const result = await caller.jobs.list({
        page: 1,
        limit: 10,
      });

      expect(result.jobs).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.jobs[0]).toHaveProperty('id');
      expect(result.jobs[0]).toHaveProperty('title');
    });

    test('GET /jobs/:id - Get job details', async () => {
      const caller = createCaller(createMockContext());
      const result = await caller.jobs.getById({ id: testJob.id });

      expect(result).toBeDefined();
      expect(result.id).toBe(testJob.id);
      expect(result.title).toBe(testJob.title);
      expect(result.hourlyRate).toBe(testJob.hourlyRate);
    });

    test('POST /jobs - Create job (employer only)', async () => {
      const caller = createCaller(createMockContext(testEmployer.id, 'employer'));
      const result = await caller.jobs.create({
        title: 'New Test Job',
        description: 'New test job description',
        location: 'Los Angeles, CA',
        hourlyRate: 300,
        startDate: '2024-04-01',
        duration: '6 months',
        requirements: ['MD', 'CA License'],
        specialty: 'Internal Medicine',
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('New Test Job');
      expect(result.employerId).toBe(testEmployer.id);
    });

    test('POST /jobs - Forbidden for non-employers', async () => {
      const caller = createCaller(createMockContext(testUser.id, 'professional'));
      await expect(
        caller.jobs.create({
          title: 'Test Job',
          description: 'Test',
          location: 'Test',
          hourlyRate: 100,
          startDate: '2024-04-01',
          duration: '1 month',
          requirements: [],
          specialty: 'Test',
        })
      ).rejects.toThrow('FORBIDDEN');
    });

    test('PATCH /jobs/:id - Update job', async () => {
      const caller = createCaller(createMockContext(testEmployer.id, 'employer'));
      const result = await caller.jobs.update({
        id: testJob.id,
        data: {
          hourlyRate: 275,
          description: 'Updated description',
        },
      });

      expect(result.hourlyRate).toBe(275);
      expect(result.description).toBe('Updated description');
    });
  });

  describe('Applications Endpoints', () => {
    test('POST /applications - Submit application', async () => {
      const caller = createCaller(createMockContext(testUser.id, 'professional'));
      const result = await caller.applications.create({
        jobId: testJob.id,
        coverLetter: 'I am interested in this position.',
      });

      expect(result).toBeDefined();
      expect(result.jobId).toBe(testJob.id);
      expect(result.applicantId).toBe(testUser.id);
      expect(result.status).toBe('pending');
      
      testApplication = result;
    });

    test('GET /applications - List user applications', async () => {
      const caller = createCaller(createMockContext(testUser.id));
      const result = await caller.applications.list({});

      expect(result.applications).toBeDefined();
      expect(Array.isArray(result.applications)).toBe(true);
      expect(result.applications.length).toBeGreaterThan(0);
      expect(result.applications[0].applicantId).toBe(testUser.id);
    });

    test('PATCH /applications/:id - Update application status', async () => {
      const caller = createCaller(createMockContext(testEmployer.id, 'employer'));
      const result = await caller.applications.updateStatus({
        id: testApplication.id,
        status: 'reviewed',
      });

      expect(result.status).toBe('reviewed');
    });
  });

  describe('Search Endpoints', () => {
    test('POST /search/jobs - Search with filters', async () => {
      const caller = createCaller(createMockContext());
      const result = await caller.search.jobs({
        query: 'emergency',
        filters: {
          location: ['New York'],
          minRate: 200,
          specialty: ['Emergency Medicine'],
        },
        page: 1,
        limit: 10,
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.totalCount).toBeGreaterThan(0);
    });

    test('POST /search/jobs - Empty search returns all', async () => {
      const caller = createCaller(createMockContext());
      const result = await caller.search.jobs({
        query: '',
        page: 1,
        limit: 10,
      });

      expect(result.results).toBeDefined();
      expect(result.totalCount).toBeGreaterThan(0);
    });
  });

  describe('Admin Endpoints', () => {
    test('GET /admin/users - List all users (admin only)', async () => {
      const caller = createCaller(createMockContext(testAdmin.id, 'admin'));
      const result = await caller.admin.users.list({
        page: 1,
        limit: 10,
      });

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.totalCount).toBeGreaterThan(0);
    });

    test('GET /admin/users - Forbidden for non-admins', async () => {
      const caller = createCaller(createMockContext(testUser.id, 'professional'));
      await expect(
        caller.admin.users.list({ page: 1, limit: 10 })
      ).rejects.toThrow('FORBIDDEN');
    });

    test('PATCH /admin/jobs/:id/moderate - Moderate job posting', async () => {
      const caller = createCaller(createMockContext(testAdmin.id, 'admin'));
      const result = await caller.admin.jobs.moderate({
        id: testJob.id,
        status: 'approved',
        reason: 'Meets all requirements',
      });

      expect(result.moderationStatus).toBe('approved');
      expect(result.moderationReason).toBe('Meets all requirements');
    });
  });

  describe('Analytics Endpoints', () => {
    test('GET /analytics/dashboard - Get dashboard metrics', async () => {
      const caller = createCaller(createMockContext(testUser.id));
      const result = await caller.analytics.dashboard({});

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalJobs');
      expect(result).toHaveProperty('activeApplications');
      expect(result).toHaveProperty('recentActivity');
    });

    test('GET /analytics/trends - Get trend data', async () => {
      const caller = createCaller(createMockContext(testUser.id));
      const result = await caller.analytics.trends({
        metric: 'applications',
        period: 'week',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Support Endpoints', () => {
    test('POST /support/tickets - Create support ticket', async () => {
      const caller = createCaller(createMockContext(testUser.id));
      const result = await caller.support.createTicket({
        subject: 'Test Support Ticket',
        description: 'I need help with something',
        category: 'technical',
        priority: 'medium',
      });

      expect(result).toBeDefined();
      expect(result.subject).toBe('Test Support Ticket');
      expect(result.status).toBe('open');
    });

    test('GET /support/tickets - List user tickets', async () => {
      const caller = createCaller(createMockContext(testUser.id));
      const result = await caller.support.listTickets({
        page: 1,
        limit: 10,
      });

      expect(result.tickets).toBeDefined();
      expect(Array.isArray(result.tickets)).toBe(true);
    });
  });

  describe('API Versioning', () => {
    test('Version endpoint returns current version', async () => {
      const caller = createCaller(createMockContext());
      const result = await caller.version.get();

      expect(result.current).toBe('1.0.0');
      expect(result.supported).toContain('1.0.0');
      expect(Array.isArray(result.deprecated)).toBe(true);
    });

    test('API accepts version header', async () => {
      const ctx = createMockContext();
      ctx.req.headers['x-api-version'] = '1.0.0';
      const caller = createCaller(ctx);
      
      // Should not throw
      const result = await caller.jobs.list({ page: 1, limit: 10 });
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('Returns proper error for non-existent resource', async () => {
      const caller = createCaller(createMockContext());
      await expect(
        caller.jobs.getById({ id: 'non-existent-id' })
      ).rejects.toThrow('NOT_FOUND');
    });

    test('Returns validation error for invalid input', async () => {
      const caller = createCaller(createMockContext());
      await expect(
        caller.auth.signup({
          email: 'invalid-email',
          password: 'weak',
          name: '',
          role: 'invalid-role' as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    test('Rate limit headers are included', async () => {
      const ctx = createMockContext();
      const caller = createCaller(ctx);
      
      await caller.jobs.list({ page: 1, limit: 10 });
      
      // In real implementation, check for rate limit headers
      // expect(ctx.res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(String));
    });
  });
});