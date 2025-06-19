/**
 * Content Moderation System
 * Comprehensive content filtering and safety checks
 */

import Filter from 'bad-words';
import Sentiment from 'sentiment';
import nlp from 'compromise';
import { v4 as uuidv4 } from 'uuid';
import type { 
  ModerationResult, 
  ToxicityScore, 
  ContentFlags, 
  ContentSubmission, 
  ModerationAction,
  HealthcareModerationRules,
  JobPostingModerationRules
} from './types';

export class ContentModerator {
  private profanityFilter: Filter;
  private sentiment: typeof Sentiment;
  
  // Healthcare-specific rules
  private healthcareRules: HealthcareModerationRules = {
    enablePHIDetection: true,
    enableMedicalMisinformation: true,
    enableCredentialVerification: true,
    medicalTermWhitelist: [
      'physician', 'doctor', 'nurse', 'surgeon', 'resident', 'intern',
      'medical', 'clinical', 'hospital', 'clinic', 'emergency', 'ICU',
      'licensed', 'certified', 'board certified', 'fellowship',
      'MD', 'DO', 'RN', 'LPN', 'NP', 'PA', 'DDS', 'DVM'
    ],
    prohibitedMedicalClaims: [
      'cure cancer', 'miracle cure', 'guaranteed treatment',
      'FDA not approved but works', 'secret medical knowledge',
      'doctors don\'t want you to know', 'pharmaceutical conspiracy'
    ],
    credentialPatterns: [
      /\b(?:MD|DO|RN|LPN|NP|PA|DDS|DVM|PhD)\b/gi,
      /license\s*#?\s*[A-Z0-9]{5,}/gi,
      /board\s+certified/gi,
      /state\s+license/gi
    ]
  };

  // Job posting specific rules
  private jobPostingRules: JobPostingModerationRules = {
    minimumDescriptionLength: 50,
    maximumDescriptionLength: 5000,
    requiredFields: ['title', 'description', 'location', 'company'],
    salaryRangeValidation: true,
    locationValidation: true,
    prohibitedCompensationTerms: [
      'unpaid', 'volunteer only', 'no salary', 'work for free',
      'commission only', 'payment on results', 'deferred payment'
    ],
    requiredEqualOpportunityStatement: false
  };

  // Personal information patterns (PHI)
  private phiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // Dates
    /\bpatient\s+(?:id|number|#)\s*:?\s*[A-Z0-9]+/gi,
    /\bmedical\s+record\s+(?:number|#)\s*:?\s*[A-Z0-9]+/gi,
    /\binsurance\s+(?:number|#|id)\s*:?\s*[A-Z0-9]+/gi
  ];

  constructor() {
    this.profanityFilter = new Filter();
    this.sentiment = Sentiment;
    
    // Add healthcare-specific profanity filters
    this.profanityFilter.addWords(
      'quack', 'butcher', 'pill pusher', 'fake doctor'
    );
  }

  /**
   * Moderate content submission
   */
  async moderateContent(submission: ContentSubmission): Promise<ModerationResult> {
    const flags = this.analyzeContentFlags(submission);
    const toxicity = await this.analyzeToxicity(submission.content);
    const profanityScore = this.analyzeProfanity(submission.content);
    const sentimentScore = this.analyzeSentiment(submission.content);
    
    // Apply category-specific rules
    let categoryViolations: string[] = [];
    
    if (submission.category === 'JOB_POSTING') {
      categoryViolations = this.validateJobPosting(submission);
    }
    
    if (submission.category === 'PROFILE' || submission.category === 'APPLICATION') {
      categoryViolations = this.validateHealthcareContent(submission);
    }

    // Determine moderation action
    const action = this.determineAction(flags, toxicity, profanityScore, categoryViolations);
    const confidence = this.calculateConfidence(flags, toxicity, profanityScore);
    
    const reasons = this.generateReasons(flags, toxicity, profanityScore, categoryViolations);

    return {
      id: uuidv4(),
      timestamp: Date.now(),
      action,
      confidence,
      reasons,
      flags,
      scores: {
        spam: { overall: 0, indicators: {} as any, isSpam: false }, // Will be filled by spam detector
        toxicity,
        profanity: profanityScore,
        sentiment: sentimentScore
      },
      metadata: {
        category: submission.category,
        contentLength: submission.content.length,
        userId: submission.userId
      }
    };
  }

  /**
   * Analyze content flags
   */
  private analyzeContentFlags(submission: ContentSubmission): ContentFlags {
    const content = submission.content;

    return {
      hasSpam: false, // Will be determined by spam detector
      hasProfanity: this.profanityFilter.isProfane(content),
      hasToxicity: false, // Will be determined by toxicity analysis
      hasPersonalInfo: this.containsPersonalInfo(content),
      hasSuspiciousLinks: this.containsSuspiciousLinks(content),
      hasExcessiveCaps: this.hasExcessiveCaps(content),
      hasRepetitiveContent: this.hasRepetitiveContent(content),
      hasBlacklistedTerms: this.containsBlacklistedTerms(content)
    };
  }

  /**
   * Analyze toxicity using basic sentiment and keyword analysis
   */
  private async analyzeToxicity(content: string): Promise<ToxicityScore> {
    // Simplified toxicity detection - in production, use Google Perspective API
    const toxicKeywords = [
      'hate', 'kill', 'die', 'stupid', 'idiot', 'moron', 'loser',
      'pathetic', 'worthless', 'disgusting', 'evil', 'terrible'
    ];
    
    const threats = [
      'kill you', 'hurt you', 'destroy you', 'come after you',
      'find you', 'make you pay', 'you\'re dead'
    ];

    const identityAttacks = [
      'race', 'religion', 'gender', 'sexual orientation', 'disability',
      'nationality', 'ethnicity'
    ];

    const lowerContent = content.toLowerCase();
    
    let toxicityScore = 0;
    let threatScore = 0;
    let identityScore = 0;
    let insultScore = 0;

    // Check for toxic keywords
    for (const keyword of toxicKeywords) {
      if (lowerContent.includes(keyword)) {
        toxicityScore += 20;
        insultScore += 15;
      }
    }

    // Check for threats
    for (const threat of threats) {
      if (lowerContent.includes(threat)) {
        threatScore += 40;
        toxicityScore += 30;
      }
    }

    // Check for identity attacks
    for (const identity of identityAttacks) {
      if (lowerContent.includes(identity)) {
        const context = this.getContextAroundKeyword(content, identity);
        if (this.isNegativeContext(context)) {
          identityScore += 25;
          toxicityScore += 20;
        }
      }
    }

    // Analyze sentiment
    const sentimentResult = this.sentiment(content);
    if (sentimentResult.score < -3) {
      toxicityScore += Math.abs(sentimentResult.score) * 5;
    }

    const overallScore = Math.min(toxicityScore, 100);
    
    return {
      overall: overallScore,
      categories: {
        toxicity: overallScore,
        severeToxicity: threatScore > 50 ? threatScore : 0,
        identityAttack: Math.min(identityScore, 100),
        insult: Math.min(insultScore, 100),
        profanity: this.analyzeProfanity(content),
        threat: Math.min(threatScore, 100)
      },
      isToxic: overallScore > 70
    };
  }

  /**
   * Analyze profanity content
   */
  private analyzeProfanity(content: string): number {
    if (!this.profanityFilter.isProfane(content)) {
      return 0;
    }

    const cleanContent = this.profanityFilter.clean(content);
    const profaneWords = content.split(' ').length - cleanContent.split(' ').length;
    const totalWords = content.split(' ').length;
    
    return Math.min((profaneWords / totalWords) * 100, 100);
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(content: string): number {
    const result = this.sentiment(content);
    // Convert sentiment score (-5 to +5) to 0-100 scale
    return ((result.score + 5) / 10) * 100;
  }

  /**
   * Check for personal information (PHI)
   */
  private containsPersonalInfo(content: string): boolean {
    for (const pattern of this.phiPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for suspicious links
   */
  private containsSuspiciousLinks(content: string): boolean {
    const urlPattern = /https?:\/\/[^\s<>"']+/gi;
    const urls = content.match(urlPattern) || [];
    
    const suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 't.co', 'goo.gl',
      'tempmail.org', '10minutemail.com'
    ];
    
    for (const url of urls) {
      try {
        const domain = new URL(url).hostname.toLowerCase();
        if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
          return true;
        }
      } catch {
        return true; // Invalid URL format
      }
    }
    
    return urls.length > 3; // Too many links
  }

  /**
   * Check for excessive caps
   */
  private hasExcessiveCaps(content: string): boolean {
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
    
    if (totalLetters === 0) return false;
    
    const capsPercentage = (capsCount / totalLetters) * 100;
    return capsPercentage > 60 && content.length > 20;
  }

  /**
   * Check for repetitive content
   */
  private hasRepetitiveContent(content: string): boolean {
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 2) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }
    
    // Check if any word appears more than 30% of the time
    const totalWords = words.length;
    for (const count of wordCount.values()) {
      if (count / totalWords > 0.3 && totalWords > 10) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for blacklisted terms
   */
  private containsBlacklistedTerms(content: string): boolean {
    const blacklistedTerms = [
      'viagra', 'cialis', 'drugs for sale', 'buy drugs',
      'fake license', 'illegal practice', 'unlicensed',
      'pyramid scheme', 'get rich quick', 'mlm opportunity'
    ];
    
    const lowerContent = content.toLowerCase();
    return blacklistedTerms.some(term => lowerContent.includes(term));
  }

  /**
   * Validate job posting content
   */
  private validateJobPosting(submission: ContentSubmission): string[] {
    const violations: string[] = [];
    const content = submission.content;
    const metadata = submission.metadata || {};

    // Check minimum description length
    if (content.length < this.jobPostingRules.minimumDescriptionLength) {
      violations.push(`Description too short (minimum ${this.jobPostingRules.minimumDescriptionLength} characters)`);
    }

    // Check maximum description length
    if (content.length > this.jobPostingRules.maximumDescriptionLength) {
      violations.push(`Description too long (maximum ${this.jobPostingRules.maximumDescriptionLength} characters)`);
    }

    // Check for prohibited compensation terms
    const lowerContent = content.toLowerCase();
    for (const term of this.jobPostingRules.prohibitedCompensationTerms) {
      if (lowerContent.includes(term)) {
        violations.push(`Prohibited compensation term: "${term}"`);
      }
    }

    // Check for required fields in metadata
    for (const field of this.jobPostingRules.requiredFields) {
      if (!metadata[field] || metadata[field].toString().trim() === '') {
        violations.push(`Missing required field: ${field}`);
      }
    }

    // Check for unrealistic salary ranges
    if (this.jobPostingRules.salaryRangeValidation && metadata.salaryMin && metadata.salaryMax) {
      const minSalary = Number(metadata.salaryMin);
      const maxSalary = Number(metadata.salaryMax);
      
      if (minSalary > maxSalary) {
        violations.push('Minimum salary cannot be greater than maximum salary');
      }
      
      if (minSalary < 1000 || maxSalary > 10000000) {
        violations.push('Salary range appears unrealistic');
      }
    }

    return violations;
  }

  /**
   * Validate healthcare-specific content
   */
  private validateHealthcareContent(submission: ContentSubmission): string[] {
    const violations: string[] = [];
    const content = submission.content;

    if (!this.healthcareRules.enableCredentialVerification) {
      return violations;
    }

    // Check for medical misinformation
    if (this.healthcareRules.enableMedicalMisinformation) {
      for (const claim of this.healthcareRules.prohibitedMedicalClaims) {
        if (content.toLowerCase().includes(claim.toLowerCase())) {
          violations.push(`Potential medical misinformation: "${claim}"`);
        }
      }
    }

    // Check for proper credential format
    const credentialMentions = content.match(/\b(?:license|certification|credential)\b/gi);
    if (credentialMentions && credentialMentions.length > 0) {
      let hasValidCredentialFormat = false;
      
      for (const pattern of this.healthcareRules.credentialPatterns) {
        if (pattern.test(content)) {
          hasValidCredentialFormat = true;
          break;
        }
      }
      
      if (!hasValidCredentialFormat) {
        violations.push('Credential mentioned but format appears invalid');
      }
    }

    // Check for PHI exposure
    if (this.healthcareRules.enablePHIDetection && this.containsPersonalInfo(content)) {
      violations.push('Content contains potential personal health information (PHI)');
    }

    return violations;
  }

  /**
   * Determine moderation action based on analysis
   */
  private determineAction(
    flags: ContentFlags,
    toxicity: ToxicityScore,
    profanityScore: number,
    violations: string[]
  ): ModerationAction {
    // Block for severe violations
    if (violations.length > 0 || toxicity.overall > 80 || profanityScore > 80) {
      return 'BLOCK';
    }

    // Review for moderate issues
    if (toxicity.overall > 60 || profanityScore > 60 || flags.hasPersonalInfo) {
      return 'REVIEW';
    }

    // Flag for minor issues
    if (toxicity.overall > 40 || profanityScore > 40 || flags.hasSuspiciousLinks) {
      return 'FLAG';
    }

    return 'ALLOW';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    flags: ContentFlags,
    toxicity: ToxicityScore,
    profanityScore: number
  ): number {
    let confidence = 50; // Base confidence

    // High confidence indicators
    if (toxicity.overall > 80) confidence += 30;
    if (profanityScore > 80) confidence += 25;
    if (flags.hasPersonalInfo) confidence += 20;

    // Medium confidence indicators
    if (toxicity.overall > 60) confidence += 15;
    if (flags.hasSuspiciousLinks) confidence += 10;
    if (flags.hasExcessiveCaps) confidence += 5;

    return Math.min(confidence, 100);
  }

  /**
   * Generate human-readable reasons
   */
  private generateReasons(
    flags: ContentFlags,
    toxicity: ToxicityScore,
    profanityScore: number,
    violations: string[]
  ): string[] {
    const reasons: string[] = [...violations];

    if (toxicity.overall > 70) {
      reasons.push('Content contains toxic language');
    }

    if (profanityScore > 70) {
      reasons.push('Content contains profanity');
    }

    if (flags.hasPersonalInfo) {
      reasons.push('Content contains personal information');
    }

    if (flags.hasSuspiciousLinks) {
      reasons.push('Content contains suspicious links');
    }

    if (flags.hasExcessiveCaps) {
      reasons.push('Content uses excessive capitalization');
    }

    if (flags.hasRepetitiveContent) {
      reasons.push('Content is repetitive');
    }

    return reasons;
  }

  /**
   * Helper method to get context around a keyword
   */
  private getContextAroundKeyword(content: string, keyword: string): string {
    const index = content.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + keyword.length + 50);
    
    return content.substring(start, end);
  }

  /**
   * Helper method to determine if context is negative
   */
  private isNegativeContext(context: string): boolean {
    const negativeWords = ['hate', 'dislike', 'terrible', 'awful', 'disgusting', 'stupid'];
    const lowerContext = context.toLowerCase();
    
    return negativeWords.some(word => lowerContext.includes(word));
  }

  /**
   * Update moderation rules
   */
  updateHealthcareRules(rules: Partial<HealthcareModerationRules>): void {
    this.healthcareRules = { ...this.healthcareRules, ...rules };
  }

  /**
   * Update job posting rules
   */
  updateJobPostingRules(rules: Partial<JobPostingModerationRules>): void {
    this.jobPostingRules = { ...this.jobPostingRules, ...rules };
  }

  /**
   * Get moderation statistics
   */
  getStatistics() {
    return {
      healthcareRules: this.healthcareRules,
      jobPostingRules: this.jobPostingRules,
      phiPatterns: this.phiPatterns.length,
      profanityFilterEnabled: true
    };
  }
}