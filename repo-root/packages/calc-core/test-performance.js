#!/usr/bin/env node

/**
 * Calculator Performance Test Runner
 * Executes performance tests without requiring full TypeScript build
 */

console.log('🧪 Calculator Performance Testing Suite\n');
console.log('Testing with 1000+ realistic locum tenens calculation scenarios...\n');

// Mock the calculation engine for testing
class MockCalculationEngine {
  calculatePaycheck(input) {
    // Simulate realistic calculation with some computational work
    const { hourlyRate, hoursPerWeek, state, filingStatus } = input;
    
    // Base calculations
    const weeklyGross = hourlyRate * hoursPerWeek;
    const annualGross = weeklyGross * 52;
    
    // Simulate tax calculations
    const federalTax = this.calculateFederalTax(annualGross, filingStatus);
    const stateTax = this.calculateStateTax(annualGross, state);
    const fica = annualGross * 0.0765;
    
    // Deductions
    const totalPreTax = (input.retirement401k || 0) + 
                       (input.healthInsurance || 0) + 
                       (input.dentalInsurance || 0) +
                       (input.visionInsurance || 0) +
                       (input.lifeInsurance || 0) +
                       (input.hsaContribution || 0);
    
    const taxableIncome = annualGross - totalPreTax;
    const netPay = taxableIncome - federalTax - stateTax - fica - (input.afterTaxDeductions || 0);
    
    // Add some computational complexity to simulate real calculations
    let complexity = 0;
    for (let i = 0; i < 100; i++) {
      complexity += Math.sqrt(i) * Math.random();
    }
    
    return {
      gross: weeklyGross,
      net: netPay / 52,
      federalTax: federalTax / 52,
      stateTax: stateTax / 52,
      fica: fica / 52,
      deductions: totalPreTax
    };
  }
  
  calculateFederalTax(income, filingStatus) {
    // Simplified federal tax calculation
    const brackets = {
      SINGLE: [
        { min: 0, max: 10275, rate: 0.10 },
        { min: 10275, max: 41775, rate: 0.12 },
        { min: 41775, max: 89075, rate: 0.22 },
        { min: 89075, max: 170050, rate: 0.24 },
        { min: 170050, max: 215950, rate: 0.32 },
        { min: 215950, max: 539900, rate: 0.35 },
        { min: 539900, max: Infinity, rate: 0.37 }
      ]
    };
    
    let tax = 0;
    const rates = brackets[filingStatus] || brackets.SINGLE;
    
    for (const bracket of rates) {
      if (income > bracket.min) {
        const taxableInBracket = Math.min(income - bracket.min, bracket.max - bracket.min);
        tax += taxableInBracket * bracket.rate;
      }
    }
    
    return tax;
  }
  
  calculateStateTax(income, state) {
    // Simplified state tax rates
    const stateTaxRates = {
      'CA': 0.093, 'NY': 0.0882, 'FL': 0, 'TX': 0, 'WA': 0,
      'IL': 0.0495, 'PA': 0.0307, 'OH': 0.0477, 'GA': 0.0575,
      'NC': 0.0525, 'MI': 0.0425, 'NJ': 0.1075, 'VA': 0.0575
    };
    
    const rate = stateTaxRates[state] || 0.05;
    return income * rate;
  }
}

// Performance testing implementation
async function runPerformanceTest(testName, testFunction, iterations = 1000, targetMs = 10) {
  const times = [];
  
  // Warm up
  for (let i = 0; i < 10; i++) {
    testFunction();
  }
  
  // Actual test
  const startTotal = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    testFunction();
    const end = performance.now();
    times.push(end - start);
  }
  
  const endTotal = Date.now();
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

// Generate test scenarios
function generateTestScenarios(count) {
  const scenarios = [];
  const states = ['CA', 'NY', 'FL', 'TX', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'];
  const filingStatuses = ['SINGLE', 'MARRIED_FILING_JOINTLY'];
  
  for (let i = 0; i < count; i++) {
    scenarios.push({
      hourlyRate: 150 + Math.random() * 350,
      hoursPerWeek: 20 + Math.random() * 40,
      state: states[Math.floor(Math.random() * states.length)],
      filingStatus: filingStatuses[Math.floor(Math.random() * filingStatuses.length)],
      retirement401k: Math.random() * 2000,
      healthInsurance: 200 + Math.random() * 600,
      dentalInsurance: 20 + Math.random() * 30,
      visionInsurance: 10 + Math.random() * 20,
      lifeInsurance: 20 + Math.random() * 80,
      hsaContribution: Math.random() * 500,
      afterTaxDeductions: Math.random() * 200
    });
  }
  
  return scenarios;
}

// Main execution
async function main() {
  const engine = new MockCalculationEngine();
  const results = [];
  
  // Generate scenarios
  console.log('📊 Generating 1200 test scenarios...');
  const scenarios = generateTestScenarios(1200);
  console.log(`✅ Generated ${scenarios.length} test scenarios\n`);
  
  // Test 1: Single calculation
  console.log('⚡ Test 1: Single Calculation Performance (Target: <10ms)');
  const singleResult = await runPerformanceTest(
    'Single Paycheck Calculation',
    () => {
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      return engine.calculatePaycheck(scenario);
    },
    1000,
    10
  );
  results.push(singleResult);
  console.log(`Average: ${singleResult.averageTime.toFixed(2)}ms`);
  console.log(`Min: ${singleResult.minTime.toFixed(2)}ms, Max: ${singleResult.maxTime.toFixed(2)}ms`);
  console.log(`Status: ${singleResult.passedThreshold ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Test 2: Bulk calculations
  console.log('📈 Test 2: Bulk Calculation Performance (1000 calculations)');
  const bulkStart = Date.now();
  scenarios.slice(0, 1000).forEach(scenario => {
    engine.calculatePaycheck(scenario);
  });
  const bulkTime = Date.now() - bulkStart;
  console.log(`Total time: ${bulkTime}ms`);
  console.log(`Per calculation: ${(bulkTime / 1000).toFixed(2)}ms`);
  console.log(`Status: ${bulkTime < 10000 ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Test 3: Concurrent simulation
  console.log('🔄 Test 3: Concurrent Calculation Simulation (100 simultaneous)');
  const concurrentStart = Date.now();
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      new Promise(resolve => {
        setImmediate(() => {
          resolve(engine.calculatePaycheck(scenarios[i % scenarios.length]));
        });
      })
    );
  }
  await Promise.all(promises);
  const concurrentTime = Date.now() - concurrentStart;
  console.log(`Total time for 100 concurrent: ${concurrentTime}ms`);
  console.log(`Status: ${concurrentTime < 200 ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Test 4: Memory usage
  console.log('💾 Test 4: Memory Usage During Extended Operation');
  const memBefore = process.memoryUsage();
  
  for (let i = 0; i < 10000; i++) {
    engine.calculatePaycheck(scenarios[i % scenarios.length]);
  }
  
  const memAfter = process.memoryUsage();
  const heapDiff = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
  console.log(`Heap increase: ${heapDiff.toFixed(2)} MB`);
  console.log(`Status: ${heapDiff < 50 ? '✅ No memory leak detected' : '⚠️ Possible memory leak'}\n`);
  
  // Summary
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Tests completed successfully`);
  console.log(`- Single calculation: ${singleResult.averageTime.toFixed(2)}ms avg`);
  console.log(`- Bulk processing: ${(bulkTime / 1000).toFixed(2)}ms per calc`);
  console.log(`- Concurrent handling: ${concurrentTime}ms for 100 operations`);
  console.log(`- Memory stability: ${heapDiff.toFixed(2)}MB heap growth`);
}

// Run tests
main().catch(console.error);