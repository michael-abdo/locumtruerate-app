#!/usr/bin/env node

/**
 * Code Reuse Validation Tool
 * 
 * Analyzes React/React Native components for cross-platform code reuse percentage
 */

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');

// Import our analyzer (will be compiled from TypeScript)
const { CodeReuseAnalyzer } = require('../dist/analyzers/code-reuse-analyzer');

program
  .name('validate-reuse')
  .description('Analyze components for cross-platform code reuse percentage')
  .version('1.0.0')
  .option('-s, --source <directory>', 'Source directory to analyze', './src/components')
  .option('-o, --output <directory>', 'Output directory for results', './validation-results')
  .option('-t, --target <percentage>', 'Target reuse percentage', '85')
  .option('--exclude <patterns...>', 'Exclude patterns (glob)')
  .option('--include <patterns...>', 'Include patterns (glob)')
  .option('--verbose', 'Verbose output')
  .option('--json-only', 'Output only JSON, no console formatting')
  .parse();

const options = program.opts();

async function main() {
  const spinner = ora('Initializing code reuse analyzer...').start();
  
  try {
    // Validate source directory
    if (!await fs.pathExists(options.source)) {
      spinner.fail(chalk.red(`Source directory not found: ${options.source}`));
      process.exit(1);
    }

    // Configure analyzer
    const config = {
      sourceDirectory: path.resolve(options.source),
      outputDirectory: path.resolve(options.output),
      targetReusePercentage: parseInt(options.target),
      excludePatterns: options.exclude || ['**/*.test.*', '**/node_modules/**'],
      includePatterns: options.include || ['**/*.ts', '**/*.tsx']
    };

    if (options.verbose) {
      spinner.info('Configuration:');
      console.log(chalk.dim(JSON.stringify(config, null, 2)));
    }

    spinner.text = 'Analyzing components...';
    
    // Create analyzer and run analysis
    const analyzer = new CodeReuseAnalyzer(config);
    const metrics = await analyzer.analyzeComponents();
    
    spinner.text = 'Saving results...';
    const outputFile = await analyzer.saveResults(metrics);
    
    spinner.succeed('Analysis completed!');

    if (!options.jsonOnly) {
      // Display formatted results
      displayResults(metrics, config);
    } else {
      // Output raw JSON
      console.log(JSON.stringify(metrics, null, 2));
    }

    // Exit with appropriate code
    const exitCode = metrics.overall.targetMet ? 0 : 1;
    if (!options.jsonOnly && exitCode === 1) {
      console.log(chalk.yellow(`\\n⚠️  Target not met. Exit code: ${exitCode}`));
    }
    
    process.exit(exitCode);

  } catch (error) {
    spinner.fail(chalk.red('Analysis failed!'));
    console.error(chalk.red(error.message));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function displayResults(metrics, config) {
  console.log('\\n' + chalk.bold.blue('📊 Code Reuse Analysis Results'));
  console.log('='.repeat(50));
  
  // Overall summary
  console.log(chalk.bold('\\n📈 Overall Summary:'));
  console.log(`Total Components: ${chalk.cyan(metrics.overall.totalComponents)}`);
  console.log(`Average Reuse: ${formatPercentage(metrics.overall.averageReusePercentage, config.targetReusePercentage)}`);
  console.log(`Target Met: ${metrics.overall.targetMet ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
  console.log(`Above Target: ${chalk.green(metrics.overall.componentsAboveTarget)} components`);
  console.log(`Below Target: ${chalk.red(metrics.overall.componentsBelowTarget)} components`);

  // Line-level summary
  console.log(chalk.bold('\\n📏 Line Analysis:'));
  console.log(`Total Lines: ${chalk.cyan(metrics.summary.totalLines.toLocaleString())}`);
  console.log(`Reusable Lines: ${chalk.green(metrics.summary.reusableLines.toLocaleString())}`);
  console.log(`Web-Specific: ${chalk.yellow(metrics.summary.webSpecificLines.toLocaleString())}`);
  console.log(`Native-Specific: ${chalk.magenta(metrics.summary.nativeSpecificLines.toLocaleString())}`);
  console.log(`Overall Reuse: ${formatPercentage(metrics.summary.reusePercentage, config.targetReusePercentage)}`);

  // Component breakdown
  console.log(chalk.bold('\\n🧩 Component Breakdown:'));
  const sortedComponents = metrics.byComponent
    .sort((a, b) => a.reusable.percentage - b.reusable.percentage)
    .slice(0, 10); // Show worst 10

  sortedComponents.forEach(component => {
    const status = component.reusable.percentage >= config.targetReusePercentage 
      ? chalk.green('✅') 
      : chalk.red('❌');
    
    console.log(`${status} ${component.componentName.padEnd(20)} ${formatPercentage(component.reusable.percentage, config.targetReusePercentage)}`);
    
    if (component.recommendations.length > 0 && options.verbose) {
      component.recommendations.forEach(rec => {
        console.log(chalk.dim(`    💡 ${rec}`));
      });
    }
  });

  if (metrics.byComponent.length > 10) {
    console.log(chalk.dim(`\\n... and ${metrics.byComponent.length - 10} more components`));
  }

  // Recommendations
  if (metrics.overall.componentsBelowTarget > 0) {
    console.log(chalk.bold('\\n💡 Recommendations:'));
    console.log(chalk.yellow('1. Focus on components below target for improvement'));
    console.log(chalk.yellow('2. Abstract platform-specific imports and APIs'));
    console.log(chalk.yellow('3. Use platform detection patterns (Platform.select)'));
    console.log(chalk.yellow('4. Create shared utility functions'));
  }

  console.log('\\n' + chalk.dim('Full results saved to: ' + chalk.cyan(path.resolve(config.outputDirectory))));
}

function formatPercentage(percentage, target) {
  const formatted = `${percentage.toFixed(1)}%`;
  if (percentage >= target) {
    return chalk.green(formatted);
  } else if (percentage >= target - 10) {
    return chalk.yellow(formatted);
  } else {
    return chalk.red(formatted);
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

// Run the main function
main();