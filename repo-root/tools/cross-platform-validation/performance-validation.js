/**
 * Performance validation for analyzer fix
 * Ensures the pattern matching doesn't introduce significant overhead
 */

const { CodeReuseAnalyzer } = require('./dist/analyzers/code-reuse-analyzer');
const fs = require('fs-extra');
const path = require('path');

async function validatePerformance() {
  console.log('🔍 Performance Validation for Analyzer Fix\n');
  
  const analyzer = new CodeReuseAnalyzer({
    sourceDirectory: '../../demo/week2-showcase/src/components'
  });

  // Test files of varying sizes
  const testScenarios = [
    { file: 'button.tsx', expectedLines: 41, description: 'Small component' },
    { file: 'support-widget.tsx', expectedLines: 96, description: 'Medium component' },
    { file: 'support-dashboard.tsx', expectedLines: 300, description: 'Large component' }
  ];

  console.log('Baseline (from earlier test): 6.23ms average per component\n');
  console.log('Testing with pattern matching integrated into AST traversal:\n');

  const results = [];
  
  for (const scenario of testScenarios) {
    const filePath = path.join('../../demo/week2-showcase/src/components', scenario.file);
    
    // Run multiple times for accurate measurement
    const runs = 10;
    const times = [];
    
    for (let i = 0; i < runs; i++) {
      const start = process.hrtime.bigint();
      await analyzer.analyzeComponent(filePath);
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1_000_000); // Convert to ms
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / runs;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    results.push({
      file: scenario.file,
      description: scenario.description,
      avgTime: avgTime.toFixed(2),
      minTime: minTime.toFixed(2),
      maxTime: maxTime.toFixed(2)
    });
    
    console.log(`${scenario.description} (${scenario.file}):`);
    console.log(`  Average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
    console.log('');
  }
  
  // Performance assessment
  const overallAvg = results.reduce((sum, r) => sum + parseFloat(r.avgTime), 0) / results.length;
  
  console.log('📊 Performance Summary:');
  console.log(`Overall average: ${overallAvg.toFixed(2)}ms per component`);
  console.log(`Baseline comparison: ${((overallAvg / 6.23) * 100).toFixed(0)}% of baseline`);
  
  if (overallAvg < 10) {
    console.log('✅ Performance is excellent - well within acceptable range');
  } else if (overallAvg < 20) {
    console.log('⚠️ Performance is acceptable but could be optimized');
  } else {
    console.log('❌ Performance regression detected - optimization needed');
  }
  
  // Memory usage check
  const memUsage = process.memoryUsage();
  console.log('\n💾 Memory Usage:');
  console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  
  // Save results
  await fs.writeJson('./performance-validation-results.json', {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      overallAverage: overallAvg.toFixed(2),
      baselineComparison: ((overallAvg / 6.23) * 100).toFixed(0) + '%',
      memoryUsageMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2)
    }
  }, { spaces: 2 });
  
  console.log('\n✅ Results saved to performance-validation-results.json');
}

validatePerformance().catch(console.error);