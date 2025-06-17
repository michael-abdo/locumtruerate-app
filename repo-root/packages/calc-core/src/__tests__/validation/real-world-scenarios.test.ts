import { 
  ContractCalculationEngine,
  PaycheckCalculationEngine,
  TaxCalculator,
  ContractType,
  PayPeriod,
  FilingStatus,
  ContractInput,
  PaycheckInput
} from '../../index'

// Real-world test data based on actual locum tenens contracts
const realWorldContracts = [
  {
    name: 'Emergency Medicine - California',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 275,
      hoursPerWeek: 36, // 3x 12-hour shifts
      duration: 13, // Typical 3-month contract
      location: 'CA',
      overtime: {
        enabled: true,
        rate: 1.5,
        threshold: 40,
      },
      expenses: {
        housing: 3500, // Monthly housing stipend
        travel: 500, // Monthly travel allowance
        licensure: 0,
        other: 0,
      },
      benefits: {
        healthInsurance: 0, // Typically not provided
        malpracticeInsurance: 0, // Usually covered by facility
        retirement401k: 0,
        cme: 2000, // Annual CME allowance
      },
    },
    expectedRanges: {
      grossPay: { min: 125000, max: 135000 },
      netPay: { min: 85000, max: 95000 },
      effectiveTaxRate: { min: 28, max: 32 },
    },
  },
  {
    name: 'Hospitalist - Texas',
    input: {
      contractType: ContractType.DAILY,
      dailyRate: 1800,
      daysPerWeek: 7, // 7 on/7 off schedule
      duration: 26, // 6-month contract
      location: 'TX',
      overtime: {
        enabled: false,
      },
      expenses: {
        housing: 2500,
        travel: 300,
        licensure: 500, // One-time licensure reimbursement
        other: 0,
      },
      benefits: {
        healthInsurance: 0,
        malpracticeInsurance: 0,
        retirement401k: 0,
        cme: 0,
      },
    },
    expectedRanges: {
      grossPay: { min: 160000, max: 170000 },
      netPay: { min: 130000, max: 140000 },
      effectiveTaxRate: { min: 18, max: 22 }, // No state income tax
    },
  },
  {
    name: 'Anesthesiologist - New York',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 350,
      hoursPerWeek: 40,
      duration: 52, // Full year contract
      location: 'NY',
      overtime: {
        enabled: true,
        rate: 1.5,
        threshold: 40,
      },
      expenses: {
        housing: 4500, // NYC housing stipend
        travel: 0,
        licensure: 1000,
        other: 500, // Parking/commute
      },
      benefits: {
        healthInsurance: 1500, // Monthly contribution
        malpracticeInsurance: 0,
        retirement401k: 0.06, // 6% match
        cme: 5000,
      },
    },
    expectedRanges: {
      grossPay: { min: 720000, max: 740000 },
      netPay: { min: 450000, max: 470000 },
      effectiveTaxRate: { min: 36, max: 40 },
    },
  },
  {
    name: 'Rural Family Medicine - Montana',
    input: {
      contractType: ContractType.HOURLY,
      hourlyRate: 225,
      hoursPerWeek: 40,
      duration: 52,
      location: 'MT',
      overtime: {
        enabled: false,
      },
      expenses: {
        housing: 1500, // Rural housing assistance
        travel: 200,
        licensure: 0,
        other: 0,
      },
      benefits: {
        healthInsurance: 800,
        malpracticeInsurance: 0,
        retirement401k: 0.03,
        cme: 3000,
      },
    },
    expectedRanges: {
      grossPay: { min: 460000, max: 480000 },
      netPay: { min: 340000, max: 360000 },
      effectiveTaxRate: { min: 24, max: 28 },
    },
  },
]

// Real-world paycheck scenarios
const realWorldPaychecks = [
  {
    name: 'Resident Physician - First Year',
    input: {
      grossSalary: 65000,
      payPeriod: PayPeriod.BIWEEKLY,
      filingStatus: FilingStatus.SINGLE,
      state: 'MA',
      allowances: 0,
      prePostTaxDeductions: {
        retirement401k: 0.03, // 3% contribution
        healthInsurance: 150, // Per paycheck
        dental: 20,
        vision: 10,
        fsa: 100, // Healthcare FSA
        other: 0,
      },
      additionalWithholding: 0,
    },
    expectedRanges: {
      grossPay: { min: 2490, max: 2510 },
      netPay: { min: 1750, max: 1850 },
      effectiveTaxRate: { min: 26, max: 30 },
    },
  },
  {
    name: 'Attending Physician - Married with Kids',
    input: {
      grossSalary: 350000,
      payPeriod: PayPeriod.SEMIMONTHLY,
      filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
      state: 'FL', // No state income tax
      allowances: 3, // Spouse + 2 kids
      prePostTaxDeductions: {
        retirement401k: 0.1, // 10% contribution
        healthInsurance: 600, // Family plan
        dental: 80,
        vision: 40,
        fsa: 230, // Max healthcare FSA
        dependentCare: 416, // Max dependent care FSA
        other: 50, // Life insurance
      },
      additionalWithholding: 0,
    },
    expectedRanges: {
      grossPay: { min: 14500, max: 14700 },
      netPay: { min: 9500, max: 10000 },
      effectiveTaxRate: { min: 31, max: 35 },
    },
  },
  {
    name: 'Part-time Nurse Practitioner',
    input: {
      grossSalary: 85000,
      payPeriod: PayPeriod.WEEKLY,
      filingStatus: FilingStatus.SINGLE,
      state: 'CA',
      allowances: 0,
      prePostTaxDeductions: {
        retirement401k: 0.05,
        healthInsurance: 200,
        dental: 15,
        vision: 8,
        fsa: 50,
        other: 0,
      },
      additionalWithholding: 50, // Extra withholding
    },
    expectedRanges: {
      grossPay: { min: 1630, max: 1640 },
      netPay: { min: 1100, max: 1200 },
      effectiveTaxRate: { min: 28, max: 33 },
    },
  },
]

describe('Real-world contract validation', () => {
  const engine = new ContractCalculationEngine()

  realWorldContracts.forEach(scenario => {
    describe(scenario.name, () => {
      let result: any

      beforeAll(() => {
        result = engine.calculate(scenario.input as ContractInput)
      })

      it('calculates gross pay within expected range', () => {
        expect(result.grossPay).toBeGreaterThanOrEqual(scenario.expectedRanges.grossPay.min)
        expect(result.grossPay).toBeLessThanOrEqual(scenario.expectedRanges.grossPay.max)
      })

      it('calculates net pay within expected range', () => {
        expect(result.netPay).toBeGreaterThanOrEqual(scenario.expectedRanges.netPay.min)
        expect(result.netPay).toBeLessThanOrEqual(scenario.expectedRanges.netPay.max)
      })

      it('calculates effective tax rate within expected range', () => {
        const effectiveRate = ((result.grossPay - result.netPay) / result.grossPay) * 100
        expect(effectiveRate).toBeGreaterThanOrEqual(scenario.expectedRanges.effectiveTaxRate.min)
        expect(effectiveRate).toBeLessThanOrEqual(scenario.expectedRanges.effectiveTaxRate.max)
      })

      it('includes all expense reimbursements', () => {
        const totalExpenses = Object.values(scenario.input.expenses || {}).reduce((sum: number, val: any) => sum + (val || 0), 0)
        if (scenario.input.contractType === ContractType.HOURLY || scenario.input.contractType === ContractType.DAILY) {
          const monthlyExpenses = totalExpenses * (scenario.input.duration / 4.33)
          expect(result.benefits.expenseReimbursements).toBeCloseTo(monthlyExpenses, 0)
        }
      })

      it('calculates overtime correctly if applicable', () => {
        if (scenario.input.overtime?.enabled && scenario.input.contractType === ContractType.HOURLY) {
          const regularHours = Math.min(scenario.input.hoursPerWeek, scenario.input.overtime.threshold)
          const overtimeHours = Math.max(0, scenario.input.hoursPerWeek - scenario.input.overtime.threshold)
          
          if (overtimeHours > 0) {
            const weeklyOvertimePay = overtimeHours * scenario.input.hourlyRate * scenario.input.overtime.rate
            const totalOvertimePay = weeklyOvertimePay * scenario.input.duration
            expect(result.breakdown.overtimePay).toBeCloseTo(totalOvertimePay, 0)
          }
        }
      })
    })
  })
})

describe('Real-world paycheck validation', () => {
  const engine = new PaycheckCalculationEngine()

  realWorldPaychecks.forEach(scenario => {
    describe(scenario.name, () => {
      let result: any

      beforeAll(() => {
        result = engine.calculate(scenario.input as PaycheckInput)
      })

      it('calculates gross pay within expected range', () => {
        expect(result.grossPay).toBeGreaterThanOrEqual(scenario.expectedRanges.grossPay.min)
        expect(result.grossPay).toBeLessThanOrEqual(scenario.expectedRanges.grossPay.max)
      })

      it('calculates net pay within expected range', () => {
        expect(result.netPay).toBeGreaterThanOrEqual(scenario.expectedRanges.netPay.min)
        expect(result.netPay).toBeLessThanOrEqual(scenario.expectedRanges.netPay.max)
      })

      it('calculates effective tax rate within expected range', () => {
        expect(result.effectiveTaxRate).toBeGreaterThanOrEqual(scenario.expectedRanges.effectiveTaxRate.min)
        expect(result.effectiveTaxRate).toBeLessThanOrEqual(scenario.expectedRanges.effectiveTaxRate.max)
      })

      it('applies pre-tax deductions correctly', () => {
        const deductions = scenario.input.prePostTaxDeductions
        const expectedRetirement = scenario.input.grossSalary * (deductions?.retirement401k as number || 0) / 
          (scenario.input.payPeriod === PayPeriod.WEEKLY ? 52 :
           scenario.input.payPeriod === PayPeriod.BIWEEKLY ? 26 :
           scenario.input.payPeriod === PayPeriod.SEMIMONTHLY ? 24 : 12)
        
        if (deductions?.retirement401k) {
          expect(result.deductions.retirement401k).toBeCloseTo(expectedRetirement, 2)
        }
      })

      it('handles state taxes correctly', () => {
        const noStateTaxStates = ['AK', 'FL', 'NV', 'SD', 'TN', 'TX', 'WA', 'WY']
        if (noStateTaxStates.includes(scenario.input.state)) {
          expect(result.taxes.state).toBe(0)
        } else {
          expect(result.taxes.state).toBeGreaterThan(0)
        }
      })
    })
  })
})

// Edge case testing
describe('Edge case validation', () => {
  const contractEngine = new ContractCalculationEngine()
  const paycheckEngine = new PaycheckCalculationEngine()
  const taxCalculator = new TaxCalculator()

  describe('High income scenarios', () => {
    it('handles million-dollar contracts correctly', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 500,
        hoursPerWeek: 40,
        duration: 52,
        location: 'CA',
      })

      expect(result.grossPay).toBe(1040000)
      expect(result.taxes.additionalMedicare).toBeGreaterThan(0) // Should trigger additional Medicare tax
      expect(result.effectiveTaxRate).toBeGreaterThan(35) // High earner tax rate
    })

    it('caps Social Security tax at wage base', () => {
      const result = paycheckEngine.calculate({
        grossSalary: 500000,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'NY',
        allowances: 0,
      })

      const annualSocialSecurity = result.taxes.socialSecurity * 12
      const maxSocialSecurity = 168600 * 0.062 // 2024 wage base
      expect(annualSocialSecurity).toBeCloseTo(maxSocialSecurity, 0)
    })
  })

  describe('Low income scenarios', () => {
    it('handles minimum wage contracts', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 15, // Minimum wage in some states
        hoursPerWeek: 40,
        duration: 52,
        location: 'CA',
      })

      expect(result.grossPay).toBe(31200)
      expect(result.taxes.federal).toBeGreaterThan(0)
      expect(result.netPay).toBeGreaterThan(25000) // Should have reasonable take-home
    })

    it('handles part-time low income correctly', () => {
      const result = paycheckEngine.calculate({
        grossSalary: 20000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'TX',
        allowances: 0,
      })

      expect(result.taxes.federal).toBeGreaterThan(0)
      expect(result.taxes.state).toBe(0) // No state tax in TX
      expect(result.effectiveTaxRate).toBeLessThan(20) // Low tax bracket
    })
  })

  describe('Unusual contract structures', () => {
    it('handles 1-week emergency contracts', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.DAILY,
        dailyRate: 2000,
        daysPerWeek: 7,
        duration: 1,
        location: 'CA',
      })

      expect(result.grossPay).toBe(14000)
      expect(result.netPay).toBeGreaterThan(10000)
    })

    it('handles long-term 2-year contracts', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 104, // 2 years
        location: 'TX',
      })

      expect(result.grossPay).toBe(832000)
      expect(result.annualEquivalent).toBe(416000)
    })

    it('handles contracts with maximum overtime', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 150,
        hoursPerWeek: 80, // 40 regular + 40 overtime
        duration: 13,
        location: 'NY',
        overtime: {
          enabled: true,
          rate: 2.0, // Double time
          threshold: 40,
        },
      })

      const regularPay = 150 * 40 * 13
      const overtimePay = 150 * 2.0 * 40 * 13
      expect(result.grossPay).toBe(regularPay + overtimePay)
    })
  })

  describe('Tax calculation edge cases', () => {
    it('handles all filing statuses correctly', () => {
      const statuses = [
        FilingStatus.SINGLE,
        FilingStatus.MARRIED_FILING_JOINTLY,
        FilingStatus.MARRIED_FILING_SEPARATELY,
        FilingStatus.HEAD_OF_HOUSEHOLD,
      ]

      statuses.forEach(status => {
        const result = paycheckEngine.calculate({
          grossSalary: 100000,
          payPeriod: PayPeriod.MONTHLY,
          filingStatus: status,
          state: 'CA',
          allowances: 0,
        })

        expect(result.taxes.federal).toBeGreaterThan(0)
        expect(result.netPay).toBeGreaterThan(0)
      })
    })

    it('handles all pay periods correctly', () => {
      const periods = [
        PayPeriod.WEEKLY,
        PayPeriod.BIWEEKLY,
        PayPeriod.SEMIMONTHLY,
        PayPeriod.MONTHLY,
      ]

      periods.forEach(period => {
        const result = paycheckEngine.calculate({
          grossSalary: 75000,
          payPeriod: period,
          filingStatus: FilingStatus.SINGLE,
          state: 'CA',
          allowances: 0,
        })

        // Annual taxes should be similar regardless of pay period
        const annualFederal = result.taxes.federal * 
          (period === PayPeriod.WEEKLY ? 52 :
           period === PayPeriod.BIWEEKLY ? 26 :
           period === PayPeriod.SEMIMONTHLY ? 24 : 12)
        
        expect(annualFederal).toBeGreaterThan(10000)
        expect(annualFederal).toBeLessThan(20000)
      })
    })
  })

  describe('Benefit calculation edge cases', () => {
    it('handles 100% 401k contribution', () => {
      const result = paycheckEngine.calculate({
        grossSalary: 50000,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'TX',
        allowances: 0,
        prePostTaxDeductions: {
          retirement401k: 1.0, // 100% (should be capped)
        },
      })

      // Should be capped at IRS limit
      const annualContribution = result.deductions.retirement401k * 12
      expect(annualContribution).toBeLessThanOrEqual(23000) // 2024 limit
    })

    it('handles maximum HSA contributions', () => {
      const result = paycheckEngine.calculate({
        grossSalary: 100000,
        payPeriod: PayPeriod.SEMIMONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'FL',
        allowances: 0,
        prePostTaxDeductions: {
          hsa: 4150 / 24, // Max individual HSA for 2024
        },
      })

      expect(result.deductions.hsa).toBeCloseTo(4150 / 24, 2)
    })
  })
})