import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

interface AnalyticsEvent {
  userId?: string;
  sessionId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  page?: string;
  referrer?: string;
}

// In-memory storage for demo (replace with proper analytics service in production)
const analyticsEvents: AnalyticsEvent[] = [];

export const analyticsRouter = createTRPCRouter({
  // Track user events
  track: protectedProcedure
    .input(z.object({
      event: z.string(),
      properties: z.record(z.any()).optional().default({}),
      page: z.string().optional(),
      referrer: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const event: AnalyticsEvent = {
        userId: ctx.userId,
        sessionId: ctx.sessionId || 'anonymous',
        event: input.event,
        properties: input.properties,
        timestamp: new Date(),
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        page: input.page,
        referrer: input.referrer
      };
      
      // Store event (in production, send to analytics service)
      analyticsEvents.push(event);
      
      // Also store in database for persistence
      try {
        await ctx.db.analyticsEvent.create({
          data: {
            userId: ctx.userId,
            sessionId: event.sessionId,
            event: input.event,
            properties: input.properties,
            page: input.page,
            referrer: input.referrer,
            userAgent: ctx.userAgent,
            ip: ctx.ip
          }
        });
      } catch (error) {
        // Fail silently for analytics to not break user experience
        console.error('Failed to store analytics event:', error);
      }
      
      return { success: true };
    }),

  // Track page views
  pageView: protectedProcedure
    .input(z.object({
      page: z.string(),
      title: z.string().optional(),
      referrer: z.string().optional(),
      loadTime: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.procedure.track.mutate({
        event: 'page_view',
        properties: {
          title: input.title,
          loadTime: input.loadTime
        },
        page: input.page,
        referrer: input.referrer
      });
    }),

  // Get dashboard analytics (admin only)
  getDashboardStats: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      granularity: z.enum(['hour', 'day', 'week', 'month']).optional().default('day')
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const now = new Date();
      const startDate = input.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = input.endDate || now;
      
      // Page views over time
      const pageViews = await db.analyticsEvent.groupBy({
        by: ['createdAt'],
        where: {
          event: 'page_view',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: true
      });
      
      // User sessions
      const uniqueSessions = await db.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: true
      });
      
      // Top pages
      const topPages = await db.analyticsEvent.groupBy({
        by: ['page'],
        where: {
          event: 'page_view',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: true,
        orderBy: {
          _count: {
            page: 'desc'
          }
        },
        take: 10
      });
      
      // User registrations over time
      const registrations = await db.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: true
      });
      
      // Job applications over time
      const applications = await db.application.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: true
      });
      
      // Conversion funnel
      const funnelData = {
        visitors: uniqueSessions.length,
        jobViews: await db.analyticsEvent.count({
          where: {
            event: 'job_view',
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        applications: await db.application.count({
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        hires: await db.application.count({
          where: {
            status: 'ACCEPTED',
            updatedAt: { gte: startDate, lte: endDate }
          }
        })
      };
      
      return {
        pageViews: pageViews.map(pv => ({
          date: pv.createdAt,
          count: pv._count
        })),
        sessions: uniqueSessions.length,
        topPages: topPages.map(tp => ({
          page: tp.page,
          views: tp._count
        })),
        registrations: registrations.map(r => ({
          date: r.createdAt,
          count: r._count
        })),
        applications: applications.map(a => ({
          date: a.createdAt,
          count: a._count
        })),
        conversionFunnel: funnelData
      };
    }),

  // Get user behavior analytics
  getUserBehavior: adminProcedure
    .input(z.object({
      userId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().optional().default(100)
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { userId, startDate, endDate, limit } = input;
      
      const where: any = {};
      if (userId) where.userId = userId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }
      
      const events = await db.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      return events;
    }),

  // Get real-time analytics
  getRealTimeStats: adminProcedure
    .query(async ({ ctx }) => {
      const { db } = ctx;
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Active users in last 15 minutes
      const activeUsers = await db.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          userId: { not: null },
          createdAt: { gte: fifteenMinutesAgo }
        },
        _count: true
      });
      
      // Page views in last hour
      const recentPageViews = await db.analyticsEvent.count({
        where: {
          event: 'page_view',
          createdAt: { gte: oneHourAgo }
        }
      });
      
      // Recent events
      const recentEvents = await db.analyticsEvent.findMany({
        where: {
          createdAt: { gte: oneHourAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      return {
        activeUsers: activeUsers.length,
        pageViewsLastHour: recentPageViews,
        recentEvents: recentEvents.map(event => ({
          id: event.id,
          event: event.event,
          userId: event.userId,
          user: event.user,
          page: event.page,
          properties: event.properties,
          timestamp: event.createdAt
        }))
      };
    }),

  // Get performance metrics
  getPerformanceMetrics: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const now = new Date();
      const startDate = input.startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const endDate = input.endDate || now;
      
      // Get page load times
      const pageLoadEvents = await db.analyticsEvent.findMany({
        where: {
          event: 'page_view',
          createdAt: { gte: startDate, lte: endDate },
          properties: {
            path: ['loadTime'],
            not: null
          }
        },
        select: {
          page: true,
          properties: true,
          createdAt: true
        }
      });
      
      // Calculate average load times by page
      const loadTimesByPage: Record<string, number[]> = {};
      pageLoadEvents.forEach(event => {
        const page = event.page || 'unknown';
        const loadTime = event.properties?.loadTime;
        if (typeof loadTime === 'number') {
          if (!loadTimesByPage[page]) loadTimesByPage[page] = [];
          loadTimesByPage[page].push(loadTime);
        }
      });
      
      const performanceMetrics = Object.entries(loadTimesByPage).map(([page, times]) => {
        const avgLoadTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const p95LoadTime = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
        
        return {
          page,
          avgLoadTime: Math.round(avgLoadTime),
          p95LoadTime: Math.round(p95LoadTime || avgLoadTime),
          sampleSize: times.length
        };
      });
      
      return {
        performanceMetrics: performanceMetrics.sort((a, b) => b.sampleSize - a.sampleSize),
        totalSamples: pageLoadEvents.length
      };
    }),

  // Get conversion metrics
  getConversionMetrics: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const now = new Date();
      const startDate = input.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate || now;
      
      // Visitor to registration conversion
      const uniqueVisitors = await db.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: true
      });
      
      const registrations = await db.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      });
      
      // Job view to application conversion
      const jobViews = await db.analyticsEvent.count({
        where: {
          event: 'job_view',
          createdAt: { gte: startDate, lte: endDate }
        }
      });
      
      const applications = await db.application.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      });
      
      // Application to hire conversion
      const hires = await db.application.count({
        where: {
          status: 'ACCEPTED',
          updatedAt: { gte: startDate, lte: endDate }
        }
      });
      
      return {
        visitorToRegistration: {
          visitors: uniqueVisitors.length,
          registrations,
          rate: uniqueVisitors.length > 0 ? (registrations / uniqueVisitors.length * 100) : 0
        },
        viewToApplication: {
          views: jobViews,
          applications,
          rate: jobViews > 0 ? (applications / jobViews * 100) : 0
        },
        applicationToHire: {
          applications,
          hires,
          rate: applications > 0 ? (hires / applications * 100) : 0
        }
      };
    })
});