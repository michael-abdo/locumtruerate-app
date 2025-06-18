#!/usr/bin/env node

/**
 * Baseline Regression Check
 * 
 * Compares current analyzer results against established baseline values
 * to prevent regression in cross-platform reusability scores.
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function checkBaseline() {
  console.log(chalk.bold.blue('🔍 Running Baseline Regression Check'));
  console.log('='.repeat(50));

  try {
    // Load baseline values
    const baselinePath = path.join(__dirname, 'baseline.json');
    if (!await fs.pathExists(baselinePath)) {
      console.error(chalk.red('❌ Baseline file not found: baseline.json'));
      process.exit(1);
    }

    const baseline = await fs.readJson(baselinePath);
    console.log(chalk.dim(`📋 Using baseline from: ${baseline.lastUpdated} (v${baseline.version})`));

    // Run analyzer and read results from saved file
    console.log(chalk.yellow('⚙️  Running analyzer...'));
    const analyzerCmd = 'npm run validate:reuse -- --source ../../demo/week2-showcase/src/components';
    
    try {
      execSync(analyzerCmd, { 
        cwd: __dirname,
        stdio: 'pipe' // Suppress output, we'll read from file
      });
    } catch (error) {
      // Analyzer returns exit code 1 when target not met, but still saves results
      // This is expected behavior, so we continue
    }

    // Read the saved results file
    const resultsPattern = path.join(__dirname, 'validation-results', 'code-reuse-analysis-*.json');
    const resultFiles = await require('glob').glob(resultsPattern);
    
    if (resultFiles.length === 0) {
      console.error(chalk.red('❌ No analyzer results file found'));
      process.exit(1);
    }
    
    // Use the most recent results file
    const latestResultFile = resultFiles.sort().pop();
    const currentResults = await fs.readJson(latestResultFile);
    console.log(chalk.dim(`📄 Using results from: ${path.basename(latestResultFile)}`));
    
    // Check each component against baseline
    let regressions = [];
    let improvements = [];
    const tolerance = 0.01; // Allow 0.01% tolerance for floating point precision
    
    console.log(chalk.bold('\\n📊 Component Comparison:'));
    
    for (const component of currentResults.byComponent) {
      const componentName = component.componentName;
      const currentScore = component.reusable.percentage;
      const baselineScore = baseline.components[componentName];
      
      if (baselineScore === undefined) {
        console.log(chalk.yellow(`⚠️  ${componentName.padEnd(20)} ${currentScore.toFixed(1)}% (NEW - no baseline)`));
        continue;
      }
      
      const diff = currentScore - baselineScore;
      
      if (currentScore < baselineScore - tolerance) {
        // Regression detected
        regressions.push({
          name: componentName,
          current: currentScore,
          baseline: baselineScore,
          diff: diff
        });
        console.log(chalk.red(`❌ ${componentName.padEnd(20)} ${currentScore.toFixed(1)}% (${diff.toFixed(1)}% regression from ${baselineScore}%)`));
      } else if (currentScore > baselineScore + tolerance) {
        // Improvement detected
        improvements.push({
          name: componentName,
          current: currentScore,
          baseline: baselineScore,
          diff: diff
        });
        console.log(chalk.green(`✅ ${componentName.padEnd(20)} ${currentScore.toFixed(1)}% (+${diff.toFixed(1)}% improvement from ${baselineScore}%)`));
      } else {
        // Same as baseline
        console.log(chalk.cyan(`➖ ${componentName.padEnd(20)} ${currentScore.toFixed(1)}% (same as baseline)`));
      }
    }

    // Check overall metrics
    console.log(chalk.bold('\\n📈 Overall Metrics:'));
    const currentAverage = currentResults.overall.averageReusePercentage;
    const baselineAverage = baseline.overall.minimumAverageReuse;
    
    if (currentAverage < baselineAverage - tolerance) {
      regressions.push({
        name: 'Overall Average',
        current: currentAverage,
        baseline: baselineAverage,
        diff: currentAverage - baselineAverage
      });
      console.log(chalk.red(`❌ Average Reuse: ${currentAverage.toFixed(1)}% (${(currentAverage - baselineAverage).toFixed(1)}% below baseline ${baselineAverage}%)`));
    } else {
      console.log(chalk.green(`✅ Average Reuse: ${currentAverage.toFixed(1)}% (meets baseline ${baselineAverage}%)`));
    }

    // Summary
    console.log(chalk.bold('\\n📋 Summary:'));
    console.log(`Components checked: ${chalk.cyan(currentResults.byComponent.length)}`);
    console.log(`Regressions found: ${regressions.length > 0 ? chalk.red(regressions.length) : chalk.green('0')}`);
    console.log(`Improvements found: ${chalk.green(improvements.length)}`);

    if (regressions.length > 0) {
      console.log(chalk.bold.red('\\n🚨 BASELINE CHECK FAILED'));
      console.log(chalk.red('The following components have regressed:'));
      regressions.forEach(reg => {
        console.log(chalk.red(`  • ${reg.name}: ${reg.current.toFixed(1)}% (was ${reg.baseline}%)`));
      });
      console.log(chalk.yellow('\\n💡 Possible solutions:'));
      console.log(chalk.yellow('  1. Fix the regressions by improving the components'));
      console.log(chalk.yellow('  2. If intentional, update baseline.json with new values'));
      console.log(chalk.yellow('  3. Review recent changes that might have introduced web-specific patterns'));
      
      process.exit(1);
    } else {
      console.log(chalk.bold.green('\\n✅ BASELINE CHECK PASSED'));
      if (improvements.length > 0) {
        console.log(chalk.green('🎉 Great work! Some components have improved:'));
        improvements.forEach(imp => {
          console.log(chalk.green(`  • ${imp.name}: +${imp.diff.toFixed(1)}% improvement`));
        });
        console.log(chalk.dim('\\n💡 Consider updating baseline.json to reflect these improvements'));
      }
      process.exit(0);
    }

  } catch (error) {
    console.error(chalk.red('❌ Baseline check failed with error:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled Rejection:'), error);
  process.exit(1);
});

// Run the baseline check
checkBaseline();