import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import generate from '@babel/generator';
import type { 
  ComponentAnalysisResult, 
  CodeReuseMetrics, 
  ValidationConfig,
  PlatformSpecificCode,
  MatchedPattern,
  ComponentComplexity
} from '../types/validation-types';
import { DEFAULT_PLATFORM_PATTERNS, PLATFORM_SCORING_WEIGHTS } from '../config/platform-patterns';

export class CodeReuseAnalyzer {
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      sourceDirectory: config.sourceDirectory || './src',
      outputDirectory: config.outputDirectory || './validation-results',
      targetReusePercentage: config.targetReusePercentage || 85,
      excludePatterns: config.excludePatterns || ['**/*.test.*', '**/node_modules/**'],
      includePatterns: config.includePatterns || ['**/*.ts', '**/*.tsx'],
      platformPatterns: config.platformPatterns || DEFAULT_PLATFORM_PATTERNS
    };
  }

  /**
   * Analyze all components in the source directory
   */
  async analyzeComponents(): Promise<CodeReuseMetrics> {
    console.log('🔍 Starting code reuse analysis...');
    
    const files = await this.findComponentFiles();
    console.log(`📁 Found ${files.length} component files to analyze`);

    const componentResults: ComponentAnalysisResult[] = [];
    
    for (const filePath of files) {
      try {
        const result = await this.analyzeComponent(filePath);
        componentResults.push(result);
        console.log(`✅ Analyzed ${result.componentName}: ${result.reusable.percentage.toFixed(1)}% reusable`);
      } catch (error) {
        console.error(`❌ Error analyzing ${filePath}:`, error instanceof Error ? error.message : String(error));
      }
    }

    const metrics = this.calculateOverallMetrics(componentResults);
    
    console.log(`📊 Overall reuse percentage: ${metrics.summary.reusePercentage.toFixed(1)}%`);
    console.log(`🎯 Target met: ${metrics.overall.targetMet ? 'Yes' : 'No'}`);
    
    return metrics;
  }

  /**
   * Analyze a single component file
   */
  async analyzeComponent(filePath: string): Promise<ComponentAnalysisResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(this.config.sourceDirectory, filePath);
    const componentName = this.extractComponentName(filePath);

    // Parse the file into an AST
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy']
    });

    // Analyze the AST
    const analysis = this.analyzeAST(ast, content);
    
    // Calculate reuse percentage
    const totalStatements = analysis.webSpecific.statements + 
                           analysis.nativeSpecific.statements + 
                           analysis.shared.statements;
    
    const reusableStatements = analysis.shared.statements;
    const reusePercentage = totalStatements > 0 ? (reusableStatements / totalStatements) * 100 : 0;

    // Extract dependencies
    const dependencies = this.extractDependencies(ast);

    // Calculate complexity
    const complexity = this.calculateComplexity(ast);

    // Generate recommendations
    const recommendations = this.generateRecommendations(analysis, reusePercentage);

    return {
      filePath: relativePath,
      componentName,
      totalLines: content.split('\n').length,
      totalStatements,
      platformSpecific: {
        web: analysis.webSpecific,
        native: analysis.nativeSpecific
      },
      reusable: {
        lines: analysis.shared.lines,
        statements: analysis.shared.statements,
        percentage: reusePercentage
      },
      dependencies,
      complexity,
      recommendations
    };
  }

  /**
   * Analyze AST for platform-specific patterns
   */
  private analyzeAST(ast: t.File, content: string) {
    const lines = content.split('\n');
    const result = {
      webSpecific: { lines: 0, statements: 0, imports: [], apiCalls: [], patterns: [] } as PlatformSpecificCode,
      nativeSpecific: { lines: 0, statements: 0, imports: [], apiCalls: [], patterns: [] } as PlatformSpecificCode,
      shared: { lines: 0, statements: 0, imports: [], apiCalls: [], patterns: [] } as PlatformSpecificCode
    };

    // Track visited lines to avoid double counting
    const visitedLines = new Set<number>();

    traverse(ast, {
      // Analyze import statements
      ImportDeclaration: (nodePath) => {
        const source = nodePath.node.source.value;
        const lineNumber = nodePath.node.loc?.start.line || 0;
        
        if (this.isWebImport(source)) {
          result.webSpecific.imports.push(source);
          result.webSpecific.statements++;
          if (!visitedLines.has(lineNumber)) {
            result.webSpecific.lines++;
            visitedLines.add(lineNumber);
          }
        } else if (this.isNativeImport(source)) {
          result.nativeSpecific.imports.push(source);
          result.nativeSpecific.statements++;
          if (!visitedLines.has(lineNumber)) {
            result.nativeSpecific.lines++;
            visitedLines.add(lineNumber);
          }
        } else {
          result.shared.imports.push(source);
          result.shared.statements++;
          if (!visitedLines.has(lineNumber)) {
            result.shared.lines++;
            visitedLines.add(lineNumber);
          }
        }
      },

      // Analyze member expressions (API calls)
      MemberExpression: (nodePath) => {
        const memberExpr = this.getMemberExpressionString(nodePath.node);
        const lineNumber = nodePath.node.loc?.start.line || 0;
        
        if (this.isWebAPI(memberExpr)) {
          result.webSpecific.apiCalls.push(memberExpr);
          if (!visitedLines.has(lineNumber)) {
            result.webSpecific.lines++;
            visitedLines.add(lineNumber);
          }
        } else if (this.isNativeAPI(memberExpr)) {
          result.nativeSpecific.apiCalls.push(memberExpr);
          if (!visitedLines.has(lineNumber)) {
            result.nativeSpecific.lines++;
            visitedLines.add(lineNumber);
          }
        }
      },

      // Count all statements with pattern-based categorization
      Statement: (nodePath) => {
        const lineNumber = nodePath.node.loc?.start.line || 0;
        if (!visitedLines.has(lineNumber)) {
          // Categorize based on patterns in real-time
          const categorization = this.categorizeStatementByPattern(nodePath, lineNumber);
          
          // Route to appropriate bucket based on category
          switch (categorization.category) {
            case 'web':
              result.webSpecific.statements++;
              result.webSpecific.lines++;
              // Add pattern metadata
              categorization.patterns.forEach(pattern => {
                if (!result.webSpecific.patterns.some(p => p.line === pattern.line && p.pattern === pattern.pattern)) {
                  result.webSpecific.patterns.push(pattern);
                }
              });
              break;
            case 'native':
              result.nativeSpecific.statements++;
              result.nativeSpecific.lines++;
              // Add pattern metadata
              categorization.patterns.forEach(pattern => {
                if (!result.nativeSpecific.patterns.some(p => p.line === pattern.line && p.pattern === pattern.pattern)) {
                  result.nativeSpecific.patterns.push(pattern);
                }
              });
              break;
            default:
              result.shared.statements++;
              result.shared.lines++;
          }
          
          visitedLines.add(lineNumber);
        }
      }
    });

    // Line pattern analysis now integrated into AST traversal
    // this.analyzeLinePatterns(lines, result); // Deprecated - patterns now detected in real-time

    return result;
  }

  /**
   * Categorize a statement based on its patterns
   */
  private categorizeStatementByPattern(
    nodePath: any,
    lineNumber: number
  ): { category: 'web' | 'native' | 'shared'; patterns: MatchedPattern[] } {
    // Generate code string from AST node
    const nodeCode = generate(nodePath.node).code;
    
    // Initialize result
    const result: { category: 'web' | 'native' | 'shared'; patterns: MatchedPattern[] } = {
      category: 'shared',
      patterns: []
    };
    
    // Check for web-specific patterns
    const webPatterns = this.checkWebPatterns(nodeCode, lineNumber);
    
    // Check for native-specific patterns
    const nativePatterns = this.checkNativePatterns(nodeCode, lineNumber);
    
    // Apply categorization logic with priority
    if (webPatterns.length > 0 && nativePatterns.length > 0) {
      // Conflict resolution: web takes priority for DOM/style conflicts
      result.category = webPatterns.length >= nativePatterns.length ? 'web' : 'native';
      result.patterns = [...webPatterns, ...nativePatterns];
    } else if (webPatterns.length > 0) {
      result.category = 'web';
      result.patterns = webPatterns;
    } else if (nativePatterns.length > 0) {
      result.category = 'native';
      result.patterns = nativePatterns;
    }
    
    return result;
  }

  /**
   * Check for web-specific patterns
   */
  private checkWebPatterns(code: string, lineNumber: number): MatchedPattern[] {
    const patterns: MatchedPattern[] = [];
    
    // Check each web pattern
    for (const pattern of this.config.platformPatterns.web.patterns) {
      if (pattern.test(code)) {
        patterns.push({
          pattern: pattern.source,
          line: lineNumber,
          code: code.trim().substring(0, 100), // Truncate for storage
          reason: this.getWebPatternReason(pattern)
        });
      }
    }
    
    return patterns;
  }

  /**
   * Check for native-specific patterns
   */
  private checkNativePatterns(code: string, lineNumber: number): MatchedPattern[] {
    const patterns: MatchedPattern[] = [];
    
    // Check each native pattern
    for (const pattern of this.config.platformPatterns.native.patterns) {
      if (pattern.test(code)) {
        patterns.push({
          pattern: pattern.source,
          line: lineNumber,
          code: code.trim().substring(0, 100), // Truncate for storage
          reason: this.getNativePatternReason(pattern)
        });
      }
    }
    
    return patterns;
  }

  /**
   * Get human-readable reason for web pattern
   */
  private getWebPatternReason(pattern: RegExp): string {
    const patternMap: Record<string, string> = {
      'className': 'Web-specific className attribute',
      'classList': 'DOM classList manipulation',
      'style\\s*=': 'Inline style attribute',
      'document\\.': 'Direct DOM access',
      'window\\.': 'Browser window object',
      'localStorage': 'Web storage API',
      'onClick': 'Web event handler',
      'onSubmit': 'Form submission handler',
      'createPortal': 'React DOM portal'
    };
    
    for (const [key, reason] of Object.entries(patternMap)) {
      if (pattern.source.includes(key)) {
        return reason;
      }
    }
    
    return 'Web-specific pattern detected';
  }

  /**
   * Get human-readable reason for native pattern
   */
  private getNativePatternReason(pattern: RegExp): string {
    const patternMap: Record<string, string> = {
      'StyleSheet\\.create': 'React Native StyleSheet',
      'View\\s+style': 'Native View component',
      'Text\\s+style': 'Native Text component',
      'TouchableOpacity': 'Native touch handler',
      'ScrollView': 'Native scroll component',
      'FlatList': 'Native list component',
      'Animated\\.': 'Native animation API',
      'Platform\\.': 'React Native Platform API'
    };
    
    for (const [key, reason] of Object.entries(patternMap)) {
      if (pattern.source.includes(key)) {
        return reason;
      }
    }
    
    return 'React Native-specific pattern detected';
  }

  /**
   * Analyze patterns line by line
   * @deprecated Now integrated into AST traversal for accurate counting
   */
  private analyzeLinePatterns(lines: string[], result: any) {
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check web patterns
      for (const pattern of this.config.platformPatterns.web.patterns) {
        if (pattern.test(line)) {
          result.webSpecific.patterns.push({
            pattern: pattern.source,
            line: lineNumber,
            code: line.trim(),
            reason: 'Web-specific pattern detected'
          });
          break;
        }
      }

      // Check native patterns
      for (const pattern of this.config.platformPatterns.native.patterns) {
        if (pattern.test(line)) {
          result.nativeSpecific.patterns.push({
            pattern: pattern.source,
            line: lineNumber,
            code: line.trim(),
            reason: 'React Native-specific pattern detected'
          });
          break;
        }
      }
    });
  }

  /**
   * Check if import is web-specific
   */
  private isWebImport(importPath: string): boolean {
    return this.config.platformPatterns.web.imports.some(pattern => 
      importPath.includes(pattern)
    );
  }

  /**
   * Check if import is React Native-specific
   */
  private isNativeImport(importPath: string): boolean {
    return this.config.platformPatterns.native.imports.some(pattern => 
      importPath.includes(pattern)
    );
  }

  /**
   * Check if API call is web-specific
   */
  private isWebAPI(apiCall: string): boolean {
    return this.config.platformPatterns.web.apis.some(api => 
      apiCall.includes(api)
    );
  }

  /**
   * Check if API call is React Native-specific
   */
  private isNativeAPI(apiCall: string): boolean {
    return this.config.platformPatterns.native.apis.some(api => 
      apiCall.includes(api)
    );
  }

  /**
   * Convert member expression to string
   */
  private getMemberExpressionString(node: t.MemberExpression): string {
    let result = '';
    
    if (t.isIdentifier(node.object)) {
      result = node.object.name;
    } else if (t.isMemberExpression(node.object)) {
      result = this.getMemberExpressionString(node.object);
    }
    
    if (t.isIdentifier(node.property)) {
      result += '.' + node.property.name;
    }
    
    return result;
  }

  /**
   * Extract dependencies from imports
   */
  private extractDependencies(ast: t.File): string[] {
    const dependencies: string[] = [];
    
    traverse(ast, {
      ImportDeclaration: (nodePath) => {
        const source = nodePath.node.source.value;
        if (!source.startsWith('.') && !source.startsWith('/')) {
          dependencies.push(source);
        }
      }
    });
    
    return [...new Set(dependencies)];
  }

  /**
   * Calculate component complexity
   */
  private calculateComplexity(ast: t.File): ComponentComplexity {
    let cyclomaticComplexity = 1; // Base complexity
    let cognitiveComplexity = 0;
    let dependencies = 0;
    let hooks = 0;
    let props = 0;

    traverse(ast, {
      // Count control flow for cyclomatic and cognitive complexity
      IfStatement: () => {
        cyclomaticComplexity++;
        cognitiveComplexity += 2;
      },
      WhileStatement: () => {
        cyclomaticComplexity++;
        cognitiveComplexity += 2;
      },
      ForStatement: () => {
        cyclomaticComplexity++;
        cognitiveComplexity += 2;
      },
      SwitchCase: () => {
        cyclomaticComplexity++;
      },
      SwitchStatement: () => {
        cognitiveComplexity += 3;
      },
      ConditionalExpression: () => {
        cyclomaticComplexity++;
      },
      LogicalExpression: () => {
        cyclomaticComplexity++;
      },

      // Count React hooks
      CallExpression: (nodePath) => {
        if (t.isIdentifier(nodePath.node.callee) && 
            nodePath.node.callee.name.startsWith('use')) {
          hooks++;
        }
      },

      // Count imports as dependencies
      ImportDeclaration: () => {
        dependencies++;
      },

      // Count props (simplified)
      ObjectPattern: (nodePath) => {
        if (nodePath.parent && t.isFunctionDeclaration(nodePath.parent)) {
          props += nodePath.node.properties.length;
        }
      }
    });

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      dependencies,
      hooks,
      props
    };
  }

  /**
   * Generate recommendations for improving reusability
   */
  private generateRecommendations(analysis: any, reusePercentage: number): string[] {
    const recommendations: string[] = [];

    if (reusePercentage < this.config.targetReusePercentage) {
      recommendations.push(
        `Component is below ${this.config.targetReusePercentage}% reuse target (${reusePercentage.toFixed(1)}%)`
      );
    }

    if (analysis.webSpecific.imports.length > 0) {
      recommendations.push(
        `Consider abstracting web-specific imports: ${analysis.webSpecific.imports.join(', ')}`
      );
    }

    if (analysis.nativeSpecific.imports.length > 0) {
      recommendations.push(
        `Consider abstracting React Native-specific imports: ${analysis.nativeSpecific.imports.join(', ')}`
      );
    }

    if (analysis.webSpecific.patterns.length > 3) {
      recommendations.push(
        'High number of web-specific patterns detected. Consider platform abstraction.'
      );
    }

    if (analysis.nativeSpecific.patterns.length > 3) {
      recommendations.push(
        'High number of React Native-specific patterns detected. Consider platform abstraction.'
      );
    }

    return recommendations;
  }

  /**
   * Find all component files to analyze
   */
  private async findComponentFiles(): Promise<string[]> {
    const includeGlobs = this.config.includePatterns.map(pattern => 
      path.join(this.config.sourceDirectory, pattern)
    );
    
    const allFiles: string[] = [];
    for (const globPattern of includeGlobs) {
      const files = await glob(globPattern, {
        ignore: this.config.excludePatterns
      });
      allFiles.push(...files);
    }
    
    return [...new Set(allFiles)];
  }

  /**
   * Extract component name from file path
   */
  private extractComponentName(filePath: string): string {
    const basename = path.basename(filePath, path.extname(filePath));
    // Convert kebab-case or snake_case to PascalCase
    return basename
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Calculate overall metrics from component results
   */
  private calculateOverallMetrics(results: ComponentAnalysisResult[]): CodeReuseMetrics {
    const totalComponents = results.length;
    const totalLines = results.reduce((sum, r) => sum + r.totalLines, 0);
    const reusableLines = results.reduce((sum, r) => sum + r.reusable.lines, 0);
    const webSpecificLines = results.reduce((sum, r) => sum + r.platformSpecific.web.lines, 0);
    const nativeSpecificLines = results.reduce((sum, r) => sum + r.platformSpecific.native.lines, 0);
    
    const averageReusePercentage = totalComponents > 0 
      ? results.reduce((sum, r) => sum + r.reusable.percentage, 0) / totalComponents 
      : 0;
    
    const reusePercentage = totalLines > 0 ? (reusableLines / totalLines) * 100 : 0;
    const targetMet = averageReusePercentage >= this.config.targetReusePercentage;
    
    const componentsAboveTarget = results.filter(r => 
      r.reusable.percentage >= this.config.targetReusePercentage
    ).length;
    
    const componentsBelowTarget = totalComponents - componentsAboveTarget;

    return {
      overall: {
        totalComponents,
        averageReusePercentage,
        targetMet,
        componentsAboveTarget,
        componentsBelowTarget
      },
      byComponent: results,
      summary: {
        totalLines,
        reusableLines,
        webSpecificLines,
        nativeSpecificLines,
        reusePercentage
      },
      trends: {
        historicalData: [], // Will be populated from saved data
        trend: 'stable'
      }
    };
  }

  /**
   * Save analysis results
   */
  async saveResults(metrics: CodeReuseMetrics, outputPath?: string): Promise<string> {
    const outputFile = outputPath || path.join(
      this.config.outputDirectory, 
      `code-reuse-analysis-${new Date().toISOString().split('T')[0]}.json`
    );
    
    await fs.ensureDir(path.dirname(outputFile));
    await fs.writeJSON(outputFile, metrics, { spaces: 2 });
    
    console.log(`💾 Results saved to: ${outputFile}`);
    return outputFile;
  }
}