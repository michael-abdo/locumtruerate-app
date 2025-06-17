export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeCharts?: boolean
  includeBreakdown?: boolean
  includeComparison?: boolean
  includeTaxDetails?: boolean
  includeProjections?: boolean
  locale?: string
  currency?: string
  dateFormat?: string
  companyInfo?: CompanyInfo
  customHeaders?: Record<string, string>
  watermark?: string
}

export interface CompanyInfo {
  name?: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  website?: string
}

export interface ExportMetadata {
  exportDate: Date
  exportedBy?: string
  version: string
  dataSource: string
}

export interface ExportResult {
  success: boolean
  filename: string
  format: ExportFormat
  size: number
  url?: string
  blob?: Blob
  error?: string
}

export interface PDFExportOptions extends ExportOptions {
  format: ExportFormat.PDF
  pageSize?: 'A4' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  fontSize?: number
  fontFamily?: string
  headerColor?: string
  includePageNumbers?: boolean
  includeTimestamp?: boolean
}

export interface ExcelExportOptions extends ExportOptions {
  format: ExportFormat.EXCEL
  sheetName?: string
  includeFormulas?: boolean
  autoFilter?: boolean
  freezePanes?: boolean
  columnWidths?: Record<string, number>
  headerStyle?: {
    bold?: boolean
    fontSize?: number
    backgroundColor?: string
    textColor?: string
  }
}

export interface CSVExportOptions extends ExportOptions {
  format: ExportFormat.CSV
  delimiter?: ',' | ';' | '\t' | '|'
  includeHeaders?: boolean
  quote?: '"' | "'"
  escape?: string
  lineBreak?: '\n' | '\r\n'
  encoding?: 'utf-8' | 'utf-16' | 'ascii'
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut'
  title: string
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
  }>
}

export interface ExportSection {
  title: string
  data: Record<string, any>
  order?: number
  visible?: boolean
  customRenderer?: (data: any) => string | any[][]
}

export interface ExportTemplate {
  id: string
  name: string
  description?: string
  sections: ExportSection[]
  defaultOptions?: Partial<ExportOptions>
  supportedFormats: ExportFormat[]
}