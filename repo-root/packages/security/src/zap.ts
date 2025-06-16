/**
 * OWASP ZAP Scanner Integration
 * Automated security testing using OWASP ZAP proxy
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { ZAPScanOptions, ScanResult, Vulnerability, VulnerabilityLevel } from './types';

export class ZAPScanner {
  private zapBaseUrl: string;
  private timeout: number;

  constructor(
    private config: {
      host: string;
      port: number;
      timeout?: number;
    }
  ) {
    this.zapBaseUrl = `http://${config.host}:${config.port}`;
    this.timeout = config.timeout || 300000; // 5 minutes default
  }

  /**
   * Perform a comprehensive security scan
   */
  async scan(options: ZAPScanOptions): Promise<ScanResult> {
    const scanId = uuidv4();
    const startTime = Date.now();

    try {
      console.log(`🔍 Starting OWASP ZAP scan for: ${options.target}`);

      // Initialize ZAP session
      await this.initializeSession(options.contextName || 'LocumTrueRate');

      // Set up authentication if provided
      if (options.authentication) {
        await this.setupAuthentication(options.authentication);
      }

      // Configure scan settings
      await this.configureScan(options);

      // Start spider scan
      console.log('🕷️ Starting spider scan...');
      const spiderScanId = await this.startSpiderScan(options.target);
      await this.waitForSpiderCompletion(spiderScanId);

      // Start active scan
      console.log('🎯 Starting active security scan...');
      const activeScanId = await this.startActiveScan(options.target);
      await this.waitForActiveScanCompletion(activeScanId);

      // Get results
      const alerts = await this.getAlerts(options.target);
      const vulnerabilities = this.parseAlerts(alerts);

      const scanResult: ScanResult = {
        id: scanId,
        timestamp: startTime,
        target: options.target,
        vulnerabilities,
        summary: this.generateSummary(vulnerabilities),
        recommendations: this.generateRecommendations(vulnerabilities),
        scanDuration: Date.now() - startTime,
        scanType: 'OWASP_ZAP'
      };

      console.log(`✅ ZAP scan completed. Found ${vulnerabilities.length} issues.`);
      return scanResult;

    } catch (error) {
      console.error('❌ ZAP scan failed:', error);
      throw new Error(`ZAP scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Quick vulnerability scan (faster, less comprehensive)
   */
  async quickScan(target: string): Promise<ScanResult> {
    return this.scan({
      target,
      scanType: 'QUICK',
      timeout: 60000 // 1 minute
    });
  }

  /**
   * API-specific security scan
   */
  async apiScan(target: string, openApiSpec?: string): Promise<ScanResult> {
    const options: ZAPScanOptions = {
      target,
      scanType: 'API',
      timeout: 120000 // 2 minutes
    };

    if (openApiSpec) {
      // Import OpenAPI spec into ZAP
      await this.importOpenApiSpec(openApiSpec);
    }

    return this.scan(options);
  }

  /**
   * Initialize ZAP session
   */
  private async initializeSession(contextName: string): Promise<void> {
    try {
      // Create new session
      await this.zapRequest('core/action/newSession/', {
        name: `LocumTrueRate_${Date.now()}`,
        overwrite: 'true'
      });

      // Create context
      await this.zapRequest('context/action/newContext/', {
        contextName
      });

    } catch (error) {
      throw new Error(`Failed to initialize ZAP session: ${error}`);
    }
  }

  /**
   * Configure scan settings
   */
  private async configureScan(options: ZAPScanOptions): Promise<void> {
    try {
      // Set scan policy based on scan type
      const policyName = options.scanType === 'QUICK' ? 'Light' : 'Default Policy';
      
      // Configure excluded paths
      if (options.excludePaths) {
        for (const path of options.excludePaths) {
          await this.zapRequest('core/action/excludeFromProxy/', {
            regex: path
          });
        }
      }

      // Set custom headers
      if (options.customHeaders) {
        for (const [name, value] of Object.entries(options.customHeaders)) {
          await this.zapRequest('replacer/action/addRule/', {
            description: `Custom header: ${name}`,
            enabled: 'true',
            matchType: 'REQ_HEADER',
            matchString: name,
            replacement: value
          });
        }
      }

    } catch (error) {
      throw new Error(`Failed to configure scan: ${error}`);
    }
  }

  /**
   * Setup authentication
   */
  private async setupAuthentication(auth: ZAPScanOptions['authentication']): Promise<void> {
    if (!auth) return;

    try {
      // Configure form-based authentication
      await this.zapRequest('authentication/action/setAuthenticationMethod/', {
        contextId: '0',
        authMethodName: 'formBasedAuthentication',
        authMethodConfigParams: `loginUrl=${auth.loginUrl}&loginRequestData=username%3D{%25username%25}%26password%3D{%25password%25}`
      });

      // Set credentials
      await this.zapRequest('users/action/newUser/', {
        contextId: '0', 
        name: 'testuser',
        enabled: 'true'
      });

      await this.zapRequest('users/action/setAuthenticationCredentials/', {
        contextId: '0',
        userId: '0',
        authCredentialsConfigParams: `username=${auth.username}&password=${auth.password}`
      });

    } catch (error) {
      throw new Error(`Failed to setup authentication: ${error}`);
    }
  }

  /**
   * Start spider scan
   */
  private async startSpiderScan(target: string): Promise<string> {
    const response = await this.zapRequest('spider/action/scan/', {
      url: target,
      maxChildren: '10',
      recurse: 'true',
      contextName: 'LocumTrueRate'
    });
    
    return response.scan;
  }

  /**
   * Wait for spider scan completion
   */
  private async waitForSpiderCompletion(scanId: string): Promise<void> {
    let progress = 0;
    const maxWait = this.timeout;
    const startTime = Date.now();

    while (progress < 100 && (Date.now() - startTime) < maxWait) {
      const status = await this.zapRequest('spider/view/status/', { scanId });
      progress = parseInt(status.status);
      
      if (progress < 100) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (progress < 100) {
      throw new Error('Spider scan timeout');
    }
  }

  /**
   * Start active security scan
   */
  private async startActiveScan(target: string): Promise<string> {
    const response = await this.zapRequest('ascan/action/scan/', {
      url: target,
      recurse: 'true',
      inScopeOnly: 'false',
      scanPolicyName: 'Default Policy',
      method: 'GET'
    });

    return response.scan;
  }

  /**
   * Wait for active scan completion
   */
  private async waitForActiveScanCompletion(scanId: string): Promise<void> {
    let progress = 0;
    const maxWait = this.timeout;
    const startTime = Date.now();

    while (progress < 100 && (Date.now() - startTime) < maxWait) {
      const status = await this.zapRequest('ascan/view/status/', { scanId });
      progress = parseInt(status.status);
      
      if (progress < 100) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (progress < 100) {
      throw new Error('Active scan timeout');
    }
  }

  /**
   * Get security alerts from ZAP
   */
  private async getAlerts(target: string): Promise<any[]> {
    const response = await this.zapRequest('core/view/alerts/', {
      baseurl: target,
      start: '0',
      count: '1000'
    });

    return response.alerts || [];
  }

  /**
   * Parse ZAP alerts into vulnerability objects
   */
  private parseAlerts(alerts: any[]): Vulnerability[] {
    return alerts.map(alert => ({
      id: uuidv4(),
      name: alert.name || alert.alert,
      description: alert.description || '',
      level: this.mapRiskLevel(alert.risk),
      category: alert.category || 'Unknown',
      cwe: alert.cweid ? `CWE-${alert.cweid}` : undefined,
      cvss: alert.confidence ? parseFloat(alert.confidence) : undefined,
      evidence: alert.instances?.map((i: any) => i.evidence || i.uri) || [],
      location: {
        url: alert.url,
        method: alert.method,
      },
      solution: alert.solution || 'No solution provided',
      references: alert.reference ? alert.reference.split('\n').filter(Boolean) : []
    }));
  }

  /**
   * Map ZAP risk levels to our vulnerability levels
   */
  private mapRiskLevel(risk: string): VulnerabilityLevel {
    switch (risk?.toLowerCase()) {
      case 'high': return 'HIGH';
      case 'medium': return 'MEDIUM';
      case 'low': return 'LOW';
      case 'informational': return 'LOW';
      default: return 'MEDIUM';
    }
  }

  /**
   * Generate scan summary
   */
  private generateSummary(vulnerabilities: Vulnerability[]) {
    const summary = {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter(v => v.level === 'CRITICAL').length,
      high: vulnerabilities.filter(v => v.level === 'HIGH').length,
      medium: vulnerabilities.filter(v => v.level === 'MEDIUM').length,
      low: vulnerabilities.filter(v => v.level === 'LOW').length,
      passed: false
    };

    // Scan passes if no critical or high vulnerabilities
    summary.passed = summary.critical === 0 && summary.high === 0;

    return summary;
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(vulnerabilities: Vulnerability[]): string[] {
    const recommendations: string[] = [];
    const categories = new Set(vulnerabilities.map(v => v.category));

    categories.forEach(category => {
      switch (category.toLowerCase()) {
        case 'injection':
          recommendations.push('Implement input validation and parameterized queries to prevent injection attacks');
          break;
        case 'authentication':
          recommendations.push('Strengthen authentication mechanisms and implement multi-factor authentication');
          break;
        case 'session management':
          recommendations.push('Implement secure session management with proper timeout and regeneration');
          break;
        case 'access control':
          recommendations.push('Review and strengthen access control mechanisms');
          break;
        case 'security misconfiguration':
          recommendations.push('Review and harden security configurations');
          break;
        case 'sensitive data exposure':
          recommendations.push('Implement proper encryption for sensitive data at rest and in transit');
          break;
        default:
          recommendations.push(`Review and address ${category} related vulnerabilities`);
      }
    });

    return recommendations;
  }

  /**
   * Import OpenAPI specification
   */
  private async importOpenApiSpec(specUrl: string): Promise<void> {
    try {
      await this.zapRequest('openapi/action/importUrl/', {
        url: specUrl
      });
    } catch (error) {
      console.warn('Failed to import OpenAPI spec:', error);
    }
  }

  /**
   * Make request to ZAP API
   */
  private async zapRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = `${this.zapBaseUrl}/JSON/${endpoint}`;
    const response = await axios.get(url, {
      params,
      timeout: this.timeout
    });

    if (response.data?.Result === 'ERROR') {
      throw new Error(response.data.Message || 'ZAP API error');
    }

    return response.data;
  }

  /**
   * Check if ZAP is running
   */
  async isZapRunning(): Promise<boolean> {
    try {
      await this.zapRequest('core/view/version/');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get ZAP version info
   */
  async getZapVersion(): Promise<string> {
    try {
      const response = await this.zapRequest('core/view/version/');
      return response.version;
    } catch (error) {
      throw new Error('Failed to get ZAP version');
    }
  }
}