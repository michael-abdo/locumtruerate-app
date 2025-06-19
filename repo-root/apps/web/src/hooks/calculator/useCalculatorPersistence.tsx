'use client'

import { useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/trpc/react'
import { 
  CalculationHistoryItem,
  ExportManager,
  ExportFormat,
  ContractCalculationResult,
  PaycheckCalculationResult
} from '@locumtruerate/calc-core'

export interface UseCalculatorPersistenceOptions {
  onSaveSuccess?: (calculation: any) => void
  onSaveError?: (error: Error) => void
  onExportSuccess?: (format: ExportFormat) => void
  onExportError?: (error: Error) => void
}

export function useCalculatorPersistence(options: UseCalculatorPersistenceOptions = {}) {
  const { user } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Initialize export manager
  const exportManager = new ExportManager()
  
  // tRPC mutations
  const saveCalculationMutation = api.calculations.save.useMutation({
    onSuccess: (data) => {
      setIsSaving(false)
      options.onSaveSuccess?.(data)
    },
    onError: (error) => {
      setIsSaving(false)
      setError(new Error(error.message))
      options.onSaveError?.(new Error(error.message))
    }
  })
  
  const updateCalculationMutation = api.calculations.update.useMutation()
  const deleteCalculationMutation = api.calculations.delete.useMutation()
  const shareCalculationMutation = api.calculations.share.useMutation()
  
  // tRPC queries
  const { data: userCalculations, refetch: refetchCalculations } = api.calculations.getUserCalculations.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  )
  
  // Save calculation to database
  const saveToDatabase = useCallback(async (
    calculation: CalculationHistoryItem,
    options?: {
      isPublic?: boolean
      expiresInDays?: number
    }
  ) => {
    if (!user?.id) {
      const error = new Error('User must be logged in to save calculations')
      setError(error)
      throw error
    }
    
    setIsSaving(true)
    setError(null)
    
    try {
      const saved = await saveCalculationMutation.mutateAsync({
        userId: user.id,
        type: calculation.type,
        input: calculation.input,
        result: calculation.result,
        name: calculation.name,
        tags: calculation.tags,
        isFavorite: calculation.isFavorite,
        isPublic: options?.isPublic,
        metadata: {
          ...calculation.metadata,
          expiresInDays: options?.expiresInDays
        }
      })
      
      return saved
    } catch (error) {
      // Error handling is done in mutation callbacks
      throw error
    }
  }, [user?.id, saveCalculationMutation])
  
  // Update calculation in database
  const updateInDatabase = useCallback(async (
    id: string,
    updates: Partial<CalculationHistoryItem>
  ) => {
    if (!user?.id) {
      throw new Error('User must be logged in to update calculations')
    }
    
    return await updateCalculationMutation.mutateAsync({
      id,
      userId: user.id,
      ...updates
    })
  }, [user?.id, updateCalculationMutation])
  
  // Delete calculation from database
  const deleteFromDatabase = useCallback(async (id: string) => {
    if (!user?.id) {
      throw new Error('User must be logged in to delete calculations')
    }
    
    await deleteCalculationMutation.mutateAsync({
      id,
      userId: user.id
    })
    
    // Refetch calculations
    await refetchCalculations()
  }, [user?.id, deleteCalculationMutation, refetchCalculations])
  
  // Export calculation in various formats
  const exportCalculation = useCallback(async (
    calculation: CalculationHistoryItem,
    format: ExportFormat,
    options?: {
      includeCharts?: boolean
      includeComparison?: boolean
      fileName?: string
    }
  ) => {
    setIsExporting(true)
    setError(null)
    
    try {
      // Prepare export data
      const exportData = {
        calculations: [calculation],
        metadata: {
          exportDate: new Date(),
          exportedBy: user?.emailAddresses?.[0]?.emailAddress || 'Unknown',
          format
        }
      }
      
      // Export based on format
      let blob: Blob
      let fileName: string
      
      switch (format) {
        case 'pdf':
          blob = await exportManager.exportToPDF(exportData, {
            includeCharts: options?.includeCharts,
            includeHeader: true,
            includeFooter: true
          })
          fileName = options?.fileName || `calculation-${calculation.id}.pdf`
          break
          
        case 'excel':
          blob = await exportManager.exportToExcel(exportData, {
            includeCharts: options?.includeCharts,
            sheetName: 'Calculations'
          })
          fileName = options?.fileName || `calculation-${calculation.id}.xlsx`
          break
          
        case 'csv':
          blob = await exportManager.exportToCSV(exportData)
          fileName = options?.fileName || `calculation-${calculation.id}.csv`
          break
          
        case 'json':
          blob = await exportManager.exportToJSON(exportData, { pretty: true })
          fileName = options?.fileName || `calculation-${calculation.id}.json`
          break
          
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
      
      // Download the file
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setIsExporting(false)
      options?.onExportSuccess?.(format)
    } catch (error) {
      setIsExporting(false)
      setError(error as Error)
      options?.onExportError?.(error as Error)
      throw error
    }
  }, [user, exportManager, options])
  
  // Export multiple calculations
  const exportMultiple = useCallback(async (
    calculations: CalculationHistoryItem[],
    format: ExportFormat,
    options?: {
      includeCharts?: boolean
      includeComparison?: boolean
      fileName?: string
    }
  ) => {
    setIsExporting(true)
    setError(null)
    
    try {
      const exportData = {
        calculations,
        metadata: {
          exportDate: new Date(),
          exportedBy: user?.emailAddresses?.[0]?.emailAddress || 'Unknown',
          format
        }
      }
      
      let blob: Blob
      let fileName: string
      
      switch (format) {
        case 'pdf':
          blob = await exportManager.exportToPDF(exportData, {
            includeCharts: options?.includeCharts,
            includeHeader: true,
            includeFooter: true,
            includeComparison: options?.includeComparison
          })
          fileName = options?.fileName || `calculations-export-${Date.now()}.pdf`
          break
          
        case 'excel':
          blob = await exportManager.exportToExcel(exportData, {
            includeCharts: options?.includeCharts,
            sheetName: 'Calculations',
            multipleSheets: true
          })
          fileName = options?.fileName || `calculations-export-${Date.now()}.xlsx`
          break
          
        case 'csv':
          blob = await exportManager.exportToCSV(exportData)
          fileName = options?.fileName || `calculations-export-${Date.now()}.csv`
          break
          
        case 'json':
          blob = await exportManager.exportToJSON(exportData, { pretty: true })
          fileName = options?.fileName || `calculations-export-${Date.now()}.json`
          break
          
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
      
      // Download the file
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setIsExporting(false)
      options?.onExportSuccess?.(format)
    } catch (error) {
      setIsExporting(false)
      setError(error as Error)
      options?.onExportError?.(error as Error)
      throw error
    }
  }, [user, exportManager, options])
  
  // Share calculation
  const shareCalculation = useCallback(async (
    id: string,
    options?: {
      expiresInDays?: number
      isPublic?: boolean
    }
  ) => {
    if (!user?.id) {
      throw new Error('User must be logged in to share calculations')
    }
    
    const result = await shareCalculationMutation.mutateAsync({
      id,
      userId: user.id,
      expiresInDays: options?.expiresInDays,
      isPublic: options?.isPublic
    })
    
    // Copy share link to clipboard
    if (result.shareableLink && navigator.clipboard) {
      await navigator.clipboard.writeText(result.shareableLink)
    }
    
    return result
  }, [user?.id, shareCalculationMutation])
  
  // Get user's saved calculations
  const getUserCalculations = useCallback(async (
    filter?: {
      type?: 'contract' | 'paycheck' | 'comparison'
      isFavorite?: boolean
      tags?: string[]
      startDate?: Date
      endDate?: Date
    }
  ) => {
    if (!user?.id) {
      return []
    }
    
    // Filter calculations based on criteria
    let filtered = userCalculations || []
    
    if (filter?.type) {
      filtered = filtered.filter(calc => calc.type === filter.type)
    }
    
    if (filter?.isFavorite !== undefined) {
      filtered = filtered.filter(calc => calc.isFavorite === filter.isFavorite)
    }
    
    if (filter?.tags && filter.tags.length > 0) {
      filtered = filtered.filter(calc => 
        calc.tags?.some(tag => filter.tags!.includes(tag))
      )
    }
    
    if (filter?.startDate) {
      filtered = filtered.filter(calc => 
        new Date(calc.timestamp) >= filter.startDate!
      )
    }
    
    if (filter?.endDate) {
      filtered = filtered.filter(calc => 
        new Date(calc.timestamp) <= filter.endDate!
      )
    }
    
    return filtered
  }, [user?.id, userCalculations])
  
  // Import calculations from file
  const importCalculations = useCallback(async (file: File) => {
    setError(null)
    
    try {
      const text = await file.text()
      let calculations: CalculationHistoryItem[]
      
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text)
        calculations = Array.isArray(data) ? data : data.calculations || []
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV - simplified version
        const lines = text.split('\n')
        const headers = lines[0].split(',')
        calculations = lines.slice(1).map(line => {
          const values = line.split(',')
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim()
          })
          return obj
        }).filter(obj => obj.id) // Filter out empty rows
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.')
      }
      
      // Save all imported calculations
      const saved = await Promise.all(
        calculations.map(calc => saveToDatabase(calc))
      )
      
      // Refetch calculations
      await refetchCalculations()
      
      return saved
    } catch (error) {
      setError(error as Error)
      throw error
    }
  }, [saveToDatabase, refetchCalculations])
  
  return {
    // State
    isSaving,
    isExporting,
    error,
    userCalculations: userCalculations || [],
    
    // Methods
    saveToDatabase,
    updateInDatabase,
    deleteFromDatabase,
    exportCalculation,
    exportMultiple,
    shareCalculation,
    getUserCalculations,
    importCalculations,
    
    // Refresh
    refetchCalculations
  }
}