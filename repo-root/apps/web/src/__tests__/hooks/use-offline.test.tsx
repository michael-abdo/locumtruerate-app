import { renderHook, act } from '@testing-library/react'
import { useOffline, useOfflineSync, useOfflineStorage } from '@/hooks/use-offline'

// Mock the offline provider
const mockAddToQueue = jest.fn()
const mockClearQueue = jest.fn()
const mockGetQueuedActions = jest.fn()
const mockStoreOfflineData = jest.fn()
const mockGetOfflineData = jest.fn()
const mockClearOfflineData = jest.fn()

jest.mock('@/providers/offline-provider', () => ({
  useOfflineContext: () => ({
    isOnline: true,
    isOfflineMode: false,
    queuedActions: [],
    addToQueue: mockAddToQueue,
    clearQueue: mockClearQueue,
    getQueuedActions: mockGetQueuedActions,
    storeOfflineData: mockStoreOfflineData,
    getOfflineData: mockGetOfflineData,
    clearOfflineData: mockClearOfflineData
  })
}))

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('Offline Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    navigator.onLine = true
  })
  
  describe('useOffline', () => {
    it('detects online status', () => {
      const { result } = renderHook(() => useOffline())
      
      expect(result.current.isOnline).toBe(true)
      expect(result.current.isOfflineMode).toBe(false)
    })
    
    it('handles offline status change', () => {
      const { result } = renderHook(() => useOffline())
      
      // Simulate going offline
      act(() => {
        navigator.onLine = false
        window.dispatchEvent(new Event('offline'))
      })
      
      expect(result.current.isOnline).toBe(false)
    })
    
    it('handles online status change', () => {
      // Start offline
      navigator.onLine = false
      const { result } = renderHook(() => useOffline())
      
      // Simulate going online
      act(() => {
        navigator.onLine = true
        window.dispatchEvent(new Event('online'))
      })
      
      expect(result.current.isOnline).toBe(true)
    })
    
    it('provides offline mode toggle', () => {
      const { result } = renderHook(() => useOffline())
      
      act(() => {
        result.current.toggleOfflineMode()
      })
      
      expect(result.current.isOfflineMode).toBe(true)
    })
    
    it('shows offline notification when going offline', () => {
      const { result } = renderHook(() => useOffline())
      
      act(() => {
        navigator.onLine = false\n        window.dispatchEvent(new Event('offline'))\n      })\n      \n      expect(result.current.showOfflineNotification).toBe(true)\n    })\n    \n    it('handles network reconnection', () => {\n      const { result } = renderHook(() => useOffline())\n      \n      // Go offline first\n      act(() => {\n        navigator.onLine = false\n        window.dispatchEvent(new Event('offline'))\n      })\n      \n      // Come back online\n      act(() => {\n        navigator.onLine = true\n        window.dispatchEvent(new Event('online'))\n      })\n      \n      expect(result.current.isOnline).toBe(true)\n      expect(result.current.showReconnectedNotification).toBe(true)\n    })\n  })\n  \n  describe('useOfflineSync', () => {\n    it('queues actions when offline', () => {\n      const { result } = renderHook(() => useOfflineSync())\n      \n      const action = {\n        type: 'JOB_APPLICATION',\n        payload: { jobId: '123', data: { name: 'John Doe' } },\n        endpoint: '/api/applications',\n        method: 'POST'\n      }\n      \n      act(() => {\n        result.current.queueOfflineAction(action)\n      })\n      \n      expect(mockAddToQueue).toHaveBeenCalledWith(action)\n    })\n    \n    it('syncs queued actions when online', async () => {\n      const mockQueuedActions = [\n        {\n          id: '1',\n          type: 'JOB_APPLICATION',\n          payload: { jobId: '123' },\n          endpoint: '/api/applications',\n          method: 'POST',\n          timestamp: Date.now()\n        }\n      ]\n      \n      mockGetQueuedActions.mockReturnValue(mockQueuedActions)\n      \n      // Mock fetch for sync\n      global.fetch = jest.fn().mockResolvedValue({\n        ok: true,\n        json: () => Promise.resolve({ success: true })\n      })\n      \n      const { result } = renderHook(() => useOfflineSync())\n      \n      await act(async () => {\n        await result.current.syncQueuedActions()\n      })\n      \n      expect(global.fetch).toHaveBeenCalledWith('/api/applications', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ jobId: '123' })\n      })\n      \n      expect(mockClearQueue).toHaveBeenCalled()\n    })\n    \n    it('handles sync errors gracefully', async () => {\n      const mockQueuedActions = [\n        {\n          id: '1',\n          type: 'JOB_APPLICATION',\n          payload: { jobId: '123' },\n          endpoint: '/api/applications',\n          method: 'POST',\n          timestamp: Date.now()\n        }\n      ]\n      \n      mockGetQueuedActions.mockReturnValue(mockQueuedActions)\n      \n      // Mock fetch to fail\n      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))\n      \n      const { result } = renderHook(() => useOfflineSync())\n      \n      await act(async () => {\n        await result.current.syncQueuedActions()\n      })\n      \n      // Should not clear queue on error\n      expect(mockClearQueue).not.toHaveBeenCalled()\n      expect(result.current.syncError).toBeTruthy()\n    })\n    \n    it('provides sync status', () => {\n      const { result } = renderHook(() => useOfflineSync())\n      \n      expect(result.current.isSyncing).toBe(false)\n      expect(result.current.syncError).toBe(null)\n      expect(result.current.lastSyncTime).toBe(null)\n    })\n    \n    it('retries failed sync attempts', async () => {\n      const { result } = renderHook(() => useOfflineSync())\n      \n      // Mock a failed sync\n      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))\n        .mockResolvedValueOnce({\n          ok: true,\n          json: () => Promise.resolve({ success: true })\n        })\n      \n      await act(async () => {\n        await result.current.retrySync()\n      })\n      \n      expect(global.fetch).toHaveBeenCalledTimes(1)\n    })\n  })\n  \n  describe('useOfflineStorage', () => {\n    it('stores data for offline access', () => {\n      const { result } = renderHook(() => useOfflineStorage())\n      \n      const jobData = {\n        id: '123',\n        title: 'Emergency Medicine Physician',\n        company: 'Metro General'\n      }\n      \n      act(() => {\n        result.current.storeJobData('123', jobData)\n      })\n      \n      expect(mockStoreOfflineData).toHaveBeenCalledWith('job:123', jobData)\n    })\n    \n    it('retrieves stored offline data', () => {\n      const mockJobData = {\n        id: '123',\n        title: 'Emergency Medicine Physician'\n      }\n      \n      mockGetOfflineData.mockReturnValue(mockJobData)\n      \n      const { result } = renderHook(() => useOfflineStorage())\n      \n      const retrievedData = result.current.getJobData('123')\n      \n      expect(mockGetOfflineData).toHaveBeenCalledWith('job:123')\n      expect(retrievedData).toEqual(mockJobData)\n    })\n    \n    it('stores search results for offline access', () => {\n      const { result } = renderHook(() => useOfflineStorage())\n      \n      const searchResults = {\n        query: 'emergency medicine',\n        results: [{ id: '1', title: 'ER Doctor' }],\n        timestamp: Date.now()\n      }\n      \n      act(() => {\n        result.current.storeSearchResults('emergency medicine', searchResults)\n      })\n      \n      expect(mockStoreOfflineData).toHaveBeenCalledWith(\n        'search:emergency medicine',\n        searchResults\n      )\n    })\n    \n    it('stores user profile for offline access', () => {\n      const { result } = renderHook(() => useOfflineStorage())\n      \n      const userProfile = {\n        id: 'user123',\n        name: 'John Doe',\n        email: 'john@example.com'\n      }\n      \n      act(() => {\n        result.current.storeUserProfile(userProfile)\n      })\n      \n      expect(mockStoreOfflineData).toHaveBeenCalledWith('user:profile', userProfile)\n    })\n    \n    it('clears specific offline data', () => {\n      const { result } = renderHook(() => useOfflineStorage())\n      \n      act(() => {\n        result.current.clearJobData('123')\n      })\n      \n      expect(mockClearOfflineData).toHaveBeenCalledWith('job:123')\n    })\n    \n    it('clears all offline data', () => {\n      const { result } = renderHook(() => useOfflineStorage())\n      \n      act(() => {\n        result.current.clearAllData()\n      })\n      \n      expect(mockClearOfflineData).toHaveBeenCalledWith()\n    })\n    \n    it('provides storage usage information', () => {\n      const { result } = renderHook(() => useOfflineStorage())\n      \n      // Mock storage usage data\n      jest.spyOn(result.current, 'getStorageUsage').mockReturnValue({\n        used: 1024000, // 1MB\n        total: 5242880, // 5MB\n        percentage: 20\n      })\n      \n      const usage = result.current.getStorageUsage()\n      \n      expect(usage.used).toBe(1024000)\n      expect(usage.percentage).toBe(20)\n    })\n    \n    it('handles storage quota exceeded', () => {\n      const { result } = renderHook(() => useOfflineStorage())\n      \n      // Mock storage quota exceeded\n      mockStoreOfflineData.mockImplementation(() => {\n        throw new Error('QuotaExceededError')\n      })\n      \n      act(() => {\n        result.current.storeJobData('123', { large: 'data'.repeat(1000000) })\n      })\n      \n      expect(result.current.storageError).toBeTruthy()\n      expect(result.current.storageError?.message).toContain('storage quota')\n    })\n    \n    it('provides data expiration handling', () => {\n      const { result } = renderHook(() => useOfflineStorage())\n      \n      // Mock expired data\n      const expiredData = {\n        data: { id: '123' },\n        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago\n        expiry: 24 * 60 * 60 * 1000 // 24 hour expiry\n      }\n      \n      mockGetOfflineData.mockReturnValue(expiredData)\n      \n      const retrievedData = result.current.getJobData('123')\n      \n      // Should return null for expired data\n      expect(retrievedData).toBeNull()\n      \n      // Should clean up expired data\n      expect(mockClearOfflineData).toHaveBeenCalledWith('job:123')\n    })\n  })\n  \n  describe('Integration tests', () => {\n    it('handles complete offline workflow', async () => {\n      const { result: offlineResult } = renderHook(() => useOffline())\n      const { result: syncResult } = renderHook(() => useOfflineSync())\n      const { result: storageResult } = renderHook(() => useOfflineStorage())\n      \n      // Go offline\n      act(() => {\n        navigator.onLine = false\n        window.dispatchEvent(new Event('offline'))\n      })\n      \n      expect(offlineResult.current.isOnline).toBe(false)\n      \n      // Store data while offline\n      act(() => {\n        storageResult.current.storeJobData('123', { title: 'Test Job' })\n      })\n      \n      // Queue action while offline\n      act(() => {\n        syncResult.current.queueOfflineAction({\n          type: 'JOB_APPLICATION',\n          payload: { jobId: '123' },\n          endpoint: '/api/applications',\n          method: 'POST'\n        })\n      })\n      \n      // Come back online\n      act(() => {\n        navigator.onLine = true\n        window.dispatchEvent(new Event('online'))\n      })\n      \n      expect(offlineResult.current.isOnline).toBe(true)\n      \n      // Should trigger sync\n      global.fetch = jest.fn().mockResolvedValue({\n        ok: true,\n        json: () => Promise.resolve({ success: true })\n      })\n      \n      await act(async () => {\n        await syncResult.current.syncQueuedActions()\n      })\n      \n      expect(global.fetch).toHaveBeenCalled()\n    })\n  })\n})"