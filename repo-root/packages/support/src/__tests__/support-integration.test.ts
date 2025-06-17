/**
 * Integration tests for support system functionality
 */

import { SupportTicketSystem, KnowledgeBaseService } from '../index'
import { PrismaClient } from '@locumtruerate/database'

describe('Support System Integration', () => {
  let ticketSystem: SupportTicketSystem
  let knowledgeBase: KnowledgeBaseService
  let mockPrisma: jest.Mocked<PrismaClient>

  beforeEach(() => {
    // Mock Prisma client
    mockPrisma = {
      supportTicket: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      supportMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      knowledgeArticle: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      knowledgeSearch: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      supportFeedback: {
        create: jest.fn(),
      },
    } as any

    ticketSystem = new SupportTicketSystem(mockPrisma)
    knowledgeBase = new KnowledgeBaseService(mockPrisma)
  })

  describe('Ticket System', () => {
    describe('createTicket', () => {
      it('should create a ticket with auto-generated ticket number', async () => {
        const mockTicket = {
          id: 'ticket-1',
          ticketNumber: 'LTR-123456-ABCD',
          userId: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          subject: 'Test ticket',
          description: 'Test description',
          category: 'technical',
          priority: 'medium',
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        mockPrisma.supportTicket.create.mockResolvedValue(mockTicket)

        const ticketData = {
          userId: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          subject: 'Test ticket',
          description: 'Test description',
          category: 'technical' as const,
          priority: 'medium' as const,
        }

        const ticketId = await ticketSystem.createTicket(ticketData)

        expect(ticketId).toBe('ticket-1')
        expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: 'user-1',
            email: 'test@example.com',
            subject: 'Test ticket',
            category: 'technical',
            priority: 'medium',
            status: 'open',
            ticketNumber: expect.stringMatching(/^LTR-\d{6}-[A-Z0-9]{4}$/),
          }),
        })
      })

      it('should handle ticket creation errors gracefully', async () => {
        mockPrisma.supportTicket.create.mockRejectedValue(new Error('Database error'))

        const ticketData = {
          userId: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          subject: 'Test ticket',
          description: 'Test description',
          category: 'technical' as const,
          priority: 'medium' as const,
        }

        await expect(ticketSystem.createTicket(ticketData)).rejects.toThrow('Failed to create support ticket')
      })
    })

    describe('addMessage', () => {
      it('should add message to ticket and update ticket status', async () => {
        mockPrisma.supportMessage.create.mockResolvedValue({
          id: 'message-1',
          ticketId: 'ticket-1',
          authorId: 'user-1',
          message: 'Test message',
          createdAt: new Date(),
        })

        mockPrisma.supportTicket.update.mockResolvedValue({} as any)

        await ticketSystem.addMessage('ticket-1', 'user-1', 'Test message', 'user')

        expect(mockPrisma.supportMessage.create).toHaveBeenCalledWith({
          data: {
            ticketId: 'ticket-1',
            authorId: 'user-1',
            authorType: 'user',
            message: 'Test message',
            attachments: [],
            isInternal: false,
            createdAt: expect.any(Date),
          },
        })

        expect(mockPrisma.supportTicket.update).toHaveBeenCalledWith({
          where: { id: 'ticket-1' },
          data: {
            updatedAt: expect.any(Date),
            status: 'open',
          },
        })
      })

      it('should set appropriate status based on author type', async () => {
        mockPrisma.supportMessage.create.mockResolvedValue({} as any)
        mockPrisma.supportTicket.update.mockResolvedValue({} as any)

        // Support message should set status to waiting_customer
        await ticketSystem.addMessage('ticket-1', 'support-1', 'Support response', 'support')

        expect(mockPrisma.supportTicket.update).toHaveBeenLastCalledWith({
          where: { id: 'ticket-1' },
          data: {
            updatedAt: expect.any(Date),
            status: 'waiting_customer',
          },
        })
      })
    })

    describe('getTicketStats', () => {
      it('should calculate comprehensive ticket statistics', async () => {
        const mockStats = {
          totalTickets: 100,
          openTickets: 15,
          resolvedTickets: 80,
          categoryBreakdown: [
            { category: 'technical', _count: { category: 40 } },
            { category: 'billing', _count: { category: 30 } },
          ],
          priorityBreakdown: [
            { priority: 'high', _count: { priority: 20 } },
            { priority: 'medium', _count: { priority: 60 } },
          ],
        }

        mockPrisma.supportTicket.count
          .mockResolvedValueOnce(100) // total
          .mockResolvedValueOnce(15)  // open
          .mockResolvedValueOnce(80)  // resolved

        mockPrisma.supportTicket.groupBy
          .mockResolvedValueOnce(mockStats.categoryBreakdown)
          .mockResolvedValueOnce(mockStats.priorityBreakdown)

        // Mock calculateAverageResponseTime (private method)
        const result = await ticketSystem.getTicketStats('week')

        expect(result).toEqual({
          timeframe: 'week',
          totalTickets: 100,
          openTickets: 15,
          resolvedTickets: 80,
          avgResponseTime: 24, // placeholder value from implementation
          categoryBreakdown: mockStats.categoryBreakdown,
          priorityBreakdown: mockStats.priorityBreakdown,
          resolutionRate: '80.0',
        })
      })
    })
  })

  describe('Knowledge Base', () => {
    describe('searchArticles', () => {
      it('should search articles with text matching and filters', async () => {
        const mockArticles = [
          {
            id: 'article-1',
            title: 'How to post a job',
            content: 'Step by step guide...',
            category: 'getting_started',
            helpful: 10,
            views: 100,
            published: true,
          },
          {
            id: 'article-2',
            title: 'Job posting troubleshooting',
            content: 'Common issues...',
            category: 'troubleshooting',
            helpful: 8,
            views: 75,
            published: true,
          },
        ]

        mockPrisma.knowledgeArticle.findMany.mockResolvedValue(mockArticles)
        mockPrisma.knowledgeSearch.create.mockResolvedValue({} as any)

        const searchQuery = {
          query: 'job posting',
          category: 'getting_started' as const,
          limit: 10,
        }

        const results = await knowledgeBase.searchArticles(searchQuery)

        expect(results).toEqual(mockArticles)
        expect(mockPrisma.knowledgeArticle.findMany).toHaveBeenCalledWith({
          where: {
            published: true,
            category: 'getting_started',
            OR: [
              { title: { contains: 'job posting', mode: 'insensitive' } },
              { content: { contains: 'job posting', mode: 'insensitive' } },
              { tags: { has: 'job posting' } },
            ],
          },
          orderBy: [
            { helpful: 'desc' },
            { views: 'desc' },
            { updatedAt: 'desc' },
          ],
          take: 10,
        })

        // Should log the search
        expect(mockPrisma.knowledgeSearch.create).toHaveBeenCalled()
      })

      it('should handle search errors gracefully', async () => {
        mockPrisma.knowledgeArticle.findMany.mockRejectedValue(new Error('Database error'))

        const searchQuery = {
          query: 'test',
        }

        const results = await knowledgeBase.searchArticles(searchQuery)

        expect(results).toEqual([])
      })
    })

    describe('getArticle', () => {
      it('should retrieve article and increment view count', async () => {
        const mockArticle = {
          id: 'article-1',
          title: 'Test Article',
          content: 'Article content',
          views: 10,
          published: true,
        }

        mockPrisma.knowledgeArticle.findUnique.mockResolvedValue(mockArticle)
        mockPrisma.knowledgeArticle.update.mockResolvedValue({} as any)

        const result = await knowledgeBase.getArticle('article-1')

        expect(result).toEqual(mockArticle)
        expect(mockPrisma.knowledgeArticle.update).toHaveBeenCalledWith({
          where: { id: 'article-1' },
          data: { views: { increment: 1 } },
        })
      })

      it('should return null for non-existent article', async () => {
        mockPrisma.knowledgeArticle.findUnique.mockResolvedValue(null)

        const result = await knowledgeBase.getArticle('non-existent')

        expect(result).toBeNull()
        expect(mockPrisma.knowledgeArticle.update).not.toHaveBeenCalled()
      })
    })

    describe('rateArticle', () => {
      it('should increment helpful count for positive rating', async () => {
        mockPrisma.knowledgeArticle.update.mockResolvedValue({} as any)

        await knowledgeBase.rateArticle('article-1', true)

        expect(mockPrisma.knowledgeArticle.update).toHaveBeenCalledWith({
          where: { id: 'article-1' },
          data: { helpful: { increment: 1 } },
        })
      })

      it('should increment notHelpful count for negative rating', async () => {
        mockPrisma.knowledgeArticle.update.mockResolvedValue({} as any)

        await knowledgeBase.rateArticle('article-1', false)

        expect(mockPrisma.knowledgeArticle.update).toHaveBeenCalledWith({
          where: { id: 'article-1' },
          data: { notHelpful: { increment: 1 } },
        })
      })
    })

    describe('suggestArticles', () => {
      it('should extract keywords and suggest relevant articles', async () => {
        const mockArticles = [
          {
            id: 'article-1',
            title: 'Billing FAQ',
            content: 'Common billing questions...',
            category: 'billing',
          },
        ]

        mockPrisma.knowledgeArticle.findMany.mockResolvedValue(mockArticles)
        mockPrisma.knowledgeSearch.create.mockResolvedValue({} as any)

        const suggestions = await knowledgeBase.suggestArticles(
          'I have a question about my billing and payment method',
          'billing'
        )

        expect(suggestions).toEqual(mockArticles)
        expect(mockPrisma.knowledgeArticle.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              category: 'billing',
            }),
            take: 5,
          })
        )
      })
    })

    describe('generateFAQFromTickets', () => {
      it('should analyze resolved tickets to suggest FAQ topics', async () => {
        const mockTicketPatterns = [
          {
            category: 'billing',
            subject: 'How to update payment method',
            _count: { category: 15 },
          },
          {
            category: 'technical',
            subject: 'Job posting not showing',
            _count: { category: 12 },
          },
        ]

        mockPrisma.supportTicket.groupBy.mockResolvedValue(mockTicketPatterns)

        const faqSuggestions = await knowledgeBase.generateFAQFromTickets()

        expect(faqSuggestions).toHaveLength(2)
        expect(faqSuggestions[0]).toEqual({
          question: 'How to update payment method',
          category: 'billing',
          frequency: 15,
          suggested: true,
          needsArticle: true,
        })
      })
    })
  })

  describe('Integration Scenarios', () => {
    it('should create ticket and suggest relevant knowledge articles', async () => {
      // Create a billing-related ticket
      const mockTicket = {
        id: 'ticket-1',
        ticketNumber: 'LTR-123456-ABCD',
        category: 'billing',
        description: 'I need help updating my payment method',
      }

      mockPrisma.supportTicket.create.mockResolvedValue(mockTicket)

      // Mock knowledge base suggestions
      const mockSuggestions = [
        {
          id: 'article-1',
          title: 'How to Update Your Payment Method',
          category: 'billing',
        },
      ]

      mockPrisma.knowledgeArticle.findMany.mockResolvedValue(mockSuggestions)
      mockPrisma.knowledgeSearch.create.mockResolvedValue({} as any)

      // Create ticket
      const ticketId = await ticketSystem.createTicket({
        userId: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        subject: 'Payment method update',
        description: 'I need help updating my payment method',
        category: 'billing',
        priority: 'medium',
      })

      // Get suggestions based on ticket content
      const suggestions = await knowledgeBase.suggestArticles(
        'I need help updating my payment method',
        'billing'
      )

      expect(ticketId).toBe('ticket-1')
      expect(suggestions).toEqual(mockSuggestions)
    })

    it('should track support metrics across systems', async () => {
      // Mock ticket stats
      mockPrisma.supportTicket.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(5)  // open
        .mockResolvedValueOnce(40) // resolved

      mockPrisma.supportTicket.groupBy.mockResolvedValue([
        { category: 'billing', _count: { category: 20 } },
        { category: 'technical', _count: { category: 30 } },
      ])

      // Mock knowledge base stats
      mockPrisma.knowledgeArticle.count
        .mockResolvedValueOnce(25) // total articles
        .mockResolvedValueOnce(20) // published

      mockPrisma.knowledgeArticle.aggregate.mockResolvedValue({
        _sum: { views: 1500, helpful: 80, notHelpful: 10 },
      })

      mockPrisma.knowledgeArticle.groupBy.mockResolvedValue([
        { category: 'billing', _count: { category: 8 }, _sum: { views: 600 } },
        { category: 'technical', _count: { category: 12 }, _sum: { views: 900 } },
      ])

      mockPrisma.knowledgeArticle.findMany.mockResolvedValue([])
      mockPrisma.knowledgeSearch.findMany.mockResolvedValue([])

      const [ticketStats, kbStats] = await Promise.all([
        ticketSystem.getTicketStats('week'),
        knowledgeBase.getKnowledgeBaseStats(),
      ])

      expect(ticketStats.totalTickets).toBe(50)
      expect(ticketStats.resolutionRate).toBe('80.0')
      expect(kbStats.totalArticles).toBe(25)
      expect(kbStats.publishedArticles).toBe(20)
      expect(kbStats.totalViews).toBe(1500)
    })
  })
})