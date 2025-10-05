/**
 * Email Service Module
 * 
 * Provides email functionality using Nodemailer with fallback options
 * and comprehensive error handling for password reset emails.
 */

const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter with configuration
   */
  initializeTransporter() {
    try {
      // Check if email configuration is available
      if (!config.email.auth.user || !config.email.auth.pass) {
        config.logger.warn('Email service not configured - missing credentials');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        service: config.email.service,
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.auth.user,
          pass: config.email.auth.pass
        },
        // Connection timeout and retry settings
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });

      this.isConfigured = true;
      config.logger.info('Email service initialized successfully', 'EmailService');
    } catch (error) {
      config.logger.error('Failed to initialize email service', error, 'EmailService');
      this.isConfigured = false;
    }
  }

  /**
   * Verify email service connection
   * @returns {Promise<boolean>} Connection status
   */
  async verifyConnection() {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      config.logger.info('Email service connection verified', 'EmailService');
      return true;
    } catch (error) {
      config.logger.error('Email service connection failed', error, 'EmailService');
      return false;
    }
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email address
   * @param {string} resetToken - Password reset token
   * @param {string} userFirstName - User's first name for personalization
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordResetEmail(to, resetToken, userFirstName = '') {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured');
    }

    try {
      const resetUrl = `${process.env.BASE_URL || 'http://localhost:4000'}/reset-password.html?token=${resetToken}`;
      
      const mailOptions = {
        from: config.email.from,
        to: to,
        subject: 'Reset Your LocumCalc Password',
        html: this.generatePasswordResetHTML(resetUrl, userFirstName),
        text: this.generatePasswordResetText(resetUrl, userFirstName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      config.logger.info(`Password reset email sent to ${to}`, 'EmailService');
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Password reset email sent successfully'
      };
    } catch (error) {
      config.logger.error(`Failed to send password reset email to ${to}`, error, 'EmailService');
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to send password reset email'
      };
    }
  }

  /**
   * Generate HTML email template for password reset
   * @param {string} resetUrl - Password reset URL
   * @param {string} firstName - User's first name
   * @returns {string} HTML email content
   */
  generatePasswordResetHTML(resetUrl, firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                color: #2563eb;
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                background-color: #2563eb;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 500;
                text-align: center;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #1d4ed8;
            }
            .warning {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #92400e;
            }
            .footer {
                font-size: 14px;
                color: #6b7280;
                text-align: center;
                margin-top: 30px;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">LocumCalc</div>
                <p>Password Reset Request</p>
            </div>
            
            <div class="content">
                <p>Hello${firstName ? ` ${firstName}` : ''},</p>
                
                <p>We received a request to reset your password for your LocumCalc account. If you made this request, click the button below to reset your password:</p>
                
                <p style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset My Password</a>
                </p>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
                    ${resetUrl}
                </p>
                
                <div class="warning">
                    <strong>Security Notice:</strong>
                    <ul>
                        <li>This link will expire in 24 hours</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Your password won't be changed until you create a new one</li>
                    </ul>
                </div>
                
                <p>If you didn't request a password reset, you can safely ignore this email. Your account security is important to us.</p>
            </div>
            
            <div class="footer">
                <p>This email was sent by LocumCalc<br>
                If you have questions, please contact our support team.</p>
                <p>© ${new Date().getFullYear()} LocumCalc. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate plain text email template for password reset
   * @param {string} resetUrl - Password reset URL
   * @param {string} firstName - User's first name
   * @returns {string} Plain text email content
   */
  generatePasswordResetText(resetUrl, firstName) {
    return `
LocumCalc - Password Reset Request

Hello${firstName ? ` ${firstName}` : ''},

We received a request to reset your password for your LocumCalc account.

If you made this request, click the link below or copy it into your browser to reset your password:

${resetUrl}

SECURITY NOTICE:
- This link will expire in 24 hours
- If you didn't request this reset, please ignore this email
- Your password won't be changed until you create a new one

If you didn't request a password reset, you can safely ignore this email. Your account security is important to us.

---
This email was sent by LocumCalc
© ${new Date().getFullYear()} LocumCalc. All rights reserved.
    `.trim();
  }

  /**
   * Send test email to verify configuration
   * @param {string} to - Test email recipient
   * @returns {Promise<Object>} Test result
   */
  async sendTestEmail(to) {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured');
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: to,
        subject: 'LocumCalc Email Service Test',
        html: `
          <h2>Email Service Test</h2>
          <p>This is a test email to verify your LocumCalc email configuration.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        `,
        text: `
          Email Service Test
          
          This is a test email to verify your LocumCalc email configuration.
          Sent at: ${new Date().toISOString()}
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      config.logger.info(`Test email sent to ${to}`, 'EmailService');
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Test email sent successfully'
      };
    } catch (error) {
      config.logger.error(`Failed to send test email to ${to}`, error, 'EmailService');
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to send test email'
      };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;