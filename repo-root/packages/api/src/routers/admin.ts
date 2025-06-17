import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const adminRouter = createTRPCRouter({
  // Dashboard analytics
  getDashboardStats: adminProcedure
    .query(async ({ ctx }) => {
      const { db } = ctx;
      
      // Get user counts
      const totalUsers = await db.user.count();
      const newUsersThisMonth = await db.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });
      
      // Get job counts
      const totalJobs = await db.job.count({ where: { status: 'ACTIVE' } });
      const newJobsThisMonth = await db.job.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });
      
      // Get pending reviews
      const pendingJobs = await db.job.count({ 
        where: { status: 'PENDING' } 
      });
      
      // Get flagged applications (mock for now)
      const flaggedApplications = await db.application.count({
        where: {
          status: 'FLAGGED'
        }
      });
      
      return {
        users: {
          total: totalUsers,
          new: newUsersThisMonth,
          growth: newUsersThisMonth > 0 ? ((newUsersThisMonth / Math.max(totalUsers - newUsersThisMonth, 1)) * 100).toFixed(1) : '0'
        },
        jobs: {
          total: totalJobs,
          new: newJobsThisMonth,
          growth: newJobsThisMonth > 0 ? ((newJobsThisMonth / Math.max(totalJobs - newJobsThisMonth, 1)) * 100).toFixed(1) : '0'
        },
        moderation: {
          pendingJobs,
          flaggedApplications
        }
      };
    }),

  // Get pending jobs for review
  getPendingJobs: adminProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1)
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { limit, page } = input;
      
      const jobs = await db.job.findMany({
        where: { status: 'PENDING' },
        include: {
          company: {
            select: {
              name: true,
              logo: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      });
      
      const total = await db.job.count({ where: { status: 'PENDING' } });
      
      return {
        jobs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }),

  // Get flagged users
  getFlaggedUsers: adminProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1)
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { limit, page } = input;
      
      // For now, return users with verification issues or multiple reports
      const users = await db.user.findMany({
        where: {
          OR: [
            { verified: false },
            // Add other flagging criteria as needed
          ]
        },
        include: {
          profile: true,
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      });
      
      const total = await db.user.count({
        where: {
          OR: [
            { verified: false }
          ]
        }
      });
      
      return {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }),

  // Approve/reject job
  moderateJob: adminProcedure
    .input(z.object({
      jobId: z.string(),
      action: z.enum(['approve', 'reject']),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { jobId, action, reason } = input;
      
      const job = await db.job.findUnique({
        where: { id: jobId },
        include: { company: true }
      });
      
      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }
      
      const newStatus = action === 'approve' ? 'ACTIVE' : 'REJECTED';
      
      const updatedJob = await db.job.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          moderationReason: reason,
          moderatedAt: new Date(),
          moderatedBy: ctx.userId
        },
        include: {
          company: true
        }
      });
      
      // TODO: Send notification to company
      
      return updatedJob;
    }),

  // Get all users with filters
  getUsers: adminProcedure
    .input(z.object({
      page: z.number().optional().default(1),
      limit: z.number().optional().default(25),
      search: z.string().optional(),
      role: z.enum(['physician', 'nurse-practitioner', 'company']).optional(),
      verified: z.boolean().optional(),
      sortBy: z.enum(['createdAt', 'email', 'role']).optional().default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { page, limit, search, role, verified, sortBy, sortOrder } = input;
      
      const where: any = {};
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (role) {
        where.role = role;
      }
      
      if (verified !== undefined) {
        where.verified = verified;
      }
      
      const users = await db.user.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit
      });
      
      const total = await db.user.count({ where });
      
      return {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }),

  // Update user verification status
  updateUserVerification: adminProcedure
    .input(z.object({
      userId: z.string(),
      verified: z.boolean(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { userId, verified, reason } = input;
      
      const user = await db.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
      
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          verified,
          verificationReason: reason,
          verifiedAt: verified ? new Date() : null,
          verifiedBy: verified ? ctx.userId : null
        },
        include: {
          profile: true
        }
      });
      
      // TODO: Send notification to user
      
      return updatedUser;
    }),

  // Get system activity log
  getActivityLog: adminProcedure
    .input(z.object({
      page: z.number().optional().default(1),
      limit: z.number().optional().default(25),
      type: z.enum(['job', 'user', 'application', 'system']).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      // For now, return mock data since we don't have activity logging implemented
      const mockActivities = [
        {
          id: '1',
          type: 'job',
          action: 'created',
          description: 'New job posted: Emergency Medicine position',
          userId: 'user1',
          userName: 'Metro General Hospital',
          createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          metadata: { jobId: 'job1' }
        },
        {
          id: '2',
          type: 'user',
          action: 'registered',
          description: 'New user registered as Physician',
          userId: 'user2',
          userName: 'Dr. Sarah Johnson',
          createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
          metadata: { role: 'physician' }
        },
        {
          id: '3',
          type: 'application',
          action: 'flagged',
          description: 'Application flagged for review',
          userId: 'system',
          userName: 'System',
          createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          metadata: { applicationId: 'app1', reason: 'suspicious_activity' }
        }
      ];
      
      return {
        activities: mockActivities,
        pagination: {
          total: mockActivities.length,
          page: input.page,
          limit: input.limit,
          totalPages: 1
        }
      };
    }),

  // Get platform statistics
  getPlatformStats: adminProcedure
    .query(async ({ ctx }) => {
      const { db } = ctx;
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      // User statistics
      const totalUsers = await db.user.count();
      const usersThisMonth = await db.user.count({
        where: { createdAt: { gte: startOfMonth } }
      });
      const usersLastMonth = await db.user.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      });
      
      // Job statistics
      const totalJobs = await db.job.count();
      const activeJobs = await db.job.count({ where: { status: 'ACTIVE' } });
      const jobsThisMonth = await db.job.count({
        where: { createdAt: { gte: startOfMonth } }
      });
      
      // Application statistics
      const totalApplications = await db.application.count();
      const applicationsThisMonth = await db.application.count({
        where: { createdAt: { gte: startOfMonth } }
      });
      
      return {
        users: {
          total: totalUsers,
          thisMonth: usersThisMonth,
          lastMonth: usersLastMonth,
          growth: usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1) : '0'
        },
        jobs: {
          total: totalJobs,
          active: activeJobs,
          thisMonth: jobsThisMonth
        },
        applications: {
          total: totalApplications,
          thisMonth: applicationsThisMonth
        }
      };
    })
});