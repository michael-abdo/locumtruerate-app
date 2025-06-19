import { useState, useEffect, useRef, useCallback } from 'react'

interface SkeletonDelayOptions {
  /** Delay before showing skeleton (prevents flash for fast loads) */
  showDelay?: number
  /** Minimum time skeleton is shown once displayed */
  minimumDuration?: number
  /** Whether to show skeleton on initial load */
  showOnInitial?: boolean
  /** Custom loading state dependencies */
  dependencies?: React.DependencyList
}

interface UseSkeletonDelayReturn {
  showSkeleton: boolean
  isDelayed: boolean
  forceShow: () => void
  forceHide: () => void
  reset: () => void
}

/**
 * Hook to manage skeleton display timing to prevent flash of loading states
 * for quick operations while ensuring minimum visibility for longer operations
 */
export function useSkeletonDelay(
  isLoading: boolean,
  options: SkeletonDelayOptions = {}
): UseSkeletonDelayReturn {
  const {
    showDelay = 200,
    minimumDuration = 500,
    showOnInitial = true,
    dependencies = []
  } = options

  const [showSkeleton, setShowSkeleton] = useState(showOnInitial && isLoading)
  const [isDelayed, setIsDelayed] = useState(false)
  
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const skeletonShownAtRef = useRef<number | null>(null)
  const isInitialMountRef = useRef(true)

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  // Reset on dependency changes
  useEffect(() => {
    if (!isInitialMountRef.current) {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  useEffect(() => {
    isInitialMountRef.current = false
  }, [])

  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const forceShow = useCallback(() => {
    clearTimeouts()
    setShowSkeleton(true)
    setIsDelayed(false)
    skeletonShownAtRef.current = Date.now()
  }, [clearTimeouts])

  const forceHide = useCallback(() => {
    clearTimeouts()
    setShowSkeleton(false)
    setIsDelayed(false)
    skeletonShownAtRef.current = null
  }, [clearTimeouts])

  const reset = useCallback(() => {
    clearTimeouts()
    setShowSkeleton(showOnInitial && isLoading)
    setIsDelayed(false)
    skeletonShownAtRef.current = showOnInitial && isLoading ? Date.now() : null
  }, [clearTimeouts, showOnInitial, isLoading])

  useEffect(() => {
    if (isLoading) {
      // Starting to load
      if (!showSkeleton && showDelay > 0) {
        // Delay showing skeleton to prevent flash
        setIsDelayed(true)
        showTimeoutRef.current = setTimeout(() => {
          setShowSkeleton(true)
          setIsDelayed(false)
          skeletonShownAtRef.current = Date.now()
          showTimeoutRef.current = null
        }, showDelay)
      } else if (!showSkeleton) {
        // Show immediately if no delay
        setShowSkeleton(true)
        skeletonShownAtRef.current = Date.now()
      }
    } else {
      // Finished loading
      clearTimeouts()
      setIsDelayed(false)

      if (showSkeleton && skeletonShownAtRef.current && minimumDuration > 0) {
        // Ensure minimum duration
        const elapsed = Date.now() - skeletonShownAtRef.current
        const remaining = minimumDuration - elapsed

        if (remaining > 0) {
          hideTimeoutRef.current = setTimeout(() => {
            setShowSkeleton(false)
            skeletonShownAtRef.current = null
            hideTimeoutRef.current = null
          }, remaining)
        } else {
          setShowSkeleton(false)
          skeletonShownAtRef.current = null
        }
      } else {
        setShowSkeleton(false)
        skeletonShownAtRef.current = null
      }
    }
  }, [isLoading, showDelay, minimumDuration, showSkeleton, clearTimeouts])

  return {
    showSkeleton,
    isDelayed,
    forceShow,
    forceHide,
    reset
  }
}

/**
 * Hook for managing skeleton delay with multiple loading states
 */
export function useMultipleSkeletonDelay(
  loadingStates: Record<string, boolean>,
  options: SkeletonDelayOptions = {}
): Record<string, UseSkeletonDelayReturn> {
  const results: Record<string, UseSkeletonDelayReturn> = {}

  Object.keys(loadingStates).forEach(key => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useSkeletonDelay(loadingStates[key], options)
  })

  return results
}

/**
 * Hook for conditional skeleton display based on content availability
 */
export function useConditionalSkeleton<T>(
  data: T | null | undefined,
  isLoading: boolean,
  options: SkeletonDelayOptions & {
    /** Function to determine if data is considered "empty" */
    isEmpty?: (data: T) => boolean
    /** Show skeleton when data is empty but not loading */
    showWhenEmpty?: boolean
  } = {}
): UseSkeletonDelayReturn & {
  hasData: boolean
  isEmpty: boolean
} {
  const { isEmpty = (data) => !data, showWhenEmpty = false, ...delayOptions } = options
  
  const hasData = data !== null && data !== undefined
  const isDataEmpty = hasData ? isEmpty(data) : true
  const shouldShowSkeleton = isLoading || (showWhenEmpty && isDataEmpty)
  
  const skeletonDelay = useSkeletonDelay(shouldShowSkeleton, delayOptions)

  return {
    ...skeletonDelay,
    hasData,
    isEmpty: isDataEmpty
  }
}

/**
 * Hook for managing skeleton states in paginated or infinite loading scenarios
 */
export function usePaginatedSkeletonDelay(
  isInitialLoading: boolean,
  isLoadingMore: boolean,
  options: SkeletonDelayOptions & {
    /** Options specific to "load more" operations */
    loadMoreOptions?: SkeletonDelayOptions
  } = {}
) {
  const { loadMoreOptions, ...initialOptions } = options

  const initialSkeleton = useSkeletonDelay(isInitialLoading, initialOptions)
  const loadMoreSkeleton = useSkeletonDelay(isLoadingMore, {
    showDelay: 100, // Shorter delay for load more
    minimumDuration: 300, // Shorter minimum duration
    showOnInitial: false,
    ...loadMoreOptions
  })

  return {
    initial: initialSkeleton,
    loadMore: loadMoreSkeleton,
    showAnySkeleton: initialSkeleton.showSkeleton || loadMoreSkeleton.showSkeleton
  }
}

/**
 * Hook for staggered skeleton animations (useful for lists)
 */
export function useStaggeredSkeletonDelay(
  isLoading: boolean,
  itemCount: number,
  options: SkeletonDelayOptions & {
    /** Delay between each item animation */
    staggerDelay?: number
    /** Maximum stagger delay to prevent overly long animations */
    maxStaggerDelay?: number
  } = {}
) {
  const {
    staggerDelay = 50,
    maxStaggerDelay = 500,
    ...skeletonOptions
  } = options

  const [visibleItems, setVisibleItems] = useState(0)
  const baseSkeleton = useSkeletonDelay(isLoading, skeletonOptions)

  useEffect(() => {
    if (baseSkeleton.showSkeleton && !baseSkeleton.isDelayed) {
      // Start staggered animation
      setVisibleItems(0)
      
      const maxDelay = Math.min(itemCount * staggerDelay, maxStaggerDelay)
      const actualStaggerDelay = maxDelay / itemCount

      for (let i = 0; i < itemCount; i++) {
        setTimeout(() => {
          setVisibleItems(prev => Math.max(prev, i + 1))
        }, i * actualStaggerDelay)
      }
    } else if (!isLoading) {
      setVisibleItems(itemCount)
    }
  }, [baseSkeleton.showSkeleton, baseSkeleton.isDelayed, isLoading, itemCount, staggerDelay, maxStaggerDelay])

  const getItemDelay = useCallback((index: number) => {
    if (!baseSkeleton.showSkeleton || baseSkeleton.isDelayed) return 0
    
    const maxDelay = Math.min(itemCount * staggerDelay, maxStaggerDelay)
    const actualStaggerDelay = maxDelay / itemCount
    
    return index * actualStaggerDelay
  }, [baseSkeleton.showSkeleton, baseSkeleton.isDelayed, itemCount, staggerDelay, maxStaggerDelay])

  const isItemVisible = useCallback((index: number) => {
    return index < visibleItems
  }, [visibleItems])

  return {
    ...baseSkeleton,
    visibleItems,
    getItemDelay,
    isItemVisible
  }
}