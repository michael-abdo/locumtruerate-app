import { 
  ExportFormat, 
  exportManager, 
  PDFExporter, 
  ExcelExporter, 
  CSVExporter, 
  JSONExporter 
} from '../export'
import { ContractType, PayPeriod, FilingStatus } from '../types'

// Mock blob creation for tests
global.Blob = jest.fn((content, options) => ({
  size: Array.isArray(content) ? content[0].length : 0,
  type: options?.type || 'text/plain',
  arrayBuffer: jest.fn(),
  slice: jest.fn(),
  stream: jest.fn(),
  text: jest.fn(() => Promise.resolve(Array.isArray(content) ? content[0] : '')),
})) as any

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

const mockCalculationData = {
  contractType: ContractType.HOURLY,
  duration: 12,
  location: 'CA',
  hourlyRate: 200,
  hoursPerWeek: 40,
  grossPay: 96000,
  netPay: 68000,
  effectiveHourlyRate: 170,
  taxes: {
    federal: 18000,
    state: 7000,
    socialSecurity: 2000,
    medicare: 1000,
    total: 28000,
  },
  annualProjection: {
    gross: 96000,
    net: 68000,
    taxes: 28000,
  },
}

const mockPaycheckData = {
  payPeriod: PayPeriod.BIWEEKLY,
  grossSalary: 120000,
  grossPay: 4615.38,
  netPay: 3284.62,
  filingStatus: FilingStatus.SINGLE,
  state: 'CA',
  taxes: {
    federal: 923.08,
    state: 276.92,
    socialSecurity: 286.15,
    medicare: 66.92,
    additionalMedicare: 0,
    total: 1553.07,
  },
  deductions: {
    total: 0,
  },
  effectiveTaxRate: 33.64,
}

describe('Export functionality', () => {
  describe('ExportManager', () => {
    it('exports to PDF format', async () => {
      const result = await exportManager.export(mockCalculationData, {
        format: ExportFormat.PDF,
        filename: 'test-export',
      })

      expect(result.success).toBe(true)
      expect(result.format).toBe(ExportFormat.PDF)
      expect(result.filename).toBe('test-export.pdf')
      expect(result.size).toBeGreaterThan(0)
      expect(result.blob).toBeDefined()
      expect(result.url).toBe('blob:mock-url')
    })

    it('exports to Excel format', async () => {
      const result = await exportManager.export(mockCalculationData, {
        format: ExportFormat.EXCEL,
        includeFormulas: true,
      })

      expect(result.success).toBe(true)
      expect(result.format).toBe(ExportFormat.EXCEL)
      expect(result.filename).toMatch(/locumtruerate-export.*\.xlsx$/)
    })

    it('exports to CSV format', async () => {
      const result = await exportManager.export(mockPaycheckData, {
        format: ExportFormat.CSV,
        delimiter: ',',
        includeHeaders: true,
      })

      expect(result.success).toBe(true)
      expect(result.format).toBe(ExportFormat.CSV)
      expect(result.blob).toBeDefined()
    })

    it('exports to JSON format', async () => {
      const result = await exportManager.export(mockCalculationData, {
        format: ExportFormat.JSON,
        pretty: true,
        includeMetadata: true,
      })

      expect(result.success).toBe(true)
      expect(result.format).toBe(ExportFormat.JSON)
      
      // Parse the JSON to verify structure
      const jsonContent = await result.blob!.text()
      const parsed = JSON.parse(jsonContent)
      
      expect(parsed.version).toBe('1.0.0')
      expect(parsed.metadata).toBeDefined()
      expect(parsed.sections).toBeDefined()
    })

    it('exports multiple formats simultaneously', async () => {
      const formats = [ExportFormat.PDF, ExportFormat.CSV, ExportFormat.JSON]
      const results = await exportManager.exportMultiple(
        mockCalculationData,
        formats
      )

      expect(Object.keys(results)).toHaveLength(3)
      formats.forEach(format => {
        expect(results[format].success).toBe(true)
        expect(results[format].format).toBe(format)
      })
    })

    it('handles export errors gracefully', async () => {
      const result = await exportManager.export(null, {
        format: 'invalid' as ExportFormat,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('gets supported formats', () => {
      const formats = exportManager.getSupportedFormats()
      
      expect(formats).toContain(ExportFormat.PDF)
      expect(formats).toContain(ExportFormat.EXCEL)
      expect(formats).toContain(ExportFormat.CSV)
      expect(formats).toContain(ExportFormat.JSON)
    })

    it('checks format support', () => {
      expect(exportManager.isFormatSupported(ExportFormat.PDF)).toBe(true)
      expect(exportManager.isFormatSupported(ExportFormat.EXCEL)).toBe(true)
      expect(exportManager.isFormatSupported('invalid' as ExportFormat)).toBe(false)
    })
  })

  describe('PDFExporter', () => {
    it('generates PDF with custom options', async () => {
      const exporter = new PDFExporter({
        format: ExportFormat.PDF,
        pageSize: 'A4',
        orientation: 'landscape',
        includeCharts: true,
        watermark: 'CONFIDENTIAL',
      })

      const result = await exporter.export(mockCalculationData)
      const content = await result.blob!.text()

      expect(result.success).toBe(true)
      expect(content).toContain('LocumTrueRate Calculation Report')
      expect(content).toContain('CONFIDENTIAL')
      expect(content).toContain('size: A4')
    })

    it('includes tax breakdown in PDF', async () => {
      const exporter = new PDFExporter({
        format: ExportFormat.PDF,
        includeTaxDetails: true,
      })

      const result = await exporter.export(mockPaycheckData)
      const content = await result.blob!.text()

      expect(content).toContain('Tax Breakdown')
      expect(content).toContain('Federal Income Tax')
      expect(content).toContain('$923.08')
    })
  })

  describe('ExcelExporter', () => {
    it('creates multi-sheet workbook', async () => {
      const exporter = new ExcelExporter({
        format: ExportFormat.EXCEL,
        includeTaxDetails: true,
        includeProjections: true,
      })

      const result = await exporter.export(mockCalculationData)
      const content = await result.blob!.text()

      expect(result.success).toBe(true)
      // CSV representation should include main data
      expect(content).toContain('LocumTrueRate Calculation Export')
      expect(content).toContain('96000') // Gross pay
    })

    it('includes formulas when enabled', async () => {
      const exporter = new ExcelExporter({
        format: ExportFormat.EXCEL,
        includeFormulas: true,
      })

      const result = await exporter.export(mockCalculationData)
      const content = await result.blob!.text()

      expect(content).toContain('=')
      expect(content).toContain('SUM')
    })
  })

  describe('CSVExporter', () => {
    it('exports with custom delimiter', async () => {
      const exporter = new CSVExporter({
        format: ExportFormat.CSV,
        delimiter: ';',
        includeHeaders: true,
      })

      const result = await exporter.export(mockPaycheckData)
      const content = await result.blob!.text()

      expect(result.success).toBe(true)
      expect(content).toContain(';')
      expect(content).toContain('Field;Value')
    })

    it('handles special characters in CSV', async () => {
      const dataWithSpecialChars = {
        ...mockCalculationData,
        notes: 'This has, commas and "quotes"',
      }

      const exporter = new CSVExporter({
        format: ExportFormat.CSV,
      })

      const result = await exporter.export(dataWithSpecialChars)
      const content = await result.blob!.text()

      expect(content).toContain('"This has, commas and ""quotes"""')
    })

    it('uses static quickExport method', async () => {
      const data = [
        { name: 'Contract 1', rate: 200, location: 'CA' },
        { name: 'Contract 2', rate: 250, location: 'TX' },
      ]

      const result = await CSVExporter.quickExport(data)
      
      expect(result.success).toBe(true)
      expect(result.format).toBe(ExportFormat.CSV)
    })

    it('converts tabular data to CSV', () => {
      const tabularData = [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Value 1', 'Value 2', 'Value 3'],
        ['Data 1', 'Data 2', 'Data 3'],
      ]

      const csv = CSVExporter.tabularToCSV(tabularData)
      
      expect(csv).toContain('Header 1,Header 2,Header 3')
      expect(csv).toContain('Value 1,Value 2,Value 3')
      expect(csv.split('\n')).toHaveLength(3)
    })
  })

  describe('JSONExporter', () => {
    it('exports with metadata', async () => {
      const exporter = new JSONExporter({
        format: ExportFormat.JSON,
        pretty: true,
        includeMetadata: true,
      })

      const result = await exporter.export(mockCalculationData)
      const content = await result.blob!.text()
      const parsed = JSON.parse(content)

      expect(parsed.metadata).toBeDefined()
      expect(parsed.metadata.exportDate).toBeDefined()
      expect(parsed.metadata.version).toBe('1.0.0')
      expect(parsed.metadata.dataSource).toBe('LocumTrueRate Calculator')
    })

    it('formats currency and percentage values', async () => {
      const exporter = new JSONExporter({
        format: ExportFormat.JSON,
      })

      const result = await exporter.export(mockPaycheckData)
      const content = await result.blob!.text()
      const parsed = JSON.parse(content)

      // Check if currency values are properly formatted
      expect(parsed.sections.summary['gross-pay']).toEqual({
        amount: 4615.38,
        formatted: '$4,615.38',
        currency: 'USD',
      })

      // Check if percentage values are properly formatted
      expect(parsed.sections.summary['effective-tax-rate']).toEqual({
        value: 33.64,
        formatted: '33.64%',
      })
    })

    it('excludes null values when configured', async () => {
      const dataWithNulls = {
        ...mockCalculationData,
        nullField: null,
        undefinedField: undefined,
        validField: 'test',
      }

      const exporter = new JSONExporter({
        format: ExportFormat.JSON,
        excludeNullValues: true,
      })

      const result = await exporter.export(dataWithNulls)
      const content = await result.blob!.text()
      const parsed = JSON.parse(content)

      expect(content).not.toContain('nullField')
      expect(content).not.toContain('undefinedField')
      expect(content).toContain('validField')
    })

    it('includes calculations and formulas', async () => {
      const exporter = new JSONExporter({
        format: ExportFormat.JSON,
      })

      const result = await exporter.export(mockCalculationData)
      const content = await result.blob!.text()
      const parsed = JSON.parse(content)

      expect(parsed.calculations).toBeDefined()
      expect(parsed.calculations.effectiveTaxRate).toBeDefined()
      expect(parsed.calculations.effectiveTaxRate.formula).toBe('(Total Taxes / Gross Pay) * 100')
      expect(parsed.calculations.effectiveTaxRate.result).toBeCloseTo(29.17, 2)
    })
  })

  describe('Platform-specific exports', () => {
    it('handles web platform export', async () => {
      const mockClick = jest.fn()
      const mockCreateElement = jest.spyOn(document, 'createElement')
      mockCreateElement.mockReturnValue({
        click: mockClick,
        href: '',
        download: '',
      } as any)

      await exportManager.exportForPlatform(
        mockCalculationData,
        { format: ExportFormat.PDF },
        'web'
      )

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockClick).toHaveBeenCalled()
      
      mockCreateElement.mockRestore()
    })

    it('handles mobile platform export', async () => {
      const result = await exportManager.exportForPlatform(
        mockCalculationData,
        { format: ExportFormat.PDF },
        'ios'
      )

      expect(result.success).toBe(true)
      expect(result.platformData).toBeDefined()
      expect(result.platformData!.mimeType).toBe('application/pdf')
      expect(result.platformData!.encoding).toBe('base64')
    })
  })

  describe('Export edge cases', () => {
    it('handles empty data gracefully', async () => {
      const result = await exportManager.export({}, {
        format: ExportFormat.JSON,
      })

      expect(result.success).toBe(true)
      const content = await result.blob!.text()
      const parsed = JSON.parse(content)
      expect(parsed.sections).toEqual({})
    })

    it('handles very large numbers', async () => {
      const largeData = {
        veryLargeNumber: 999999999999.99,
        verySmallNumber: 0.00000001,
      }

      const result = await exportManager.export(largeData, {
        format: ExportFormat.JSON,
      })

      expect(result.success).toBe(true)
      const content = await result.blob!.text()
      expect(content).toContain('999999999999.99')
      expect(content).toContain('0.00000001')
    })

    it('generates unique filenames with timestamps', async () => {
      const result1 = await exportManager.export(mockCalculationData, {
        format: ExportFormat.PDF,
      })

      const result2 = await exportManager.export(mockCalculationData, {
        format: ExportFormat.PDF,
      })

      expect(result1.filename).toMatch(/locumtruerate-export-\d{4}-\d{2}-\d{2}\.pdf/)
      expect(result1.filename).toBe(result2.filename) // Same date
    })
  })
})