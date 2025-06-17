/**
 * Security Package Type Definitions
 */

export type VulnerabilityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ThreatLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScanResult {
  id: string;
  timestamp: number;
  target: string;
  vulnerabilities: Vulnerability[];
  summary: ScanSummary;
  recommendations: string[];
  scanDuration: number;
  scanType: 'OWASP_ZAP' | 'SNYK' | 'CUSTOM' | 'DEPENDENCY';
}

export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  level: VulnerabilityLevel;
  category: string;
  cwe?: string;
  cvss?: number;
  evidence: string[];
  location: {
    url?: string;
    file?: string;
    line?: number;
    method?: string;
  };
  solution: string;
  references: string[];
}

export interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  passed: boolean;
}

export interface SecurityConfiguration {
  zapProxy?: {
    host: string;
    port: number;
    timeout: number;
  };
  snyk?: {
    token: string;
    organization?: string;
  };
  targets: {
    web: string[];
    api: string[];
  };
  thresholds: {
    critical: number;
    high: number;
    medium: number;
  };
  reporting: {
    format: 'JSON' | 'HTML' | 'PDF';
    outputPath: string;
    includeEvidence: boolean;
  };
}

export interface ZAPScanOptions {
  target: string;
  scanType: 'QUICK' | 'FULL' | 'API';
  timeout?: number;
  excludePaths?: string[];
  authentication?: {
    loginUrl: string;
    username: string;
    password: string;
    usernameField: string;
    passwordField: string;
  };
  customHeaders?: Record<string, string>;
  contextName?: string;
}

export interface ValidationRule {
  field: string;
  type: 'email' | 'phone' | 'password' | 'name' | 'custom';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize: boolean;
  customValidator?: (value: any) => boolean | string;
}

export interface SecurityReport {
  id: string;
  title: string;
  timestamp: number;
  executive_summary: string;
  scan_results: ScanResult[];
  metrics: SecurityMetrics;
  compliance: ComplianceReport;
  recommendations: RecommendationItem[];
  nextScanDate: number;
}

export interface SecurityMetrics {
  total_vulnerabilities: number;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  medium_vulnerabilities: number;
  low_vulnerabilities: number;
  fixed_vulnerabilities: number;
  new_vulnerabilities: number;
  security_score: number; // 0-100
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export interface ComplianceReport {
  standards: {
    owasp_top_10: ComplianceItem[];
    hipaa: ComplianceItem[];
    gdpr: ComplianceItem[];
    pci_dss?: ComplianceItem[];
  };
  overall_compliance: number; // 0-100
}

export interface ComplianceItem {
  requirement: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NOT_APPLICABLE';
  description: string;
  evidence?: string[];
  remediation?: string;
}

export interface RecommendationItem {
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  description: string;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  timeline: string;
}

export interface SecurityMiddlewareConfig {
  enableHelmet: boolean;
  enableRateLimit: boolean;
  enableValidation: boolean;
  enableCSP: boolean;
  csp?: {
    directives: Record<string, string[]>;
  };
  rateLimit?: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
  };
}

export interface ThreatDetection {
  id: string;
  timestamp: number;
  type: 'SQL_INJECTION' | 'XSS' | 'CSRF' | 'BRUTE_FORCE' | 'DDoS' | 'MALWARE' | 'SUSPICIOUS_ACTIVITY';
  level: ThreatLevel;
  source: {
    ip: string;
    userAgent?: string;
    country?: string;
    userId?: string;
  };
  target: {
    endpoint: string;
    method: string;
    params?: Record<string, any>;
  };
  evidence: string[];
  blocked: boolean;
  action_taken: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: number;
  user_id?: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  details: Record<string, any>;
  risk_level: ThreatLevel;
}