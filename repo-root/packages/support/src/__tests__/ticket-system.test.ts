/**
 * Tests for support ticket system
 */

import { SupportTicketSystem, CreateTicketData, UpdateTicketData } from '../ticket-system';

// Mock dependencies
const mockPrisma = {
  supportTicket: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  supportMessage: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@locumtruerate/shared', () => ({
  logger: mockLogger,
}));

describe('SupportTicketSystem', () => {
  let ticketSystem: SupportTicketSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    ticketSystem = new SupportTicketSystem(mockPrisma as any);
  });

  describe('createTicket', () => {
    const validTicketData: CreateTicketData = {
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      subject: 'Test Issue',
      description: 'This is a test issue',
      category: 'technical',
      priority: 'medium',
    };

    it('should create a ticket successfully', async () => {
      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'LTR-123456-ABC',
        ...validTicketData,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.supportTicket.create.mockResolvedValue(mockTicket);

      const ticketId = await ticketSystem.createTicket(validTicketData);

      expect(ticketId).toBe('ticket-123');
      expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: validTicketData.userId,
          email: validTicketData.email,
          subject: validTicketData.subject,
          category: validTicketData.category,
          priority: validTicketData.priority,
          status: 'open',
          ticketNumber: expect.stringMatching(/^LTR-\d+-[A-Z]+$/),
        }),
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Support ticket created',
        expect.objectContaining({
          ticketId: 'ticket-123',
          userId: validTicketData.userId,
        })
      );
    });

    it('should handle attachments and metadata', async () => {
      const ticketDataWithExtras: CreateTicketData = {
        ...validTicketData,
        attachments: ['file1.pdf', 'file2.jpg'],
        metadata: { browser: 'Chrome', version: '91.0' },
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'LTR-123456-ABC',
      };

      mockPrisma.supportTicket.create.mockResolvedValue(mockTicket);

      await ticketSystem.createTicket(ticketDataWithExtras);

      expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          attachments: ['file1.pdf', 'file2.jpg'],
          metadata: { browser: 'Chrome', version: '91.0' },
        }),
      });
    });

    it('should handle creation errors', async () => {
      mockPrisma.supportTicket.create.mockRejectedValue(new Error('Database error'));

      await expect(ticketSystem.createTicket(validTicketData)).rejects.toThrow(
        'Failed to create support ticket'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create support ticket',
        expect.any(Error),
        { userId: validTicketData.userId }
      );
    });
  });

  describe('updateTicket', () => {
    const ticketId = 'ticket-123';

    it('should update ticket successfully', async () => {
      const updates: UpdateTicketData = {
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'agent-456',
        tags: ['bug', 'urgent'],
      };

      mockPrisma.supportTicket.update.mockResolvedValue({});

      await ticketSystem.updateTicket(ticketId, updates);

      expect(mockPrisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: ticketId },
        data: expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Date),
        }),
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Support ticket updated',
        { ticketId, updates }
      );
    });

    it('should handle update errors', async () => {
      mockPrisma.supportTicket.update.mockRejectedValue(new Error('Database error'));

      await expect(ticketSystem.updateTicket(ticketId, { status: 'resolved' }))
        .rejects.toThrow('Failed to update ticket');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update support ticket',
        expect.any(Error),
        { ticketId }
      );
    });
  });

  describe('addMessage', () => {
    const ticketId = 'ticket-123';
    const authorId = 'user-123';
    const message = 'This is a test message';

    it('should add message successfully', async () => {
      mockPrisma.supportMessage.create.mockResolvedValue({});
      mockPrisma.supportTicket.update.mockResolvedValue({});

      await ticketSystem.addMessage(ticketId, authorId, message);

      expect(mockPrisma.supportMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId,
          authorId,
          message,
          authorType: 'user',
          isInternal: false,
          attachments: [],
        }),
      });

      expect(mockPrisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: ticketId },
        data: expect.objectContaining({
          updatedAt: expect.any(Date),
          status: 'open',
        }),
      });
    });

    it('should handle support agent messages', async () => {
      mockPrisma.supportMessage.create.mockResolvedValue({});
      mockPrisma.supportTicket.update.mockResolvedValue({});

      await ticketSystem.addMessage(
        ticketId,
        authorId,
        message,
        'support',
        false,
        ['attachment.pdf']
      );

      expect(mockPrisma.supportMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          authorType: 'support',
          attachments: ['attachment.pdf'],
        }),
      });

      expect(mockPrisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: ticketId },
        data: expect.objectContaining({
          status: 'waiting_customer',
        }),
      });
    });

    it('should handle internal messages', async () => {
      mockPrisma.supportMessage.create.mockResolvedValue({});
      mockPrisma.supportTicket.update.mockResolvedValue({});

      await ticketSystem.addMessage(ticketId, authorId, message, 'support', true);

      expect(mockPrisma.supportMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isInternal: true,
        }),
      });
    });

    it('should handle message creation errors', async () => {
      mockPrisma.supportMessage.create.mockRejectedValue(new Error('Database error'));

      await expect(ticketSystem.addMessage(ticketId, authorId, message))
        .rejects.toThrow('Failed to add message');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to add message to ticket',
        expect.any(Error),
        { ticketId }
      );
    });
  });

  describe('getTicketWithMessages', () => {
    const ticketId = 'ticket-123';

    it('should retrieve ticket with messages', async () => {
      const mockTicketWithMessages = {
        id: ticketId,
        subject: 'Test Issue',
        messages: [
          { id: 'msg-1', message: 'Initial message', isInternal: false },
          { id: 'msg-2', message: 'Response', isInternal: false },
        ],
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      };

      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicketWithMessages);

      const result = await ticketSystem.getTicketWithMessages(ticketId);

      expect(result).toEqual(mockTicketWithMessages);
      expect(mockPrisma.supportTicket.findUnique).toHaveBeenCalledWith({
        where: { id: ticketId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            where: { isInternal: false },
          },
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });
    });

    it('should return null for non-existent ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);

      const result = await ticketSystem.getTicketWithMessages('non-existent');

      expect(result).toBeNull();
    });

    it('should handle retrieval errors', async () => {
      mockPrisma.supportTicket.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await ticketSystem.getTicketWithMessages(ticketId);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get ticket with messages',
        expect.any(Error),
        { ticketId }
      );
    });
  });

  describe('getUserTickets', () => {
    const userId = 'user-123';

    it('should retrieve user tickets', async () => {
      const mockTickets = [
        { id: 'ticket-1', subject: 'Issue 1', status: 'open' },
        { id: 'ticket-2', subject: 'Issue 2', status: 'resolved' },
      ];

      mockPrisma.supportTicket.findMany.mockResolvedValue(mockTickets);

      const result = await ticketSystem.getUserTickets(userId);

      expect(result).toEqual(mockTickets);
      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: expect.objectContaining({
          id: true,
          ticketNumber: true,
          subject: true,
        }),
      });
    });

    it('should filter by status when provided', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([]);

      await ticketSystem.getUserTickets(userId, 'open');

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith({
        where: { userId, status: 'open' },
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should handle retrieval errors', async () => {
      mockPrisma.supportTicket.findMany.mockRejectedValue(new Error('Database error'));

      const result = await ticketSystem.getUserTickets(userId);

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get user tickets',
        expect.any(Error),
        { userId }
      );
    });
  });

  describe('getSupportTickets', () => {
    it('should retrieve support tickets with filters', async () => {
      const mockTickets = [
        { id: 'ticket-1', subject: 'Issue 1' },
        { id: 'ticket-2', subject: 'Issue 2' },
      ];

      mockPrisma.supportTicket.findMany.mockResolvedValue(mockTickets);
      mockPrisma.supportTicket.count.mockResolvedValue(25);

      const filters = {
        status: 'open' as const,
        priority: 'high' as const,
        page: 1,
        limit: 10,
      };

      const result = await ticketSystem.getSupportTickets(filters);

      expect(result).toEqual({
        tickets: mockTickets,
        total: 25,
      });

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith({
        where: { status: 'open', priority: 'high' },
        skip: 0,
        take: 10,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: expect.any(Object),
      });
    });

    it('should handle default pagination', async () => {
      mockPrisma.supportTicket.findMany.mockResolvedValue([]);
      mockPrisma.supportTicket.count.mockResolvedValue(0);

      await ticketSystem.getSupportTickets();

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        })
      );
    });

    it('should handle retrieval errors', async () => {
      mockPrisma.supportTicket.findMany.mockRejectedValue(new Error('Database error'));

      const result = await ticketSystem.getSupportTickets();

      expect(result).toEqual({ tickets: [], total: 0 });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get support tickets',
        expect.any(Error)
      );
    });
  });

  describe('getTicketStats', () => {
    it('should generate ticket statistics', async () => {
      mockPrisma.supportTicket.count
        .mockResolvedValueOnce(10) // total tickets
        .mockResolvedValueOnce(5)  // open tickets
        .mockResolvedValueOnce(3); // resolved tickets

      mockPrisma.supportTicket.groupBy
        .mockResolvedValueOnce([
          { category: 'technical', _count: { category: 5 } },
          { category: 'billing', _count: { category: 3 } },
        ])
        .mockResolvedValueOnce([
          { priority: 'high', _count: { priority: 2 } },
          { priority: 'medium', _count: { priority: 6 } },
        ]);

      const result = await ticketSystem.getTicketStats('week');

      expect(result).toEqual(expect.objectContaining({
        timeframe: 'week',
        totalTickets: 10,
        openTickets: 5,
        resolvedTickets: 3,
        avgResponseTime: 24,
        categoryBreakdown: expect.any(Array),
        priorityBreakdown: expect.any(Array),
        resolutionRate: '30.0',
      }));
    });

    it('should handle different timeframes', async () => {
      mockPrisma.supportTicket.count.mockResolvedValue(0);
      mockPrisma.supportTicket.groupBy.mockResolvedValue([]);

      await ticketSystem.getTicketStats('month');

      // Should calculate date range for month
      expect(mockPrisma.supportTicket.count).toHaveBeenCalledWith({
        where: { createdAt: { gte: expect.any(Date) } },
      });
    });

    it('should handle stats calculation errors', async () => {
      mockPrisma.supportTicket.count.mockRejectedValue(new Error('Database error'));

      const result = await ticketSystem.getTicketStats();

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get ticket stats',
        expect.any(Error)
      );
    });
  });

  describe('Ticket Number Generation', () => {
    it('should generate unique ticket numbers', async () => {
      const mockTicket1 = { id: 'ticket-1', ticketNumber: 'LTR-123456-ABC' };
      const mockTicket2 = { id: 'ticket-2', ticketNumber: 'LTR-123457-DEF' };

      mockPrisma.supportTicket.create
        .mockResolvedValueOnce(mockTicket1)
        .mockResolvedValueOnce(mockTicket2);

      const validTicketData: CreateTicketData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subject: 'Test Issue',
        description: 'This is a test issue',
        category: 'technical',
        priority: 'medium',
      };

      const ticketId1 = await ticketSystem.createTicket(validTicketData);
      const ticketId2 = await ticketSystem.createTicket(validTicketData);

      expect(ticketId1).toBe('ticket-1');
      expect(ticketId2).toBe('ticket-2');

      // Verify ticket numbers follow the pattern
      const calls = mockPrisma.supportTicket.create.mock.calls;
      expect(calls[0][0].data.ticketNumber).toMatch(/^LTR-\d+-[A-Z]+$/);
      expect(calls[1][0].data.ticketNumber).toMatch(/^LTR-\d+-[A-Z]+$/);
      expect(calls[0][0].data.ticketNumber).not.toBe(calls[1][0].data.ticketNumber);
    });
  });
});