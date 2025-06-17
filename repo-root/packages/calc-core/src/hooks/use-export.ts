import { useState, useCallback } from 'react'
import { ExportFormat, ExportOptions, ExportResult } from '../export/types'
import { exportManager } from '../export/export-manager'

export interface UseExportOptions {
  onSuccess?: (result: ExportResult) => void
  onError?: (error: string) => void
  defaultFormat?: ExportFormat
  defaultOptions?: Partial<ExportOptions>
}

export interface UseExportReturn {
  exportData: (data: any, options?: Partial<ExportOptions>) => Promise<ExportResult>
  exportMultiple: (data: any, formats: ExportFormat[]) => Promise<Record<ExportFormat, ExportResult>>
  isExporting: boolean
  lastExport: ExportResult | null
  error: string | null
  reset: () => void
}

export function useExport(options: UseExportOptions = {}): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [lastExport, setLastExport] = useState<ExportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const exportData = useCallback(async (
    data: any,
    exportOptions?: Partial<ExportOptions>
  ): Promise<ExportResult> => {
    setIsExporting(true)
    setError(null)

    try {
      const finalOptions: ExportOptions = {
        format: options.defaultFormat || ExportFormat.PDF,
        ...options.defaultOptions,
        ...exportOptions,
      } as ExportOptions

      const result = await exportManager.export(data, finalOptions)
      
      setLastExport(result)
      
      if (result.success) {
        options.onSuccess?.(result)
      } else {
        setError(result.error || 'Export failed')
        options.onError?.(result.error || 'Export failed')
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed'
      setError(errorMessage)
      options.onError?.(errorMessage)
      
      const errorResult: ExportResult = {
        success: false,
        filename: '',
        format: exportOptions?.format || options.defaultFormat || ExportFormat.PDF,
        size: 0,
        error: errorMessage,
      }
      
      setLastExport(errorResult)
      return errorResult
    } finally {
      setIsExporting(false)
    }
  }, [options])

  const exportMultiple = useCallback(async (
    data: any,
    formats: ExportFormat[]
  ): Promise<Record<ExportFormat, ExportResult>> => {
    setIsExporting(true)
    setError(null)

    try {
      const results = await exportManager.exportMultiple(
        data,
        formats,
        options.defaultOptions
      )
      
      // Check if all exports succeeded
      const allSuccessful = Object.values(results).every(r => r.success)
      
      if (allSuccessful) {
        options.onSuccess?.(results[formats[0]]) // Notify with first result
      } else {
        const errors = Object.entries(results)
          .filter(([_, r]) => !r.success)
          .map(([format, r]) => `${format}: ${r.error}`)
          .join(', ')
        
        setError(errors)
        options.onError?.(errors)
      }
      
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed'
      setError(errorMessage)
      options.onError?.(errorMessage)
      throw err
    } finally {
      setIsExporting(false)
    }
  }, [options])

  const reset = useCallback(() => {
    setIsExporting(false)
    setLastExport(null)
    setError(null)
  }, [])

  return {
    exportData,
    exportMultiple,
    isExporting,
    lastExport,
    error,
    reset,
  }
}

// Hook for managing export state across components
export function useExportStatus() {
  const [exports, setExports] = useState<Map<string, ExportResult>>(new Map())

  const addExport = useCallback((id: string, result: ExportResult) => {
    setExports(prev => new Map(prev).set(id, result))
  }, [])

  const removeExport = useCallback((id: string) => {
    setExports(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const getExport = useCallback((id: string): ExportResult | undefined => {
    return exports.get(id)
  }, [exports])

  const clearExports = useCallback(() => {
    setExports(new Map())
  }, [])

  return {
    exports: Array.from(exports.entries()),
    addExport,
    removeExport,
    getExport,
    clearExports,
    count: exports.size,
  }
}