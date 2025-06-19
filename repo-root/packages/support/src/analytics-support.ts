/**
 * Analytics and reporting tools for customer support
 */

import { logger } from '@locumtruerate/shared';
import { PrismaClient } from '@locumtruerate/database';

export interface MetricQuery {
  metric: string;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  startDate?: Date;
  endDate?: Date;
  filters?: Record<string, any>;
}

export interface DashboardMetrics {
  users: {
    total: number;
    new: number;
    active: number;
    suspended: number;
  };
  jobs: {
    total: number;
    active: number;
    expired: number;
    filled: number;
  };
  applications: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  revenue: {
    total: number;
    monthly: number;
    failed: number;
    refunded: number;
  };
  support: {
    openTickets: number;
    avgResponseTime: number;
    satisfactionScore: number;
  };
}

export class AnalyticsSupportService {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  // Get comprehensive dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const [
        totalUsers,
        newUsers,
        activeUsers,
        suspendedUsers,
        totalJobs,
        activeJobs,
        expiredJobs,
        filledJobs,
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        totalRevenue,
        monthlyRevenue,
        failedPayments,
        refundedPayments,
        openTickets,
        avgResponseTime,
        satisfactionScore,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
        this.prisma.user.count({ 
          where: { 
            lastLoginAt: { gte: dayStart },
            accountDeleted: false,
          } 
        }),
        this.prisma.user.count({ where: { accountLocked: true } }),
        this.prisma.job.count(),
        this.prisma.job.count({ where: { status: 'active' } }),
        this.prisma.job.count({ where: { status: 'expired' } }),
        this.prisma.job.count({ where: { status: 'filled' } }),
        this.prisma.application.count(),
        this.prisma.application.count({ where: { status: 'pending' } }),
        this.prisma.application.count({ where: { status: 'accepted' } }),
        this.prisma.application.count({ where: { status: 'rejected' } }),
        this.calculateTotalRevenue(),
        this.calculateMonthlyRevenue(monthStart),
        this.calculateFailedPayments(),
        this.calculateRefundedPayments(),
        this.prisma.supportTicket.count({ 
          where: { status: { in: ['open', 'in_progress'] } } 
        }),
        this.calculateAverageResponseTime(),
        this.calculateSatisfactionScore(),
      ]);
      
      return {
        users: { total: totalUsers, new: newUsers, active: activeUsers, suspended: suspendedUsers },
        jobs: { total: totalJobs, active: activeJobs, expired: expiredJobs, filled: filledJobs },
        applications: { total: totalApplications, pending: pendingApplications, accepted: acceptedApplications, rejected: rejectedApplications },
        revenue: { total: totalRevenue, monthly: monthlyRevenue, failed: failedPayments, refunded: refundedPayments },
        support: { openTickets, avgResponseTime, satisfactionScore },
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to retrieve dashboard metrics');
    }
  }
  
  // Get user engagement analytics
  async getUserEngagementAnalytics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
      }
      
      const [
        dailyActiveUsers,
        jobSearchActivity,
        applicationActivity,
        userRetention,
        topEmployers,
        topJobCategories,
      ] = await Promise.all([
        this.getDailyActiveUsers(startDate),
        this.getJobSearchActivity(startDate),
        this.getApplicationActivity(startDate),
        this.getUserRetention(startDate),
        this.getTopEmployers(startDate),
        this.getTopJobCategories(startDate),
      ]);
      
      return {
        timeframe,
        startDate,
        dailyActiveUsers,
        jobSearchActivity,
        applicationActivity,
        userRetention,
        topEmployers,
        topJobCategories,
      };
    } catch (error) {
      logger.error('Failed to get user engagement analytics', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }
  
  // Get revenue analytics
  async getRevenueAnalytics(timeframe: 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      const [
        revenueByPlan,
        churnAnalysis,
        paymentFailureAnalysis,
        refundAnalysis,
        revenueGrowth,
        lifetimeValue,
      ] = await Promise.all([
        this.getRevenueByPlan(startDate),
        this.getChurnAnalysis(startDate),
        this.getPaymentFailureAnalysis(startDate),
        this.getRefundAnalysis(startDate),
        this.getRevenueGrowth(startDate),
        this.calculateLifetimeValue(),
      ]);
      
      return {
        timeframe,
        startDate,
        revenueByPlan,
        churnAnalysis,
        paymentFailureAnalysis,
        refundAnalysis,
        revenueGrowth,
        lifetimeValue,
      };
    } catch (error) {
      logger.error('Failed to get revenue analytics', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }
  
  // Get support team analytics
  async getSupportAnalytics(): Promise<any> {
    try {
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [
        ticketsByStatus,
        ticketsByCategory,
        ticketsByPriority,
        avgResolutionTime,
        supportTeamPerformance,
        customerSatisfaction,
        escalationRate,
        reopenRate,
      ] = await Promise.all([
        this.getTicketsByStatus(),
        this.getTicketsByCategory(monthStart),
        this.getTicketsByPriority(monthStart),
        this.calculateAvgResolutionTime(monthStart),
        this.getSupportTeamPerformance(monthStart),
        this.getCustomerSatisfaction(monthStart),
        this.calculateEscalationRate(monthStart),
        this.calculateReopenRate(monthStart),
      ]);
      
      return {
        ticketsByStatus,
        ticketsByCategory,
        ticketsByPriority,
        avgResolutionTime,
        supportTeamPerformance,
        customerSatisfaction,
        escalationRate,
        reopenRate,
      };
    } catch (error) {
      logger.error('Failed to get support analytics', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }
  
  // Search for users with advanced filters
  async searchUsers(filters: {
    email?: string;
    name?: string;
    role?: string;
    status?: string;
    registeredAfter?: Date;
    registeredBefore?: Date;
    lastLoginAfter?: Date;
    lastLoginBefore?: Date;
    hasSubscription?: boolean;
    subscriptionStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const where: any = {};
      
      if (filters.email) {
        where.email = { contains: filters.email, mode: 'insensitive' };
      }
      if (filters.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
      }
      if (filters.role) {
        where.role = filters.role;
      }
      if (filters.status === 'active') {
        where.accountLocked = false;
        where.accountDeleted = false;
      } else if (filters.status === 'locked') {
        where.accountLocked = true;
      } else if (filters.status === 'deleted') {
        where.accountDeleted = true;
      }
      if (filters.registeredAfter) {
        where.createdAt = { ...where.createdAt, gte: filters.registeredAfter };
      }
      if (filters.registeredBefore) {
        where.createdAt = { ...where.createdAt, lte: filters.registeredBefore };
      }
      if (filters.lastLoginAfter) {
        where.lastLoginAt = { ...where.lastLoginAt, gte: filters.lastLoginAfter };
      }
      if (filters.lastLoginBefore) {
        where.lastLoginAt = { ...where.lastLoginAt, lte: filters.lastLoginBefore };
      }
      if (filters.hasSubscription !== undefined) {
        if (filters.hasSubscription) {
          where.subscription = { isNot: null };
        } else {
          where.subscription = null;
        }
      }
      if (filters.subscriptionStatus) {
        where.subscription = { status: filters.subscriptionStatus };
      }
      
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            subscription: {
              select: { status: true, plan: true, createdAt: true },
            },
            _count: {
              select: {
                jobs: true,
                applications: true,
                supportTickets: true,
              },
            },
          },
          take: filters.limit || 50,
          skip: filters.offset || 0,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);
      
      return { users, total };
    } catch (error) {
      logger.error('Failed to search users', error instanceof Error ? error : new Error(String(error)));
      return { users: [], total: 0 };
    }
  }
  
  // Generate custom report
  async generateCustomReport(query: MetricQuery): Promise<any> {
    try {
      // This would be a more sophisticated system in production
      // For now, we'll handle a few common queries
      
      switch (query.metric) {
        case 'user_growth':
          return await this.getUserGrowthReport(query);
        case 'job_performance':
          return await this.getJobPerformanceReport(query);
        case 'revenue_trends':
          return await this.getRevenueTrendsReport(query);
        case 'support_performance':
          return await this.getSupportPerformanceReport(query);
        default:
          throw new Error(`Unknown metric: ${query.metric}`);
      }
    } catch (error) {
      logger.error('Failed to generate custom report', error instanceof Error ? error : new Error(String(error)), { query });
      return null;
    }
  }
  
  // Private helper methods
  private async calculateTotalRevenue(): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: { status: 'succeeded' },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }
  
  private async calculateMonthlyRevenue(startDate: Date): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: { 
        status: 'succeeded',
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }
  
  private async calculateFailedPayments(): Promise<number> {
    return await this.prisma.payment.count({
      where: { status: 'failed' },
    });
  }
  
  private async calculateRefundedPayments(): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: { status: { in: ['refunded', 'partially_refunded'] } },
      _sum: { refundAmount: true },
    });
    return result._sum.refundAmount || 0;
  }
  
  private async calculateAverageResponseTime(): Promise<number> {
    // Placeholder - would calculate actual response times
    return 24; // hours
  }
  
  private async calculateSatisfactionScore(): Promise<number> {
    // Placeholder - would calculate from survey responses
    return 4.2; // out of 5
  }
  
  private async getDailyActiveUsers(startDate: Date): Promise<number[]> {
    // Placeholder - would return daily counts
    return [120, 135, 142, 128, 156, 134, 149];
  }
  
  private async getJobSearchActivity(startDate: Date): Promise<any> {
    return { searches: 1250, views: 3420, applications: 245 };
  }
  
  private async getApplicationActivity(startDate: Date): Promise<any> {
    return { submitted: 245, accepted: 45, rejected: 120, pending: 80 };
  }
  
  private async getUserRetention(startDate: Date): Promise<any> {
    return { day1: 85, day7: 65, day30: 45 }; // percentages
  }
  
  private async getTopEmployers(startDate: Date): Promise<any[]> {
    return [
      { company: 'Hospital Group A', jobs: 25, applications: 120 },
      { company: 'Medical Center B', jobs: 18, applications: 89 },
    ];
  }
  
  private async getTopJobCategories(startDate: Date): Promise<any[]> {
    return [
      { category: 'Emergency Medicine', count: 45 },
      { category: 'Internal Medicine', count: 38 },
    ];
  }
  
  private async getRevenueByPlan(startDate: Date): Promise<any[]> {
    return [
      { plan: 'Basic', revenue: 15000, customers: 150 },
      { plan: 'Premium', revenue: 25000, customers: 125 },
    ];
  }
  
  private async getChurnAnalysis(startDate: Date): Promise<any> {
    return { rate: 5.2, reasons: ['price', 'features', 'competition'] };
  }
  
  private async getPaymentFailureAnalysis(startDate: Date): Promise<any> {
    return { rate: 3.1, commonReasons: ['insufficient_funds', 'card_declined'] };
  }
  
  private async getRefundAnalysis(startDate: Date): Promise<any> {
    return { rate: 2.1, commonReasons: ['duplicate', 'requested_by_customer'] };
  }
  
  private async getRevenueGrowth(startDate: Date): Promise<any> {
    return { monthOverMonth: 12.5, yearOverYear: 145.2 };
  }
  
  private async calculateLifetimeValue(): Promise<number> {
    return 450; // average LTV in dollars
  }
  
  private async getTicketsByStatus(): Promise<any[]> {
    return [
      { status: 'open', count: 25 },
      { status: 'in_progress', count: 15 },
    ];
  }
  
  private async getTicketsByCategory(startDate: Date): Promise<any[]> {
    return [
      { category: 'billing', count: 45 },
      { category: 'technical', count: 32 },
    ];
  }
  
  private async getTicketsByPriority(startDate: Date): Promise<any[]> {
    return [
      { priority: 'high', count: 12 },
      { priority: 'medium', count: 35 },
    ];
  }
  
  private async calculateAvgResolutionTime(startDate: Date): Promise<number> {
    return 18; // hours
  }
  
  private async getSupportTeamPerformance(startDate: Date): Promise<any[]> {
    return [
      { agent: 'Alice', resolved: 45, avgTime: 16 },
      { agent: 'Bob', resolved: 38, avgTime: 22 },
    ];
  }
  
  private async getCustomerSatisfaction(startDate: Date): Promise<any> {
    return { avgRating: 4.2, responses: 125 };
  }
  
  private async calculateEscalationRate(startDate: Date): Promise<number> {
    return 8.5; // percentage
  }
  
  private async calculateReopenRate(startDate: Date): Promise<number> {
    return 12.3; // percentage
  }
  
  private async getUserGrowthReport(query: MetricQuery): Promise<any> {
    return { growth: 'user growth data' };
  }
  
  private async getJobPerformanceReport(query: MetricQuery): Promise<any> {
    return { performance: 'job performance data' };
  }
  
  private async getRevenueTrendsReport(query: MetricQuery): Promise<any> {
    return { trends: 'revenue trends data' };
  }
  
  private async getSupportPerformanceReport(query: MetricQuery): Promise<any> {
    return { performance: 'support performance data' };
  }
}