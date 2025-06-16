import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { ApplicationStatus } from '@locumtruerate/database';
import { nanoid } from 'nanoid';

// Validation schemas
const createApplicationSchema = z.object({
  jobId: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  experience: z.number().min(0).max(50, 'Experience must be between 0 and 50 years'),
  currentCompany: z.string().optional(),
  currentRole: z.string().optional(),
  expectedSalary: z.string().optional(),
  noticePeriod: z.string().optional(),
  resumeUrl: z.string().url('Invalid resume URL').optional(),
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters'),
  portfolioUrl: z.string().url('Invalid portfolio URL').optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional(),
  additionalInfo: z.string().optional()
});

const updateApplicationStatusSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(ApplicationStatus),
  notes: z.string().optional()
});

const addCommentSchema = z.object({
  applicationId: z.string(),
  comment: z.string().min(1, 'Comment cannot be empty'),
  isInternal: z.boolean().default(true)
});

const applicationFiltersSchema = z.object({
  jobId: z.string().optional(),
  status: z.nativeEnum(ApplicationStatus).optional(),
  userId: z.string().optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  search: z.string().optional()
});

const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['appliedAt', 'updatedAt', 'score', 'status']).default('appliedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// AI Scoring function (placeholder)
const calculateApplicationScore = async (application: any): Promise<{ score: number; breakdown: any }> => {
  // This would integrate with an AI service in production
  // For now, return a mock score based on basic criteria
  
  let score = 0;
  const breakdown = {
    experience: 0,
    education: 0,
    skills: 0,
    coverLetter: 0,
    overall: 0
  };

  // Experience scoring (0-30 points)
  if (application.experience >= 5) {
    breakdown.experience = 30;
  } else if (application.experience >= 2) {
    breakdown.experience = 20;
  } else if (application.experience >= 1) {
    breakdown.experience = 10;
  }

  // Cover letter scoring (0-25 points)
  const coverLetterLength = application.coverLetter.length;
  if (coverLetterLength >= 500) {
    breakdown.coverLetter = 25;
  } else if (coverLetterLength >= 200) {
    breakdown.coverLetter = 20;
  } else if (coverLetterLength >= 100) {
    breakdown.coverLetter = 15;
  } else {
    breakdown.coverLetter = 10;
  }

  // Additional points for portfolio and LinkedIn
  if (application.portfolioUrl) breakdown.skills += 10;
  if (application.linkedinUrl) breakdown.skills += 5;
  if (application.resumeUrl) breakdown.skills += 10;

  // Calculate total score
  score = breakdown.experience + breakdown.education + breakdown.skills + breakdown.coverLetter;
  breakdown.overall = score;

  return { score: Math.min(score, 100), breakdown };
};

export const applicationsRouter = createTRPCRouter({
  create: publicProcedure
    .input(createApplicationSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        jobId,
        name,
        email,
        phone,
        experience,
        currentCompany,
        currentRole,
        expectedSalary,
        noticePeriod,
        resumeUrl,
        coverLetter,
        portfolioUrl,
        linkedinUrl,
        additionalInfo
      } = input;

      // Verify job exists and is active
      const job = await ctx.db.job.findFirst({
        where: {
          id: jobId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() }
        },
        include: {
          company: {
            select: {
              name: true
            }
          }
        }
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found or no longer accepting applications'
        });
      }

      // Check for duplicate application (same email for same job)
      const existingApplication = await ctx.db.application.findFirst({
        where: {
          jobId,
          email: email.toLowerCase()
        }
      });

      if (existingApplication) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already applied for this position'
        });
      }

      try {
        // Calculate AI score
        const { score, breakdown } = await calculateApplicationScore({
          experience,
          coverLetter,
          portfolioUrl,
          linkedinUrl,
          resumeUrl
        });

        // Create application
        const application = await ctx.db.application.create({
          data: {
            jobId,
            userId: ctx.user?.id, // Will be null for guest applications
            name,
            email: email.toLowerCase(),
            phone,
            experience,
            currentCompany,
            currentRole,
            expectedSalary,
            noticePeriod,
            resumeUrl,
            coverLetter,
            portfolioUrl,
            linkedinUrl,
            additionalInfo,
            score,
            scoreBreakdown: breakdown,
            ipAddress: ctx.request.ipAddress,
            legacyId: nanoid(10) // For backward compatibility
          },
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        });

        // Increment application count on job
        await ctx.db.job.update({
          where: { id: jobId },
          data: { applicationCount: { increment: 1 } }
        });

        // Create activity log entry
        if (ctx.user?.id) {
          await ctx.db.activityLog.create({
            data: {
              userId: ctx.user.id,
              action: 'application_submitted',
              entityType: 'application',
              entityId: application.id,
              details: {
                jobId,
                jobTitle: job.title,
                companyName: job.company.name
              },
              ipAddress: ctx.request.ipAddress,
              userAgent: ctx.request.userAgent
            }
          });
        }

        ctx.logger.info('Application submitted successfully', {
          applicationId: application.id,
          jobId,
          applicantEmail: email,
          score,
          userId: ctx.user?.id
        });

        // TODO: Send notification emails to employer and applicant
        // await sendApplicationNotificationEmails(application);

        return {
          id: application.id,
          jobTitle: job.title,
          companyName: job.company.name,
          appliedAt: application.appliedAt,
          status: application.status,
          score: application.score
        };
      } catch (error) {
        ctx.logger.error('Failed to submit application', {
          jobId,
          email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit application'
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { id } = input;

      const application = await ctx.db.application.findFirst({
        where: {
          id,
          OR: [
            { userId: ctx.user.id }, // User's own application
            { job: { userId: ctx.user.id } } // Application for user's job
          ]
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              company: {
                select: {
                  name: true,
                  logo: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              contactName: true,
              email: true,
              avatarUrl: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  contactName: true,
                  avatarUrl: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found or you do not have permission to view it'
        });
      }

      return application;
    }),

  getByJob: protectedProcedure
    .input(z.object({ 
      jobId: z.string(),
      ...applicationFiltersSchema.shape,
      ...paginationSchema.shape
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { jobId, status, minScore, maxScore, search, page, limit, sortBy, sortOrder } = input;

      // Verify user owns the job
      const job = await ctx.db.job.findFirst({
        where: {
          id: jobId,
          userId: ctx.user.id
        }
      });

      if (!job) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view applications for jobs you own'
        });
      }

      const where: any = { jobId };

      if (status) where.status = status;
      if (minScore !== undefined) where.score = { gte: minScore };
      if (maxScore !== undefined) {
        where.score = { ...where.score, lte: maxScore };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { currentCompany: { contains: search, mode: 'insensitive' } },
          { currentRole: { contains: search, mode: 'insensitive' } }
        ];
      }

      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      const [applications, total] = await Promise.all([
        ctx.db.application.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            experience: true,
            currentCompany: true,
            currentRole: true,
            expectedSalary: true,
            score: true,
            status: true,
            appliedAt: true,
            reviewedAt: true,
            resumeUrl: true,
            portfolioUrl: true,
            linkedinUrl: true
          }
        }),
        ctx.db.application.count({ where })
      ]);

      return {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }),

  getByUser: protectedProcedure
    .input(paginationSchema)
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { page, limit, sortBy, sortOrder } = input;

      const where = {
        OR: [
          { userId: ctx.user.id },
          { email: ctx.user.id } // For users who applied before creating account
        ]
      };

      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      const [applications, total] = await Promise.all([
        ctx.db.application.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            job: {
              select: {
                id: true,
                title: true,
                slug: true,
                location: true,
                status: true,
                company: {
                  select: {
                    name: true,
                    logo: true
                  }
                }
              }
            }
          }
        }),
        ctx.db.application.count({ where })
      ]);

      return {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }),

  updateStatus: protectedProcedure
    .input(updateApplicationStatusSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { id, status, notes } = input;

      // Verify user owns the job this application is for
      const application = await ctx.db.application.findFirst({
        where: {
          id,
          job: { userId: ctx.user.id }
        },
        include: {
          job: {
            select: {
              title: true,
              userId: true
            }
          }
        }
      });

      if (!application) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update applications for jobs you own'
        });
      }

      const updatedApplication = await ctx.db.application.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id
        }
      });

      // Add comment if notes provided
      if (notes) {
        await ctx.db.applicationComment.create({
          data: {
            applicationId: id,
            userId: ctx.user.id,
            comment: notes,
            isInternal: true
          }
        });
      }

      ctx.logger.info('Application status updated', {
        applicationId: id,
        oldStatus: application.status,
        newStatus: status,
        userId: ctx.user.id
      });

      // TODO: Send status update notification to applicant
      // await sendApplicationStatusEmail(updatedApplication, status);

      return updatedApplication;
    }),

  addComment: protectedProcedure
    .input(addCommentSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { applicationId, comment, isInternal } = input;

      // Verify user has permission to comment
      const application = await ctx.db.application.findFirst({
        where: {
          id: applicationId,
          OR: [
            { userId: ctx.user.id }, // Own application
            { job: { userId: ctx.user.id } } // Own job's application
          ]
        }
      });

      if (!application) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to comment on this application'
        });
      }

      const newComment = await ctx.db.applicationComment.create({
        data: {
          applicationId,
          userId: ctx.user.id,
          comment,
          isInternal,
          legacyId: nanoid(10)
        },
        include: {
          user: {
            select: {
              contactName: true,
              avatarUrl: true
            }
          }
        }
      });

      return newComment;
    }),

  getComments: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { applicationId } = input;

      // Verify user has permission to view comments
      const application = await ctx.db.application.findFirst({
        where: {
          id: applicationId,
          OR: [
            { userId: ctx.user.id },
            { job: { userId: ctx.user.id } }
          ]
        }
      });

      if (!application) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view comments for this application'
        });
      }

      const comments = await ctx.db.applicationComment.findMany({
        where: { applicationId },
        include: {
          user: {
            select: {
              contactName: true,
              avatarUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return comments;
    }),

  getStats: protectedProcedure
    .input(z.object({ jobId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { jobId } = input;

      const where: any = {
        job: { userId: ctx.user.id }
      };

      if (jobId) {
        where.jobId = jobId;
      }

      const [
        totalApplications,
        pendingApplications,
        reviewedApplications,
        acceptedApplications,
        rejectedApplications,
        averageScore
      ] = await Promise.all([
        ctx.db.application.count({ where }),
        ctx.db.application.count({ where: { ...where, status: 'PENDING' } }),
        ctx.db.application.count({ where: { ...where, status: 'REVIEWED' } }),
        ctx.db.application.count({ where: { ...where, status: 'ACCEPTED' } }),
        ctx.db.application.count({ where: { ...where, status: 'REJECTED' } }),
        ctx.db.application.aggregate({
          where,
          _avg: { score: true }
        })
      ]);

      return {
        total: totalApplications,
        pending: pendingApplications,
        reviewed: reviewedApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
        averageScore: averageScore._avg.score || 0
      };
    })
});