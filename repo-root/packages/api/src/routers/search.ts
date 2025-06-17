import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { SearchService, searchJobsSchema } from '../services/search'

export const searchRouter = createTRPCRouter({
  jobs: publicProcedure
    .input(searchJobsSchema)
    .query(async ({ input, ctx }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.searchJobs(input)
    }),

  users: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      role: z.string().optional(),
      specialty: z.string().optional(),
      location: z.string().optional(),
      yearsExperienceMin: z.number().optional(),
      yearsExperienceMax: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(20)
    }))
    .query(async ({ input, ctx }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.searchUsers(input)
    }),

  suggestions: publicProcedure
    .input(z.object({
      query: z.string().min(2),
      type: z.enum(['jobs', 'users', 'all']).default('all')
    }))
    .query(async ({ input, ctx }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.getSuggestions(input.query, input.type)
    }),

  savedSearches: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.savedSearch.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    }),

  saveSearch: protectedProcedure
    .input(z.object({
      name: z.string(),
      query: z.string(),
      filters: z.record(z.any())
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.savedSearch.create({
        data: {
          ...input,
          userId: ctx.userId
        }
      })
    }),

  deleteSavedSearch: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.savedSearch.deleteMany({
        where: {
          id: input.id,
          userId: ctx.userId
        }
      })
    }),

  recentSearches: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.searchHistory.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        distinct: ['query']
      })
    }),

  logSearch: protectedProcedure
    .input(z.object({
      query: z.string(),
      type: z.enum(['jobs', 'users']),
      resultsCount: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.searchHistory.create({
        data: {
          ...input,
          userId: ctx.userId
        }
      })
    })
})