/**
 * Email service integration for LocumTrueRate
 * Provides unified email functionality across the platform
 */

import { sendGridService } from './services/sendgrid';
import { 
  generateWelcomeEmail,
  generateApplicationNotificationEmail,
  generateApplicationConfirmationEmail,
  WelcomeEmailData,
  ApplicationNotificationData,
  ApplicationConfirmationData
} from './templates';

export * from './services/sendgrid';
export * from './templates';

export class EmailService {
  private static instance: EmailService;
  
  private constructor() {}
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  async initialize() {
    sendGridService.initialize();
  }
  
  // Welcome email for new users
  async sendWelcomeEmail(data: WelcomeEmailData) {
    const { html, text } = generateWelcomeEmail(data);
    
    return sendGridService.sendEmail({
      to: data.email,
      subject: 'Welcome to LocumTrueRate! 🎉',
      html,
      text,
    });
  }
  
  // Application notification to employers
  async sendApplicationNotification(data: ApplicationNotificationData) {
    const { html, text } = generateApplicationNotificationEmail(data);
    
    return sendGridService.sendEmail({
      to: data.employerName, // This should be employer email
      subject: `New Application: ${data.jobTitle} at ${data.companyName}`,
      html,
      text,
    });
  }
  
  // Application confirmation to candidates
  async sendApplicationConfirmation(data: ApplicationConfirmationData) {
    const { html, text } = generateApplicationConfirmationEmail(data);
    
    return sendGridService.sendEmail({
      to: data.applicantName, // This should be applicant email
      subject: `Application Confirmed: ${data.jobTitle}`,
      html,
      text,
    });
  }
  
  // Password reset email
  async sendPasswordReset(email: string, resetUrl: string, name: string) {
    const html = `
      <h1>Password Reset Request</h1>
      <p>Hi ${name},</p>
      <p>You requested a password reset for your LocumTrueRate account.</p>
      <p><a href="${resetUrl}">Reset Your Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    
    const text = `
      Password Reset Request
      
      Hi ${name},
      
      You requested a password reset for your LocumTrueRate account.
      
      Reset your password: ${resetUrl}
      
      This link expires in 1 hour.
      
      If you didn't request this, please ignore this email.
    `;
    
    return sendGridService.sendEmail({
      to: email,
      subject: 'Reset Your Password - LocumTrueRate',
      html,
      text,
    });
  }
  
  // Job expiration reminder
  async sendJobExpirationReminder(
    employerEmail: string,
    jobTitle: string,
    expirationDate: string,
    renewUrl: string
  ) {
    const html = `
      <h1>Job Posting Expiring Soon</h1>
      <p>Your job posting "${jobTitle}" will expire on ${expirationDate}.</p>
      <p><a href="${renewUrl}">Renew Your Job Posting</a></p>
    `;
    
    const text = `
      Job Posting Expiring Soon
      
      Your job posting "${jobTitle}" will expire on ${expirationDate}.
      
      Renew your job posting: ${renewUrl}
    `;
    
    return sendGridService.sendEmail({
      to: employerEmail,
      subject: `Job Posting Expiring: ${jobTitle}`,
      html,
      text,
    });
  }
  
  // Subscription notification
  async sendSubscriptionNotification(
    email: string,
    type: 'upgrade' | 'downgrade' | 'cancelled',
    planName: string
  ) {
    const subjects = {
      upgrade: `Welcome to ${planName}! 🎉`,
      downgrade: `Plan Changed to ${planName}`,
      cancelled: 'Subscription Cancelled',
    };
    
    const html = `
      <h1>Subscription ${type.charAt(0).toUpperCase() + type.slice(1)}</h1>
      <p>Your subscription has been ${type}d.</p>
      ${type !== 'cancelled' ? `<p>You now have access to ${planName} features.</p>` : ''}
    `;
    
    return sendGridService.sendEmail({
      to: email,
      subject: subjects[type],
      html,
      text: html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });
  }
  
  // Bulk email for newsletters/announcements
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    content: { html: string; text: string }
  ) {
    const emails = recipients.map(email => ({
      to: email,
      subject,
      html: content.html,
      text: content.text,
    }));
    
    return sendGridService.sendBulkEmail(emails);
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();