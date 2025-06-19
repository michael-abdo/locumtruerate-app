import { useState, useCallback, useRef, useEffect } from 'react'

type LoadingState = 'idle' | 'loading' | 'success' | 'error'

interface LoadingOptions {
  minimumLoadingTime?: number
  resetDelay?: number
  onStateChange?: (state: LoadingState) => void
}

interface UseLoadingStateReturn {
  state: LoadingState
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  startLoading: () => void
  setSuccess: () => void
  setError: () => void
  reset: () => void
  execute: <T>(asyncFn: () => Promise<T>) => Promise<T>
}

/**
 * Hook for managing loading states with optional minimum loading time
 * and automatic state resets
 */
export function useLoadingState(options: LoadingOptions = {}): UseLoadingStateReturn {
  const {
    minimumLoadingTime = 0,
    resetDelay = 0,
    onStateChange
  } = options

  const [state, setState] = useState<LoadingState>('idle')
  const loadingStartTimeRef = useRef<number | null>(null)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  // Notify of state changes
  useEffect(() => {
    onStateChange?.(state)
  }, [state, onStateChange])

  const updateState = useCallback((newState: LoadingState) => {
    setState(newState)
    
    // Auto-reset after delay if configured
    if (resetDelay > 0 && (newState === 'success' || newState === 'error')) {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
      
      resetTimeoutRef.current = setTimeout(() => {
        setState('idle')
      }, resetDelay)
    }
  }, [resetDelay])

  const startLoading = useCallback(() => {
    loadingStartTimeRef.current = Date.now()
    updateState('loading')
  }, [updateState])

  const setSuccess = useCallback(async () => {
    if (minimumLoadingTime > 0 && loadingStartTimeRef.current) {
      const elapsed = Date.now() - loadingStartTimeRef.current
      const remaining = minimumLoadingTime - elapsed
      
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining))
      }
    }
    
    loadingStartTimeRef.current = null
    updateState('success')
  }, [minimumLoadingTime, updateState])

  const setError = useCallback(async () => {
    if (minimumLoadingTime > 0 && loadingStartTimeRef.current) {
      const elapsed = Date.now() - loadingStartTimeRef.current
      const remaining = minimumLoadingTime - elapsed
      
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining))
      }
    }
    
    loadingStartTimeRef.current = null
    updateState('error')
  }, [minimumLoadingTime, updateState])

  const reset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    loadingStartTimeRef.current = null
    setState('idle')
  }, [])

  const execute = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      startLoading()
      const result = await asyncFn()
      await setSuccess()
      return result
    } catch (error) {
      await setError()
      throw error
    }
  }, [startLoading, setSuccess, setError])

  return {
    state,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    startLoading,
    setSuccess,
    setError,
    reset,
    execute
  }
}

/**
 * Hook for managing multiple loading states
 */
export function useMultipleLoadingState(
  keys: string[],
  options: LoadingOptions = {}
): Record<string, UseLoadingStateReturn> {
  const loadingStates = keys.reduce((acc, key) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    acc[key] = useLoadingState(options)
    return acc
  }, {} as Record<string, UseLoadingStateReturn>)

  return loadingStates
}

/**
 * Hook for tracking loading state of async operations with built-in error handling
 */
export function useAsyncOperation<T = any>(
  options: LoadingOptions & {
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {}
) {
  const { onSuccess, onError, ...loadingOptions } = options
  const loadingState = useLoadingState(loadingOptions)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setError(null)
      setData(null)
      
      const result = await loadingState.execute(asyncFn)
      setData(result)
      onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
      throw error
    }
  }, [loadingState, onSuccess, onError])

  const reset = useCallback(() => {
    loadingState.reset()
    setData(null)
    setError(null)
  }, [loadingState])

  return {
    ...loadingState,
    data,
    error,
    execute,
    reset
  }
}

/**
 * Hook for debounced loading state - useful for search inputs
 */
export function useDebouncedLoadingState(
  delay: number = 300,
  options: LoadingOptions = {}
) {
  const loadingState = useLoadingState(options)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedExecute = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    return new Promise((resolve, reject) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await loadingState.execute(asyncFn)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }, [delay, loadingState])

  const cancel = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    loadingState.reset()
  }, [loadingState])

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...loadingState,
    execute: debouncedExecute,
    cancel
  }
}