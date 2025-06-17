import {
  calculateFederalTax,
  calculateStateTax,
  calculateFICATax,
  calculateSelfEmploymentTax,
  calculateQuarterlyEstimates,
  getTaxBracket,
  FilingStatus,
} from '../tax-calculator'
import { expectCloseTo } from './setup'

describe('Tax Calculator', () => {
  describe('calculateFederalTax', () => {
    it('calculates federal tax for single filer correctly', () => {
      const testCases = [
        { income: 20000, expected: 2206 },
        { income: 50000, expected: 6748.50 },
        { income: 100000, expected: 17950.50 },
        { income: 200000, expected: 45464.50 },
        { income: 500000, expected: 156687 },
      ]

      testCases.forEach(({ income, expected }) => {
        const result = calculateFederalTax(income, FilingStatus.SINGLE)
        expectCloseTo(result, expected)
      })
    })

    it('calculates federal tax for married filing jointly', () => {
      const testCases = [
        { income: 40000, expected: 4412 },
        { income: 100000, expected: 13497 },
        { income: 200000, expected: 35901 },
        { income: 400000, expected: 89265 },
        { income: 700000, expected: 205065 },
      ]

      testCases.forEach(({ income, expected }) => {
        const result = calculateFederalTax(income, FilingStatus.MARRIED_JOINTLY)
        expectCloseTo(result, expected)
      })
    })

    it('calculates federal tax for head of household', () => {
      const testCases = [
        { income: 30000, expected: 3226 },
        { income: 75000, expected: 10822 },
        { income: 150000, expected: 30256 },
        { income: 300000, expected: 75622 },
      ]

      testCases.forEach(({ income, expected }) => {
        const result = calculateFederalTax(income, FilingStatus.HEAD_OF_HOUSEHOLD)
        expectCloseTo(result, expected)
      })
    })

    it('handles married filing separately', () => {
      const income = 150000
      const jointTax = calculateFederalTax(income * 2, FilingStatus.MARRIED_JOINTLY)
      const separateTax = calculateFederalTax(income, FilingStatus.MARRIED_SEPARATELY)
      
      // Separate filing should be approximately half of joint filing for same total income
      expectCloseTo(separateTax * 2, jointTax, -1) // Within $10
    })

    it('applies standard deduction correctly', () => {
      const income = 50000
      
      // Standard deductions for 2023
      const singleDeduction = 13850
      const marriedDeduction = 27700
      
      const singleTax = calculateFederalTax(income, FilingStatus.SINGLE)
      const singleTaxable = income - singleDeduction
      
      const marriedTax = calculateFederalTax(income, FilingStatus.MARRIED_JOINTLY)
      const marriedTaxable = income - marriedDeduction
      
      // Married should pay less tax due to higher standard deduction
      expect(marriedTax).toBeLessThan(singleTax)
      expect(marriedTaxable).toBeLessThan(singleTaxable)
    })

    it('returns zero for income below standard deduction', () => {
      const result = calculateFederalTax(10000, FilingStatus.SINGLE)
      expect(result).toBe(0)
    })

    it('handles negative income', () => {
      expect(() => calculateFederalTax(-50000, FilingStatus.SINGLE))
        .toThrow('Income cannot be negative')
    })
  })

  describe('calculateStateTax', () => {
    it('returns zero for states with no income tax', () => {
      const noTaxStates = ['TX', 'FL', 'WA', 'NV', 'SD', 'WY', 'AK', 'TN', 'NH']
      const income = 100000

      noTaxStates.forEach(state => {
        const result = calculateStateTax(income, state)
        expect(result).toBe(0)
      })
    })

    it('calculates state tax for California correctly', () => {
      const testCases = [
        { income: 30000, expected: 887.26 },
        { income: 75000, expected: 3739.26 },
        { income: 150000, expected: 11139.26 },
        { income: 300000, expected: 26799.26 },
        { income: 1000000, expected: 112923.26 },
      ]

      testCases.forEach(({ income, expected }) => {
        const result = calculateStateTax(income, 'CA', FilingStatus.SINGLE)
        expectCloseTo(result, expected)
      })
    })

    it('calculates state tax for New York correctly', () => {
      const testCases = [
        { income: 25000, expected: 1202 },
        { income: 80000, expected: 4612 },
        { income: 200000, expected: 13962 },
        { income: 500000, expected: 33687 },
      ]

      testCases.forEach(({ income, expected }) => {
        const result = calculateStateTax(income, 'NY', FilingStatus.SINGLE)
        expectCloseTo(result, expected)
      })
    })

    it('handles flat tax states correctly', () => {
      // States with flat tax rates
      const flatTaxStates = [
        { state: 'CO', rate: 0.0455 },
        { state: 'IL', rate: 0.0495 },
        { state: 'IN', rate: 0.0323 },
        { state: 'KY', rate: 0.05 },
        { state: 'MA', rate: 0.05 },
        { state: 'MI', rate: 0.0425 },
        { state: 'NC', rate: 0.0499 },
        { state: 'PA', rate: 0.0307 },
        { state: 'UT', rate: 0.0495 },
      ]

      const income = 100000

      flatTaxStates.forEach(({ state, rate }) => {
        const result = calculateStateTax(income, state)
        const expected = income * rate
        expectCloseTo(result, expected)
      })
    })

    it('applies different rates for different filing statuses', () => {
      const income = 150000
      const state = 'CA'

      const singleTax = calculateStateTax(income, state, FilingStatus.SINGLE)
      const marriedTax = calculateStateTax(income, state, FilingStatus.MARRIED_JOINTLY)

      // Married filing jointly typically has more favorable brackets
      expect(marriedTax).toBeLessThan(singleTax)
    })

    it('handles unknown state codes', () => {
      expect(() => calculateStateTax(100000, 'ZZ'))
        .toThrow('Unknown state code: ZZ')
    })
  })

  describe('calculateFICATax', () => {
    it('calculates Social Security tax correctly', () => {
      const testCases = [
        { income: 50000, expected: { socialSecurity: 3100, medicare: 725 } },
        { income: 100000, expected: { socialSecurity: 6200, medicare: 1450 } },
        { income: 147000, expected: { socialSecurity: 9114, medicare: 2131.50 } }, // 2022 cap
        { income: 200000, expected: { socialSecurity: 9114, medicare: 2900 } }, // Capped SS
        { income: 300000, expected: { socialSecurity: 9114, medicare: 4350 } },
      ]

      testCases.forEach(({ income, expected }) => {
        const result = calculateFICATax(income)
        expectCloseTo(result.socialSecurity, expected.socialSecurity)
        expectCloseTo(result.medicare, expected.medicare)
      })
    })

    it('applies Social Security wage cap', () => {
      const cap = 147000 // 2022 cap
      const rate = 0.062

      const belowCap = calculateFICATax(100000)
      const atCap = calculateFICATax(cap)
      const aboveCap = calculateFICATax(200000)

      expect(belowCap.socialSecurity).toBe(100000 * rate)
      expectCloseTo(atCap.socialSecurity, cap * rate)
      expectCloseTo(aboveCap.socialSecurity, cap * rate) // Same as at cap
    })

    it('applies additional Medicare tax for high earners', () => {
      const testCases = [
        { income: 150000, status: FilingStatus.SINGLE, additional: 0 },
        { income: 250000, status: FilingStatus.SINGLE, additional: 450 }, // (250k - 200k) * 0.009
        { income: 400000, status: FilingStatus.SINGLE, additional: 1800 }, // (400k - 200k) * 0.009
        { income: 200000, status: FilingStatus.MARRIED_JOINTLY, additional: 0 },
        { income: 300000, status: FilingStatus.MARRIED_JOINTLY, additional: 450 }, // (300k - 250k) * 0.009
      ]

      testCases.forEach(({ income, status, additional }) => {
        const result = calculateFICATax(income, status)
        expectCloseTo(result.additionalMedicare || 0, additional)
      })
    })

    it('calculates total FICA correctly', () => {
      const income = 300000
      const result = calculateFICATax(income, FilingStatus.SINGLE)
      
      const expectedTotal = result.socialSecurity + result.medicare + (result.additionalMedicare || 0)
      expect(result.total).toBe(expectedTotal)
    })
  })

  describe('calculateSelfEmploymentTax', () => {
    it('calculates self-employment tax correctly', () => {
      const testCases = [
        { income: 50000, expected: 7065 }, // 50000 * 0.9235 * 0.153
        { income: 100000, expected: 14130 },
        { income: 147000, expected: 19032.29 }, // With SS cap
        { income: 200000, expected: 21648.10 }, // Above SS cap
      ]

      testCases.forEach(({ income, expected }) => {
        const result = calculateSelfEmploymentTax(income)
        expectCloseTo(result.total, expected)
      })
    })

    it('applies 92.35% of income for SE tax calculation', () => {
      const income = 100000
      const result = calculateSelfEmploymentTax(income)
      
      const adjustedIncome = income * 0.9235
      const expectedSS = Math.min(adjustedIncome, 147000) * 0.124 // 12.4% for SS
      const expectedMedicare = adjustedIncome * 0.029 // 2.9% for Medicare
      
      expectCloseTo(result.socialSecurity, expectedSS)
      expectCloseTo(result.medicare, expectedMedicare)
    })

    it('includes additional Medicare tax for high earners', () => {
      const income = 300000
      const result = calculateSelfEmploymentTax(income, FilingStatus.SINGLE)
      
      const adjustedIncome = income * 0.9235
      const additionalThreshold = 200000
      const additionalTax = (adjustedIncome - additionalThreshold) * 0.009
      
      expectCloseTo(result.additionalMedicare || 0, additionalTax)
    })

    it('calculates deductible portion correctly', () => {
      const income = 100000
      const result = calculateSelfEmploymentTax(income)
      
      // Deductible portion is half of SE tax
      const expectedDeductible = result.total / 2
      expectCloseTo(result.deductiblePortion, expectedDeductible)
    })
  })

  describe('calculateQuarterlyEstimates', () => {
    it('calculates quarterly estimates for W-2 employee with side income', () => {
      const result = calculateQuarterlyEstimates({
        selfEmploymentIncome: 50000,
        w2Income: 100000,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        federalWithheld: 18000,
        stateWithheld: 6000,
      })

      expect(result.totalEstimatedTax).toBeGreaterThan(0)
      expect(result.quarterlyPayment).toBeCloseTo(result.totalEstimatedTax / 4)
      expect(result.paymentDates).toHaveLength(4)
    })

    it('calculates quarterly estimates for self-employed only', () => {
      const result = calculateQuarterlyEstimates({
        selfEmploymentIncome: 150000,
        w2Income: 0,
        filingStatus: FilingStatus.SINGLE,
        state: 'TX',
        federalWithheld: 0,
        stateWithheld: 0,
      })

      const seTax = calculateSelfEmploymentTax(150000)
      const adjustedIncome = 150000 - seTax.deductiblePortion
      const federalTax = calculateFederalTax(adjustedIncome, FilingStatus.SINGLE)
      const totalTax = federalTax + seTax.total // No state tax in TX

      expectCloseTo(result.totalEstimatedTax, totalTax)
    })

    it('accounts for withholdings already paid', () => {
      const result = calculateQuarterlyEstimates({
        selfEmploymentIncome: 30000,
        w2Income: 120000,
        filingStatus: FilingStatus.MARRIED_JOINTLY,
        state: 'NY',
        federalWithheld: 20000,
        stateWithheld: 7000,
      })

      // Should subtract withholdings from total tax liability
      expect(result.remainingTax).toBeLessThan(result.totalTaxLiability)
      expect(result.remainingTax).toBe(result.totalTaxLiability - 27000)
    })

    it('returns zero quarterly payment when withholdings exceed liability', () => {
      const result = calculateQuarterlyEstimates({
        selfEmploymentIncome: 10000,
        w2Income: 150000,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        federalWithheld: 40000, // Over-withheld
        stateWithheld: 15000,
      })

      expect(result.quarterlyPayment).toBe(0)
      expect(result.remainingTax).toBeLessThanOrEqual(0)
    })

    it('includes correct payment due dates', () => {
      const result = calculateQuarterlyEstimates({
        selfEmploymentIncome: 100000,
        w2Income: 0,
        filingStatus: FilingStatus.SINGLE,
        state: 'FL',
      })

      expect(result.paymentDates).toEqual([
        'April 15',
        'June 15',
        'September 15',
        'January 15 (next year)',
      ])
    })
  })

  describe('getTaxBracket', () => {
    it('returns correct tax bracket for different incomes', () => {
      const testCases = [
        { income: 15000, status: FilingStatus.SINGLE, expected: '10%' },
        { income: 35000, status: FilingStatus.SINGLE, expected: '12%' },
        { income: 85000, status: FilingStatus.SINGLE, expected: '22%' },
        { income: 165000, status: FilingStatus.SINGLE, expected: '24%' },
        { income: 210000, status: FilingStatus.SINGLE, expected: '32%' },
        { income: 540000, status: FilingStatus.SINGLE, expected: '35%' },
        { income: 700000, status: FilingStatus.SINGLE, expected: '37%' },
      ]

      testCases.forEach(({ income, status, expected }) => {
        const result = getTaxBracket(income, status)
        expect(result.rate).toBe(expected)
        expect(result.min).toBeLessThanOrEqual(income)
        expect(result.max === null || result.max > income).toBe(true)
      })
    })

    it('handles different filing statuses correctly', () => {
      const income = 200000

      const single = getTaxBracket(income, FilingStatus.SINGLE)
      const married = getTaxBracket(income, FilingStatus.MARRIED_JOINTLY)
      const head = getTaxBracket(income, FilingStatus.HEAD_OF_HOUSEHOLD)

      // Same income in different statuses may have different brackets
      expect(single.rate).toBe('32%')
      expect(married.rate).toBe('22%')
      expect(head.rate).toBe('24%')
    })

    it('accounts for standard deduction', () => {
      const income = 20000
      const bracket = getTaxBracket(income, FilingStatus.SINGLE)
      
      // After standard deduction, taxable income is very low
      expect(bracket.rate).toBe('10%')
    })
  })
})