module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/index.ts', // Exports only
  ],
  coverageThreshold: {
    global: {
      branches: 85, // Reduced for initial validation
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
    }],
  },
  testTimeout: 30000,
  verbose: true,
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      displayName: 'unit',
      testMatch: ['<rootDir>/src/__tests__/**/!(validation)/*.test.ts'],
      roots: ['<rootDir>/src'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: {
            allowJs: true,
            esModuleInterop: true,
            resolveJsonModule: true,
          },
        }],
      },
    },
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      displayName: 'validation',
      testMatch: ['<rootDir>/src/__tests__/validation/**/*.test.ts'],
      roots: ['<rootDir>/src'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      testTimeout: 60000,
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: {
            allowJs: true,
            esModuleInterop: true,
            resolveJsonModule: true,
          },
        }],
      },
    },
  ],
}