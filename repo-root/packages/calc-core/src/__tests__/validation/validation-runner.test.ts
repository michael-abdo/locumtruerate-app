import { 
  ContractCalculationEngine,
  PaycheckCalculationEngine,
  ContractType,
  PayPeriod,
  FilingStatus
} from '../../index'

interface ValidationScenario {
  id: string
  name: string
  category: 'contract' | 'paycheck'
  input: any
  expected: {
    grossPay?: { min: number; max: number }
    netPay?: { min: number; max: number }
    effectiveTaxRate?: { min: number; max: number }
    specificValues?: Record<string, number>
  }
  tolerance?: number // Percentage tolerance for validation
}

interface ValidationResult {
  scenarioId: string
  passed: boolean
  errors: string[]
  warnings: string[]
  actualValues: Record<string, number>
  expectedValues: Record<string, any>
  executionTime: number
}

interface ValidationReport {
  totalScenarios: number
  passedScenarios: number
  failedScenarios: number
  warningCount: number
  averageExecutionTime: number
  results: ValidationResult[]
  summary: {
    byCategory: Record<string, { passed: number; failed: number }>
    commonFailures: Array<{ error: string; count: number }>
    performanceMetrics: {
      slowestScenario: { id: string; time: number }
      fastestScenario: { id: string; time: number }
    }
  }
}

class ValidationRunner {
  private contractEngine: ContractCalculationEngine
  private paycheckEngine: PaycheckCalculationEngine

  constructor() {
    this.contractEngine = new ContractCalculationEngine()
    this.paycheckEngine = new PaycheckCalculationEngine()
  }

  async runValidation(scenarios: ValidationScenario[]): Promise<ValidationReport> {
    const results: ValidationResult[] = []
    
    for (const scenario of scenarios) {
      const result = await this.validateScenario(scenario)
      results.push(result)
    }

    return this.generateReport(scenarios, results)
  }

  private async validateScenario(scenario: ValidationScenario): Promise<ValidationResult> {
    const startTime = performance.now()
    const errors: string[] = []
    const warnings: string[] = []
    let actualValues: Record<string, number> = {}

    try {
      const engine = scenario.category === 'contract' ? this.contractEngine : this.paycheckEngine
      const result = engine.calculate(scenario.input)
      
      actualValues = {
        grossPay: result.grossPay,
        netPay: result.netPay,
        effectiveTaxRate: ((result.grossPay - result.netPay) / result.grossPay) * 100,
        ...this.extractSpecificValues(result, scenario.expected.specificValues || {}),
      }

      // Validate ranges
      if (scenario.expected.grossPay) {
        if (!this.isInRange(actualValues.grossPay, scenario.expected.grossPay, scenario.tolerance)) {
          errors.push(`Gross pay ${actualValues.grossPay} not in expected range [${scenario.expected.grossPay.min}, ${scenario.expected.grossPay.max}]`)
        }
      }

      if (scenario.expected.netPay) {
        if (!this.isInRange(actualValues.netPay, scenario.expected.netPay, scenario.tolerance)) {
          errors.push(`Net pay ${actualValues.netPay} not in expected range [${scenario.expected.netPay.min}, ${scenario.expected.netPay.max}]`)
        }
      }

      if (scenario.expected.effectiveTaxRate) {
        if (!this.isInRange(actualValues.effectiveTaxRate, scenario.expected.effectiveTaxRate, scenario.tolerance)) {
          errors.push(`Effective tax rate ${actualValues.effectiveTaxRate}% not in expected range [${scenario.expected.effectiveTaxRate.min}%, ${scenario.expected.effectiveTaxRate.max}%]`)
        }
      }

      // Validate specific values
      Object.entries(scenario.expected.specificValues || {}).forEach(([key, expectedValue]) => {
        const actualValue = actualValues[key]
        if (actualValue !== undefined) {
          const tolerance = scenario.tolerance || 1 // 1% default tolerance
          const diff = Math.abs(actualValue - expectedValue) / expectedValue * 100
          if (diff > tolerance) {
            errors.push(`${key} value ${actualValue} differs from expected ${expectedValue} by ${diff.toFixed(2)}%`)
          }
        }
      })

      // Add warnings for edge cases
      if (actualValues.effectiveTaxRate > 50) {
        warnings.push('Unusually high effective tax rate detected')
      }
      if (actualValues.effectiveTaxRate < 5) {
        warnings.push('Unusually low effective tax rate detected')
      }
      if (actualValues.netPay > actualValues.grossPay) {
        errors.push('Net pay cannot exceed gross pay')
      }

    } catch (error) {
      errors.push(`Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    const endTime = performance.now()
    const executionTime = endTime - startTime

    return {
      scenarioId: scenario.id,
      passed: errors.length === 0,
      errors,
      warnings,
      actualValues,
      expectedValues: scenario.expected,
      executionTime,
    }
  }

  private isInRange(value: number, range: { min: number; max: number }, tolerance?: number): boolean {
    const tolerancePercent = tolerance || 0
    const minWithTolerance = range.min * (1 - tolerancePercent / 100)
    const maxWithTolerance = range.max * (1 + tolerancePercent / 100)
    return value >= minWithTolerance && value <= maxWithTolerance
  }

  private extractSpecificValues(result: any, expectedKeys: Record<string, number>): Record<string, number> {
    const values: Record<string, number> = {}
    
    Object.keys(expectedKeys).forEach(key => {
      const keyPath = key.split('.')
      let value = result
      
      for (const pathSegment of keyPath) {
        value = value?.[pathSegment]
      }
      
      if (typeof value === 'number') {
        values[key] = value
      }
    })
    
    return values
  }

  private generateReport(scenarios: ValidationScenario[], results: ValidationResult[]): ValidationReport {
    const passedCount = results.filter(r => r.passed).length
    const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0)
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0)
    
    // Group by category
    const byCategory: Record<string, { passed: number; failed: number }> = {}
    scenarios.forEach((scenario, index) => {
      const result = results[index]
      if (!byCategory[scenario.category]) {
        byCategory[scenario.category] = { passed: 0, failed: 0 }
      }
      if (result.passed) {
        byCategory[scenario.category].passed++
      } else {
        byCategory[scenario.category].failed++
      }
    })

    // Find common failures
    const errorCounts: Record<string, number> = {}
    results.forEach(result => {
      result.errors.forEach(error => {
        const errorType = this.categorizeError(error)
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1
      })
    })
    
    const commonFailures = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Performance metrics
    const sortedByTime = [...results].sort((a, b) => a.executionTime - b.executionTime)
    const performanceMetrics = {
      slowestScenario: {
        id: sortedByTime[sortedByTime.length - 1]?.scenarioId || '',
        time: sortedByTime[sortedByTime.length - 1]?.executionTime || 0,
      },
      fastestScenario: {
        id: sortedByTime[0]?.scenarioId || '',
        time: sortedByTime[0]?.executionTime || 0,
      },
    }

    return {
      totalScenarios: scenarios.length,
      passedScenarios: passedCount,
      failedScenarios: scenarios.length - passedCount,
      warningCount,
      averageExecutionTime: totalExecutionTime / scenarios.length,
      results,
      summary: {
        byCategory,
        commonFailures,
        performanceMetrics,
      },
    }
  }

  private categorizeError(error: string): string {
    if (error.includes('tax rate')) return 'Tax Rate Issues'
    if (error.includes('Gross pay')) return 'Gross Pay Calculation'
    if (error.includes('Net pay')) return 'Net Pay Calculation'
    if (error.includes('failed')) return 'Calculation Errors'
    return 'Other'
  }
}

// Comprehensive validation scenario definitions
const validationScenarios: ValidationScenario[] = [
  // High-income physician scenarios
  {
    id: 'anesthesiologist-ca',
    name: 'Anesthesiologist in California',
    category: 'contract',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 400,
      hoursPerWeek: 40,
      duration: 52,
      location: 'CA',
    },
    expected: {
      grossPay: { min: 830000, max: 835000 },
      netPay: { min: 520000, max: 550000 },
      effectiveTaxRate: { min: 34, max: 38 },
    },
    tolerance: 2,
  },
  {
    id: 'surgeon-ny',
    name: 'Surgeon in New York',
    category: 'contract',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 500,
      hoursPerWeek: 50,
      duration: 52,
      location: 'NY',
    },
    expected: {
      grossPay: { min: 1295000, max: 1305000 },
      netPay: { min: 750000, max: 800000 },
      effectiveTaxRate: { min: 38, max: 42 },
    },
    tolerance: 2,
  },
  // Mid-range scenarios
  {
    id: 'hospitalist-tx',
    name: 'Hospitalist in Texas',
    category: 'contract',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 225,
      hoursPerWeek: 40,
      duration: 52,
      location: 'TX',
    },
    expected: {
      grossPay: { min: 467000, max: 469000 },
      netPay: { min: 350000, max: 380000 },
      effectiveTaxRate: { min: 18, max: 22 },
    },
    tolerance: 2,
  },
  {
    id: 'family-med-rural',
    name: 'Family Medicine Rural',
    category: 'contract',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 200,
      hoursPerWeek: 40,
      duration: 52,
      location: 'MT',
    },
    expected: {
      grossPay: { min: 415000, max: 417000 },
      netPay: { min: 310000, max: 340000 },
      effectiveTaxRate: { min: 20, max: 25 },
    },
    tolerance: 2,
  },
  // Nursing scenarios
  {
    id: 'travel-nurse-ca',
    name: 'Travel Nurse California',
    category: 'contract',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 65,
      hoursPerWeek: 36,
      duration: 13,
      expenses: {
        housing: 2500,
        meals: 500,
      },
    },
    expected: {
      grossPay: { min: 30000, max: 31000 },
      netPay: { min: 35000, max: 40000 }, // Including tax-free stipends
    },
    tolerance: 3,
  },
  // Paycheck scenarios
  {
    id: 'resident-paycheck',
    name: 'Medical Resident Paycheck',
    category: 'paycheck',
    input: {
      grossSalary: 65000,
      payPeriod: PayPeriod.BIWEEKLY,
      filingStatus: FilingStatus.SINGLE,
      state: 'MA',
      allowances: 0,
    },
    expected: {
      grossPay: { min: 2490, max: 2510 },
      netPay: { min: 1800, max: 1900 },
      effectiveTaxRate: { min: 24, max: 28 },
    },
    tolerance: 2,
  },
  {
    id: 'attending-family',
    name: 'Attending with Family',
    category: 'paycheck',
    input: {
      grossSalary: 350000,
      payPeriod: PayPeriod.MONTHLY,
      filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
      state: 'FL',
      allowances: 3,
      prePostTaxDeductions: {
        retirement401k: 0.1,
        healthInsurance: 600,
      },
    },
    expected: {
      grossPay: { min: 29150, max: 29170 },
      netPay: { min: 19000, max: 21000 },
      effectiveTaxRate: { min: 27, max: 32 },
    },
    tolerance: 3,
  },
  // Edge cases
  {
    id: 'minimum-wage',
    name: 'Minimum Wage Contract',
    category: 'contract',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 15,
      hoursPerWeek: 40,
      duration: 52,
      location: 'CA',
    },
    expected: {
      grossPay: { min: 31000, max: 32000 },
      netPay: { min: 25000, max: 28000 },
      effectiveTaxRate: { min: 15, max: 20 },
    },
    tolerance: 5,
  },
  {
    id: 'high-income-edge',
    name: 'Million Dollar Contract',
    category: 'contract',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 500,
      hoursPerWeek: 40,
      duration: 50,
      location: 'CA',
    },
    expected: {
      grossPay: { min: 999000, max: 1001000 },
      netPay: { min: 580000, max: 620000 },
      effectiveTaxRate: { min: 38, max: 42 },
    },
    tolerance: 2,
  },
]

describe('Comprehensive Validation Suite', () => {
  let runner: ValidationRunner
  let report: ValidationReport

  beforeAll(async () => {
    runner = new ValidationRunner()
    report = await runner.runValidation(validationScenarios)
  })

  it('should pass majority of validation scenarios', () => {
    const passRate = (report.passedScenarios / report.totalScenarios) * 100
    expect(passRate).toBeGreaterThan(90) // At least 90% pass rate
  })

  it('should complete all calculations within reasonable time', () => {
    expect(report.averageExecutionTime).toBeLessThan(50) // Average under 50ms
    expect(report.summary.performanceMetrics.slowestScenario.time).toBeLessThan(200) // Slowest under 200ms
  })

  it('should have no critical calculation errors', () => {
    const criticalErrors = report.results.filter(r => 
      r.errors.some(e => e.includes('failed') || e.includes('exceed'))
    )
    expect(criticalErrors).toHaveLength(0)
  })

  it('should validate high-income scenarios correctly', () => {
    const highIncomeScenarios = report.results.filter(r => 
      r.scenarioId.includes('anesthesiologist') || 
      r.scenarioId.includes('surgeon') ||
      r.scenarioId.includes('high-income')
    )
    
    highIncomeScenarios.forEach(result => {
      expect(result.passed).toBe(true)
      expect(result.actualValues.effectiveTaxRate).toBeGreaterThan(30)
    })
  })

  it('should validate nursing scenarios correctly', () => {
    const nursingScenarios = report.results.filter(r => 
      r.scenarioId.includes('nurse')
    )
    
    nursingScenarios.forEach(result => {
      expect(result.passed).toBe(true)
      expect(result.actualValues.grossPay).toBeGreaterThan(0)
    })
  })

  it('should handle paycheck calculations accurately', () => {
    const paycheckResults = report.results.filter(r => 
      validationScenarios.find(s => s.id === r.scenarioId)?.category === 'paycheck'
    )
    
    paycheckResults.forEach(result => {
      expect(result.passed).toBe(true)
      expect(result.actualValues.netPay).toBeLessThan(result.actualValues.grossPay)
    })
  })

  it('should provide detailed error reporting', () => {
    if (report.failedScenarios > 0) {
      const failedResults = report.results.filter(r => !r.passed)
      failedResults.forEach(result => {
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors[0]).toBeTruthy()
      })
    }
  })

  it('should categorize errors properly', () => {
    if (report.summary.commonFailures.length > 0) {
      report.summary.commonFailures.forEach(failure => {
        expect(failure.error).toBeTruthy()
        expect(failure.count).toBeGreaterThan(0)
      })
    }
  })

  afterAll(() => {
    // Output detailed report for analysis
    console.log('\n=== VALIDATION REPORT ===')
    console.log(`Total Scenarios: ${report.totalScenarios}`)
    console.log(`Passed: ${report.passedScenarios} (${((report.passedScenarios / report.totalScenarios) * 100).toFixed(1)}%)`)
    console.log(`Failed: ${report.failedScenarios}`)
    console.log(`Warnings: ${report.warningCount}`)
    console.log(`Average Execution Time: ${report.averageExecutionTime.toFixed(2)}ms`)
    
    if (report.failedScenarios > 0) {
      console.log('\n=== FAILED SCENARIOS ===')
      report.results.filter(r => !r.passed).forEach(result => {
        console.log(`${result.scenarioId}: ${result.errors.join(', ')}`)
      })
    }
    
    if (report.summary.commonFailures.length > 0) {
      console.log('\n=== COMMON FAILURES ===')
      report.summary.commonFailures.forEach(failure => {
        console.log(`${failure.error}: ${failure.count} occurrences`)
      })
    }
  })
})