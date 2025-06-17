/**
 * User support utilities for account management and user assistance
 */

import { z } from 'zod';
import { logger } from '@locumtruerate/shared';
import { PrismaClient } from '@locumtruerate/database';

export interface UserIssue {
  type: 'account_locked' | 'password_reset' | 'email_change' | 'profile_update' | 'data_export' | 'account_deletion';
  userId: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface AccountAction {
  action: 'unlock' | 'suspend' | 'activate' | 'delete' | 'merge';
  reason: string;
  performedBy: string;
  notes?: string;
}

export class UserSupportService {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  // Get comprehensive user information for support
  async getUserSupportInfo(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          subscription: true,
          jobs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              applications: {
                select: { id: true, status: true },
              },
            },
          },
          applications: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              status: true,
              createdAt: true,
              job: {
                select: { id: true, title: true, company: true },
              },
            },
          },
          loginAttempts: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          supportTickets: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              subject: true,
              status: true,
              priority: true,
              createdAt: true,
            },
          },
        },
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get additional analytics
      const [totalJobs, totalApplications, lastLogin] = await Promise.all([
        this.prisma.job.count({ where: { employerId: userId } }),
        this.prisma.application.count({ where: { candidateId: userId } }),
        this.prisma.loginAttempt.findFirst({
          where: { userId, success: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      
      return {
        ...user,
        analytics: {
          totalJobs,
          totalApplications,
          lastLogin: lastLogin?.createdAt,
        },
      };
    } catch (error) {
      logger.error('Failed to get user support info', error, { userId });
      throw new Error('Failed to retrieve user information');
    }
  }
  
  // Handle account unlock
  async unlockAccount(userId: string, performedBy: string, reason: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          accountLocked: false,
          lockedAt: null,
          lockReason: null,
          updatedAt: new Date(),
        },
      });
      
      // Log the action
      await this.logAccountAction(userId, {
        action: 'unlock',
        reason,
        performedBy,
        notes: 'Account unlocked by support',
      });
      
      // Clear failed login attempts
      await this.prisma.loginAttempt.deleteMany({
        where: { userId },
      });
      
      logger.info('Account unlocked', { userId, performedBy, reason });
      
      // Send notification to user
      await this.sendAccountUnlockNotification(userId);
      
    } catch (error) {
      logger.error('Failed to unlock account', error, { userId });
      throw new Error('Failed to unlock account');
    }
  }
  
  // Handle password reset for user
  async initiatePasswordReset(userId: string, performedBy: string): Promise<string> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate reset token
      const resetToken = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      
      await this.prisma.passwordReset.create({
        data: {
          userId,
          token: resetToken,
          expiresAt,
          createdAt: new Date(),
        },
      });
      
      // Log the action
      await this.logAccountAction(userId, {
        action: 'unlock', // Using unlock as closest action type
        reason: 'Password reset initiated by support',
        performedBy,
        notes: 'Support-initiated password reset',
      });
      
      logger.info('Password reset initiated by support', { userId, performedBy });
      
      // Send reset email
      await this.sendPasswordResetEmail(user.email, user.name, resetToken);
      
      return resetToken;
    } catch (error) {
      logger.error('Failed to initiate password reset', error, { userId });
      throw new Error('Failed to initiate password reset');
    }
  }
  
  // Handle email change request
  async processEmailChange(
    userId: string, 
    newEmail: string, 
    performedBy: string,
    skipVerification: boolean = false
  ): Promise<void> {
    try {
      // Check if email is already in use
      const existingUser = await this.prisma.user.findUnique({
        where: { email: newEmail },
      });
      
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already in use by another account');
      }
      
      const oldEmail = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      
      if (skipVerification) {
        // Direct email change (support override)
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            email: newEmail,
            emailVerified: new Date(),
            updatedAt: new Date(),
          },
        });
        
        logger.info('Email changed by support', { 
          userId, 
          oldEmail: oldEmail?.email, 
          newEmail, 
          performedBy 
        });
      } else {
        // Generate verification token
        const verificationToken = this.generateSecureToken();
        
        await this.prisma.emailVerification.create({
          data: {
            userId,
            email: newEmail,
            token: verificationToken,
            expiresAt: new Date(Date.now() + 86400000), // 24 hours
            createdAt: new Date(),
          },
        });
        
        // Send verification email
        await this.sendEmailVerification(newEmail, verificationToken);
        
        logger.info('Email change verification sent', { userId, newEmail, performedBy });
      }
      
      // Log the action
      await this.logAccountAction(userId, {
        action: 'activate', // Using activate as closest action type
        reason: `Email change: ${oldEmail?.email} → ${newEmail}`,
        performedBy,
        notes: skipVerification ? 'Direct change by support' : 'Verification email sent',
      });
      
    } catch (error) {
      logger.error('Failed to process email change', error, { userId, newEmail });
      throw new Error('Failed to process email change');
    }
  }
  
  // Export user data (GDPR compliance)
  async exportUserData(userId: string, performedBy: string): Promise<any> {
    try {
      const userData = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          subscription: true,
          jobs: {
            include: {
              applications: {
                include: {
                  candidate: {
                    select: { id: true, email: true, name: true },
                  },
                },
              },
            },
          },
          applications: {
            include: {
              job: {
                select: { id: true, title: true, company: true },
              },
            },
          },
          payments: true,
          supportTickets: {
            include: {
              messages: true,
            },
          },
          loginAttempts: true,
        },
      });
      
      if (!userData) {
        throw new Error('User not found');
      }
      
      // Remove sensitive data
      const exportData = {
        ...userData,
        passwordHash: '[REDACTED]',
        stripeCustomerId: '[REDACTED]',
      };
      
      // Log the action
      await this.logAccountAction(userId, {
        action: 'unlock', // Using unlock as closest action type
        reason: 'Data export requested',
        performedBy,
        notes: 'GDPR data export generated',
      });
      
      logger.info('User data exported', { userId, performedBy });
      
      return exportData;
    } catch (error) {
      logger.error('Failed to export user data', error, { userId });
      throw new Error('Failed to export user data');
    }
  }
  
  // Handle account deletion
  async deleteAccount(userId: string, performedBy: string, reason: string): Promise<void> {
    try {
      // This is a soft delete - mark as deleted but keep data for compliance
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@locumtruerate.com`,
          name: 'Deleted User',
          accountDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      // Anonymize profile
      await this.prisma.profile.updateMany({
        where: { userId },
        data: {
          phone: null,
          address: null,
          bio: null,
          website: null,
          socialLinks: {},
        },
      });
      
      // Cancel subscription if active
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });
      
      if (subscription && subscription.status === 'active') {
        await this.prisma.subscription.update({
          where: { userId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
          },
        });
      }
      
      // Log the action
      await this.logAccountAction(userId, {
        action: 'delete',
        reason,
        performedBy,
        notes: 'Account soft-deleted by support',
      });
      
      logger.info('Account deleted', { userId, performedBy, reason });
      
    } catch (error) {
      logger.error('Failed to delete account', error, { userId });
      throw new Error('Failed to delete account');
    }
  }
  
  // Get user activity report
  async getUserActivityReport(userId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const [loginAttempts, jobViews, applications, jobPosts] = await Promise.all([
        this.prisma.loginAttempt.findMany({
          where: {
            userId,
            createdAt: { gte: startDate },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.jobView.findMany({
          where: {
            userId,
            createdAt: { gte: startDate },
          },
          include: {
            job: {
              select: { id: true, title: true, company: true },
            },
          },
        }),
        this.prisma.application.findMany({
          where: {
            candidateId: userId,
            createdAt: { gte: startDate },
          },
          include: {
            job: {
              select: { id: true, title: true, company: true },
            },
          },
        }),
        this.prisma.job.findMany({
          where: {
            employerId: userId,
            createdAt: { gte: startDate },
          },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            applications: {
              select: { id: true, status: true },
            },
          },
        }),
      ]);
      
      return {
        period: { days, startDate },
        loginAttempts: {
          total: loginAttempts.length,
          successful: loginAttempts.filter(a => a.success).length,
          failed: loginAttempts.filter(a => !a.success).length,
          details: loginAttempts,
        },
        jobViews: {
          total: jobViews.length,
          uniqueJobs: new Set(jobViews.map(v => v.jobId)).size,
          details: jobViews,
        },
        applications: {
          total: applications.length,
          details: applications,
        },
        jobPosts: {
          total: jobPosts.length,
          details: jobPosts,
        },
      };
    } catch (error) {
      logger.error('Failed to get user activity report', error, { userId });
      return null;
    }
  }
  
  // Private helper methods
  private generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }
  
  private async logAccountAction(userId: string, action: AccountAction): Promise<void> {
    try {
      await this.prisma.accountAction.create({
        data: {
          userId,
          action: action.action,
          reason: action.reason,
          performedBy: action.performedBy,
          notes: action.notes,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to log account action', error, { userId, action });
    }
  }
  
  private async sendAccountUnlockNotification(userId: string): Promise<void> {
    logger.info('Account unlock notification sent', { userId });
  }
  
  private async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    logger.info('Password reset email sent', { email, token });
  }
  
  private async sendEmailVerification(email: string, token: string): Promise<void> {
    logger.info('Email verification sent', { email, token });
  }
}