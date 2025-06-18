/**
 * Type definitions for cross-platform validation
 */

export interface ValidationConfig {
  sourceDirectory: string;
  outputDirectory: string;
  targetReusePercentage: number;
  excludePatterns: string[];
  includePatterns: string[];
  platformPatterns: PlatformPatterns;
}

export interface PlatformPatterns {
  web: {
    imports: string[];
    apis: string[];
    patterns: RegExp[];
  };
  native: {
    imports: string[];
    apis: string[];
    patterns: RegExp[];
  };
  shared: {
    imports: string[];
    apis: string[];
    patterns: RegExp[];
  };
}

export interface ComponentAnalysisResult {
  filePath: string;
  componentName: string;
  totalLines: number;
  totalStatements: number;
  platformSpecific: {
    web: PlatformSpecificCode;
    native: PlatformSpecificCode;
  };
  reusable: {
    lines: number;
    statements: number;
    percentage: number;
  };
  dependencies: string[];
  complexity: ComponentComplexity;
  recommendations: string[];
}

export interface PlatformSpecificCode {
  lines: number;
  statements: number;
  imports: string[];
  apiCalls: string[];
  patterns: MatchedPattern[];
}

export interface MatchedPattern {
  pattern: string;
  line: number;
  code: string;
  reason: string;
}

export interface ComponentComplexity {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  dependencies: number;
  hooks: number;
  props: number;
}

export interface CodeReuseMetrics {
  overall: {
    totalComponents: number;
    averageReusePercentage: number;
    targetMet: boolean;
    componentsAboveTarget: number;
    componentsBelowTarget: number;
  };
  byComponent: ComponentAnalysisResult[];
  summary: {
    totalLines: number;
    reusableLines: number;
    webSpecificLines: number;
    nativeSpecificLines: number;
    reusePercentage: number;
  };
  trends: {
    historicalData: HistoricalDataPoint[];
    trend: 'improving' | 'declining' | 'stable';
  };
}

export interface HistoricalDataPoint {
  date: string;
  reusePercentage: number;
  totalComponents: number;
  totalLines: number;
}

export interface PlatformCompatibilityReport {
  componentName: string;
  webCompatible: boolean;
  nativeCompatible: boolean;
  compatibilityScore: number;
  issues: CompatibilityIssue[];
  recommendations: CompatibilityRecommendation[];
  extractionReadiness: ExtractionReadiness;
}

export interface CompatibilityIssue {
  type: 'error' | 'warning' | 'info';
  category: 'import' | 'api' | 'styling' | 'navigation' | 'storage' | 'other';
  description: string;
  line: number;
  code: string;
  solution?: string;
}

export interface CompatibilityRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  implementation: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface ExtractionReadiness {
  canExtract: boolean;
  blockers: string[];
  warnings: string[];
  readinessScore: number;
  estimatedWork: 'low' | 'medium' | 'high';
}

export interface ValidationReport {
  timestamp: string;
  config: ValidationConfig;
  codeReuseMetrics: CodeReuseMetrics;
  compatibilityReports: PlatformCompatibilityReport[];
  summary: {
    overallScore: number;
    targetsMet: boolean;
    criticalIssues: number;
    recommendationsCount: number;
  };
  nextSteps: string[];
}