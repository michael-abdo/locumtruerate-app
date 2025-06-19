import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { LeadScoringService } from '../services/lead-scoring'

// Mock database
const mockDb = {
  lead: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
  analytics: {
    create: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

describe('LeadScoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('calculateLeadScore', () => {
    it('should calculate high score for calculator lead with complete profile', () => {
      const lead = {
        source: 'calculator',
        email: 'test@company.com',
        name: 'John Doe',
        company: 'Test Company',
        phone: '+1234567890',
        message: 'I am interested in locum tenens positions in cardiology. I have 10 years of experience and am looking for contracts starting in January. My current salary expectation is around $250,000 annually. Can you help me find suitable opportunities?',
        createdAt: new Date(),
        calculationData: {
          annualSalary: 250000,
          overtime: true,
          stipends: true,
          calculations: [{ type: 'contract' }, { type: 'paycheck' }],
        },
        metadata: {
          industry: 'Healthcare',
          sessionDuration: 600, // 10 minutes
          pageViews: 8,
          utm_source: 'linkedin',
          returnVisit: true,
        },
      }

      const result = LeadScoringService.calculateLeadScore(lead, {
        includeTimeFactor: true,
        industryBoost: true,
        engagementDepth: true,
      })

      expect(result.score).toBeGreaterThan(85)
      expect(result.confidence).toBeGreaterThan(80)
      expect(result.breakdown.source).toBeGreaterThan(20)
      expect(result.breakdown.calculation).toBeGreaterThan(15)
      expect(result.breakdown.message).toBeGreaterThan(10)
      expect(result.recommendations).toHaveLength(3)
    })

    it('should calculate low score for incomplete spam-like lead', () => {
      const lead = {
        source: 'website',
        email: 'test123@email.com',
        name: '',
        company: '',
        phone: '',
        message: 'URGENT URGENT URGENT!!!!! CALL MEEEEEE 1234567890',
        createdAt: new Date(),
        calculationData: null,
        metadata: {
          submissionCount: 5,
          sessionDuration: 10, // 10 seconds
          pageViews: 1,
        },
      }

      const result = LeadScoringService.calculateLeadScore(lead, {
        includeTimeFactor: true,
        industryBoost: true,
        engagementDepth: true,
      })

      expect(result.score).toBeLessThan(30)
      expect(result.confidence).toBeLessThan(40)
      expect(result.breakdown.penalties).toBeLessThan(0)
      expect(result.recommendations).toContain('Multiple submissions detected - may indicate spam or desperation')
    })

    it('should apply time decay for old leads', () => {
      const oldLead = {
        source: 'calculator',
        email: 'test@company.com',
        name: 'John Doe',
        company: 'Test Company',
        phone: '+1234567890',
        message: 'Looking for locum opportunities',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        calculationData: { annualSalary: 150000 },
        metadata: { industry: 'Healthcare' },
      }

      const recentLead = {
        ...oldLead,
        createdAt: new Date(), // Now
      }

      const oldResult = LeadScoringService.calculateLeadScore(oldLead)
      const recentResult = LeadScoringService.calculateLeadScore(recentLead)

      expect(oldResult.score).toBeLessThan(recentResult.score)
    })

    it('should apply industry multipliers correctly', () => {
      const healthcareLead = {
        source: 'contact_form',
        email: 'doctor@hospital.com',
        name: 'Dr. Smith',
        company: 'City Hospital',
        phone: '+1234567890',
        message: 'Interested in emergency medicine positions',
        createdAt: new Date(),
        metadata: { industry: 'Healthcare' },
      }

      const retailLead = {
        ...healthcareLead,
        metadata: { industry: 'Retail' },
      }

      const healthcareResult = LeadScoringService.calculateLeadScore(healthcareLead, {
        industryBoost: true,
      })
      const retailResult = LeadScoringService.calculateLeadScore(retailLead, {
        industryBoost: true,
      })

      expect(healthcareResult.score).toBeGreaterThan(retailResult.score)
    })

    it('should detect high-quality message patterns', () => {
      const highQualityLead = {
        source: 'contact_form',
        email: 'professional@company.com',
        name: 'Dr. Professional',
        company: 'Medical Center',
        phone: '+1234567890',
        message: 'I am a board-certified cardiologist with 8 years of experience. I am looking for urgent locum tenens contracts in the Boston area. My budget expectation is $200,000 annually. When can we discuss available opportunities? I am available to start immediately.',
        createdAt: new Date(),
        metadata: {},
      }

      const lowQualityLead = {
        ...highQualityLead,
        message: 'job pls',
      }

      const highResult = LeadScoringService.calculateLeadScore(highQualityLead)
      const lowResult = LeadScoringService.calculateLeadScore(lowQualityLead)

      expect(highResult.breakdown.message).toBeGreaterThan(lowResult.breakdown.message)
      expect(highResult.recommendations).toContain('High-quality message indicates serious interest')
    })

    it('should score calculator data appropriately', () => {
      const highValueCalc = {
        source: 'calculator',
        email: 'test@company.com',
        name: 'Test User',
        message: 'Interested in positions',
        createdAt: new Date(),
        calculationData: {
          annualSalary: 250000,
          overtime: true,
          stipends: { call: 500, beeper: 200 },
          mileage: 0.65,
          benefits: true,
          calculations: [
            { type: 'contract', result: 240000 },
            { type: 'paycheck', result: 8000 },
            { type: 'comparison', result: { better: 'contract' } },
          ],
        },
      }

      const lowValueCalc = {
        ...highValueCalc,
        calculationData: {
          annualSalary: 50000,
        },
      }

      const highResult = LeadScoringService.calculateLeadScore(highValueCalc)
      const lowResult = LeadScoringService.calculateLeadScore(lowValueCalc)

      expect(highResult.breakdown.calculation).toBeGreaterThan(lowResult.breakdown.calculation)
    })

    it('should analyze engagement depth correctly', () => {
      const highEngagementLead = {
        source: 'organic',
        email: 'engaged@user.com',
        name: 'Engaged User',
        message: 'Looking for opportunities',
        createdAt: new Date(),
        metadata: {
          sessionDuration: 900, // 15 minutes
          pageViews: 15,
          utm_source: 'linkedin',
          returnVisit: true,
          referrer: 'https://linkedin.com',
        },
      }

      const lowEngagementLead = {
        ...highEngagementLead,
        metadata: {
          sessionDuration: 30, // 30 seconds
          pageViews: 1,
        },
      }

      const highResult = LeadScoringService.calculateLeadScore(highEngagementLead, {
        engagementDepth: true,
      })
      const lowResult = LeadScoringService.calculateLeadScore(lowEngagementLead, {
        engagementDepth: true,
      })

      expect(highResult.breakdown.engagement).toBeGreaterThan(lowResult.breakdown.engagement)
      expect(highResult.recommendations).toContain('High engagement - prioritize immediate outreach')
    })

    it('should apply weekend and off-hours penalties', () => {
      // Mock current time to be business hours (Tuesday 2 PM)
      const businessHours = new Date('2024-01-09T14:00:00Z') // Tuesday 2 PM
      const weekend = new Date('2024-01-07T14:00:00Z') // Sunday 2 PM
      const offHours = new Date('2024-01-09T02:00:00Z') // Tuesday 2 AM

      const baseLead = {
        source: 'contact_form',
        email: 'test@company.com',
        name: 'Test User',
        message: 'Interested in positions',
        calculationData: null,
        metadata: {},
      }

      const businessHoursResult = LeadScoringService.calculateLeadScore({
        ...baseLead,
        createdAt: businessHours,
      })

      const weekendResult = LeadScoringService.calculateLeadScore({
        ...baseLead,
        createdAt: weekend,
      })

      const offHoursResult = LeadScoringService.calculateLeadScore({
        ...baseLead,
        createdAt: offHours,
      })

      expect(businessHoursResult.score).toBeGreaterThan(weekendResult.score)
      expect(businessHoursResult.score).toBeGreaterThan(offHoursResult.score)
    })

    it('should calculate confidence based on data availability', () => {
      const completeDataLead = {
        source: 'calculator',
        email: 'complete@user.com',
        name: 'Complete User',
        company: 'Big Company',
        phone: '+1234567890',
        message: 'This is a detailed message about my interest in locum positions with specific requirements and timeline information.',
        createdAt: new Date(),
        calculationData: { annualSalary: 150000 },
        metadata: {
          sessionDuration: 300,
          pageViews: 5,
        },
      }

      const incompleteDataLead = {
        source: 'website',
        email: 'incomplete@user.com',
        createdAt: new Date(),
      }

      const completeResult = LeadScoringService.calculateLeadScore(completeDataLead)
      const incompleteResult = LeadScoringService.calculateLeadScore(incompleteDataLead)

      expect(completeResult.confidence).toBeGreaterThan(80)
      expect(incompleteResult.confidence).toBeLessThan(30)
    })
  })

  describe('scoreAllUnprocessedLeads', () => {
    it('should process leads in batches and update scores', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          source: 'calculator',
          email: 'test1@company.com',
          name: 'Test User 1',
          score: 0,
          createdAt: new Date(),
          metadata: {},
        },
        {
          id: 'lead-2',
          source: 'contact_form',
          email: 'test2@company.com',
          name: 'Test User 2',
          score: 0,
          createdAt: new Date(),
          metadata: {},
        },
      ]

      mockDb.lead.findMany.mockResolvedValue(mockLeads)
      mockDb.lead.update.mockResolvedValue({})

      const result = await LeadScoringService.scoreAllUnprocessedLeads()

      expect(result.processed).toBe(2)
      expect(result.updated).toBe(2)
      expect(result.errors).toBe(0)
      expect(mockDb.lead.update).toHaveBeenCalledTimes(2)
    })

    it('should handle errors gracefully', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          source: 'calculator',
          email: 'test1@company.com',
          score: 0,
          createdAt: new Date(),
          metadata: {},
        },
      ]

      mockDb.lead.findMany.mockResolvedValue(mockLeads)
      mockDb.lead.update.mockRejectedValue(new Error('Database error'))

      const result = await LeadScoringService.scoreAllUnprocessedLeads()

      expect(result.processed).toBe(1)
      expect(result.updated).toBe(0)
      expect(result.errors).toBe(1)
    })
  })

  describe('getScoringStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const mockLeads = [
        { score: 85, source: 'calculator', metadata: { confidence: 90 } },
        { score: 65, source: 'contact_form', metadata: { confidence: 75 } },
        { score: 45, source: 'website', metadata: { confidence: 60 } },
        { score: 25, source: 'website', metadata: { confidence: 40 } },
      ]

      mockDb.lead.findMany.mockResolvedValue(mockLeads)

      const stats = await LeadScoringService.getScoringStatistics()

      expect(stats.averageScore).toBe(55) // (85+65+45+25)/4
      expect(stats.scoreDistribution['0-20']).toBe(0)
      expect(stats.scoreDistribution['21-40']).toBe(1)
      expect(stats.scoreDistribution['41-60']).toBe(1)
      expect(stats.scoreDistribution['61-80']).toBe(1)
      expect(stats.scoreDistribution['81-100']).toBe(1)
      expect(stats.topSources[0].source).toBe('calculator')
      expect(stats.topSources[0].avgScore).toBe(85)
      expect(stats.confidenceStats.average).toBe(66) // (90+75+60+40)/4
    })

    it('should handle empty data gracefully', async () => {
      mockDb.lead.findMany.mockResolvedValue([])

      const stats = await LeadScoringService.getScoringStatistics()

      expect(stats.averageScore).toBe(0)
      expect(stats.topSources).toHaveLength(0)
      expect(stats.confidenceStats.average).toBe(0)
    })
  })

  describe('edge cases and validation', () => {
    it('should handle leads with null/undefined values', () => {
      const lead = {
        source: 'unknown_source',
        email: null,
        name: null,
        company: null,
        phone: null,
        message: null,
        createdAt: new Date(),
        calculationData: null,
        metadata: null,
      }

      const result = LeadScoringService.calculateLeadScore(lead)

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.breakdown).toBeDefined()
    })

    it('should ensure scores are bounded between 0 and 100', () => {
      const extremeLead = {
        source: 'calculator',
        email: 'test@company.com',
        name: 'Test User',
        company: 'Test Company',
        phone: '+1234567890',
        message: 'A'.repeat(1000), // Very long message
        createdAt: new Date(),
        calculationData: {
          annualSalary: 1000000, // Very high salary
          overtime: true,
          stipends: true,
          calculations: Array(20).fill({ type: 'contract' }), // Many calculations
        },
        metadata: {
          industry: 'Healthcare',
          sessionDuration: 3600, // 1 hour
          pageViews: 100,
          submissionCount: 1,
        },
      }

      const result = LeadScoringService.calculateLeadScore(extremeLead)

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should generate actionable recommendations', () => {
      const lowQualityLead = {
        source: 'website',
        email: 'incomplete@user.com',
        name: '',
        company: '',
        phone: '',
        message: 'hi',
        createdAt: new Date(),
        calculationData: null,
        metadata: {},
      }

      const result = LeadScoringService.calculateLeadScore(lowQualityLead)

      expect(result.recommendations).toHaveLength(3)
      expect(result.recommendations.some(rec => rec.includes('follow-up'))).toBe(true)
      expect(result.recommendations.some(rec => rec.includes('profile'))).toBe(true)
    })
  })
})