import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  roundToCents,
  calculatePercentage,
  calculatePercentageDifference,
  annualizePeriodic,
  deannualizeToperiodic,
  convertHourlyToAnnual,
  convertAnnualToHourly,
  convertDailyToAnnual,
  convertMonthlyToAnnual,
  getDaysInPeriod,
  getHoursInPeriod,
  getWeeksInPeriod,
  validatePositiveNumber,
  validatePercentage,
  validateDateRange,
  clamp,
  interpolate,
  parseNumberInput,
} from '../utils'

describe('Utils', () => {
  describe('Formatting Functions', () => {
    describe('formatCurrency', () => {
      it('formats positive amounts correctly', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56')
        expect(formatCurrency(1000000)).toBe('$1,000,000.00')
        expect(formatCurrency(0.99)).toBe('$0.99')
      })

      it('formats negative amounts correctly', () => {
        expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
        expect(formatCurrency(-0.01)).toBe('-$0.01')
      })

      it('handles custom decimal places', () => {
        expect(formatCurrency(1234.567, 0)).toBe('$1,235')
        expect(formatCurrency(1234.567, 1)).toBe('$1,234.6')
        expect(formatCurrency(1234.567, 3)).toBe('$1,234.567')
      })

      it('handles zero correctly', () => {
        expect(formatCurrency(0)).toBe('$0.00')
        expect(formatCurrency(-0)).toBe('$0.00')
      })

      it('rounds correctly', () => {
        expect(formatCurrency(1.005)).toBe('$1.01')
        expect(formatCurrency(1.004)).toBe('$1.00')
      })
    })

    describe('formatPercentage', () => {
      it('formats percentages correctly', () => {
        expect(formatPercentage(0.1234)).toBe('12.34%')
        expect(formatPercentage(1)).toBe('100.00%')
        expect(formatPercentage(0.005)).toBe('0.50%')
      })

      it('handles custom decimal places', () => {
        expect(formatPercentage(0.12345, 0)).toBe('12%')
        expect(formatPercentage(0.12345, 1)).toBe('12.3%')
        expect(formatPercentage(0.12345, 3)).toBe('12.345%')
      })

      it('handles negative percentages', () => {
        expect(formatPercentage(-0.05)).toBe('-5.00%')
        expect(formatPercentage(-1.5)).toBe('-150.00%')
      })
    })

    describe('formatNumber', () => {
      it('formats numbers with commas', () => {
        expect(formatNumber(1234567)).toBe('1,234,567')
        expect(formatNumber(1234.56)).toBe('1,234.56')
        expect(formatNumber(0)).toBe('0')
      })

      it('handles decimal places', () => {
        expect(formatNumber(1234.567, 2)).toBe('1,234.57')
        expect(formatNumber(1234, 2)).toBe('1,234.00')
      })

      it('handles negative numbers', () => {
        expect(formatNumber(-1234567)).toBe('-1,234,567')
        expect(formatNumber(-0.5, 2)).toBe('-0.50')
      })
    })
  })

  describe('Math Functions', () => {
    describe('roundToCents', () => {
      it('rounds to nearest cent', () => {
        expect(roundToCents(10.234)).toBe(10.23)
        expect(roundToCents(10.235)).toBe(10.24)
        expect(roundToCents(10.236)).toBe(10.24)
      })

      it('handles negative amounts', () => {
        expect(roundToCents(-10.234)).toBe(-10.23)
        expect(roundToCents(-10.235)).toBe(-10.24)
      })

      it('preserves whole dollars', () => {
        expect(roundToCents(100)).toBe(100)
        expect(roundToCents(100.00)).toBe(100)
      })
    })

    describe('calculatePercentage', () => {
      it('calculates percentage of total', () => {
        expect(calculatePercentage(25, 100)).toBe(0.25)
        expect(calculatePercentage(50, 200)).toBe(0.25)
        expect(calculatePercentage(100, 100)).toBe(1)
      })

      it('handles zero total', () => {
        expect(calculatePercentage(10, 0)).toBe(0)
        expect(calculatePercentage(0, 0)).toBe(0)
      })

      it('handles negative values', () => {
        expect(calculatePercentage(-25, 100)).toBe(-0.25)
        expect(calculatePercentage(25, -100)).toBe(-0.25)
      })
    })

    describe('calculatePercentageDifference', () => {
      it('calculates percentage increase', () => {
        expect(calculatePercentageDifference(100, 150)).toBe(0.5) // 50% increase
        expect(calculatePercentageDifference(50, 100)).toBe(1) // 100% increase
      })

      it('calculates percentage decrease', () => {
        expect(calculatePercentageDifference(100, 50)).toBe(-0.5) // 50% decrease
        expect(calculatePercentageDifference(100, 25)).toBe(-0.75) // 75% decrease
      })

      it('handles zero base', () => {
        expect(calculatePercentageDifference(0, 100)).toBe(Infinity)
        expect(calculatePercentageDifference(0, -100)).toBe(-Infinity)
      })

      it('handles same values', () => {
        expect(calculatePercentageDifference(100, 100)).toBe(0)
        expect(calculatePercentageDifference(-50, -50)).toBe(0)
      })
    })
  })

  describe('Conversion Functions', () => {
    describe('annualizePeriodic', () => {
      it('annualizes different periods correctly', () => {
        expect(annualizePeriodic(1000, 52)).toBe(52000) // Weekly
        expect(annualizePeriodic(2000, 26)).toBe(52000) // Biweekly
        expect(annualizePeriodic(4333.33, 12)).toBeCloseTo(52000) // Monthly
        expect(annualizePeriodic(13000, 4)).toBe(52000) // Quarterly
      })

      it('handles edge cases', () => {
        expect(annualizePeriodic(0, 12)).toBe(0)
        expect(annualizePeriodic(100, 1)).toBe(100) // Already annual
      })
    })

    describe('deannualizeToperiodic', () => {
      it('converts annual to periodic amounts', () => {
        expect(deannualizeToperiodic(52000, 52)).toBe(1000) // Weekly
        expect(deannualizeToperiodic(52000, 26)).toBe(2000) // Biweekly
        expect(deannualizeToperiodic(52000, 12)).toBeCloseTo(4333.33) // Monthly
      })

      it('handles division by zero', () => {
        expect(() => deannualizeToperiodic(52000, 0)).toThrow()
      })
    })

    describe('convertHourlyToAnnual', () => {
      it('converts standard hourly rates', () => {
        expect(convertHourlyToAnnual(25)).toBe(52000) // 25 * 40 * 52
        expect(convertHourlyToAnnual(50)).toBe(104000)
        expect(convertHourlyToAnnual(100)).toBe(208000)
      })

      it('handles custom hours per week', () => {
        expect(convertHourlyToAnnual(50, 20)).toBe(52000) // Part-time
        expect(convertHourlyToAnnual(40, 50)).toBe(104000) // Overtime
      })

      it('handles custom weeks per year', () => {
        expect(convertHourlyToAnnual(50, 40, 48)).toBe(96000) // 48 weeks
        expect(convertHourlyToAnnual(50, 40, 26)).toBe(52000) // 6 months
      })
    })

    describe('convertAnnualToHourly', () => {
      it('converts annual salary to hourly rate', () => {
        expect(convertAnnualToHourly(52000)).toBe(25)
        expect(convertAnnualToHourly(104000)).toBe(50)
        expect(convertAnnualToHourly(208000)).toBe(100)
      })

      it('handles custom hours and weeks', () => {
        expect(convertAnnualToHourly(52000, 20, 52)).toBe(50) // Part-time
        expect(convertAnnualToHourly(96000, 40, 48)).toBe(50) // 48 weeks
      })
    })

    describe('convertDailyToAnnual', () => {
      it('converts daily rate to annual', () => {
        expect(convertDailyToAnnual(400)).toBe(104000) // 400 * 5 * 52
        expect(convertDailyToAnnual(1000)).toBe(260000)
      })

      it('handles custom days per week', () => {
        expect(convertDailyToAnnual(500, 4)).toBe(104000) // 4 days/week
        expect(convertDailyToAnnual(600, 3)).toBe(93600) // 3 days/week
      })
    })

    describe('convertMonthlyToAnnual', () => {
      it('converts monthly to annual', () => {
        expect(convertMonthlyToAnnual(5000)).toBe(60000)
        expect(convertMonthlyToAnnual(10000)).toBe(120000)
      })

      it('handles partial year', () => {
        expect(convertMonthlyToAnnual(5000, 6)).toBe(30000) // 6 months only
      })
    })
  })

  describe('Period Calculation Functions', () => {
    describe('getDaysInPeriod', () => {
      it('calculates days for different periods', () => {
        expect(getDaysInPeriod('WEEKLY')).toBe(7)
        expect(getDaysInPeriod('BIWEEKLY')).toBe(14)
        expect(getDaysInPeriod('MONTHLY')).toBeCloseTo(30.44) // 365.25/12
        expect(getDaysInPeriod('ANNUAL')).toBe(365.25)
      })

      it('handles unknown periods', () => {
        expect(() => getDaysInPeriod('INVALID')).toThrow()
      })
    })

    describe('getHoursInPeriod', () => {
      it('calculates hours for different periods', () => {
        expect(getHoursInPeriod('WEEKLY')).toBe(40)
        expect(getHoursInPeriod('BIWEEKLY')).toBe(80)
        expect(getHoursInPeriod('MONTHLY')).toBeCloseTo(173.33)
        expect(getHoursInPeriod('ANNUAL')).toBe(2080)
      })

      it('handles custom hours per week', () => {
        expect(getHoursInPeriod('WEEKLY', 20)).toBe(20)
        expect(getHoursInPeriod('BIWEEKLY', 30)).toBe(60)
        expect(getHoursInPeriod('ANNUAL', 50)).toBe(2600)
      })
    })

    describe('getWeeksInPeriod', () => {
      it('calculates weeks for different periods', () => {
        expect(getWeeksInPeriod('WEEKLY')).toBe(1)
        expect(getWeeksInPeriod('BIWEEKLY')).toBe(2)
        expect(getWeeksInPeriod('MONTHLY')).toBeCloseTo(4.33)
        expect(getWeeksInPeriod('ANNUAL')).toBe(52)
      })
    })
  })

  describe('Validation Functions', () => {
    describe('validatePositiveNumber', () => {
      it('validates positive numbers', () => {
        expect(() => validatePositiveNumber(10, 'amount')).not.toThrow()
        expect(() => validatePositiveNumber(0.01, 'rate')).not.toThrow()
      })

      it('throws for negative numbers', () => {
        expect(() => validatePositiveNumber(-10, 'amount'))
          .toThrow('amount must be positive')
      })

      it('throws for zero', () => {
        expect(() => validatePositiveNumber(0, 'value'))
          .toThrow('value must be positive')
      })

      it('throws for NaN', () => {
        expect(() => validatePositiveNumber(NaN, 'input'))
          .toThrow('input must be positive')
      })
    })

    describe('validatePercentage', () => {
      it('validates percentages between 0 and 1', () => {
        expect(() => validatePercentage(0, 'rate')).not.toThrow()
        expect(() => validatePercentage(0.5, 'rate')).not.toThrow()
        expect(() => validatePercentage(1, 'rate')).not.toThrow()
      })

      it('throws for values outside range', () => {
        expect(() => validatePercentage(-0.1, 'rate'))
          .toThrow('rate must be between 0 and 1')
        expect(() => validatePercentage(1.1, 'rate'))
          .toThrow('rate must be between 0 and 1')
      })

      it('handles custom ranges', () => {
        expect(() => validatePercentage(1.5, 'multiplier', 0, 2)).not.toThrow()
        expect(() => validatePercentage(2.5, 'multiplier', 0, 2))
          .toThrow('multiplier must be between 0 and 2')
      })
    })

    describe('validateDateRange', () => {
      it('validates valid date ranges', () => {
        const start = new Date('2024-01-01')
        const end = new Date('2024-12-31')
        expect(() => validateDateRange(start, end)).not.toThrow()
      })

      it('throws for invalid ranges', () => {
        const start = new Date('2024-12-31')
        const end = new Date('2024-01-01')
        expect(() => validateDateRange(start, end))
          .toThrow('Start date must be before end date')
      })

      it('allows same dates', () => {
        const date = new Date('2024-06-15')
        expect(() => validateDateRange(date, date)).not.toThrow()
      })
    })
  })

  describe('Utility Functions', () => {
    describe('clamp', () => {
      it('clamps values within range', () => {
        expect(clamp(5, 0, 10)).toBe(5)
        expect(clamp(-5, 0, 10)).toBe(0)
        expect(clamp(15, 0, 10)).toBe(10)
      })

      it('handles equal min and max', () => {
        expect(clamp(5, 10, 10)).toBe(10)
        expect(clamp(15, 10, 10)).toBe(10)
      })
    })

    describe('interpolate', () => {
      it('interpolates between values', () => {
        expect(interpolate(0, 100, 0.5)).toBe(50)
        expect(interpolate(0, 100, 0)).toBe(0)
        expect(interpolate(0, 100, 1)).toBe(100)
      })

      it('extrapolates beyond range', () => {
        expect(interpolate(0, 100, 1.5)).toBe(150)
        expect(interpolate(0, 100, -0.5)).toBe(-50)
      })

      it('handles negative ranges', () => {
        expect(interpolate(-100, -50, 0.5)).toBe(-75)
        expect(interpolate(100, -100, 0.5)).toBe(0)
      })
    })

    describe('parseNumberInput', () => {
      it('parses various number formats', () => {
        expect(parseNumberInput('1234')).toBe(1234)
        expect(parseNumberInput('1,234')).toBe(1234)
        expect(parseNumberInput('$1,234.56')).toBe(1234.56)
        expect(parseNumberInput('  $1,234.56  ')).toBe(1234.56)
      })

      it('handles percentage signs', () => {
        expect(parseNumberInput('25%')).toBe(0.25)
        expect(parseNumberInput('100%')).toBe(1)
        expect(parseNumberInput('5.5%')).toBe(0.055)
      })

      it('handles negative numbers', () => {
        expect(parseNumberInput('-$1,234')).toBe(-1234)
        expect(parseNumberInput('($1,234)')).toBe(-1234)
        expect(parseNumberInput('-25%')).toBe(-0.25)
      })

      it('returns NaN for invalid input', () => {
        expect(parseNumberInput('abc')).toBeNaN()
        expect(parseNumberInput('')).toBeNaN()
        expect(parseNumberInput('$')).toBeNaN()
      })

      it('handles decimal places', () => {
        expect(parseNumberInput('1.5')).toBe(1.5)
        expect(parseNumberInput('0.123')).toBe(0.123)
        expect(parseNumberInput('.5')).toBe(0.5)
      })
    })
  })
})