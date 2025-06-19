#!/usr/bin/env node

/**
 * Cross-Platform UI Component Testing
 * Validates that shared UI components work correctly on both web and React Native
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

// Component compatibility patterns
const webOnlyAPIs = [
  'document.',
  'window.',
  'localStorage',
  'sessionStorage',
  'navigator.',
  'location.',
  'history.',
  'addEventListener',
  'removeEventListener',
  'getElementById',
  'querySelector',
  'getComputedStyle',
  'XMLHttpRequest',
  'fetch', // Should use cross-platform fetch
  'FormData',
  'Blob',
  'FileReader'
];

const reactNativeOnlyAPIs = [
  'NativeModules',
  'DeviceEventEmitter',
  'NativeEventEmitter',
  'LayoutAnimation',
  'Animated.',
  'PanResponder',
  'Dimensions.get',
  'PixelRatio',
  'StyleSheet.create',
  'Platform.OS',
  'Platform.select'
];

const crossPlatformPatterns = [
  'Platform.select',
  'Platform.OS === ',
  'react-native',
  '@react-native',
  'expo-'
];

// Test results
const testResults = {
  components: [],
  summary: {
    total: 0,
    crossPlatform: 0,
    webOnly: 0,
    nativeOnly: 0,
    errors: 0
  }
};

// Read and analyze component file
function analyzeComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    const result = {
      name: fileName,
      path: filePath,
      crossPlatform: true,
      webAPIs: [],
      nativeAPIs: [],
      platformChecks: [],
      issues: []
    };
    
    // Check for web-only APIs
    webOnlyAPIs.forEach(api => {
      if (content.includes(api)) {
        result.webAPIs.push(api);
        result.crossPlatform = false;
        result.issues.push(`Uses web-only API: ${api}`);
      }
    });
    
    // Check for React Native-only APIs
    reactNativeOnlyAPIs.forEach(api => {
      if (content.includes(api)) {
        result.nativeAPIs.push(api);
        // Platform.select and Platform.OS are okay if used correctly
        if (!api.startsWith('Platform.')) {
          result.crossPlatform = false;
          result.issues.push(`Uses native-only API: ${api}`);
        }
      }
    });
    
    // Check for proper platform handling
    crossPlatformPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        result.platformChecks.push(pattern);
      }
    });
    
    // Check imports
    const importRegex = /import\s+.*\s+from\s+['"](.+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Check for platform-specific imports
      if (importPath.includes('.web') || importPath.includes('.native')) {
        result.issues.push(`Platform-specific import: ${importPath}`);
      }
      
      // Check for React Native imports in shared components
      if (importPath.includes('react-native') && !importPath.includes('react-native-web')) {
        result.crossPlatform = false;
        result.issues.push(`Direct React Native import: ${importPath}`);
      }
    }
    
    // Check for inline styles vs StyleSheet
    if (content.includes('style={{') && !content.includes('StyleSheet')) {
      result.issues.push('Uses inline styles without StyleSheet abstraction');
    }
    
    // Check for proper event handling
    if (content.includes('onClick') && !content.includes('onPress')) {
      result.issues.push('Uses onClick instead of onPress for touch handling');
    }
    
    return result;
    
  } catch (error) {
    return {
      name: path.basename(filePath),
      path: filePath,
      error: error.message
    };
  }
}

// Find all component files
function findComponents(dir) {
  const components = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
        components.push(...findComponents(filePath));
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        components.push(filePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return components;
}

// Main test execution
console.log('🧪 Cross-Platform UI Component Testing\n');
console.log('Analyzing shared UI components for platform compatibility...\n');

// Find all components in the UI package
const uiSrcPath = path.join(__dirname, 'src');
const componentFiles = findComponents(uiSrcPath);

console.log(`Found ${componentFiles.length} component files to analyze\n`);

// Analyze each component
componentFiles.forEach(file => {
  const result = analyzeComponent(file);
  testResults.components.push(result);
  testResults.summary.total++;
  
  if (result.error) {
    testResults.summary.errors++;
    console.log(`${colors.red}❌ ${result.name}${colors.reset}`);
    console.log(`   Error: ${result.error}`);
  } else if (result.crossPlatform) {
    testResults.summary.crossPlatform++;
    console.log(`${colors.green}✅ ${result.name}${colors.reset}`);
    if (result.platformChecks.length > 0) {
      console.log(`   Uses platform checks: ${result.platformChecks.join(', ')}`);
    }
  } else {
    if (result.webAPIs.length > 0) {
      testResults.summary.webOnly++;
      console.log(`${colors.yellow}⚠️  ${result.name} - Web Only${colors.reset}`);
    } else if (result.nativeAPIs.length > 0) {
      testResults.summary.nativeOnly++;
      console.log(`${colors.yellow}⚠️  ${result.name} - Native Only${colors.reset}`);
    }
    
    result.issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }
  console.log('');
});

// Summary
console.log('📊 CROSS-PLATFORM COMPATIBILITY SUMMARY');
console.log('═══════════════════════════════════════════════════════');
console.log(`Total Components: ${testResults.summary.total}`);
console.log(`${colors.green}✅ Cross-Platform: ${testResults.summary.crossPlatform} (${Math.round(testResults.summary.crossPlatform / testResults.summary.total * 100)}%)${colors.reset}`);
console.log(`${colors.yellow}⚠️  Web-Only: ${testResults.summary.webOnly}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Native-Only: ${testResults.summary.nativeOnly}${colors.reset}`);
console.log(`${colors.red}❌ Errors: ${testResults.summary.errors}${colors.reset}`);

// Recommendations
console.log('\n💡 RECOMMENDATIONS FOR IMPROVEMENT:\n');

const recommendations = [
  {
    issue: 'Web-only APIs',
    solution: 'Use React Native Web compatible alternatives or create platform-specific implementations with Platform.select()'
  },
  {
    issue: 'onClick handlers',
    solution: 'Replace onClick with onPress for universal touch/click handling'
  },
  {
    issue: 'Direct style objects',
    solution: 'Use StyleSheet.create() for better performance and cross-platform compatibility'
  },
  {
    issue: 'Platform-specific imports',
    solution: 'Create index files that export the correct implementation based on platform'
  }
];

recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec.issue}`);
  console.log(`   Solution: ${rec.solution}\n`);
});

// Save detailed report
const reportPath = path.join(__dirname, 'cross-platform-test-results.json');
fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

// Exit code based on compatibility
const compatibilityRate = testResults.summary.crossPlatform / testResults.summary.total;
process.exit(compatibilityRate >= 0.85 ? 0 : 1);