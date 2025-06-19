import { db } from '@/lib/db'

// Enhanced lead scoring service with automation and ML-ready features
export class LeadScoringService {
  // Base scoring weights (can be adjusted via ML training)
  private static readonly SCORING_WEIGHTS = {
    source: 0.25,      // 25% weight for lead source
    engagement: 0.20,  // 20% weight for engagement metrics
    profile: 0.20,     // 20% weight for profile completeness
    message: 0.15,     // 15% weight for message quality
    calculation: 0.20, // 20% weight for calculator interaction
  }

  // Enhanced source scoring with decay factors
  private static readonly SOURCE_SCORES = {
    // High-intent sources
    calculator: { base: 95, decay: 0.95 },
    demo_request: { base: 90, decay: 0.92 },
    referral: { base: 88, decay: 0.90 },
    
    // Medium-intent sources
    contact_form: { base: 75, decay: 0.85 },
    zapier: { base: 70, decay: 0.88 },
    paid_ad: { base: 65, decay: 0.80 },
    
    // Lower-intent sources
    newsletter: { base: 45, decay: 0.75 },
    blog: { base: 40, decay: 0.70 },
    organic: { base: 35, decay: 0.72 },
    social: { base: 30, decay: 0.65 },
    website: { base: 25, decay: 0.60 },
  }

  // Industry multipliers based on demand
  private static readonly INDUSTRY_MULTIPLIERS = {
    'Healthcare': 1.2,
    'Technology': 1.15,
    'Finance': 1.1,
    'Engineering': 1.05,
    'Legal': 1.08,
    'Education': 0.95,
    'Retail': 0.85,
    'Other': 1.0,
  }

  // Time-based scoring factors
  private static readonly TIME_FACTORS = {
    PEAK_HOURS: [9, 10, 11, 14, 15, 16], // Business hours get higher scores
    PEAK_DAYS: [1, 2, 3, 4], // Monday-Thursday get higher scores
    WEEKEND_PENALTY: 0.8,
    OFF_HOURS_PENALTY: 0.9,
  }

  /**
   * Calculate comprehensive lead score with ML-ready features
   */
  static calculateLeadScore(lead: any, options: {
    includeTimeFactor?: boolean
    industryBoost?: boolean
    engagementDepth?: boolean
  } = {}): { 
    score: number
    breakdown: any
    confidence: number
    recommendations: string[]
  } {
    const { includeTimeFactor = true, industryBoost = true, engagementDepth = true } = options

    let totalScore = 0
    const breakdown = {
      source: 0,
      engagement: 0,
      profile: 0,
      message: 0,
      calculation: 0,
      bonuses: 0,
      penalties: 0,
      final: 0,
    }
    const recommendations: string[] = []

    // 1. Source Scoring with time decay
    const sourceConfig = this.SOURCE_SCORES[lead.source as keyof typeof this.SOURCE_SCORES] || this.SOURCE_SCORES.website
    const leadAge = this.calculateLeadAge(lead.createdAt)
    const decayFactor = Math.pow(sourceConfig.decay, leadAge)
    breakdown.source = Math.round(sourceConfig.base * decayFactor * this.SCORING_WEIGHTS.source)
    
    if (sourceConfig.base < 60) {
      recommendations.push(`Lead from ${lead.source} - consider follow-up within 24 hours`)
    }

    // 2. Profile Completeness
    const profileScore = this.calculateProfileCompleteness(lead)
    breakdown.profile = Math.round(profileScore * this.SCORING_WEIGHTS.profile)
    
    if (profileScore < 70) {
      recommendations.push('Incomplete profile - request additional information')
    }

    // 3. Message Quality Analysis
    const messageScore = this.analyzeMessageQuality(lead.message)
    breakdown.message = Math.round(messageScore * this.SCORING_WEIGHTS.message)
    
    if (messageScore > 80) {
      recommendations.push('High-quality message indicates serious interest')
    }

    // 4. Calculator Interaction Scoring
    const calculationScore = this.scoreCalculatorData(lead.calculationData)
    breakdown.calculation = Math.round(calculationScore * this.SCORING_WEIGHTS.calculation)

    // 5. Engagement Depth Analysis
    if (engagementDepth) {
      const engagementScore = this.analyzeEngagementDepth(lead.metadata)
      breakdown.engagement = Math.round(engagementScore * this.SCORING_WEIGHTS.engagement)
      
      if (engagementScore > 70) {
        recommendations.push('High engagement - prioritize immediate outreach')
      }
    }

    // 6. Time-based factors
    if (includeTimeFactor) {
      const timeFactor = this.calculateTimeFactor(lead.createdAt)
      breakdown.bonuses += Math.round(timeFactor * 5) // Up to 5 bonus points
    }

    // 7. Industry multiplier
    if (industryBoost && lead.metadata?.industry) {
      const industry = lead.metadata.industry
      const multiplier = this.INDUSTRY_MULTIPLIERS[industry] || 1.0
      const industryBonus = Math.round((multiplier - 1.0) * 20) // Convert to bonus points
      breakdown.bonuses += industryBonus
      
      if (multiplier > 1.1) {
        recommendations.push(`High-demand industry (${industry}) - excellent prospect`)
      }
    }

    // 8. Behavioral penalties
    if (lead.metadata?.submissionCount > 3) {
      breakdown.penalties -= 10
      recommendations.push('Multiple submissions detected - may indicate spam or desperation')
    }

    // Calculate final score
    totalScore = breakdown.source + breakdown.engagement + breakdown.profile + 
                 breakdown.message + breakdown.calculation + breakdown.bonuses + breakdown.penalties

    // Ensure score is within bounds
    totalScore = Math.max(0, Math.min(100, totalScore))
    breakdown.final = totalScore

    // Calculate confidence score based on data availability
    const confidence = this.calculateConfidence(lead)

    return {
      score: totalScore,
      breakdown,
      confidence,
      recommendations: recommendations.slice(0, 3) // Limit to top 3 recommendations
    }
  }

  /**
   * Profile completeness scoring
   */
  private static calculateProfileCompleteness(lead: any): number {
    let score = 0
    const factors = [
      { field: 'name', weight: 20, value: lead.name },
      { field: 'company', weight: 25, value: lead.company },
      { field: 'phone', weight: 20, value: lead.phone },
      { field: 'email', weight: 15, value: lead.email },
      { field: 'message', weight: 20, value: lead.message },
    ]

    factors.forEach(factor => {
      if (factor.value && factor.value.trim().length > 0) {
        score += factor.weight
      }
    })

    return score
  }

  /**
   * Advanced message quality analysis
   */
  private static analyzeMessageQuality(message?: string): number {
    if (!message || message.trim().length === 0) return 0

    let score = 0
    const cleanMessage = message.toLowerCase().trim()

    // Length scoring
    if (cleanMessage.length >= 200) score += 30
    else if (cleanMessage.length >= 100) score += 25
    else if (cleanMessage.length >= 50) score += 20
    else if (cleanMessage.length >= 10) score += 10

    // Quality indicators
    const qualityIndicators = [
      { pattern: /specific|particular|exact|precise/g, points: 5, desc: 'specificity' },
      { pattern: /experience|years|background/g, points: 8, desc: 'experience mention' },
      { pattern: /urgent|asap|immediately|soon/g, points: 10, desc: 'urgency' },
      { pattern: /budget|salary|rate|compensation/g, points: 12, desc: 'budget discussion' },
      { pattern: /when|timeline|start|available/g, points: 8, desc: 'timeline inquiry' },
      { pattern: /contract|agreement|terms/g, points: 10, desc: 'contract terms' },
      { pattern: /\?/g, points: 3, desc: 'questions asked' },
    ]

    qualityIndicators.forEach(indicator => {
      const matches = cleanMessage.match(indicator.pattern) || []
      score += Math.min(matches.length * indicator.points, indicator.points * 2)
    })

    // Professionalism indicators
    const sentences = cleanMessage.split('.').filter(s => s.trim().length > 5)
    if (sentences.length >= 3) score += 8 // Well-structured message

    // Spam penalties
    const spamPatterns = [
      /(.)\1{4,}/g, // Repeated characters
      /[A-Z]{5,}/g, // Too many capitals
      /\d{4,}/g,    // Too many numbers
    ]

    spamPatterns.forEach(pattern => {
      if (pattern.test(message)) {
        score -= 15
      }
    })

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculator interaction scoring
   */
  private static scoreCalculatorData(calculationData?: any): number {
    if (!calculationData) return 0

    let score = 40 // Base score for having calculation data

    // High-value indicators
    if (calculationData.annualSalary) {
      const salary = parseFloat(calculationData.annualSalary)
      if (salary >= 200000) score += 25
      else if (salary >= 150000) score += 20
      else if (salary >= 100000) score += 15
      else if (salary >= 75000) score += 10
    }

    // Calculation complexity indicates serious interest
    if (calculationData.overtime) score += 8
    if (calculationData.stipends) score += 8
    if (calculationData.mileage) score += 5
    if (calculationData.benefits) score += 5

    // Multiple calculations indicate high engagement
    if (calculationData.calculations?.length > 1) {
      score += Math.min(calculationData.calculations.length * 3, 15)
    }

    return Math.min(100, score)
  }

  /**
   * Engagement depth analysis
   */
  private static analyzeEngagementDepth(metadata?: any): number {
    if (!metadata) return 20 // Default baseline

    let score = 20
    
    // Session duration scoring
    if (metadata.sessionDuration) {
      const minutes = metadata.sessionDuration / 60
      if (minutes >= 10) score += 25
      else if (minutes >= 5) score += 20
      else if (minutes >= 2) score += 15
      else if (minutes >= 1) score += 10
    }

    // Page view depth
    if (metadata.pageViews) {
      if (metadata.pageViews >= 10) score += 20
      else if (metadata.pageViews >= 5) score += 15
      else if (metadata.pageViews >= 3) score += 10
    }

    // Traffic source quality
    if (metadata.utm_source) {
      const highQualitySources = ['linkedin', 'google-ads', 'referral', 'direct']
      if (highQualitySources.includes(metadata.utm_source)) {
        score += 10
      }
    }

    // Return visit bonus
    if (metadata.returnVisit) score += 15

    return Math.min(100, score)
  }

  /**
   * Time-based scoring factor
   */
  private static calculateTimeFactor(createdAt: Date): number {
    const date = new Date(createdAt)
    const hour = date.getHours()
    const day = date.getDay()

    let factor = 1.0

    // Peak hours bonus
    if (this.TIME_FACTORS.PEAK_HOURS.includes(hour)) {
      factor += 0.1
    } else {
      factor *= this.TIME_FACTORS.OFF_HOURS_PENALTY
    }

    // Peak days bonus
    if (this.TIME_FACTORS.PEAK_DAYS.includes(day)) {
      factor += 0.05
    } else if (day === 0 || day === 6) { // Weekend
      factor *= this.TIME_FACTORS.WEEKEND_PENALTY
    }

    return factor
  }

  /**
   * Calculate lead age in days
   */
  private static calculateLeadAge(createdAt: Date): number {
    const now = new Date()
    const leadDate = new Date(createdAt)
    const diffMs = now.getTime() - leadDate.getTime()
    return diffMs / (1000 * 60 * 60 * 24) // Convert to days
  }

  /**
   * Calculate confidence score based on data availability
   */
  private static calculateConfidence(lead: any): number {
    let confidence = 0
    const dataPoints = [
      { present: !!lead.name, weight: 10 },
      { present: !!lead.company, weight: 15 },
      { present: !!lead.phone, weight: 15 },
      { present: !!lead.message && lead.message.length > 20, weight: 20 },
      { present: !!lead.calculationData, weight: 25 },
      { present: !!lead.metadata?.sessionDuration, weight: 10 },
      { present: !!lead.metadata?.pageViews, weight: 5 },
    ]

    dataPoints.forEach(point => {
      if (point.present) confidence += point.weight
    })

    return confidence
  }

  /**
   * Automated scoring for batch processing
   */
  static async scoreAllUnprocessedLeads(): Promise<{
    processed: number
    updated: number
    errors: number
  }> {
    const results = { processed: 0, updated: 0, errors: 0 }

    try {
      // Find leads that haven't been scored recently or need rescoring
      const leads = await db.lead.findMany({
        where: {
          OR: [
            { score: 0 },
            { updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Older than 24 hours
          ]
        },
        take: 100, // Process in batches
      })

      for (const lead of leads) {
        try {
          const scoring = this.calculateLeadScore(lead, {
            includeTimeFactor: true,
            industryBoost: true,
            engagementDepth: true,
          })

          await db.lead.update({
            where: { id: lead.id },
            data: {
              score: scoring.score,
              metadata: {
                ...(lead.metadata as any),
                scoreBreakdown: scoring.breakdown,
                confidence: scoring.confidence,
                recommendations: scoring.recommendations,
                lastScored: new Date().toISOString(),
              },
              updatedAt: new Date(),
            },
          })

          // Send notifications for high-quality leads
          if (scoring.score >= 85 && scoring.confidence >= 80) {
            await this.sendHighQualityLeadNotification(lead, scoring)
          }

          results.updated++
        } catch (error) {
          console.error(`Failed to score lead ${lead.id}:`, error)
          results.errors++
        }

        results.processed++
      }
    } catch (error) {
      console.error('Failed to process leads batch:', error)
      results.errors++
    }

    return results
  }

  /**
   * Get scoring statistics for analysis
   */
  static async getScoringStatistics(): Promise<{
    averageScore: number
    scoreDistribution: Record<string, number>
    topSources: Array<{ source: string; avgScore: number; count: number }>
    confidenceStats: { average: number; distribution: Record<string, number> }
  }> {
    const leads = await db.lead.findMany({
      where: { score: { gt: 0 } },
      select: {
        score: true,
        source: true,
        metadata: true,
      },
    })

    const averageScore = leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length

    // Score distribution
    const scoreDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    }

    leads.forEach(lead => {
      if (lead.score <= 20) scoreDistribution['0-20']++
      else if (lead.score <= 40) scoreDistribution['21-40']++
      else if (lead.score <= 60) scoreDistribution['41-60']++
      else if (lead.score <= 80) scoreDistribution['61-80']++
      else scoreDistribution['81-100']++
    })

    // Top sources by average score
    const sourceStats = new Map<string, { total: number; count: number }>()
    leads.forEach(lead => {
      const current = sourceStats.get(lead.source) || { total: 0, count: 0 }
      current.total += lead.score
      current.count++
      sourceStats.set(lead.source, current)
    })

    const topSources = Array.from(sourceStats.entries())
      .map(([source, stats]) => ({
        source,
        avgScore: Math.round(stats.total / stats.count),
        count: stats.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10)

    // Confidence statistics
    const confidenceScores = leads
      .map(lead => (lead.metadata as any)?.confidence || 0)
      .filter(conf => conf > 0)

    const averageConfidence = confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length || 0

    const confidenceDistribution = {
      '0-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    }

    confidenceScores.forEach(conf => {
      if (conf <= 40) confidenceDistribution['0-40']++
      else if (conf <= 60) confidenceDistribution['41-60']++
      else if (conf <= 80) confidenceDistribution['61-80']++
      else confidenceDistribution['81-100']++
    })

    return {
      averageScore: Math.round(averageScore),
      scoreDistribution,
      topSources,
      confidenceStats: {
        average: Math.round(averageConfidence),
        distribution: confidenceDistribution,
      },
    }
  }

  /**
   * Send high-quality lead notification
   */
  private static async sendHighQualityLeadNotification(lead: any, scoring: any): Promise<void> {
    try {
      const { EmailService } = await import('./email-service')
      
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@locumtruerate.com'
      const salesEmail = process.env.SALES_EMAIL || 'sales@locumtruerate.com'
      
      const recipients = [adminEmail, salesEmail].filter(Boolean)
      
      for (const recipient of recipients) {
        await EmailService.sendTemplateEmail('high_quality_lead', recipient, {
          leadEmail: lead.email,
          score: scoring.score,
          source: lead.source,
          industry: lead.metadata?.industry || 'Healthcare',
          confidence: scoring.confidence,
          recommendations: scoring.recommendations,
        })
      }
    } catch (error) {
      console.error('Failed to send high-quality lead notification:', error)
    }
  }

  /**
   * Send lead scoring summary notifications
   */
  static async sendDailyScoringReport(): Promise<void> {
    try {
      const { EmailService } = await import('./email-service')
      
      // Get today's scoring statistics
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayLeads = await db.lead.findMany({
        where: {
          createdAt: { gte: today },
          score: { gt: 0 },
        },
      })

      if (todayLeads.length === 0) return

      const stats = {
        totalLeads: todayLeads.length,
        averageScore: Math.round(todayLeads.reduce((sum, lead) => sum + lead.score, 0) / todayLeads.length),
        highQualityLeads: todayLeads.filter(lead => lead.score >= 80).length,
        topSources: {} as Record<string, number>,
      }

      // Calculate source breakdown
      todayLeads.forEach(lead => {
        stats.topSources[lead.source] = (stats.topSources[lead.source] || 0) + 1
      })

      const adminEmail = process.env.ADMIN_EMAIL || 'admin@locumtruerate.com'
      
      await EmailService.sendTemplateEmail('daily_scoring_report', adminEmail, {
        date: today.toLocaleDateString(),
        stats,
        highQualityLeads: todayLeads.filter(lead => lead.score >= 80),
      })
    } catch (error) {
      console.error('Failed to send daily scoring report:', error)
    }
  }
}