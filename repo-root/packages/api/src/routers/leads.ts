import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { nanoid } from 'nanoid';
import * as crypto from 'crypto';

// Validation schemas
const createLeadSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  source: z.string().default('website'),
  sourceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  calculationData: z.record(z.any()).optional(), // For calculator-generated leads
});

const updateLeadSchema = z.object({
  id: z.string(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const leadFiltersSchema = z.object({
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  email: z.string().optional(),
  company: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'score', 'status', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const webhookConfigSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.enum(['lead.created', 'lead.updated', 'lead.converted', 'lead.scored'])),
  secret: z.string().optional(),
  enabled: z.boolean().default(true),
});

// Lead scoring function
const calculateLeadScore = (lead: any): { score: number; breakdown: any } => {
  let score = 0;
  const breakdown = {
    source: 0,
    engagement: 0,
    profile: 0,
    message: 0,
    calculation: 0,
    total: 0,
  };

  // Source scoring (0-25 points)
  const sourceScores: Record<string, number> = {
    calculator: 25,
    contact_form: 20,
    demo_request: 22,
    newsletter: 15,
    blog: 12,
    social: 10,
    referral: 25,
    paid_ad: 18,
    organic: 15,
    zapier: 20,
    api: 15,
    website: 10,
  };
  breakdown.source = sourceScores[lead.source] || 10;

  // Profile completeness (0-20 points)
  if (lead.name) breakdown.profile += 5;
  if (lead.company) breakdown.profile += 8;
  if (lead.phone) breakdown.profile += 7;

  // Message quality (0-25 points)
  if (lead.message) {
    const messageLength = lead.message.length;
    if (messageLength >= 200) {
      breakdown.message = 25;
    } else if (messageLength >= 100) {
      breakdown.message = 20;
    } else if (messageLength >= 50) {
      breakdown.message = 15;
    } else if (messageLength >= 10) {
      breakdown.message = 10;
    }
  }

  // Calculator data bonus (0-20 points)
  if (lead.calculationData) {
    breakdown.calculation = 20;
    // Additional points for high-value calculations
    if (lead.calculationData.annualSalary && lead.calculationData.annualSalary > 150000) {
      breakdown.calculation += 5;
    }
  }

  // Engagement indicators (0-10 points)
  if (lead.metadata?.utm_source) breakdown.engagement += 3;
  if (lead.metadata?.referrer) breakdown.engagement += 2;
  if (lead.metadata?.sessionDuration && lead.metadata.sessionDuration > 300) {
    breakdown.engagement += 5;
  }

  // Calculate total score
  score = breakdown.source + breakdown.engagement + breakdown.profile + breakdown.message + breakdown.calculation;
  breakdown.total = Math.min(score, 100);

  return { score: breakdown.total, breakdown };
};

// Webhook notification function
const sendWebhookNotification = async (
  webhookUrl: string,
  event: string,
  leadData: any,
  secret?: string,
  retryCount = 0
): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload = {
      event,
      data: leadData,
      timestamp: Date.now(),
      version: '1.0',
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'LocumTrueRate-Webhook/1.0',
    };

    // Add webhook signature if secret provided
    if (secret) {
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Retry logic with exponential backoff (max 3 retries)
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendWebhookNotification(webhookUrl, event, leadData, secret, retryCount + 1);
    }

    return { success: false, error: errorMessage };
  }
};

// Rate limiting for lead submission (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // 10 submissions per 15 minutes per IP

const checkRateLimit = (ipAddress: string): boolean => {
  const now = Date.now();
  const key = ipAddress;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
};

// Spam detection (basic implementation)
const detectSpam = (lead: any): { isSpam: boolean; reason?: string } => {
  // Common spam indicators
  const spamKeywords = ['viagra', 'casino', 'lottery', 'investment', 'crypto', 'bitcoin', 'loan', 'debt'];
  const suspiciousPatterns = [
    /\b\d{4,}\b/, // Too many numbers
    /[A-Z]{5,}/, // Too many consecutive capitals
    /(.)\1{4,}/, // Repeated characters
  ];

  if (lead.message) {
    const message = lead.message.toLowerCase();
    
    // Check for spam keywords
    for (const keyword of spamKeywords) {
      if (message.includes(keyword)) {
        return { isSpam: true, reason: `Contains spam keyword: ${keyword}` };
      }
    }

    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(lead.message)) {
        return { isSpam: true, reason: 'Contains suspicious patterns' };
      }
    }
  }

  // Check for suspicious email patterns
  if (lead.email) {
    const suspiciousEmailPatterns = [
      /\d+@/, // Numbers at start of email
      /@\d+/, // Numbers in domain
      /\.tk$|\.ml$|\.ga$|\.cf$/, // Suspicious TLDs
    ];

    for (const pattern of suspiciousEmailPatterns) {
      if (pattern.test(lead.email)) {
        return { isSpam: true, reason: 'Suspicious email pattern' };
      }
    }
  }

  return { isSpam: false };
};

export const leadsRouter = createTRPCRouter({
  // Create a new lead (public endpoint with protection)
  create: publicProcedure
    .input(createLeadSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, name, company, phone, message, source, sourceId, metadata, calculationData } = input;

      // Rate limiting
      const ipAddress = ctx.request.ipAddress || 'unknown';
      if (!checkRateLimit(ipAddress)) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many lead submissions. Please try again later.',
        });
      }

      // Spam detection
      const spamCheck = detectSpam(input);
      if (spamCheck.isSpam) {
        ctx.logger.warn('Spam lead detected', {
          email,
          reason: spamCheck.reason,
          ipAddress,
        });
        
        // Return success to avoid revealing spam detection
        return { success: true, message: 'Lead submitted successfully' };
      }

      // Check for duplicate leads (same email within 24 hours)
      const existingLead = await ctx.db.lead.findFirst({
        where: {
          email: email.toLowerCase(),
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          },
        },
      });

      if (existingLead) {
        // Update existing lead instead of creating duplicate
        const updatedLead = await ctx.db.lead.update({
          where: { id: existingLead.id },
          data: {
            message: message || existingLead.message,
            metadata: {
              ...(existingLead.metadata as any),
              ...metadata,
              lastSubmission: new Date().toISOString(),
              submissionCount: ((existingLead.metadata as any)?.submissionCount || 1) + 1,
            },
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          message: 'Lead updated successfully',
          leadId: updatedLead.id,
        };
      }

      try {
        // Calculate lead score
        const { score, breakdown } = calculateLeadScore({
          email,
          name,
          company,
          phone,
          message,
          source,
          calculationData,
          metadata,
        });

        // Create the lead
        const lead = await ctx.db.lead.create({
          data: {
            email: email.toLowerCase(),
            name,
            company,
            phone,
            message,
            source,
            sourceId,
            score,
            status: 'new',
            metadata: {
              ...metadata,
              scoreBreakdown: breakdown,
              ipAddress,
              userAgent: ctx.request.userAgent,
              submissionCount: 1,
              ...(calculationData && { calculationData }),
            },
          },
        });

        // Send webhook notifications
        const webhookUrls = process.env.ZAPIER_WEBHOOK_URLS?.split(',') || [];
        const webhookSecret = process.env.ZAPIER_WEBHOOK_SECRET;

        for (const webhookUrl of webhookUrls) {
          if (webhookUrl.trim()) {
            const webhookResult = await sendWebhookNotification(
              webhookUrl.trim(),
              'lead.created',
              {
                id: lead.id,
                email: lead.email,
                name: lead.name,
                company: lead.company,
                phone: lead.phone,
                message: lead.message,
                source: lead.source,
                score: lead.score,
                status: lead.status,
                createdAt: lead.createdAt,
                metadata: lead.metadata,
              },
              webhookSecret
            );

            if (!webhookResult.success) {
              ctx.logger.error('Webhook notification failed', {
                leadId: lead.id,
                webhookUrl,
                error: webhookResult.error,
              });
            }
          }
        }

        ctx.logger.info('Lead created successfully', {
          leadId: lead.id,
          email: lead.email,
          source: lead.source,
          score: lead.score,
          ipAddress,
        });

        return {
          success: true,
          message: 'Lead submitted successfully',
          leadId: lead.id,
          score: lead.score,
        };
      } catch (error) {
        ctx.logger.error('Failed to create lead', {
          email,
          source,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit lead',
        });
      }
    }),

  // Get leads (admin only)
  getLeads: adminProcedure
    .input(z.object({
      ...leadFiltersSchema.shape,
      ...paginationSchema.shape,
    }))
    .query(async ({ input, ctx }) => {
      const {
        source,
        status,
        minScore,
        maxScore,
        email,
        company,
        dateFrom,
        dateTo,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = input;

      const where: any = {};

      if (source) where.source = source;
      if (status) where.status = status;
      if (minScore !== undefined) where.score = { gte: minScore };
      if (maxScore !== undefined) {
        where.score = { ...where.score, lte: maxScore };
      }
      if (email) where.email = { contains: email, mode: 'insensitive' };
      if (company) where.company = { contains: company, mode: 'insensitive' };

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ];
      }

      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      const [leads, total] = await Promise.all([
        ctx.db.lead.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        ctx.db.lead.count({ where }),
      ]);

      return {
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get lead by ID
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const lead = await ctx.db.lead.findUnique({
        where: { id: input.id },
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lead not found',
        });
      }

      return lead;
    }),

  // Update lead
  updateLead: adminProcedure
    .input(updateLeadSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, status, score, notes, metadata } = input;

      const existingLead = await ctx.db.lead.findUnique({
        where: { id },
      });

      if (!existingLead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lead not found',
        });
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (status !== undefined) updateData.status = status;
      if (score !== undefined) updateData.score = score;
      if (notes !== undefined) {
        updateData.metadata = {
          ...(existingLead.metadata as any),
          notes,
          updatedBy: ctx.user?.id,
          updatedAt: new Date().toISOString(),
        };
      }
      if (metadata !== undefined) {
        updateData.metadata = {
          ...(existingLead.metadata as any),
          ...metadata,
        };
      }

      // Mark conversion time if status changed to converted
      if (status === 'converted' && existingLead.status !== 'converted') {
        updateData.convertedAt = new Date();
        updateData.metadata = {
          ...updateData.metadata,
          convertedBy: ctx.user?.id,
        };
      }

      const updatedLead = await ctx.db.lead.update({
        where: { id },
        data: updateData,
      });

      // Send webhook notification for status changes
      if (status && status !== existingLead.status) {
        const webhookUrls = process.env.ZAPIER_WEBHOOK_URLS?.split(',') || [];
        const webhookSecret = process.env.ZAPIER_WEBHOOK_SECRET;

        for (const webhookUrl of webhookUrls) {
          if (webhookUrl.trim()) {
            await sendWebhookNotification(
              webhookUrl.trim(),
              'lead.updated',
              {
                id: updatedLead.id,
                email: updatedLead.email,
                oldStatus: existingLead.status,
                newStatus: status,
                score: updatedLead.score,
                updatedAt: updatedLead.updatedAt,
                updatedBy: ctx.user?.id,
              },
              webhookSecret
            );
          }
        }
      }

      ctx.logger.info('Lead updated', {
        leadId: id,
        userId: ctx.user?.id,
        changes: { status, score, notes: !!notes },
      });

      return updatedLead;
    }),

  // Delete lead
  deleteLead: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const lead = await ctx.db.lead.findUnique({
        where: { id },
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lead not found',
        });
      }

      await ctx.db.lead.delete({
        where: { id },
      });

      ctx.logger.info('Lead deleted', {
        leadId: id,
        email: lead.email,
        userId: ctx.user?.id,
      });

      return { success: true };
    }),

  // Get leads by source
  getLeadsBySource: adminProcedure
    .input(z.object({
      source: z.string(),
      ...paginationSchema.shape,
    }))
    .query(async ({ input, ctx }) => {
      const { source, page, limit, sortBy, sortOrder } = input;

      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      const [leads, total] = await Promise.all([
        ctx.db.lead.findMany({
          where: { source },
          skip,
          take: limit,
          orderBy,
        }),
        ctx.db.lead.count({ where: { source } }),
      ]);

      return {
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get lead statistics
  getLeadStats: adminProcedure
    .input(z.object({
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      source: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { dateFrom, dateTo, source } = input;

      const where: any = {};
      if (source) where.source = source;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const [
        totalLeads,
        newLeads,
        contactedLeads,
        qualifiedLeads,
        convertedLeads,
        lostLeads,
        averageScore,
        sourceBreakdown,
        conversionRates,
      ] = await Promise.all([
        ctx.db.lead.count({ where }),
        ctx.db.lead.count({ where: { ...where, status: 'new' } }),
        ctx.db.lead.count({ where: { ...where, status: 'contacted' } }),
        ctx.db.lead.count({ where: { ...where, status: 'qualified' } }),
        ctx.db.lead.count({ where: { ...where, status: 'converted' } }),
        ctx.db.lead.count({ where: { ...where, status: 'lost' } }),
        ctx.db.lead.aggregate({
          where,
          _avg: { score: true },
        }),
        ctx.db.lead.groupBy({
          by: ['source'],
          where,
          _count: { _all: true },
        }),
        ctx.db.lead.groupBy({
          by: ['source', 'status'],
          where,
          _count: { _all: true },
        }),
      ]);

      // Calculate conversion rates by source
      const conversionBySource: Record<string, { total: number; converted: number; rate: number }> = {};
      sourceBreakdown.forEach((item: any) => {
        conversionBySource[item.source] = {
          total: item._count._all,
          converted: 0,
          rate: 0,
        };
      });

      conversionRates.forEach((item: any) => {
        if (item.status === 'converted' && conversionBySource[item.source]) {
          conversionBySource[item.source].converted = item._count._all;
          conversionBySource[item.source].rate = 
            (item._count._all / conversionBySource[item.source].total) * 100;
        }
      });

      return {
        totals: {
          total: totalLeads,
          new: newLeads,
          contacted: contactedLeads,
          qualified: qualifiedLeads,
          converted: convertedLeads,
          lost: lostLeads,
        },
        averageScore: averageScore._avg.score || 0,
        sourceBreakdown: sourceBreakdown.map(item => ({
          source: item.source,
          count: item._count._all,
        })),
        conversionRates: Object.entries(conversionBySource).map(([source, data]) => ({
          source,
          total: data.total,
          converted: data.converted,
          rate: Math.round(data.rate * 100) / 100,
        })),
        overallConversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 10000) / 100 : 0,
      };
    }),

  // Rescore lead (manual scoring trigger)
  rescoreLead: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const lead = await ctx.db.lead.findUnique({
        where: { id: input.id },
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lead not found',
        });
      }

      const { score, breakdown } = calculateLeadScore(lead);

      const updatedLead = await ctx.db.lead.update({
        where: { id: input.id },
        data: {
          score,
          metadata: {
            ...(lead.metadata as any),
            scoreBreakdown: breakdown,
            lastRescored: new Date().toISOString(),
            rescoredBy: ctx.user?.id,
          },
          updatedAt: new Date(),
        },
      });

      ctx.logger.info('Lead rescored', {
        leadId: input.id,
        oldScore: lead.score,
        newScore: score,
        userId: ctx.user?.id,
      });

      return updatedLead;
    }),

  // Bulk update leads
  bulkUpdate: adminProcedure
    .input(z.object({
      ids: z.array(z.string()),
      updates: z.object({
        status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
        score: z.number().min(0).max(100).optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const { ids, updates } = input;

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.status) updateData.status = updates.status;
      if (updates.score !== undefined) updateData.score = updates.score;

      const result = await ctx.db.lead.updateMany({
        where: { id: { in: ids } },
        data: updateData,
      });

      ctx.logger.info('Bulk lead update', {
        count: result.count,
        updates,
        userId: ctx.user?.id,
      });

      return { updatedCount: result.count };
    }),

  // Test webhook (admin only)
  testWebhook: adminProcedure
    .input(z.object({
      url: z.string().url(),
      event: z.string().default('test'),
      secret: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { url, event, secret } = input;

      const testData = {
        id: 'test_' + nanoid(),
        email: 'test@example.com',
        name: 'Test Lead',
        company: 'Test Company',
        source: 'test',
        score: 85,
        status: 'new',
        createdAt: new Date(),
      };

      const result = await sendWebhookNotification(url, event, testData, secret);

      ctx.logger.info('Webhook test', {
        url,
        event,
        success: result.success,
        error: result.error,
        userId: ctx.user?.id,
      });

      return result;
    }),
});