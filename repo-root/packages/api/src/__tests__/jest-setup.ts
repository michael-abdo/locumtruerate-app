/**
 * Jest test setup for unit tests
 * Minimal setup without database dependencies
 */

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_testing'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Global test timeout
jest.setTimeout(30000)

// Mock console.log for cleaner test output
global.console = {
  ...console,
  // Keep console.error and console.warn for debugging
  log: jest.fn(),
}