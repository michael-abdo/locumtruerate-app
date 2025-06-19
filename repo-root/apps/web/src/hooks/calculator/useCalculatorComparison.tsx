'use client'

import { useState, useCallback, useMemo } from 'react'
import { 
  ContractComparisonEngine,
  ContractInput,
  ContractCalculationResult,
  ContractComparisonResult,
  CalculationHistoryItem
} from '@locum-calc/calc-core'

export interface ComparisonItem {
  id: string
  name: string
  input: ContractInput
  result: ContractCalculationResult | null
  isCalculating: boolean
  error: Error | null
}

export interface UseCalculatorComparisonOptions {
  maxComparisons?: number
  autoCalculate?: boolean
}

export function useCalculatorComparison(options: UseCalculatorComparisonOptions = {}) {
  const maxComparisons = options.maxComparisons || 4
  const [comparisons, setComparisons] = useState<ComparisonItem[]>([])
  const [comparisonResult, setComparisonResult] = useState<ContractComparisonResult | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Initialize comparison engine
  const comparisonEngine = useMemo(() => new ContractComparisonEngine(), [])
  
  // Add a contract to comparison
  const addToComparison = useCallback((
    input: ContractInput,
    options?: {
      id?: string
      name?: string
      result?: ContractCalculationResult
    }
  ) => {
    if (comparisons.length >= maxComparisons) {
      setError(new Error(`Maximum ${maxComparisons} comparisons allowed`))
      return null
    }
    
    const newItem: ComparisonItem = {
      id: options?.id || Date.now().toString(),
      name: options?.name || `Contract ${comparisons.length + 1}`,
      input,
      result: options?.result || null,
      isCalculating: false,
      error: null
    }
    
    setComparisons(prev => [...prev, newItem])
    setError(null)
    
    // Auto-calculate if enabled and no result provided
    if (options?.autoCalculate !== false && !options?.result) {
      calculateContract(newItem.id)
    }
    
    return newItem.id
  }, [comparisons.length, maxComparisons, options?.autoCalculate])
  
  // Add from history item
  const addFromHistory = useCallback((historyItem: CalculationHistoryItem) => {
    if (historyItem.type !== 'contract') {
      setError(new Error('Only contract calculations can be compared'))
      return null
    }
    
    return addToComparison(historyItem.input, {
      id: historyItem.id,
      name: historyItem.name || `Contract from ${new Date(historyItem.timestamp).toLocaleDateString()}`,
      result: historyItem.result
    })
  }, [addToComparison])
  
  // Remove from comparison
  const removeFromComparison = useCallback((id: string) => {
    setComparisons(prev => prev.filter(item => item.id !== id))
    
    // Clear comparison result if less than 2 items remain
    if (comparisons.length <= 2) {
      setComparisonResult(null)
    }
  }, [comparisons.length])
  
  // Update contract input
  const updateContract = useCallback((id: string, input: Partial<ContractInput>) => {
    setComparisons(prev => prev.map(item => 
      item.id === id 
        ? { ...item, input: { ...item.input, ...input }, result: null }
        : item
    ))
    
    // Clear comparison result as inputs have changed
    setComparisonResult(null)
  }, [])
  
  // Calculate a single contract
  const calculateContract = useCallback(async (id: string) => {
    const item = comparisons.find(c => c.id === id)
    if (!item) return
    
    setComparisons(prev => prev.map(c => 
      c.id === id ? { ...c, isCalculating: true, error: null } : c
    ))
    
    try {
      const engine = new ContractCalculationEngine()
      const result = await engine.calculateContract(item.input)
      
      setComparisons(prev => prev.map(c => 
        c.id === id ? { ...c, result, isCalculating: false } : c
      ))
    } catch (error) {
      setComparisons(prev => prev.map(c => 
        c.id === id ? { ...c, error: error as Error, isCalculating: false } : c
      ))
    }
  }, [comparisons])
  
  // Run comparison
  const runComparison = useCallback(async () => {
    // Need at least 2 contracts with results
    const validContracts = comparisons.filter(c => c.result !== null)
    if (validContracts.length < 2) {
      setError(new Error('At least 2 calculated contracts are required for comparison'))
      return
    }
    
    setIsComparing(true)
    setError(null)
    
    try {
      const inputs = validContracts.map(c => c.input)
      const result = await comparisonEngine.compareContracts(inputs)
      setComparisonResult(result)
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsComparing(false)
    }
  }, [comparisons, comparisonEngine])
  
  // Calculate all contracts
  const calculateAll = useCallback(async () => {
    const uncalculated = comparisons.filter(c => c.result === null && !c.isCalculating)
    
    await Promise.all(
      uncalculated.map(c => calculateContract(c.id))
    )
  }, [comparisons, calculateContract])
  
  // Clear all comparisons
  const clearComparisons = useCallback(() => {
    setComparisons([])
    setComparisonResult(null)
    setError(null)
  }, [])
  
  // Rank contracts by criteria
  const rankByCriteria = useCallback((
    criteria: 'netPay' | 'hourlyRate' | 'benefits' | 'overall' | 'location' = 'overall'
  ) => {
    const validContracts = comparisons.filter(c => c.result !== null)
    if (validContracts.length < 2) return null
    
    const calculations = validContracts.map(c => c.result!)
    const { ranking, scores } = comparisonEngine.rankContracts(calculations, criteria)
    
    return ranking.map(index => ({
      id: validContracts[index].id,
      name: validContracts[index].name,
      score: scores[index],
      rank: ranking.indexOf(index) + 1
    }))
  }, [comparisons, comparisonEngine])
  
  // Get comparison metrics
  const getMetrics = useCallback(() => {
    if (!comparisonResult) return null
    
    return {
      payDifference: {
        amount: comparisonResult.metrics.payDifference.highestToLowest,
        percentage: comparisonResult.metrics.payDifference.percentageDifference
      },
      benefitsDifference: {
        amount: comparisonResult.metrics.benefitsDifference.highestToLowest,
        percentage: comparisonResult.metrics.benefitsDifference.percentageDifference
      },
      bestContracts: {
        overall: comparisons[comparisonResult.comparison.bestOverall],
        hourlyRate: comparisons[comparisonResult.comparison.bestHourlyRate],
        netPay: comparisons[comparisonResult.comparison.bestNetPay],
        benefits: comparisons[comparisonResult.comparison.bestBenefits]
      },
      recommendations: comparisonResult.recommendations
    }
  }, [comparisonResult, comparisons])
  
  // Compare two specific contracts
  const compareTwo = useCallback(async (id1: string, id2: string) => {
    const contract1 = comparisons.find(c => c.id === id1)
    const contract2 = comparisons.find(c => c.id === id2)
    
    if (!contract1 || !contract2) {
      throw new Error('Both contracts must exist in comparison')
    }
    
    return await comparisonEngine.compareTwo(contract1.input, contract2.input)
  }, [comparisons, comparisonEngine])
  
  // Calculate break-even analysis
  const calculateBreakEven = useCallback((
    higherId: string,
    lowerId: string,
    additionalCosts: {
      movingCosts?: number
      housingSetupCosts?: number
      travelCosts?: number
      licensingCosts?: number
    } = {}
  ) => {
    const higherContract = comparisons.find(c => c.id === higherId)
    const lowerContract = comparisons.find(c => c.id === lowerId)
    
    if (!higherContract?.result || !lowerContract?.result) {
      throw new Error('Both contracts must be calculated')
    }
    
    return comparisonEngine.calculateBreakEven(
      higherContract.result,
      lowerContract.result,
      additionalCosts
    )
  }, [comparisons, comparisonEngine])
  
  // Get comparison state
  const comparisonState = useMemo(() => ({
    isEmpty: comparisons.length === 0,
    isFull: comparisons.length >= maxComparisons,
    canCompare: comparisons.filter(c => c.result !== null).length >= 2,
    hasErrors: comparisons.some(c => c.error !== null),
    allCalculated: comparisons.every(c => c.result !== null || c.error !== null)
  }), [comparisons, maxComparisons])
  
  return {
    // State
    comparisons,
    comparisonResult,
    isComparing,
    error,
    comparisonState,
    
    // Methods
    addToComparison,
    addFromHistory,
    removeFromComparison,
    updateContract,
    calculateContract,
    calculateAll,
    runComparison,
    clearComparisons,
    rankByCriteria,
    getMetrics,
    compareTwo,
    calculateBreakEven,
    
    // Constants
    maxComparisons
  }
}