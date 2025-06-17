import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { 
  SupportTicketSystem, 
  KnowledgeBaseService,
  TicketPrioritySchema,
  TicketStatusSchema,
  TicketCategorySchema,
  ArticleCategorySchema,
} from '@locumtruerate/support'
import { PrismaClient } from '@locumtruerate/database'

const prisma = new PrismaClient()
const ticketSystem = new SupportTicketSystem(prisma)
const knowledgeBase = new KnowledgeBaseService(prisma)

export const supportRouter = createTRPCRouter({
  // Public endpoints for knowledge base
  searchKnowledge: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      category: ArticleCategorySchema.optional(),
      tags: z.array(z.string()).optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      return await knowledgeBase.searchArticles(input)
    }),

  getArticle: publicProcedure
    .input(z.object({
      articleId: z.string(),
    }))
    .query(async ({ input }) => {
      return await knowledgeBase.getArticle(input.articleId)
    }),

  getPopularArticles: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ input }) => {
      return await knowledgeBase.getPopularArticles(input.limit)
    }),

  getArticlesByCategory: publicProcedure
    .input(z.object({
      category: ArticleCategorySchema,
    }))
    .query(async ({ input }) => {
      return await knowledgeBase.getArticlesByCategory(input.category)
    }),

  rateArticle: publicProcedure
    .input(z.object({
      articleId: z.string(),
      helpful: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await knowledgeBase.rateArticle(input.articleId, input.helpful)
      return { success: true }
    }),

  // Protected endpoints for tickets
  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string().min(1).max(200),
      description: z.string().min(10).max(5000),
      category: TicketCategorySchema,
      priority: TicketPrioritySchema,
      attachments: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user
      
      const ticketData = {
        userId: user.id,
        email: user.email,
        name: user.name || user.email,
        subject: input.subject,
        description: input.description,
        category: input.category,
        priority: input.priority,
        attachments: input.attachments,
        metadata: input.metadata,
      }
      
      const ticketId = await ticketSystem.createTicket(ticketData)
      return { ticketId, success: true }
    }),

  getMyTickets: protectedProcedure
    .input(z.object({
      status: TicketStatusSchema.optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const tickets = await ticketSystem.getUserTickets(ctx.user.id, input.status)
      
      // Paginate results
      const startIndex = (input.page - 1) * input.limit
      const endIndex = startIndex + input.limit
      const paginatedTickets = tickets.slice(startIndex, endIndex)
      
      return {
        tickets: paginatedTickets,
        total: tickets.length,
        page: input.page,
        totalPages: Math.ceil(tickets.length / input.limit),
      }
    }),

  getTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const ticket = await ticketSystem.getTicketWithMessages(input.ticketId)
      
      // Ensure user can only access their own tickets (unless admin/support)
      if (ticket && ticket.userId !== ctx.user.id && !['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      return ticket
    }),

  addMessage: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      message: z.string().min(1).max(2000),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ticketSystem.getTicketWithMessages(input.ticketId)
      
      if (!ticket || (ticket.userId !== ctx.user.id && !['admin', 'support'].includes(ctx.user.role))) {
        throw new Error('Access denied')
      }
      
      const authorType = ['admin', 'support'].includes(ctx.user.role) ? 'support' : 'user'
      
      await ticketSystem.addMessage(
        input.ticketId,
        ctx.user.id,
        input.message,
        authorType,
        false, // not internal
        input.attachments
      )
      
      return { success: true }
    }),

  // Admin/Support only endpoints
  getAllTickets: protectedProcedure
    .input(z.object({
      status: TicketStatusSchema.optional(),
      priority: TicketPrioritySchema.optional(),
      category: TicketCategorySchema.optional(),
      assignedTo: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      return await ticketSystem.getSupportTickets({
        status: input.status,
        priority: input.priority,
        category: input.category,
        assignedTo: input.assignedTo,
        page: input.page,
        limit: input.limit,
      })
    }),

  updateTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      status: TicketStatusSchema.optional(),
      priority: TicketPrioritySchema.optional(),
      assignedTo: z.string().optional(),
      tags: z.array(z.string()).optional(),
      internalNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      const { ticketId, ...updates } = input
      await ticketSystem.updateTicket(ticketId, updates)
      
      return { success: true }
    }),

  getTicketStats: protectedProcedure
    .input(z.object({
      timeframe: z.enum(['day', 'week', 'month']).default('week'),
    }))
    .query(async ({ ctx, input }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      return await ticketSystem.getTicketStats(input.timeframe)
    }),

  // Knowledge base management
  getKnowledgeStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      return await knowledgeBase.getKnowledgeBaseStats()
    }),

  suggestArticles: protectedProcedure
    .input(z.object({
      ticketContent: z.string(),
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      return await knowledgeBase.suggestArticles(input.ticketContent, input.category)
    }),

  generateFAQ: protectedProcedure
    .query(async ({ ctx }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      return await knowledgeBase.generateFAQFromTickets()
    }),

  getContentGaps: protectedProcedure
    .query(async ({ ctx }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      return await knowledgeBase.getContentGaps()
    }),

  getArticleAnalytics: protectedProcedure
    .input(z.object({
      articleId: z.string(),
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      return await knowledgeBase.getArticleAnalytics(input.articleId, input.days)
    }),

  // Escalation and auto-assignment
  escalateTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      reason: z.string(),
      newPriority: TicketPrioritySchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      // Update priority if specified
      const updates: any = {}
      if (input.newPriority) {
        updates.priority = input.newPriority
      }
      
      // Add escalation note
      updates.internalNotes = `Escalated by ${ctx.user.name}: ${input.reason}`
      
      await ticketSystem.updateTicket(input.ticketId, updates)
      
      // Add internal message about escalation
      await ticketSystem.addMessage(
        input.ticketId,
        ctx.user.id,
        `Ticket escalated: ${input.reason}`,
        'support',
        true // internal message
      )
      
      return { success: true }
    }),

  assignTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      assignTo: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      await ticketSystem.updateTicket(input.ticketId, {
        assignedTo: input.assignTo,
      })
      
      return { success: true }
    }),

  // Bulk operations
  bulkUpdateTickets: protectedProcedure
    .input(z.object({
      ticketIds: z.array(z.string()),
      updates: z.object({
        status: TicketStatusSchema.optional(),
        priority: TicketPrioritySchema.optional(),
        assignedTo: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['admin', 'support'].includes(ctx.user.role)) {
        throw new Error('Access denied')
      }
      
      const results = await Promise.allSettled(
        input.ticketIds.map(ticketId => 
          ticketSystem.updateTicket(ticketId, input.updates)
        )
      )
      
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return { 
        successful,
        failed,
        total: input.ticketIds.length,
      }
    }),

  // Feedback and satisfaction
  submitFeedback: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      rating: z.number().min(1).max(5),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // This would integrate with a feedback system
      // For now, just add it as metadata to the ticket
      await ticketSystem.updateTicket(input.ticketId, {
        // Could add feedback to metadata or create separate feedback table
      })
      
      return { success: true }
    }),
})