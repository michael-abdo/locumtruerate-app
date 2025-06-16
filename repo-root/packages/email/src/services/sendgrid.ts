/**
 * SendGrid email service integration
 */

import sgMail from '@sendgrid/mail';
import { logger } from '@locumtruerate/shared';

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
  replyTo?: string;
  sendAt?: number;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SendGridService {
  private initialized = false;
  private fromEmail: string;
  private fromName: string;
  
  constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@locumtruerate.com';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'LocumTrueRate';
  }
  
  initialize() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      logger.warn('SendGrid API key not found - email service disabled');
      return;
    }
    
    sgMail.setApiKey(apiKey);
    this.initialized = true;
    logger.info('SendGrid email service initialized');
  }
  
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.initialized) {
      logger.error('SendGrid service not initialized');
      return { success: false, error: 'Email service not initialized' };
    }
    
    try {
      const message = {
        to: options.to,
        from: options.from || `${this.fromName} <${this.fromEmail}>`,
        subject: options.subject,
        html: options.html,
        text: options.text,
        templateId: options.templateId,
        dynamicTemplateData: options.dynamicTemplateData,
        attachments: options.attachments,
        replyTo: options.replyTo,
        sendAt: options.sendAt,
      };
      
      const [response] = await sgMail.send(message);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: response.headers['x-message-id'],
      });
      
      return {
        success: true,
        messageId: response.headers['x-message-id'],
      };
      
    } catch (error: any) {
      logger.error('Failed to send email', error, {
        to: options.to,
        subject: options.subject,
      });
      
      return {
        success: false,
        error: error.message || 'Unknown email error',
      };
    }
  }
  
  async sendBulkEmail(emails: EmailOptions[]): Promise<EmailResult[]> {
    if (!this.initialized) {
      return emails.map(() => ({ 
        success: false, 
        error: 'Email service not initialized' 
      }));
    }
    
    const results: EmailResult[] = [];
    
    // Send emails in batches to avoid rate limits
    const batchSize = 100;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(email => this.sendEmail(email));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Batch send failed',
          });
        }
      });
      
      // Rate limiting delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info(`Bulk email completed`, {
      total: emails.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });
    
    return results;
  }
  
  async verifyApiKey(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }
    
    try {
      // Test API key by making a simple request
      await sgMail.send({
        to: 'test@example.com',
        from: this.fromEmail,
        subject: 'Test',
        html: '<p>Test</p>',
      }, false); // false = don't actually send
      
      return true;
    } catch (error) {
      logger.error('SendGrid API key verification failed', error);
      return false;
    }
  }
  
  // Webhook handling for email events
  parseWebhook(body: any[]): Array<{
    email: string;
    event: string;
    timestamp: number;
    messageId?: string;
    reason?: string;
  }> {
    return body.map(event => ({
      email: event.email,
      event: event.event,
      timestamp: event.timestamp,
      messageId: event.sg_message_id,
      reason: event.reason,
    }));
  }
}

// Export singleton instance
export const sendGridService = new SendGridService();