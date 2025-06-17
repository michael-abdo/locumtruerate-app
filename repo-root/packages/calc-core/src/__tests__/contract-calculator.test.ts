import {
  calculateContract,
  calculateHourlyContract,
  calculateDailyContract,
  calculateMonthlyContract,
  ContractType,
  type ContractInput,
  type ContractResult,
} from '../contract-calculator'
import { TEST_CONTRACTS, expectCloseTo } from './setup'

describe('Contract Calculator', () => {
  describe('calculateContract', () => {
    it('calculates basic hourly contract correctly', () => {
      const input: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 12,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const result = calculateContract(input)

      expect(result.grossPay).toBe(96000) // 200 * 40 * 12
      expect(result.hourlyRate).toBe(200)
      expect(result.dailyRate).toBe(1600) // 200 * 8
      expect(result.weeklyRate).toBe(8000) // 200 * 40
      expect(result.monthlyRate).toBeCloseTo(34666.67, 2) // 96000 / 12 * 52/12
      expectCloseTo(result.netPay, 68813.50)
    })

    it('calculates daily contract correctly', () => {
      const input: ContractInput = {
        dailyRate: 1500,
        daysPerWeek: 5,
        duration: 8,
        location: 'TX',
        contractType: ContractType.DAILY,
      }

      const result = calculateContract(input)

      expect(result.grossPay).toBe(60000) // 1500 * 5 * 8
      expect(result.dailyRate).toBe(1500)
      expect(result.hourlyRate).toBe(187.5) // 1500 / 8
      expect(result.weeklyRate).toBe(7500) // 1500 * 5
      expectCloseTo(result.netPay, 45846)
    })

    it('calculates monthly contract correctly', () => {
      const input: ContractInput = {
        monthlyRate: 30000,
        duration: 6,
        location: 'NY',
        contractType: ContractType.MONTHLY,
      }

      const result = calculateContract(input)

      expect(result.grossPay).toBe(180000) // 30000 * 6
      expect(result.monthlyRate).toBe(30000)
      expectCloseTo(result.hourlyRate, 173.08) // Based on 173.33 hours/month
      expectCloseTo(result.dailyRate, 1384.62) // Based on 21.67 days/month
      expectCloseTo(result.weeklyRate, 6923.08) // monthlyRate * 12 / 52
      expectCloseTo(result.netPay, 125019.75)
    })

    it('handles overtime calculations', () => {
      const input: ContractInput = {
        hourlyRate: 150,
        hoursPerWeek: 50, // 10 hours overtime
        duration: 10,
        location: 'CA',
        contractType: ContractType.HOURLY,
        overtimeMultiplier: 1.5,
      }

      const result = calculateContract(input)

      // Regular: 150 * 40 * 10 = 60000
      // Overtime: 150 * 1.5 * 10 * 10 = 22500
      // Total: 82500
      expect(result.grossPay).toBe(82500)
      expect(result.breakdown.overtime).toBe(22500)
    })

    it('applies expenses correctly', () => {
      const input: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 12,
        location: 'CA',
        contractType: ContractType.HOURLY,
        expenses: {
          travel: 5000,
          housing: 12000,
          malpractice: 3000,
          other: 2000,
        },
      }

      const result = calculateContract(input)

      expect(result.grossPay).toBe(96000)
      expect(result.totalExpenses).toBe(22000)
      expect(result.breakdown.travel).toBe(5000)
      expect(result.breakdown.housing).toBe(12000)
      expect(result.breakdown.malpractice).toBe(3000)
      expect(result.breakdown.other).toBe(2000)
    })

    it('calculates benefits value correctly', () => {
      const input: ContractInput = {
        hourlyRate: 250,
        hoursPerWeek: 40,
        duration: 16,
        location: 'NY',
        contractType: ContractType.HOURLY,
        benefits: {
          health: 1500,
          dental: 100,
          vision: 50,
          retirement401k: 500,
          lifeInsurance: 75,
          disability: 125,
          other: 200,
        },
      }

      const result = calculateContract(input)

      // Monthly benefits total: 2550
      // Duration is 16 weeks = ~3.69 months
      expectCloseTo(result.benefitsValue, 9415.38)
    })

    it('handles zero tax states correctly', () => {
      const input: ContractInput = {
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 8,
        location: 'TX', // No state income tax
        contractType: ContractType.HOURLY,
      }

      const result = calculateContract(input)

      expect(result.taxes.state).toBe(0)
      expect(result.grossPay).toBe(96000)
      expectCloseTo(result.netPay, 73356) // Federal taxes and FICA only
    })

    it('validates negative input values', () => {
      const input: ContractInput = {
        hourlyRate: -100,
        hoursPerWeek: 40,
        duration: 12,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      expect(() => calculateContract(input)).toThrow('Invalid hourly rate')
    })

    it('validates excessive hours', () => {
      const input: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 120, // More than 168 hours in a week
        duration: 12,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      expect(() => calculateContract(input)).toThrow('Invalid hours per week')
    })

    it('handles edge case with very high income', () => {
      const input: ContractInput = {
        hourlyRate: 1000,
        hoursPerWeek: 60,
        duration: 52,
        location: 'CA',
        contractType: ContractType.HOURLY,
        overtimeMultiplier: 2.0,
      }

      const result = calculateContract(input)

      // Regular: 1000 * 40 * 52 = 2,080,000
      // Overtime: 1000 * 2.0 * 20 * 52 = 2,080,000
      // Total: 4,160,000
      expect(result.grossPay).toBe(4160000)
      expect(result.taxBracket).toContain('37%') // Top federal bracket
    })
  })

  describe('calculateHourlyContract', () => {
    it('calculates standard hourly contract', () => {
      const result = calculateHourlyContract(
        TEST_CONTRACTS.standard.hourlyRate,
        TEST_CONTRACTS.standard.hoursPerWeek,
        TEST_CONTRACTS.standard.weeks,
        TEST_CONTRACTS.standard.location
      )

      expect(result.grossPay).toBe(96000)
      expect(result.contractType).toBe(ContractType.HOURLY)
    })

    it('handles part-time hours correctly', () => {
      const result = calculateHourlyContract(300, 20, 8, 'FL')

      expect(result.grossPay).toBe(48000)
      expect(result.weeklyRate).toBe(6000)
      expect(result.dailyRate).toBe(1200) // Assumes 5 days/week
    })
  })

  describe('calculateDailyContract', () => {
    it('calculates standard daily contract', () => {
      const result = calculateDailyContract(1200, 5, 10, 'CA')

      expect(result.grossPay).toBe(60000)
      expect(result.contractType).toBe(ContractType.DAILY)
      expect(result.hourlyRate).toBe(150) // 1200 / 8
    })

    it('handles partial week contracts', () => {
      const result = calculateDailyContract(1500, 3, 12, 'NY')

      expect(result.grossPay).toBe(54000)
      expect(result.weeklyRate).toBe(4500)
    })
  })

  describe('calculateMonthlyContract', () => {
    it('calculates standard monthly contract', () => {
      const result = calculateMonthlyContract(25000, 3, 'WA')

      expect(result.grossPay).toBe(75000)
      expect(result.contractType).toBe(ContractType.MONTHLY)
      expectCloseTo(result.annualEquivalent, 300000)
    })

    it('converts monthly to other rates correctly', () => {
      const result = calculateMonthlyContract(40000, 6, 'TX')

      expectCloseTo(result.hourlyRate, 230.77) // 40000 / 173.33
      expectCloseTo(result.dailyRate, 1846.15) // 40000 / 21.67
      expectCloseTo(result.weeklyRate, 9230.77) // 40000 * 12 / 52
    })
  })

  describe('Tax Calculations', () => {
    const testCases = [
      { gross: 50000, location: 'TX', expectedNet: 41871 },
      { gross: 100000, location: 'CA', expectedNet: 71626.50 },
      { gross: 200000, location: 'NY', expectedNet: 134039.50 },
      { gross: 500000, location: 'CA', expectedNet: 295801.50 },
    ]

    testCases.forEach(({ gross, location, expectedNet }) => {
      it(`calculates taxes correctly for $${gross.toLocaleString()} in ${location}`, () => {
        const weeks = 52
        const hourlyRate = gross / (40 * weeks)
        
        const input: ContractInput = {
          hourlyRate,
          hoursPerWeek: 40,
          duration: weeks,
          location,
          contractType: ContractType.HOURLY,
        }

        const result = calculateContract(input)
        expectCloseTo(result.netPay, expectedNet)
      })
    })
  })

  describe('Effective Rate Calculations', () => {
    it('calculates effective hourly rate with benefits', () => {
      const input: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 12,
        location: 'CA',
        contractType: ContractType.HOURLY,
        benefits: {
          health: 1200,
          retirement401k: 800,
        },
      }

      const result = calculateContract(input)
      
      // Total value includes benefits
      const totalHours = 40 * 12
      const expectedEffectiveRate = (result.grossPay + result.benefitsValue) / totalHours
      expectCloseTo(result.effectiveHourlyRate, expectedEffectiveRate)
    })

    it('calculates effective rate with expenses deducted', () => {
      const input: ContractInput = {
        hourlyRate: 250,
        hoursPerWeek: 40,
        duration: 8,
        location: 'TX',
        contractType: ContractType.HOURLY,
        expenses: {
          travel: 3000,
          housing: 8000,
        },
      }

      const result = calculateContract(input)
      
      const totalHours = 40 * 8
      const netValue = result.netPay - result.totalExpenses
      const expectedNetHourlyRate = netValue / totalHours
      expectCloseTo(result.netHourlyRate, expectedNetHourlyRate)
    })
  })

  describe('Comparison Calculations', () => {
    it('compares two contracts correctly', () => {
      const contract1: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 12,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const contract2: ContractInput = {
        hourlyRate: 180,
        hoursPerWeek: 40,
        duration: 12,
        location: 'TX', // No state tax
        contractType: ContractType.HOURLY,
        benefits: {
          health: 1500,
          retirement401k: 1000,
        },
      }

      const result1 = calculateContract(contract1)
      const result2 = calculateContract(contract2)

      // Contract 1: Higher gross but higher taxes
      expect(result1.grossPay).toBeGreaterThan(result2.grossPay)
      
      // Contract 2: Lower gross but no state tax and benefits
      const totalValue1 = result1.netPay
      const totalValue2 = result2.netPay + result2.benefitsValue
      
      // Contract 2 might be better when considering benefits and taxes
      expect(totalValue2).toBeCloseTo(totalValue1, -2) // Within $100
    })
  })

  describe('Annualized Calculations', () => {
    it('annualizes short-term contracts correctly', () => {
      const input: ContractInput = {
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 8, // 8 weeks
        location: 'NY',
        contractType: ContractType.HOURLY,
      }

      const result = calculateContract(input)
      
      expect(result.grossPay).toBe(96000) // Actual for 8 weeks
      expect(result.annualEquivalent).toBe(624000) // Annualized (52 weeks)
    })

    it('handles contracts longer than a year', () => {
      const input: ContractInput = {
        monthlyRate: 30000,
        duration: 18, // 18 months
        location: 'CA',
        contractType: ContractType.MONTHLY,
      }

      const result = calculateContract(input)
      
      expect(result.grossPay).toBe(540000) // 30000 * 18
      expect(result.annualEquivalent).toBe(360000) // 30000 * 12
    })
  })
})