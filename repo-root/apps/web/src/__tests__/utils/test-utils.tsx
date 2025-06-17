import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/providers/theme-provider'
import { AnalyticsProvider } from '@/providers/analytics-provider'
import { OfflineProvider } from '@/providers/offline-provider'

// Mock tRPC provider for tests
const MockTRPCProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Create a wrapper with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <MockTRPCProvider>
        <AnalyticsProvider>
          <OfflineProvider>
            {children}
          </OfflineProvider>
        </AnalyticsProvider>
      </MockTRPCProvider>
    </ThemeProvider>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper functions for testing
export const createMockJob = (overrides = {}) => ({
  id: '1',
  title: 'Emergency Medicine Physician',
  slug: 'emergency-medicine-physician-1',
  company: {
    id: '1',
    name: 'Metro General Hospital',
    logo: '/companies/metro-general.png'
  },
  location: 'Dallas, TX',
  category: 'Emergency Medicine',
  type: 'FULL_TIME' as const,
  status: 'ACTIVE' as const,
  salaryMin: 300000,
  salaryMax: 450000,
  description: 'Seeking an experienced Emergency Medicine physician...',
  requirements: ['MD/DO degree', 'Board certification'],
  benefits: ['Health insurance', '401k matching'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  expiresAt: '2024-12-31T23:59:59.999Z',
  ...overrides
})

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user' as const,
  verified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides
})

export const createMockApplication = (overrides = {}) => ({
  id: '1',
  jobId: '1',
  name: 'Dr. Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  experience: 5,
  currentCompany: 'Current Hospital',
  currentRole: 'Emergency Physician',
  resumeUrl: '/resumes/test-resume.pdf',
  coverLetter: 'I am interested in this position...',
  status: 'PENDING' as const,
  appliedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
})

// Mock calculation results
export const createMockCalculationResult = (overrides = {}) => ({
  grossPay: 50000,
  netPay: 38000,
  taxes: 12000,
  breakdown: {
    federal: 8000,
    state: 2000,
    social: 1500,
    medicare: 500
  },
  hourlyRate: 125,
  weeklyHours: 40,
  ...overrides
})

// Form testing utilities
export const fillAndSubmitForm = async ({
  getByLabelText,
  getByRole,
  user,
  formData
}: {
  getByLabelText: any
  getByRole: any
  user: any
  formData: Record<string, string>
}) => {
  // Fill form fields
  for (const [label, value] of Object.entries(formData)) {
    const field = getByLabelText(new RegExp(label, 'i'))
    await user.clear(field)
    await user.type(field, value)
  }
  
  // Submit form
  const submitButton = getByRole('button', { name: /submit/i })
  await user.click(submitButton)
}

// Wait utilities
export const waitForLoadingToFinish = async (container: HTMLElement) => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react')
  
  try {
    await waitForElementToBeRemoved(
      () => container.querySelector('[data-testid="loading"]'),
      { timeout: 3000 }
    )
  } catch {
    // Loading element might not exist, which is fine
  }
}

// Mock local storage for tests
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get store() {
      return { ...store }
    }
  }
}

// Mock intersection observer for testing
export const mockIntersectionObserver = () => {
  const observe = jest.fn()
  const disconnect = jest.fn()
  const unobserve = jest.fn()
  
  // @ts-ignore
  window.IntersectionObserver = jest.fn(() => ({
    observe,
    disconnect,
    unobserve
  }))
  
  return { observe, disconnect, unobserve }
}

// Create custom matchers for better assertions
export const customMatchers = {
  toHaveValidationError: (received: HTMLElement, expectedMessage: string) => {
    const errorElement = received.querySelector('[role="alert"], .error-message, [data-testid="error"]')
    const hasError = errorElement && errorElement.textContent?.includes(expectedMessage)
    
    return {
      message: () => 
        hasError 
          ? `Expected element not to have validation error "${expectedMessage}"`
          : `Expected element to have validation error "${expectedMessage}"`,
      pass: !!hasError
    }
  },
  
  toBeLoading: (received: HTMLElement) => {
    const isLoading = received.querySelector('[data-testid="loading"], .loading, .spinner')
    
    return {
      message: () => 
        isLoading 
          ? 'Expected element not to be loading'
          : 'Expected element to be loading',
      pass: !!isLoading
    }
  }
}