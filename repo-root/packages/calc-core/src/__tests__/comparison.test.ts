import {
  compareContracts,
  comparePaychecks,
  findOptimalContract,
  analyzeBreakEven,
  type ComparisonResult,
  type OptimizationResult,
} from '../comparison'
import { ContractType, type ContractInput } from '../contract-calculator'
import { PayPeriod, FilingStatus, type PaycheckInput } from '../paycheck-calculator'
import { expectCloseTo } from './setup'

describe('Comparison Functions', () => {
  describe('compareContracts', () => {
    it('compares two contracts with different locations', () => {
      const contractA: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 12,
        location: 'CA', // High tax state
        contractType: ContractType.HOURLY,
      }

      const contractB: ContractInput = {
        hourlyRate: 185,
        hoursPerWeek: 40,
        duration: 12,
        location: 'TX', // No state tax
        contractType: ContractType.HOURLY,
      }

      const result = compareContracts([contractA, contractB])

      expect(result.contracts).toHaveLength(2)
      expect(result.contracts[0].grossPay).toBe(96000)
      expect(result.contracts[1].grossPay).toBe(88800)
      
      // Despite lower gross, TX contract might have higher net
      expect(result.winner.index).toBe(0) // CA still wins due to higher gross
      expect(result.winner.reason).toContain('highest net pay')
    })

    it('compares contracts with different benefits', () => {
      const contractA: ContractInput = {
        hourlyRate: 250,
        hoursPerWeek: 40,
        duration: 16,
        location: 'NY',
        contractType: ContractType.HOURLY,
      }

      const contractB: ContractInput = {
        hourlyRate: 230,
        hoursPerWeek: 40,
        duration: 16,
        location: 'NY',
        contractType: ContractType.HOURLY,
        benefits: {
          health: 1500,
          retirement401k: 1000,
          dental: 100,
          vision: 50,
        },
      }

      const result = compareContracts([contractA, contractB])

      // Contract B has lower gross but significant benefits
      const totalValueA = result.contracts[0].netPay
      const totalValueB = result.contracts[1].netPay + result.contracts[1].benefitsValue

      expect(result.analysis.bestForTotalValue).toBe(
        totalValueA > totalValueB ? 0 : 1
      )
    })

    it('compares contracts with different durations', () => {
      const shortContract: ContractInput = {
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 8,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const longContract: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 26,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const result = compareContracts([shortContract, longContract])

      expect(result.analysis.bestHourlyRate).toBe(0) // Short contract
      expect(result.analysis.bestAnnualized).toBe(0) // Higher hourly = higher annual
      
      // Long contract has more total earnings
      expect(result.contracts[1].grossPay).toBeGreaterThan(result.contracts[0].grossPay)
    })

    it('identifies best contract for different criteria', () => {
      const contracts: ContractInput[] = [
        {
          hourlyRate: 250,
          hoursPerWeek: 50, // Overtime
          duration: 12,
          location: 'CA',
          contractType: ContractType.HOURLY,
          overtimeMultiplier: 1.5,
        },
        {
          hourlyRate: 280,
          hoursPerWeek: 40,
          duration: 12,
          location: 'TX',
          contractType: ContractType.HOURLY,
        },
        {
          monthlyRate: 45000,
          duration: 3,
          location: 'FL',
          contractType: ContractType.MONTHLY,
          benefits: {
            health: 2000,
            retirement401k: 1500,
          },
        },
      ]

      const result = compareContracts(contracts)

      expect(result.analysis.bestGrossPay).toBeDefined()
      expect(result.analysis.bestNetPay).toBeDefined()
      expect(result.analysis.bestHourlyRate).toBeDefined()
      expect(result.analysis.bestTaxEfficiency).toBeDefined()
      expect(result.analysis.bestForTotalValue).toBeDefined()
    })

    it('calculates differences between contracts', () => {
      const contractA: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 12,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const contractB: ContractInput = {
        hourlyRate: 220,
        hoursPerWeek: 40,
        duration: 12,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const result = compareContracts([contractA, contractB])

      expect(result.differences).toBeDefined()
      expect(result.differences[0]).toEqual({
        from: 0,
        to: 1,
        grossDiff: 9600, // 20 * 40 * 12
        netDiff: expect.any(Number),
        percentDiff: 10, // 10% increase
      })
    })

    it('handles empty contract list', () => {
      expect(() => compareContracts([])).toThrow('At least one contract required')
    })

    it('handles single contract', () => {
      const contract: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 12,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const result = compareContracts([contract])

      expect(result.contracts).toHaveLength(1)
      expect(result.winner.index).toBe(0)
      expect(result.differences).toHaveLength(0)
    })
  })

  describe('comparePaychecks', () => {
    it('compares paychecks with different deductions', () => {
      const paycheckA: PaycheckInput = {
        grossSalary: 120000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
      }

      const paycheckB: PaycheckInput = {
        grossSalary: 120000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
        preTaxDeductions: {
          retirement401k: 500,
          healthInsurance: 200,
          fsa: 100,
        },
      }

      const result = comparePaychecks([paycheckA, paycheckB])

      // Paycheck B has lower taxable income due to pre-tax deductions
      expect(result.paychecks[1].taxableIncome).toBeLessThan(result.paychecks[0].taxableIncome)
      expect(result.paychecks[1].taxes.federal).toBeLessThan(result.paychecks[0].taxes.federal)
    })

    it('compares different filing statuses', () => {
      const singlePaycheck: PaycheckInput = {
        grossSalary: 150000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'NY',
        allowances: 0,
      }

      const marriedPaycheck: PaycheckInput = {
        grossSalary: 150000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.MARRIED_JOINTLY,
        state: 'NY',
        allowances: 0,
      }

      const result = comparePaychecks([singlePaycheck, marriedPaycheck])

      expect(result.analysis.lowestTaxRate).toBe(1) // Married
      expect(result.paychecks[1].effectiveTaxRate).toBeLessThan(
        result.paychecks[0].effectiveTaxRate
      )
    })

    it('compares different states', () => {
      const basePaycheck: PaycheckInput = {
        grossSalary: 100000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        allowances: 0,
      }

      const caPaycheck = { ...basePaycheck, state: 'CA' }
      const txPaycheck = { ...basePaycheck, state: 'TX' }
      const nyPaycheck = { ...basePaycheck, state: 'NY' }

      const result = comparePaychecks([caPaycheck, txPaycheck, nyPaycheck])

      // Texas should have highest net pay (no state tax)
      expect(result.analysis.highestNetPay).toBe(1)
      expect(result.paychecks[1].taxes.state).toBe(0)
    })

    it('analyzes annual projections', () => {
      const paychecks: PaycheckInput[] = [
        {
          grossSalary: 80000,
          payPeriod: PayPeriod.WEEKLY,
          filingStatus: FilingStatus.SINGLE,
          state: 'FL',
          allowances: 2,
        },
        {
          grossSalary: 80000,
          payPeriod: PayPeriod.BIWEEKLY,
          filingStatus: FilingStatus.SINGLE,
          state: 'FL',
          allowances: 2,
        },
        {
          grossSalary: 80000,
          payPeriod: PayPeriod.MONTHLY,
          filingStatus: FilingStatus.SINGLE,
          state: 'FL',
          allowances: 2,
        },
      ]

      const result = comparePaychecks(paychecks)

      // All should have same annual gross
      expect(result.paychecks[0].annualProjection.gross).toBe(80000)
      expect(result.paychecks[1].annualProjection.gross).toBe(80000)
      expect(result.paychecks[2].annualProjection.gross).toBe(80000)

      // But different per-period amounts
      expectCloseTo(result.paychecks[0].grossPay, 1538.46) // Weekly
      expectCloseTo(result.paychecks[1].grossPay, 3076.92) // Biweekly
      expectCloseTo(result.paychecks[2].grossPay, 6666.67) // Monthly
    })
  })

  describe('findOptimalContract', () => {
    it('finds optimal contract based on constraints', () => {
      const contracts: ContractInput[] = [
        {
          hourlyRate: 180,
          hoursPerWeek: 40,
          duration: 16,
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
        {
          hourlyRate: 200,
          hoursPerWeek: 50, // More hours
          duration: 12,
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
        {
          hourlyRate: 250,
          hoursPerWeek: 30, // Part time
          duration: 20,
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
      ]

      const result = findOptimalContract(contracts, {
        maxHoursPerWeek: 40,
        minHourlyRate: 190,
        preferredLocation: 'CA',
      })

      // Only contract 3 meets the min hourly rate and max hours constraints
      expect(result.optimal).toBe(2)
      expect(result.meetsAllConstraints).toBe(true)
    })

    it('handles no contracts meeting constraints', () => {
      const contracts: ContractInput[] = [
        {
          hourlyRate: 150,
          hoursPerWeek: 40,
          duration: 12,
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
        {
          hourlyRate: 160,
          hoursPerWeek: 45,
          duration: 12,
          location: 'NY',
          contractType: ContractType.HOURLY,
        },
      ]

      const result = findOptimalContract(contracts, {
        minHourlyRate: 200, // Neither contract meets this
        preferredLocation: 'TX',
      })

      expect(result.meetsAllConstraints).toBe(false)
      expect(result.optimal).toBe(1) // Best available despite not meeting constraints
    })

    it('prioritizes preferred location', () => {
      const contracts: ContractInput[] = [
        {
          hourlyRate: 220,
          hoursPerWeek: 40,
          duration: 12,
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
        {
          hourlyRate: 210,
          hoursPerWeek: 40,
          duration: 12,
          location: 'TX',
          contractType: ContractType.HOURLY,
        },
      ]

      const result = findOptimalContract(contracts, {
        preferredLocation: 'TX',
        minNetPay: 50000,
      })

      expect(result.optimal).toBe(1) // TX contract despite lower rate
      expect(result.analysis.locationMatch).toContain(1)
    })

    it('optimizes for minimum net pay requirement', () => {
      const contracts: ContractInput[] = [
        {
          hourlyRate: 150,
          hoursPerWeek: 30,
          duration: 12,
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
        {
          hourlyRate: 120,
          hoursPerWeek: 50,
          duration: 12,
          location: 'TX',
          contractType: ContractType.HOURLY,
        },
      ]

      const result = findOptimalContract(contracts, {
        minNetPay: 60000,
      })

      // Contract 2 has higher gross despite lower hourly rate
      expect(result.contracts[result.optimal].netPay).toBeGreaterThan(60000)
    })

    it('considers benefits in optimization', () => {
      const contracts: ContractInput[] = [
        {
          hourlyRate: 200,
          hoursPerWeek: 40,
          duration: 12,
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
        {
          hourlyRate: 185,
          hoursPerWeek: 40,
          duration: 12,
          location: 'CA',
          contractType: ContractType.HOURLY,
          benefits: {
            health: 1800,
            retirement401k: 1200,
            dental: 150,
            vision: 50,
          },
        },
      ]

      const result = findOptimalContract(contracts, {
        requireBenefits: true,
      })

      expect(result.optimal).toBe(1) // Contract with benefits
      expect(result.analysis.hasBenefits).toContain(1)
    })

    it('handles duration constraints', () => {
      const contracts: ContractInput[] = [
        {
          hourlyRate: 250,
          hoursPerWeek: 40,
          duration: 4, // Too short
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
        {
          hourlyRate: 200,
          hoursPerWeek: 40,
          duration: 12, // Just right
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
        {
          hourlyRate: 300,
          hoursPerWeek: 40,
          duration: 52, // Too long
          location: 'CA',
          contractType: ContractType.HOURLY,
        },
      ]

      const result = findOptimalContract(contracts, {
        minDuration: 8,
        maxDuration: 26,
      })

      expect(result.optimal).toBe(1) // Only contract 2 meets duration constraints
      expect(result.analysis.durationMatch).toContain(1)
    })
  })

  describe('analyzeBreakEven', () => {
    it('calculates break-even point between two contracts', () => {
      const currentContract: ContractInput = {
        hourlyRate: 180,
        hoursPerWeek: 40,
        duration: 52,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const newContract: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 26, // 6 months
        location: 'NY',
        contractType: ContractType.HOURLY,
        expenses: {
          travel: 5000,
          housing: 15000, // Relocation costs
        },
      }

      const result = analyzeBreakEven(currentContract, newContract)

      expect(result.weeksToBreakEven).toBeGreaterThan(0)
      expect(result.worthSwitching).toBeDefined()
      expect(result.additionalEarnings).toBeDefined()
    })

    it('accounts for switching costs', () => {
      const current: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 52,
        location: 'TX',
        contractType: ContractType.HOURLY,
      }

      const newOffer: ContractInput = {
        hourlyRate: 220,
        hoursPerWeek: 40,
        duration: 52,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const result = analyzeBreakEven(current, newOffer, {
        switchingCosts: 10000, // Moving expenses, lost time, etc.
      })

      // Need to earn back the switching costs
      expect(result.weeksToBreakEven).toBeGreaterThan(10)
      expect(result.netBenefit).toBeLessThan(result.additionalEarnings)
    })

    it('considers opportunity cost', () => {
      const current: ContractInput = {
        hourlyRate: 250,
        hoursPerWeek: 40,
        duration: 52,
        location: 'CA',
        contractType: ContractType.HOURLY,
        benefits: {
          health: 2000,
          retirement401k: 1500,
        },
      }

      const newOffer: ContractInput = {
        hourlyRate: 280,
        hoursPerWeek: 40,
        duration: 52,
        location: 'CA',
        contractType: ContractType.HOURLY,
        // No benefits
      }

      const result = analyzeBreakEven(current, newOffer, {
        weeksLostDuringSwitching: 2,
      })

      // Lost income during switch affects break-even
      expect(result.opportunityCost).toBeGreaterThan(0)
      expect(result.totalSwitchingCost).toInclude(result.opportunityCost)
    })

    it('determines when not worth switching', () => {
      const current: ContractInput = {
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 52,
        location: 'TX', // No state tax
        contractType: ContractType.HOURLY,
        benefits: {
          health: 2500,
          retirement401k: 2000,
        },
      }

      const newOffer: ContractInput = {
        hourlyRate: 310,
        hoursPerWeek: 40,
        duration: 13, // Only 3 months
        location: 'CA', // High state tax
        contractType: ContractType.HOURLY,
      }

      const result = analyzeBreakEven(current, newOffer, {
        switchingCosts: 5000,
      })

      expect(result.worthSwitching).toBe(false)
      expect(result.reason).toContain('insufficient duration')
    })

    it('analyzes long-term benefits', () => {
      const current: ContractInput = {
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 52,
        location: 'CA',
        contractType: ContractType.HOURLY,
      }

      const newOffer: ContractInput = {
        hourlyRate: 180, // Lower rate
        hoursPerWeek: 40,
        duration: 52,
        location: 'TX', // But no state tax
        contractType: ContractType.HOURLY,
        benefits: {
          health: 2000,
          retirement401k: 1500,
          dental: 100,
          vision: 50,
        },
      }

      const result = analyzeBreakEven(current, newOffer)

      // Lower gross but better net + benefits might make it worthwhile
      expect(result.projectedAnnualBenefit).toBeDefined()
      expect(result.considerations).toContain('tax advantages')
    })
  })
})