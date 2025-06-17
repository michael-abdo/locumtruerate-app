// Test setup for calc-core package

// Mock console methods for cleaner test output
beforeAll(() => {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
})

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})

// Common test utilities
export const roundToCents = (amount: number): number => {
  return Math.round(amount * 100) / 100
}

export const expectCloseTo = (actual: number, expected: number, precision: number = 2) => {
  expect(actual).toBeCloseTo(expected, precision)
}

// Common test data
export const TEST_STATES = {
  CA: { code: 'CA', name: 'California', taxRate: 0.0725 },
  TX: { code: 'TX', name: 'Texas', taxRate: 0 },
  NY: { code: 'NY', name: 'New York', taxRate: 0.065 },
  FL: { code: 'FL', name: 'Florida', taxRate: 0 },
  WA: { code: 'WA', name: 'Washington', taxRate: 0 },
}

export const TEST_CONTRACTS = {
  standard: {
    hourlyRate: 200,
    hoursPerWeek: 40,
    weeks: 12,
    location: 'CA',
  },
  partTime: {
    hourlyRate: 250,
    hoursPerWeek: 20,
    weeks: 8,
    location: 'TX',
  },
  premium: {
    hourlyRate: 350,
    hoursPerWeek: 50,
    weeks: 16,
    location: 'NY',
  },
}

export const TEST_SALARIES = {
  low: 120000,
  medium: 200000,
  high: 350000,
  veryHigh: 500000,
}