/**
 * Moderation Package Entry Point
 * Content moderation and spam prevention for LocumTrueRate platform
 */

export { SpamDetector } from './spam';
export { ContentModerator } from './content';
export { ContentFilters } from './filters';
export { AIModeration } from './ai';
export { ModerationManager } from './manager';

// Re-export types
export type {
  ModerationResult,
  SpamScore,
  ContentCategory,
  FilterRule,
  ModerationConfig,
  ToxicityScore,
  ContentFlags,
  ModerationAction,
  AIModerationResult
} from './types';