import {
  CalculationHistoryItem,
  CalculationHistoryStorage,
  CalculationHistoryFilter,
  CalculationHistorySort,
  CalculationHistoryPage,
} from './types'

export class LocalStorageHistory implements CalculationHistoryStorage {
  private readonly storageKey = 'locumtruerate_calculation_history'
  private readonly maxItems = 1000
  private readonly defaultPageSize = 20

  async save(item: CalculationHistoryItem): Promise<void> {
    const history = await this.getAllItems()
    
    // Add new item at the beginning
    history.unshift(item)
    
    // Trim to max items
    if (history.length > this.maxItems) {
      history.splice(this.maxItems)
    }
    
    await this.saveAllItems(history)
  }

  async update(id: string, updates: Partial<CalculationHistoryItem>): Promise<void> {
    const history = await this.getAllItems()
    const index = history.findIndex(item => item.id === id)
    
    if (index === -1) {
      throw new Error(`Calculation with id ${id} not found`)
    }
    
    history[index] = {
      ...history[index],
      ...updates,
      id, // Ensure ID doesn't change
    }
    
    await this.saveAllItems(history)
  }

  async delete(id: string): Promise<void> {
    const history = await this.getAllItems()
    const filtered = history.filter(item => item.id !== id)
    
    if (filtered.length === history.length) {
      throw new Error(`Calculation with id ${id} not found`)
    }
    
    await this.saveAllItems(filtered)
  }

  async get(id: string): Promise<CalculationHistoryItem | null> {
    const history = await this.getAllItems()
    return history.find(item => item.id === id) || null
  }

  async list(
    filter?: CalculationHistoryFilter,
    sort?: CalculationHistorySort,
    pagination?: { page: number; pageSize: number }
  ): Promise<CalculationHistoryPage> {
    let history = await this.getAllItems()
    
    // Apply filters
    if (filter) {
      history = this.applyFilter(history, filter)
    }
    
    // Apply sorting
    if (sort) {
      history = this.applySort(history, sort)
    }
    
    // Apply pagination
    const page = pagination?.page || 1
    const pageSize = pagination?.pageSize || this.defaultPageSize
    const start = (page - 1) * pageSize
    const end = start + pageSize
    
    const items = history.slice(start, end)
    
    return {
      items,
      total: history.length,
      page,
      pageSize,
      hasMore: end < history.length,
    }
  }

  async clear(filter?: CalculationHistoryFilter): Promise<void> {
    if (!filter) {
      // Clear all
      await this.saveAllItems([])
      return
    }
    
    const history = await this.getAllItems()
    const filtered = history.filter(item => !this.matchesFilter(item, filter))
    await this.saveAllItems(filtered)
  }

  async export(): Promise<CalculationHistoryItem[]> {
    return this.getAllItems()
  }

  async import(items: CalculationHistoryItem[]): Promise<void> {
    const existing = await this.getAllItems()
    const existingIds = new Set(existing.map(item => item.id))
    
    // Only add items that don't already exist
    const newItems = items.filter(item => !existingIds.has(item.id))
    
    const combined = [...existing, ...newItems]
    
    // Sort by timestamp and trim to max items
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    if (combined.length > this.maxItems) {
      combined.splice(this.maxItems)
    }
    
    await this.saveAllItems(combined)
  }

  private async getAllItems(): Promise<CalculationHistoryItem[]> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return []
    }
    
    try {
      const data = localStorage.getItem(this.storageKey)
      if (!data) return []
      
      const parsed = JSON.parse(data)
      
      // Convert date strings back to Date objects
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
      }))
    } catch (error) {
      console.error('Failed to parse calculation history:', error)
      return []
    }
  }

  private async saveAllItems(items: CalculationHistoryItem[]): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    
    try {
      const data = JSON.stringify(items)
      localStorage.setItem(this.storageKey, data)
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Remove oldest items and try again
        const trimmed = items.slice(0, Math.floor(items.length * 0.8))
        localStorage.setItem(this.storageKey, JSON.stringify(trimmed))
      } else {
        throw error
      }
    }
  }

  private applyFilter(
    items: CalculationHistoryItem[],
    filter: CalculationHistoryFilter
  ): CalculationHistoryItem[] {
    return items.filter(item => this.matchesFilter(item, filter))
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
    const itemDate = new Date(item.timestamp)
    if (filter.startDate && itemDate < filter.startDate) {
      return false
    }
    if (filter.endDate && itemDate > filter.endDate) {
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
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
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

  // Utility method to get storage size
  getStorageSize(): number {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 0
    }
    
    const data = localStorage.getItem(this.storageKey)
    return data ? new Blob([data]).size : 0
  }

  // Utility method to compress old items
  async compressOldItems(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const history = await this.getAllItems()
    
    const compressed = history.map(item => {
      const itemDate = new Date(item.timestamp)
      
      if (itemDate < cutoffDate && !item.isFavorite) {
        // Remove result data for old items to save space
        const { result, ...compressed } = item
        return compressed as CalculationHistoryItem
      }
      
      return item
    })
    
    await this.saveAllItems(compressed)
  }
}