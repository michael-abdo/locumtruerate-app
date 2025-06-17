import { 
  ContractCalculationEngine,
  PaycheckCalculationEngine,
  ContractType,
  PayPeriod,
  FilingStatus
} from '../../index'

// Healthcare-specific validation scenarios
describe('Healthcare industry validation', () => {
  const contractEngine = new ContractCalculationEngine()
  const paycheckEngine = new PaycheckCalculationEngine()

  describe('Physician specialties', () => {
    const specialtyData = [
      {
        specialty: 'Emergency Medicine',
        avgHourlyRate: 275,
        typicalSchedule: { hoursPerWeek: 36, pattern: '3x12 hour shifts' },
        locations: ['CA', 'TX', 'FL', 'NY'],
        expectedAnnual: { min: 350000, max: 450000 },
      },
      {
        specialty: 'Critical Care',
        avgHourlyRate: 350,
        typicalSchedule: { hoursPerWeek: 40, pattern: '7 on/7 off' },
        locations: ['CA', 'NY', 'MA'],
        expectedAnnual: { min: 400000, max: 550000 },
      },
      {
        specialty: 'Anesthesiology',
        avgHourlyRate: 400,
        typicalSchedule: { hoursPerWeek: 40, pattern: 'Standard OR schedule' },
        locations: ['CA', 'TX', 'NY'],
        expectedAnnual: { min: 450000, max: 650000 },
      },
      {
        specialty: 'Radiology',
        avgHourlyRate: 300,
        typicalSchedule: { hoursPerWeek: 40, pattern: 'Day/evening shifts' },
        locations: ['CA', 'FL', 'TX'],
        expectedAnnual: { min: 350000, max: 500000 },
      },
      {
        specialty: 'Hospitalist',
        avgHourlyRate: 225,
        typicalSchedule: { hoursPerWeek: 40, pattern: '7 on/7 off' },
        locations: ['TX', 'FL', 'GA'],
        expectedAnnual: { min: 280000, max: 350000 },
      },
      {
        specialty: 'Family Medicine',
        avgHourlyRate: 200,
        typicalSchedule: { hoursPerWeek: 40, pattern: 'Standard clinic' },
        locations: ['MT', 'ID', 'WY'],
        expectedAnnual: { min: 250000, max: 320000 },
      },
      {
        specialty: 'Psychiatry',
        avgHourlyRate: 250,
        typicalSchedule: { hoursPerWeek: 40, pattern: 'Outpatient clinic' },
        locations: ['CA', 'NY', 'MA'],
        expectedAnnual: { min: 300000, max: 400000 },
      },
      {
        specialty: 'Surgery - General',
        avgHourlyRate: 450,
        typicalSchedule: { hoursPerWeek: 50, pattern: 'Call schedule' },
        locations: ['CA', 'TX', 'NY'],
        expectedAnnual: { min: 500000, max: 700000 },
      },
    ]

    specialtyData.forEach(specialty => {
      describe(`${specialty.specialty} contracts`, () => {
        specialty.locations.forEach(location => {
          it(`calculates ${specialty.specialty} rate in ${location} correctly`, () => {
            const result = contractEngine.calculate({
              contractType: ContractType.HOURLY,
              hourlyRate: specialty.avgHourlyRate,
              hoursPerWeek: specialty.typicalSchedule.hoursPerWeek,
              duration: 52, // Annual
              location,
            })

            expect(result.annualEquivalent).toBeGreaterThanOrEqual(specialty.expectedAnnual.min)
            expect(result.annualEquivalent).toBeLessThanOrEqual(specialty.expectedAnnual.max)
            expect(result.effectiveHourlyRate).toBeLessThanOrEqual(specialty.avgHourlyRate)
            expect(result.netPay).toBeGreaterThan(specialty.expectedAnnual.min * 0.6) // At least 60% take-home
          })
        })

        it(`handles ${specialty.specialty} overtime scenarios`, () => {
          const result = contractEngine.calculate({
            contractType: ContractType.HOURLY,
            hourlyRate: specialty.avgHourlyRate,
            hoursPerWeek: specialty.typicalSchedule.hoursPerWeek + 10, // Extra 10 hours
            duration: 13,
            location: specialty.locations[0],
            overtime: {
              enabled: true,
              rate: 1.5,
              threshold: 40,
            },
          })

          if (specialty.typicalSchedule.hoursPerWeek + 10 > 40) {
            expect(result.breakdown.overtimePay).toBeGreaterThan(0)
          }
        })
      })
    })
  })

  describe('Nursing specialties', () => {
    const nursingData = [
      {
        role: 'ICU Nurse',
        avgHourlyRate: 55,
        typicalSchedule: { hoursPerWeek: 36, shifts: '3x12' },
        expectedAnnual: { min: 85000, max: 120000 },
      },
      {
        role: 'Emergency Nurse',
        avgHourlyRate: 50,
        typicalSchedule: { hoursPerWeek: 36, shifts: '3x12' },
        expectedAnnual: { min: 80000, max: 110000 },
      },
      {
        role: 'OR Nurse',
        avgHourlyRate: 48,
        typicalSchedule: { hoursPerWeek: 40, shifts: 'Standard' },
        expectedAnnual: { min: 85000, max: 115000 },
      },
      {
        role: 'Travel Nurse',
        avgHourlyRate: 65,
        typicalSchedule: { hoursPerWeek: 36, shifts: '3x12' },
        expectedAnnual: { min: 100000, max: 140000 },
        stipends: { housing: 2000, meals: 500 },
      },
    ]

    nursingData.forEach(role => {
      it(`calculates ${role.role} compensation correctly`, () => {
        const input: any = {
          contractType: ContractType.HOURLY,
          hourlyRate: role.avgHourlyRate,
          hoursPerWeek: role.typicalSchedule.hoursPerWeek,
          duration: 52,
          location: 'CA',
        }

        if (role.stipends) {
          input.expenses = {
            housing: role.stipends.housing,
            meals: role.stipends.meals,
          }
        }

        const result = contractEngine.calculate(input)

        expect(result.annualEquivalent).toBeGreaterThanOrEqual(role.expectedAnnual.min)
        expect(result.annualEquivalent).toBeLessThanOrEqual(role.expectedAnnual.max)
      })
    })
  })

  describe('Shift differentials and premiums', () => {
    it('calculates night shift differential correctly', () => {
      const baseRate = 45
      const nightDifferential = 5 // Additional $5/hour for nights
      
      const dayShiftResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: baseRate,
        hoursPerWeek: 36,
        duration: 13,
        location: 'TX',
      })

      const nightShiftResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: baseRate + nightDifferential,
        hoursPerWeek: 36,
        duration: 13,
        location: 'TX',
      })

      const differentialAmount = nightShiftResult.grossPay - dayShiftResult.grossPay
      const expectedDifferential = nightDifferential * 36 * 13
      expect(differentialAmount).toBe(expectedDifferential)
    })

    it('calculates weekend premium correctly', () => {
      const weekdayRate = 50
      const weekendPremium = 10 // Additional $10/hour for weekends
      
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: weekdayRate,
        hoursPerWeek: 24, // Assume 24 hours are weekend hours
        duration: 13,
        location: 'FL',
        premiums: {
          weekend: {
            rate: weekendPremium,
            hours: 24, // 12 hours Sat + 12 hours Sun
          },
        },
      })

      // Should include premium in gross pay calculation
      const expectedWeekendPremium = weekendPremium * 24 * 13
      expect(result.breakdown.premiums).toBeCloseTo(expectedWeekendPremium, 0)
    })

    it('calculates holiday pay correctly', () => {
      const baseRate = 55
      const holidayMultiplier = 2.5 // 2.5x pay for holidays
      
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: baseRate,
        hoursPerWeek: 40,
        duration: 52,
        location: 'NY',
        holidays: {
          count: 7, // 7 holidays per year
          hoursPerHoliday: 12,
          payMultiplier: holidayMultiplier,
        },
      })

      const holidayHours = 7 * 12
      const holidayPremium = baseRate * (holidayMultiplier - 1) * holidayHours
      expect(result.breakdown.holidayPay).toBeCloseTo(holidayPremium, 0)
    })
  })

  describe('Call pay and on-call scenarios', () => {
    it('calculates on-call stipend correctly', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 13,
        location: 'CA',
        onCall: {
          stipendPerDay: 500, // $500/day on-call stipend
          daysPerWeek: 2, // On-call 2 days per week
          callbackRate: 450, // $450/hour if called in
          averageCallbacks: 4, // Average 4 hours callback per week
        },
      })

      const expectedStipend = 500 * 2 * 13 // $500 * 2 days * 13 weeks
      const expectedCallbacks = 450 * 4 * 13 // $450 * 4 hours * 13 weeks
      
      expect(result.breakdown.onCallStipend).toBe(expectedStipend)
      expect(result.breakdown.callbackPay).toBe(expectedCallbacks)
    })

    it('handles home call vs in-house call rates', () => {
      const homeCallResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 250,
        hoursPerWeek: 40,
        duration: 13,
        location: 'TX',
        onCall: {
          type: 'home',
          stipendPerDay: 300,
          daysPerWeek: 3,
        },
      })

      const inHouseCallResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 250,
        hoursPerWeek: 40,
        duration: 13,
        location: 'TX',
        onCall: {
          type: 'inHouse',
          stipendPerDay: 800, // Higher rate for in-house
          daysPerWeek: 3,
        },
      })

      expect(inHouseCallResult.breakdown.onCallStipend).toBeGreaterThan(homeCallResult.breakdown.onCallStipend)
    })
  })

  describe('Malpractice and insurance considerations', () => {
    it('includes malpractice insurance in benefits calculation', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 350,
        hoursPerWeek: 40,
        duration: 52,
        location: 'NY',
        benefits: {
          malpracticeInsurance: 25000, // Annual malpractice premium
          tailCoverage: 50000, // Tail coverage provision
        },
      })

      expect(result.benefits.malpracticeInsurance).toBe(25000)
      expect(result.benefits.tailCoverage).toBe(50000)
      expect(result.totalCompensation).toBe(result.grossPay + 75000)
    })

    it('calculates occurrence vs claims-made malpractice costs', () => {
      const occurrenceResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 13,
        location: 'CA',
        benefits: {
          malpracticeInsurance: 8000, // Higher for occurrence
          malpracticeType: 'occurrence',
        },
      })

      const claimsMadeResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 13,
        location: 'CA',
        benefits: {
          malpracticeInsurance: 5000, // Lower for claims-made
          tailCoverage: 15000, // But need tail coverage
          malpracticeType: 'claimsMade',
        },
      })

      // Occurrence should be more expensive upfront
      expect(occurrenceResult.benefits.malpracticeInsurance).toBeGreaterThan(claimsMadeResult.benefits.malpracticeInsurance)
      // But claims-made has tail coverage cost
      expect(claimsMadeResult.benefits.tailCoverage).toBeGreaterThan(0)
    })
  })

  describe('CME and professional development', () => {
    it('includes CME allowance in benefits', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 275,
        hoursPerWeek: 40,
        duration: 52,
        location: 'FL',
        benefits: {
          cme: 5000, // Annual CME allowance
          cmeTime: 40, // 40 hours paid CME time
        },
      })

      expect(result.benefits.cme).toBe(5000)
      expect(result.benefits.cmeTime).toBe(40 * 275) // 40 hours at hourly rate
    })

    it('calculates board certification bonuses', () => {
      const result = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 250,
        hoursPerWeek: 40,
        duration: 52,
        location: 'TX',
        bonuses: {
          boardCertification: 10000, // Annual board cert bonus
          qualityMetrics: 5000, // Quality bonus
        },
      })

      expect(result.bonuses.boardCertification).toBe(10000)
      expect(result.bonuses.qualityMetrics).toBe(5000)
      expect(result.totalCompensation).toBe(result.grossPay + 15000)
    })
  })

  describe('Credentialing and licensing costs', () => {
    it('includes state licensing fees', () => {
      const multiStateResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 300,
        hoursPerWeek: 40,
        duration: 26, // 6 months
        location: 'CA',
        expenses: {
          licensure: 2500, // CA + DEA + other licenses
          credentialing: 1000, // Hospital credentialing fees
        },
      })

      expect(multiStateResult.expenses.licensure).toBe(2500)
      expect(multiStateResult.expenses.credentialing).toBe(1000)
      expect(multiStateResult.netPay).toBe(multiStateResult.grossPay - multiStateResult.taxes.total + 3500)
    })

    it('calculates interstate licensing compact benefits', () => {
      // Nursing Licensure Compact states have lower licensing costs
      const compactStateResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 55,
        hoursPerWeek: 36,
        duration: 13,
        location: 'TX', // Compact state
        expenses: {
          licensure: 200, // Lower cost due to compact
        },
      })

      const nonCompactResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 55,
        hoursPerWeek: 36,
        duration: 13,
        location: 'CA', // Non-compact state
        expenses: {
          licensure: 800, // Higher cost
        },
      })

      expect(nonCompactResult.expenses.licensure).toBeGreaterThan(compactStateResult.expenses.licensure)
    })
  })

  describe('Housing and travel stipends', () => {
    it('calculates tax-free vs taxable stipends correctly', () => {
      const taxableStipendResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 50,
        hoursPerWeek: 36,
        duration: 13,
        location: 'FL',
        stipends: {
          housing: {
            amount: 2500,
            taxable: true,
          },
          meals: {
            amount: 500,
            taxable: true,
          },
        },
      })

      const taxFreeStipendResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 50,
        hoursPerWeek: 36,
        duration: 13,
        location: 'FL',
        stipends: {
          housing: {
            amount: 2500,
            taxable: false,
          },
          meals: {
            amount: 500,
            taxable: false,
          },
        },
      })

      // Tax-free stipends should result in higher net pay
      expect(taxFreeStipendResult.netPay).toBeGreaterThan(taxableStipendResult.netPay)
    })

    it('validates IRS stipend limits', () => {
      // Test with stipend amounts at IRS limits for different locations
      const highCostAreaResult = contractEngine.calculate({
        contractType: ContractType.HOURLY,
        hourlyRate: 45,
        hoursPerWeek: 36,
        duration: 13,
        location: 'CA', // High cost area
        stipends: {
          housing: {
            amount: 4200, // Near IRS limit for high-cost area
            taxable: false,
          },
          meals: {
            amount: 79, // IRS per diem limit
            taxable: false,
          },
        },
      })

      expect(highCostAreaResult.stipends.housing).toBe(4200 * 13)
      expect(highCostAreaResult.stipends.meals).toBe(79 * 7 * 13) // Daily rate * 7 days * weeks
    })
  })
})