/**
 * Moderation Package Type Definitions
 */

export type ContentCategory = 'JOB_POSTING' | 'APPLICATION' | 'PROFILE' | 'MESSAGE' | 'COMMENT' | 'REVIEW';
export type ModerationAction = 'ALLOW' | 'FLAG' | 'REVIEW' | 'BLOCK' | 'DELETE';
export type ThreatLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ModerationResult {
  id: string;
  timestamp: number;
  action: ModerationAction;
  confidence: number; // 0-100
  reasons: string[];
  flags: ContentFlags;
  scores: {
    spam: SpamScore;
    toxicity: ToxicityScore;
    profanity: number;
    sentiment: number;
  };
  metadata?: Record<string, any>;
}

export interface SpamScore {
  overall: number; // 0-100
  indicators: {
    duplicateContent: number;
    suspiciousPatterns: number;
    linkSpam: number;
    repetitiveText: number;
    blacklistedTerms: number;
    rateLimitViolation: number;
  };
  isSpam: boolean;
}

export interface ToxicityScore {
  overall: number; // 0-100
  categories: {
    toxicity: number;
    severeToxicity: number;
    identityAttack: number;
    insult: number;
    profanity: number;
    threat: number;
  };
  isToxic: boolean;
}

export interface ContentFlags {
  hasSpam: boolean;
  hasProfanity: boolean;
  hasToxicity: boolean;
  hasPersonalInfo: boolean;
  hasSuspiciousLinks: boolean;
  hasExcessiveCaps: boolean;
  hasRepetitiveContent: boolean;
  hasBlacklistedTerms: boolean;
}

export interface FilterRule {
  id: string;
  name: string;
  pattern: RegExp | string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: ModerationAction;
  description: string;
  enabled: boolean;
}

export interface ModerationConfig {
  enableSpamDetection: boolean;
  enableToxicityDetection: boolean;
  enableProfanityFilter: boolean;
  enableAIModeration: boolean;
  thresholds: {
    spam: number; // 0-100
    toxicity: number; // 0-100
    profanity: number; // 0-100
  };
  customFilters: FilterRule[];
  whitelist: string[];
  blacklist: string[];
  apiKeys?: {
    perspective?: string;
    moderationAPI?: string;
  };
}

export interface AIModerationResult {
  flagged: boolean;
  categories: {
    harassment: boolean;
    harassmentThreatening: boolean;
    hate: boolean;
    hateThreatening: boolean;
    selfHarm: boolean;
    selfHarmIntent: boolean;
    selfHarmInstructions: boolean;
    sexual: boolean;
    sexualMinors: boolean;
    violence: boolean;
    violenceGraphic: boolean;
  };
  categoryScores: {
    harassment: number;
    harassmentThreatening: number;
    hate: number;
    hateThreatening: number;
    selfHarm: number;
    selfHarmIntent: number;
    selfHarmInstructions: number;
    sexual: number;
    sexualMinors: number;
    violence: number;
    violenceGraphic: number;
  };
}

export interface ContentSubmission {
  id: string;
  content: string;
  category: ContentCategory;
  userId?: string;
  userIP?: string;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    attachments?: string[];
  };
}

export interface ModerationEvent {
  id: string;
  timestamp: number;
  contentId: string;
  userId?: string;
  action: ModerationAction;
  reason: string;
  moderatorId?: string;
  automated: boolean;
  appealable: boolean;
}

export interface UserModerationHistory {
  userId: string;
  events: ModerationEvent[];
  statistics: {
    totalFlags: number;
    autoModerated: number;
    manuallyModerated: number;
    appeals: number;
    successfulAppeals: number;
  };
  riskScore: number; // 0-100
  trustLevel: 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERIFIED';
}

export interface HealthcareModerationRules {
  // Healthcare-specific moderation rules
  enablePHIDetection: boolean;
  enableMedicalMisinformation: boolean;
  enableCredentialVerification: boolean;
  medicalTermWhitelist: string[];
  prohibitedMedicalClaims: string[];
  credentialPatterns: RegExp[];
}

export interface JobPostingModerationRules {
  // Job posting specific rules
  minimumDescriptionLength: number;
  maximumDescriptionLength: number;
  requiredFields: string[];
  salaryRangeValidation: boolean;
  locationValidation: boolean;
  prohibitedCompensationTerms: string[];
  requiredEqualOpportunityStatement: boolean;
}