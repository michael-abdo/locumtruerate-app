/**
 * Spam Detection System
 * Advanced spam detection for healthcare job platform
 */

import stringSimilarity from 'string-similarity';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import type { SpamScore, ContentSubmission, ModerationResult } from './types';

export class SpamDetector {
  private cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
  private recentSubmissions: Map<string, ContentSubmission[]> = new Map();
  private ipSubmissionCount: Map<string, number> = new Map();
  private userSubmissionCount: Map<string, number> = new Map();

  // Healthcare-specific spam patterns
  private spamPatterns = [
    // Generic spam
    /(?:buy|purchase|order)\s+(?:now|today|here)/gi,
    /(?:click|visit|check)\s+(?:here|this|link)/gi,
    /(?:free|cheap|discount|sale)\s+(?:offer|deal|price)/gi,
    
    // Healthcare job spam
    /work\s+from\s+home.*(?:\$\d+|\d+\$)/gi,
    /easy\s+money.*medical/gi,
    /(?:urgent|immediate)\s+hiring.*(?:no\s+experience|untrained)/gi,
    /medical\s+billing.*work\s+from\s+home/gi,
    
    // Credential spam
    /fake\s+(?:license|certificate|degree)/gi,
    /buy\s+(?:medical|nursing|doctor)\s+(?:license|degree)/gi,
    
    // Contact spam
    /contact\s+(?:me|us)\s+(?:at|on|via)/gi,
    /(?:whatsapp|telegram|email)\s*:?\s*[\+\d\w@.-]+/gi
  ];

  // Blacklisted domains and terms
  private blacklistedDomains = [
    'example.com',
    'tempmail.org',
    '10minutemail.com',
    'guerrillamail.com'
  ];

  private blacklistedTerms = [
    'guaranteed approval',
    'no experience required',
    'work from home guaranteed',
    'instant certification',
    'buy fake license',
    'diploma mill'
  ];

  /**
   * Detect spam in content submission
   */
  async detectSpam(submission: ContentSubmission): Promise<SpamScore> {
    const indicators = {
      duplicateContent: await this.checkDuplicateContent(submission),
      suspiciousPatterns: this.checkSuspiciousPatterns(submission.content),
      linkSpam: this.checkLinkSpam(submission.content),
      repetitiveText: this.checkRepetitiveText(submission.content),
      blacklistedTerms: this.checkBlacklistedTerms(submission.content),
      rateLimitViolation: this.checkRateLimit(submission)
    };

    // Calculate overall spam score
    const weights = {
      duplicateContent: 0.25,
      suspiciousPatterns: 0.20,
      linkSpam: 0.15,
      repetitiveText: 0.15,
      blacklistedTerms: 0.15,
      rateLimitViolation: 0.10
    };

    const overall = Object.entries(indicators).reduce((score, [key, value]) => {
      return score + (value * weights[key as keyof typeof weights]);
    }, 0);

    const spamScore: SpamScore = {
      overall: Math.round(overall),
      indicators,
      isSpam: overall > 70 // Threshold for spam classification
    };

    // Store submission for duplicate detection
    this.storeSubmission(submission);

    return spamScore;
  }

  /**
   * Check for duplicate or near-duplicate content
   */
  private async checkDuplicateContent(submission: ContentSubmission): Promise<number> {
    const userKey = submission.userId || submission.userIP || 'anonymous';
    const recentSubmissions = this.recentSubmissions.get(userKey) || [];

    if (recentSubmissions.length === 0) {
      return 0;
    }

    let maxSimilarity = 0;
    
    for (const recent of recentSubmissions) {
      const similarity = stringSimilarity.compareTwoStrings(
        submission.content.toLowerCase(),
        recent.content.toLowerCase()
      );
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }

    // Convert similarity to spam score (0-100)
    if (maxSimilarity > 0.9) return 100; // Near identical
    if (maxSimilarity > 0.8) return 80;  // Very similar
    if (maxSimilarity > 0.7) return 60;  // Similar
    if (maxSimilarity > 0.5) return 30;  // Somewhat similar
    
    return 0;
  }

  /**
   * Check for suspicious spam patterns
   */
  private checkSuspiciousPatterns(content: string): number {
    let score = 0;
    let matchCount = 0;

    for (const pattern of this.spamPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matchCount += matches.length;
      }
    }

    // Score based on number of pattern matches
    if (matchCount >= 3) score = 100;
    else if (matchCount >= 2) score = 70;
    else if (matchCount >= 1) score = 40;

    // Additional suspicious indicators
    const suspiciousIndicators = [
      /\$\d+.*per\s+(?:hour|day|week)/gi, // Money promises
      /(?:guaranteed|promise|ensure)\s+(?:income|money|salary)/gi,
      /(?:urgent|immediate|asap)\s+(?:hiring|needed|required)/gi,
      /(?:no\s+)?(?:experience|training)\s+(?:required|needed)/gi,
      /contact.*(?:\d{10}|\+\d+)/gi, // Phone numbers in contact context
    ];

    for (const indicator of suspiciousIndicators) {
      if (indicator.test(content)) {
        score += 15;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Check for link spam
   */
  private checkLinkSpam(content: string): number {
    // Extract URLs
    const urlPattern = /https?:\/\/[^\s<>"']+/gi;
    const urls = content.match(urlPattern) || [];
    
    let score = 0;

    // Too many links
    if (urls.length > 5) score += 60;
    else if (urls.length > 3) score += 40;
    else if (urls.length > 1) score += 20;

    // Check for blacklisted domains
    for (const url of urls) {
      try {
        const domain = new URL(url).hostname.toLowerCase();
        if (this.blacklistedDomains.some(blacklisted => domain.includes(blacklisted))) {
          score += 50;
        }
        
        // Suspicious TLDs
        if (domain.endsWith('.tk') || domain.endsWith('.ml') || domain.endsWith('.ga')) {
          score += 30;
        }
        
        // URL shorteners (can be suspicious)
        if (domain.includes('bit.ly') || domain.includes('tinyurl') || domain.includes('t.co')) {
          score += 20;
        }
      } catch {
        // Invalid URL, treat as suspicious
        score += 25;
      }
    }

    // Check for email addresses (often spam)
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = content.match(emailPattern) || [];
    
    if (emails.length > 2) score += 40;
    else if (emails.length > 0) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Check for repetitive text patterns
   */
  private checkRepetitiveText(content: string): number {
    let score = 0;

    // Check for repeated words
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 3) { // Only count meaningful words
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }

    // Find most repeated word
    let maxRepeats = 0;
    for (const count of wordCount.values()) {
      if (count > maxRepeats) {
        maxRepeats = count;
      }
    }

    if (maxRepeats > 10) score += 80;
    else if (maxRepeats > 5) score += 50;
    else if (maxRepeats > 3) score += 20;

    // Check for repeated phrases
    const sentences = content.split(/[.!?]+/);
    for (let i = 0; i < sentences.length - 1; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const similarity = stringSimilarity.compareTwoStrings(
          sentences[i].trim().toLowerCase(),
          sentences[j].trim().toLowerCase()
        );
        if (similarity > 0.8 && sentences[i].trim().length > 10) {
          score += 30;
        }
      }
    }

    // Check for excessive repetition of characters
    const charRepetition = /(.)\1{4,}/g; // 5 or more of the same character
    if (charRepetition.test(content)) {
      score += 25;
    }

    return Math.min(score, 100);
  }

  /**
   * Check for blacklisted terms
   */
  private checkBlacklistedTerms(content: string): number {
    const lowerContent = content.toLowerCase();
    let score = 0;

    for (const term of this.blacklistedTerms) {
      if (lowerContent.includes(term.toLowerCase())) {
        score += 30;
      }
    }

    // Healthcare-specific spam terms
    const healthcareSpamTerms = [
      'instant medical license',
      'buy nursing degree',
      'fake medical certificate',
      'guaranteed job placement',
      'no background check',
      'immediate start no questions'
    ];

    for (const term of healthcareSpamTerms) {
      if (lowerContent.includes(term)) {
        score += 40;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Check for rate limit violations
   */
  private checkRateLimit(submission: ContentSubmission): number {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    let score = 0;

    // Check IP-based rate limiting
    if (submission.userIP) {
      const ipCount = this.ipSubmissionCount.get(submission.userIP) || 0;
      this.ipSubmissionCount.set(submission.userIP, ipCount + 1);

      if (ipCount > 20) score += 80; // More than 20 submissions per hour from same IP
      else if (ipCount > 10) score += 50;
      else if (ipCount > 5) score += 20;

      // Clean up old entries (simple implementation)
      setTimeout(() => {
        const currentCount = this.ipSubmissionCount.get(submission.userIP!) || 0;
        if (currentCount > 0) {
          this.ipSubmissionCount.set(submission.userIP!, currentCount - 1);
        }
      }, oneHour);
    }

    // Check user-based rate limiting
    if (submission.userId) {
      const userCount = this.userSubmissionCount.get(submission.userId) || 0;
      this.userSubmissionCount.set(submission.userId, userCount + 1);

      if (userCount > 15) score += 60; // More than 15 submissions per hour from same user
      else if (userCount > 8) score += 30;
      else if (userCount > 5) score += 15;

      // Clean up old entries
      setTimeout(() => {
        const currentCount = this.userSubmissionCount.get(submission.userId!) || 0;
        if (currentCount > 0) {
          this.userSubmissionCount.set(submission.userId!, currentCount - 1);
        }
      }, oneHour);
    }

    return Math.min(score, 100);
  }

  /**
   * Store submission for future duplicate detection
   */
  private storeSubmission(submission: ContentSubmission): void {
    const userKey = submission.userId || submission.userIP || 'anonymous';
    const existing = this.recentSubmissions.get(userKey) || [];
    
    // Add new submission
    existing.push(submission);
    
    // Keep only last 10 submissions per user
    if (existing.length > 10) {
      existing.shift();
    }
    
    this.recentSubmissions.set(userKey, existing);

    // Clean up old submissions (keep for 24 hours)
    setTimeout(() => {
      const current = this.recentSubmissions.get(userKey) || [];
      const index = current.findIndex(s => s.id === submission.id);
      if (index !== -1) {
        current.splice(index, 1);
        this.recentSubmissions.set(userKey, current);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Train spam detector with labeled data
   */
  trainModel(labeledData: Array<{ content: string; isSpam: boolean }>): void {
    // Simple training implementation - in production, this would use ML
    const spamTexts = labeledData.filter(d => d.isSpam).map(d => d.content);
    const hamTexts = labeledData.filter(d => !d.isSpam).map(d => d.content);

    // Extract common patterns from spam texts
    const newSpamPatterns: RegExp[] = [];
    
    for (const spamText of spamTexts) {
      // Extract potential patterns (simplified)
      const words = spamText.toLowerCase().split(/\s+/);
      const phrases = [];
      
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]}\\s+${words[i + 1]}`;
        phrases.push(phrase);
      }
      
      // Add high-frequency phrases as patterns
      phrases.forEach(phrase => {
        try {
          const pattern = new RegExp(phrase, 'gi');
          newSpamPatterns.push(pattern);
        } catch {
          // Invalid regex, skip
        }
      });
    }

    // Add new patterns to existing ones (limited to prevent memory issues)
    this.spamPatterns.push(...newSpamPatterns.slice(0, 20));
    
    console.log(`🤖 Spam detector trained with ${labeledData.length} samples`);
  }

  /**
   * Get spam detection statistics
   */
  getStatistics() {
    return {
      totalPatterns: this.spamPatterns.length,
      blacklistedDomains: this.blacklistedDomains.length,
      blacklistedTerms: this.blacklistedTerms.length,
      activeIPTracking: this.ipSubmissionCount.size,
      activeUserTracking: this.userSubmissionCount.size,
      recentSubmissions: Array.from(this.recentSubmissions.values())
        .reduce((sum, arr) => sum + arr.length, 0)
    };
  }

  /**
   * Clear cache and reset counters
   */
  reset(): void {
    this.cache.flushAll();
    this.recentSubmissions.clear();
    this.ipSubmissionCount.clear();
    this.userSubmissionCount.clear();
  }
}