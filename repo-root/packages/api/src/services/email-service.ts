import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Email template types
export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailData {
  to: string
  from?: string
  subject: string
  html: string
  text?: string
  templateId?: string
  dynamicTemplateData?: Record<string, any>
}

/**
 * Enhanced email service with template support and tracking
 */
export class EmailService {
  private static readonly DEFAULT_FROM = process.env.EMAIL_FROM || 'noreply@locumtruerate.com'
  private static readonly DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'LocumTrueRate'
  private static readonly REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@locumtruerate.com'

  /**
   * Send email using template
   */
  static async sendTemplateEmail(
    template: string,
    to: string,
    data: Record<string, any>,
    options?: {
      from?: string
      replyTo?: string
      trackOpens?: boolean
      trackClicks?: boolean
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const templateConfig = this.getTemplate(template, data)
      if (!templateConfig) {
        return { success: false, error: `Template '${template}' not found` }
      }

      const emailData: EmailData = {
        to,
        from: options?.from || `${this.DEFAULT_FROM_NAME} <${this.DEFAULT_FROM}>`,
        subject: templateConfig.subject,
        html: templateConfig.html,
        text: templateConfig.text,
      }

      const result = await this.sendEmail(emailData, options)
      return result
    } catch (error) {
      console.error('Failed to send template email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Send email using SendGrid dynamic template
   */
  static async sendDynamicTemplateEmail(
    templateId: string,
    to: string,
    dynamicData: Record<string, any>,
    options?: {
      from?: string
      replyTo?: string
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('SendGrid API key not configured, email not sent')
        return { success: false, error: 'SendGrid not configured' }
      }

      const msg = {
        to,
        from: options?.from || `${this.DEFAULT_FROM_NAME} <${this.DEFAULT_FROM}>`,
        replyTo: options?.replyTo || this.REPLY_TO,
        templateId,
        dynamicTemplateData: {
          ...dynamicData,
          company_name: this.DEFAULT_FROM_NAME,
          support_email: this.REPLY_TO,
          unsubscribe_url: `${process.env.API_URL}/unsubscribe?email=${encodeURIComponent(to)}`,
        },
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      }

      const response = await sgMail.send(msg)
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || 'unknown',
      }
    } catch (error) {
      console.error('Failed to send dynamic template email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Send plain email
   */
  static async sendEmail(
    emailData: EmailData,
    options?: {
      trackOpens?: boolean
      trackClicks?: boolean
      replyTo?: string
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('SendGrid API key not configured, email not sent')
        return { success: false, error: 'SendGrid not configured' }
      }

      const msg = {
        ...emailData,
        from: emailData.from || `${this.DEFAULT_FROM_NAME} <${this.DEFAULT_FROM}>`,
        replyTo: options?.replyTo || this.REPLY_TO,
        trackingSettings: {
          clickTracking: { enable: options?.trackClicks ?? true },
          openTracking: { enable: options?.trackOpens ?? true },
        },
      }

      const response = await sgMail.send(msg)
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || 'unknown',
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get email template
   */
  private static getTemplate(templateName: string, data: Record<string, any>): EmailTemplate | null {
    const templates = {
      'welcome': this.getWelcomeTemplate(data),
      'lead_purchase_confirmation': this.getLeadPurchaseConfirmationTemplate(data),
      'lead_purchase_notification': this.getLeadPurchaseNotificationTemplate(data),
      'job_boost_confirmation': this.getJobBoostConfirmationTemplate(data),
      'job_application_received': this.getJobApplicationReceivedTemplate(data),
      'job_application_status': this.getJobApplicationStatusTemplate(data),
      'password_reset': this.getPasswordResetTemplate(data),
      'lead_scored': this.getLeadScoredTemplate(data),
      'high_quality_lead': this.getHighQualityLeadTemplate(data),
      'support_ticket_created': this.getSupportTicketCreatedTemplate(data),
      'support_ticket_resolved': this.getSupportTicketResolvedTemplate(data),
    }

    return templates[templateName as keyof typeof templates] || null
  }

  /**
   * Welcome email template
   */
  private static getWelcomeTemplate(data: Record<string, any>): EmailTemplate {
    const { name, userType = 'user' } = data

    return {
      subject: `Welcome to ${this.DEFAULT_FROM_NAME}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${this.DEFAULT_FROM_NAME}!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name || 'there'}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Welcome to LocumTrueRate.com! We're excited to help you navigate the world of locum tenens with our comprehensive platform.
            </p>
            
            ${userType === 'recruiter' ? `
              <h3 style="color: #333; margin: 30px 0 15px;">As a recruiter, you can:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Post job listings with our boost feature for maximum visibility</li>
                <li>Access our lead marketplace to find qualified candidates</li>
                <li>Use our contract calculator to help candidates understand compensation</li>
                <li>Manage applications and track candidate engagement</li>
              </ul>
            ` : `
              <h3 style="color: #333; margin: 30px 0 15px;">Getting started:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Use our contract calculator to evaluate job offers</li>
                <li>Browse locum tenens opportunities</li>
                <li>Apply to positions that match your criteria</li>
                <li>Track your applications and responses</li>
              </ul>
            `}
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.API_URL}/dashboard" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions, don't hesitate to reach out to our support team at 
              <a href="mailto:${this.REPLY_TO}" style="color: #667eea;">${this.REPLY_TO}</a>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>© ${new Date().getFullYear()} ${this.DEFAULT_FROM_NAME}. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Welcome to ${this.DEFAULT_FROM_NAME}!\n\nHi ${name || 'there'}!\n\nWelcome to LocumTrueRate.com! We're excited to help you navigate the world of locum tenens.\n\nGet started: ${process.env.API_URL}/dashboard\n\nQuestions? Contact us at ${this.REPLY_TO}`
    }
  }

  /**
   * Lead purchase confirmation template
   */
  private static getLeadPurchaseConfirmationTemplate(data: Record<string, any>): EmailTemplate {
    const { purchaseId, amount, leadPreview, purchaseDate } = data

    return {
      subject: 'Lead Purchase Confirmation - LocumTrueRate',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">Thank you for your purchase</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Purchase Details</h3>
              <p><strong>Purchase ID:</strong> ${purchaseId}</p>
              <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)}</p>
              <p><strong>Date:</strong> ${new Date(purchaseDate).toLocaleDateString()}</p>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Lead Information</h3>
              <p><strong>Industry:</strong> ${leadPreview?.industry || 'Healthcare'}</p>
              <p><strong>Location:</strong> ${leadPreview?.location || 'United States'}</p>
              <p><strong>Source:</strong> ${leadPreview?.source || 'Website'}</p>
              <p><strong>Quality Score:</strong> ${leadPreview?.score || 'N/A'}/100</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.API_URL}/recruiter/leads" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Lead Details
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              You can now access the full lead information including contact details in your recruiter dashboard.
            </p>
          </div>
        </div>
      `,
      text: `Lead Purchase Confirmed!\n\nPurchase ID: ${purchaseId}\nAmount: $${(amount / 100).toFixed(2)}\n\nView your purchased leads: ${process.env.API_URL}/recruiter/leads`
    }
  }

  /**
   * Lead purchase notification template (for internal team)
   */
  private static getLeadPurchaseNotificationTemplate(data: Record<string, any>): EmailTemplate {
    const { purchaseId, amount, buyerInfo, leadInfo } = data

    return {
      subject: `New Lead Purchase - $${(amount / 100).toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #17a2b8; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Lead Purchase</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">Purchase Details</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Purchase ID:</strong> ${purchaseId}</p>
              <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)}</p>
              <p><strong>Buyer:</strong> ${buyerInfo?.email || 'Unknown'}</p>
              <p><strong>Lead ID:</strong> ${leadInfo?.id || 'Unknown'}</p>
              <p><strong>Lead Source:</strong> ${leadInfo?.source || 'Unknown'}</p>
              <p><strong>Lead Score:</strong> ${leadInfo?.score || 'N/A'}/100</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.API_URL}/admin/lead-marketplace" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View in Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
      text: `New Lead Purchase\n\nPurchase ID: ${purchaseId}\nAmount: $${(amount / 100).toFixed(2)}\nBuyer: ${buyerInfo?.email}\n\nView details: ${process.env.API_URL}/admin/lead-marketplace`
    }
  }

  /**
   * Job boost confirmation template
   */
  private static getJobBoostConfirmationTemplate(data: Record<string, any>): EmailTemplate {
    const { jobTitle, boostType, amount, expiresAt } = data

    return {
      subject: `Job Boost Activated - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ffc107; padding: 30px 20px; text-align: center;">
            <h1 style="color: #212529; margin: 0;">🚀 Job Boost Activated!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">Your job is now boosted</h2>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">${jobTitle}</h3>
              <p><strong>Boost Type:</strong> ${boostType}</p>
              <p><strong>Amount Paid:</strong> $${(amount / 100).toFixed(2)}</p>
              <p><strong>Expires:</strong> ${new Date(expiresAt).toLocaleDateString()}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Your job listing is now featured prominently and will receive increased visibility. 
              Boosted jobs typically receive 3-5x more views and applications.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.API_URL}/admin/jobs" 
                 style="background: #ffc107; color: #212529; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Job Performance
              </a>
            </div>
          </div>
        </div>
      `,
      text: `Job Boost Activated!\n\n${jobTitle}\nBoost Type: ${boostType}\nAmount: $${(amount / 100).toFixed(2)}\nExpires: ${new Date(expiresAt).toLocaleDateString()}\n\nView performance: ${process.env.API_URL}/admin/jobs`
    }
  }

  /**
   * Job application received template
   */
  private static getJobApplicationReceivedTemplate(data: Record<string, any>): EmailTemplate {
    const { jobTitle, applicantName, applicantEmail, applicationDate } = data

    return {
      subject: `New Application Received - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">📋 New Application</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">You've received a new application</h2>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #155724; margin-top: 0;">${jobTitle}</h3>
              <p><strong>Applicant:</strong> ${applicantName}</p>
              <p><strong>Email:</strong> ${applicantEmail}</p>
              <p><strong>Applied:</strong> ${new Date(applicationDate).toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.API_URL}/admin/applications" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review Application
              </a>
            </div>
          </div>
        </div>
      `,
      text: `New Application Received\n\nJob: ${jobTitle}\nApplicant: ${applicantName} (${applicantEmail})\nDate: ${new Date(applicationDate).toLocaleDateString()}\n\nReview: ${process.env.API_URL}/admin/applications`
    }
  }

  /**
   * Job application status template
   */
  private static getJobApplicationStatusTemplate(data: Record<string, any>): EmailTemplate {
    const { jobTitle, status, applicantName, companyName } = data

    const statusConfig = {
      'reviewed': { color: '#17a2b8', message: 'Your application has been reviewed' },
      'shortlisted': { color: '#ffc107', message: 'You have been shortlisted' },
      'accepted': { color: '#28a745', message: 'Congratulations! Your application has been accepted' },
      'rejected': { color: '#dc3545', message: 'Thank you for your interest' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.reviewed

    return {
      subject: `Application Update - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${config.color}; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Application Update</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">Hi ${applicantName},</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              ${config.message} for the position:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.color};">
              <h3 style="color: #333; margin-top: 0;">${jobTitle}</h3>
              <p><strong>Company:</strong> ${companyName || 'LocumTrueRate Partner'}</p>
              <p><strong>Status:</strong> ${status.replace('_', ' ').toUpperCase()}</p>
            </div>
            
            ${status === 'accepted' ? `
              <p style="color: #666; line-height: 1.6;">
                We'll be in touch soon with next steps. Please keep an eye on your email for further instructions.
              </p>
            ` : status === 'rejected' ? `
              <p style="color: #666; line-height: 1.6;">
                While this particular opportunity wasn't a match, we encourage you to continue applying to other positions on our platform.
              </p>
            ` : `
              <p style="color: #666; line-height: 1.6;">
                We'll update you as the hiring process progresses. Thank you for your patience.
              </p>
            `}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.API_URL}/profile/applications" 
                 style="background: ${config.color}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View All Applications
              </a>
            </div>
          </div>
        </div>
      `,
      text: `Application Update\n\n${config.message} for ${jobTitle}\nStatus: ${status.toUpperCase()}\n\nView applications: ${process.env.API_URL}/profile/applications`
    }
  }

  /**
   * Password reset template
   */
  private static getPasswordResetTemplate(data: Record<string, any>): EmailTemplate {
    const { resetLink, userName } = data

    return {
      subject: 'Password Reset Request - LocumTrueRate',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔒 Password Reset</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">Hi ${userName || 'there'},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetLink}" 
                 style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              This link will expire in 1 hour for security reasons. If you didn't request this reset, you can safely ignore this email.
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #007bff; word-break: break-all;">${resetLink}</a>
            </p>
          </div>
        </div>
      `,
      text: `Password Reset Request\n\nHi ${userName || 'there'},\n\nClick this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`
    }
  }

  /**
   * Lead scored notification template
   */
  private static getLeadScoredTemplate(data: Record<string, any>): EmailTemplate {
    const { leadEmail, score, confidence, recommendations } = data

    return {
      subject: `New Lead Scored: ${score}/100 - ${leadEmail}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #6f42c1; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎯 Lead Scored</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">New lead automatically scored</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Lead:</strong> ${leadEmail}</p>
              <p><strong>Score:</strong> ${score}/100</p>
              <p><strong>Confidence:</strong> ${confidence}%</p>
            </div>
            
            ${recommendations && recommendations.length > 0 ? `
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Recommendations:</h3>
                <ul style="color: #666;">
                  ${recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.API_URL}/admin/leads" 
                 style="background: #6f42c1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Lead Details
              </a>
            </div>
          </div>
        </div>
      `,
      text: `New Lead Scored\n\nLead: ${leadEmail}\nScore: ${score}/100\nConfidence: ${confidence}%\n\nView details: ${process.env.API_URL}/admin/leads`
    }
  }

  /**
   * High quality lead notification template
   */
  private static getHighQualityLeadTemplate(data: Record<string, any>): EmailTemplate {
    const { leadEmail, score, source, industry } = data

    return {
      subject: `🔥 High Quality Lead Alert - ${score}/100`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔥 HIGH QUALITY LEAD!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">Immediate attention recommended</h2>
            
            <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
              <h3 style="color: #e53e3e; margin-top: 0;">Lead Details</h3>
              <p><strong>Email:</strong> ${leadEmail}</p>
              <p><strong>Score:</strong> ${score}/100</p>
              <p><strong>Source:</strong> ${source}</p>
              <p><strong>Industry:</strong> ${industry || 'Healthcare'}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-weight: bold;">
              This lead scored exceptionally high (${score}/100) and should be contacted immediately for best conversion rates.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.API_URL}/admin/leads" 
                 style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Contact Lead Now
              </a>
            </div>
          </div>
        </div>
      `,
      text: `HIGH QUALITY LEAD ALERT!\n\nLead: ${leadEmail}\nScore: ${score}/100\nSource: ${source}\n\nContact immediately: ${process.env.API_URL}/admin/leads`
    }
  }

  /**
   * Support ticket created template
   */
  private static getSupportTicketCreatedTemplate(data: Record<string, any>): EmailTemplate {
    const { ticketNumber, subject, userName, priority } = data

    return {
      subject: `Support Ticket Created - #${ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #17a2b8; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎫 Support Ticket Created</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">Hi ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              We've received your support request. Here are the details:
            </p>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Ticket #:</strong> ${ticketNumber}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Priority:</strong> ${priority}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Our support team will review your request and respond as soon as possible. 
              You'll receive updates via email as we work on your ticket.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.API_URL}/support" 
                 style="background: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Ticket Status
              </a>
            </div>
          </div>
        </div>
      `,
      text: `Support Ticket Created\n\nTicket #: ${ticketNumber}\nSubject: ${subject}\nPriority: ${priority}\n\nView status: ${process.env.API_URL}/support`
    }
  }

  /**
   * Support ticket resolved template
   */
  private static getSupportTicketResolvedTemplate(data: Record<string, any>): EmailTemplate {
    const { ticketNumber, subject, userName, resolution } = data

    return {
      subject: `Support Ticket Resolved - #${ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Ticket Resolved</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333;">Hi ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Good news! Your support ticket has been resolved.
            </p>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Ticket #:</strong> ${ticketNumber}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            
            ${resolution ? `
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Resolution:</h3>
                <p style="color: #666; line-height: 1.6;">${resolution}</p>
              </div>
            ` : ''}
            
            <p style="color: #666; line-height: 1.6;">
              If you need further assistance or have any questions about this resolution, 
              please don't hesitate to create a new support ticket.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.API_URL}/support" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visit Support Center
              </a>
            </div>
          </div>
        </div>
      `,
      text: `Support Ticket Resolved\n\nTicket #: ${ticketNumber}\nSubject: ${subject}\n\n${resolution ? `Resolution: ${resolution}\n\n` : ''}Visit support: ${process.env.API_URL}/support`
    }
  }
}

// Export convenience functions
export const sendWelcomeEmail = (to: string, data: Record<string, any>) =>
  EmailService.sendTemplateEmail('welcome', to, data)

export const sendLeadPurchaseConfirmation = (to: string, data: Record<string, any>) =>
  EmailService.sendTemplateEmail('lead_purchase_confirmation', to, data)

export const sendJobBoostConfirmation = (to: string, data: Record<string, any>) =>
  EmailService.sendTemplateEmail('job_boost_confirmation', to, data)

export const sendPasswordReset = (to: string, data: Record<string, any>) =>
  EmailService.sendTemplateEmail('password_reset', to, data)

export const sendHighQualityLeadAlert = (to: string, data: Record<string, any>) =>
  EmailService.sendTemplateEmail('high_quality_lead', to, data)