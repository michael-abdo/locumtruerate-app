import {
  calculatePaycheck,
  calculateAnnualPaycheck,
  calculateBiweeklyPaycheck,
  calculateMonthlyPaycheck,
  calculateWeeklyPaycheck,
  PayPeriod,
  FilingStatus,
  type PaycheckInput,
  type PaycheckResult,
} from '../paycheck-calculator'
import { TEST_SALARIES, expectCloseTo } from './setup'

describe('Paycheck Calculator', () => {
  describe('calculatePaycheck', () => {
    it('calculates basic biweekly paycheck correctly', () => {
      const input: PaycheckInput = {
        grossSalary: 120000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
      }

      const result = calculatePaycheck(input)

      expectCloseTo(result.grossPay, 4615.38) // 120000 / 26
      expectCloseTo(result.netPay, 3279.73)
      expectCloseTo(result.taxes.federal, 800.57)
      expectCloseTo(result.taxes.state, 244.70)
      expectCloseTo(result.taxes.socialSecurity, 286.15)
      expectCloseTo(result.taxes.medicare, 66.92)
    })

    it('calculates weekly paycheck correctly', () => {
      const input: PaycheckInput = {
        grossSalary: 75000,
        payPeriod: PayPeriod.WEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'TX',
        allowances: 2,
      }

      const result = calculatePaycheck(input)

      expectCloseTo(result.grossPay, 1442.31) // 75000 / 52
      expect(result.taxes.state).toBe(0) // Texas has no state income tax
      expectCloseTo(result.netPay, 1159.36)
    })

    it('calculates monthly paycheck correctly', () => {
      const input: PaycheckInput = {
        grossSalary: 200000,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.MARRIED_JOINTLY,
        state: 'NY',
        allowances: 3,
      }

      const result = calculatePaycheck(input)

      expectCloseTo(result.grossPay, 16666.67) // 200000 / 12
      expectCloseTo(result.netPay, 11487.17)
      expect(result.taxes.federal).toBeGreaterThan(0)
      expect(result.taxes.state).toBeGreaterThan(0)
    })

    it('handles different filing statuses', () => {
      const baseInput: PaycheckInput = {
        grossSalary: 150000,
        payPeriod: PayPeriod.BIWEEKLY,
        state: 'CA',
        allowances: 0,
      }

      const singleResult = calculatePaycheck({
        ...baseInput,
        filingStatus: FilingStatus.SINGLE,
      })

      const marriedResult = calculatePaycheck({
        ...baseInput,
        filingStatus: FilingStatus.MARRIED_JOINTLY,
      })

      const headResult = calculatePaycheck({
        ...baseInput,
        filingStatus: FilingStatus.HEAD_OF_HOUSEHOLD,
      })

      // Married filing jointly should have lowest tax
      expect(marriedResult.taxes.federal).toBeLessThan(singleResult.taxes.federal)
      expect(headResult.taxes.federal).toBeLessThan(singleResult.taxes.federal)
      expect(headResult.taxes.federal).toBeGreaterThan(marriedResult.taxes.federal)
    })

    it('applies allowances correctly', () => {
      const baseInput: PaycheckInput = {
        grossSalary: 100000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
      }

      const noAllowances = calculatePaycheck({ ...baseInput, allowances: 0 })
      const twoAllowances = calculatePaycheck({ ...baseInput, allowances: 2 })
      const fourAllowances = calculatePaycheck({ ...baseInput, allowances: 4 })

      // More allowances = less federal tax withheld
      expect(twoAllowances.taxes.federal).toBeLessThan(noAllowances.taxes.federal)
      expect(fourAllowances.taxes.federal).toBeLessThan(twoAllowances.taxes.federal)
    })

    it('handles pre-tax deductions', () => {
      const input: PaycheckInput = {
        grossSalary: 150000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
        preTaxDeductions: {
          retirement401k: 500,
          healthInsurance: 200,
          dentalInsurance: 25,
          visionInsurance: 15,
          fsa: 100,
          hsa: 150,
        },
      }

      const result = calculatePaycheck(input)

      expect(result.deductions.total).toBe(990)
      expectCloseTo(result.taxableIncome, 4779.62) // Gross - deductions
      expect(result.netPay).toBeLessThan(result.grossPay - result.taxes.total)
    })

    it('handles post-tax deductions', () => {
      const input: PaycheckInput = {
        grossSalary: 80000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'TX',
        allowances: 1,
        postTaxDeductions: {
          lifeInsurance: 50,
          disability: 75,
          other: 100,
        },
      }

      const result = calculatePaycheck(input)

      expect(result.deductions.postTax).toBe(225)
      const expectedNet = result.grossPay - result.taxes.total - result.deductions.total
      expectCloseTo(result.netPay, expectedNet)
    })

    it('calculates FICA taxes correctly', () => {
      const input: PaycheckInput = {
        grossSalary: 200000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'FL',
        allowances: 0,
      }

      const result = calculatePaycheck(input)

      // Social Security: 6.2% up to $147,000 (2022 limit)
      // Medicare: 1.45% on all income
      expectCloseTo(result.taxes.socialSecurity, 350.77) // Capped
      expectCloseTo(result.taxes.medicare, 111.54) // 1.45% of gross
    })

    it('applies additional Medicare tax for high earners', () => {
      const input: PaycheckInput = {
        grossSalary: 300000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'FL',
        allowances: 0,
      }

      const result = calculatePaycheck(input)

      // Additional Medicare: 0.9% on income over $200k for single filers
      const expectedAdditional = ((300000 - 200000) / 26) * 0.009
      expectCloseTo(result.taxes.additionalMedicare, expectedAdditional)
    })

    it('handles year-to-date calculations', () => {
      const input: PaycheckInput = {
        grossSalary: 150000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
        ytd: {
          gross: 75000,
          federal: 15000,
          state: 5000,
          socialSecurity: 4650,
          medicare: 1087.50,
        },
      }

      const result = calculatePaycheck(input)

      expect(result.ytd.gross).toBe(75000 + result.grossPay)
      expect(result.ytd.federal).toBe(15000 + result.taxes.federal)
    })

    it('handles overtime calculations', () => {
      const input: PaycheckInput = {
        grossSalary: 100000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
        overtime: {
          hours: 10,
          rate: 1.5,
        },
      }

      const result = calculatePaycheck(input)

      const baseHourly = 100000 / (52 * 40)
      const overtimePay = baseHourly * 1.5 * 10
      expectCloseTo(result.grossPay, 3846.15 + overtimePay)
    })

    it('validates negative salary', () => {
      const input: PaycheckInput = {
        grossSalary: -50000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
      }

      expect(() => calculatePaycheck(input)).toThrow('Invalid gross salary')
    })

    it('validates excessive deductions', () => {
      const input: PaycheckInput = {
        grossSalary: 50000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
        preTaxDeductions: {
          retirement401k: 2000, // More than gross per period
        },
      }

      expect(() => calculatePaycheck(input)).toThrow('Deductions exceed gross pay')
    })
  })

  describe('Pay Period Specific Functions', () => {
    const testSalary = 120000
    const testState = 'CA'
    const testStatus = FilingStatus.SINGLE

    it('calculateWeeklyPaycheck', () => {
      const result = calculateWeeklyPaycheck(testSalary, testStatus, testState)
      
      expectCloseTo(result.grossPay, 2307.69) // 120000 / 52
      expect(result.payPeriod).toBe(PayPeriod.WEEKLY)
      expect(result.periodsPerYear).toBe(52)
    })

    it('calculateBiweeklyPaycheck', () => {
      const result = calculateBiweeklyPaycheck(testSalary, testStatus, testState)
      
      expectCloseTo(result.grossPay, 4615.38) // 120000 / 26
      expect(result.payPeriod).toBe(PayPeriod.BIWEEKLY)
      expect(result.periodsPerYear).toBe(26)
    })

    it('calculateMonthlyPaycheck', () => {
      const result = calculateMonthlyPaycheck(testSalary, testStatus, testState)
      
      expectCloseTo(result.grossPay, 10000) // 120000 / 12
      expect(result.payPeriod).toBe(PayPeriod.MONTHLY)
      expect(result.periodsPerYear).toBe(12)
    })

    it('calculateAnnualPaycheck', () => {
      const result = calculateAnnualPaycheck(testSalary, testStatus, testState)
      
      expect(result.grossPay).toBe(120000)
      expect(result.payPeriod).toBe(PayPeriod.ANNUAL)
      expect(result.periodsPerYear).toBe(1)
    })
  })

  describe('State Tax Variations', () => {
    const testCases = [
      { state: 'TX', expectedStateTax: 0 }, // No state tax
      { state: 'FL', expectedStateTax: 0 }, // No state tax
      { state: 'WA', expectedStateTax: 0 }, // No state tax
      { state: 'CA', expectedStateTax: 244.70 }, // High state tax
      { state: 'NY', expectedStateTax: 196.15 }, // Moderate state tax
    ]

    testCases.forEach(({ state, expectedStateTax }) => {
      it(`calculates state tax correctly for ${state}`, () => {
        const input: PaycheckInput = {
          grossSalary: 120000,
          payPeriod: PayPeriod.BIWEEKLY,
          filingStatus: FilingStatus.SINGLE,
          state,
          allowances: 0,
        }

        const result = calculatePaycheck(input)
        
        if (expectedStateTax === 0) {
          expect(result.taxes.state).toBe(0)
        } else {
          expectCloseTo(result.taxes.state, expectedStateTax)
        }
      })
    })
  })

  describe('Tax Bracket Calculations', () => {
    const brackets = [
      { salary: 40000, expectedBracket: '12%' },
      { salary: 90000, expectedBracket: '22%' },
      { salary: 180000, expectedBracket: '24%' },
      { salary: 250000, expectedBracket: '32%' },
      { salary: 400000, expectedBracket: '35%' },
      { salary: 700000, expectedBracket: '37%' },
    ]

    brackets.forEach(({ salary, expectedBracket }) => {
      it(`identifies correct tax bracket for $${salary.toLocaleString()}`, () => {
        const input: PaycheckInput = {
          grossSalary: salary,
          payPeriod: PayPeriod.BIWEEKLY,
          filingStatus: FilingStatus.SINGLE,
          state: 'TX',
          allowances: 0,
        }

        const result = calculatePaycheck(input)
        expect(result.taxBracket).toContain(expectedBracket)
      })
    })
  })

  describe('Effective Tax Rate', () => {
    it('calculates effective tax rate correctly', () => {
      const input: PaycheckInput = {
        grossSalary: 150000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
      }

      const result = calculatePaycheck(input)
      
      const totalTaxRate = result.taxes.total / result.grossPay
      expectCloseTo(result.effectiveTaxRate, totalTaxRate * 100)
    })

    it('shows progressive tax impact', () => {
      const lowIncome = calculatePaycheck({
        grossSalary: 50000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
      })

      const highIncome = calculatePaycheck({
        grossSalary: 300000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
      })

      expect(highIncome.effectiveTaxRate).toBeGreaterThan(lowIncome.effectiveTaxRate)
    })
  })

  describe('Annual Projections', () => {
    it('projects annual totals from biweekly paycheck', () => {
      const input: PaycheckInput = {
        grossSalary: 100000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'NY',
        allowances: 1,
        preTaxDeductions: {
          retirement401k: 300,
          healthInsurance: 150,
        },
      }

      const result = calculatePaycheck(input)
      
      expect(result.annualProjection.gross).toBe(100000)
      expectCloseTo(result.annualProjection.net, result.netPay * 26)
      expectCloseTo(result.annualProjection.taxes, result.taxes.total * 26)
      expectCloseTo(result.annualProjection.deductions, result.deductions.total * 26)
    })
  })
})