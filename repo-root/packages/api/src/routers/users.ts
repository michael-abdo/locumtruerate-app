import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'

export const usersRouter = createTRPCRouter({
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        include: {
          profile: true,
          applications: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      return user
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      role: z.string().optional(),
      specialty: z.string().optional(),
      yearsExperience: z.number().optional(),
      location: z.string().optional(),
      preferences: z.object({
        desiredLocations: z.array(z.string()).optional(),
        salaryExpectation: z.string().optional(),
        availability: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { preferences, ...userData } = input

      // Update user data
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.userId },
        data: {
          ...userData,
          profile: {
            upsert: {
              create: {
                preferences: preferences || {}
              },
              update: {
                preferences: preferences || {}
              }
            }
          }
        },
        include: {
          profile: true
        }
      })

      return updatedUser
    }),

  getPublicProfile: publicProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          specialty: true,
          yearsExperience: true,
          location: true,
          createdAt: true,
          profile: {
            select: {
              bio: true,
              avatar: true,
              verified: true
            }
          }
        }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      return user
    }),

  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      role: z.string().optional(),
      specialty: z.string().optional(),
      location: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20)
    }))
    .query(async ({ input, ctx }) => {
      const { query, role, specialty, location, page, limit } = input
      const skip = (page - 1) * limit

      const where: any = {}

      if (query) {
        where.OR = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      }

      if (role) where.role = role
      if (specialty) where.specialty = specialty
      if (location) where.location = { contains: location, mode: 'insensitive' }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            specialty: true,
            location: true,
            yearsExperience: true,
            createdAt: true,
            profile: {
              select: {
                avatar: true,
                verified: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        ctx.db.user.count({ where })
      ])

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + users.length < total
      }
    }),

  deleteProfile: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Soft delete - mark as deleted but keep data
      await ctx.db.user.update({
        where: { id: ctx.userId },
        data: {
          deletedAt: new Date(),
          email: `deleted_${ctx.userId}@deleted.com`, // Prevent email conflicts
          status: 'DELETED'
        }
      })

      return { success: true }
    })
})