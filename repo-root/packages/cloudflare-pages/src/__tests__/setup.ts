/**
 * Test setup for Cloudflare Pages package
 */

// Mock fetch for tests
global.fetch = jest.fn();

// Mock process.env
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  (global.fetch as jest.Mock).mockClear();
});

afterEach(() => {
  process.env = originalEnv;
});