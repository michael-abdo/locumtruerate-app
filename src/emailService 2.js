// Email service for job board notifications
// This module handles email notifications for applications and job updates

class EmailService {
  constructor(env) {
    this.env = env;
    // In production, you would configure with services like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Cloudflare Email Workers
    // - Resend
  }

  // Send email notification when a new application is received
  async notifyNewApplication(application, job, employer) {
    const emailData = {
      to: employer.email,
      from: 'noreply@jobboard.com',
      subject: `New Application: ${application.fullName} for ${job.title}`,
      html: this.generateApplicationNotificationHTML(application, job, employer),
      text: this.generateApplicationNotificationText(application, job, employer)
    };

    try {
      // In production, replace with actual email service
      await this.sendEmail(emailData);
      
      // Log notification for tracking
      await this.logNotification({
        type: 'application_received',
        recipientId: employer.id,
        recipientEmail: employer.email,
        jobId: job.id,
        applicationId: application.id,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      console.error('Failed to send application notification:', error);
      
      // Log failed notification
      await this.logNotification({
        type: 'application_received',
        recipientId: employer.id,
        recipientEmail: employer.email,
        jobId: job.id,
        applicationId: application.id,
        sentAt: new Date().toISOString(),
        status: 'failed',
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }

  // Send confirmation email to applicant
  async confirmApplicationSubmission(application, job) {
    const emailData = {
      to: application.email,
      from: 'noreply@jobboard.com',
      subject: `Application Confirmed: ${job.title} at ${job.company}`,
      html: this.generateApplicationConfirmationHTML(application, job),
      text: this.generateApplicationConfirmationText(application, job)
    };

    try {
      await this.sendEmail(emailData);
      
      await this.logNotification({
        type: 'application_confirmation',
        recipientId: application.id,
        recipientEmail: application.email,
        jobId: job.id,
        applicationId: application.id,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send application status update email
  async notifyApplicationStatusChange(application, job, newStatus, message = '') {
    const statusMessages = {
      reviewed: 'Your application is being reviewed',
      accepted: 'Congratulations! Your application has been accepted',
      rejected: 'Thank you for your interest. We have decided to move forward with other candidates',
      interview: 'We would like to schedule an interview with you'
    };

    const emailData = {
      to: application.email,
      from: 'noreply@jobboard.com',
      subject: `Application Update: ${job.title} at ${job.company}`,
      html: this.generateStatusUpdateHTML(application, job, newStatus, statusMessages[newStatus], message),
      text: this.generateStatusUpdateText(application, job, newStatus, statusMessages[newStatus], message)
    };

    try {
      await this.sendEmail(emailData);
      
      await this.logNotification({
        type: 'status_update',
        recipientId: application.id,
        recipientEmail: application.email,
        jobId: job.id,
        applicationId: application.id,
        sentAt: new Date().toISOString(),
        status: 'sent',
        metadata: { newStatus, message }
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send status update email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send job expiration warning to employer
  async notifyJobExpiring(job, employer, daysLeft) {
    const emailData = {
      to: employer.email,
      from: 'noreply@jobboard.com',
      subject: `Job Expiring Soon: ${job.title}`,
      html: this.generateJobExpirationHTML(job, employer, daysLeft),
      text: this.generateJobExpirationText(job, employer, daysLeft)
    };

    try {
      await this.sendEmail(emailData);
      return { success: true };
    } catch (error) {
      console.error('Failed to send job expiration warning:', error);
      return { success: false, error: error.message };
    }
  }

  // Mock email sending function - replace with actual service
  async sendEmail(emailData) {
    // In production, implement with actual email service:
    /*
    // Example with SendGrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(this.env.SENDGRID_API_KEY);
    await sgMail.send(emailData);
    
    // Example with Mailgun
    const mailgun = require('mailgun-js');
    const mg = mailgun({ apiKey: this.env.MAILGUN_API_KEY, domain: this.env.MAILGUN_DOMAIN });
    await mg.messages().send(emailData);
    
    // Example with AWS SES
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({ region: 'us-east-1' });
    await ses.sendEmail(emailData).promise();
    */
    
    // For demo purposes, log the email instead of sending
    console.log('📧 Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString()
    });
    
    // Simulate potential email service delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  // Log email notifications for tracking and analytics
  async logNotification(notificationData) {
    try {
      const id = crypto.randomUUID();
      const notification = {
        id,
        ...notificationData
      };
      
      await this.env.NOTIFICATIONS.put(id, JSON.stringify(notification));
      return notification;
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  // Get notification history for analytics
  async getNotificationHistory(filters = {}) {
    try {
      const notifications = await this.env.NOTIFICATIONS.list();
      const notificationList = [];
      
      for (const key of notifications.keys) {
        const notification = await this.env.NOTIFICATIONS.get(key.name);
        if (notification) {
          const notificationData = JSON.parse(notification);
          
          // Apply filters
          if (filters.type && notificationData.type !== filters.type) continue;
          if (filters.status && notificationData.status !== filters.status) continue;
          if (filters.recipientId && notificationData.recipientId !== filters.recipientId) continue;
          
          notificationList.push(notificationData);
        }
      }
      
      // Sort by date descending
      notificationList.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
      
      return notificationList;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return [];
    }
  }

  // HTML template for new application notification
  generateApplicationNotificationHTML(application, job, employer) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Job Application</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3498db; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .application-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Job Application</h1>
          </div>
          <div class="content">
            <p>Hello ${employer.contactName},</p>
            <p>You have received a new application for your job posting:</p>
            
            <div class="application-details">
              <h3>${job.title}</h3>
              <p><strong>Company:</strong> ${job.company}</p>
              <p><strong>Location:</strong> ${job.location}</p>
            </div>
            
            <div class="application-details">
              <h3>Applicant Information</h3>
              <p><strong>Name:</strong> ${application.fullName}</p>
              <p><strong>Email:</strong> ${application.email}</p>
              <p><strong>Phone:</strong> ${application.phone || 'Not provided'}</p>
              <p><strong>Experience:</strong> ${application.experience || 'Not specified'} years</p>
              ${application.portfolio ? `<p><strong>Portfolio:</strong> <a href="${application.portfolio}" target="_blank">${application.portfolio}</a></p>` : ''}
              <p><strong>Applied:</strong> ${new Date(application.appliedAt).toLocaleDateString()}</p>
            </div>
            
            <div class="application-details">
              <h3>Cover Letter</h3>
              <p>${application.coverLetter}</p>
            </div>
            
            <p>
              <a href="https://your-job-board.workers.dev/dashboard.html" class="button">
                View Application in Dashboard
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This email was sent automatically by your Job Board system.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text template for new application notification
  generateApplicationNotificationText(application, job, employer) {
    return `
New Job Application Received

Hello ${employer.contactName},

You have received a new application for your job posting:

Job: ${job.title}
Company: ${job.company}
Location: ${job.location}

Applicant Information:
- Name: ${application.fullName}
- Email: ${application.email}
- Phone: ${application.phone || 'Not provided'}
- Experience: ${application.experience || 'Not specified'} years
${application.portfolio ? `- Portfolio: ${application.portfolio}` : ''}
- Applied: ${new Date(application.appliedAt).toLocaleDateString()}

Cover Letter:
${application.coverLetter}

View this application in your dashboard: https://your-job-board.workers.dev/dashboard.html

This email was sent automatically by your Job Board system.
    `;
  }

  // HTML template for application confirmation
  generateApplicationConfirmationHTML(application, job) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .job-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Application Confirmed</h1>
          </div>
          <div class="content">
            <p>Dear ${application.fullName},</p>
            <p>Thank you for your application! We have successfully received your application for the following position:</p>
            
            <div class="job-details">
              <h3>${job.title}</h3>
              <p><strong>Company:</strong> ${job.company}</p>
              <p><strong>Location:</strong> ${job.location}</p>
              <p><strong>Type:</strong> ${job.type}</p>
            </div>
            
            <p>Your application is now being reviewed by our team. We will contact you if your qualifications match our requirements.</p>
            
            <p>Application Details:</p>
            <ul>
              <li>Application ID: ${application.id}</li>
              <li>Submitted: ${new Date(application.appliedAt).toLocaleDateString()}</li>
              <li>Status: Under Review</li>
            </ul>
            
            <p>Thank you for your interest in joining our team!</p>
          </div>
          <div class="footer">
            <p>Please do not reply to this email. This is an automated confirmation.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text template for application confirmation
  generateApplicationConfirmationText(application, job) {
    return `
Application Confirmed

Dear ${application.fullName},

Thank you for your application! We have successfully received your application for the following position:

Job: ${job.title}
Company: ${job.company}
Location: ${job.location}
Type: ${job.type}

Your application is now being reviewed by our team. We will contact you if your qualifications match our requirements.

Application Details:
- Application ID: ${application.id}
- Submitted: ${new Date(application.appliedAt).toLocaleDateString()}
- Status: Under Review

Thank you for your interest in joining our team!

Please do not reply to this email. This is an automated confirmation.
    `;
  }

  // HTML template for status updates
  generateStatusUpdateHTML(application, job, newStatus, statusMessage, customMessage) {
    const statusColors = {
      reviewed: '#3498db',
      accepted: '#27ae60',
      rejected: '#e74c3c',
      interview: '#f39c12'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusColors[newStatus] || '#3498db'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-badge { display: inline-block; padding: 5px 15px; background: ${statusColors[newStatus] || '#3498db'}; color: white; border-radius: 15px; font-weight: bold; }
          .job-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application Status Update</h1>
          </div>
          <div class="content">
            <p>Dear ${application.fullName},</p>
            <p>We have an update regarding your application:</p>
            
            <div class="job-details">
              <h3>${job.title}</h3>
              <p><strong>Company:</strong> ${job.company}</p>
              <p><strong>Status:</strong> <span class="status-badge">${newStatus.toUpperCase()}</span></p>
            </div>
            
            <p><strong>${statusMessage}</strong></p>
            
            ${customMessage ? `<p>${customMessage}</p>` : ''}
            
            <p>Thank you for your continued interest in our company.</p>
          </div>
          <div class="footer">
            <p>This is an automated update from our Job Board system.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text template for status updates
  generateStatusUpdateText(application, job, newStatus, statusMessage, customMessage) {
    return `
Application Status Update

Dear ${application.fullName},

We have an update regarding your application:

Job: ${job.title}
Company: ${job.company}
Status: ${newStatus.toUpperCase()}

${statusMessage}

${customMessage || ''}

Thank you for your continued interest in our company.

This is an automated update from our Job Board system.
    `;
  }

  // HTML template for job expiration warning
  generateJobExpirationHTML(job, employer, daysLeft) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Job Expiring Soon</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f39c12; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .job-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Job Expiring Soon</h1>
          </div>
          <div class="content">
            <p>Hello ${employer.contactName},</p>
            
            <div class="warning">
              <p><strong>Your job posting will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!</strong></p>
            </div>
            
            <div class="job-details">
              <h3>${job.title}</h3>
              <p><strong>Company:</strong> ${job.company}</p>
              <p><strong>Location:</strong> ${job.location}</p>
              <p><strong>Posted:</strong> ${new Date(job.createdAt).toLocaleDateString()}</p>
            </div>
            
            <p>To keep your job posting active, please log in to your dashboard and renew it.</p>
            
            <p>
              <a href="https://your-job-board.workers.dev/dashboard.html" class="button">
                Manage Job Posting
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This email was sent automatically by your Job Board system.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text template for job expiration warning
  generateJobExpirationText(job, employer, daysLeft) {
    return `
Job Expiring Soon

Hello ${employer.contactName},

Your job posting will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!

Job Details:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Posted: ${new Date(job.createdAt).toLocaleDateString()}

To keep your job posting active, please log in to your dashboard and renew it.

Manage your job posting: https://your-job-board.workers.dev/dashboard.html

This email was sent automatically by your Job Board system.
    `;
  }
}

export { EmailService };