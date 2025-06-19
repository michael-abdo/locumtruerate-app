import { LeadScoringService } from './lead-scoring'
import { db } from '@/lib/db'

/**
 * Automated background jobs for lead management and scoring
 */
export class CronJobService {
  private static isRunning = false
  private static intervals: NodeJS.Timeout[] = []

  /**
   * Start all automated jobs
   */
  static startAutomatedJobs(): void {
    if (this.isRunning) {
      console.log('Cron jobs already running')
      return
    }

    console.log('Starting automated lead scoring jobs...')
    this.isRunning = true

    // Lead scoring automation - every 30 minutes
    const scoringInterval = setInterval(async () => {
      await this.runLeadScoringJob()
    }, 30 * 60 * 1000)

    // Lead age scoring update - every 6 hours
    const ageUpdateInterval = setInterval(async () => {
      await this.updateLeadAgeScoring()
    }, 6 * 60 * 60 * 1000)

    // Stale lead cleanup - daily at 3 AM
    const cleanupInterval = setInterval(async () => {
      const now = new Date()
      if (now.getHours() === 3) {
        await this.cleanupStaleLeads()
      }
    }, 60 * 60 * 1000) // Check every hour

    // Lead marketplace auto-listing - every 2 hours
    const autoListingInterval = setInterval(async () => {
      await this.autoCreateHighQualityListings()
    }, 2 * 60 * 60 * 1000)

    this.intervals.push(scoringInterval, ageUpdateInterval, cleanupInterval, autoListingInterval)
    console.log('All automated jobs started successfully')
  }

  /**
   * Stop all automated jobs
   */
  static stopAutomatedJobs(): void {
    console.log('Stopping automated jobs...')
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
    this.isRunning = false
    console.log('All automated jobs stopped')
  }

  /**
   * Run lead scoring automation
   */
  private static async runLeadScoringJob(): Promise<void> {
    try {
      console.log('Starting automated lead scoring...')
      const startTime = Date.now()
      
      const results = await LeadScoringService.scoreAllUnprocessedLeads()
      
      const duration = Date.now() - startTime
      console.log(`Lead scoring completed in ${duration}ms:`, {
        processed: results.processed,
        updated: results.updated,
        errors: results.errors,
      })

      // Log performance metrics
      await this.logJobPerformance('lead_scoring', duration, results)

    } catch (error) {
      console.error('Lead scoring job failed:', error)
      await this.logJobError('lead_scoring', error)
    }
  }

  /**
   * Update lead scores based on age decay
   */
  private static async updateLeadAgeScoring(): Promise<void> {
    try {
      console.log('Updating lead age scoring...')
      const startTime = Date.now()

      // Find leads older than 3 days that haven't been updated recently
      const staleLeads = await db.lead.findMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Older than 3 days
          },
          updatedAt: {
            lt: new Date(Date.now() - 6 * 60 * 60 * 1000), // Not updated in 6 hours
          },
          score: { gt: 0 }, // Has been scored before
        },
        take: 50,
      })

      let updated = 0
      for (const lead of staleLeads) {
        try {
          const newScoring = LeadScoringService.calculateLeadScore(lead, {
            includeTimeFactor: true,
            industryBoost: true,
            engagementDepth: true,
          })

          // Only update if score has changed significantly (>5 points)
          if (Math.abs(newScoring.score - lead.score) > 5) {
            await db.lead.update({
              where: { id: lead.id },
              data: {
                score: newScoring.score,
                metadata: {
                  ...(lead.metadata as any),
                  scoreBreakdown: newScoring.breakdown,
                  lastAgeUpdate: new Date().toISOString(),
                },
                updatedAt: new Date(),
              },
            })
            updated++
          }
        } catch (error) {
          console.error(`Failed to update lead ${lead.id}:`, error)
        }
      }

      const duration = Date.now() - startTime
      console.log(`Lead age scoring updated in ${duration}ms: ${updated} leads updated`)

    } catch (error) {
      console.error('Lead age scoring job failed:', error)
      await this.logJobError('lead_age_scoring', error)
    }
  }

  /**
   * Cleanup stale leads and expired listings
   */
  private static async cleanupStaleLeads(): Promise<void> {
    try {
      console.log('Starting stale lead cleanup...')
      const startTime = Date.now()

      // Remove very old, low-quality leads (older than 90 days, score < 30)
      const deleteResult = await db.lead.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
          score: { lt: 30 },
          status: 'new', // Only delete uncontacted leads
        },
      })

      // Mark expired marketplace listings as unavailable
      const expiredListings = await db.leadListing.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isAvailable: true,
        },
        data: { isAvailable: false },
      })

      const duration = Date.now() - startTime
      console.log(`Cleanup completed in ${duration}ms:`, {
        deletedLeads: deleteResult.count,
        expiredListings: expiredListings.count,
      })

    } catch (error) {
      console.error('Cleanup job failed:', error)
      await this.logJobError('cleanup', error)
    }
  }

  /**
   * Automatically create marketplace listings for high-quality leads
   */
  private static async autoCreateHighQualityListings(): Promise<void> {
    try {
      console.log('Starting auto-listing job...')
      const startTime = Date.now()

      // Find high-quality leads that aren't already listed
      const candidates = await db.lead.findMany({
        where: {
          score: { gte: 70 }, // High-quality leads only
          status: 'new',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
          },
          listing: null, // Not already listed
        },
        take: 10,
      })

      let created = 0
      for (const lead of candidates) {
        try {
          // Determine listing category based on score
          let priceCategory = 'standard'
          let basePrice = 2500 // $25.00
          
          if (lead.score >= 90) {
            priceCategory = 'hot_lead'
            basePrice = 7500 // $75.00
          } else if (lead.score >= 80) {
            priceCategory = 'premium'
            basePrice = 5000 // $50.00
          }

          // Calculate dynamic price based on scoring
          const scoring = LeadScoringService.calculateLeadScore(lead)
          const dynamicPrice = Math.max(basePrice, Math.round(scoring.score * 100))

          await db.leadListing.create({
            data: {
              leadId: lead.id,
              basePrice,
              currentPrice: dynamicPrice,
              priceCategory,
              maxPurchases: lead.score >= 85 ? 3 : 1, // Allow multiple purchases for very high quality
              industry: lead.metadata?.industry || 'Healthcare',
              location: lead.metadata?.location || 'United States',
              experience: lead.metadata?.experience || 'Not specified',
              previewData: {
                industry: lead.metadata?.industry || 'Healthcare',
                location: lead.metadata?.location || 'United States',
                experience: lead.metadata?.experience || 'Not specified',
                source: lead.source,
                score: lead.score,
                hasCalcData: !!lead.metadata?.calculationData,
                hasPhone: !!lead.phone,
                hasCompany: !!lead.company,
                createdAt: lead.createdAt,
                emailPreview: lead.email ? 
                  lead.email.substring(0, 2) + '***@' + lead.email.split('@')[1] : 
                  'hidden@***.com'
              },
              leadScore: lead.score,
              engagementLevel: lead.score >= 80 ? 'high' : lead.score >= 60 ? 'medium' : 'low',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          })

          created++
        } catch (error) {
          console.error(`Failed to auto-list lead ${lead.id}:`, error)
        }
      }

      const duration = Date.now() - startTime
      console.log(`Auto-listing completed in ${duration}ms: ${created} listings created`)

    } catch (error) {
      console.error('Auto-listing job failed:', error)
      await this.logJobError('auto_listing', error)
    }
  }

  /**
   * Log job performance metrics
   */
  private static async logJobPerformance(
    jobName: string, 
    duration: number, 
    results: any
  ): Promise<void> {
    try {
      // Log to analytics/monitoring system
      await db.analytics.create({
        data: {
          eventType: 'cron_job',
          eventName: jobName,
          properties: {
            duration,
            results,
            timestamp: new Date().toISOString(),
          },
        },
      })
    } catch (error) {
      console.error('Failed to log job performance:', error)
    }
  }

  /**
   * Log job errors
   */
  private static async logJobError(jobName: string, error: any): Promise<void> {
    try {
      await db.analytics.create({
        data: {
          eventType: 'cron_job_error',
          eventName: jobName,
          properties: {
            error: error.message || String(error),
            stack: error.stack,
            timestamp: new Date().toISOString(),
          },
        },
      })
    } catch (logError) {
      console.error('Failed to log job error:', logError)
    }
  }

  /**
   * Get job statistics
   */
  static async getJobStatistics(): Promise<{
    isRunning: boolean
    activeJobs: number
    recentPerformance: any[]
    errorCount: number
  }> {
    const recentPerformance = await db.analytics.findMany({
      where: {
        eventType: 'cron_job',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
    })

    const errorCount = await db.analytics.count({
      where: {
        eventType: 'cron_job_error',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    })

    return {
      isRunning: this.isRunning,
      activeJobs: this.intervals.length,
      recentPerformance,
      errorCount,
    }
  }

  /**
   * Manually trigger a specific job
   */
  static async triggerJob(jobName: string): Promise<{ success: boolean; message: string }> {
    try {
      switch (jobName) {
        case 'lead_scoring':
          await this.runLeadScoringJob()
          return { success: true, message: 'Lead scoring job completed' }
        
        case 'age_scoring':
          await this.updateLeadAgeScoring()
          return { success: true, message: 'Age scoring update completed' }
        
        case 'cleanup':
          await this.cleanupStaleLeads()
          return { success: true, message: 'Cleanup job completed' }
        
        case 'auto_listing':
          await this.autoCreateHighQualityListings()
          return { success: true, message: 'Auto-listing job completed' }
        
        default:
          return { success: false, message: `Unknown job: ${jobName}` }
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Job failed: ${error instanceof Error ? error.message : String(error)}` 
      }
    }
  }
}