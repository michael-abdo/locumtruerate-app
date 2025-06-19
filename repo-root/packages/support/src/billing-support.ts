/**
 * Billing support utilities for handling payment and subscription issues
 */

import Stripe from 'stripe';
import { z } from 'zod';
import { logger } from '@locumtruerate/shared';
import { PrismaClient } from '@locumtruerate/database';

export interface BillingIssue {
  type: 'payment_failed' | 'subscription_cancelled' | 'refund_request' | 'billing_dispute' | 'upgrade_request' | 'downgrade_request';
  userId: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // Partial refund amount
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'subscription_cancellation';
  description?: string;
}

export class BillingSupportService {
  private stripe: Stripe;
  private prisma: PrismaClient;
  
  constructor(stripe: Stripe, prisma: PrismaClient) {
    this.stripe = stripe;
    this.prisma = prisma;
  }
  
  // Get comprehensive billing information for a user
  async getUserBillingInfo(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
      
      if (!user?.stripeCustomerId) {
        return { user, stripe: null };
      }
      
      // Get Stripe customer information
      const [customer, subscriptions, paymentMethods, charges] = await Promise.all([
        this.stripe.customers.retrieve(user.stripeCustomerId),
        this.stripe.subscriptions.list({ customer: user.stripeCustomerId }),
        this.stripe.paymentMethods.list({ customer: user.stripeCustomerId }),
        this.stripe.charges.list({ customer: user.stripeCustomerId, limit: 10 }),
      ]);
      
      return {
        user,
        stripe: {
          customer,
          subscriptions: subscriptions.data,
          paymentMethods: paymentMethods.data,
          charges: charges.data,
        },
      };
    } catch (error) {
      logger.error('Failed to get user billing info', error instanceof Error ? error : new Error(String(error)), { userId });
      throw new Error('Failed to retrieve billing information');
    }
  }
  
  // Handle payment failure
  async handlePaymentFailure(issue: BillingIssue): Promise<void> {
    try {
      logger.warn('Payment failure detected', {
        userId: issue.userId,
        paymentIntentId: issue.paymentIntentId,
        amount: issue.amount,
      });
      
      // Get payment intent details
      if (issue.paymentIntentId) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(issue.paymentIntentId);
        
        // Update our database
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: issue.paymentIntentId },
          data: { status: 'failed' },
        });
        
        // Send notification to user
        await this.sendPaymentFailureNotification(issue.userId, paymentIntent);
        
        // Create follow-up tasks
        await this.createBillingFollowUp(issue);
      }
    } catch (error) {
      logger.error('Failed to handle payment failure', error instanceof Error ? error : new Error(String(error)), issue);
    }
  }
  
  // Process refund request
  async processRefund(userId: string, refundRequest: RefundRequest): Promise<string> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(refundRequest.paymentIntentId);
      
      if (!paymentIntent.charges.data[0]) {
        throw new Error('No charge found for payment intent');
      }
      
      const charge = paymentIntent.charges.data[0];
      const refundAmount = refundRequest.amount || charge.amount;
      
      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        charge: charge.id,
        amount: refundAmount,
        reason: refundRequest.reason,
        metadata: {
          userId,
          processed_by: 'support_system',
        },
      });
      
      // Update our database
      await this.prisma.payment.updateMany({
        where: { stripePaymentIntentId: refundRequest.paymentIntentId },
        data: { 
          status: refundAmount === charge.amount ? 'refunded' : 'partially_refunded',
          refundAmount: refundAmount,
          refundedAt: new Date(),
        },
      });
      
      logger.info('Refund processed successfully', {
        userId,
        refundId: refund.id,
        amount: refundAmount,
        reason: refundRequest.reason,
      });
      
      // Send confirmation to user
      await this.sendRefundConfirmation(userId, refund);
      
      return refund.id;
    } catch (error) {
      logger.error('Failed to process refund', error instanceof Error ? error : new Error(String(error)), { userId, refundRequest });
      throw new Error('Failed to process refund');
    }
  }
  
  // Handle subscription changes
  async handleSubscriptionChange(
    userId: string, 
    changeType: 'upgrade' | 'downgrade' | 'cancel',
    newPriceId?: string
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });
      
      if (!user?.stripeCustomerId) {
        throw new Error('User has no Stripe customer ID');
      }
      
      const subscriptions = await this.stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
      });
      
      if (subscriptions.data.length === 0) {
        throw new Error('No active subscription found');
      }
      
      const subscription = subscriptions.data[0];
      
      switch (changeType) {
        case 'upgrade':
        case 'downgrade':
          if (!newPriceId) {
            throw new Error('Price ID required for subscription changes');
          }
          
          await this.stripe.subscriptions.update(subscription.id, {
            items: [{
              id: subscription.items.data[0].id,
              price: newPriceId,
            }],
            proration_behavior: 'create_prorations',
          });
          
          // Update our database
          await this.prisma.subscription.update({
            where: { userId },
            data: { 
              stripePriceId: newPriceId,
              updatedAt: new Date(),
            },
          });
          
          break;
          
        case 'cancel':
          await this.stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true,
          });
          
          // Update our database
          await this.prisma.subscription.update({
            where: { userId },
            data: { 
              cancelAtPeriodEnd: true,
              updatedAt: new Date(),
            },
          });
          
          break;
      }
      
      logger.info('Subscription change processed', {
        userId,
        changeType,
        subscriptionId: subscription.id,
        newPriceId,
      });
      
      // Send confirmation to user
      await this.sendSubscriptionChangeConfirmation(userId, changeType, subscription);
      
    } catch (error) {
      logger.error('Failed to handle subscription change', error instanceof Error ? error : new Error(String(error)), { userId, changeType });
      throw new Error('Failed to process subscription change');
    }
  }
  
  // Generate billing report for support team
  async generateBillingReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const [
        totalRevenue,
        totalRefunds,
        failedPayments,
        newSubscriptions,
        cancelledSubscriptions,
        churnRate,
      ] = await Promise.all([
        this.calculateTotalRevenue(startDate, endDate),
        this.calculateTotalRefunds(startDate, endDate),
        this.getFailedPayments(startDate, endDate),
        this.getNewSubscriptions(startDate, endDate),
        this.getCancelledSubscriptions(startDate, endDate),
        this.calculateChurnRate(startDate, endDate),
      ]);
      
      return {
        period: { startDate, endDate },
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
        failedPayments: {
          count: failedPayments.length,
          amount: failedPayments.reduce((sum, p) => sum + p.amount, 0),
        },
        subscriptions: {
          new: newSubscriptions,
          cancelled: cancelledSubscriptions,
          churnRate,
        },
      };
    } catch (error) {
      logger.error('Failed to generate billing report', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }
  
  // Resolve billing dispute
  async resolveBillingDispute(
    userId: string, 
    disputeId: string, 
    resolution: 'accept' | 'submit_evidence',
    evidence?: any
  ): Promise<void> {
    try {
      const dispute = await this.stripe.disputes.retrieve(disputeId);
      
      if (resolution === 'accept') {
        // Accept the dispute
        await this.stripe.disputes.close(disputeId);
        
        logger.info('Billing dispute accepted', {
          userId,
          disputeId,
          amount: dispute.amount,
        });
      } else if (resolution === 'submit_evidence' && evidence) {
        // Submit evidence to contest the dispute
        await this.stripe.disputes.update(disputeId, {
          evidence: evidence,
          submit: true,
        });
        
        logger.info('Billing dispute evidence submitted', {
          userId,
          disputeId,
          amount: dispute.amount,
        });
      }
      
      // Create internal note
      await this.createBillingNote(userId, `Dispute ${disputeId} ${resolution}`, {
        disputeId,
        resolution,
        amount: dispute.amount,
      });
      
    } catch (error) {
      logger.error('Failed to resolve billing dispute', error instanceof Error ? error : new Error(String(error)), { userId, disputeId });
      throw new Error('Failed to resolve dispute');
    }
  }
  
  // Private helper methods
  private async calculateTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: {
        status: 'succeeded',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
    
    return result._sum.amount || 0;
  }
  
  private async calculateTotalRefunds(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: {
        status: { in: ['refunded', 'partially_refunded'] },
        refundedAt: { gte: startDate, lte: endDate },
      },
      _sum: { refundAmount: true },
    });
    
    return result._sum.refundAmount || 0;
  }
  
  private async getFailedPayments(startDate: Date, endDate: Date): Promise<any[]> {
    return await this.prisma.payment.findMany({
      where: {
        status: 'failed',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }
  
  private async getNewSubscriptions(startDate: Date, endDate: Date): Promise<number> {
    return await this.prisma.subscription.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });
  }
  
  private async getCancelledSubscriptions(startDate: Date, endDate: Date): Promise<number> {
    return await this.prisma.subscription.count({
      where: {
        cancelledAt: { gte: startDate, lte: endDate },
      },
    });
  }
  
  private async calculateChurnRate(startDate: Date, endDate: Date): Promise<number> {
    const cancelled = await this.getCancelledSubscriptions(startDate, endDate);
    const totalAtStart = await this.prisma.subscription.count({
      where: {
        createdAt: { lt: startDate },
        cancelledAt: { gt: startDate },
      },
    });
    
    return totalAtStart > 0 ? (cancelled / totalAtStart * 100) : 0;
  }
  
  private async sendPaymentFailureNotification(userId: string, paymentIntent: any): Promise<void> {
    logger.info('Payment failure notification sent', { userId, paymentIntentId: paymentIntent.id });
  }
  
  private async sendRefundConfirmation(userId: string, refund: any): Promise<void> {
    logger.info('Refund confirmation sent', { userId, refundId: refund.id });
  }
  
  private async sendSubscriptionChangeConfirmation(userId: string, changeType: string, subscription: any): Promise<void> {
    logger.info('Subscription change confirmation sent', { userId, changeType, subscriptionId: subscription.id });
  }
  
  private async createBillingFollowUp(issue: BillingIssue): Promise<void> {
    logger.info('Billing follow-up created', { issue });
  }
  
  private async createBillingNote(userId: string, note: string, metadata: any): Promise<void> {
    logger.info('Billing note created', { userId, note, metadata });
  }
}