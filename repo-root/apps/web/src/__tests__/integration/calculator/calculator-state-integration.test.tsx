import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCalculatorState } from '@/hooks/calculator/useCalculatorState'
import { useCalculatorPersistence } from '@/hooks/calculator/useCalculatorPersistence'
import { useCalculatorComparison } from '@/hooks/calculator/useCalculatorComparison'
import { createMockCalculationResult, mockLocalStorage } from '@/__tests__/utils/test-utils'
import { 
  CalculationHistoryManager,
  ContractCalculationResult,
  PaycheckCalculationResult,
  ContractInput,
  PaycheckInput
} from '@locumtruerate/calc-core'

// Mock Clerk authentication
const mockUser = {
  id: 'test-user-123',
  emailAddresses: [{ emailAddress: 'test@example.com' }]
}

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: mockUser })
}))

// Mock calc-core history manager
const mockHistoryManager = {
  getRecent: jest.fn(),
  getFavorites: jest.fn(),
  saveContractCalculation: jest.fn(),
  savePaycheckCalculation: jest.fn(),
  getCalculation: jest.fn(),
  deleteCalculation: jest.fn(),
  toggleFavorite: jest.fn(),
  updateCalculation: jest.fn(),
  searchCalculations: jest.fn(),
  clearHistory: jest.fn(),
  duplicateCalculation: jest.fn(),
  getAnalytics: jest.fn()
}

jest.mock('@locumtruerate/calc-core', () => ({
  CalculationHistoryManager: jest.fn(() => mockHistoryManager),
  ContractComparisonEngine: jest.fn(() => ({
    compareContracts: jest.fn(),
    rankContracts: jest.fn(),
    compareTwo: jest.fn(),
    calculateBreakEven: jest.fn()
  })),
  ContractCalculationEngine: jest.fn(() => ({
    calculateContract: jest.fn()
  }))
}))

// Mock tRPC
const mockSaveCalculationMutate = jest.fn()
const mockUpdateCalculationMutate = jest.fn()
const mockDeleteCalculationMutate = jest.fn()
const mockShareCalculationMutate = jest.fn()
const mockRefetchCalculations = jest.fn()

jest.mock('@/trpc/react', () => ({
  api: {
    calculations: {
      save: {
        useMutation: () => ({
          mutateAsync: mockSaveCalculationMutate,
          isLoading: false,
          error: null
        })
      },
      update: {
        useMutation: () => ({
          mutateAsync: mockUpdateCalculationMutate
        })
      },
      delete: {
        useMutation: () => ({
          mutateAsync: mockDeleteCalculationMutate
        })
      },
      share: {
        useMutation: () => ({
          mutateAsync: mockShareCalculationMutate
        })
      },
      getUserCalculations: {
        useQuery: () => ({
          data: [],
          refetch: mockRefetchCalculations,
          isLoading: false,
          error: null
        })
      }
    }
  }
}))

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
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

describe('Calculator State Integration Tests', () => {
  let localStorage: any

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: localStorage,
      writable: true
    })

    // Setup default mock returns
    mockHistoryManager.getRecent.mockResolvedValue([])
    mockHistoryManager.getFavorites.mockResolvedValue([])
    mockHistoryManager.saveContractCalculation.mockResolvedValue({
      id: 'calc-123',
      type: 'contract',
      timestamp: new Date().toISOString()
    })
  })

  describe('useCalculatorState Hook Integration', () => {
    it('initializes with correct default state', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorState(), { wrapper })

      expect(result.current.currentContractResult).toBeNull()
      expect(result.current.currentPaycheckResult).toBeNull()
      expect(result.current.history).toEqual([])
      expect(result.current.savedCalculations).toEqual([])
      expect(result.current.isLoadingHistory).toBe(false)
      expect(result.current.isSavingCalculation).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('loads history on mount', async () => {
      const mockHistory = [
        {
          id: '1',
          type: 'contract' as const,
          name: 'Test Calculation',
          input: { hourlyRate: 150 },
          result: createMockCalculationResult(),
          timestamp: new Date().toISOString()
        }
      ]

      mockHistoryManager.getRecent.mockResolvedValue(mockHistory)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorState(), { wrapper })

      await waitFor(() => {
        expect(result.current.history).toEqual(mockHistory)
      })

      expect(mockHistoryManager.getRecent).toHaveBeenCalledWith(20)
    })

    it('saves contract calculation and updates state', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorState(), { wrapper })

      const contractInput: ContractInput = {
        hourlyRate: 150,
        hoursPerWeek: 40,
        duration: 12,
        location: 'Dallas, TX',
        contractType: 'HOURLY'
      }

      const contractResult = createMockCalculationResult({
        grossPay: 312000,
        netPay: 234000
      })

      const savedCalculation = {
        id: 'calc-123',
        type: 'contract' as const,
        input: contractInput,
        result: contractResult,
        timestamp: new Date().toISOString()
      }

      mockHistoryManager.saveContractCalculation.mockResolvedValue(savedCalculation)

      await act(async () => {
        await result.current.saveContractCalculation(contractInput, contractResult, {
          name: 'Dallas Contract',
          isFavorite: true
        })
      })

      expect(mockHistoryManager.saveContractCalculation).toHaveBeenCalledWith(
        contractInput,
        contractResult,
        {
          name: 'Dallas Contract',
          isFavorite: true
        }
      )

      await waitFor(() => {
        expect(result.current.history).toContainEqual(savedCalculation)
        expect(result.current.savedCalculations).toContainEqual(savedCalculation)
      })
    })

    it('handles calculation loading and state updates', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorState(), { wrapper })

      const calculationData = {
        id: 'calc-123',
        type: 'contract' as const,
        result: createMockCalculationResult()
      }

      mockHistoryManager.getCalculation.mockResolvedValue(calculationData)

      await act(async () => {
        await result.current.loadCalculation('calc-123')
      })

      expect(mockHistoryManager.getCalculation).toHaveBeenCalledWith('calc-123')
      
      await waitFor(() => {
        expect(result.current.currentContractResult).toEqual(calculationData.result)
      })
    })

    it('manages favorites correctly', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorState(), { wrapper })

      const mockFavorites = [
        {
          id: 'fav-1',
          type: 'contract' as const,
          isFavorite: true,
          name: 'Favorite Calculation'
        }
      ]

      mockHistoryManager.getFavorites.mockResolvedValue(mockFavorites)
      mockHistoryManager.toggleFavorite.mockResolvedValue(undefined)

      // Initial load should get favorites
      await waitFor(() => {
        expect(result.current.savedCalculations).toEqual(mockFavorites)
      })

      // Toggle favorite
      await act(async () => {
        await result.current.toggleFavorite('fav-1')
      })

      expect(mockHistoryManager.toggleFavorite).toHaveBeenCalledWith('fav-1')
    })

    it('handles search functionality', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorState(), { wrapper })

      const searchResults = [
        {
          id: 'search-1',
          type: 'contract' as const,
          name: 'Dallas Contract'
        }
      ]

      mockHistoryManager.searchCalculations.mockResolvedValue(searchResults)

      let searchResult: any
      await act(async () => {
        searchResult = await result.current.searchCalculations('Dallas')
      })

      expect(mockHistoryManager.searchCalculations).toHaveBeenCalledWith('Dallas')
      expect(searchResult).toEqual(searchResults)
    })

    it('handles errors in state operations', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorState(), { wrapper })

      const error = new Error('Storage error')
      mockHistoryManager.getRecent.mockRejectedValue(error)

      // Trigger history refresh which should set error
      await act(async () => {
        await result.current.refreshHistory()
      })

      await waitFor(() => {
        expect(result.current.error).toEqual(error)
        expect(result.current.isLoadingHistory).toBe(false)
      })
    })
  })

  describe('useCalculatorPersistence Hook Integration', () => {
    it('saves calculations to database correctly', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      const calculation = {
        id: 'calc-123',
        type: 'contract' as const,
        input: { hourlyRate: 150 },
        result: createMockCalculationResult(),
        name: 'Test Calculation',
        timestamp: new Date().toISOString()
      }

      const savedData = { ...calculation, databaseId: 'db-456' }
      mockSaveCalculationMutate.mockResolvedValue(savedData)

      let saveResult: any
      await act(async () => {
        saveResult = await result.current.saveToDatabase(calculation, {
          isPublic: false,
          expiresInDays: 30
        })
      })

      expect(mockSaveCalculationMutate).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: calculation.type,
        input: calculation.input,
        result: calculation.result,
        name: calculation.name,
        tags: undefined,
        isFavorite: undefined,
        isPublic: false,
        metadata: expect.objectContaining({
          expiresInDays: 30
        })
      })

      expect(saveResult).toEqual(savedData)
    })

    it('exports calculations in different formats', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      const calculation = {
        id: 'calc-123',
        type: 'contract' as const,
        result: createMockCalculationResult()
      }

      // Mock successful export
      const mockBlob = new Blob(['fake pdf content'], { type: 'application/pdf' })
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()

      // Mock document methods
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn()
      }
      const mockAppendChild = jest.fn()
      const mockRemoveChild = jest.fn()

      Object.defineProperty(document, 'createElement', {
        value: () => mockAnchor,
        writable: true
      })
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true
      })
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true
      })

      await act(async () => {
        await result.current.exportCalculation(calculation, 'pdf', {
          includeCharts: true,
          fileName: 'test-calculation.pdf'
        })
      })

      expect(mockAnchor.download).toBe('test-calculation.pdf')
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor)
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor)
    })

    it('handles sharing calculations with link generation', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      const shareResult = {
        id: 'calc-123',
        shareableLink: 'https://example.com/share/calc-123',
        expiresAt: new Date()
      }

      mockShareCalculationMutate.mockResolvedValue(shareResult)

      // Mock clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockResolvedValue(undefined)
        },
        writable: true
      })

      let result_: any
      await act(async () => {
        result_ = await result.current.shareCalculation('calc-123', {
          expiresInDays: 7,
          isPublic: true
        })
      })

      expect(mockShareCalculationMutate).toHaveBeenCalledWith({
        id: 'calc-123',
        userId: mockUser.id,
        expiresInDays: 7,
        isPublic: true
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareResult.shareableLink)
      expect(result_).toEqual(shareResult)
    })

    it('imports calculations from files', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorPersistence(), { wrapper })

      const calculationsData = [
        {
          id: 'import-1',
          type: 'contract',
          name: 'Imported Calculation',
          result: createMockCalculationResult()
        }
      ]

      const mockFile = new File(
        [JSON.stringify(calculationsData)],
        'calculations.json',
        { type: 'application/json' }
      )

      mockSaveCalculationMutate.mockResolvedValue({ id: 'saved-1' })

      let importResult: any
      await act(async () => {
        importResult = await result.current.importCalculations(mockFile)
      })

      expect(mockSaveCalculationMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          type: calculationsData[0].type,
          name: calculationsData[0].name
        })
      )

      expect(importResult).toHaveLength(1)
    })
  })

  describe('useCalculatorComparison Hook Integration', () => {
    it('manages comparison state correctly', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorComparison({ maxComparisons: 3 }), { wrapper })

      expect(result.current.comparisons).toEqual([])
      expect(result.current.comparisonResult).toBeNull()
      expect(result.current.comparisonState.isEmpty).toBe(true)
      expect(result.current.comparisonState.canCompare).toBe(false)
    })

    it('adds and manages contract comparisons', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorComparison(), { wrapper })

      const contractInput1: ContractInput = {
        hourlyRate: 150,
        hoursPerWeek: 40,
        location: 'Dallas, TX',
        contractType: 'HOURLY'
      }

      const contractInput2: ContractInput = {
        hourlyRate: 175,
        hoursPerWeek: 40,
        location: 'NYC, NY',
        contractType: 'HOURLY'
      }

      // Add first contract
      let contract1Id: string | null = null
      await act(() => {
        contract1Id = result.current.addToComparison(contractInput1, {
          name: 'Dallas Contract',
          result: createMockCalculationResult()
        })
      })

      expect(contract1Id).toBeTruthy()
      expect(result.current.comparisons).toHaveLength(1)
      expect(result.current.comparisons[0].name).toBe('Dallas Contract')

      // Add second contract
      let contract2Id: string | null = null
      await act(() => {
        contract2Id = result.current.addToComparison(contractInput2, {
          name: 'NYC Contract',
          result: createMockCalculationResult()
        })
      })

      expect(result.current.comparisons).toHaveLength(2)
      expect(result.current.comparisonState.canCompare).toBe(true)
    })

    it('runs contract comparisons correctly', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorComparison(), { wrapper })

      // Add two contracts with results
      await act(() => {
        result.current.addToComparison(
          { hourlyRate: 150, hoursPerWeek: 40, contractType: 'HOURLY' },
          { result: createMockCalculationResult({ netPay: 200000 }) }
        )
        result.current.addToComparison(
          { hourlyRate: 175, hoursPerWeek: 40, contractType: 'HOURLY' },
          { result: createMockCalculationResult({ netPay: 230000 }) }
        )
      })

      const mockComparisonResult = {
        comparison: {
          bestOverall: 1,
          bestHourlyRate: 1,
          bestNetPay: 1,
          bestBenefits: 0
        },
        metrics: {
          payDifference: {
            highestToLowest: 30000,
            percentageDifference: 15
          },
          benefitsDifference: {
            highestToLowest: 0,
            percentageDifference: 0
          }
        },
        recommendations: ['Consider the NYC contract for higher net pay']
      }

      // Mock comparison engine result
      const mockComparisonEngine = {
        compareContracts: jest.fn().mockResolvedValue(mockComparisonResult)
      }
      
      // Run comparison
      await act(async () => {
        await result.current.runComparison()
      })

      await waitFor(() => {
        expect(result.current.comparisonResult).toBeTruthy()
      })
    })

    it('handles comparison from history items', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorComparison(), { wrapper })

      const historyItem = {
        id: 'hist-123',
        type: 'contract' as const,
        name: 'Historical Contract',
        input: { hourlyRate: 150, contractType: 'HOURLY' },
        result: createMockCalculationResult(),
        timestamp: new Date().toISOString()
      }

      let contractId: string | null = null
      await act(() => {
        contractId = result.current.addFromHistory(historyItem)
      })

      expect(contractId).toBe('hist-123')
      expect(result.current.comparisons[0].name).toBe('Historical Contract')
      expect(result.current.comparisons[0].result).toEqual(historyItem.result)
    })

    it('calculates break-even analysis between contracts', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorComparison(), { wrapper })

      // Add two contracts
      await act(() => {
        result.current.addToComparison(
          { hourlyRate: 150, contractType: 'HOURLY' },
          { 
            id: 'lower-contract',
            result: createMockCalculationResult({ netPay: 200000 })
          }
        )
        result.current.addToComparison(
          { hourlyRate: 175, contractType: 'HOURLY' },
          { 
            id: 'higher-contract',
            result: createMockCalculationResult({ netPay: 230000 })
          }
        )
      })

      const breakEvenResult = {
        monthsToBreakEven: 8,
        additionalCostsRecovered: 15000,
        totalBenefit: 15000
      }

      // Mock comparison engine break-even calculation
      const mockComparisonEngine = {
        calculateBreakEven: jest.fn().mockReturnValue(breakEvenResult)
      }

      const additionalCosts = {
        movingCosts: 5000,
        housingSetupCosts: 10000
      }

      let breakEven: any
      await act(() => {
        breakEven = result.current.calculateBreakEven(
          'higher-contract',
          'lower-contract',
          additionalCosts
        )
      })

      expect(breakEven).toEqual(breakEvenResult)
    })
  })

  describe('Cross-Hook Integration', () => {
    it('integrates state and persistence hooks', async () => {
      const wrapper = createWrapper()
      const stateHook = renderHook(() => useCalculatorState(), { wrapper })
      const persistenceHook = renderHook(() => useCalculatorPersistence(), { wrapper })

      // Save calculation using state hook
      const contractInput: ContractInput = {
        hourlyRate: 150,
        hoursPerWeek: 40,
        contractType: 'HOURLY'
      }
      const contractResult = createMockCalculationResult()

      const savedCalculation = {
        id: 'calc-123',
        type: 'contract' as const,
        input: contractInput,
        result: contractResult,
        timestamp: new Date().toISOString()
      }

      mockHistoryManager.saveContractCalculation.mockResolvedValue(savedCalculation)
      mockSaveCalculationMutate.mockResolvedValue({ id: 'db-456' })

      // Save to local state
      await act(async () => {
        await stateHook.result.current.saveContractCalculation(contractInput, contractResult)
      })

      // Save to database
      await act(async () => {
        await persistenceHook.result.current.saveToDatabase(savedCalculation)
      })

      expect(mockHistoryManager.saveContractCalculation).toHaveBeenCalled()
      expect(mockSaveCalculationMutate).toHaveBeenCalled()
    })

    it('integrates state and comparison hooks', async () => {
      const wrapper = createWrapper()
      const stateHook = renderHook(() => useCalculatorState(), { wrapper })
      const comparisonHook = renderHook(() => useCalculatorComparison(), { wrapper })

      // Setup history in state hook
      const historyItem = {
        id: 'hist-123',
        type: 'contract' as const,
        input: { hourlyRate: 150, contractType: 'HOURLY' },
        result: createMockCalculationResult(),
        timestamp: new Date().toISOString()
      }

      mockHistoryManager.getRecent.mockResolvedValue([historyItem])

      // Wait for history to load
      await waitFor(() => {
        expect(stateHook.result.current.history).toHaveLength(1)
      })

      // Add history item to comparison
      await act(() => {
        comparisonHook.result.current.addFromHistory(historyItem)
      })

      expect(comparisonHook.result.current.comparisons).toHaveLength(1)
      expect(comparisonHook.result.current.comparisons[0].input).toEqual(historyItem.input)
    })
  })

  describe('Data Persistence Across Page Refreshes', () => {
    it('persists calculator state in localStorage', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorState({
        storage: 'localStorage',
        autoSave: true
      }), { wrapper })

      const contractInput: ContractInput = {
        hourlyRate: 150,
        hoursPerWeek: 40,
        contractType: 'HOURLY'
      }
      const contractResult = createMockCalculationResult()

      // Save calculation
      await act(async () => {
        await result.current.saveContractCalculation(contractInput, contractResult)
      })

      // Verify data was stored in localStorage
      expect(localStorage.setItem).toHaveBeenCalled()
      
      // Simulate page refresh by creating new hook instance
      const { result: newResult } = renderHook(() => useCalculatorState({
        storage: 'localStorage'
      }), { wrapper })

      // Should restore from localStorage
      await waitFor(() => {
        expect(newResult.current.history.length).toBeGreaterThan(0)
      })
    })

    it('handles IndexedDB persistence correctly', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCalculatorState({
        storage: 'indexedDB'
      }), { wrapper })

      // Mock IndexedDB operations
      const mockIndexedDB = {
        open: jest.fn(),
        transaction: jest.fn(),
        objectStore: jest.fn()
      }

      Object.defineProperty(window, 'indexedDB', {
        value: mockIndexedDB,
        writable: true
      })

      const contractInput: ContractInput = {
        hourlyRate: 150,
        contractType: 'HOURLY'
      }
      const contractResult = createMockCalculationResult()

      await act(async () => {
        await result.current.saveContractCalculation(contractInput, contractResult)
      })

      // Should use IndexedDB for storage
      expect(mockHistoryManager.saveContractCalculation).toHaveBeenCalled()
    })
  })
})