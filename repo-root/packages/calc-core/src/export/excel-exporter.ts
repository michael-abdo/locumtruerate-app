import { BaseExporter } from './base-exporter'
import { ExportResult, ExcelExportOptions, ExportFormat } from './types'

export class ExcelExporter extends BaseExporter {
  protected options: ExcelExportOptions

  constructor(options: ExcelExportOptions) {
    super(options)
    this.options = {
      sheetName: 'Calculation Results',
      includeFormulas: true,
      autoFilter: true,
      freezePanes: true,
      headerStyle: {
        bold: true,
        fontSize: 14,
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
      },
      ...options,
    }
  }

  async export(data: any): Promise<ExportResult> {
    try {
      const filename = this.generateFilename('xlsx')
      const excelContent = this.generateExcelContent(data)
      const blob = this.createExcelBlob(excelContent)

      return {
        success: true,
        filename,
        format: ExportFormat.EXCEL,
        size: blob.size,
        blob,
        url: this.createDownloadUrl(blob),
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        format: ExportFormat.EXCEL,
        size: 0,
        error: error instanceof Error ? error.message : 'Excel export failed',
      }
    }
  }

  private generateExcelContent(data: any): any {
    const sections = this.getSections(data)
    const workbook: any = {
      worksheets: []
    }

    // Main calculation sheet
    const mainSheet = {
      name: this.options.sheetName,
      data: this.generateMainSheetData(sections, data),
      columns: this.generateColumns(data),
      freezeRow: this.options.freezePanes ? 3 : 0,
      autoFilter: this.options.autoFilter,
    }
    workbook.worksheets.push(mainSheet)

    // Tax details sheet
    if (this.options.includeTaxDetails && data.taxes) {
      const taxSheet = {
        name: 'Tax Details',
        data: this.generateTaxSheetData(data),
        columns: [
          { header: 'Tax Type', key: 'type', width: 30 },
          { header: 'Amount', key: 'amount', width: 20 },
          { header: 'Rate', key: 'rate', width: 15 },
          { header: 'Notes', key: 'notes', width: 40 },
        ],
      }
      workbook.worksheets.push(taxSheet)
    }

    // Projections sheet
    if (this.options.includeProjections && (data.annualProjection || data.projections)) {
      const projectionSheet = {
        name: 'Projections',
        data: this.generateProjectionSheetData(data),
        columns: [
          { header: 'Period', key: 'period', width: 20 },
          { header: 'Gross Income', key: 'gross', width: 20 },
          { header: 'Net Income', key: 'net', width: 20 },
          { header: 'Total Taxes', key: 'taxes', width: 20 },
          { header: 'Effective Rate', key: 'rate', width: 20 },
        ],
      }
      workbook.worksheets.push(projectionSheet)
    }

    return workbook
  }

  private generateMainSheetData(sections: any[], data: any): any[][] {
    const rows: any[][] = []

    // Header rows
    rows.push(['LocumTrueRate Calculation Export'])
    rows.push([`Generated on: ${this.formatDate(new Date())}`])
    rows.push([]) // Empty row

    // Summary section
    rows.push(['SUMMARY', '', '', ''])
    sections.forEach(section => {
      if (section.title === 'Summary' && section.data) {
        Object.entries(section.data).forEach(([key, value]) => {
          rows.push([key, value])
        })
      }
    })
    rows.push([]) // Empty row

    // Other sections
    sections.filter(s => s.title !== 'Summary').forEach(section => {
      if (section.visible && section.data && Object.keys(section.data).length > 0) {
        rows.push([section.title.toUpperCase(), '', '', ''])
        Object.entries(section.data).forEach(([key, value]) => {
          rows.push([key, value])
        })
        rows.push([]) // Empty row
      }
    })

    // Add formulas if enabled
    if (this.options.includeFormulas && data.grossPay && data.netPay) {
      rows.push(['CALCULATIONS', '', '', ''])
      rows.push(['Effective Tax Rate', `=(${data.grossPay}-${data.netPay})/${data.grossPay}*100`])
      rows.push(['Take Home %', `=${data.netPay}/${data.grossPay}*100`])
      
      if (data.taxes) {
        rows.push(['Tax Burden', `=${data.taxes.total}/${data.grossPay}*100`])
      }
    }

    return rows
  }

  private generateTaxSheetData(data: any): any[][] {
    const rows: any[][] = []
    
    // Headers
    rows.push(['Tax Type', 'Amount', 'Rate', 'Notes'])

    // Federal taxes
    if (data.taxes.federal !== undefined) {
      rows.push([
        'Federal Income Tax',
        this.formatValue(data.taxes.federal, 'currency'),
        data.taxBracket || 'Progressive',
        'Based on filing status and income'
      ])
    }

    // State taxes
    if (data.taxes.state !== undefined) {
      rows.push([
        `State Income Tax (${data.state || data.location})`,
        this.formatValue(data.taxes.state, 'currency'),
        data.stateTaxRate || 'Varies',
        data.taxes.state === 0 ? 'No state income tax' : 'State specific rates'
      ])
    }

    // FICA taxes
    if (data.taxes.socialSecurity !== undefined) {
      rows.push([
        'Social Security',
        this.formatValue(data.taxes.socialSecurity, 'currency'),
        '6.2%',
        `Capped at wage base limit`
      ])
    }

    if (data.taxes.medicare !== undefined) {
      rows.push([
        'Medicare',
        this.formatValue(data.taxes.medicare, 'currency'),
        '1.45%',
        'No wage cap'
      ])
    }

    if (data.taxes.additionalMedicare && data.taxes.additionalMedicare > 0) {
      rows.push([
        'Additional Medicare',
        this.formatValue(data.taxes.additionalMedicare, 'currency'),
        '0.9%',
        'High earner surcharge'
      ])
    }

    // Total row with formula
    rows.push([]) // Empty row
    rows.push([
      'TOTAL TAXES',
      this.options.includeFormulas ? '=SUM(B2:B' + (rows.length - 1) + ')' : this.formatValue(data.taxes.total, 'currency'),
      '',
      ''
    ])

    return rows
  }

  private generateProjectionSheetData(data: any): any[][] {
    const rows: any[][] = []
    
    // Headers
    rows.push(['Period', 'Gross Income', 'Net Income', 'Total Taxes', 'Effective Rate'])

    // Current period
    if (data.payPeriod) {
      rows.push([
        data.payPeriod,
        this.formatValue(data.grossPay, 'currency'),
        this.formatValue(data.netPay, 'currency'),
        this.formatValue(data.taxes.total, 'currency'),
        this.formatValue(data.effectiveTaxRate, 'percentage')
      ])
    }

    // Annual projection
    if (data.annualProjection) {
      rows.push([
        'Annual',
        this.formatValue(data.annualProjection.gross, 'currency'),
        this.formatValue(data.annualProjection.net, 'currency'),
        this.formatValue(data.annualProjection.taxes, 'currency'),
        this.options.includeFormulas ? '=(D3/B3)*100' : this.formatValue((data.annualProjection.taxes / data.annualProjection.gross) * 100, 'percentage')
      ])
    }

    // Monthly breakdown
    if (data.annualProjection) {
      rows.push([
        'Monthly Average',
        this.formatValue(data.annualProjection.gross / 12, 'currency'),
        this.formatValue(data.annualProjection.net / 12, 'currency'),
        this.formatValue(data.annualProjection.taxes / 12, 'currency'),
        this.options.includeFormulas ? '=(D4/B4)*100' : ''
      ])
    }

    return rows
  }

  private generateColumns(data: any): any[] {
    const columns = [
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Value', key: 'value', width: 25 },
    ]

    if (this.options.includeComparison) {
      columns.push(
        { header: 'Comparison', key: 'comparison', width: 25 },
        { header: 'Difference', key: 'difference', width: 20 }
      )
    }

    return columns
  }

  private createExcelBlob(content: any): Blob {
    // Create a simple CSV representation that Excel can open
    const csvContent = this.convertToCSV(content)
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  }

  private convertToCSV(workbook: any): string {
    const mainSheet = workbook.worksheets[0]
    if (!mainSheet || !mainSheet.data) return ''

    // Convert array data to CSV
    const csvRows = mainSheet.data.map((row: any[]) => {
      return row.map(cell => {
        // Handle formulas and special characters
        const value = String(cell || '')
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    })

    return csvRows.join('\n')
  }
}