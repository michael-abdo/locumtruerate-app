import { renderHook, waitFor, act, within } from '@testing-library/react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, createMockCalculationResult } from '@/__tests__/utils/test-utils'
import { useCalculatorPersistence } from '@/hooks/calculator/useCalculatorPersistence'
import { ContractCalculator } from '@/components/calculator/contract-calculator'
// import { api } from '@/trpc/react' // Disabled for testing
import { TRPCError } from '@trpc/server'

// Mock Clerk authentication
const mockUser = {
  id: 'test-user-123',
  emailAddresses: [{ emailAddress: 'test@example.com' }]
}

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: mockUser })
}))

// Mock tRPC calls
const mockSaveCalculation = jest.fn()
const mockUpdateCalculation = jest.fn()
const mockDeleteCalculation = jest.fn()
const mockGetUserCalculations = jest.fn()
const mockGetCalculation = jest.fn()
const mockShareCalculation = jest.fn()
const mockGetCalculationStats = jest.fn()

// Setup tRPC mocks
const createMockTRPCClient = () => ({
  calculations: {
    save: {
      useMutation: () => ({
        mutateAsync: mockSaveCalculation,
        isLoading: false,
        error: null,
        reset: jest.fn()
      })
    },
    update: {
      useMutation: () => ({
        mutateAsync: mockUpdateCalculation,
        isLoading: false,
        error: null
      })
    },
    delete: {
      useMutation: () => ({
        mutateAsync: mockDeleteCalculation,
        isLoading: false,
        error: null
      })
    },
    getUserCalculations: {
      useQuery: ({ userId }: { userId: string }) => ({
        data: userId ? mockCalculations : [],
        isLoading: false,
        error: null,
        refetch: mockGetUserCalculations
      })
    },
    getCalculation: {
      useQuery: ({ id }: { id: string }) => ({
        data: mockCalculations.find(c => c.id === id),
        isLoading: false,
        error: null
      })
    },
    share: {
      useMutation: () => ({
        mutateAsync: mockShareCalculation,
        isLoading: false,
        error: null
      })
    },
    getStats: {
      useQuery: () => ({
        data: {
          total: 5,
          byType: { contract: 3, paycheck: 2, comparison: 0 },
          favorites: 2,
          mostRecent: mockCalculations[0]
        },
        isLoading: false,
        error: null
      })
    }
  }
})

jest.mock('@/trpc/react', () => ({
  api: createMockTRPCClient()
}))

// Mock calculation data
const mockCalculations = [
  {
    id: 'calc-1',
    userId: 'test-user-123',
    type: 'contract',
    name: 'Dallas Contract',
    input: { hourlyRate: 150, hoursPerWeek: 40, contractType: 'HOURLY' },
    result: createMockCalculationResult({ grossPay: 312000, netPay: 234000 }),
    tags: ['high-paying', 'texas'],
    isFavorite: true,
    isPublic: false,
    metadata: { location: 'Dallas, TX' },
    timestamp: new Date('2024-01-15').toISOString(),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'calc-2',
    userId: 'test-user-123',
    type: 'paycheck',
    name: 'NYC Paycheck',
    input: { annualSalary: 400000, payFrequency: 'bi-weekly' },
    result: createMockCalculationResult({ grossPay: 15384, netPay: 10769 }),
    tags: ['high-tax', 'new-york'],
    isFavorite: false,
    isPublic: true,
    metadata: { location: 'New York, NY' },
    timestamp: new Date('2024-01-10').toISOString(),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  }
]

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Calculator API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default successful responses
    mockSaveCalculation.mockResolvedValue({
      ...mockCalculations[0],
      id: 'new-calc-123'
    })
    
    mockUpdateCalculation.mockResolvedValue({
      ...mockCalculations[0],
      name: 'Updated Name'
    })
    
    mockDeleteCalculation.mockResolvedValue({ success: true })
    
    mockGetUserCalculations.mockResolvedValue(mockCalculations)
    
    mockShareCalculation.mockResolvedValue({
      id: 'calc-1',
      shareableLink: 'https://example.com/share/calc-1',
      expiresAt: new Date()
    })
  })

  describe('Saving Calculations to Database', () => {
    it('saves new calculation successfully', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      const calculationData = {
        id: 'temp-calc-123',
        type: 'contract' as const,
        input: { hourlyRate: 150, hoursPerWeek: 40, contractType: 'HOURLY' },
        result: createMockCalculationResult(),
        name: 'New Dallas Contract',
        tags: ['texas', 'emergency-medicine'],
        isFavorite: false,
        metadata: { location: 'Dallas, TX', specialty: 'Emergency Medicine' },
        timestamp: new Date().toISOString()
      }

      let savedResult: any
      await act(async () => {
        savedResult = await result.current.saveToDatabase(calculationData, {
          isPublic: false,
          expiresInDays: 30
        })
      })

      expect(mockSaveCalculation).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: 'contract',
        input: calculationData.input,
        result: calculationData.result,
        name: 'New Dallas Contract',
        tags: ['texas', 'emergency-medicine'],
        isFavorite: false,
        isPublic: false,
        metadata: expect.objectContaining({
          location: 'Dallas, TX',
          specialty: 'Emergency Medicine',
          expiresInDays: 30
        })
      })

      expect(savedResult.id).toBe('new-calc-123')
    })

    it('handles validation errors during save', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock validation error
      mockSaveCalculation.mockRejectedValue(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid calculation data: hourly rate must be positive'
        })
      )

      const invalidCalculation = {
        id: 'invalid-calc',
        type: 'contract' as const,
        input: { hourlyRate: -50 }, // Invalid negative rate
        result: createMockCalculationResult(),
        name: 'Invalid Calculation',
        timestamp: new Date().toISOString()
      }

      await expect(async () => {
        await act(async () => {
          await result.current.saveToDatabase(invalidCalculation)
        })
      }).rejects.toThrow('Invalid calculation data: hourly rate must be positive')

      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain('Invalid calculation data')
    })

    it('handles network errors gracefully', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock network error
      mockSaveCalculation.mockRejectedValue(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Network error: Unable to connect to database'
        })
      )

      const calculation = {
        id: 'calc-123',
        type: 'contract' as const,
        input: { hourlyRate: 150 },
        result: createMockCalculationResult(),
        name: 'Test Calculation',
        timestamp: new Date().toISOString()
      }

      let errorThrown = false
      await act(async () => {
        try {
          await result.current.saveToDatabase(calculation)
        } catch (error) {
          errorThrown = true
          expect(error).toBeInstanceOf(TRPCError)
        }
      })

      expect(errorThrown).toBe(true)
      expect(result.current.error).toBeTruthy()
    })

    it('handles unauthorized access', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock unauthorized error
      mockSaveCalculation.mockRejectedValue(
        new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in to save calculations'
        })
      )

      const calculation = {
        id: 'calc-123',
        type: 'contract' as const,
        input: { hourlyRate: 150 },
        result: createMockCalculationResult(),
        name: 'Test Calculation',
        timestamp: new Date().toISOString()
      }

      await expect(async () => {
        await act(async () => {
          await result.current.saveToDatabase(calculation)
        })
      }).rejects.toThrow('User must be logged in to save calculations')
    })
  })

  describe('Loading Saved Calculations', () => {
    it('loads user calculations successfully', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      await waitFor(() => {
        expect(result.current.userCalculations).toHaveLength(2)
        expect(result.current.userCalculations[0].name).toBe('Dallas Contract')
        expect(result.current.userCalculations[1].name).toBe('NYC Paycheck')
      })
    })

    it('filters calculations by type', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      await waitFor(() => {
        expect(result.current.userCalculations).toHaveLength(2)
      })

      let contractCalculations: any
      await act(async () => {
        contractCalculations = await result.current.getUserCalculations({
          type: 'contract'
        })
      })

      expect(contractCalculations).toHaveLength(1)
      expect(contractCalculations[0].type).toBe('contract')
      expect(contractCalculations[0].name).toBe('Dallas Contract')
    })

    it('filters calculations by favorites', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      let favoriteCalculations: any
      await act(async () => {
        favoriteCalculations = await result.current.getUserCalculations({
          isFavorite: true
        })
      })

      expect(favoriteCalculations).toHaveLength(1)
      expect(favoriteCalculations[0].isFavorite).toBe(true)
      expect(favoriteCalculations[0].name).toBe('Dallas Contract')
    })

    it('filters calculations by date range', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      const startDate = new Date('2024-01-12')
      const endDate = new Date('2024-01-20')

      let filteredCalculations: any
      await act(async () => {
        filteredCalculations = await result.current.getUserCalculations({
          startDate,
          endDate
        })
      })

      // Should only include Dallas Contract (Jan 15)
      expect(filteredCalculations).toHaveLength(1)
      expect(filteredCalculations[0].name).toBe('Dallas Contract')
    })

    it('handles empty calculation list', async () => {
      // Mock empty response
      mockGetUserCalculations.mockResolvedValue([])
      
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      await waitFor(() => {
        expect(result.current.userCalculations).toHaveLength(0)
      })

      let userCalculations: any
      await act(async () => {
        userCalculations = await result.current.getUserCalculations()
      })

      expect(userCalculations).toEqual([])
    })
  })

  describe('Updating Calculations', () => {
    it('updates calculation successfully', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      const updates = {
        name: 'Updated Dallas Contract',
        tags: ['texas', 'emergency-medicine', 'high-paying'],
        isFavorite: true,
        metadata: { 
          location: 'Dallas, TX',
          notes: 'Great contract with excellent benefits'
        }
      }

      let updatedResult: any
      await act(async () => {
        updatedResult = await result.current.updateInDatabase('calc-1', updates)
      })

      expect(mockUpdateCalculation).toHaveBeenCalledWith({
        id: 'calc-1',
        userId: mockUser.id,
        ...updates
      })

      expect(updatedResult.name).toBe('Updated Name') // From mock response
    })

    it('handles update of non-existent calculation', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock not found error
      mockUpdateCalculation.mockRejectedValue(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Calculation not found or you do not have permission to update it'
        })
      )

      await expect(async () => {
        await act(async () => {
          await result.current.updateInDatabase('non-existent-id', { name: 'Updated Name' })
        })
      }).rejects.toThrow('Calculation not found or you do not have permission to update it')
    })

    it('prevents unauthorized updates', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock forbidden error
      mockUpdateCalculation.mockRejectedValue(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own calculations'
        })
      )

      await expect(async () => {
        await act(async () => {
          await result.current.updateInDatabase('other-user-calc', { name: 'Hacked Name' })
        })
      }).rejects.toThrow('You can only update your own calculations')
    })
  })

  describe('Deleting Calculations', () => {
    it('deletes calculation successfully', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      await act(async () => {
        await result.current.deleteFromDatabase('calc-1')
      })

      expect(mockDeleteCalculation).toHaveBeenCalledWith({
        id: 'calc-1',
        userId: mockUser.id
      })

      // Should trigger refetch
      expect(mockGetUserCalculations).toHaveBeenCalled()
    })

    it('handles deletion of non-existent calculation', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock not found error
      mockDeleteCalculation.mockRejectedValue(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Calculation not found or you do not have permission to delete it'
        })
      )

      await expect(async () => {
        await act(async () => {
          await result.current.deleteFromDatabase('non-existent-id')
        })
      }).rejects.toThrow('Calculation not found or you do not have permission to delete it')
    })
  })

  describe('Calculation Sharing Functionality', () => {
    it('shares calculation with generated link', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
        writable: true
      })

      let shareResult: any
      await act(async () => {
        shareResult = await result.current.shareCalculation('calc-1', {
          expiresInDays: 7,
          isPublic: true
        })
      })

      expect(mockShareCalculation).toHaveBeenCalledWith({
        id: 'calc-1',
        userId: mockUser.id,
        expiresInDays: 7,
        isPublic: true
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/share/calc-1'
      )

      expect(shareResult.shareableLink).toBe('https://example.com/share/calc-1')
    })

    it('shares calculation with custom expiration', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      mockShareCalculation.mockResolvedValue({
        id: 'calc-1',
        shareableLink: 'https://example.com/share/calc-1',
        expiresAt: futureDate
      })

      let shareResult: any
      await act(async () => {
        shareResult = await result.current.shareCalculation('calc-1', {
          expiresInDays: 30,
          isPublic: false
        })
      })

      expect(shareResult.expiresAt).toEqual(futureDate)
    })

    it('handles sharing errors', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock sharing error
      mockShareCalculation.mockRejectedValue(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Calculation not found or you do not have permission to share it'
        })
      )

      await expect(async () => {
        await act(async () => {
          await result.current.shareCalculation('calc-1')
        })
      }).rejects.toThrow('Calculation not found or you do not have permission to share it')
    })
  })

  describe('User-Specific Calculation Management', () => {
    it('ensures user isolation for calculations', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // All operations should include userId
      const calculation = {
        id: 'calc-123',
        type: 'contract' as const,
        input: { hourlyRate: 150 },
        result: createMockCalculationResult(),
        name: 'Test Calculation',
        timestamp: new Date().toISOString()
      }

      await act(async () => {
        await result.current.saveToDatabase(calculation)
      })

      expect(mockSaveCalculation).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id
        })
      )
    })

    it('handles user session changes', async () => {
      // Test user logout scenario
      const { unmount } = renderHook(() => useCalculatorPersistence(), { 
        wrapper: createWrapper() 
      })

      // Simulate user logout by unmounting and remounting with no user
      unmount()

      // Mock no user scenario
      jest.mocked(require('@clerk/nextjs').useUser).mockReturnValue({ user: null })

      const { result } = renderHook(() => useCalculatorPersistence(), { 
        wrapper: createWrapper() 
      })

      // Should not have access to user calculations
      expect(result.current.userCalculations).toEqual([])

      // Operations requiring auth should fail gracefully
      const calculation = {
        id: 'calc-123',
        type: 'contract' as const,
        input: { hourlyRate: 150 },
        result: createMockCalculationResult(),
        name: 'Test Calculation',
        timestamp: new Date().toISOString()
      }

      await expect(async () => {
        await act(async () => {
          await result.current.saveToDatabase(calculation)
        })
      }).rejects.toThrow('User must be logged in to save calculations')
    })

    it('manages calculation quotas and limits', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock quota exceeded error
      mockSaveCalculation.mockRejectedValue(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Calculation limit exceeded. Please upgrade your plan or delete old calculations.'
        })
      )

      const calculation = {
        id: 'calc-123',
        type: 'contract' as const,
        input: { hourlyRate: 150 },
        result: createMockCalculationResult(),
        name: 'Test Calculation',
        timestamp: new Date().toISOString()
      }

      await expect(async () => {
        await act(async () => {
          await result.current.saveToDatabase(calculation)
        })
      }).rejects.toThrow('Calculation limit exceeded')
    })
  })

  describe('API Performance and Optimization', () => {
    it('handles concurrent API requests', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      const calculations = Array.from({ length: 5 }, (_, i) => ({
        id: `calc-${i}`,
        type: 'contract' as const,
        input: { hourlyRate: 150 + i * 10 },
        result: createMockCalculationResult(),
        name: `Calculation ${i}`,
        timestamp: new Date().toISOString()
      }))

      // Save multiple calculations concurrently
      const savePromises = calculations.map(calc =>
        result.current.saveToDatabase(calc)
      )

      await act(async () => {
        await Promise.all(savePromises)
      })

      expect(mockSaveCalculation).toHaveBeenCalledTimes(5)
    })

    it('implements request retry logic', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Mock temporary network error followed by success
      mockSaveCalculation
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ id: 'calc-123', success: true })

      const calculation = {
        id: 'calc-123',
        type: 'contract' as const,
        input: { hourlyRate: 150 },
        result: createMockCalculationResult(),
        name: 'Test Calculation',
        timestamp: new Date().toISOString()
      }

      // Should eventually succeed after retries
      let saveResult: any
      await act(async () => {
        saveResult = await result.current.saveToDatabase(calculation)
      })

      expect(saveResult.id).toBe('calc-123')
      expect(mockSaveCalculation).toHaveBeenCalledTimes(3) // 2 failures + 1 success
    })

    it('handles large calculation payloads', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Create large calculation with detailed breakdown
      const largeCalculation = {
        id: 'large-calc',
        type: 'contract' as const,
        input: { 
          hourlyRate: 150,
          hoursPerWeek: 40,
          duration: 24,
          expenses: Array.from({ length: 100 }, (_, i) => ({
            type: `expense-${i}`,
            amount: 100 + i,
            description: `Detailed expense description ${i}`
          }))
        },
        result: {
          ...createMockCalculationResult(),
          breakdown: {
            monthly: Array.from({ length: 24 }, (_, i) => ({
              month: i + 1,
              grossPay: 26000,
              netPay: 19500,
              taxes: 6500,
              expenses: 2000,
              detailed: Array.from({ length: 50 }, (_, j) => ({
                category: `category-${j}`,
                amount: 100 + j
              }))
            }))
          }
        },
        name: 'Large Detailed Calculation',
        timestamp: new Date().toISOString()
      }

      await act(async () => {
        await result.current.saveToDatabase(largeCalculation)
      })

      expect(mockSaveCalculation).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            expenses: expect.arrayContaining([
              expect.objectContaining({
                type: 'expense-0',
                amount: 100
              })
            ])
          }),
          result: expect.objectContaining({
            breakdown: expect.objectContaining({
              monthly: expect.arrayContaining([
                expect.objectContaining({
                  month: 1,
                  grossPay: 26000
                })
              ])
            })
          })
        })
      )
    })
  })

  describe('Integration with Calculator Components', () => {
    it('integrates save functionality with calculator UI', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Fill out calculator
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.type(screen.getByLabelText(/hours per week/i), '40')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      // Wait for calculation results
      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Save calculation
      await user.click(screen.getByRole('button', { name: /save calculation/i }))

      const saveDialog = screen.getByRole('dialog')
      await user.type(within(saveDialog).getByLabelText(/calculation name/i), 'My Contract')
      await user.click(within(saveDialog).getByRole('button', { name: /save/i }))

      // Should call API to save
      await waitFor(() => {
        expect(mockSaveCalculation).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Contract',
            type: 'contract',
            userId: mockUser.id
          })
        )
      })

      // Should show success message
      expect(screen.getByText(/calculation saved successfully/i)).toBeInTheDocument()
    })

    it('handles API errors in calculator UI', async () => {
      const user = userEvent.setup()
      
      // Mock save error
      mockSaveCalculation.mockRejectedValue(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection failed'
        })
      )

      render(<ContractCalculator />)

      // Perform calculation and try to save
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /save calculation/i }))

      const saveDialog = screen.getByRole('dialog')
      await user.type(within(saveDialog).getByLabelText(/calculation name/i), 'Failed Save')
      await user.click(within(saveDialog).getByRole('button', { name: /save/i }))

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })
  })
})