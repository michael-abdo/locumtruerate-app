'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  CalculationHistoryManager, 
  CalculationHistoryItem,
  ContractCalculationResult,
  PaycheckCalculationResult,
  ContractInput,
  PaycheckInput
} from '@locum-calc/calc-core'
import { useUser } from '@clerk/nextjs'

export interface CalculatorState {
  // Current calculation results
  currentContractResult: ContractCalculationResult | null
  currentPaycheckResult: PaycheckCalculationResult | null
  
  // History items
  history: CalculationHistoryItem[]
  savedCalculations: CalculationHistoryItem[]
  
  // Loading states
  isLoadingHistory: boolean
  isSavingCalculation: boolean
  
  // Error states
  error: Error | null
}

export interface UseCalculatorStateOptions {
  storage?: 'localStorage' | 'indexedDB'
  autoSave?: boolean
  maxHistoryItems?: number
}

export function useCalculatorState(options: UseCalculatorStateOptions = {}) {
  const { user } = useUser()
  const userId = user?.id
  
  // Initialize history manager with user context
  const historyManager = useMemo(() => {
    return new CalculationHistoryManager({
      storage: options.storage || 'indexedDB',
      userId
    })
  }, [userId, options.storage])
  
  // State
  const [state, setState] = useState<CalculatorState>({
    currentContractResult: null,
    currentPaycheckResult: null,
    history: [],
    savedCalculations: [],
    isLoadingHistory: false,
    isSavingCalculation: false,
    error: null
  })
  
  // Load initial history on mount
  useEffect(() => {
    loadHistory()
    loadSavedCalculations()
  }, [])
  
  // Load calculation history
  const loadHistory = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingHistory: true, error: null }))
    
    try {
      const recent = await historyManager.getRecent(options.maxHistoryItems || 20)
      setState(prev => ({ ...prev, history: recent, isLoadingHistory: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoadingHistory: false, 
        error: error as Error 
      }))
    }
  }, [historyManager, options.maxHistoryItems])
  
  // Load saved calculations
  const loadSavedCalculations = useCallback(async () => {
    try {
      const favorites = await historyManager.getFavorites()
      setState(prev => ({ ...prev, savedCalculations: favorites }))
    } catch (error) {
      console.error('Failed to load saved calculations:', error)
    }
  }, [historyManager])
  
  // Save contract calculation
  const saveContractCalculation = useCallback(async (
    input: ContractInput,
    result: ContractCalculationResult,
    options?: {
      name?: string
      tags?: string[]
      isFavorite?: boolean
    }
  ) => {
    setState(prev => ({ ...prev, isSavingCalculation: true, error: null }))
    
    try {
      const saved = await historyManager.saveContractCalculation(input, result, options)
      
      // Update state
      setState(prev => ({
        ...prev,
        isSavingCalculation: false,
        history: [saved, ...prev.history].slice(0, options?.maxHistoryItems || 20),
        savedCalculations: options?.isFavorite 
          ? [saved, ...prev.savedCalculations]
          : prev.savedCalculations
      }))
      
      // Auto-save to localStorage/IndexedDB
      if (options?.autoSave !== false) {
        setState(prev => ({ ...prev, currentContractResult: result }))
      }
      
      return saved
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSavingCalculation: false, 
        error: error as Error 
      }))
      throw error
    }
  }, [historyManager, options?.maxHistoryItems, options?.autoSave])
  
  // Save paycheck calculation
  const savePaycheckCalculation = useCallback(async (
    input: PaycheckInput,
    result: PaycheckCalculationResult,
    options?: {
      name?: string
      tags?: string[]
      isFavorite?: boolean
    }
  ) => {
    setState(prev => ({ ...prev, isSavingCalculation: true, error: null }))
    
    try {
      const saved = await historyManager.savePaycheckCalculation(input, result, options)
      
      // Update state
      setState(prev => ({
        ...prev,
        isSavingCalculation: false,
        history: [saved, ...prev.history].slice(0, options?.maxHistoryItems || 20),
        savedCalculations: options?.isFavorite 
          ? [saved, ...prev.savedCalculations]
          : prev.savedCalculations
      }))
      
      // Auto-save to localStorage/IndexedDB
      if (options?.autoSave !== false) {
        setState(prev => ({ ...prev, currentPaycheckResult: result }))
      }
      
      return saved
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSavingCalculation: false, 
        error: error as Error 
      }))
      throw error
    }
  }, [historyManager, options?.maxHistoryItems, options?.autoSave])
  
  // Load a specific calculation
  const loadCalculation = useCallback(async (id: string) => {
    try {
      const item = await historyManager.getCalculation(id)
      if (!item) {
        throw new Error('Calculation not found')
      }
      
      // Update current result based on type
      if (item.type === 'contract') {
        setState(prev => ({ ...prev, currentContractResult: item.result }))
      } else if (item.type === 'paycheck') {
        setState(prev => ({ ...prev, currentPaycheckResult: item.result }))
      }
      
      return item
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [historyManager])
  
  // Delete a calculation
  const deleteCalculation = useCallback(async (id: string) => {
    try {
      await historyManager.deleteCalculation(id)
      
      // Update state
      setState(prev => ({
        ...prev,
        history: prev.history.filter(item => item.id !== id),
        savedCalculations: prev.savedCalculations.filter(item => item.id !== id)
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [historyManager])
  
  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      await historyManager.toggleFavorite(id)
      
      // Reload saved calculations
      await loadSavedCalculations()
      
      // Update history item
      setState(prev => ({
        ...prev,
        history: prev.history.map(item => 
          item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
        )
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [historyManager, loadSavedCalculations])
  
  // Update calculation
  const updateCalculation = useCallback(async (
    id: string,
    updates: Partial<CalculationHistoryItem>
  ) => {
    try {
      await historyManager.updateCalculation(id, updates)
      
      // Update state
      setState(prev => ({
        ...prev,
        history: prev.history.map(item => 
          item.id === id ? { ...item, ...updates } : item
        ),
        savedCalculations: prev.savedCalculations.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [historyManager])
  
  // Search calculations
  const searchCalculations = useCallback(async (query: string) => {
    try {
      const results = await historyManager.searchCalculations(query)
      return results
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [historyManager])
  
  // Clear history
  const clearHistory = useCallback(async () => {
    try {
      await historyManager.clearHistory()
      setState(prev => ({ ...prev, history: [] }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [historyManager])
  
  // Duplicate calculation
  const duplicateCalculation = useCallback(async (id: string) => {
    try {
      const duplicate = await historyManager.duplicateCalculation(id)
      
      // Update state
      setState(prev => ({
        ...prev,
        history: [duplicate, ...prev.history].slice(0, options.maxHistoryItems || 20)
      }))
      
      return duplicate
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [historyManager, options.maxHistoryItems])
  
  // Get analytics
  const getAnalytics = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      const analytics = await historyManager.getAnalytics(startDate, endDate)
      return analytics
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [historyManager])
  
  return {
    // State
    ...state,
    
    // Methods
    saveContractCalculation,
    savePaycheckCalculation,
    loadCalculation,
    deleteCalculation,
    toggleFavorite,
    updateCalculation,
    searchCalculations,
    clearHistory,
    duplicateCalculation,
    getAnalytics,
    
    // Refresh methods
    refreshHistory: loadHistory,
    refreshSavedCalculations: loadSavedCalculations
  }
}