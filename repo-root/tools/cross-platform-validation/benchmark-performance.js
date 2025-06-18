#!/usr/bin/env node

/**
 * Performance Benchmark Script for Code Reuse Analyzer
 * 
 * This script measures the current analyzer performance to establish baseline
 * metrics before implementing the analyzer logic fix. It will be re-run after
 * the fix to ensure no significant performance degradation.
 */

const { performance } = require('perf_hooks');
const fs = require('fs-extra');
const path = require('path');
const { CodeReuseAnalyzer } = require('./dist/analyzers/code-reuse-analyzer');

// Test component configurations
const TEST_COMPONENTS = [
  {
    name: 'Button (Small)',
    path: '../../demo/week2-showcase/src/components/button.tsx',
    expectedLines: 40,
    category: 'small'
  },
  {
    name: 'Input (Small)',
    path: '../../demo/week2-showcase/src/components/input.tsx',
    expectedLines: 34,
    category: 'small'
  },
  {
    name: 'Modal (Medium)',
    path: '../../demo/week2-showcase/src/components/modal.tsx',
    expectedLines: 65,
    category: 'medium'
  },
  {
    name: 'FloatingSupportButton (Medium)',
    path: '../../demo/week2-showcase/src/components/floating-support-button.tsx',
    expectedLines: 174,
    category: 'medium'
  },
  {
    name: 'SupportDashboard (Large)',
    path: '../../demo/week2-showcase/src/components/support-dashboard.tsx',
    expectedLines: 457,
    category: 'large'
  },
  {
    name: 'SupportWidget (Large)',
    path: '../../demo/week2-showcase/src/components/support-widget.tsx',
    expectedLines: 485,
    category: 'large'
  }
];

// Test configurations
const BENCHMARK_CONFIG = {
  iterations: 5,
  warmupIterations: 2,
  outputFile: './performance-baseline.json',
  memoryTrackingInterval: 100, // ms
  verbose: true
};

class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      totalMemory: require('os').totalmem(),
      freeMemory: require('os').freemem(),
      components: [],
      summary: {}
    };
  }

  async runBenchmarks() {
    console.log('🚀 Starting Code Reuse Analyzer Performance Benchmark');
    console.log('================================================\n');
    
    // Verify all test files exist
    await this.verifyTestFiles();
    
    // Run benchmarks for each component
    for (const component of TEST_COMPONENTS) {
      console.log(`📊 Benchmarking: ${component.name}`);
      await this.benchmarkComponent(component);
      console.log('');
    }
    
    // Calculate summary statistics
    this.calculateSummary();
    
    // Save results
    await this.saveResults();
    
    // Display summary
    this.displaySummary();
  }

  async verifyTestFiles() {
    console.log('🔍 Verifying test files...');
    
    for (const component of TEST_COMPONENTS) {
      const fullPath = path.resolve(__dirname, component.path);
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`Test file not found: ${fullPath}`);
      }
      
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const actualLines = content.split('\n').length;
      
      console.log(`  ✅ ${component.name}: ${actualLines} lines (expected ~${component.expectedLines})`);
      
      // Update with actual values
      component.actualPath = fullPath;
      component.actualLines = actualLines;
      component.fileSize = stats.size;
    }
    
    console.log('');
  }

  async benchmarkComponent(component) {
    const componentResults = {
      name: component.name,
      path: component.path,
      category: component.category,
      lines: component.actualLines,
      fileSize: component.fileSize,
      iterations: [],
      averages: {},
      memoryUsage: {}
    };

    // Warmup iterations (not recorded)
    console.log(`  🔥 Warming up (${BENCHMARK_CONFIG.warmupIterations} iterations)...`);
    for (let i = 0; i < BENCHMARK_CONFIG.warmupIterations; i++) {
      await this.runSingleAnalysis(component.actualPath, false);
    }

    // Actual benchmark iterations
    console.log(`  ⏱️  Running ${BENCHMARK_CONFIG.iterations} benchmark iterations...`);
    
    for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
      const iterationResult = await this.runSingleAnalysis(component.actualPath, true);
      componentResults.iterations.push(iterationResult);
      
      if (BENCHMARK_CONFIG.verbose) {
        console.log(`    Iteration ${i + 1}: ${iterationResult.totalTime.toFixed(2)}ms`);
      }
    }

    // Calculate averages
    componentResults.averages = this.calculateAverages(componentResults.iterations);
    
    // Memory usage summary
    componentResults.memoryUsage = this.calculateMemoryStats(componentResults.iterations);
    
    console.log(`  📈 Average: ${componentResults.averages.totalTime.toFixed(2)}ms`);
    console.log(`  🧠 Peak Memory: ${(componentResults.memoryUsage.peakMemory / 1024 / 1024).toFixed(2)}MB`);
    
    this.results.components.push(componentResults);
  }

  async runSingleAnalysis(filePath, trackMemory = false) {
    const result = {
      startTime: performance.now(),
      memoryBefore: process.memoryUsage(),
      phases: {}
    };

    let memoryPeak = result.memoryBefore.heapUsed;
    let memoryInterval = null;

    if (trackMemory) {
      memoryInterval = setInterval(() => {
        const current = process.memoryUsage().heapUsed;
        if (current > memoryPeak) {
          memoryPeak = current;
        }
      }, BENCHMARK_CONFIG.memoryTrackingInterval);
    }

    try {
      // Initialize analyzer
      const phaseStart = performance.now();
      const analyzer = new CodeReuseAnalyzer({
        sourceDirectory: path.dirname(filePath),
        outputDirectory: './temp-benchmark-output'
      });
      result.phases.initialization = performance.now() - phaseStart;

      // Run analysis
      const analysisStart = performance.now();
      const analysisResult = await analyzer.analyzeComponent(filePath);
      result.phases.analysis = performance.now() - analysisStart;

      // Record results
      result.endTime = performance.now();
      result.totalTime = result.endTime - result.startTime;
      result.memoryAfter = process.memoryUsage();
      result.memoryPeak = memoryPeak;
      result.memoryDelta = result.memoryAfter.heapUsed - result.memoryBefore.heapUsed;
      
      // Analysis metadata
      result.analysisMetadata = {
        totalLines: analysisResult.totalLines,
        totalStatements: analysisResult.totalStatements,
        reusabilityPercentage: analysisResult.reusable.percentage,
        dependencies: analysisResult.dependencies.length,
        complexity: analysisResult.complexity.cyclomaticComplexity
      };

      return result;

    } catch (error) {
      result.error = error.message;
      result.endTime = performance.now();
      result.totalTime = result.endTime - result.startTime;
      return result;
    } finally {
      if (memoryInterval) {
        clearInterval(memoryInterval);
      }
    }
  }

  calculateAverages(iterations) {
    const validIterations = iterations.filter(i => !i.error);
    
    if (validIterations.length === 0) {
      return { error: 'No valid iterations' };
    }

    const averages = {
      totalTime: 0,
      initialization: 0,
      analysis: 0,
      memoryDelta: 0,
      memoryPeak: 0
    };

    validIterations.forEach(iteration => {
      averages.totalTime += iteration.totalTime;
      averages.initialization += iteration.phases.initialization || 0;
      averages.analysis += iteration.phases.analysis || 0;
      averages.memoryDelta += iteration.memoryDelta;
      averages.memoryPeak += iteration.memoryPeak;
    });

    const count = validIterations.length;
    Object.keys(averages).forEach(key => {
      averages[key] = averages[key] / count;
    });

    averages.standardDeviation = this.calculateStandardDeviation(
      validIterations.map(i => i.totalTime),
      averages.totalTime
    );

    return averages;
  }

  calculateMemoryStats(iterations) {
    const validIterations = iterations.filter(i => !i.error);
    const memoryDeltas = validIterations.map(i => i.memoryDelta);
    const memoryPeaks = validIterations.map(i => i.memoryPeak);
    
    return {
      averageMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      peakMemory: Math.max(...memoryPeaks),
      minMemoryDelta: Math.min(...memoryDeltas),
      maxMemoryDelta: Math.max(...memoryDeltas)
    };
  }

  calculateStandardDeviation(values, mean) {
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  calculateSummary() {
    const components = this.results.components.filter(c => !c.averages.error);
    
    if (components.length === 0) {
      this.results.summary = { error: 'No valid component results' };
      return;
    }

    // Performance by category
    const categories = ['small', 'medium', 'large'];
    const byCategory = {};
    
    categories.forEach(category => {
      const categoryComponents = components.filter(c => c.category === category);
      if (categoryComponents.length > 0) {
        byCategory[category] = {
          count: categoryComponents.length,
          averageTime: categoryComponents.reduce((sum, c) => sum + c.averages.totalTime, 0) / categoryComponents.length,
          averageLines: categoryComponents.reduce((sum, c) => sum + c.lines, 0) / categoryComponents.length,
          timePerLine: 0
        };
        byCategory[category].timePerLine = byCategory[category].averageTime / byCategory[category].averageLines;
      }
    });

    // Overall statistics
    this.results.summary = {
      totalComponents: components.length,
      totalTime: components.reduce((sum, c) => sum + c.averages.totalTime, 0),
      averageTime: components.reduce((sum, c) => sum + c.averages.totalTime, 0) / components.length,
      totalLines: components.reduce((sum, c) => sum + c.lines, 0),
      averageTimePerLine: 0,
      byCategory,
      performance: {
        fastestComponent: components.reduce((min, c) => c.averages.totalTime < min.averages.totalTime ? c : min),
        slowestComponent: components.reduce((max, c) => c.averages.totalTime > max.averages.totalTime ? c : max),
        memoryEfficient: components.reduce((min, c) => c.memoryUsage.peakMemory < min.memoryUsage.peakMemory ? c : min),
        memoryHeavy: components.reduce((max, c) => c.memoryUsage.peakMemory > max.memoryUsage.peakMemory ? c : max)
      }
    };

    this.results.summary.averageTimePerLine = this.results.summary.averageTime / (this.results.summary.totalLines / this.results.summary.totalComponents);
  }

  async saveResults() {
    const outputPath = path.resolve(__dirname, BENCHMARK_CONFIG.outputFile);
    await fs.writeJSON(outputPath, this.results, { spaces: 2 });
    console.log(`💾 Benchmark results saved to: ${outputPath}\n`);
  }

  displaySummary() {
    console.log('📈 PERFORMANCE BENCHMARK SUMMARY');
    console.log('================================\n');
    
    const summary = this.results.summary;
    
    if (summary.error) {
      console.log(`❌ Error: ${summary.error}`);
      return;
    }

    console.log(`📊 Total Components: ${summary.totalComponents}`);
    console.log(`⏱️  Average Analysis Time: ${summary.averageTime.toFixed(2)}ms`);
    console.log(`📏 Average Time per Line: ${summary.averageTimePerLine.toFixed(4)}ms/line`);
    console.log(`📚 Total Lines Analyzed: ${summary.totalLines.toLocaleString()}`);
    console.log('');

    // Performance by category
    console.log('📊 Performance by Component Size:');
    Object.entries(summary.byCategory).forEach(([category, stats]) => {
      console.log(`  ${category.toUpperCase()}: ${stats.averageTime.toFixed(2)}ms avg (${stats.timePerLine.toFixed(4)}ms/line)`);
    });
    console.log('');

    // Extremes
    console.log('🏆 Performance Extremes:');
    console.log(`  Fastest: ${summary.performance.fastestComponent.name} (${summary.performance.fastestComponent.averages.totalTime.toFixed(2)}ms)`);
    console.log(`  Slowest: ${summary.performance.slowestComponent.name} (${summary.performance.slowestComponent.averages.totalTime.toFixed(2)}ms)`);
    console.log(`  Memory Efficient: ${summary.performance.memoryEfficient.name} (${(summary.performance.memoryEfficient.memoryUsage.peakMemory / 1024 / 1024).toFixed(2)}MB peak)`);
    console.log(`  Memory Heavy: ${summary.performance.memoryHeavy.name} (${(summary.performance.memoryHeavy.memoryUsage.peakMemory / 1024 / 1024).toFixed(2)}MB peak)`);
    console.log('');

    // Recommendations
    console.log('💡 Performance Analysis:');
    if (summary.averageTimePerLine > 0.1) {
      console.log('  ⚠️  Analysis time per line is relatively high (>0.1ms/line)');
    } else {
      console.log('  ✅ Analysis time per line is reasonable (<0.1ms/line)');
    }
    
    if (summary.performance.memoryHeavy.memoryUsage.peakMemory > 100 * 1024 * 1024) {
      console.log('  ⚠️  Peak memory usage exceeds 100MB for large components');
    } else {
      console.log('  ✅ Memory usage is reasonable for all components');
    }
    
    console.log('\n🔄 Re-run this benchmark after implementing analyzer fixes to compare performance.');
  }
}

// Main execution
async function main() {
  const benchmark = new PerformanceBenchmark();
  
  try {
    await benchmark.runBenchmarks();
    process.exit(0);
  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
    if (BENCHMARK_CONFIG.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Run the benchmark
if (require.main === module) {
  main();
}

module.exports = PerformanceBenchmark;