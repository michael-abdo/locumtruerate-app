import { useState, useEffect, useCallback, useRef } from 'react'

type LoadingStage = {
  id: string
  name: string
  description?: string
  weight?: number
  isComplete?: boolean
  error?: string | null
}

interface ProgressiveLoadingOptions {
  /** Auto-advance to next stage when current completes */
  autoAdvance?: boolean
  /** Delay between stage completions */
  stageDelay?: number
  /** Overall timeout for all stages */
  timeout?: number
  /** Callback when a stage completes */
  onStageComplete?: (stage: LoadingStage, stageIndex: number) => void
  /** Callback when all stages complete */
  onComplete?: () => void
  /** Callback when loading fails */
  onError?: (error: string, stageIndex: number) => void
  /** Callback when timeout occurs */
  onTimeout?: () => void
}

interface UseProgressiveLoadingReturn {
  stages: LoadingStage[]
  currentStageIndex: number
  currentStage: LoadingStage | null
  progress: number
  isLoading: boolean
  isComplete: boolean
  hasError: boolean
  error: string | null
  nextStage: () => void
  setStageComplete: (stageId: string, success?: boolean, error?: string) => void
  setStageError: (stageId: string, error: string) => void
  reset: () => void
  start: () => void
  abort: () => void
}

/**
 * Hook for managing progressive loading with multiple stages
 * Useful for complex operations like onboarding, data migration, or multi-step forms
 */
export function useProgressiveLoading(
  initialStages: Omit<LoadingStage, 'isComplete' | 'error'>[],
  options: ProgressiveLoadingOptions = {}
): UseProgressiveLoadingReturn {
  const {
    autoAdvance = true,
    stageDelay = 0,
    timeout = 0,
    onStageComplete,
    onComplete,
    onError,
    onTimeout
  } = options

  const [stages, setStages] = useState<LoadingStage[]>(() =>
    initialStages.map(stage => ({
      ...stage,
      weight: stage.weight || 1,
      isComplete: false,
      error: null
    }))
  )

  const [currentStageIndex, setCurrentStageIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stageDelayRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Calculate progress based on completed stages and their weights
  const progress = stages.reduce((acc, stage, index) => {
    const weight = stage.weight || 1
    if (stage.isComplete) {
      acc += weight
    } else if (index === currentStageIndex) {
      // Add partial progress for current stage
      acc += weight * 0.5
    }
    return acc
  }, 0) / stages.reduce((acc, stage) => acc + (stage.weight || 1), 0) * 100

  const currentStage = currentStageIndex >= 0 ? stages[currentStageIndex] : null
  const isComplete = stages.every(stage => stage.isComplete)
  const hasError = stages.some(stage => stage.error) || !!globalError

  // Clean up timeouts and controllers
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (stageDelayRef.current) clearTimeout(stageDelayRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  // Handle completion
  useEffect(() => {
    if (isComplete && isLoading) {
      setIsLoading(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      onComplete?.(
      )
    }
  }, [isComplete, isLoading, onComplete])

  // Handle global timeout
  useEffect(() => {
    if (isLoading && timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setGlobalError('Operation timed out')
        setIsLoading(false)
        onTimeout?.()
      }, timeout)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    }
  }, [isLoading, timeout, onTimeout])

  const updateStage = useCallback((
    stageId: string,
    updates: Partial<LoadingStage>
  ) => {
    setStages(prev => prev.map(stage =>
      stage.id === stageId ? { ...stage, ...updates } : stage
    ))
  }, [])

  const nextStage = useCallback(() => {
    setCurrentStageIndex(prev => {
      const nextIndex = prev + 1
      if (nextIndex < stages.length) {
        return nextIndex
      }
      return prev
    })
  }, [stages.length])

  const setStageComplete = useCallback((
    stageId: string,
    success: boolean = true,
    error?: string
  ) => {
    const stageIndex = stages.findIndex(s => s.id === stageId)
    if (stageIndex === -1) return

    updateStage(stageId, {
      isComplete: success,
      error: success ? null : (error || 'Stage failed')
    })

    if (success) {
      onStageComplete?.(stages[stageIndex], stageIndex)

      if (autoAdvance && stageDelay > 0) {
        stageDelayRef.current = setTimeout(() => {
          nextStage()
        }, stageDelay)
      } else if (autoAdvance) {
        nextStage()
      }
    } else {
      setIsLoading(false)
      onError?.(error || 'Stage failed', stageIndex)
    }
  }, [stages, updateStage, onStageComplete, onError, autoAdvance, stageDelay, nextStage])

  const setStageError = useCallback((stageId: string, error: string) => {
    setStageComplete(stageId, false, error)
  }, [setStageComplete])

  const start = useCallback(() => {
    setIsLoading(true)
    setGlobalError(null)
    setCurrentStageIndex(0)
    
    // Reset all stages
    setStages(prev => prev.map(stage => ({
      ...stage,
      isComplete: false,
      error: null
    })))

    // Create new abort controller
    abortControllerRef.current = new AbortController()
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setGlobalError(null)
    setCurrentStageIndex(-1)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    if (stageDelayRef.current) {
      clearTimeout(stageDelayRef.current)
      stageDelayRef.current = null
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setStages(prev => prev.map(stage => ({
      ...stage,
      isComplete: false,
      error: null
    })))
  }, [])

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
    setGlobalError('Operation aborted')
  }, [])

  return {
    stages,
    currentStageIndex,
    currentStage,
    progress,
    isLoading,
    isComplete,
    hasError,
    error: globalError,
    nextStage,
    setStageComplete,
    setStageError,
    reset,
    start,
    abort
  }
}

/**
 * Hook for progressive loading with async stage execution
 */
export function useAsyncProgressiveLoading<T = any>(
  stages: Array<{
    id: string
    name: string
    description?: string
    weight?: number
    execute: (signal?: AbortSignal) => Promise<T>
  }>,
  options: ProgressiveLoadingOptions = {}
) {
  const progressiveLoading = useProgressiveLoading(stages, options)
  const [results, setResults] = useState<Record<string, T>>({})
  const abortControllerRef = useRef<AbortController | null>(null)

  const executeCurrentStage = useCallback(async () => {
    const { currentStage } = progressiveLoading
    if (!currentStage || !stages.find(s => s.id === currentStage.id)) return

    const stageConfig = stages.find(s => s.id === currentStage.id)!
    
    try {
      const result = await stageConfig.execute(abortControllerRef.current?.signal)
      
      setResults(prev => ({
        ...prev,
        [currentStage.id]: result
      }))
      
      progressiveLoading.setStageComplete(currentStage.id, true)
    } catch (error) {
      if (error instanceof Error) {
        progressiveLoading.setStageError(
          currentStage.id, 
          error.message || 'Stage execution failed'
        )
      } else {
        progressiveLoading.setStageError(currentStage.id, 'Unknown error occurred')
      }
    }
  }, [progressiveLoading, stages])

  // Auto-execute stages when they become current
  useEffect(() => {
    if (progressiveLoading.currentStage && progressiveLoading.isLoading) {
      executeCurrentStage()
    }
  }, [progressiveLoading.currentStage, progressiveLoading.isLoading, executeCurrentStage])

  const start = useCallback(() => {
    abortControllerRef.current = new AbortController()
    setResults({})
    progressiveLoading.start()
  }, [progressiveLoading])

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    progressiveLoading.abort()
  }, [progressiveLoading])

  return {
    ...progressiveLoading,
    results,
    executeCurrentStage,
    start,
    abort
  }
}

/**
 * Hook for step-by-step loading with user control
 */
export function useStepByStepLoading(
  steps: Omit<LoadingStage, 'isComplete' | 'error'>[],
  options: Omit<ProgressiveLoadingOptions, 'autoAdvance'> = {}
) {
  const progressiveLoading = useProgressiveLoading(steps, {
    ...options,
    autoAdvance: false
  })

  const canGoNext = progressiveLoading.currentStageIndex < steps.length - 1
  const canGoPrevious = progressiveLoading.currentStageIndex > 0

  const goNext = useCallback(() => {
    if (canGoNext) {
      progressiveLoading.nextStage()
    }
  }, [canGoNext, progressiveLoading])

  const goPrevious = useCallback(() => {
    if (canGoPrevious) {
      progressiveLoading.setCurrentStageIndex(prev => prev - 1)
    }
  }, [canGoPrevious])

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      progressiveLoading.setCurrentStageIndex(stepIndex)
    }
  }, [steps.length])

  return {
    ...progressiveLoading,
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    goToStep
  }
}