import {
  CalculationHistoryItem,
  CalculationHistoryStorage,
  CalculationHistoryFilter,
  CalculationHistorySort,
  CalculationHistoryPage,
} from './types'

export class IndexedDBHistory implements CalculationHistoryStorage {
  private readonly dbName = 'LocumTrueRateDB'
  private readonly storeName = 'calculations'
  private readonly version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not available')
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          
          // Create indexes for efficient querying
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('userId', 'userId', { unique: false })
          store.createIndex('isFavorite', 'isFavorite', { unique: false })
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB')
    }
    return this.db
  }

  async save(item: CalculationHistoryItem): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      // Convert Date to ISO string for storage
      const storedItem = {
        ...item,
        timestamp: item.timestamp.toISOString(),
        expiresAt: item.expiresAt?.toISOString(),
      }
      
      const request = store.add(storedItem)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async update(id: string, updates: Partial<CalculationHistoryItem>): Promise<void> {
    const db = await this.ensureDB()
    const existing = await this.get(id)
    
    if (!existing) {
      throw new Error(`Calculation with id ${id} not found`)
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const updated = {
        ...existing,
        ...updates,
        id, // Ensure ID doesn't change
        timestamp: existing.timestamp.toISOString(),
        expiresAt: updates.expiresAt?.toISOString() || existing.expiresAt?.toISOString(),
      }
      
      const request = store.put(updated)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async delete(id: string): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get(id: string): Promise<CalculationHistoryItem | null> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)
      
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          resolve(this.deserializeItem(result))
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async list(
    filter?: CalculationHistoryFilter,
    sort?: CalculationHistorySort,
    pagination?: { page: number; pageSize: number }
  ): Promise<CalculationHistoryPage> {
    const db = await this.ensureDB()
    const items: CalculationHistoryItem[] = []
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      // Use index if filtering by indexed field
      let source: IDBObjectStore | IDBIndex = store
      if (filter?.type && !Array.isArray(filter.type)) {
        source = store.index('type')
      } else if (filter?.userId) {
        source = store.index('userId')
      } else if (filter?.isFavorite !== undefined) {
        source = store.index('isFavorite')
      }
      
      const request = source.openCursor()
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        
        if (cursor) {
          const item = this.deserializeItem(cursor.value)
          
          // Apply additional filters
          if (!filter || this.matchesFilter(item, filter)) {
            items.push(item)
          }
          
          cursor.continue()
        } else {
          // All items loaded, now sort and paginate
          let sorted = items
          
          if (sort) {
            sorted = this.applySort(items, sort)
          } else {
            // Default sort by timestamp desc
            sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          }
          
          const page = pagination?.page || 1
          const pageSize = pagination?.pageSize || 20
          const start = (page - 1) * pageSize
          const end = start + pageSize
          
          const paginatedItems = sorted.slice(start, end)
          
          resolve({
            items: paginatedItems,
            total: sorted.length,
            page,
            pageSize,
            hasMore: end < sorted.length,
          })
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async clear(filter?: CalculationHistoryFilter): Promise<void> {
    const db = await this.ensureDB()
    
    if (!filter) {
      // Clear all
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.clear()
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
    
    // Clear with filter
    const toDelete = await this.list(filter)
    const deletePromises = toDelete.items.map(item => this.delete(item.id))
    await Promise.all(deletePromises)
  }

  async export(): Promise<CalculationHistoryItem[]> {
    const db = await this.ensureDB()
    const items: CalculationHistoryItem[] = []
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.openCursor()
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        
        if (cursor) {
          items.push(this.deserializeItem(cursor.value))
          cursor.continue()
        } else {
          resolve(items)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async import(items: CalculationHistoryItem[]): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      let completed = 0
      const total = items.length
      
      items.forEach(item => {
        const storedItem = {
          ...item,
          timestamp: item.timestamp.toISOString(),
          expiresAt: item.expiresAt?.toISOString(),
        }
        
        const request = store.put(storedItem)
        
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
        
        request.onerror = () => reject(request.error)
      })
      
      if (total === 0) {
        resolve()
      }
    })
  }

  private deserializeItem(data: any): CalculationHistoryItem {
    return {
      ...data,
      timestamp: new Date(data.timestamp),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    }
  }

  private matchesFilter(
    item: CalculationHistoryItem,
    filter: CalculationHistoryFilter
  ): boolean {
    // Type filter
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type]
      if (!types.includes(item.type)) return false
    }
    
    // User filter
    if (filter.userId && item.userId !== filter.userId) {
      return false
    }
    
    // Date range filter
    if (filter.startDate && item.timestamp < filter.startDate) {
      return false
    }
    if (filter.endDate && item.timestamp > filter.endDate) {
      return false
    }
    
    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      if (!item.tags || !filter.tags.some(tag => item.tags!.includes(tag))) {
        return false
      }
    }
    
    // Favorite filter
    if (filter.isFavorite !== undefined && item.isFavorite !== filter.isFavorite) {
      return false
    }
    
    // Search query filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      const searchableText = [
        item.name,
        item.description,
        JSON.stringify(item.input),
        item.tags?.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      
      if (!searchableText.includes(query)) {
        return false
      }
    }
    
    return true
  }

  private applySort(
    items: CalculationHistoryItem[],
    sort: CalculationHistorySort
  ): CalculationHistoryItem[] {
    const sorted = [...items]
    
    sorted.sort((a, b) => {
      let comparison = 0
      
      switch (sort.field) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime()
          break
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '')
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }
      
      return sort.direction === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }

  // Utility method to get database size
  async getDatabaseSize(): Promise<number> {
    if (!('estimate' in navigator.storage)) {
      return 0
    }
    
    const estimate = await navigator.storage.estimate()
    return estimate.usage || 0
  }

  // Clean up expired items
  async cleanupExpired(): Promise<void> {
    const db = await this.ensureDB()
    const now = new Date()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.openCursor()
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        
        if (cursor) {
          const item = cursor.value
          if (item.expiresAt && new Date(item.expiresAt) < now) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }
}