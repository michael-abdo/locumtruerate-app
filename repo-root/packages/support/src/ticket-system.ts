/**
 * Support ticket system for managing customer issues
 */

import { z } from 'zod';
import { logger } from '@locumtruerate/shared';
import { PrismaClient } from '@locumtruerate/database';

export const TicketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const TicketStatusSchema = z.enum(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']);
export const TicketCategorySchema = z.enum([
  'billing',
  'technical',
  'account',
  'job_posting',
  'application',
  'payment',
  'feature_request',
  'bug_report',
  'other'
]);

export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

export interface CreateTicketData {
  userId: string;
  email: string;
  name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  tags?: string[];
  internalNotes?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorType: 'user' | 'support';
  message: string;
  attachments?: string[];
  isInternal: boolean;
  createdAt: Date;
}

export class SupportTicketSystem {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  // Create new support ticket
  async createTicket(data: CreateTicketData): Promise<string> {
    try {
      const ticketNumber = this.generateTicketNumber();
      
      const ticket = await this.prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId: data.userId,
          email: data.email,
          name: data.name,
          subject: data.subject,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: 'open',
          attachments: data.attachments || [],
          metadata: data.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      // Log ticket creation
      logger.info('Support ticket created', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        userId: data.userId,
        category: data.category,
        priority: data.priority,
      });
      
      // Auto-assign based on category
      await this.autoAssignTicket(ticket.id, data.category);
      
      // Send confirmation email to user
      await this.sendTicketConfirmation(ticket.id);
      
      return ticket.id;
    } catch (error) {
      logger.error('Failed to create support ticket', error instanceof Error ? error : new Error(String(error)), { userId: data.userId });
      throw new Error('Failed to create support ticket');
    }
  }
  
  // Update ticket status and details
  async updateTicket(ticketId: string, updates: UpdateTicketData): Promise<void> {
    try {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
      
      logger.info('Support ticket updated', {
        ticketId,
        updates,
      });
      
      // Send notification if status changed
      if (updates.status) {
        await this.sendStatusUpdateNotification(ticketId, updates.status);
      }
    } catch (error) {
      logger.error('Failed to update support ticket', error instanceof Error ? error : new Error(String(error)), { ticketId });
      throw new Error('Failed to update ticket');
    }
  }
  
  // Add message to ticket thread
  async addMessage(
    ticketId: string, 
    authorId: string, 
    message: string, 
    authorType: 'user' | 'support' = 'user',
    isInternal: boolean = false,
    attachments?: string[]
  ): Promise<void> {
    try {
      await this.prisma.supportMessage.create({
        data: {
          ticketId,
          authorId,
          authorType,
          message,
          attachments: attachments || [],
          isInternal,
          createdAt: new Date(),
        },
      });
      
      // Update ticket's last activity
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          updatedAt: new Date(),
          status: authorType === 'user' ? 'open' : 'waiting_customer',
        },
      });
      
      logger.info('Message added to support ticket', {
        ticketId,
        authorId,
        authorType,
        isInternal,
      });
      
      // Send notification to other party
      if (!isInternal) {
        await this.sendNewMessageNotification(ticketId, authorType);
      }
    } catch (error) {
      logger.error('Failed to add message to ticket', error instanceof Error ? error : new Error(String(error)), { ticketId });
      throw new Error('Failed to add message');
    }
  }
  
  // Get ticket with full thread
  async getTicketWithMessages(ticketId: string): Promise<any> {
    try {
      return await this.prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            where: { isInternal: false }, // Only show non-internal messages to users
          },
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get ticket with messages', error instanceof Error ? error : new Error(String(error)), { ticketId });
      return null;
    }
  }
  
  // Get user's tickets
  async getUserTickets(userId: string, status?: TicketStatus): Promise<any[]> {
    try {
      const where: any = { userId };
      if (status) {
        where.status = status;
      }
      
      return await this.prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      logger.error('Failed to get user tickets', error instanceof Error ? error : new Error(String(error)), { userId });
      return [];
    }
  }
  
  // Get tickets for support team
  async getSupportTickets(filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: any[]; total: number }> {
    try {
      const where: any = {};
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;
      
      if (filters?.status) where.status = filters.status;
      if (filters?.priority) where.priority = filters.priority;
      if (filters?.category) where.category = filters.category;
      if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
      
      const [tickets, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
            _count: {
              select: { messages: true },
            },
          },
        }),
        this.prisma.supportTicket.count({ where }),
      ]);
      
      return { tickets, total };
    } catch (error) {
      logger.error('Failed to get support tickets', error instanceof Error ? error : new Error(String(error)));
      return { tickets: [], total: 0 };
    }
  }
  
  // Generate ticket statistics
  async getTicketStats(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      const [
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResponseTime,
        categoryBreakdown,
        priorityBreakdown,
      ] = await Promise.all([
        this.prisma.supportTicket.count({
          where: { createdAt: { gte: startDate } },
        }),
        this.prisma.supportTicket.count({
          where: { 
            createdAt: { gte: startDate },
            status: { in: ['open', 'in_progress'] },
          },
        }),
        this.prisma.supportTicket.count({
          where: { 
            createdAt: { gte: startDate },
            status: { in: ['resolved', 'closed'] },
          },
        }),
        this.calculateAverageResponseTime(startDate),
        this.prisma.supportTicket.groupBy({
          by: ['category'],
          where: { createdAt: { gte: startDate } },
          _count: { category: true },
        }),
        this.prisma.supportTicket.groupBy({
          by: ['priority'],
          where: { createdAt: { gte: startDate } },
          _count: { priority: true },
        }),
      ]);
      
      return {
        timeframe,
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResponseTime,
        categoryBreakdown,
        priorityBreakdown,
        resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets * 100).toFixed(1) : '0',
      };
    } catch (error) {
      logger.error('Failed to get ticket stats', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }
  
  // Private helper methods
  private generateTicketNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LTR-${timestamp}-${random}`;
  }
  
  private async autoAssignTicket(ticketId: string, category: TicketCategory): Promise<void> {
    // Simple round-robin assignment based on category
    const assignmentMap: Record<TicketCategory, string[]> = {
      billing: ['billing-support-1', 'billing-support-2'],
      technical: ['tech-support-1', 'tech-support-2'],
      account: ['account-support-1'],
      job_posting: ['job-support-1'],
      application: ['job-support-1'],
      payment: ['billing-support-1'],
      feature_request: ['product-manager-1'],
      bug_report: ['tech-support-1'],
      other: ['general-support-1'],
    };
    
    const agents = assignmentMap[category] || ['general-support-1'];
    const assignedTo = agents[Math.floor(Math.random() * agents.length)];
    
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedTo },
    });
  }
  
  private async calculateAverageResponseTime(startDate: Date): Promise<number> {
    // This would calculate average time between ticket creation and first response
    // For now, return a placeholder
    return 24; // 24 hours
  }
  
  private async sendTicketConfirmation(ticketId: string): Promise<void> {
    // Would integrate with email service to send confirmation
    logger.info('Ticket confirmation sent', { ticketId });
  }
  
  private async sendStatusUpdateNotification(ticketId: string, status: TicketStatus): Promise<void> {
    // Would integrate with email service to send status updates
    logger.info('Status update notification sent', { ticketId, status });
  }
  
  private async sendNewMessageNotification(ticketId: string, authorType: 'user' | 'support'): Promise<void> {
    // Would integrate with email service to notify about new messages
    logger.info('New message notification sent', { ticketId, authorType });
  }
}