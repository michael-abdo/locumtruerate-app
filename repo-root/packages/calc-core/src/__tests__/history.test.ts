import { CalculationHistoryManager } from '../history/history-manager'
import { LocalStorageHistory } from '../history/local-storage'
import { ContractType, PayPeriod, FilingStatus } from '../types'
import { CalculationHistoryItem } from '../history/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
}))

const mockContractInput = {
  contractType: ContractType.HOURLY,
  duration: 12,
  location: 'CA',
  hourlyRate: 200,
  hoursPerWeek: 40,
}

const mockContractResult = {
  grossPay: 96000,
  netPay: 68000,
  effectiveHourlyRate: 170,
  taxes: {
    federal: 18000,
    state: 7000,
    socialSecurity: 2000,
    medicare: 1000,
    total: 28000,
  },
}

const mockPaycheckInput = {
  payPeriod: PayPeriod.BIWEEKLY,
  grossSalary: 120000,
  filingStatus: FilingStatus.SINGLE,
  state: 'CA',
  allowances: 0,
}

const mockPaycheckResult = {
  grossPay: 4615.38,
  netPay: 3284.62,
  taxes: {
    federal: 923.08,
    state: 276.92,
    socialSecurity: 286.15,
    medicare: 66.92,
    total: 1553.07,
  },
}

describe('CalculationHistoryManager', () => {
  let manager: CalculationHistoryManager

  beforeEach(() => {
    localStorageMock.clear()
    manager = new CalculationHistoryManager({
      storage: 'localStorage',
      userId: 'test-user',
    })
  })

  describe('Saving calculations', () => {
    it('saves contract calculation', async () => {
      const item = await manager.saveContractCalculation(
        mockContractInput,
        mockContractResult,
        {
          name: 'Test Contract',
          tags: ['test', 'contract'],
          isFavorite: true,
        }
      )

      expect(item.id).toBeDefined()
      expect(item.type).toBe('contract')
      expect(item.input).toEqual(mockContractInput)
      expect(item.result).toEqual(mockContractResult)
      expect(item.name).toBe('Test Contract')
      expect(item.tags).toContain('test')
      expect(item.tags).toContain('contract')
      expect(item.isFavorite).toBe(true)
      expect(item.userId).toBe('test-user')
    })

    it('saves paycheck calculation', async () => {
      const item = await manager.savePaycheckCalculation(
        mockPaycheckInput,
        mockPaycheckResult
      )

      expect(item.type).toBe('paycheck')
      expect(item.name).toContain('Paycheck - CA - Biweekly')
      expect(item.tags).toContain('paycheck')
      expect(item.tags).toContain('CA')
    })

    it('auto-generates name and tags', async () => {
      const item = await manager.saveCalculation(
        'contract',
        mockContractInput,
        mockContractResult
      )

      expect(item.name).toBeUndefined()
      expect(item.tags).toBeUndefined()
    })
  })

  describe('Retrieving calculations', () => {
    beforeEach(async () => {
      // Add test data
      await manager.saveContractCalculation(mockContractInput, mockContractResult, {
        name: 'Contract 1',
        isFavorite: true,
      })
      await manager.saveContractCalculation(mockContractInput, mockContractResult, {
        name: 'Contract 2',
      })
      await manager.savePaycheckCalculation(mockPaycheckInput, mockPaycheckResult, {
        name: 'Paycheck 1',
      })
    })

    it('gets calculation by id', async () => {
      const saved = await manager.saveCalculation('contract', mockContractInput, mockContractResult)
      const retrieved = await manager.getCalculation(saved.id)

      expect(retrieved).toEqual(saved)
    })

    it('lists all calculations', async () => {
      const page = await manager.listCalculations()

      expect(page.items).toHaveLength(3)
      expect(page.total).toBe(3)
      expect(page.hasMore).toBe(false)
    })

    it('filters by type', async () => {
      const page = await manager.listCalculations({ type: 'contract' })

      expect(page.items).toHaveLength(2)
      expect(page.items.every(item => item.type === 'contract')).toBe(true)
    })

    it('filters by favorite', async () => {
      const page = await manager.listCalculations({ isFavorite: true })

      expect(page.items).toHaveLength(1)
      expect(page.items[0].name).toBe('Contract 1')
    })

    it('gets recent calculations', async () => {
      const recent = await manager.getRecent(2)

      expect(recent).toHaveLength(2)
      expect(recent[0].name).toBe('Paycheck 1') // Most recent first
    })

    it('gets favorite calculations', async () => {
      const favorites = await manager.getFavorites()

      expect(favorites).toHaveLength(1)
      expect(favorites[0].isFavorite).toBe(true)
    })

    it('searches calculations', async () => {
      const results = await manager.searchCalculations('Contract')

      expect(results).toHaveLength(2)
      expect(results.every(item => item.name?.includes('Contract'))).toBe(true)
    })
  })

  describe('Updating calculations', () => {
    it('updates calculation properties', async () => {
      const item = await manager.saveCalculation('contract', mockContractInput, mockContractResult)
      
      await manager.updateCalculation(item.id, {
        name: 'Updated Name',
        tags: ['updated'],
      })

      const updated = await manager.getCalculation(item.id)
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.tags).toEqual(['updated'])
    })

    it('toggles favorite status', async () => {
      const item = await manager.saveCalculation('contract', mockContractInput, mockContractResult)
      
      await manager.toggleFavorite(item.id)
      let updated = await manager.getCalculation(item.id)
      expect(updated?.isFavorite).toBe(true)

      await manager.toggleFavorite(item.id)
      updated = await manager.getCalculation(item.id)
      expect(updated?.isFavorite).toBe(false)
    })

    it('adds and removes tags', async () => {
      const item = await manager.saveCalculation('contract', mockContractInput, mockContractResult, {
        tags: ['initial'],
      })

      await manager.addTags(item.id, ['tag1', 'tag2'])
      let updated = await manager.getCalculation(item.id)
      expect(updated?.tags).toEqual(['initial', 'tag1', 'tag2'])

      await manager.removeTags(item.id, ['initial', 'tag1'])
      updated = await manager.getCalculation(item.id)
      expect(updated?.tags).toEqual(['tag2'])
    })
  })

  describe('Deleting calculations', () => {
    it('deletes single calculation', async () => {
      const item = await manager.saveCalculation('contract', mockContractInput, mockContractResult)
      
      await manager.deleteCalculation(item.id)
      const deleted = await manager.getCalculation(item.id)
      
      expect(deleted).toBeNull()
    })

    it('clears all history', async () => {
      await manager.saveCalculation('contract', mockContractInput, mockContractResult)
      await manager.saveCalculation('paycheck', mockPaycheckInput, mockPaycheckResult)

      await manager.clearHistory()
      const page = await manager.listCalculations()

      expect(page.items).toHaveLength(0)
    })

    it('clears history with filter', async () => {
      await manager.saveCalculation('contract', mockContractInput, mockContractResult)
      await manager.saveCalculation('paycheck', mockPaycheckInput, mockPaycheckResult)

      await manager.clearHistory({ type: 'contract' })
      const page = await manager.listCalculations()

      expect(page.items).toHaveLength(1)
      expect(page.items[0].type).toBe('paycheck')
    })
  })

  describe('Import/Export', () => {
    it('exports and imports history', async () => {
      const item1 = await manager.saveCalculation('contract', mockContractInput, mockContractResult)
      const item2 = await manager.saveCalculation('paycheck', mockPaycheckInput, mockPaycheckResult)

      const exported = await manager.exportHistory()
      expect(exported).toHaveLength(2)

      // Clear and reimport
      await manager.clearHistory()
      await manager.importHistory(exported)

      const page = await manager.listCalculations()
      expect(page.items).toHaveLength(2)
      expect(page.items.map(i => i.id)).toContain(item1.id)
      expect(page.items.map(i => i.id)).toContain(item2.id)
    })

    it('respects userId during export', async () => {
      await manager.saveCalculation('contract', mockContractInput, mockContractResult)
      
      // Create another manager with different userId
      const otherManager = new CalculationHistoryManager({
        storage: 'localStorage',
        userId: 'other-user',
      })
      await otherManager.saveCalculation('paycheck', mockPaycheckInput, mockPaycheckResult)

      const exported = await manager.exportHistory()
      expect(exported).toHaveLength(1)
      expect(exported[0].userId).toBe('test-user')
    })
  })

  describe('Analytics', () => {
    beforeEach(async () => {
      // Add variety of test data
      await manager.saveContractCalculation(
        { ...mockContractInput, location: 'CA', hourlyRate: 200 },
        mockContractResult,
        { isFavorite: true }
      )
      await manager.saveContractCalculation(
        { ...mockContractInput, location: 'TX', hourlyRate: 200 },
        mockContractResult
      )
      await manager.saveContractCalculation(
        { ...mockContractInput, location: 'CA', hourlyRate: 250 },
        mockContractResult
      )
      await manager.savePaycheckCalculation(
        { ...mockPaycheckInput, state: 'CA' },
        mockPaycheckResult
      )
      await manager.savePaycheckCalculation(
        { ...mockPaycheckInput, state: 'NY' },
        mockPaycheckResult,
        { isFavorite: true }
      )
    })

    it('generates analytics', async () => {
      const analytics = await manager.getAnalytics()

      expect(analytics.totalCalculations).toBe(5)
      expect(analytics.calculationsByType.contract).toBe(3)
      expect(analytics.calculationsByType.paycheck).toBe(2)
      expect(analytics.favoriteCalculations).toBe(2)
      expect(analytics.averageCalculationsPerDay).toBeGreaterThan(0)
    })

    it('identifies most used locations', async () => {
      const analytics = await manager.getAnalytics()

      expect(analytics.mostUsedLocations[0]).toEqual({ location: 'CA', count: 3 })
      expect(analytics.mostUsedLocations[1]).toEqual({ location: 'TX', count: 1 })
      expect(analytics.mostUsedLocations[2]).toEqual({ location: 'NY', count: 1 })
    })

    it('identifies most common rates', async () => {
      const analytics = await manager.getAnalytics()

      expect(analytics.mostCommonRates[0]).toEqual({ rate: 200, count: 2 })
      expect(analytics.mostCommonRates[1]).toEqual({ rate: 250, count: 1 })
    })
  })

  describe('Sharing', () => {
    it('creates shareable link', async () => {
      const item = await manager.saveCalculation('contract', mockContractInput, mockContractResult)
      
      const shared = await manager.createShareableLink(item.id, {
        expiresInDays: 7,
        isPublic: true,
      })

      expect(shared.shareableLink).toContain(item.id)
      expect(shared.isPublic).toBe(true)
      expect(shared.expiresAt).toBeDefined()
    })

    it('duplicates calculation', async () => {
      const original = await manager.saveCalculation('contract', mockContractInput, mockContractResult, {
        name: 'Original',
        isFavorite: true,
      })

      const duplicate = await manager.duplicateCalculation(original.id)

      expect(duplicate.id).not.toBe(original.id)
      expect(duplicate.name).toBe('Original (Copy)')
      expect(duplicate.isFavorite).toBe(false)
      expect(duplicate.input).toEqual(original.input)
      expect(duplicate.result).toEqual(original.result)
    })
  })
})

describe('LocalStorageHistory', () => {
  let storage: LocalStorageHistory

  beforeEach(() => {
    localStorageMock.clear()
    storage = new LocalStorageHistory()
  })

  it('handles quota exceeded error', async () => {
    // Mock localStorage to throw quota error
    const originalSetItem = localStorageMock.setItem
    localStorageMock.setItem = jest.fn((key, value) => {
      if (value.length > 100) {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      }
      originalSetItem(key, value)
    })

    // Add many items to trigger quota error
    for (let i = 0; i < 10; i++) {
      await storage.save({
        id: `item-${i}`,
        type: 'contract',
        input: mockContractInput,
        result: mockContractResult,
        timestamp: new Date(),
      })
    }

    // Should handle error gracefully by trimming items
    const page = await storage.list()
    expect(page.items.length).toBeLessThan(10)

    localStorageMock.setItem = originalSetItem
  })

  it('compresses old items', async () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 40)

    // Add old item
    await storage.save({
      id: 'old-item',
      type: 'contract',
      input: mockContractInput,
      result: mockContractResult,
      timestamp: oldDate,
    })

    // Add recent item
    await storage.save({
      id: 'recent-item',
      type: 'contract',
      input: mockContractInput,
      result: mockContractResult,
      timestamp: new Date(),
    })

    await storage.compressOldItems(30)

    const oldItem = await storage.get('old-item')
    const recentItem = await storage.get('recent-item')

    expect(oldItem?.result).toBeUndefined() // Compressed
    expect(recentItem?.result).toBeDefined() // Not compressed
  })
})