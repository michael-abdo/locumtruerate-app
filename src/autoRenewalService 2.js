// Job Auto-Renewal and Smart Recommendations Service
// This service automatically renews jobs and provides intelligent recommendations for job optimization

class AutoRenewalService {
  constructor(env) {
    this.env = env;
    
    // Auto-renewal settings
    this.defaultRenewalSettings = {
      enabled: true,
      maxRenewals: 3,
      renewalPeriodDays: 30,
      warningDaysBefore: 7,
      autoRenewConditions: {
        minApplications: 1,      // Minimum applications to trigger auto-renewal
        minViews: 10,            // Minimum views to trigger auto-renewal
        maxDaysWithoutActivity: 14 // Max days without applications/views
      }
    };
    
    // Job performance thresholds
    this.performanceThresholds = {
      excellent: { viewsPerDay: 5, applicationsPerDay: 1, conversionRate: 0.15 },
      good: { viewsPerDay: 2, applicationsPerDay: 0.5, conversionRate: 0.1 },
      average: { viewsPerDay: 1, applicationsPerDay: 0.2, conversionRate: 0.05 },
      poor: { viewsPerDay: 0.5, applicationsPerDay: 0.1, conversionRate: 0.02 }
    };
    
    // Smart recommendations categories
    this.recommendationTypes = {
      TITLE_OPTIMIZATION: 'title_optimization',
      SALARY_ADJUSTMENT: 'salary_adjustment',
      DESCRIPTION_IMPROVEMENT: 'description_improvement',
      LOCATION_EXPANSION: 'location_expansion',
      SKILLS_REFINEMENT: 'skills_refinement',
      TIMING_OPTIMIZATION: 'timing_optimization',
      CATEGORY_ADJUSTMENT: 'category_adjustment'
    };
    
    // Industry benchmarks (mock data - in production, would be calculated from real data)
    this.industryBenchmarks = {
      engineering: {
        avgViewsPerDay: 8,
        avgApplicationsPerDay: 1.2,
        avgConversionRate: 0.15,
        topKeywords: ['senior', 'full-stack', 'remote', 'react', 'python'],
        salaryRanges: { junior: [70000, 95000], mid: [95000, 130000], senior: [130000, 180000] }
      },
      design: {
        avgViewsPerDay: 6,
        avgApplicationsPerDay: 0.9,
        avgConversionRate: 0.12,
        topKeywords: ['ui/ux', 'figma', 'creative', 'brand', 'visual'],
        salaryRanges: { junior: [50000, 70000], mid: [70000, 95000], senior: [95000, 130000] }
      },
      marketing: {
        avgViewsPerDay: 5,
        avgApplicationsPerDay: 0.8,
        avgConversionRate: 0.1,
        topKeywords: ['digital', 'seo', 'content', 'social media', 'analytics'],
        salaryRanges: { junior: [45000, 65000], mid: [65000, 85000], senior: [85000, 120000] }
      },
      sales: {
        avgViewsPerDay: 4,
        avgApplicationsPerDay: 0.7,
        avgConversionRate: 0.18,
        topKeywords: ['b2b', 'account management', 'crm', 'quota', 'enterprise'],
        salaryRanges: { junior: [40000, 60000], mid: [60000, 85000], senior: [85000, 150000] }
      }
    };
  }

  // Main auto-renewal check function (would be called by a cron job)
  async processAutoRenewals() {
    try {
      const renewalResults = {
        processed: 0,
        renewed: 0,
        expired: 0,
        notificationsSet: 0,
        errors: 0,
        details: []
      };

      // Get all jobs that need renewal checking
      const jobs = await this.getAllJobs();
      const now = new Date();

      for (const job of jobs) {
        try {
          renewalResults.processed++;
          
          // Skip if job doesn't have auto-renewal enabled
          if (!this.isAutoRenewalEnabled(job)) {
            continue;
          }

          const expiresAt = new Date(job.expiresAt);
          const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

          // Check if job needs immediate renewal
          if (daysUntilExpiry <= 0 && job.status === 'active') {
            const renewed = await this.attemptAutoRenewal(job);
            if (renewed.success) {
              renewalResults.renewed++;
              renewalResults.details.push({
                jobId: job.id,
                action: 'renewed',
                reason: renewed.reason
              });
            } else {
              // Mark as expired if renewal failed
              await this.expireJob(job);
              renewalResults.expired++;
              renewalResults.details.push({
                jobId: job.id,
                action: 'expired',
                reason: renewed.reason
              });
            }
          }
          // Check if job needs renewal warning notification
          else if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            const sent = await this.sendRenewalWarning(job, daysUntilExpiry);
            if (sent) {
              renewalResults.notificationsSet++;
              renewalResults.details.push({
                jobId: job.id,
                action: 'warning_sent',
                daysLeft: daysUntilExpiry
              });
            }
          }

        } catch (error) {
          renewalResults.errors++;
          renewalResults.details.push({
            jobId: job.id,
            action: 'error',
            error: error.message
          });
        }
      }

      // Log renewal results
      await this.logRenewalResults(renewalResults);
      
      return renewalResults;
    } catch (error) {
      console.error('Auto-renewal process failed:', error);
      return { error: 'Auto-renewal process failed', details: error.message };
    }
  }

  // Generate smart recommendations for job optimization
  async generateJobRecommendations(jobId) {
    try {
      const job = await this.getJobById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const performance = await this.analyzeJobPerformance(job);
      const recommendations = [];

      // Title optimization recommendations
      const titleRecs = this.analyzeTitleOptimization(job, performance);
      recommendations.push(...titleRecs);

      // Salary adjustment recommendations
      const salaryRecs = this.analyzeSalaryOptimization(job, performance);
      recommendations.push(...salaryRecs);

      // Description improvement recommendations
      const descriptionRecs = this.analyzeDescriptionOptimization(job, performance);
      recommendations.push(...descriptionRecs);

      // Location and remote work recommendations
      const locationRecs = this.analyzeLocationOptimization(job, performance);
      recommendations.push(...locationRecs);

      // Skills and requirements optimization
      const skillsRecs = this.analyzeSkillsOptimization(job, performance);
      recommendations.push(...skillsRecs);

      // Timing optimization recommendations
      const timingRecs = this.analyzeTimingOptimization(job, performance);
      recommendations.push(...timingRecs);

      // Sort recommendations by priority and impact
      const sortedRecommendations = recommendations
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10); // Limit to top 10 recommendations

      return {
        jobId,
        jobTitle: job.title,
        performanceRating: performance.rating,
        totalRecommendations: sortedRecommendations.length,
        recommendations: sortedRecommendations,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        jobId,
        error: 'Failed to generate recommendations',
        details: error.message
      };
    }
  }

  // Auto-renewal logic
  async attemptAutoRenewal(job) {
    try {
      const renewalSettings = this.getRenewalSettings(job);
      const renewalCount = job.renewalCount || 0;

      // Check if max renewals reached
      if (renewalCount >= renewalSettings.maxRenewals) {
        return {
          success: false,
          reason: `Maximum renewals (${renewalSettings.maxRenewals}) reached`
        };
      }

      // Check renewal conditions
      const performance = await this.analyzeJobPerformance(job);
      const meetsConditions = this.checkRenewalConditions(job, performance, renewalSettings);

      if (!meetsConditions.success) {
        return {
          success: false,
          reason: meetsConditions.reason
        };
      }

      // Perform the renewal
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + renewalSettings.renewalPeriodDays);

      const updatedJob = {
        ...job,
        expiresAt: newExpiryDate.toISOString(),
        renewalCount: renewalCount + 1,
        lastRenewalAt: new Date().toISOString(),
        status: 'active'
      };

      await this.env.JOBS.put(job.id, JSON.stringify(updatedJob));

      // Send renewal notification to employer
      await this.sendRenewalNotification(job, renewalSettings.renewalPeriodDays);

      return {
        success: true,
        reason: `Auto-renewed for ${renewalSettings.renewalPeriodDays} days`,
        newExpiryDate: newExpiryDate.toISOString()
      };
    } catch (error) {
      return {
        success: false,
        reason: `Renewal failed: ${error.message}`
      };
    }
  }

  // Performance analysis
  async analyzeJobPerformance(job) {
    const now = new Date();
    const createdAt = new Date(job.createdAt);
    const daysActive = Math.max(1, Math.ceil((now - createdAt) / (1000 * 60 * 60 * 24)));

    // Get application count for this job
    const applications = await this.getJobApplications(job.id);
    const applicationCount = applications.length;

    // Calculate metrics
    const viewCount = job.viewCount || 0;
    const viewsPerDay = viewCount / daysActive;
    const applicationsPerDay = applicationCount / daysActive;
    const conversionRate = viewCount > 0 ? applicationCount / viewCount : 0;

    // Determine performance rating
    let rating = 'poor';
    if (viewsPerDay >= this.performanceThresholds.excellent.viewsPerDay &&
        applicationsPerDay >= this.performanceThresholds.excellent.applicationsPerDay) {
      rating = 'excellent';
    } else if (viewsPerDay >= this.performanceThresholds.good.viewsPerDay &&
               applicationsPerDay >= this.performanceThresholds.good.applicationsPerDay) {
      rating = 'good';
    } else if (viewsPerDay >= this.performanceThresholds.average.viewsPerDay &&
               applicationsPerDay >= this.performanceThresholds.average.applicationsPerDay) {
      rating = 'average';
    }

    // Compare to industry benchmarks
    const benchmark = this.industryBenchmarks[job.category] || this.industryBenchmarks.engineering;
    const benchmarkComparison = {
      views: viewsPerDay / benchmark.avgViewsPerDay,
      applications: applicationsPerDay / benchmark.avgApplicationsPerDay,
      conversion: conversionRate / benchmark.avgConversionRate
    };

    return {
      rating,
      metrics: {
        daysActive,
        viewCount,
        applicationCount,
        viewsPerDay: Math.round(viewsPerDay * 10) / 10,
        applicationsPerDay: Math.round(applicationsPerDay * 10) / 10,
        conversionRate: Math.round(conversionRate * 1000) / 10 // As percentage
      },
      benchmarkComparison,
      lastActivity: this.getLastActivityDate(job, applications)
    };
  }

  // Recommendation analysis methods
  analyzeTitleOptimization(job, performance) {
    const recommendations = [];
    const title = job.title.toLowerCase();
    const benchmark = this.industryBenchmarks[job.category] || this.industryBenchmarks.engineering;

    // Check for trending keywords
    const missingKeywords = benchmark.topKeywords.filter(keyword => 
      !title.includes(keyword.toLowerCase())
    );

    if (missingKeywords.length > 0 && performance.rating !== 'excellent') {
      recommendations.push({
        type: this.recommendationTypes.TITLE_OPTIMIZATION,
        priority: 8,
        title: 'Add trending keywords to job title',
        description: `Consider adding keywords like "${missingKeywords.slice(0, 2).join(', ')}" to improve visibility`,
        impact: 'High',
        effort: 'Low',
        expectedImprovement: '15-25% more views'
      });
    }

    // Check title length
    if (title.length > 60) {
      recommendations.push({
        type: this.recommendationTypes.TITLE_OPTIMIZATION,
        priority: 6,
        title: 'Shorten job title',
        description: 'Long titles may be truncated in search results. Keep it under 60 characters.',
        impact: 'Medium',
        effort: 'Low',
        expectedImprovement: '5-10% better click-through rate'
      });
    }

    return recommendations;
  }

  analyzeSalaryOptimization(job, performance) {
    const recommendations = [];
    const benchmark = this.industryBenchmarks[job.category] || this.industryBenchmarks.engineering;

    if (!job.salary && performance.rating === 'poor') {
      recommendations.push({
        type: this.recommendationTypes.SALARY_ADJUSTMENT,
        priority: 9,
        title: 'Add salary range',
        description: 'Jobs with salary information get 30% more applications',
        impact: 'High',
        effort: 'Low',
        expectedImprovement: '25-35% more applications',
        suggestedAction: `Consider adding salary range: $${benchmark.salaryRanges.mid[0].toLocaleString()}-$${benchmark.salaryRanges.mid[1].toLocaleString()}`
      });
    }

    return recommendations;
  }

  analyzeDescriptionOptimization(job, performance) {
    const recommendations = [];
    const description = job.description || '';
    const wordCount = description.split(' ').length;

    if (wordCount < 100 && performance.rating !== 'excellent') {
      recommendations.push({
        type: this.recommendationTypes.DESCRIPTION_IMPROVEMENT,
        priority: 7,
        title: 'Expand job description',
        description: 'Detailed job descriptions perform better. Aim for 100-300 words.',
        impact: 'Medium',
        effort: 'Medium',
        expectedImprovement: '10-20% more qualified applications'
      });
    }

    if (wordCount > 500) {
      recommendations.push({
        type: this.recommendationTypes.DESCRIPTION_IMPROVEMENT,
        priority: 5,
        title: 'Simplify job description',
        description: 'Very long descriptions may discourage applicants. Keep it concise.',
        impact: 'Medium',
        effort: 'Medium',
        expectedImprovement: '5-15% better application quality'
      });
    }

    return recommendations;
  }

  analyzeLocationOptimization(job, performance) {
    const recommendations = [];

    if (!job.location.toLowerCase().includes('remote') && performance.rating === 'poor') {
      recommendations.push({
        type: this.recommendationTypes.LOCATION_EXPANSION,
        priority: 7,
        title: 'Consider remote work options',
        description: 'Remote jobs typically get 3x more applications',
        impact: 'High',
        effort: 'Low',
        expectedImprovement: '200-300% more applications'
      });
    }

    return recommendations;
  }

  analyzeSkillsOptimization(job, performance) {
    const recommendations = [];
    const description = job.description.toLowerCase();
    const tags = (job.tags || '').toLowerCase();
    const content = `${description} ${tags}`;

    if (!content.includes('year') && !content.includes('experience') && performance.rating === 'poor') {
      recommendations.push({
        type: this.recommendationTypes.SKILLS_REFINEMENT,
        priority: 6,
        title: 'Clarify experience requirements',
        description: 'Specify required years of experience to attract qualified candidates',
        impact: 'Medium',
        effort: 'Low',
        expectedImprovement: '15-25% better application quality'
      });
    }

    return recommendations;
  }

  analyzeTimingOptimization(job, performance) {
    const recommendations = [];
    const createdAt = new Date(job.createdAt);
    const dayOfWeek = createdAt.getDay();

    // Check if posted on weekend (typically gets fewer views)
    if ((dayOfWeek === 0 || dayOfWeek === 6) && performance.rating === 'poor') {
      recommendations.push({
        type: this.recommendationTypes.TIMING_OPTIMIZATION,
        priority: 4,
        title: 'Optimal posting timing',
        description: 'Jobs posted Monday-Wednesday typically get more visibility',
        impact: 'Low',
        effort: 'Low',
        expectedImprovement: '5-15% more initial views'
      });
    }

    return recommendations;
  }

  // Helper methods
  isAutoRenewalEnabled(job) {
    return job.autoRenewal !== false; // Default to enabled unless explicitly disabled
  }

  getRenewalSettings(job) {
    return {
      ...this.defaultRenewalSettings,
      ...(job.renewalSettings || {})
    };
  }

  checkRenewalConditions(job, performance, settings) {
    const conditions = settings.autoRenewConditions;
    
    // Check minimum applications
    if (performance.metrics.applicationCount < conditions.minApplications) {
      return {
        success: false,
        reason: `Only ${performance.metrics.applicationCount} applications (minimum: ${conditions.minApplications})`
      };
    }

    // Check minimum views
    if (performance.metrics.viewCount < conditions.minViews) {
      return {
        success: false,
        reason: `Only ${performance.metrics.viewCount} views (minimum: ${conditions.minViews})`
      };
    }

    // Check activity recency
    const daysSinceActivity = this.getDaysSinceLastActivity(job, performance);
    if (daysSinceActivity > conditions.maxDaysWithoutActivity) {
      return {
        success: false,
        reason: `No activity for ${daysSinceActivity} days (maximum: ${conditions.maxDaysWithoutActivity})`
      };
    }

    return { success: true };
  }

  async expireJob(job) {
    const updatedJob = {
      ...job,
      status: 'expired',
      expiredAt: new Date().toISOString()
    };

    await this.env.JOBS.put(job.id, JSON.stringify(updatedJob));
  }

  async sendRenewalWarning(job, daysLeft) {
    // In production, this would send an email notification
    // For now, we'll log it and store in notifications
    const notification = {
      id: crypto.randomUUID(),
      type: 'renewal_warning',
      jobId: job.id,
      message: `Your job "${job.title}" expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      daysLeft,
      sentAt: new Date().toISOString()
    };

    await this.env.NOTIFICATIONS.put(notification.id, JSON.stringify(notification));
    return true;
  }

  async sendRenewalNotification(job, renewalDays) {
    const notification = {
      id: crypto.randomUUID(),
      type: 'auto_renewal',
      jobId: job.id,
      message: `Your job "${job.title}" has been automatically renewed for ${renewalDays} days`,
      renewalDays,
      sentAt: new Date().toISOString()
    };

    await this.env.NOTIFICATIONS.put(notification.id, JSON.stringify(notification));
    return true;
  }

  async logRenewalResults(results) {
    const logEntry = {
      id: crypto.randomUUID(),
      type: 'auto_renewal_batch',
      timestamp: new Date().toISOString(),
      results
    };

    // Store in a separate logging namespace if available
    try {
      await this.env.NOTIFICATIONS.put(`renewal_log_${logEntry.id}`, JSON.stringify(logEntry));
    } catch (error) {
      console.error('Failed to log renewal results:', error);
    }
  }

  // Utility methods
  async getAllJobs() {
    const jobs = await this.env.JOBS.list();
    const jobList = [];

    for (const key of jobs.keys) {
      const job = await this.env.JOBS.get(key.name);
      if (job) {
        jobList.push(JSON.parse(job));
      }
    }

    return jobList;
  }

  async getJobById(jobId) {
    const jobData = await this.env.JOBS.get(jobId);
    return jobData ? JSON.parse(jobData) : null;
  }

  async getJobApplications(jobId) {
    const applications = await this.env.APPLICATIONS.list();
    const jobApplications = [];

    for (const key of applications.keys) {
      const application = await this.env.APPLICATIONS.get(key.name);
      if (application) {
        const appData = JSON.parse(application);
        if (appData.jobId === jobId) {
          jobApplications.push(appData);
        }
      }
    }

    return jobApplications;
  }

  getLastActivityDate(job, applications) {
    const dates = [
      new Date(job.createdAt),
      new Date(job.lastViewedAt || job.createdAt)
    ];

    if (applications && applications.length > 0) {
      const lastApplication = applications.reduce((latest, app) => 
        new Date(app.appliedAt) > new Date(latest.appliedAt) ? app : latest
      );
      dates.push(new Date(lastApplication.appliedAt));
    }

    return new Date(Math.max(...dates));
  }

  getDaysSinceLastActivity(job, performance) {
    const lastActivity = performance.lastActivity;
    const now = new Date();
    return Math.ceil((now - lastActivity) / (1000 * 60 * 60 * 24));
  }
}

export { AutoRenewalService };