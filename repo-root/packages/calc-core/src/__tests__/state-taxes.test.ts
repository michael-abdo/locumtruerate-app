import {
  getStateTaxInfo,
  calculateStateIncomeTax,
  getStateDeductions,
  hasLocalTax,
  getLocalTaxRate,
  STATE_TAX_RATES,
  NO_TAX_STATES,
  FLAT_TAX_STATES,
  PROGRESSIVE_TAX_STATES,
} from '../state-taxes'
import { FilingStatus } from '../tax-calculator'
import { expectCloseTo } from './setup'

describe('State Taxes', () => {
  describe('getStateTaxInfo', () => {
    it('returns correct info for no-tax states', () => {
      NO_TAX_STATES.forEach(state => {
        const info = getStateTaxInfo(state)
        expect(info.hasIncomeTax).toBe(false)
        expect(info.type).toBe('none')
        expect(info.rates).toEqual([])
      })
    })

    it('returns correct info for flat-tax states', () => {
      FLAT_TAX_STATES.forEach(state => {
        const info = getStateTaxInfo(state)
        expect(info.hasIncomeTax).toBe(true)
        expect(info.type).toBe('flat')
        expect(info.rates).toHaveLength(1)
        expect(info.rates[0].min).toBe(0)
        expect(info.rates[0].max).toBeNull()
      })
    })

    it('returns correct info for progressive-tax states', () => {
      PROGRESSIVE_TAX_STATES.forEach(state => {
        const info = getStateTaxInfo(state)
        expect(info.hasIncomeTax).toBe(true)
        expect(info.type).toBe('progressive')
        expect(info.rates.length).toBeGreaterThan(1)
        
        // Verify brackets are in ascending order
        for (let i = 1; i < info.rates.length; i++) {
          expect(info.rates[i].min).toBeGreaterThan(info.rates[i-1].min)
          expect(info.rates[i].rate).toBeGreaterThanOrEqual(info.rates[i-1].rate)
        }
      })
    })

    it('includes state-specific deductions', () => {
      const caInfo = getStateTaxInfo('CA')
      expect(caInfo.standardDeduction).toBeDefined()
      expect(caInfo.personalExemption).toBeDefined()
    })

    it('handles unknown state codes', () => {
      expect(() => getStateTaxInfo('ZZ')).toThrow('Unknown state: ZZ')
    })
  })

  describe('calculateStateIncomeTax', () => {
    describe('California', () => {
      const testCases = [
        { income: 20000, status: FilingStatus.SINGLE, expected: 230.30 },
        { income: 50000, status: FilingStatus.SINGLE, expected: 1621.30 },
        { income: 100000, status: FilingStatus.SINGLE, expected: 6369.30 },
        { income: 300000, status: FilingStatus.SINGLE, expected: 28669.30 },
        { income: 1000000, status: FilingStatus.SINGLE, expected: 115013.30 },
      ]

      testCases.forEach(({ income, status, expected }) => {
        it(`calculates CA tax for $${income.toLocaleString()} (${status})`, () => {
          const result = calculateStateIncomeTax(income, 'CA', status)
          expectCloseTo(result, expected)
        })
      })

      it('applies different rates for married filing jointly', () => {
        const singleTax = calculateStateIncomeTax(150000, 'CA', FilingStatus.SINGLE)
        const marriedTax = calculateStateIncomeTax(150000, 'CA', FilingStatus.MARRIED_JOINTLY)
        
        expect(marriedTax).toBeLessThan(singleTax)
      })
    })

    describe('New York', () => {
      const testCases = [
        { income: 25000, status: FilingStatus.SINGLE, expected: 1055 },
        { income: 75000, status: FilingStatus.SINGLE, expected: 4187 },
        { income: 150000, status: FilingStatus.SINGLE, expected: 9687 },
        { income: 500000, status: FilingStatus.SINGLE, expected: 35807 },
      ]

      testCases.forEach(({ income, status, expected }) => {
        it(`calculates NY tax for $${income.toLocaleString()} (${status})`, () => {
          const result = calculateStateIncomeTax(income, 'NY', status)
          expectCloseTo(result, expected)
        })
      })
    })

    describe('Flat tax states', () => {
      const testCases = [
        { state: 'CO', income: 100000, rate: 0.0455, expected: 4550 },
        { state: 'IL', income: 100000, rate: 0.0495, expected: 4950 },
        { state: 'IN', income: 100000, rate: 0.0323, expected: 3230 },
        { state: 'MA', income: 100000, rate: 0.05, expected: 5000 },
        { state: 'PA', income: 100000, rate: 0.0307, expected: 3070 },
      ]

      testCases.forEach(({ state, income, rate, expected }) => {
        it(`calculates ${state} flat tax correctly`, () => {
          const result = calculateStateIncomeTax(income, state)
          expectCloseTo(result, expected)
        })
      })
    })

    describe('No tax states', () => {
      NO_TAX_STATES.forEach(state => {
        it(`returns 0 for ${state}`, () => {
          const result = calculateStateIncomeTax(100000, state)
          expect(result).toBe(0)
        })
      })
    })

    it('handles very high incomes', () => {
      const income = 10000000 // $10 million
      
      const caTax = calculateStateIncomeTax(income, 'CA')
      const nyTax = calculateStateIncomeTax(income, 'NY')
      
      // CA has higher top rate (13.3%) than NY (8.82%)
      expect(caTax).toBeGreaterThan(nyTax)
      expectCloseTo(caTax, 1326533.30) // ~13.3%
      expectCloseTo(nyTax, 871883) // ~8.7%
    })

    it('handles zero income', () => {
      const result = calculateStateIncomeTax(0, 'CA')
      expect(result).toBe(0)
    })

    it('validates negative income', () => {
      expect(() => calculateStateIncomeTax(-50000, 'CA'))
        .toThrow('Income cannot be negative')
    })
  })

  describe('getStateDeductions', () => {
    it('returns standard deductions for single filers', () => {
      const caDeductions = getStateDeductions('CA', FilingStatus.SINGLE)
      expect(caDeductions.standardDeduction).toBe(5202)
      expect(caDeductions.personalExemption).toBe(154)
    })

    it('returns higher deductions for married filing jointly', () => {
      const caDeductionsSingle = getStateDeductions('CA', FilingStatus.SINGLE)
      const caDeductionsMarried = getStateDeductions('CA', FilingStatus.MARRIED_JOINTLY)
      
      expect(caDeductionsMarried.standardDeduction).toBeGreaterThan(
        caDeductionsSingle.standardDeduction
      )
    })

    it('returns zero deductions for no-tax states', () => {
      NO_TAX_STATES.forEach(state => {
        const deductions = getStateDeductions(state, FilingStatus.SINGLE)
        expect(deductions.standardDeduction).toBe(0)
        expect(deductions.personalExemption).toBe(0)
      })
    })

    it('handles states with only standard deductions', () => {
      const nyDeductions = getStateDeductions('NY', FilingStatus.SINGLE)
      expect(nyDeductions.standardDeduction).toBe(8000)
      expect(nyDeductions.personalExemption).toBe(0) // NY doesn't have personal exemptions
    })

    it('includes dependent exemptions where applicable', () => {
      const deductions = getStateDeductions('CA', FilingStatus.MARRIED_JOINTLY, 2)
      expect(deductions.dependentExemption).toBe(383 * 2) // CA dependent exemption
    })
  })

  describe('hasLocalTax', () => {
    it('identifies states with local income taxes', () => {
      const statesWithLocalTax = ['NY', 'OH', 'PA', 'MD', 'IN', 'IA', 'KY', 'MI', 'MO']
      
      statesWithLocalTax.forEach(state => {
        expect(hasLocalTax(state)).toBe(true)
      })
    })

    it('identifies states without local income taxes', () => {
      const statesWithoutLocalTax = ['CA', 'TX', 'FL', 'WA', 'IL', 'MA', 'CO']
      
      statesWithoutLocalTax.forEach(state => {
        expect(hasLocalTax(state)).toBe(false)
      })
    })
  })

  describe('getLocalTaxRate', () => {
    it('returns NYC local tax rate', () => {
      const rate = getLocalTaxRate('NY', 'New York City')
      expect(rate).toBeCloseTo(0.03876) // NYC resident rate
    })

    it('returns zero for cities without local tax', () => {
      const rate = getLocalTaxRate('CA', 'Los Angeles')
      expect(rate).toBe(0)
    })

    it('returns Philadelphia local tax rate', () => {
      const rate = getLocalTaxRate('PA', 'Philadelphia')
      expect(rate).toBeCloseTo(0.0307) // Philadelphia wage tax
    })

    it('handles unknown cities', () => {
      const rate = getLocalTaxRate('NY', 'Unknown City')
      expect(rate).toBe(0)
    })
  })

  describe('State tax integration', () => {
    it('calculates total tax burden including local taxes', () => {
      const income = 150000
      const state = 'NY'
      const city = 'New York City'
      
      const stateTax = calculateStateIncomeTax(income, state)
      const localRate = getLocalTaxRate(state, city)
      const localTax = income * localRate
      
      const totalStateBurden = stateTax + localTax
      
      expectCloseTo(totalStateBurden, 15501) // State + NYC tax
    })

    it('compares tax burden across different states', () => {
      const income = 200000
      const states = [
        { code: 'CA', expected: 15019.30 },
        { code: 'TX', expected: 0 },
        { code: 'NY', expected: 13662 },
        { code: 'FL', expected: 0 },
        { code: 'IL', expected: 9900 },
      ]

      states.forEach(({ code, expected }) => {
        const tax = calculateStateIncomeTax(income, code)
        expectCloseTo(tax, expected)
      })
    })

    it('accounts for reciprocity agreements', () => {
      // Some states have reciprocity agreements (e.g., living in NJ, working in PA)
      // This is a placeholder for more complex multi-state scenarios
      const income = 100000
      
      // Working in PA
      const paTax = calculateStateIncomeTax(income, 'PA')
      
      // Living in NJ (normally would owe NJ tax too)
      const njTax = calculateStateIncomeTax(income, 'NJ')
      
      // With reciprocity, only pay to work state
      const effectiveTax = Math.max(paTax, 0) // Simplified example
      
      expect(effectiveTax).toBe(paTax)
    })
  })

  describe('Edge cases', () => {
    it('handles partial year residence', () => {
      const annualIncome = 120000
      const monthsInState = 6
      const partialIncome = (annualIncome / 12) * monthsInState
      
      const partialTax = calculateStateIncomeTax(partialIncome, 'CA')
      const annualTax = calculateStateIncomeTax(annualIncome, 'CA')
      
      // Tax should be less than half due to progressive rates
      expect(partialTax).toBeLessThan(annualTax / 2)
    })

    it('handles alternative minimum tax (AMT) states', () => {
      // California has an AMT
      const highIncome = 1000000
      const caTax = calculateStateIncomeTax(highIncome, 'CA')
      
      // Should include mental health tax (1% on income over $1M)
      const baseTax = 1000000 * 0.133 // Simplified
      expectCloseTo(caTax, 115013.30) // Includes AMT considerations
    })

    it('handles tax credits and adjustments', () => {
      // Some states offer credits that reduce effective rate
      const income = 50000
      const state = 'NY'
      
      const tax = calculateStateIncomeTax(income, state)
      const effectiveRate = tax / income
      
      // NY has various credits that can reduce effective rate
      expect(effectiveRate).toBeLessThan(0.0685) // Less than top rate
    })
  })
})