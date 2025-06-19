/**
 * Jest Test Setup
 * Global configuration and utilities for cross-platform validation tests
 */

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Global test timeout for async operations
jest.setTimeout(30000);

// Mock console methods during tests to reduce noise
const originalConsole = global.console;

beforeEach(() => {
  // Suppress console during tests unless explicitly needed
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterEach(() => {
  // Restore console after each test
  global.console = originalConsole;
});

// Add TypeScript declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}