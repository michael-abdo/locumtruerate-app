import React, { useState } from 'react'
import {
  useCalculationHistory,
  useRecentCalculations,
  useFavoriteCalculations,
  CalculationHistoryItem,
  ExportFormat,
  useExport,
} from '@locumtruerate/calc-core'
import { formatDistanceToNow } from 'date-fns'
import { ExportButton } from './export-button'

export interface CalculationHistoryProps {
  userId?: string
  onSelectCalculation?: (item: CalculationHistoryItem) => void
  className?: string
}

export function CalculationHistory({
  userId,
  onSelectCalculation,
  className,
}: CalculationHistoryProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('')

  const {
    history,
    total,
    page,
    hasMore,
    loading,
    error,
    searchCalculations,
    toggleFavorite,
    deleteCalculation,
    loadMore,
    changeSort,
    exportHistory,
  } = useCalculationHistory({ userId })

  const { recent } = useRecentCalculations(5)
  const { favorites } = useFavoriteCalculations()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchCalculations(searchQuery)
  }

  const handleExportHistory = async () => {
    const items = await exportHistory()
    const { exportData } = useExport()
    await exportData(
      { calculations: items },
      { format: ExportFormat.JSON, filename: 'calculation-history' }
    )
  }

  const renderCalculationItem = (item: CalculationHistoryItem) => {
    const icon = {
      contract: '📄',
      paycheck: '💰',
      comparison: '📊',
    }[item.type]

    return (
      <div
        key={item.id}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelectCalculation?.(item)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <h3 className="font-semibold text-gray-900">
                {item.name || `${item.type} Calculation`}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(item.id)
                }}
                className="ml-auto"
              >
                {item.isFavorite ? '⭐' : '☆'}
              </button>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {item.type === 'contract' && item.input && (
                <p>
                  {item.input.location} • ${item.input.hourlyRate}/hr •{' '}
                  {item.input.duration} weeks
                </p>
              )}
              {item.type === 'paycheck' && item.input && (
                <p>
                  {item.input.state} • {item.input.payPeriod} •{' '}
                  ${item.input.grossSalary?.toLocaleString()}/year
                </p>
              )}
            </div>
            
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>{formatDistanceToNow(new Date(item.timestamp))} ago</span>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Delete this calculation?')) {
                deleteCalculation(item.id)
              }
            }}
            className="ml-4 text-gray-400 hover:text-red-600"
          >
            🗑️
          </button>
        </div>
      </div>
    )
  }

  const getDisplayItems = () => {
    switch (activeTab) {
      case 'recent':
        return recent
      case 'favorites':
        return favorites
      default:
        return history
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Calculation History</h2>
        
        <div className="flex items-center gap-2">
          <ExportButton
            data={{ calculations: history }}
            formats={[ExportFormat.JSON, ExportFormat.CSV]}
            label="Export History"
            size="sm"
            variant="outline"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'recent'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'favorites'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Favorites
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({total})
        </button>
      </div>

      {/* Search and filters (for 'all' tab) */}
      {activeTab === 'all' && (
        <div className="mb-4 space-y-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search calculations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </form>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                // Apply filter logic here
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Types</option>
              <option value="contract">Contracts</option>
              <option value="paycheck">Paychecks</option>
              <option value="comparison">Comparisons</option>
            </select>
            
            <button
              onClick={() => changeSort({ field: 'timestamp', direction: 'desc' })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Newest First
            </button>
            
            <button
              onClick={() => changeSort({ field: 'name', direction: 'asc' })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Name A-Z
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && getDisplayItems().length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No calculations found</p>
        </div>
      )}

      {/* Calculation list */}
      <div className="space-y-3">
        {getDisplayItems().map(renderCalculationItem)}
      </div>

      {/* Load more button */}
      {activeTab === 'all' && hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

// Compact history widget for sidebars
export function CalculationHistoryWidget({
  userId,
  onSelectCalculation,
  limit = 3,
}: {
  userId?: string
  onSelectCalculation?: (item: CalculationHistoryItem) => void
  limit?: number
}) {
  const { recent, loading } = useRecentCalculations(limit)

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Recent Calculations</h3>
      
      {recent.length === 0 ? (
        <p className="text-sm text-gray-500">No recent calculations</p>
      ) : (
        <div className="space-y-2">
          {recent.map(item => (
            <button
              key={item.id}
              onClick={() => onSelectCalculation?.(item)}
              className="w-full text-left p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {item.name || `${item.type} calculation`}
                </span>
                {item.isFavorite && <span className="text-yellow-500">⭐</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(item.timestamp))} ago
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}