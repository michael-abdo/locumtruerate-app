import { BaseExporter } from './base-exporter'
import { ExportResult, PDFExportOptions, ExportFormat } from './types'

// Simple PDF generation without external dependencies
export class PDFExporter extends BaseExporter {
  private options: PDFExportOptions

  constructor(options: PDFExportOptions) {
    super(options)
    this.options = {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      fontSize: 12,
      fontFamily: 'Helvetica',
      headerColor: '#2563eb',
      includePageNumbers: true,
      includeTimestamp: true,
      ...options,
    }
  }

  async export(data: any): Promise<ExportResult> {
    try {
      const filename = this.generateFilename('pdf')
      const pdfContent = this.generatePDFContent(data)
      const blob = this.createBlob(pdfContent, 'application/pdf')

      return {
        success: true,
        filename,
        format: ExportFormat.PDF,
        size: blob.size,
        blob,
        url: this.createDownloadUrl(blob),
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        format: ExportFormat.PDF,
        size: 0,
        error: error instanceof Error ? error.message : 'PDF export failed',
      }
    }
  }

  private generatePDFContent(data: any): string {
    // Generate a simple PDF-like HTML that can be printed to PDF
    const sections = this.getSections(data)
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${this.options.filename || 'LocumTrueRate Export'}</title>
  <style>
    @media print {
      @page {
        size: ${this.options.pageSize};
        margin: ${this.options.margins?.top}mm ${this.options.margins?.right}mm ${this.options.margins?.bottom}mm ${this.options.margins?.left}mm;
      }
      body {
        margin: 0;
        font-family: ${this.options.fontFamily};
        font-size: ${this.options.fontSize}pt;
        line-height: 1.6;
        color: #1f2937;
      }
      .page-break {
        page-break-after: always;
      }
      .no-print {
        display: none;
      }
    }
    
    body {
      font-family: ${this.options.fontFamily};
      font-size: ${this.options.fontSize}pt;
      line-height: 1.6;
      color: #1f2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background-color: ${this.options.headerColor};
      color: white;
      padding: 20px;
      margin: -20px -20px 20px -20px;
      text-align: center;
    }
    
    .header h1 {
      margin: 0;
      font-size: 24pt;
      font-weight: bold;
    }
    
    .header .subtitle {
      margin-top: 5px;
      font-size: 14pt;
      opacity: 0.9;
    }
    
    .metadata {
      background-color: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
      font-size: 10pt;
    }
    
    .metadata p {
      margin: 5px 0;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section h2 {
      color: ${this.options.headerColor};
      font-size: 18pt;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${this.options.headerColor};
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .data-table tr {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .data-table td {
      padding: 10px;
      vertical-align: top;
    }
    
    .data-table td:first-child {
      font-weight: 600;
      color: #374151;
      width: 40%;
    }
    
    .data-table td:last-child {
      text-align: right;
      color: #1f2937;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 10pt;
      color: #6b7280;
      text-align: center;
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      color: rgba(0, 0, 0, 0.05);
      z-index: -1;
      white-space: nowrap;
    }
    
    .chart-placeholder {
      background-color: #f3f4f6;
      border: 2px dashed #d1d5db;
      padding: 40px;
      text-align: center;
      color: #6b7280;
      margin: 20px 0;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  ${this.options.watermark ? `<div class="watermark">${this.options.watermark}</div>` : ''}
  
  <div class="header">
    <h1>LocumTrueRate Calculation Report</h1>
    <div class="subtitle">${this.getReportTitle(data)}</div>
  </div>
  
  <div class="metadata">
    ${this.options.companyInfo ? `
      <p><strong>${this.options.companyInfo.name}</strong></p>
      ${this.options.companyInfo.address ? `<p>${this.options.companyInfo.address}</p>` : ''}
      ${this.options.companyInfo.phone ? `<p>Phone: ${this.options.companyInfo.phone}</p>` : ''}
      ${this.options.companyInfo.email ? `<p>Email: ${this.options.companyInfo.email}</p>` : ''}
    ` : ''}
    <p><strong>Export Date:</strong> ${this.formatDate(this.metadata.exportDate)}</p>
    <p><strong>Generated By:</strong> ${this.metadata.dataSource}</p>
  </div>
  
  ${sections.map(section => this.renderSection(section)).join('')}
  
  ${this.options.includeCharts ? this.renderCharts(data) : ''}
  
  <div class="footer">
    <p>This report was generated by LocumTrueRate.com</p>
    <p>© ${new Date().getFullYear()} LocumTrueRate, Inc. All rights reserved.</p>
    ${this.options.includeTimestamp ? `<p>Generated on ${new Date().toLocaleString()}</p>` : ''}
  </div>
</body>
</html>
    `

    return html
  }

  private getReportTitle(data: any): string {
    if (data.contractType) {
      return `${data.contractType} Contract Analysis`
    }
    if (data.payPeriod) {
      return `${data.payPeriod} Paycheck Calculation`
    }
    return 'Financial Calculation Report'
  }

  private renderSection(section: any): string {
    if (!section.visible || !section.data || Object.keys(section.data).length === 0) {
      return ''
    }

    return `
      <div class="section">
        <h2>${section.title}</h2>
        <table class="data-table">
          ${Object.entries(section.data).map(([key, value]) => `
            <tr>
              <td>${key}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
  }

  private renderCharts(data: any): string {
    const charts = []

    // Tax breakdown pie chart placeholder
    if (data.taxes && this.options.includeCharts) {
      charts.push(`
        <div class="section">
          <h2>Tax Distribution</h2>
          <div class="chart-placeholder">
            <p>Tax Breakdown Chart</p>
            <p>Federal: ${this.formatValue(data.taxes.federal, 'currency')}</p>
            <p>State: ${this.formatValue(data.taxes.state, 'currency')}</p>
            <p>FICA: ${this.formatValue((data.taxes.socialSecurity || 0) + (data.taxes.medicare || 0), 'currency')}</p>
          </div>
        </div>
      `)
    }

    // Income vs expenses chart placeholder
    if (data.grossPay && data.netPay && this.options.includeCharts) {
      charts.push(`
        <div class="section">
          <h2>Income Analysis</h2>
          <div class="chart-placeholder">
            <p>Income vs Deductions Chart</p>
            <p>Gross: ${this.formatValue(data.grossPay, 'currency')}</p>
            <p>Net: ${this.formatValue(data.netPay, 'currency')}</p>
            <p>Total Deductions: ${this.formatValue(data.grossPay - data.netPay, 'currency')}</p>
          </div>
        </div>
      `)
    }

    return charts.join('')
  }
}