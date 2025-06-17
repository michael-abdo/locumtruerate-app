import { 
  ContractCalculationEngine,
  PaycheckCalculationEngine,
  TaxCalculator,
  ContractType,
  PayPeriod,
  FilingStatus
} from '../../index'

describe('Edge case boundary testing', () => {
  const contractEngine = new ContractCalculationEngine()
  const paycheckEngine = new PaycheckCalculationEngine()
  const taxCalculator = new TaxCalculator()

  describe('Numeric boundary conditions', () => {
    it('handles zero hourly rate', () => {
      expect(() => {
        contractEngine.calculate({
          contractType: ContractType.HOURLY,
          hourlyRate: 0,
          hoursPerWeek: 40,
          duration: 13,
          location: 'CA',
        })
      }).toThrow('Hourly rate must be greater than 0')
    })

    it('handles negative hourly rate', () => {
      expect(() => {
        contractEngine.calculate({
          contractType: ContractType.HOURLY,
          hourlyRate: -50,
          hoursPerWeek: 40,
          duration: 13,
          location: 'CA',
        })
      }).toThrow('Hourly rate must be greater than 0')
    })

    it('handles extremely high hourly rate', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 10000, // $10,000/hour
        hoursPerWeek: 40,
        duration: 1,
        location: 'CA',
      })

      expect(result.grossPay).toBe(400000)
      expect(result.netPay).toBeLessThan(result.grossPay)
      expect(result.taxes.total).toBeGreaterThan(150000) // Very high tax
    })

    it('handles fractional hours', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 200,
        hoursPerWeek: 37.5, // 7.5 hours x 5 days
        duration: 13,
        location: 'TX',
      })

      expect(result.grossPay).toBe(200 * 37.5 * 13)
    })

    it('handles very small decimal amounts', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 100.01,
        hoursPerWeek: 40.25,
        duration: 12,
        location: 'FL',
      })

      expect(result.grossPay).toBeCloseTo(100.01 * 40.25 * 12, 2)
    })
  })

  describe('Time boundary conditions', () => {
    it('handles minimum contract duration (1 week)', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 1,
        location: 'NY',
      })

      expect(result.grossPay).toBe(12000)
      expect(result.weeklyRate).toBe(12000)
    })

    it('handles maximum realistic contract duration (2 years)', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 200,
        hoursPerWeek: 40,
        duration: 104, // 2 years
        location: 'CA',
      })

      expect(result.grossPay).toBe(832000)
      expect(result.annualEquivalent).toBe(416000)
    })

    it('handles leap year calculations', () => {
      // Test with a leap year scenario
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 100,
        hoursPerWeek: 40,
        duration: 52.14, // Leap year adjustment
        location: 'TX',
      })

      expect(result.grossPay).toBeCloseTo(208560, 0)
    })

    it('handles zero hours per week', () => {
      expect(() => {
        contractEngine.calculate({
          contractType: ContractType.HOURLY,
          hourlyRate: 200,
          hoursPerWeek: 0,
          duration: 13,
          location: 'CA',
        })
      }).toThrow('Hours per week must be greater than 0')
    })

    it('handles extreme hours per week (168 hours)', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 100,
        hoursPerWeek: 168, // All 168 hours in a week
        duration: 1,
        location: 'MT',
      })

      expect(result.grossPay).toBe(16800)
    })
  })

  describe('Tax calculation edge cases', () => {
    it('handles income exactly at tax bracket thresholds', () => {
      // Test at 2024 federal tax bracket boundaries
      const brackets = [11000, 44725, 95375, 197050, 365600, 731200]
      
      brackets.forEach(income => {
        const result = paycheckEngine.calculate({
          grossSalary: income,
          payPeriod: PayPeriod.MONTHLY,
          filingStatus: FilingStatus.SINGLE,
          state: 'TX', // No state tax to isolate federal
          allowances: 0,
        })

        expect(result.taxes.federal * 12).toBeGreaterThan(0)
        expect(result.netPay * 12).toBeLessThan(income)
      })
    })

    it('handles Social Security wage base threshold exactly', () => {
      const wageBase = 168600 // 2024 SS wage base
      
      const result = paycheckEngine.calculate({
        grossSalary: wageBase,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'FL',
        allowances: 0,
      })

      const annualSS = result.taxes.socialSecurity * 12
      expect(annualSS).toBeCloseTo(wageBase * 0.062, 1)
    })

    it('handles income just above Social Security wage base', () => {
      const income = 200000 // Above 2024 wage base
      
      const result = paycheckEngine.calculate({
        grossSalary: income,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'NV',
        allowances: 0,
      })

      const annualSS = result.taxes.socialSecurity * 12
      const maxSS = 168600 * 0.062
      expect(annualSS).toBeCloseTo(maxSS, 1)
    })

    it('handles Additional Medicare Tax threshold', () => {
      const income = 250000 // Above additional Medicare threshold for single
      
      const result = paycheckEngine.calculate({
        grossSalary: income,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'WA',
        allowances: 0,
      })

      expect(result.taxes.additionalMedicare).toBeGreaterThan(0)
      const annualAdditional = result.taxes.additionalMedicare * 12
      const expectedAdditional = (income - 200000) * 0.009
      expect(annualAdditional).toBeCloseTo(expectedAdditional, 0)
    })
  })

  describe('Deduction edge cases', () => {
    it('handles 401k contribution at IRS limit', () => {
      const result = paycheckEngine.calculate({
        grossSalary: 100000,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'TX',
        allowances: 0,
        prePostTaxDeductions: {
          retirement401k: 0.23, // 23% to hit $23,000 limit
        },
      })

      const annual401k = result.deductions.retirement401k * 12
      expect(annual401k).toBeCloseTo(23000, 0) // 2024 limit
    })

    it('handles 401k contribution above IRS limit', () => {
      const result = paycheckEngine.calculate({
        grossSalary: 200000,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
        prePostTaxDeductions: {
          retirement401k: 0.5, // 50% would exceed limit
        },
      })

      const annual401k = result.deductions.retirement401k * 12
      expect(annual401k).toBeLessThanOrEqual(23000) // Should be capped
    })

    it('handles HSA family vs individual limits', () => {
      const individualResult = paycheckEngine.calculate({
        grossSalary: 80000,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'FL',
        allowances: 0,
        prePostTaxDeductions: {
          hsa: 4150 / 12, // Individual limit
        },
      })

      const familyResult = paycheckEngine.calculate({
        grossSalary: 120000,
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
        state: 'FL',
        allowances: 2,
        prePostTaxDeductions: {
          hsa: 8300 / 12, // Family limit
        },
      })

      expect(individualResult.deductions.hsa * 12).toBeCloseTo(4150, 0)
      expect(familyResult.deductions.hsa * 12).toBeCloseTo(8300, 0)
    })
  })

  describe('State-specific edge cases', () => {
    it('handles states with no income tax', () => {
      const noTaxStates = ['AK', 'FL', 'NV', 'SD', 'TN', 'TX', 'WA', 'WY']
      
      noTaxStates.forEach(state => {
        const result = paycheckEngine.calculate({
          grossSalary: 100000,
          payPeriod: PayPeriod.MONTHLY,
          filingStatus: FilingStatus.SINGLE,
          state,
          allowances: 0,
        })

        expect(result.taxes.state).toBe(0)
      })
    })

    it('handles California high-income tax rates', () => {
      const result = paycheckEngine.calculate({
        grossSalary: 1000000, // High income to trigger top CA rate
        payPeriod: PayPeriod.MONTHLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
      })

      const annualStateTax = result.taxes.state * 12
      expect(annualStateTax).toBeGreaterThan(100000) // CA has high rates
    })

    it('handles New York with NYC local tax', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 52,
        location: 'New York, NY', // NYC
      })

      expect(result.taxes.local).toBeGreaterThan(0) // Should have NYC tax
    })
  })

  describe('Rounding and precision edge cases', () => {
    it('handles calculations resulting in exact cents', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 66.67, // Results in .01 calculations
        hoursPerWeek: 30,
        duration: 10,
        location: 'TX',
      })

      // Should round to nearest cent
      expect(result.grossPay % 0.01).toBeCloseTo(0, 2)
      expect(result.netPay % 0.01).toBeCloseTo(0, 2)
    })

    it('handles very precise decimal calculations', () => {
      const result = paycheckEngine.calculate({
        grossSalary: 77777.77,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.SINGLE,
        state: 'CA',
        allowances: 0,
        prePostTaxDeductions: {
          retirement401k: 0.033333, // 1/3 of 10%
        },
      })

      expect(result.grossPay).toBeCloseTo(77777.77 / 26, 2)
      expect(result.netPay).toBeGreaterThan(0)
    })

    it('maintains precision through complex calculations', () => {
      const input = {
        contractType: ContractType.HOURLY,
        hourlyRate: 123.456789,
        hoursPerWeek: 37.75,
        duration: 13.5,
        location: 'CA',
        overtime: {
          enabled: true,
          rate: 1.5,
          threshold: 35,
        },
      }

      const result = contractEngine.calculate(input)
      
      // Calculate expected manually for verification
      const regularHours = Math.min(input.hoursPerWeek, 35)
      const overtimeHours = Math.max(0, input.hoursPerWeek - 35)
      const weeklyRegular = regularHours * input.hourlyRate
      const weeklyOvertime = overtimeHours * input.hourlyRate * 1.5
      const weeklyTotal = weeklyRegular + weeklyOvertime
      const expectedGross = weeklyTotal * input.duration
      
      expect(result.grossPay).toBeCloseTo(expectedGross, 2)
    })
  })

  describe('Input validation edge cases', () => {
    it('handles invalid location codes gracefully', () => {
      expect(() => {
        contractEngine.calculate({
          contractType: ContractType.HOURLY,
          hourlyRate: 200,
          hoursPerWeek: 40,
          duration: 13,
          location: 'XX', // Invalid state code
        })
      }).toThrow('Invalid location')
    })

    it('handles missing required fields', () => {
      expect(() => {
        contractEngine.calculate({
          contractType: ContractType.HOURLY,
          // Missing hourlyRate
          hoursPerWeek: 40,
          duration: 13,
          location: 'CA',
        } as any)
      }).toThrow()
    })

    it('handles invalid contract types', () => {
      expect(() => {
        contractEngine.calculate({
          contractType: 'invalid' as ContractType,
          hourlyRate: 200,
          hoursPerWeek: 40,
          duration: 13,
          location: 'CA',
        })
      }).toThrow('Invalid contract type')
    })

    it('handles invalid pay periods', () => {
      expect(() => {
        paycheckEngine.calculate({
          grossSalary: 75000,
          payPeriod: 'invalid' as PayPeriod,
          filingStatus: FilingStatus.SINGLE,
          state: 'CA',
          allowances: 0,
        })
      }).toThrow('Invalid pay period')
    })
  })

  describe('Performance edge cases', () => {
    it('handles calculations with many deductions efficiently', () => {
      const start = performance.now()
      
      const result = paycheckEngine.calculate({
        grossSalary: 100000,
        payPeriod: PayPeriod.BIWEEKLY,
        filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
        state: 'CA',
        allowances: 3,
        prePostTaxDeductions: {
          retirement401k: 0.15,
          rothIRA: 0.05,
          healthInsurance: 500,
          dental: 50,
          vision: 25,
          fsa: 200,
          dependentCare: 400,
          commuter: 150,
          lifeInsurance: 100,
          disability: 75,
          hsa: 300,
          other: 50,
        },
        additionalWithholding: 100,
      })
      
      const end = performance.now()
      const duration = end - start
      
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
      expect(result.netPay).toBeGreaterThan(0)
    })

    it('handles bulk calculations efficiently', () => {
      const start = performance.now()
      
      const results = []
      for (let i = 0; i < 1000; i++) {
        results.push(contractEngine.calculate({
          contractType: ContractType.HOURLY,
          hourlyRate: 100 + i,
          hoursPerWeek: 40,
          duration: 13,
          location: 'TX',
        }))
      }
      
      const end = performance.now()
      const duration = end - start
      
      expect(duration).toBeLessThan(1000) // Should complete 1000 calculations in under 1 second
      expect(results).toHaveLength(1000)
      expect(results.every(r => r.grossPay > 0)).toBe(true)
    })
  })
})