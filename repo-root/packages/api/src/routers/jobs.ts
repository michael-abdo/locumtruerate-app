import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { JobStatus, JobType, JobCategory } from '@locumtruerate/database';
import { nanoid } from 'nanoid';
import { addDays } from 'date-fns';

// Validation schemas
const createJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  location: z.string().min(2, 'Location is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  salary: z.string().optional(),
  type: z.nativeEnum(JobType).optional(),
  category: z.nativeEnum(JobCategory).optional(),
  tags: z.array(z.string()).default([]),
  companyId: z.string(),
  expiresAt: z.date().optional(),
  autoRenew: z.boolean().default(false),
  renewalDays: z.number().min(1).max(90).default(30),
  maxRenewals: z.number().min(0).max(10).default(3),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional()
});

const updateJobSchema = createJobSchema.partial().extend({
  id: z.string()
});

const jobFiltersSchema = z.object({
  status: z.nativeEnum(JobStatus).optional(),
  type: z.nativeEnum(JobType).optional(),
  category: z.nativeEnum(JobCategory).optional(),
  location: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  tags: z.array(z.string()).optional(),
  companyId: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional()
});

const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'expiresAt', 'viewCount', 'applicationCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-') + '-' + nanoid(6);
};

export const jobsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createJobSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const {
        title,
        location,
        description,
        requirements,
        responsibilities,
        benefits,
        salary,
        type,
        category,
        tags,
        companyId,
        expiresAt,
        autoRenew,
        renewalDays,
        maxRenewals,
        metaTitle,
        metaDescription
      } = input;

      // Verify user owns the company
      const company = await ctx.db.company.findFirst({
        where: {
          id: companyId,
          ownerId: ctx.user.id
        }
      });

      if (!company) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only create jobs for companies you own'
        });
      }

      try {
        const job = await ctx.db.job.create({
          data: {
            title,
            slug: generateSlug(title),
            location,
            description,
            requirements,
            responsibilities,
            benefits,
            salary,
            type,
            category,
            tags,
            companyId,
            userId: ctx.user.id,
            expiresAt: expiresAt || addDays(new Date(), 30),
            autoRenew,
            renewalDays,
            maxRenewals,
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || description.substring(0, 160),
            legacyId: nanoid(10), // For backward compatibility
            status: JobStatus.DRAFT
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true
              }
            },
            user: {
              select: {
                id: true,
                contactName: true,
                email: true
              }
            }
          }
        });

        ctx.logger.info('Job created successfully', {
          jobId: job.id,
          userId: ctx.user.id,
          companyId,
          title
        });

        return job;
      } catch (error) {
        ctx.logger.error('Failed to create job', {
          userId: ctx.user.id,
          title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create job posting'
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const job = await ctx.db.job.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              description: true,
              website: true,
              location: true,
              size: true,
              benefits: true,
              techStack: true
            }
          },
          user: {
            select: {
              id: true,
              contactName: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      // Only show published jobs to public, or any job to the owner
      if (job.status !== JobStatus.ACTIVE && job.userId !== ctx.user?.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      // Increment view count (async, don't wait)
      ctx.db.job.update({
        where: { id },
        data: { 
          viewCount: { increment: 1 },
          lastViewedAt: new Date()
        }
      }).catch((error) => {
        ctx.logger.error('Failed to increment view count', { jobId: id, error });
      });

      // Track job view for analytics
      if (ctx.user?.id) {
        ctx.db.jobView.create({
          data: {
            jobId: id,
            viewerId: ctx.user.id,
            ipAddress: ctx.request.ipAddress || '',
            userAgent: ctx.request.userAgent,
            referrer: '', // Would come from headers
            sessionId: ctx.user.sessionId || ''
          }
        }).catch((error) => {
          ctx.logger.error('Failed to track job view', { jobId: id, error });
        });
      }

      return job;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const { slug } = input;

      const job = await ctx.db.job.findUnique({
        where: { slug },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              description: true,
              website: true,
              location: true,
              size: true,
              benefits: true,
              techStack: true
            }
          },
          user: {
            select: {
              id: true,
              contactName: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      // Only show published jobs to public, or any job to the owner
      if (job.status !== JobStatus.ACTIVE && job.userId !== ctx.user?.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      return job;
    }),

  getAll: publicProcedure
    .input(jobFiltersSchema.merge(paginationSchema))
    .query(async ({ input, ctx }) => {
      const {
        status,
        type,
        category,
        location,
        salaryMin,
        salaryMax,
        tags,
        companyId,
        userId,
        search,
        page,
        limit,
        sortBy,
        sortOrder
      } = input;

      const where: any = {};

      // Public queries only show active jobs unless user owns them
      if (!userId || userId !== ctx.user?.id) {
        where.status = JobStatus.ACTIVE;
        where.expiresAt = { gt: new Date() };
      }

      // Apply filters
      if (status) where.status = status;
      if (type) where.type = type;
      if (category) where.category = category;
      if (companyId) where.companyId = companyId;
      if (userId) where.userId = userId;

      if (location) {
        where.location = {
          contains: location,
          mode: 'insensitive'
        };
      }

      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ];
      }

      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      const [jobs, total] = await Promise.all([
        ctx.db.job.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                location: true
              }
            },
            _count: {
              select: {
                applications: true
              }
            }
          }
        }),
        ctx.db.job.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    }),

  getByCompany: publicProcedure
    .input(z.object({ 
      companyId: z.string(),
      ...paginationSchema.shape
    }))
    .query(async ({ input, ctx }) => {
      const { companyId, page, limit, sortBy, sortOrder } = input;

      const where: any = {
        companyId,
        status: JobStatus.ACTIVE,
        expiresAt: { gt: new Date() }
      };

      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      const [jobs, total] = await Promise.all([
        ctx.db.job.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                location: true
              }
            },
            _count: {
              select: {
                applications: true
              }
            }
          }
        }),
        ctx.db.job.count({ where })
      ]);

      return {
        jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }),

  update: protectedProcedure
    .input(updateJobSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { id, ...updateData } = input;

      // Verify user owns the job
      const existingJob = await ctx.db.job.findFirst({
        where: {
          id,
          userId: ctx.user.id
        }
      });

      if (!existingJob) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update jobs you own'
        });
      }

      // Update slug if title changed
      if (updateData.title && updateData.title !== existingJob.title) {
        updateData.slug = generateSlug(updateData.title);
      }

      try {
        const updatedJob = await ctx.db.job.update({
          where: { id },
          data: updateData,
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true
              }
            }
          }
        });

        ctx.logger.info('Job updated successfully', {
          jobId: id,
          userId: ctx.user.id,
          updatedFields: Object.keys(updateData)
        });

        return updatedJob;
      } catch (error) {
        ctx.logger.error('Failed to update job', {
          jobId: id,
          userId: ctx.user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update job'
        });
      }
    }),

  publish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { id } = input;

      const job = await ctx.db.job.findFirst({
        where: {
          id,
          userId: ctx.user.id
        }
      });

      if (!job) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only publish jobs you own'
        });
      }

      if (job.status !== JobStatus.DRAFT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft jobs can be published'
        });
      }

      const updatedJob = await ctx.db.job.update({
        where: { id },
        data: {
          status: JobStatus.ACTIVE,
          publishedAt: new Date()
        }
      });

      ctx.logger.info('Job published successfully', {
        jobId: id,
        userId: ctx.user.id
      });

      return updatedJob;
    }),

  pause: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { id } = input;

      const updatedJob = await ctx.db.job.updateMany({
        where: {
          id,
          userId: ctx.user.id,
          status: JobStatus.ACTIVE
        },
        data: {
          status: JobStatus.PAUSED
        }
      });

      if (updatedJob.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active job not found or you do not have permission'
        });
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { id } = input;

      const updatedJob = await ctx.db.job.updateMany({
        where: {
          id,
          userId: ctx.user.id
        },
        data: {
          deletedAt: new Date()
        }
      });

      if (updatedJob.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found or you do not have permission'
        });
      }

      ctx.logger.info('Job deleted successfully', {
        jobId: id,
        userId: ctx.user.id
      });

      return { success: true };
    }),

  search: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      filters: jobFiltersSchema.optional(),
      pagination: paginationSchema.optional()
    }))
    .query(async ({ input, ctx }) => {
      const { query, filters = {}, pagination = {} } = input;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      // Full-text search using PostgreSQL
      const jobs = await ctx.db.$queryRaw`
        SELECT j.*, c.name as company_name, c.logo as company_logo
        FROM "Job" j
        JOIN "Company" c ON j."companyId" = c.id
        WHERE j.status = 'ACTIVE'
          AND j."expiresAt" > NOW()
          AND j."deletedAt" IS NULL
          AND (
            to_tsvector('english', j.title || ' ' || j.description || ' ' || j.location) 
            @@ plainto_tsquery('english', ${query})
          )
        ORDER BY 
          ts_rank(to_tsvector('english', j.title || ' ' || j.description), plainto_tsquery('english', ${query})) DESC,
          j."createdAt" DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;

      return {
        jobs,
        query,
        pagination: {
          page,
          limit
        }
      };
    })
});