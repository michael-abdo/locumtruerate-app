import { useState, useEffect, useCallback, useMemo } from 'react'
import { CalculationHistoryManager } from '../history/history-manager'
import {
  CalculationHistoryItem,
  CalculationHistoryFilter,
  CalculationHistorySort,
  CalculationHistoryPage,
  CalculationHistoryAnalytics,
} from '../history/types'

export interface UseCalculationHistoryOptions {
  storage?: 'localStorage' | 'indexedDB'
  userId?: string
  autoSave?: boolean
  pageSize?: number
}

export function useCalculationHistory(options: UseCalculationHistoryOptions = {}) {
  const manager = useMemo(
    () => new CalculationHistoryManager({
      storage: options.storage,
      userId: options.userId,
    }),
    [options.storage, options.userId]
  )

  const [history, setHistory] = useState<CalculationHistoryPage>({
    items: [],
    total: 0,
    page: 1,
    pageSize: options.pageSize || 20,
    hasMore: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<CalculationHistoryFilter>({})
  const [sort, setSort] = useState<CalculationHistorySort>({
    field: 'timestamp',
    direction: 'desc',
  })

  // Load history
  const loadHistory = useCallback(async (
    page: number = 1,
    customFilter?: CalculationHistoryFilter,
    customSort?: CalculationHistorySort
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await manager.listCalculations(
        customFilter || filter,
        customSort || sort,
        { page, pageSize: options.pageSize || 20 }
      )
      setHistory(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [manager, filter, sort, options.pageSize])

  // Initial load
  useEffect(() => {
    loadHistory()
  }, [])

  // Save calculation
  const saveCalculation = useCallback(async (
    type: CalculationHistoryItem['type'],
    input: any,
    result: any,
    options?: {
      name?: string
      tags?: string[]
      isFavorite?: boolean
      metadata?: CalculationHistoryItem['metadata']
    }
  ) => {
    try {
      const item = await manager.saveCalculation(type, input, result, options)
      // Reload history to include new item
      await loadHistory(history.page)
      return item
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save calculation')
      throw err
    }
  }, [manager, loadHistory, history.page])

  // Update calculation
  const updateCalculation = useCallback(async (
    id: string,
    updates: Partial<CalculationHistoryItem>
  ) => {
    try {
      await manager.updateCalculation(id, updates)
      // Update local state
      setHistory(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === id ? { ...item, ...updates } : item
        ),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update calculation')
      throw err
    }
  }, [manager])

  // Delete calculation
  const deleteCalculation = useCallback(async (id: string) => {
    try {
      await manager.deleteCalculation(id)
      // Remove from local state
      setHistory(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id),
        total: prev.total - 1,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete calculation')
      throw err
    }
  }, [manager])

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      await manager.toggleFavorite(id)
      // Update local state
      setHistory(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
        ),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite')
      throw err
    }
  }, [manager])

  // Search calculations
  const searchCalculations = useCallback(async (query: string) => {
    const searchFilter = { ...filter, searchQuery: query }
    setFilter(searchFilter)
    await loadHistory(1, searchFilter)
  }, [filter, loadHistory])

  // Clear filters
  const clearFilters = useCallback(async () => {
    setFilter({})
    await loadHistory(1, {})
  }, [loadHistory])

  // Change sort
  const changeSort = useCallback(async (newSort: CalculationHistorySort) => {
    setSort(newSort)
    await loadHistory(1, filter, newSort)
  }, [filter, loadHistory])

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!history.hasMore || loading) return
    await loadHistory(history.page + 1)
  }, [history, loading, loadHistory])

  // Export history
  const exportHistory = useCallback(async () => {
    try {
      return await manager.exportHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export history')
      throw err
    }
  }, [manager])

  // Import history
  const importHistory = useCallback(async (items: CalculationHistoryItem[]) => {
    try {
      await manager.importHistory(items)
      await loadHistory() // Reload to show imported items
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import history')
      throw err
    }
  }, [manager, loadHistory])

  return {
    history: history.items,
    total: history.total,
    page: history.page,
    pageSize: history.pageSize,
    hasMore: history.hasMore,
    loading,
    error,
    filter,
    sort,
    saveCalculation,
    updateCalculation,
    deleteCalculation,
    toggleFavorite,
    searchCalculations,
    clearFilters,
    changeSort,
    loadMore,
    loadHistory,
    exportHistory,
    importHistory,
  }
}

// Hook for getting recent calculations
export function useRecentCalculations(limit: number = 10) {
  const [recent, setRecent] = useState<CalculationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const manager = useMemo(() => new CalculationHistoryManager(), [])

  useEffect(() => {
    async function loadRecent() {
      setLoading(true)
      try {
        const items = await manager.getRecent(limit)
        setRecent(items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recent calculations')
      } finally {
        setLoading(false)
      }
    }
    
    loadRecent()
  }, [manager, limit])

  return { recent, loading, error }
}

// Hook for getting favorite calculations
export function useFavoriteCalculations() {
  const [favorites, setFavorites] = useState<CalculationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const manager = useMemo(() => new CalculationHistoryManager(), [])

  const loadFavorites = useCallback(async () => {
    setLoading(true)
    try {
      const items = await manager.getFavorites()
      setFavorites(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }, [manager])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  return { favorites, loading, error, reload: loadFavorites }
}

// Hook for getting calculation analytics
export function useCalculationAnalytics(
  startDate?: Date,
  endDate?: Date
) {
  const [analytics, setAnalytics] = useState<CalculationHistoryAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const manager = useMemo(() => new CalculationHistoryManager(), [])

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      try {
        const data = await manager.getAnalytics(startDate, endDate)
        setAnalytics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    
    loadAnalytics()
  }, [manager, startDate, endDate])

  return { analytics, loading, error }
}