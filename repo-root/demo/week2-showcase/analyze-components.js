#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');

// Import the analyzer
const { CodeReuseAnalyzer } = require('../../tools/cross-platform-validation/dist/analyzers/code-reuse-analyzer');

// Component files to analyze
const components = [
  'button.tsx',
  'floating-support-button.tsx',
  'input.tsx',
  'modal.tsx',
  'support-dashboard.tsx',
  'support-widget.tsx'
];

async function analyzeComponent(componentFile) {
  const analyzer = new CodeReuseAnalyzer({
    sourceDirectory: path.join(__dirname, 'src/components'),
    outputDirectory: path.join(__dirname, 'validation'),
    targetReusePercentage: 85
  });

  const filePath = path.join(__dirname, 'src/components', componentFile);
  console.log(`\nAnalyzing ${componentFile}...`);
  
  try {
    const result = await analyzer.analyzeComponent(filePath);
    
    // Save JSON output with pre-fix naming convention
    const outputName = `pre-fix-${componentFile.replace('.tsx', '.json')}`;
    const outputPath = path.join(__dirname, 'validation', outputName);
    
    await fs.ensureDir(path.join(__dirname, 'validation'));
    await fs.writeJson(outputPath, result, { spaces: 2 });
    
    console.log(`✅ Saved to: ${outputName}`);
    console.log(`   Reuse: ${result.reusable.percentage.toFixed(1)}%`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error analyzing ${componentFile}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Running pre-fix analysis on all components...\n');
  
  const results = [];
  
  for (const component of components) {
    const result = await analyzeComponent(component);
    if (result) {
      results.push(result);
    }
  }
  
  // Create summary
  const summary = {
    timestamp: new Date().toISOString(),
    analyzer: 'pre-fix',
    components: results.length,
    averageReuse: results.reduce((sum, r) => sum + r.reusable.percentage, 0) / results.length,
    allResults: results.map(r => ({
      component: r.componentName,
      reuse: r.reusable.percentage,
      totalLines: r.totalLines,
      webSpecific: r.platformSpecific.web.lines,
      nativeSpecific: r.platformSpecific.native.lines,
      shared: r.reusable.lines
    }))
  };
  
  // Save summary
  const summaryPath = path.join(__dirname, 'validation', 'pre-fix-summary.json');
  await fs.writeJson(summaryPath, summary, { spaces: 2 });
  
  console.log('\n📊 Summary:');
  console.log(`Total components analyzed: ${summary.components}`);
  console.log(`Average reuse percentage: ${summary.averageReuse.toFixed(1)}%`);
  console.log(`\nAll results saved to: validation/pre-fix-*.json`);
}

// Run the analysis
main().catch(console.error);