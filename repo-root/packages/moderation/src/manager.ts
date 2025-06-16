/**
 * Moderation Manager
 * Orchestrates all moderation components for comprehensive content filtering
 */

import { SpamDetector } from './spam';
import { ContentModerator } from './content';
import { v4 as uuidv4 } from 'uuid';
import type {
  ModerationResult,
  ContentSubmission,
  ModerationConfig,
  ModerationEvent,
  UserModerationHistory,
  ModerationAction
} from './types';

export class ModerationManager {
  private spamDetector: SpamDetector;
  private contentModerator: ContentModerator;
  private moderationHistory: Map<string, ModerationEvent[]> = new Map();
  private userHistories: Map<string, UserModerationHistory> = new Map();

  constructor(private config: ModerationConfig) {
    this.spamDetector = new SpamDetector();
    this.contentModerator = new ContentModerator();
  }

  /**
   * Perform comprehensive moderation on content submission
   */
  async moderateSubmission(submission: ContentSubmission): Promise<ModerationResult> {
    console.log(`🛡️ Moderating ${submission.category} content: ${submission.id}`);

    try {
      // 1. Spam Detection
      let spamScore = { overall: 0, indicators: {} as any, isSpam: false };
      if (this.config.enableSpamDetection) {
        spamScore = await this.spamDetector.detectSpam(submission);
      }

      // 2. Content Moderation
      let moderationResult = await this.contentModerator.moderateContent(submission);
      
      // 3. Merge spam results into moderation result
      moderationResult.scores.spam = spamScore;
      moderationResult.flags.hasSpam = spamScore.isSpam;

      // 4. Apply configuration thresholds
      moderationResult = this.applyThresholds(moderationResult);

      // 5. Record moderation event
      this.recordModerationEvent(submission, moderationResult);

      // 6. Update user history
      if (submission.userId) {
        this.updateUserHistory(submission.userId, moderationResult);
      }

      // 7. Apply final action based on user history
      moderationResult = this.applyUserHistoryContext(submission, moderationResult);

      console.log(`📊 Moderation result: ${moderationResult.action} (${moderationResult.confidence}% confidence)`);

      return moderationResult;

    } catch (error) {
      console.error('❌ Moderation failed:', error);
      
      // Return safe fallback
      return {
        id: uuidv4(),
        timestamp: Date.now(),
        action: 'REVIEW',
        confidence: 0,
        reasons: ['Moderation system error - requires manual review'],
        flags: {
          hasSpam: false,
          hasProfanity: false,
          hasToxicity: false,
          hasPersonalInfo: false,
          hasSuspiciousLinks: false,
          hasExcessiveCaps: false,
          hasRepetitiveContent: false,
          hasBlacklistedTerms: false
        },
        scores: {
          spam: { overall: 0, indicators: {} as any, isSpam: false },
          toxicity: { overall: 0, categories: {} as any, isToxic: false },
          profanity: 0,
          sentiment: 50
        },
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Apply configuration thresholds to moderation result
   */
  private applyThresholds(result: ModerationResult): ModerationResult {
    const { thresholds } = this.config;

    // Override action based on thresholds
    if (result.scores.spam.overall >= thresholds.spam) {
      result.action = 'BLOCK';
      result.reasons.push(`Spam score (${result.scores.spam.overall}) exceeds threshold (${thresholds.spam})`);
    }

    if (result.scores.toxicity.overall >= thresholds.toxicity) {
      result.action = result.action === 'ALLOW' ? 'REVIEW' : result.action;
      result.reasons.push(`Toxicity score (${result.scores.toxicity.overall}) exceeds threshold (${thresholds.toxicity})`);
    }

    if (result.scores.profanity >= thresholds.profanity) {
      result.action = result.action === 'ALLOW' ? 'FLAG' : result.action;
      result.reasons.push(`Profanity score (${result.scores.profanity}) exceeds threshold (${thresholds.profanity})`);
    }

    return result;
  }

  /**
   * Apply user history context to moderation decision
   */
  private applyUserHistoryContext(submission: ContentSubmission, result: ModerationResult): ModerationResult {
    if (!submission.userId) return result;

    const userHistory = this.userHistories.get(submission.userId);
    if (!userHistory) return result;

    // Escalate action for repeat offenders
    if (userHistory.riskScore > 80) {
      if (result.action === 'ALLOW') {
        result.action = 'REVIEW';
        result.reasons.push('User has high risk score - flagged for review');
      } else if (result.action === 'FLAG') {
        result.action = 'REVIEW';
        result.reasons.push('User has high risk score - escalated to review');
      }
    }

    // Be more lenient with trusted users
    if (userHistory.trustLevel === 'HIGH' || userHistory.trustLevel === 'VERIFIED') {
      if (result.action === 'FLAG' && result.confidence < 80) {
        result.action = 'ALLOW';
        result.reasons.push('User has high trust level - allowed despite minor flags');
      }
    }

    return result;
  }

  /**
   * Record moderation event
   */
  private recordModerationEvent(submission: ContentSubmission, result: ModerationResult): void {
    const event: ModerationEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      contentId: submission.id,
      userId: submission.userId,
      action: result.action,
      reason: result.reasons.join('; '),
      automated: true,
      appealable: result.action !== 'ALLOW'
    };

    // Store in content history
    const contentHistory = this.moderationHistory.get(submission.id) || [];
    contentHistory.push(event);
    this.moderationHistory.set(submission.id, contentHistory);
  }

  /**
   * Update user moderation history
   */
  private updateUserHistory(userId: string, result: ModerationResult): void {
    let userHistory = this.userHistories.get(userId);
    
    if (!userHistory) {
      userHistory = {
        userId,
        events: [],
        statistics: {
          totalFlags: 0,
          autoModerated: 0,
          manuallyModerated: 0,
          appeals: 0,
          successfulAppeals: 0
        },
        riskScore: 0,
        trustLevel: 'UNKNOWN'
      };
    }

    // Add event
    const event: ModerationEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      contentId: result.id,
      userId,
      action: result.action,
      reason: result.reasons.join('; '),
      automated: true,
      appealable: result.action !== 'ALLOW'
    };

    userHistory.events.push(event);

    // Update statistics
    if (result.action !== 'ALLOW') {
      userHistory.statistics.totalFlags++;
    }
    userHistory.statistics.autoModerated++;

    // Calculate risk score
    userHistory.riskScore = this.calculateUserRiskScore(userHistory);
    
    // Update trust level
    userHistory.trustLevel = this.calculateTrustLevel(userHistory);

    // Keep only last 100 events per user
    if (userHistory.events.length > 100) {
      userHistory.events = userHistory.events.slice(-100);
    }

    this.userHistories.set(userId, userHistory);
  }

  /**
   * Calculate user risk score
   */
  private calculateUserRiskScore(history: UserModerationHistory): number {
    const recentEvents = history.events.slice(-20); // Last 20 events
    const totalEvents = recentEvents.length;
    
    if (totalEvents === 0) return 0;

    let score = 0;
    
    // Count violations by severity
    const blocks = recentEvents.filter(e => e.action === 'BLOCK').length;
    const reviews = recentEvents.filter(e => e.action === 'REVIEW').length;
    const flags = recentEvents.filter(e => e.action === 'FLAG').length;

    // Weight violations
    score += blocks * 25; // Block = 25 points
    score += reviews * 15; // Review = 15 points
    score += flags * 5;    // Flag = 5 points

    // Recent activity factor
    const recentViolations = recentEvents
      .filter(e => e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .filter(e => e.action !== 'ALLOW').length;
    
    score += recentViolations * 10;

    return Math.min(score, 100);
  }

  /**
   * Calculate trust level
   */
  private calculateTrustLevel(history: UserModerationHistory): UserModerationHistory['trustLevel'] {
    const totalEvents = history.events.length;
    const riskScore = history.riskScore;
    
    if (totalEvents < 5) return 'UNKNOWN';
    
    const violationRate = history.statistics.totalFlags / totalEvents;
    
    // High trust: Low risk score and low violation rate
    if (riskScore < 10 && violationRate < 0.1 && totalEvents >= 20) {
      return 'HIGH';
    }
    
    // Medium trust: Moderate risk and violation rate
    if (riskScore < 30 && violationRate < 0.3) {
      return 'MEDIUM';
    }
    
    // Low trust: High risk or violation rate
    return 'LOW';
  }

  /**
   * Process appeal for moderation decision
   */
  async processAppeal(contentId: string, userId: string, reason: string): Promise<boolean> {
    const contentHistory = this.moderationHistory.get(contentId) || [];
    const userHistory = this.userHistories.get(userId);
    
    if (!userHistory) return false;

    // Find the appealed event
    const appealedEvent = contentHistory.find(e => e.userId === userId && e.appealable);
    if (!appealedEvent) return false;

    // Simple appeal processing logic
    const shouldGrantAppeal = 
      userHistory.trustLevel === 'HIGH' ||
      (userHistory.riskScore < 50 && reason.length > 50);

    // Update statistics
    userHistory.statistics.appeals++;
    if (shouldGrantAppeal) {
      userHistory.statistics.successfulAppeals++;
      
      // Lower risk score for successful appeal
      userHistory.riskScore = Math.max(0, userHistory.riskScore - 10);
    }

    this.userHistories.set(userId, userHistory);

    console.log(`📝 Appeal ${shouldGrantAppeal ? 'granted' : 'denied'} for content ${contentId}`);
    
    return shouldGrantAppeal;
  }

  /**
   * Batch moderate multiple submissions
   */
  async batchModerate(submissions: ContentSubmission[]): Promise<ModerationResult[]> {
    console.log(`🔄 Batch moderating ${submissions.length} submissions`);
    
    const results = await Promise.all(
      submissions.map(submission => this.moderateSubmission(submission))
    );

    const summary = {
      allowed: results.filter(r => r.action === 'ALLOW').length,
      flagged: results.filter(r => r.action === 'FLAG').length,
      review: results.filter(r => r.action === 'REVIEW').length,
      blocked: results.filter(r => r.action === 'BLOCK').length
    };

    console.log(`📊 Batch moderation summary:`, summary);
    
    return results;
  }

  /**
   * Train moderation models with feedback
   */
  async trainWithFeedback(trainingData: Array<{
    submission: ContentSubmission;
    expectedAction: ModerationAction;
    feedback: string;
  }>): Promise<void> {
    console.log(`🤖 Training moderation models with ${trainingData.length} samples`);

    // Extract spam training data
    const spamTrainingData = trainingData.map(data => ({
      content: data.submission.content,
      isSpam: data.expectedAction === 'BLOCK' && data.feedback.includes('spam')
    }));

    // Train spam detector
    this.spamDetector.trainModel(spamTrainingData);

    console.log('✅ Moderation training completed');
  }

  /**
   * Get moderation statistics
   */
  getModerationStatistics() {
    const totalUsers = this.userHistories.size;
    const totalEvents = Array.from(this.userHistories.values())
      .reduce((sum, history) => sum + history.events.length, 0);

    const riskDistribution = {
      low: 0,
      medium: 0,
      high: 0
    };

    const trustDistribution = {
      unknown: 0,
      low: 0,
      medium: 0,
      high: 0,
      verified: 0
    };

    for (const history of this.userHistories.values()) {
      // Risk distribution
      if (history.riskScore < 30) riskDistribution.low++;
      else if (history.riskScore < 70) riskDistribution.medium++;
      else riskDistribution.high++;

      // Trust distribution
      trustDistribution[history.trustLevel.toLowerCase() as keyof typeof trustDistribution]++;
    }

    return {
      totalUsers,
      totalEvents,
      riskDistribution,
      trustDistribution,
      configuration: {
        spamDetectionEnabled: this.config.enableSpamDetection,
        toxicityDetectionEnabled: this.config.enableToxicityDetection,
        profanityFilterEnabled: this.config.enableProfanityFilter,
        thresholds: this.config.thresholds
      },
      spamDetectorStats: this.spamDetector.getStatistics(),
      contentModeratorStats: this.contentModerator.getStatistics()
    };
  }

  /**
   * Get user moderation history
   */
  getUserHistory(userId: string): UserModerationHistory | null {
    return this.userHistories.get(userId) || null;
  }

  /**
   * Get content moderation history
   */
  getContentHistory(contentId: string): ModerationEvent[] {
    return this.moderationHistory.get(contentId) || [];
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<ModerationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Moderation configuration updated');
  }

  /**
   * Clear all data (for testing)
   */
  clearData(): void {
    this.moderationHistory.clear();
    this.userHistories.clear();
    this.spamDetector.reset();
  }
}