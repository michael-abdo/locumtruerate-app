/**
 * Utilities for working with skeleton loading components
 */

export type SkeletonVariant = 'default' | 'shimmer' | 'wave' | 'pulse'
export type SkeletonAnimation = 'none' | 'pulse' | 'shimmer' | 'wave'

/**
 * Get random width for realistic skeleton text lines
 */
export function getRandomWidth(min: number = 60, max: number = 90): string {
  const width = Math.floor(Math.random() * (max - min + 1)) + min
  return `${width}%`
}

/**
 * Generate width array for multiple skeleton text lines
 */
export function generateTextWidths(lineCount: number, options?: {
  minWidth?: number
  maxWidth?: number
  lastLineMinWidth?: number
  lastLineMaxWidth?: number
}): string[] {
  const {
    minWidth = 70,
    maxWidth = 95,
    lastLineMinWidth = 40,
    lastLineMaxWidth = 80
  } = options || {}

  return Array.from({ length: lineCount }, (_, index) => {
    if (index === lineCount - 1) {
      // Last line is typically shorter
      return getRandomWidth(lastLineMinWidth, lastLineMaxWidth)
    }
    return getRandomWidth(minWidth, maxWidth)
  })
}

/**
 * Get skeleton dimensions based on component type
 */
export function getSkeletonDimensions(type: 'text' | 'title' | 'button' | 'avatar' | 'card', size?: 'sm' | 'md' | 'lg') {
  const sizeMap = {
    sm: { scale: 0.875 },
    md: { scale: 1 },
    lg: { scale: 1.25 }
  }
  
  const currentSize = sizeMap[size || 'md']
  
  const baseDimensions = {
    text: { height: 16 * currentSize.scale, width: '100%' },
    title: { height: 24 * currentSize.scale, width: '70%' },
    button: { height: 40 * currentSize.scale, width: 120 * currentSize.scale },
    avatar: { height: 40 * currentSize.scale, width: 40 * currentSize.scale },
    card: { height: 200 * currentSize.scale, width: '100%' }
  }

  return baseDimensions[type]
}

/**
 * Create staggered delay values for list animations
 */
export function createStaggeredDelays(itemCount: number, baseDelay: number = 50, maxDelay: number = 500): number[] {
  const totalDelay = Math.min(itemCount * baseDelay, maxDelay)
  const actualDelay = totalDelay / itemCount
  
  return Array.from({ length: itemCount }, (_, index) => index * actualDelay)
}

/**
 * Calculate skeleton animation duration based on content complexity
 */
export function calculateAnimationDuration(complexity: 'simple' | 'medium' | 'complex'): number {
  const durationMap = {
    simple: 1000,   // 1 second
    medium: 1500,   // 1.5 seconds
    complex: 2000   // 2 seconds
  }
  
  return durationMap[complexity]
}

/**
 * Get optimized skeleton count based on viewport and item size
 */
export function getOptimizedSkeletonCount(options: {
  viewportHeight?: number
  itemHeight?: number
  buffer?: number
  maxCount?: number
  minCount?: number
}): number {
  const {
    viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800,
    itemHeight = 100,
    buffer = 2,
    maxCount = 20,
    minCount = 3
  } = options

  const visibleItems = Math.floor(viewportHeight / itemHeight)
  const totalItems = visibleItems + buffer
  
  return Math.min(Math.max(totalItems, minCount), maxCount)
}

/**
 * Generate skeleton placeholder data for different content types
 */
export function generateSkeletonData(type: 'job' | 'user' | 'article' | 'product', count: number = 5) {
  const generators = {
    job: () => ({
      id: Math.random().toString(36),
      titleWidth: getRandomWidth(60, 85),
      companyWidth: getRandomWidth(40, 70),
      locationWidth: getRandomWidth(50, 80),
      salaryWidth: getRandomWidth(35, 60),
      badgeCount: Math.floor(Math.random() * 4) + 1,
      hasLogo: Math.random() > 0.3
    }),
    
    user: () => ({
      id: Math.random().toString(36),
      nameWidth: getRandomWidth(45, 75),
      emailWidth: getRandomWidth(60, 90),
      roleWidth: getRandomWidth(30, 60),
      hasAvatar: Math.random() > 0.2
    }),
    
    article: () => ({
      id: Math.random().toString(36),
      titleWidth: getRandomWidth(70, 95),
      excerptLines: Math.floor(Math.random() * 3) + 2,
      authorWidth: getRandomWidth(40, 70),
      dateWidth: getRandomWidth(30, 50),
      hasImage: Math.random() > 0.4
    }),
    
    product: () => ({
      id: Math.random().toString(36),
      nameWidth: getRandomWidth(60, 90),
      priceWidth: getRandomWidth(25, 45),
      ratingWidth: getRandomWidth(30, 50),
      descriptionLines: Math.floor(Math.random() * 2) + 1,
      hasImage: Math.random() > 0.1
    })
  }

  return Array.from({ length: count }, () => generators[type]())
}

/**
 * Detect reduced motion preference and adjust animations accordingly
 */
export function getAccessibleAnimation(preferredAnimation: SkeletonAnimation): SkeletonAnimation {
  if (typeof window === 'undefined') return preferredAnimation
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  if (prefersReducedMotion) {
    return 'none'
  }
  
  return preferredAnimation
}

/**
 * Create responsive skeleton configuration based on viewport size
 */
export function getResponsiveSkeletonConfig() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      itemsPerRow: 3,
      showCompact: false
    }
  }

  const width = window.innerWidth
  
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const isDesktop = width >= 1024

  return {
    isMobile,
    isTablet,
    isDesktop,
    itemsPerRow: isMobile ? 1 : isTablet ? 2 : 3,
    showCompact: isMobile
  }
}

/**
 * Performance optimization: Throttle skeleton updates
 */
export function throttleSkeletonUpdates<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 100
): T {
  let inThrottle: boolean
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

/**
 * Generate CSS custom properties for skeleton animations
 */
export function generateSkeletonCSSProperties(variant: SkeletonVariant, animation: SkeletonAnimation) {
  const properties: Record<string, string> = {}

  if (animation === 'shimmer') {
    properties['--skeleton-shimmer-duration'] = '2s'
    properties['--skeleton-shimmer-timing'] = 'ease-in-out'
  }

  if (animation === 'wave') {
    properties['--skeleton-wave-duration'] = '1.5s'
    properties['--skeleton-wave-timing'] = 'ease-in-out'
  }

  if (animation === 'pulse') {
    properties['--skeleton-pulse-duration'] = '1s'
    properties['--skeleton-pulse-timing'] = 'ease-in-out'
  }

  return properties
}

/**
 * Skeleton loading state manager for complex UIs
 */
export class SkeletonStateManager {
  private loadingStates: Map<string, boolean> = new Map()
  private callbacks: Map<string, Set<(isLoading: boolean) => void>> = new Map()

  setLoading(key: string, isLoading: boolean) {
    const wasLoading = this.loadingStates.get(key) || false
    this.loadingStates.set(key, isLoading)

    if (wasLoading !== isLoading) {
      const callbacks = this.callbacks.get(key)
      if (callbacks) {
        callbacks.forEach(callback => callback(isLoading))
      }
    }
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false
  }

  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(Boolean)
  }

  subscribe(key: string, callback: (isLoading: boolean) => void) {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set())
    }
    this.callbacks.get(key)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.callbacks.delete(key)
        }
      }
    }
  }

  reset() {
    this.loadingStates.clear()
    this.callbacks.clear()
  }

  getLoadingKeys(): string[] {
    return Array.from(this.loadingStates.entries())
      .filter(([, isLoading]) => isLoading)
      .map(([key]) => key)
  }
}

// Export a default instance for global state management
export const globalSkeletonState = new SkeletonStateManager()