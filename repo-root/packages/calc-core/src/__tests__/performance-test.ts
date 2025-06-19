/**
 * Calculator Performance Testing Suite
 * Tests 1000+ realistic locum tenens calculation scenarios
 */

import { CalculationEngine } from '../calculation-engine';
import { ContractType, PayPeriod, FilingStatus, State } from '../types';

interface PerformanceResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  passedThreshold: boolean;
}

// Generate realistic test data
function generateTestScenarios(count: number) {
  const scenarios = [];
  
  // Common hourly rates for locum tenens positions
  const hourlyRates = [150, 175, 200, 225, 250, 275, 300, 325, 350, 400, 450, 500];
  
  // Common weekly hours
  const weeklyHours = [20, 30, 35, 40, 45, 50, 55, 60];
  
  // All US states
  const states: State[] = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  const filingStatuses: FilingStatus[] = [
    'SINGLE',
    'MARRIED_FILING_JOINTLY',
    'MARRIED_FILING_SEPARATELY',
    'HEAD_OF_HOUSEHOLD'
  ];
  
  const payPeriods: PayPeriod[] = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'];
  
  for (let i = 0; i < count; i++) {
    const hourlyRate = hourlyRates[Math.floor(Math.random() * hourlyRates.length)];
    const hoursPerWeek = weeklyHours[Math.floor(Math.random() * weeklyHours.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const filingStatus = filingStatuses[Math.floor(Math.random() * filingStatuses.length)];
    const payPeriod = payPeriods[Math.floor(Math.random() * payPeriods.length)];
    
    // Realistic deductions and withholdings
    const federalAllowances = Math.floor(Math.random() * 5);
    const stateAllowances = Math.floor(Math.random() * 5);
    const additionalFederalWithholding = Math.random() < 0.3 ? Math.floor(Math.random() * 500) : 0;
    const additionalStateWithholding = Math.random() < 0.2 ? Math.floor(Math.random() * 300) : 0;
    
    // Pre-tax deductions (401k, health insurance, etc.)
    const retirement401k = Math.random() < 0.7 ? Math.floor(Math.random() * 2000) : 0;
    const healthInsurance = Math.random() < 0.6 ? Math.floor(Math.random() * 800) + 200 : 0;
    const dentalInsurance = Math.random() < 0.5 ? Math.floor(Math.random() * 50) + 20 : 0;
    const visionInsurance = Math.random() < 0.4 ? Math.floor(Math.random() * 30) + 10 : 0;
    const lifeInsurance = Math.random() < 0.3 ? Math.floor(Math.random() * 100) + 20 : 0;
    const hsaContribution = Math.random() < 0.4 ? Math.floor(Math.random() * 500) : 0;
    
    // After-tax deductions
    const afterTaxDeductions = Math.random() < 0.2 ? Math.floor(Math.random() * 200) : 0;
    
    // Contract type variations
    const isW2 = Math.random() < 0.5;
    
    scenarios.push({
      contractType: isW2 ? 'PERMANENT' : 'LOCUM_TENENS' as ContractType,
      hourlyRate,
      hoursPerWeek,
      state,
      payPeriod,
      filingStatus,
      federalAllowances,
      stateAllowances,
      additionalFederalWithholding,
      additionalStateWithholding,
      retirement401k,
      healthInsurance,
      dentalInsurance,
      visionInsurance,
      lifeInsurance,
      hsaContribution,
      afterTaxDeductions,
      // 1099 specific
      businessExpenses: !isW2 ? Math.floor(Math.random() * 5000) : 0,
      selfEmploymentTax: !isW2,
      quarterlyEstimates: !isW2
    });
  }
  
  return scenarios;
}

// Performance testing function
async function runPerformanceTest(
  testName: string,
  testFunction: () => any,
  iterations: number = 1000,
  targetMs: number = 10
): Promise<PerformanceResult> {
  const times: number[] = [];
  
  // Warm up (JIT compilation)
  for (let i = 0; i < 10; i++) {
    testFunction();
  }
  
  // Actual test
  const startTotal = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    testFunction();
    const end = performance.now();
    times.push(end - start);
  }
  
  const endTotal = performance.now();
  const totalTime = endTotal - startTotal;
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    operation: testName,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    passedThreshold: averageTime < targetMs
  };
}

// Main test execution
export async function runCalculatorPerformanceTests() {
  console.log('🚀 Starting Calculator Performance Tests...\n');
  
  const engine = new CalculationEngine();
  const results: PerformanceResult[] = [];
  
  // Generate test scenarios
  console.log('📊 Generating 1000+ test scenarios...');
  const scenarios = generateTestScenarios(1200);
  console.log(`✅ Generated ${scenarios.length} test scenarios\n`);
  
  // Test 1: Single calculation performance
  console.log('⚡ Test 1: Single Calculation Performance (Target: <10ms)');
  const singleCalcResult = await runPerformanceTest(
    'Single Paycheck Calculation',
    () => {
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      return engine.calculatePaycheck(scenario);
    },
    1000,
    10
  );
  results.push(singleCalcResult);
  console.log(`Average: ${singleCalcResult.averageTime.toFixed(2)}ms`);
  console.log(`Min: ${singleCalcResult.minTime.toFixed(2)}ms, Max: ${singleCalcResult.maxTime.toFixed(2)}ms`);
  console.log(`Status: ${singleCalcResult.passedThreshold ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Test 2: Bulk calculation performance
  console.log('📈 Test 2: Bulk Calculation Performance (1000 calculations)');
  const bulkCalcResult = await runPerformanceTest(
    'Bulk Calculations (1000)',
    () => {
      scenarios.slice(0, 1000).forEach(scenario => {
        engine.calculatePaycheck(scenario);
      });
    },
    1,
    10000 // 10 seconds for 1000 calculations
  );
  results.push(bulkCalcResult);
  console.log(`Total time: ${bulkCalcResult.totalTime.toFixed(2)}ms`);
  console.log(`Per calculation: ${(bulkCalcResult.totalTime / 1000).toFixed(2)}ms`);
  console.log(`Status: ${bulkCalcResult.totalTime < 10000 ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Test 3: Concurrent calculation simulation
  console.log('🔄 Test 3: Concurrent Calculation Simulation (100 simultaneous)');
  const concurrentCalcResult = await runPerformanceTest(
    'Concurrent Calculations',
    async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const scenario = scenarios[i % scenarios.length];
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              resolve(engine.calculatePaycheck(scenario));
            }, 0);
          })
        );
      }
      await Promise.all(promises);
    },
    10,
    200 // 200ms for 100 concurrent calculations
  );
  results.push(concurrentCalcResult);
  console.log(`Average batch time: ${concurrentCalcResult.averageTime.toFixed(2)}ms`);
  console.log(`Status: ${concurrentCalcResult.passedThreshold ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Test 4: Memory usage test
  console.log('💾 Test 4: Memory Usage During Extended Operation');
  const memBefore = process.memoryUsage();
  
  // Run 10,000 calculations
  for (let i = 0; i < 10000; i++) {
    const scenario = scenarios[i % scenarios.length];
    engine.calculatePaycheck(scenario);
  }
  
  const memAfter = process.memoryUsage();
  const memDiff = {
    heapUsed: (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024,
    external: (memAfter.external - memBefore.external) / 1024 / 1024,
    rss: (memAfter.rss - memBefore.rss) / 1024 / 1024
  };
  
  console.log(`Heap increase: ${memDiff.heapUsed.toFixed(2)} MB`);
  console.log(`RSS increase: ${memDiff.rss.toFixed(2)} MB`);
  console.log(`Status: ${memDiff.heapUsed < 50 ? '✅ No memory leak detected' : '⚠️ Possible memory leak'}\n`);
  
  // Test 5: Edge cases performance
  console.log('🔍 Test 5: Edge Cases Performance');
  const edgeCases = [
    { name: 'Zero hours', scenario: { ...scenarios[0], hoursPerWeek: 0 } },
    { name: 'Very high rate ($1000/hr)', scenario: { ...scenarios[0], hourlyRate: 1000 } },
    { name: 'Maximum deductions', scenario: { 
      ...scenarios[0], 
      retirement401k: 19500,
      healthInsurance: 2000,
      hsaContribution: 3650
    }},
    { name: 'Negative values protection', scenario: { ...scenarios[0], hourlyRate: -100 } }
  ];
  
  for (const edge of edgeCases) {
    const result = await runPerformanceTest(
      edge.name,
      () => engine.calculatePaycheck(edge.scenario),
      100,
      10
    );
    console.log(`${edge.name}: ${result.averageTime.toFixed(2)}ms - ${result.passedThreshold ? '✅' : '❌'}`);
  }
  
  // Summary
  console.log('\n📊 PERFORMANCE TEST SUMMARY');
  console.log('═══════════════════════════════════════════');
  
  const allPassed = results.every(r => r.passedThreshold);
  console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  console.log('\nDetailed Results:');
  results.forEach(result => {
    console.log(`- ${result.operation}: ${result.averageTime.toFixed(2)}ms avg (${result.passedThreshold ? 'PASS' : 'FAIL'})`);
  });
  
  return {
    success: allPassed,
    results,
    memoryUsage: memDiff,
    scenariosGenerated: scenarios.length
  };
}

// Export for use in test runner
if (require.main === module) {
  runCalculatorPerformanceTests()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Performance test failed:', error);
      process.exit(1);
    });
}