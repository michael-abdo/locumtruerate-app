'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { NetworkMonitor, OfflineQueue, DataSync, initOffline } from '@/lib/offline'

interface OfflineContextType {
  isOnline: boolean
  queueLength: number
  syncPendingChanges: () => Promise<void>
  getCachedData: (key: string) => any
  cacheData: (key: string, data: any, ttl?: number) => void
}

const OfflineContext = createContext<OfflineContextType | null>(null)

interface OfflineProviderProps {
  children: ReactNode
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [queueLength, setQueueLength] = useState(0)
  
  useEffect(() => {
    // Initialize offline functionality
    initOffline()
    
    // Set initial state
    setIsOnline(NetworkMonitor.isOnline())
    setQueueLength(OfflineQueue.getQueueLength())
    
    // Listen for network changes
    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online)
      
      if (online) {
        // Process queued requests when back online
        OfflineQueue.processQueue().then(() => {
          setQueueLength(OfflineQueue.getQueueLength())
        })
      }
    }
    
    NetworkMonitor.addListener(handleNetworkChange)
    
    // Listen for app updates
    const handleAppUpdate = () => {
      // Show update notification or handle app update
      console.log('App update available')
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('app-update-available', handleAppUpdate)
    }
    
    // Periodic sync check
    const syncInterval = setInterval(() => {
      if (NetworkMonitor.isOnline()) {
        DataSync.syncPendingChanges()
        setQueueLength(OfflineQueue.getQueueLength())
      }
    }, 30000) // Check every 30 seconds
    
    return () => {
      NetworkMonitor.removeListener(handleNetworkChange)
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('app-update-available', handleAppUpdate)
      }
      
      clearInterval(syncInterval)
    }
  }, [])
  
  const syncPendingChanges = async () => {
    await DataSync.syncPendingChanges()
    setQueueLength(OfflineQueue.getQueueLength())
  }
  
  const getCachedData = (key: string) => {
    switch (key) {
      case 'jobs':
        return DataSync.getCachedJobs()
      case 'user_profile':
        return DataSync.getCachedUserProfile()
      case 'applications':
        return DataSync.getCachedApplications()
      case 'saved_jobs':
        return DataSync.getCachedSavedJobs()
      default:
        return null
    }
  }
  
  const cacheData = (key: string, data: any, ttl?: number) => {
    switch (key) {
      case 'jobs':
        DataSync.cacheJobs(data, ttl)
        break
      case 'user_profile':
        DataSync.cacheUserProfile(data, ttl)
        break
      case 'applications':
        DataSync.cacheApplications(data, ttl)
        break
      case 'saved_jobs':
        DataSync.cacheSavedJobs(data, ttl)
        break
    }
  }
  
  const value: OfflineContextType = {
    isOnline,
    queueLength,
    syncPendingChanges,
    getCachedData,
    cacheData
  }
  
  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}

// Hook for offline-aware API calls
export function useOfflineQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  options?: {
    enabled?: boolean
    ttl?: number
    fallbackData?: T
  }
) {
  const { isOnline, getCachedData, cacheData } = useOffline()
  const [data, setData] = useState<T | null>(options?.fallbackData || null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        if (isOnline && (options?.enabled !== false)) {
          // Try network first
          const networkData = await queryFn()
          setData(networkData)
          
          // Cache the result
          cacheData(cacheKey, networkData, options?.ttl)
        } else {
          // Use cached data when offline
          const cachedData = getCachedData(cacheKey)
          if (cachedData) {
            setData(cachedData)
          } else if (options?.fallbackData) {
            setData(options.fallbackData)
          } else {
            throw new Error('No cached data available')
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        
        // Try cached data as fallback
        const cachedData = getCachedData(cacheKey)
        if (cachedData) {
          setData(cachedData)
          setError(null) // Clear error if we have cached data
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [isOnline, cacheKey, options?.enabled])
  
  return { data, isLoading, error, refetch: () => loadData() }
}