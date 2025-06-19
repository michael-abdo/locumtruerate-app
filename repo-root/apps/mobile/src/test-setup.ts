/**
 * Test Setup Configuration
 * 
 * Global test setup for React Native Testing Library
 */

import '@testing-library/jest-native/extend-expect'

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      sentryDsn: 'test-dsn',
      analyticsEnabled: true,
      performanceMonitoring: true,
    },
    version: '1.0.0',
    ios: { buildNumber: '1' },
    android: { versionCode: 1 },
  },
}))

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `locumtruerate://${path}`),
  parse: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getInitialURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve()),
}))

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}))

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  SecureStoreAccessible: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'whenUnlockedThisDeviceOnly',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'whenPasscodeSetThisDeviceOnly',
  },
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}))

jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn((fn) => fn({
      executeSql: jest.fn((sql, params, success) => {
        if (success) success(null, { rows: { length: 0, item: () => ({}) } })
      }),
    })),
  })),
}))

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}))

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ThemeProvider: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: ({ children }: any) => children,
  },
}))

// Mock tRPC
jest.mock('@/lib/trpc', () => ({
  trpc: {
    jobs: {
      getAll: {
        useInfiniteQuery: jest.fn(() => ({
          data: { pages: [{ jobs: [], total: 0 }] },
          isLoading: false,
          refetch: jest.fn(),
          fetchNextPage: jest.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        })),
      },
      getById: {
        useQuery: jest.fn(() => ({
          data: null,
          isLoading: false,
          error: null,
        })),
      },
    },
    applications: {
      create: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isLoading: false,
        })),
      },
    },
    auth: {
      login: {
        mutate: jest.fn(),
      },
      refresh: {
        mutate: jest.fn(),
      },
    },
    users: {
      getProfile: {
        query: jest.fn(),
      },
    },
  },
}))

// Global test timeout
jest.setTimeout(10000)

// Suppress console warnings in tests
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return
    }
    originalConsoleWarn.call(console, ...args)
  }

  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return
    }
    originalConsoleError.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})