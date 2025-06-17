export interface CalculationHistoryItem {
  id: string
  type: 'contract' | 'paycheck' | 'comparison'
  input: any
  result: any
  timestamp: Date
  userId?: string
  name?: string
  tags?: string[]
  isFavorite?: boolean
  metadata?: {
    device?: 'web' | 'ios' | 'android'
    version?: string
    location?: string
  }
}

export interface SavedCalculation extends CalculationHistoryItem {
  description?: string
  sharedWith?: string[]
  isPublic?: boolean
  shareableLink?: string
  expiresAt?: Date
}

export interface CalculationHistoryFilter {
  type?: CalculationHistoryItem['type'] | CalculationHistoryItem['type'][]
  userId?: string
  startDate?: Date
  endDate?: Date
  tags?: string[]
  isFavorite?: boolean
  searchQuery?: string
}

export interface CalculationHistorySort {
  field: 'timestamp' | 'name' | 'type'
  direction: 'asc' | 'desc'
}

export interface CalculationHistoryPage {
  items: CalculationHistoryItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface CalculationHistoryStorage {
  save(item: CalculationHistoryItem): Promise<void>
  update(id: string, updates: Partial<CalculationHistoryItem>): Promise<void>
  delete(id: string): Promise<void>
  get(id: string): Promise<CalculationHistoryItem | null>
  list(filter?: CalculationHistoryFilter, sort?: CalculationHistorySort, pagination?: { page: number; pageSize: number }): Promise<CalculationHistoryPage>
  clear(filter?: CalculationHistoryFilter): Promise<void>
  export(): Promise<CalculationHistoryItem[]>
  import(items: CalculationHistoryItem[]): Promise<void>
}

export interface CalculationHistoryAnalytics {
  totalCalculations: number
  calculationsByType: Record<CalculationHistoryItem['type'], number>
  averageCalculationsPerDay: number
  mostUsedLocations: Array<{ location: string; count: number }>
  mostCommonRates: Array<{ rate: number; count: number }>
  favoriteCalculations: number
  dateRange: { start: Date; end: Date }
}