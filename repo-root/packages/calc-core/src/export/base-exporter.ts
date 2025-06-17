import { 
  ExportFormat, 
  ExportOptions, 
  ExportResult, 
  ExportMetadata,
  ExportSection,
} from './types'
import { formatCurrency, formatPercentage, formatNumber } from '../utils'

export abstract class BaseExporter {
  protected options: ExportOptions
  protected metadata: ExportMetadata

  constructor(options: ExportOptions) {
    this.options = {
      locale: 'en-US',
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      includeBreakdown: true,
      includeComparison: false,
      includeTaxDetails: true,
      includeProjections: true,
      ...options,
    }

    this.metadata = {
      exportDate: new Date(),
      version: '1.0.0',
      dataSource: 'LocumTrueRate Calculator',
      exportedBy: options.filename?.includes('user-') ? 'Authenticated User' : 'Guest',
    }
  }

  abstract export(data: any): Promise<ExportResult>

  protected generateFilename(extension: string): string {
    if (this.options.filename) {
      return this.options.filename.endsWith(extension) 
        ? this.options.filename 
        : `${this.options.filename}.${extension}`
    }

    const timestamp = new Date().toISOString().split('T')[0]
    return `locumtruerate-export-${timestamp}.${extension}`
  }

  protected formatValue(value: any, type?: string): string {
    if (value === null || value === undefined) return ''
    
    switch (type) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return formatPercentage(value)
      case 'number':
        return formatNumber(value)
      case 'date':
        return this.formatDate(value)
      default:
        return String(value)
    }
  }

  protected formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const format = this.options.dateFormat || 'MM/dd/yyyy'
    
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const year = d.getFullYear()
    
    return format
      .replace('MM', month)
      .replace('dd', day)
      .replace('yyyy', String(year))
      .replace('yy', String(year).slice(-2))
  }

  protected getSections(data: any): ExportSection[] {
    const sections: ExportSection[] = []

    // Main summary section
    sections.push({
      title: 'Summary',
      order: 1,
      visible: true,
      data: this.extractSummary(data),
    })

    // Tax breakdown
    if (this.options.includeTaxDetails && data.taxes) {
      sections.push({
        title: 'Tax Breakdown',
        order: 2,
        visible: true,
        data: this.extractTaxDetails(data),
      })
    }

    // Detailed breakdown
    if (this.options.includeBreakdown && data.breakdown) {
      sections.push({
        title: 'Detailed Breakdown',
        order: 3,
        visible: true,
        data: this.extractBreakdown(data),
      })
    }

    // Projections
    if (this.options.includeProjections && (data.annualProjection || data.projections)) {
      sections.push({
        title: 'Projections',
        order: 4,
        visible: true,
        data: this.extractProjections(data),
      })
    }

    // Comparison
    if (this.options.includeComparison && data.comparison) {
      sections.push({
        title: 'Comparison',
        order: 5,
        visible: true,
        data: this.extractComparison(data),
      })
    }

    return sections.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  protected extractSummary(data: any): Record<string, any> {
    const summary: Record<string, any> = {}

    // Contract data
    if (data.contractType) {
      summary['Contract Type'] = data.contractType
      summary['Duration'] = `${data.duration} ${data.duration === 1 ? 'week' : 'weeks'}`
      summary['Location'] = data.location
      summary['Gross Pay'] = formatCurrency(data.grossPay)
      summary['Net Pay'] = formatCurrency(data.netPay)
      summary['Effective Hourly Rate'] = formatCurrency(data.effectiveHourlyRate)
    }

    // Paycheck data
    if (data.payPeriod) {
      summary['Pay Period'] = data.payPeriod
      summary['Gross Pay'] = formatCurrency(data.grossPay)
      summary['Net Pay'] = formatCurrency(data.netPay)
      summary['Total Taxes'] = formatCurrency(data.taxes.total)
      summary['Total Deductions'] = formatCurrency(data.deductions?.total || 0)
      summary['Effective Tax Rate'] = formatPercentage(data.effectiveTaxRate / 100)
    }

    return summary
  }

  protected extractTaxDetails(data: any): Record<string, any> {
    const taxes: Record<string, any> = {}

    if (data.taxes) {
      if (data.taxes.federal !== undefined) {
        taxes['Federal Income Tax'] = formatCurrency(data.taxes.federal)
      }
      if (data.taxes.state !== undefined) {
        taxes['State Income Tax'] = formatCurrency(data.taxes.state)
      }
      if (data.taxes.socialSecurity !== undefined) {
        taxes['Social Security'] = formatCurrency(data.taxes.socialSecurity)
      }
      if (data.taxes.medicare !== undefined) {
        taxes['Medicare'] = formatCurrency(data.taxes.medicare)
      }
      if (data.taxes.additionalMedicare !== undefined && data.taxes.additionalMedicare > 0) {
        taxes['Additional Medicare'] = formatCurrency(data.taxes.additionalMedicare)
      }
      if (data.taxes.total !== undefined) {
        taxes['Total Taxes'] = formatCurrency(data.taxes.total)
      }
    }

    return taxes
  }

  protected extractBreakdown(data: any): Record<string, any> {
    const breakdown: Record<string, any> = {}

    if (data.breakdown) {
      Object.entries(data.breakdown).forEach(([key, value]) => {
        if (value && typeof value === 'number' && value > 0) {
          breakdown[this.formatKey(key)] = formatCurrency(value)
        }
      })
    }

    return breakdown
  }

  protected extractProjections(data: any): Record<string, any> {
    const projections: Record<string, any> = {}

    if (data.annualProjection) {
      projections['Annual Gross'] = formatCurrency(data.annualProjection.gross)
      projections['Annual Net'] = formatCurrency(data.annualProjection.net)
      projections['Annual Taxes'] = formatCurrency(data.annualProjection.taxes)
      if (data.annualProjection.deductions) {
        projections['Annual Deductions'] = formatCurrency(data.annualProjection.deductions)
      }
    }

    if (data.annualEquivalent) {
      projections['Annual Equivalent'] = formatCurrency(data.annualEquivalent)
    }

    return projections
  }

  protected extractComparison(data: any): Record<string, any> {
    const comparison: Record<string, any> = {}

    if (data.comparison) {
      Object.entries(data.comparison).forEach(([key, value]) => {
        comparison[this.formatKey(key)] = this.formatValue(value, this.inferType(key, value))
      })
    }

    return comparison
  }

  protected formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim()
  }

  protected inferType(key: string, value: any): string {
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('percent')) {
        return 'percentage'
      }
      if (key.toLowerCase().includes('pay') || 
          key.toLowerCase().includes('tax') || 
          key.toLowerCase().includes('salary') ||
          key.toLowerCase().includes('income') ||
          key.toLowerCase().includes('amount')) {
        return 'currency'
      }
      return 'number'
    }
    return 'string'
  }

  protected createBlob(content: string | ArrayBuffer, mimeType: string): Blob {
    return new Blob([content], { type: mimeType })
  }

  protected createDownloadUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
  }
}