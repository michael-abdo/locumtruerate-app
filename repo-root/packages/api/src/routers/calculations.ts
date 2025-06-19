import { z } from 'zod'
import { createTRPCRouter, privateProcedure, publicProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { v4 as uuidv4 } from 'uuid'

// Schemas
const CalculationTypeSchema = z.enum(['contract', 'paycheck', 'comparison'])

const SaveCalculationSchema = z.object({
  userId: z.string(),
  type: CalculationTypeSchema,
  input: z.any(), // Contract/Paycheck input
  result: z.any(), // Calculation result
  name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
})

const UpdateCalculationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
})

const ShareCalculationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresInDays: z.number().optional(),
  isPublic: z.boolean().optional()
})

export const calculationsRouter = createTRPCRouter({
  // Save a new calculation
  save: privateProcedure
    .input(SaveCalculationSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this calculation
      if (input.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only save your own calculations'
        })
      }

      const calculation = await ctx.db.savedCalculation.create({
        data: {
          id: uuidv4(),
          userId: input.userId,
          type: input.type,
          input: input.input,
          result: input.result,
          name: input.name,
          tags: input.tags || [],
          isFavorite: input.isFavorite || false,
          isPublic: input.isPublic || false,
          metadata: input.metadata || {},
          timestamp: new Date()
        }
      })

      return calculation
    }),

  // Update an existing calculation
  update: privateProcedure
    .input(UpdateCalculationSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this calculation
      const existing = await ctx.db.savedCalculation.findUnique({
        where: { id: input.id }
      })

      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Calculation not found or you do not have permission to update it'
        })
      }

      const updated = await ctx.db.savedCalculation.update({
        where: { id: input.id },
        data: {
          name: input.name,
          tags: input.tags,
          isFavorite: input.isFavorite,
          isPublic: input.isPublic,
          metadata: input.metadata,
          updatedAt: new Date()
        }
      })

      return updated
    }),

  // Delete a calculation
  delete: privateProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this calculation
      const existing = await ctx.db.savedCalculation.findUnique({
        where: { id: input.id }
      })

      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Calculation not found or you do not have permission to delete it'
        })
      }

      await ctx.db.savedCalculation.delete({
        where: { id: input.id }
      })

      return { success: true }
    }),

  // Get user's calculations
  getUserCalculations: privateProcedure
    .input(z.object({
      userId: z.string(),
      type: CalculationTypeSchema.optional(),
      isFavorite: z.boolean().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0)
    }))
    .query(async ({ ctx, input }) => {
      // Verify user is requesting their own calculations
      if (input.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view your own calculations'
        })
      }

      const where: any = {
        userId: input.userId
      }

      if (input.type) {
        where.type = input.type
      }

      if (input.isFavorite !== undefined) {
        where.isFavorite = input.isFavorite
      }

      const calculations = await ctx.db.savedCalculation.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: input.limit,
        skip: input.offset
      })

      return calculations
    }),

  // Get a single calculation
  getCalculation: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const calculation = await ctx.db.savedCalculation.findUnique({
        where: { id: input.id }
      })

      if (!calculation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Calculation not found'
        })
      }

      // Check if calculation is public or user owns it
      if (!calculation.isPublic && calculation.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this calculation'
        })
      }

      return calculation
    }),

  // Share a calculation
  share: privateProcedure
    .input(ShareCalculationSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this calculation
      const existing = await ctx.db.savedCalculation.findUnique({
        where: { id: input.id }
      })

      if (!existing || existing.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Calculation not found or you do not have permission to share it'
        })
      }

      // Generate shareable link
      const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL}/share/${input.id}`
      
      // Calculate expiration date
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null

      // Update calculation with sharing info
      const updated = await ctx.db.savedCalculation.update({
        where: { id: input.id },
        data: {
          isPublic: input.isPublic || false,
          shareableLink,
          expiresAt,
          metadata: {
            ...existing.metadata,
            sharedAt: new Date().toISOString()
          }
        }
      })

      return {
        ...updated,
        shareableLink
      }
    }),

  // Get calculation statistics for a user
  getStats: privateProcedure
    .input(z.object({
      userId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Verify user is requesting their own stats
      if (input.userId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view your own statistics'
        })
      }

      const where: any = {
        userId: input.userId
      }

      if (input.startDate || input.endDate) {
        where.timestamp = {}
        if (input.startDate) {
          where.timestamp.gte = input.startDate
        }
        if (input.endDate) {
          where.timestamp.lte = input.endDate
        }
      }

      // Get counts by type
      const [total, byType, favorites] = await Promise.all([
        ctx.db.savedCalculation.count({ where }),
        ctx.db.savedCalculation.groupBy({
          by: ['type'],
          where,
          _count: true
        }),
        ctx.db.savedCalculation.count({
          where: {
            ...where,
            isFavorite: true
          }
        })
      ])

      // Get most recent calculation
      const mostRecent = await ctx.db.savedCalculation.findFirst({
        where,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          type: true,
          name: true,
          timestamp: true
        }
      })

      return {
        total,
        byType: byType.reduce((acc, item) => ({
          ...acc,
          [item.type]: item._count
        }), {
          contract: 0,
          paycheck: 0,
          comparison: 0
        }),
        favorites,
        mostRecent
      }
    })
})