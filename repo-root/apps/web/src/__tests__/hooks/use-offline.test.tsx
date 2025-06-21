import { renderHook, act } from '@testing-library/react'
import { useOffline } from '@/hooks/use-offline'

// Mock the offline storage utilities
jest.mock('@/lib/offline-storage', () => ({
  storeOfflineData: jest.fn(),
  getOfflineData: jest.fn(),
  clearOfflineData: jest.fn(),
  addToQueue: jest.fn(),
  getQueuedActions: jest.fn(),
  clearQueue: jest.fn()
}))

const mockStoreOfflineData = jest.fn()
const mockGetOfflineData = jest.fn()
const mockClearOfflineData = jest.fn()
const mockAddToQueue = jest.fn()
const mockGetQueuedActions = jest.fn()
const mockClearQueue = jest.fn()

// Mock navigator.onLine
let mockOnlineStatus = true
Object.defineProperty(navigator, 'onLine', {
  get() {
    return mockOnlineStatus
  },
  configurable: true
})

describe('useOffline Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnlineStatus = true
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Network Status Detection', () => {
    it('detects online status correctly', () => {
      const { result } = renderHook(() => useOffline())
      
      expect(result.current.isOffline).toBe(false)
      expect(result.current.showOfflineNotification).toBe(false)
    })

    it('detects offline status and shows notification', () => {
      const { result } = renderHook(() => useOffline())
      
      act(() => {
        mockOnlineStatus = false
        window.dispatchEvent(new Event('offline'))
      })
      
      expect(result.current.isOffline).toBe(true)
    })

    it('handles network reconnection', () => {
      const { result } = renderHook(() => useOffline())
      
      // Go offline first
      act(() => {
        mockOnlineStatus = false
        window.dispatchEvent(new Event('offline'))
      })
      
      // Come back online
      act(() => {
        mockOnlineStatus = true
        window.dispatchEvent(new Event('online'))
      })
      
      expect(result.current.isOffline).toBe(false)
      expect(result.current.isOffline).toBe(false)
    })
  })
})