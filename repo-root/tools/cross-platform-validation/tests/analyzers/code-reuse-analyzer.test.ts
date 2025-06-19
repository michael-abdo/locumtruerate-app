/**
 * Unit Tests for CodeReuseAnalyzer
 * 
 * These tests validate the core logic fix that integrates pattern detection
 * into AST traversal, ensuring accurate statement categorization.
 */

import { CodeReuseAnalyzer } from '../../src/analyzers/code-reuse-analyzer';
import { DEFAULT_VALIDATION_CONFIG } from '../../src/config/platform-patterns';
import { parse } from '@babel/parser';
import { 
  WEB_PATTERN_FIXTURES, 
  NATIVE_PATTERN_FIXTURES, 
  SHARED_PATTERN_FIXTURES,
  CONFLICT_PATTERN_FIXTURES,
  EDGE_CASE_FIXTURES,
  TestPatternFixture
} from '../fixtures/test-patterns';

describe('CodeReuseAnalyzer', () => {
  let analyzer: CodeReuseAnalyzer;

  beforeEach(() => {
    // Create analyzer instance with default config
    analyzer = new CodeReuseAnalyzer(DEFAULT_VALIDATION_CONFIG);
  });

  describe('categorizeStatementByPattern()', () => {
    
    /**
     * Create a mock AST node path for testing
     */
    function createMockNodePath(code: string) {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      return {
        node: ast.program.body[0] || {
          type: 'ExpressionStatement',
          loc: { start: { line: 1 } }
        }
      };
    }

    /**
     * Helper to test categorization with real AST nodes
     */
    function testCategorization(fixture: TestPatternFixture) {
      const nodePath = createMockNodePath(fixture.code);
      
      // Use reflection to access private method
      const result = (analyzer as any).categorizeStatementByPattern(
        nodePath, 
        fixture.lineNumber
      );

      expect(result.category).toBe(fixture.expectedCategory);
      
      // Verify expected patterns are found
      fixture.expectedPatterns.forEach(expectedPattern => {
        const patternFound = result.patterns.some(p => 
          p.pattern.includes(expectedPattern.replace(/\\/g, ''))
        );
        expect(patternFound).toBe(true);
      });

      return result;
    }

    describe('Web Pattern Detection', () => {
      WEB_PATTERN_FIXTURES.forEach(fixture => {
        test(`should categorize as web: ${fixture.description}`, () => {
          testCategorization(fixture);
        });
      });

      test('should detect className patterns accurately', () => {
        const fixture = WEB_PATTERN_FIXTURES.find(f => f.description.includes('className'));
        expect(fixture).toBeDefined();
        
        const result = testCategorization(fixture!);
        expect(result.patterns.length).toBeGreaterThan(0);
        expect(result.patterns.some(p => p.reason.includes('className'))).toBe(true);
      });

      test('should detect DOM API patterns', () => {
        const fixture = WEB_PATTERN_FIXTURES.find(f => f.description.includes('Document API'));
        expect(fixture).toBeDefined();
        
        const result = testCategorization(fixture!);
        expect(result.patterns.some(p => p.reason.includes('DOM'))).toBe(true);
      });
    });

    describe('Native Pattern Detection', () => {
      NATIVE_PATTERN_FIXTURES.forEach(fixture => {
        test(`should categorize as native: ${fixture.description}`, () => {
          testCategorization(fixture);
        });
      });

      test('should detect StyleSheet.create patterns', () => {
        const fixture = NATIVE_PATTERN_FIXTURES.find(f => f.description.includes('StyleSheet'));
        expect(fixture).toBeDefined();
        
        const result = testCategorization(fixture!);
        expect(result.patterns.some(p => p.pattern.includes('StyleSheet'))).toBe(true);
      });

      test('should detect Platform.OS patterns', () => {
        const fixture = NATIVE_PATTERN_FIXTURES.find(f => f.description.includes('Platform.OS'));
        expect(fixture).toBeDefined();
        
        const result = testCategorization(fixture!);
        expect(result.patterns.some(p => p.pattern.includes('Platform'))).toBe(true);
      });
    });

    describe('Shared Pattern Detection', () => {
      SHARED_PATTERN_FIXTURES.forEach(fixture => {
        test(`should categorize as shared: ${fixture.description}`, () => {
          testCategorization(fixture);
        });
      });

      test('should not detect any platform-specific patterns in shared code', () => {
        SHARED_PATTERN_FIXTURES.forEach(fixture => {
          const result = testCategorization(fixture);
          expect(result.patterns.length).toBe(0);
        });
      });
    });

    describe('Pattern Conflict Resolution', () => {
      CONFLICT_PATTERN_FIXTURES.forEach(fixture => {
        test(`should resolve conflicts correctly: ${fixture.description}`, () => {
          testCategorization(fixture);
        });
      });

      test('should prioritize web patterns over native when counts are equal', () => {
        const webNativeConflict = CONFLICT_PATTERN_FIXTURES.find(
          f => f.description.includes('className') && f.description.includes('alignItems')
        );
        expect(webNativeConflict).toBeDefined();
        
        const result = testCategorization(webNativeConflict!);
        expect(result.category).toBe('web');
        expect(result.patterns.length).toBeGreaterThan(1);
      });

      test('should choose category with higher pattern count', () => {
        // Test case where one platform has more patterns
        const code = '<div className="flex" style={{display: "block"}} onClick={handler} />';
        const nodePath = createMockNodePath(code);
        
        const result = (analyzer as any).categorizeStatementByPattern(nodePath, 1);
        
        // Should be web due to multiple web patterns (className, onClick, div)
        expect(result.category).toBe('web');
      });
    });

    describe('Edge Cases', () => {
      EDGE_CASE_FIXTURES.forEach(fixture => {
        test(`should handle edge case: ${fixture.description}`, () => {
          testCategorization(fixture);
        });
      });

      test('should handle empty code', () => {
        const result = (analyzer as any).categorizeStatementByPattern(
          { node: { type: 'EmptyStatement', loc: { start: { line: 1 } } } },
          1
        );
        
        expect(result.category).toBe('shared');
        expect(result.patterns.length).toBe(0);
      });

      test('should handle complex nested JSX', () => {
        const code = `
          <div className="container">
            <TouchableOpacity onPress={handlePress}>
              <Text style={styles.text}>Hello</Text>
            </TouchableOpacity>
          </div>
        `;
        
        const nodePath = createMockNodePath(code);
        const result = (analyzer as any).categorizeStatementByPattern(nodePath, 1);
        
        // Should detect both web and native patterns
        expect(result.patterns.length).toBeGreaterThan(1);
        
        // Web should win due to div + className
        expect(result.category).toBe('web');
      });
    });

    describe('Line Number Tracking', () => {
      test('should preserve line number in pattern metadata', () => {
        const lineNumber = 42;
        const fixture = WEB_PATTERN_FIXTURES[0];
        
        const nodePath = createMockNodePath(fixture.code);
        const result = (analyzer as any).categorizeStatementByPattern(nodePath, lineNumber);
        
        result.patterns.forEach(pattern => {
          expect(pattern.line).toBe(lineNumber);
        });
      });

      test('should handle invalid line numbers gracefully', () => {
        const fixture = SHARED_PATTERN_FIXTURES[0];
        const nodePath = createMockNodePath(fixture.code);
        
        // Test with negative line number
        const result = (analyzer as any).categorizeStatementByPattern(nodePath, -1);
        expect(result.category).toBe('shared');
        
        // Test with zero line number
        const result2 = (analyzer as any).categorizeStatementByPattern(nodePath, 0);
        expect(result2.category).toBe('shared');
      });
    });

    describe('Performance', () => {
      test('should categorize patterns efficiently', () => {
        const startTime = performance.now();
        
        // Run categorization on multiple fixtures
        WEB_PATTERN_FIXTURES.forEach(fixture => {
          testCategorization(fixture);
        });
        
        NATIVE_PATTERN_FIXTURES.forEach(fixture => {
          testCategorization(fixture);
        });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Should complete within reasonable time (less than 100ms for all fixtures)
        expect(duration).toBeLessThan(100);
      });

      test('should handle large code strings without timeout', () => {
        // Create a large code string
        const largeCode = 'const items = [' + 
          Array(1000).fill(0).map((_, i) => `"item${i}"`).join(', ') + 
          '];';
        
        const nodePath = createMockNodePath(largeCode);
        
        const startTime = performance.now();
        const result = (analyzer as any).categorizeStatementByPattern(nodePath, 1);
        const endTime = performance.now();
        
        expect(result.category).toBe('shared');
        expect(endTime - startTime).toBeLessThan(50); // Should be fast even for large strings
      });
    });
  });

  describe('Integration with Pattern Check Methods', () => {
    test('checkWebPatterns should return correct pattern metadata', () => {
      const code = '<div className="test">Content</div>';
      const lineNumber = 10;
      
      const webPatterns = (analyzer as any).checkWebPatterns(code, lineNumber);
      
      expect(webPatterns.length).toBeGreaterThan(0);
      webPatterns.forEach(pattern => {
        expect(pattern.line).toBe(lineNumber);
        expect(pattern.code).toBe(code);
        expect(pattern.pattern).toBeDefined();
        expect(pattern.reason).toBeDefined();
      });
    });

    test('checkNativePatterns should return correct pattern metadata', () => {
      const code = 'StyleSheet.create({ container: { flex: 1 } })';
      const lineNumber = 20;
      
      const nativePatterns = (analyzer as any).checkNativePatterns(code, lineNumber);
      
      expect(nativePatterns.length).toBeGreaterThan(0);
      nativePatterns.forEach(pattern => {
        expect(pattern.line).toBe(lineNumber);
        expect(pattern.code).toBe(code);
        expect(pattern.pattern).toBeDefined();
        expect(pattern.reason).toBeDefined();
      });
    });

    test('should return empty arrays for shared code', () => {
      const code = 'const [state, setState] = useState(null)';
      const lineNumber = 30;
      
      const webPatterns = (analyzer as any).checkWebPatterns(code, lineNumber);
      const nativePatterns = (analyzer as any).checkNativePatterns(code, lineNumber);
      
      expect(webPatterns.length).toBe(0);
      expect(nativePatterns.length).toBe(0);
    });
  });
});