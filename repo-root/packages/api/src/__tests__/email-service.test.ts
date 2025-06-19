import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { EmailService } from '../services/email-service'

// Mock SendGrid
const mockSend = vi.fn()
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: mockSend,
  },
}))

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock environment variables
    process.env.SENDGRID_API_KEY = 'test-key'
    process.env.EMAIL_FROM = 'test@locumtruerate.com'
    process.env.EMAIL_FROM_NAME = 'LocumTrueRate Test'
    process.env.EMAIL_REPLY_TO = 'support@locumtruerate.com'
    process.env.API_URL = 'https://test.locumtruerate.com'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sendTemplateEmail', () => {
    it('should send welcome email successfully', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'test-message-id' } }])

      const result = await EmailService.sendTemplateEmail('welcome', 'test@example.com', {
        name: 'John Doe',
        userType: 'recruiter',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-message-id')
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          from: 'LocumTrueRate Test <test@locumtruerate.com>',
          subject: 'Welcome to LocumTrueRate Test!',
          html: expect.stringContaining('Welcome to LocumTrueRate Test!'),
          text: expect.stringContaining('Welcome to LocumTrueRate Test!'),
        })
      )
    })

    it('should send job boost confirmation email', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'boost-message-id' } }])

      const result = await EmailService.sendTemplateEmail('job_boost_confirmation', 'employer@example.com', {
        jobTitle: 'Emergency Medicine Physician',
        boostType: 'featured',
        amount: 2999,
        expiresAt: new Date('2024-12-31'),
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'employer@example.com',
          subject: 'Job Boost Activated - Emergency Medicine Physician',
          html: expect.stringContaining('🚀 Job Boost Activated!'),
        })
      )
    })

    it('should send lead purchase confirmation email', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'lead-message-id' } }])

      const result = await EmailService.sendTemplateEmail('lead_purchase_confirmation', 'recruiter@example.com', {
        purchaseId: 'purchase_123',
        amount: 4999,
        leadPreview: {
          industry: 'Healthcare',
          location: 'New York',
          source: 'calculator',
          score: 85,
        },
        purchaseDate: new Date(),
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recruiter@example.com',
          subject: 'Lead Purchase Confirmation - LocumTrueRate',
          html: expect.stringContaining('Purchase Confirmed!'),
        })
      )
    })

    it('should send job application status update email', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'status-message-id' } }])

      const result = await EmailService.sendTemplateEmail('job_application_status', 'applicant@example.com', {
        jobTitle: 'Cardiology Locum Position',
        status: 'accepted',
        applicantName: 'Dr. Smith',
        companyName: 'City Hospital',
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'applicant@example.com',
          subject: 'Application Update - Cardiology Locum Position',
          html: expect.stringContaining('Congratulations! Your application has been accepted'),
        })
      )
    })

    it('should send high quality lead alert', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'alert-message-id' } }])

      const result = await EmailService.sendTemplateEmail('high_quality_lead', 'sales@example.com', {
        leadEmail: 'doctor@hospital.com',
        score: 95,
        source: 'calculator',
        industry: 'Healthcare',
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sales@example.com',
          subject: '🔥 High Quality Lead Alert - 95/100',
          html: expect.stringContaining('🔥 HIGH QUALITY LEAD!'),
        })
      )
    })

    it('should send support ticket created email', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'ticket-message-id' } }])

      const result = await EmailService.sendTemplateEmail('support_ticket_created', 'user@example.com', {
        ticketNumber: 'TICKET-12345',
        subject: 'Unable to calculate salary',
        userName: 'John Doe',
        priority: 'high',
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Support Ticket Created - #TICKET-12345',
          html: expect.stringContaining('🎫 Support Ticket Created'),
        })
      )
    })

    it('should send password reset email', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'reset-message-id' } }])

      const resetLink = 'https://test.locumtruerate.com/reset-password?token=abc123'
      const result = await EmailService.sendTemplateEmail('password_reset', 'user@example.com', {
        resetLink,
        userName: 'John Doe',
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Password Reset Request - LocumTrueRate',
          html: expect.stringContaining('🔒 Password Reset'),
          text: expect.stringContaining(resetLink),
        })
      )
    })

    it('should handle unknown template gracefully', async () => {
      const result = await EmailService.sendTemplateEmail('unknown_template', 'test@example.com', {})

      expect(result.success).toBe(false)
      expect(result.error).toBe("Template 'unknown_template' not found")
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should handle SendGrid errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('SendGrid API error'))

      const result = await EmailService.sendTemplateEmail('welcome', 'test@example.com', {
        name: 'John Doe',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('SendGrid API error')
    })

    it('should handle missing SendGrid API key', async () => {
      delete process.env.SENDGRID_API_KEY

      const result = await EmailService.sendTemplateEmail('welcome', 'test@example.com', {
        name: 'John Doe',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('SendGrid not configured')
      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe('sendDynamicTemplateEmail', () => {
    it('should send dynamic template email successfully', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'dynamic-message-id' } }])

      const result = await EmailService.sendDynamicTemplateEmail(
        'd-template123',
        'test@example.com',
        { name: 'John Doe' }
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('dynamic-message-id')
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          templateId: 'd-template123',
          dynamicTemplateData: expect.objectContaining({
            name: 'John Doe',
            company_name: 'LocumTrueRate Test',
            support_email: 'support@locumtruerate.com',
          }),
        })
      )
    })

    it('should handle dynamic template errors', async () => {
      mockSend.mockRejectedValue(new Error('Template not found'))

      const result = await EmailService.sendDynamicTemplateEmail(
        'd-invalid',
        'test@example.com',
        {}
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Template not found')
    })
  })

  describe('sendEmail', () => {
    it('should send plain email successfully', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'plain-message-id' } }])

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>',
        text: 'Test text',
      }

      const result = await EmailService.sendEmail(emailData)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('plain-message-id')
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ...emailData,
          from: 'LocumTrueRate Test <test@locumtruerate.com>',
          replyTo: 'support@locumtruerate.com',
          trackingSettings: {
            clickTracking: { enable: true },
            openTracking: { enable: true },
          },
        })
      )
    })

    it('should respect tracking options', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'tracking-message-id' } }])

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>',
      }

      await EmailService.sendEmail(emailData, {
        trackOpens: false,
        trackClicks: false,
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          trackingSettings: {
            clickTracking: { enable: false },
            openTracking: { enable: false },
          },
        })
      )
    })
  })

  describe('template content validation', () => {
    it('should include all required template variables in welcome email', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'test-id' } }])

      await EmailService.sendTemplateEmail('welcome', 'test@example.com', {
        name: 'John Doe',
        userType: 'recruiter',
      })

      const sentEmail = mockSend.mock.calls[0][0]
      expect(sentEmail.html).toContain('John Doe')
      expect(sentEmail.html).toContain('recruiter')
      expect(sentEmail.html).toContain('dashboard')
      expect(sentEmail.text).toContain('John Doe')
    })

    it('should handle missing template data gracefully', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'test-id' } }])

      await EmailService.sendTemplateEmail('welcome', 'test@example.com', {})

      const sentEmail = mockSend.mock.calls[0][0]
      expect(sentEmail.html).toContain('Hi there!')
      expect(sentEmail.text).toContain('Hi there!')
    })

    it('should format monetary amounts correctly', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'test-id' } }])

      await EmailService.sendTemplateEmail('lead_purchase_confirmation', 'test@example.com', {
        purchaseId: 'test-123',
        amount: 4999, // cents
        leadPreview: {},
        purchaseDate: new Date(),
      })

      const sentEmail = mockSend.mock.calls[0][0]
      expect(sentEmail.html).toContain('$49.99')
    })

    it('should format dates correctly', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'test-id' } }])

      const testDate = new Date('2024-12-25')
      await EmailService.sendTemplateEmail('job_boost_confirmation', 'test@example.com', {
        jobTitle: 'Test Job',
        boostType: 'featured',
        amount: 2999,
        expiresAt: testDate,
      })

      const sentEmail = mockSend.mock.calls[0][0]
      expect(sentEmail.html).toContain(testDate.toLocaleDateString())
    })
  })

  describe('email security and validation', () => {
    it('should include unsubscribe URL in dynamic templates', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'test-id' } }])

      await EmailService.sendDynamicTemplateEmail(
        'd-template123',
        'test@example.com',
        { name: 'John' }
      )

      const sentEmail = mockSend.mock.calls[0][0]
      expect(sentEmail.dynamicTemplateData.unsubscribe_url).toContain('unsubscribe')
      expect(sentEmail.dynamicTemplateData.unsubscribe_url).toContain('test@example.com')
    })

    it('should include reply-to header', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'test-id' } }])

      await EmailService.sendTemplateEmail('welcome', 'test@example.com', {})

      const sentEmail = mockSend.mock.calls[0][0]
      expect(sentEmail.replyTo).toBe('support@locumtruerate.com')
    })

    it('should enable tracking by default', async () => {
      mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'test-id' } }])

      await EmailService.sendTemplateEmail('welcome', 'test@example.com', {})

      const sentEmail = mockSend.mock.calls[0][0]
      expect(sentEmail.trackingSettings.clickTracking.enable).toBe(true)
      expect(sentEmail.trackingSettings.openTracking.enable).toBe(true)
    })
  })
})