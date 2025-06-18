/**
 * Cross-Platform Validation Tools
 * 
 * This package provides tools for validating component reusability and cross-platform compatibility
 * across web and React Native platforms.
 */

export * from './analyzers/code-reuse-analyzer';
export * from './analyzers/platform-compatibility-analyzer';
export * from './generators/report-generator';
export * from './extractors/component-extractor';
export * from './types/validation-types';

// Re-export commonly used types
export type {
  ComponentAnalysisResult,
  PlatformCompatibilityReport,
  CodeReuseMetrics,
  ValidationConfig
} from './types/validation-types';