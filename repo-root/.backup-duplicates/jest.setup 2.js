/**
 * Global Jest setup for all tests
 */

// Add custom matchers
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // Only show console.error if it's not a React warning or test-related
    if (
      typeof args[0] === 'string' &&
      !args[0].includes('Warning:') &&
      !args[0].includes('Error: Not implemented')
    ) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args) => {
    // Only show console.warn if it's not a React warning
    if (
      typeof args[0] === 'string' &&
      !args[0].includes('Warning:')
    ) {
      originalConsoleWarn(...args);
    }
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'EMPLOYER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }),
  
  createMockJob: () => ({
    id: 'test-job-id',
    title: 'Test Job',
    company: 'Test Company',
    location: 'Test Location',
    description: 'Test Description',
    requirements: ['Test Requirement'],
    benefits: ['Test Benefit'],
    salaryMin: 100000,
    salaryMax: 150000,
    employmentType: 'FULL_TIME',
    specialty: 'EMERGENCY_MEDICINE',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }),
  
  createMockApplication: () => ({
    id: 'test-application-id',
    status: 'PENDING',
    coverLetter: 'Test cover letter',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }),
  
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  mockDate: (date) => {
    const mockDate = new Date(date);
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
    return () => jest.useRealTimers();
  },
};