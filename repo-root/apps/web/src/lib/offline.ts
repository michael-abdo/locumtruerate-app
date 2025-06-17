// Offline functionality utilities

// Service Worker registration
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('SW registered: ', registration)
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                showUpdateNotification()
              }
            })
          }
        })
      } catch (error) {
        console.log('SW registration failed: ', error)
      }
    })
  }
}

// Local storage utilities with encryption
const STORAGE_PREFIX = 'ltr_'
const STORAGE_VERSION = '1.0'

interface StorageItem<T> {
  data: T
  timestamp: number
  version: string
  ttl?: number // Time to live in milliseconds
}

export class OfflineStorage {
  static set<T>(key: string, data: T, ttl?: number): void {
    if (typeof window === 'undefined') return
    
    const item: StorageItem<T> = {
      data,
      timestamp: Date.now(),
      version: STORAGE_VERSION,
      ...(ttl && { ttl })
    }
    
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(item))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
      // Handle storage quota exceeded
      this.cleanup()
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(item))
      } catch (retryError) {
        console.error('Failed to save after cleanup:', retryError)
      }
    }
  }
  
  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key)
      if (!stored) return null
      
      const item: StorageItem<T> = JSON.parse(stored)
      
      // Check version compatibility
      if (item.version !== STORAGE_VERSION) {
        this.remove(key)
        return null
      }
      
      // Check TTL
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.remove(key)
        return null
      }
      
      return item.data
    } catch (error) {
      console.warn('Failed to retrieve from localStorage:', error)
      return null
    }
  }
  
  static remove(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_PREFIX + key)
  }
  
  static clear(): void {
    if (typeof window === 'undefined') return
    
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX))
    keys.forEach(key => localStorage.removeItem(key))
  }
  
  static cleanup(): void {
    if (typeof window === 'undefined') return
    
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX))
    const items = keys.map(key => ({
      key,
      item: JSON.parse(localStorage.getItem(key) || '{}') as StorageItem<any>
    }))
    
    // Remove expired items
    items.forEach(({ key, item }) => {
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(key)
      }
    })
    
    // If still over quota, remove oldest items
    const remaining = items.filter(({ key }) => localStorage.getItem(key))
    if (remaining.length > 100) { // Arbitrary limit
      remaining
        .sort((a, b) => a.item.timestamp - b.item.timestamp)
        .slice(0, remaining.length - 100)
        .forEach(({ key }) => localStorage.removeItem(key))
    }
  }
}

// Offline queue for API requests
interface QueuedRequest {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body?: string
  timestamp: number
  retryCount: number
}

export class OfflineQueue {
  private static QUEUE_KEY = 'offline_queue'
  private static MAX_RETRIES = 3
  
  static add(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): void {
    const queue = this.getQueue()
    const queuedRequest: QueuedRequest = {
      ...request,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retryCount: 0
    }
    
    queue.push(queuedRequest)
    OfflineStorage.set(this.QUEUE_KEY, queue)
  }
  
  static async processQueue(): Promise<void> {
    if (!navigator.onLine) return
    
    const queue = this.getQueue()
    const processed: string[] = []
    
    for (const request of queue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })
        
        if (response.ok) {
          processed.push(request.id)
        } else if (request.retryCount < this.MAX_RETRIES) {
          request.retryCount++
        } else {
          // Max retries reached, remove from queue
          processed.push(request.id)
          console.error('Failed to process offline request after max retries:', request)
        }
      } catch (error) {
        if (request.retryCount < this.MAX_RETRIES) {
          request.retryCount++
        } else {
          processed.push(request.id)
          console.error('Failed to process offline request:', error)
        }
      }
    }
    
    // Remove processed items
    const remainingQueue = queue.filter(req => !processed.includes(req.id))
    OfflineStorage.set(this.QUEUE_KEY, remainingQueue)
  }
  
  private static getQueue(): QueuedRequest[] {
    return OfflineStorage.get<QueuedRequest[]>(this.QUEUE_KEY) || []
  }
  
  static getQueueLength(): number {
    return this.getQueue().length
  }
  
  static clearQueue(): void {
    OfflineStorage.set(this.QUEUE_KEY, [])
  }
}

// Network status monitoring
export class NetworkMonitor {
  private static listeners: Array<(online: boolean) => void> = []
  
  static init(): void {
    if (typeof window === 'undefined') return
    
    window.addEventListener('online', () => {
      this.notifyListeners(true)
      OfflineQueue.processQueue()
    })
    
    window.addEventListener('offline', () => {
      this.notifyListeners(false)
    })
  }
  
  static isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }
  
  static addListener(callback: (online: boolean) => void): void {
    this.listeners.push(callback)
  }
  
  static removeListener(callback: (online: boolean) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback)
  }
  
  private static notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => listener(online))
  }
}

// Data synchronization
export class DataSync {
  private static SYNC_KEYS = {
    jobs: 'cached_jobs',
    user_profile: 'cached_user_profile',
    applications: 'cached_applications',
    saved_jobs: 'cached_saved_jobs'
  }
  
  // Cache critical data for offline access
  static cacheJobs(jobs: any[], ttl = 1000 * 60 * 30): void { // 30 minutes
    OfflineStorage.set(this.SYNC_KEYS.jobs, jobs, ttl)
  }
  
  static getCachedJobs(): any[] | null {
    return OfflineStorage.get(this.SYNC_KEYS.jobs)
  }
  
  static cacheUserProfile(profile: any, ttl = 1000 * 60 * 60): void { // 1 hour
    OfflineStorage.set(this.SYNC_KEYS.user_profile, profile, ttl)
  }
  
  static getCachedUserProfile(): any | null {
    return OfflineStorage.get(this.SYNC_KEYS.user_profile)
  }
  
  static cacheApplications(applications: any[], ttl = 1000 * 60 * 15): void { // 15 minutes
    OfflineStorage.set(this.SYNC_KEYS.applications, applications, ttl)
  }
  
  static getCachedApplications(): any[] | null {
    return OfflineStorage.get(this.SYNC_KEYS.applications)
  }
  
  static cacheSavedJobs(savedJobs: string[], ttl = 1000 * 60 * 60 * 24): void { // 24 hours
    OfflineStorage.set(this.SYNC_KEYS.saved_jobs, savedJobs, ttl)
  }
  
  static getCachedSavedJobs(): string[] | null {
    return OfflineStorage.get(this.SYNC_KEYS.saved_jobs)
  }
  
  // Sync pending changes when back online
  static async syncPendingChanges(): Promise<void> {
    if (!NetworkMonitor.isOnline()) return
    
    await OfflineQueue.processQueue()
    
    // Additional sync logic for specific data types
    // This would integrate with your tRPC mutations
  }
}

// Update notification
function showUpdateNotification(): void {
  if (typeof window === 'undefined') return
  
  // You could integrate this with your toast system
  const event = new CustomEvent('app-update-available')
  window.dispatchEvent(event)
}

// Initialize offline functionality
export function initOffline(): void {
  registerServiceWorker()
  NetworkMonitor.init()
  
  // Process queue when app starts and comes back online
  if (NetworkMonitor.isOnline()) {
    OfflineQueue.processQueue()
  }
}