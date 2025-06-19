import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { leadsRouter } from '../routers/leads';
import { createContext } from '../context';
import type { Context } from '../context';

// Mock the database
const mockDb = {
  lead: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
};

// Mock logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

// Mock fetch for webhook testing
global.fetch = vi.fn();

const createMockContext = (overrides: Partial<Context> = {}): Context => ({
  db: mockDb as any,
  logger: mockLogger as any,
  user: null,
  request: {
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  },
  ...overrides,
});

const createAdminContext = (): Context => createMockContext({
  user: {
    id: 'admin-user-1',
    role: 'admin',
    sessionId: 'session-123',
  },
});

const createCaller = (ctx: Context) => {
  return leadsRouter.createCaller(ctx);
};

describe('Leads Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ZAPIER_WEBHOOK_URLS = 'https://hooks.zapier.com/test';
    process.env.ZAPIER_WEBHOOK_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.ZAPIER_WEBHOOK_URLS;
    delete process.env.ZAPIER_WEBHOOK_SECRET;
  });

  describe('create', () => {
    it('should create a new lead successfully', async () => {
      const ctx = createMockContext();
      const caller = createCaller(ctx);

      // Mock no existing lead
      mockDb.lead.findFirst.mockResolvedValue(null);
      
      // Mock successful creation
      const mockLead = {
        id: 'lead-1',
        email: 'test@example.com',
        name: 'Test User',
        company: 'Test Company',
        phone: '555-0123',
        message: 'I am interested in your services',
        source: 'website',
        score: 75,
        status: 'new',
        createdAt: new Date(),
        metadata: {
          scoreBreakdown: {
            source: 10,
            engagement: 0,
            profile: 20,
            message: 25,
            calculation: 0,
            total: 75,
          },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          submissionCount: 1,
        },
      };
      mockDb.lead.create.mockResolvedValue(mockLead);

      // Mock successful webhook
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await caller.create({
        email: 'test@example.com',
        name: 'Test User',
        company: 'Test Company',
        phone: '555-0123',
        message: 'I am interested in your services',
        source: 'website',
      });

      expect(result.success).toBe(true);
      expect(result.leadId).toBe('lead-1');
      expect(result.score).toBe(75);
      expect(mockDb.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          company: 'Test Company',
          phone: '555-0123',
          message: 'I am interested in your services',
          source: 'website',
          score: 75,
          status: 'new',
        }),
      });
    });

    it('should update existing lead within 24 hours', async () => {
      const ctx = createMockContext();
      const caller = createCaller(ctx);

      // Mock existing lead
      const existingLead = {
        id: 'lead-1',
        email: 'test@example.com',
        message: 'Old message',
        metadata: { submissionCount: 1 },
        createdAt: new Date(),
      };
      mockDb.lead.findFirst.mockResolvedValue(existingLead);
      
      const updatedLead = {
        ...existingLead,
        message: 'New message',
        metadata: {
          submissionCount: 2,
          lastSubmission: expect.any(String),
        },
      };
      mockDb.lead.update.mockResolvedValue(updatedLead);

      const result = await caller.create({
        email: 'test@example.com',
        name: 'Test User',
        message: 'New message',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lead updated successfully');
      expect(mockDb.lead.update).toHaveBeenCalled();
    });

    it('should detect and handle spam', async () => {
      const ctx = createMockContext();
      const caller = createCaller(ctx);

      mockDb.lead.findFirst.mockResolvedValue(null);

      const result = await caller.create({
        email: 'spam@example.com',
        message: 'Buy viagra now! Casino lottery investment crypto',
      });

      // Should return success to avoid revealing spam detection
      expect(result.success).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Spam lead detected',
        expect.objectContaining({
          email: 'spam@example.com',
          reason: expect.stringContaining('spam keyword'),
        })
      );
      expect(mockDb.lead.create).not.toHaveBeenCalled();
    });

    it('should enforce rate limiting', async () => {
      const ctx = createMockContext();
      const caller = createCaller(ctx);

      // Create multiple leads quickly to trigger rate limit
      const promises = Array.from({ length: 12 }, () =>
        caller.create({
          email: 'test@example.com',
          name: 'Test User',
        })
      );

      // At least one should be rate limited
      await expect(Promise.all(promises)).rejects.toThrow(/too many/i);
    });

    it('should validate input data', async () => {
      const ctx = createMockContext();
      const caller = createCaller(ctx);

      await expect(
        caller.create({
          email: 'invalid-email',
          name: 'A', // Too short
        })
      ).rejects.toThrow();
    });
  });

  describe('getLeads (admin only)', () => {
    it('should return paginated leads for admin', async () => {
      const ctx = createAdminContext();
      const caller = createCaller(ctx);

      const mockLeads = [
        {
          id: 'lead-1',
          email: 'test1@example.com',
          name: 'Test User 1',
          score: 85,
          status: 'new',
          createdAt: new Date(),
        },
        {
          id: 'lead-2',
          email: 'test2@example.com',
          name: 'Test User 2',
          score: 70,
          status: 'contacted',
          createdAt: new Date(),
        },
      ];

      mockDb.lead.findMany.mockResolvedValue(mockLeads);
      mockDb.lead.count.mockResolvedValue(2);

      const result = await caller.getLeads({});

      expect(result.leads).toEqual(mockLeads);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter leads by source', async () => {
      const ctx = createAdminContext();
      const caller = createCaller(ctx);

      mockDb.lead.findMany.mockResolvedValue([]);
      mockDb.lead.count.mockResolvedValue(0);

      await caller.getLeads({ source: 'calculator' });

      expect(mockDb.lead.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ source: 'calculator' }),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should require admin access', async () => {
      const ctx = createMockContext(); // Non-admin user
      const caller = createCaller(ctx);

      await expect(caller.getLeads({})).rejects.toThrow(/admin access required/i);
    });
  });

  describe('updateLead', () => {
    it('should update lead status successfully', async () => {
      const ctx = createAdminContext();
      const caller = createCaller(ctx);

      const existingLead = {
        id: 'lead-1',
        status: 'new',
        metadata: {},
      };
      mockDb.lead.findUnique.mockResolvedValue(existingLead);
      
      const updatedLead = {
        ...existingLead,
        status: 'contacted',
        updatedAt: new Date(),
      };
      mockDb.lead.update.mockResolvedValue(updatedLead);

      // Mock webhook success
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await caller.updateLead({
        id: 'lead-1',
        status: 'contacted',
      });

      expect(result.status).toBe('contacted');
      expect(mockDb.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: expect.objectContaining({
          status: 'contacted',
        }),
      });
    });

    it('should set conversion timestamp when status changes to converted', async () => {
      const ctx = createAdminContext();
      const caller = createCaller(ctx);

      const existingLead = {
        id: 'lead-1',
        status: 'qualified',
        metadata: {},
      };
      mockDb.lead.findUnique.mockResolvedValue(existingLead);
      mockDb.lead.update.mockResolvedValue({
        ...existingLead,
        status: 'converted',
        convertedAt: new Date(),
      });

      await caller.updateLead({
        id: 'lead-1',
        status: 'converted',
      });

      expect(mockDb.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: expect.objectContaining({
          status: 'converted',
          convertedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('getLeadStats', () => {
    it('should return comprehensive lead statistics', async () => {
      const ctx = createAdminContext();
      const caller = createCaller(ctx);

      // Mock database responses
      mockDb.lead.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(30)  // new
        .mockResolvedValueOnce(25)  // contacted
        .mockResolvedValueOnce(20)  // qualified
        .mockResolvedValueOnce(15)  // converted
        .mockResolvedValueOnce(10); // lost

      mockDb.lead.aggregate.mockResolvedValue({
        _avg: { score: 75.5 },
      });

      mockDb.lead.groupBy
        .mockResolvedValueOnce([
          { source: 'website', _count: { _all: 50 } },
          { source: 'calculator', _count: { _all: 30 } },
          { source: 'referral', _count: { _all: 20 } },
        ])
        .mockResolvedValueOnce([
          { source: 'website', status: 'converted', _count: { _all: 8 } },
          { source: 'calculator', status: 'converted', _count: { _all: 5 } },
          { source: 'referral', status: 'converted', _count: { _all: 2 } },
        ]);

      const result = await caller.getLeadStats({});

      expect(result.totals.total).toBe(100);
      expect(result.totals.converted).toBe(15);
      expect(result.averageScore).toBe(75.5);
      expect(result.overallConversionRate).toBe(15);
      expect(result.sourceBreakdown).toHaveLength(3);
      expect(result.conversionRates).toHaveLength(3);
    });
  });

  describe('rescoreLead', () => {
    it('should recalculate lead score', async () => {
      const ctx = createAdminContext();
      const caller = createCaller(ctx);

      const existingLead = {
        id: 'lead-1',
        email: 'test@example.com',
        name: 'Test User',
        company: 'Test Company',
        phone: '555-0123',
        message: 'Detailed message about services needed',
        source: 'calculator',
        score: 50,
        metadata: { calculationData: { annualSalary: 200000 } },
      };

      mockDb.lead.findUnique.mockResolvedValue(existingLead);
      mockDb.lead.update.mockResolvedValue({
        ...existingLead,
        score: 95, // New calculated score
      });

      const result = await caller.rescoreLead({ id: 'lead-1' });

      expect(mockDb.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: expect.objectContaining({
          score: expect.any(Number),
          metadata: expect.objectContaining({
            scoreBreakdown: expect.any(Object),
            lastRescored: expect.any(String),
            rescoredBy: 'admin-user-1',
          }),
        }),
      });
    });
  });

  describe('testWebhook', () => {
    it('should test webhook successfully', async () => {
      const ctx = createAdminContext();
      const caller = createCaller(ctx);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await caller.testWebhook({
        url: 'https://hooks.zapier.com/test',
        event: 'test',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.zapier.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'LocumTrueRate-Webhook/1.0',
          }),
          body: expect.stringContaining('test'),
        })
      );
    });

    it('should handle webhook failure', async () => {
      const ctx = createAdminContext();
      const caller = createCaller(ctx);

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await caller.testWebhook({
        url: 'https://hooks.zapier.com/test',
        event: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });
  });
});