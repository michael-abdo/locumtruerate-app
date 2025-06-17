import { ExportFormat, ExportOptions, ExportResult } from './types'
import { PDFExporter } from './pdf-exporter'
import { ExcelExporter } from './excel-exporter'
import { CSVExporter } from './csv-exporter'
import { JSONExporter } from './json-exporter'

export class ExportManager {
  private static instance: ExportManager
  private exporters: Map<ExportFormat, any>

  private constructor() {
    this.exporters = new Map([
      [ExportFormat.PDF, PDFExporter],
      [ExportFormat.EXCEL, ExcelExporter],
      [ExportFormat.CSV, CSVExporter],
      [ExportFormat.JSON, JSONExporter],
    ])
  }

  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager()
    }
    return ExportManager.instance
  }

  async export(data: any, options: ExportOptions): Promise<ExportResult> {
    const ExporterClass = this.exporters.get(options.format)
    
    if (!ExporterClass) {
      return {
        success: false,
        filename: '',
        format: options.format,
        size: 0,
        error: `Unsupported export format: ${options.format}`,
      }
    }

    try {
      const exporter = new (ExporterClass as any)(options)
      return await exporter.export(data)
    } catch (error) {
      return {
        success: false,
        filename: '',
        format: options.format,
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed',
      }
    }
  }

  async exportMultiple(
    data: any, 
    formats: ExportFormat[], 
    baseOptions?: Partial<ExportOptions>
  ): Promise<Record<ExportFormat, ExportResult>> {
    const results: Record<ExportFormat, ExportResult> = {} as any
    
    const exportPromises = formats.map(format => 
      this.export(data, { ...baseOptions, format } as ExportOptions)
        .then(result => ({ format, result }))
    )

    const exportResults = await Promise.all(exportPromises)
    
    exportResults.forEach(({ format, result }) => {
      results[format] = result
    })

    return results
  }

  getSupportedFormats(): ExportFormat[] {
    return Array.from(this.exporters.keys())
  }

  isFormatSupported(format: ExportFormat): boolean {
    return this.exporters.has(format)
  }

  // Platform-specific export handling
  async exportForPlatform(
    data: any,
    options: ExportOptions,
    platform: 'web' | 'ios' | 'android' = 'web'
  ): Promise<ExportResult> {
    const result = await this.export(data, options)

    if (!result.success) {
      return result
    }

    // Platform-specific handling
    switch (platform) {
      case 'web':
        // Web: Create download link and trigger download
        if (result.blob && typeof window !== 'undefined') {
          const link = document.createElement('a')
          link.href = result.url || URL.createObjectURL(result.blob)
          link.download = result.filename
          link.click()
          
          // Cleanup
          setTimeout(() => {
            if (result.url) {
              URL.revokeObjectURL(result.url)
            }
          }, 1000)
        }
        break

      case 'ios':
      case 'android':
        // Mobile: Return result for React Native to handle
        // React Native will use FileSystem API or Share API
        return {
          ...result,
          platformData: {
            mimeType: this.getMimeType(options.format),
            encoding: 'base64',
          },
        }
    }

    return result
  }

  private getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      [ExportFormat.PDF]: 'application/pdf',
      [ExportFormat.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      [ExportFormat.CSV]: 'text/csv',
      [ExportFormat.JSON]: 'application/json',
    }
    return mimeTypes[format] || 'application/octet-stream'
  }

  // Utility method to convert blob to base64 for mobile platforms
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64.split(',')[1]) // Remove data URL prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Get export options for a specific format
  getDefaultOptions(format: ExportFormat): Partial<ExportOptions> {
    const defaultOptions: Record<ExportFormat, Partial<ExportOptions>> = {
      [ExportFormat.PDF]: {
        includeCharts: true,
        includeTimestamp: true,
        pageSize: 'Letter',
        orientation: 'portrait',
      },
      [ExportFormat.EXCEL]: {
        includeFormulas: true,
        autoFilter: true,
        freezePanes: true,
      },
      [ExportFormat.CSV]: {
        includeHeaders: true,
        delimiter: ',',
      },
      [ExportFormat.JSON]: {
        pretty: true,
        includeMetadata: true,
      },
    }

    return {
      ...defaultOptions[format],
      format,
      includeBreakdown: true,
      includeTaxDetails: true,
      includeProjections: true,
      locale: 'en-US',
      currency: 'USD',
    }
  }
}

// Export singleton instance
export const exportManager = ExportManager.getInstance()