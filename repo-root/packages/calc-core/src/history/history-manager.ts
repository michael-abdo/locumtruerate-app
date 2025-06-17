import { v4 as uuidv4 } from 'uuid'
import {
  CalculationHistoryItem,
  CalculationHistoryStorage,
  CalculationHistoryFilter,
  CalculationHistorySort,
  CalculationHistoryPage,
  SavedCalculation,
  CalculationHistoryAnalytics,
} from './types'
import { LocalStorageHistory } from './local-storage'
import { IndexedDBHistory } from './indexed-db'
import { ContractInput, PaycheckInput, ContractResult, PaycheckResult } from '../types'

export class CalculationHistoryManager {
  private storage: CalculationHistoryStorage
  private userId?: string

  constructor(options?: {
    storage?: 'localStorage' | 'indexedDB'
    userId?: string
  }) {
    this.userId = options?.userId
    
    // Choose storage backend based on availability and preference
    if (options?.storage === 'indexedDB' && typeof window !== 'undefined' && window.indexedDB) {
      this.storage = new IndexedDBHistory()
    } else {
      this.storage = new LocalStorageHistory()
    }
  }

  async saveCalculation(
    type: CalculationHistoryItem['type'],
    input: any,
    result: any,
    options?: {
      name?: string
      tags?: string[]
      isFavorite?: boolean
      metadata?: CalculationHistoryItem['metadata']
    }
  ): Promise<CalculationHistoryItem> {
    const item: CalculationHistoryItem = {
      id: uuidv4(),
      type,
      input,
      result,
      timestamp: new Date(),
      userId: this.userId,
      ...options,
    }
    
    await this.storage.save(item)
    return item
  }

  async saveContractCalculation(
    input: ContractInput,
    result: ContractResult,
    options?: Parameters<typeof this.saveCalculation>[3]
  ): Promise<CalculationHistoryItem> {
    return this.saveCalculation('contract', input, result, {
      name: options?.name || `Contract - ${input.location} - $${input.hourlyRate}/hr`,
      tags: options?.tags || ['contract', input.location, input.contractType],
      ...options,
    })
  }

  async savePaycheckCalculation(
    input: PaycheckInput,
    result: PaycheckResult,
    options?: Parameters<typeof this.saveCalculation>[3]
  ): Promise<CalculationHistoryItem> {
    return this.saveCalculation('paycheck', input, result, {
      name: options?.name || `Paycheck - ${input.state} - ${input.payPeriod}`,
      tags: options?.tags || ['paycheck', input.state, input.payPeriod],
      ...options,
    })
  }

  async updateCalculation(
    id: string,
    updates: Partial<CalculationHistoryItem>
  ): Promise<void> {
    await this.storage.update(id, updates)
  }

  async deleteCalculation(id: string): Promise<void> {
    await this.storage.delete(id)
  }

  async getCalculation(id: string): Promise<CalculationHistoryItem | null> {
    return this.storage.get(id)
  }

  async listCalculations(
    filter?: CalculationHistoryFilter,
    sort?: CalculationHistorySort,
    pagination?: { page: number; pageSize: number }
  ): Promise<CalculationHistoryPage> {
    // Apply user filter if userId is set
    const finalFilter = this.userId
      ? { ...filter, userId: this.userId }
      : filter
    
    return this.storage.list(finalFilter, sort, pagination)
  }

  async getFavorites(): Promise<CalculationHistoryItem[]> {
    const result = await this.listCalculations(
      { isFavorite: true },
      { field: 'timestamp', direction: 'desc' }
    )
    return result.items
  }

  async getRecent(limit: number = 10): Promise<CalculationHistoryItem[]> {
    const result = await this.listCalculations(
      undefined,
      { field: 'timestamp', direction: 'desc' },
      { page: 1, pageSize: limit }
    )
    return result.items
  }

  async searchCalculations(query: string): Promise<CalculationHistoryItem[]> {
    const result = await this.listCalculations(
      { searchQuery: query },
      { field: 'timestamp', direction: 'desc' }
    )
    return result.items
  }

  async toggleFavorite(id: string): Promise<void> {
    const item = await this.getCalculation(id)
    if (item) {
      await this.updateCalculation(id, { isFavorite: !item.isFavorite })
    }
  }

  async addTags(id: string, tags: string[]): Promise<void> {
    const item = await this.getCalculation(id)
    if (item) {
      const existingTags = item.tags || []
      const newTags = [...new Set([...existingTags, ...tags])]
      await this.updateCalculation(id, { tags: newTags })
    }
  }

  async removeTags(id: string, tags: string[]): Promise<void> {
    const item = await this.getCalculation(id)
    if (item && item.tags) {
      const newTags = item.tags.filter(tag => !tags.includes(tag))
      await this.updateCalculation(id, { tags: newTags })
    }
  }

  async clearHistory(filter?: CalculationHistoryFilter): Promise<void> {
    const finalFilter = this.userId
      ? { ...filter, userId: this.userId }
      : filter
    
    await this.storage.clear(finalFilter)
  }

  async exportHistory(): Promise<CalculationHistoryItem[]> {
    const items = await this.storage.export()
    
    // Filter by userId if set
    if (this.userId) {
      return items.filter(item => item.userId === this.userId)
    }
    
    return items
  }

  async importHistory(items: CalculationHistoryItem[]): Promise<void> {
    // Add userId to imported items if set
    const itemsWithUser = this.userId
      ? items.map(item => ({ ...item, userId: this.userId }))
      : items
    
    await this.storage.import(itemsWithUser)
  }

  async getAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<CalculationHistoryAnalytics> {
    const filter: CalculationHistoryFilter = {
      startDate,
      endDate,
    }
    
    const allItems = await this.storage.export()
    const filteredItems = allItems.filter(item => {
      if (this.userId && item.userId !== this.userId) return false
      if (startDate && item.timestamp < startDate) return false
      if (endDate && item.timestamp > endDate) return false
      return true
    })
    
    // Calculate analytics
    const analytics: CalculationHistoryAnalytics = {
      totalCalculations: filteredItems.length,
      calculationsByType: {
        contract: 0,
        paycheck: 0,
        comparison: 0,
      },
      averageCalculationsPerDay: 0,
      mostUsedLocations: [],
      mostCommonRates: [],
      favoriteCalculations: 0,
      dateRange: {
        start: startDate || (filteredItems.length > 0 ? filteredItems[filteredItems.length - 1].timestamp : new Date()),
        end: endDate || new Date(),
      },
    }
    
    // Count by type
    filteredItems.forEach(item => {
      analytics.calculationsByType[item.type]++
      if (item.isFavorite) {
        analytics.favoriteCalculations++
      }
    })
    
    // Calculate average per day
    if (filteredItems.length > 0) {
      const daysDiff = Math.max(
        1,
        Math.ceil(
          (analytics.dateRange.end.getTime() - analytics.dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24)
        )
      )
      analytics.averageCalculationsPerDay = filteredItems.length / daysDiff
    }
    
    // Find most used locations
    const locationCounts = new Map<string, number>()
    filteredItems.forEach(item => {
      if (item.type === 'contract' && item.input.location) {
        const count = locationCounts.get(item.input.location) || 0
        locationCounts.set(item.input.location, count + 1)
      } else if (item.type === 'paycheck' && item.input.state) {
        const count = locationCounts.get(item.input.state) || 0
        locationCounts.set(item.input.state, count + 1)
      }
    })
    
    analytics.mostUsedLocations = Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Find most common rates
    const rateCounts = new Map<number, number>()
    filteredItems.forEach(item => {
      if (item.type === 'contract' && item.input.hourlyRate) {
        const rate = Math.round(item.input.hourlyRate)
        const count = rateCounts.get(rate) || 0
        rateCounts.set(rate, count + 1)
      }
    })
    
    analytics.mostCommonRates = Array.from(rateCounts.entries())
      .map(([rate, count]) => ({ rate, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return analytics
  }

  // Create a shareable link for a calculation
  async createShareableLink(
    id: string,
    options?: {
      expiresInDays?: number
      isPublic?: boolean
    }
  ): Promise<SavedCalculation> {
    const item = await this.getCalculation(id)
    if (!item) {
      throw new Error('Calculation not found')
    }
    
    const shareableLink = `https://locumtruerate.com/share/${item.id}`
    const expiresAt = options?.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined
    
    const savedCalculation: SavedCalculation = {
      ...item,
      shareableLink,
      isPublic: options?.isPublic || false,
      expiresAt,
    }
    
    await this.updateCalculation(id, savedCalculation)
    return savedCalculation
  }

  // Duplicate a calculation
  async duplicateCalculation(id: string): Promise<CalculationHistoryItem> {
    const original = await this.getCalculation(id)
    if (!original) {
      throw new Error('Calculation not found')
    }
    
    const duplicate: CalculationHistoryItem = {
      ...original,
      id: uuidv4(),
      timestamp: new Date(),
      name: original.name ? `${original.name} (Copy)` : undefined,
      isFavorite: false,
    }
    
    await this.storage.save(duplicate)
    return duplicate
  }
}