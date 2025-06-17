import { BaseExporter } from './base-exporter'
import { ExportResult, ExportFormat, ExportOptions } from './types'

export interface JSONExportOptions extends ExportOptions {
  format: ExportFormat.JSON
  pretty?: boolean
  includeMetadata?: boolean
  excludeNullValues?: boolean
  customReplacer?: (key: string, value: any) => any
}

export class JSONExporter extends BaseExporter {
  private options: JSONExportOptions

  constructor(options: JSONExportOptions) {
    super(options)
    this.options = {
      pretty: true,
      includeMetadata: true,
      excludeNullValues: true,
      ...options,
    }
  }

  async export(data: any): Promise<ExportResult> {
    try {
      const filename = this.generateFilename('json')
      const jsonContent = this.generateJSONContent(data)
      const blob = this.createBlob(jsonContent, 'application/json;charset=utf-8')

      return {
        success: true,
        filename,
        format: ExportFormat.JSON,
        size: blob.size,
        blob,
        url: this.createDownloadUrl(blob),
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        format: ExportFormat.JSON,
        size: 0,
        error: error instanceof Error ? error.message : 'JSON export failed',
      }
    }
  }

  private generateJSONContent(data: any): string {
    const exportData: any = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      source: 'LocumTrueRate Calculator',
    }

    if (this.options.includeMetadata) {
      exportData.metadata = {
        ...this.metadata,
        exportOptions: {
          format: this.options.format,
          locale: this.options.locale,
          currency: this.options.currency,
        },
      }
    }

    // Extract and structure data based on sections
    const sections = this.getSections(data)
    exportData.sections = {}

    sections.forEach(section => {
      if (section.visible && section.data && Object.keys(section.data).length > 0) {
        const sectionKey = this.toKebabCase(section.title)
        exportData.sections[sectionKey] = this.processSection(section.data)
      }
    })

    // Add raw data if requested
    if (this.options.includeRawData !== false) {
      exportData.rawData = this.processData(data)
    }

    // Add calculations if available
    if (data.calculations || data.formulas) {
      exportData.calculations = this.extractCalculations(data)
    }

    // Add comparison data if available
    if (this.options.includeComparison && data.comparison) {
      exportData.comparison = Array.isArray(data.comparison) 
        ? data.comparison.map(item => this.processData(item))
        : this.processData(data.comparison)
    }

    // Add projections if available
    if (this.options.includeProjections && (data.annualProjection || data.projections)) {
      exportData.projections = this.extractProjectionData(data)
    }

    // Convert to JSON string
    const space = this.options.pretty ? 2 : undefined
    const replacer = this.options.customReplacer || this.defaultReplacer.bind(this)
    
    return JSON.stringify(exportData, replacer, space)
  }

  private processSection(sectionData: Record<string, any>): Record<string, any> {
    const processed: Record<string, any> = {}
    
    Object.entries(sectionData).forEach(([key, value]) => {
      if (!this.options.excludeNullValues || (value !== null && value !== undefined)) {
        const processedKey = this.toKebabCase(key)
        processed[processedKey] = this.processValue(value, key)
      }
    })
    
    return processed
  }

  private processData(data: any): any {
    if (data === null || data === undefined) {
      return this.options.excludeNullValues ? undefined : null
    }

    if (Array.isArray(data)) {
      return data.map(item => this.processData(item))
    }

    if (typeof data === 'object' && data.constructor === Object) {
      const processed: Record<string, any> = {}
      
      Object.entries(data).forEach(([key, value]) => {
        if (!this.options.excludeNullValues || (value !== null && value !== undefined)) {
          processed[key] = this.processData(value)
        }
      })
      
      return processed
    }

    return data
  }

  private processValue(value: any, key: string): any {
    if (value === null || value === undefined) {
      return this.options.excludeNullValues ? undefined : null
    }

    // Format currency values
    if (typeof value === 'number' && this.isCurrencyField(key)) {
      return {
        amount: value,
        formatted: this.formatValue(value, 'currency'),
        currency: this.options.currency || 'USD',
      }
    }

    // Format percentage values
    if (typeof value === 'number' && this.isPercentageField(key)) {
      return {
        value: value,
        formatted: this.formatValue(value, 'percentage'),
      }
    }

    // Format date values
    if (value instanceof Date) {
      return {
        iso: value.toISOString(),
        formatted: this.formatDate(value),
      }
    }

    return value
  }

  private extractCalculations(data: any): any {
    const calculations: any = {}

    if (data.taxes && data.grossPay) {
      calculations.effectiveTaxRate = {
        formula: '(Total Taxes / Gross Pay) * 100',
        inputs: {
          totalTaxes: data.taxes.total,
          grossPay: data.grossPay,
        },
        result: (data.taxes.total / data.grossPay) * 100,
        formatted: this.formatValue((data.taxes.total / data.grossPay) * 100, 'percentage'),
      }

      calculations.takeHomePercentage = {
        formula: '(Net Pay / Gross Pay) * 100',
        inputs: {
          netPay: data.netPay,
          grossPay: data.grossPay,
        },
        result: (data.netPay / data.grossPay) * 100,
        formatted: this.formatValue((data.netPay / data.grossPay) * 100, 'percentage'),
      }
    }

    if (data.contractType && data.hourlyRate) {
      calculations.annualEquivalent = {
        formula: 'Hourly Rate * Hours/Week * 52',
        inputs: {
          hourlyRate: data.hourlyRate,
          hoursPerWeek: data.hoursPerWeek || 40,
          weeksPerYear: 52,
        },
        result: data.annualEquivalent || 0,
        formatted: this.formatValue(data.annualEquivalent || 0, 'currency'),
      }
    }

    return calculations
  }

  private extractProjectionData(data: any): any {
    const projections: any = {}

    if (data.annualProjection) {
      projections.annual = {
        gross: {
          amount: data.annualProjection.gross,
          formatted: this.formatValue(data.annualProjection.gross, 'currency'),
        },
        net: {
          amount: data.annualProjection.net,
          formatted: this.formatValue(data.annualProjection.net, 'currency'),
        },
        taxes: {
          amount: data.annualProjection.taxes,
          formatted: this.formatValue(data.annualProjection.taxes, 'currency'),
        },
        effectiveRate: {
          value: (data.annualProjection.taxes / data.annualProjection.gross) * 100,
          formatted: this.formatValue((data.annualProjection.taxes / data.annualProjection.gross) * 100, 'percentage'),
        },
      }

      // Add monthly breakdown
      projections.monthly = {
        gross: {
          amount: data.annualProjection.gross / 12,
          formatted: this.formatValue(data.annualProjection.gross / 12, 'currency'),
        },
        net: {
          amount: data.annualProjection.net / 12,
          formatted: this.formatValue(data.annualProjection.net / 12, 'currency'),
        },
        taxes: {
          amount: data.annualProjection.taxes / 12,
          formatted: this.formatValue(data.annualProjection.taxes / 12, 'currency'),
        },
      }
    }

    return projections
  }

  private defaultReplacer(key: string, value: any): any {
    // Handle special number cases
    if (typeof value === 'number') {
      if (isNaN(value)) return 'NaN'
      if (!isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity'
    }
    
    // Exclude internal properties
    if (key.startsWith('_')) return undefined
    
    return value
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }

  private isCurrencyField(key: string): boolean {
    const currencyKeywords = ['pay', 'tax', 'salary', 'income', 'amount', 'cost', 'price', 'rate']
    const lowerKey = key.toLowerCase()
    return currencyKeywords.some(keyword => lowerKey.includes(keyword)) && 
           !lowerKey.includes('percentage') && 
           !lowerKey.includes('percent')
  }

  private isPercentageField(key: string): boolean {
    const lowerKey = key.toLowerCase()
    return lowerKey.includes('rate') || 
           lowerKey.includes('percent') || 
           lowerKey.includes('percentage')
  }

  // Static method for quick JSON export
  static async quickExport(data: any, pretty: boolean = true): Promise<ExportResult> {
    const exporter = new JSONExporter({
      format: ExportFormat.JSON,
      pretty,
      includeMetadata: false,
    })

    return exporter.export(data)
  }

  // Convert JSON to other formats
  static parse(jsonString: string): any {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}