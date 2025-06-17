import React, { useState } from 'react'
import { ExportFormat, useExport } from '@locumtruerate/calc-core'
import { Button } from './button'
import { Dropdown } from './dropdown'
import { Toast } from './toast'

export interface ExportButtonProps {
  data: any
  formats?: ExportFormat[]
  defaultFormat?: ExportFormat
  onExportSuccess?: (format: ExportFormat) => void
  onExportError?: (error: string) => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  multiExport?: boolean
}

export function ExportButton({
  data,
  formats = [ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV, ExportFormat.JSON],
  defaultFormat = ExportFormat.PDF,
  onExportSuccess,
  onExportError,
  className,
  variant = 'secondary',
  size = 'md',
  label = 'Export',
  multiExport = false,
}: ExportButtonProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const { exportData, exportMultiple, isExporting, error } = useExport({
    defaultFormat,
    onSuccess: (result) => {
      setToastMessage(`Successfully exported as ${result.format.toUpperCase()}`)
      setToastType('success')
      setShowToast(true)
      onExportSuccess?.(result.format)
    },
    onError: (err) => {
      setToastMessage(`Export failed: ${err}`)
      setToastType('error')
      setShowToast(true)
      onExportError?.(err)
    },
  })

  const handleExport = async () => {
    if (multiExport) {
      await exportMultiple(data, formats)
    } else {
      await exportData(data, { format: selectedFormat })
    }
  }

  const formatLabels: Record<ExportFormat, string> = {
    [ExportFormat.PDF]: 'PDF Document',
    [ExportFormat.EXCEL]: 'Excel Spreadsheet',
    [ExportFormat.CSV]: 'CSV File',
    [ExportFormat.JSON]: 'JSON Data',
  }

  const formatIcons: Record<ExportFormat, string> = {
    [ExportFormat.PDF]: '📄',
    [ExportFormat.EXCEL]: '📊',
    [ExportFormat.CSV]: '📋',
    [ExportFormat.JSON]: '{ }',
  }

  if (formats.length === 1) {
    return (
      <>
        <Button
          onClick={handleExport}
          disabled={isExporting || !data}
          variant={variant}
          size={size}
          className={className}
        >
          {isExporting ? 'Exporting...' : `${label} as ${formats[0].toUpperCase()}`}
        </Button>
        
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
            duration={5000}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Dropdown
          value={selectedFormat}
          onChange={setSelectedFormat}
          options={formats.map(format => ({
            value: format,
            label: (
              <span className="flex items-center gap-2">
                <span>{formatIcons[format]}</span>
                <span>{formatLabels[format]}</span>
              </span>
            ),
          }))}
          disabled={isExporting}
          className="min-w-[200px]"
        />
        
        <Button
          onClick={handleExport}
          disabled={isExporting || !data}
          variant={variant}
          size={size}
          className={className}
        >
          {isExporting ? 'Exporting...' : label}
        </Button>

        {multiExport && (
          <Button
            onClick={() => exportMultiple(data, formats)}
            disabled={isExporting || !data}
            variant="outline"
            size={size}
            title="Export all formats"
          >
            Export All
          </Button>
        )}
      </div>
      
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
          duration={5000}
        />
      )}
    </>
  )
}

// Mobile-optimized export button
export function MobileExportButton(props: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false)
  
  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant={props.variant}
        size={props.size}
        className={props.className}
      >
        {props.label || 'Export'}
      </Button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">Export Options</h3>
            
            <div className="space-y-2">
              {props.formats?.map(format => (
                <button
                  key={format}
                  onClick={async () => {
                    setShowModal(false)
                    const { exportData } = useExport({
                      defaultFormat: format,
                      onSuccess: props.onExportSuccess ? () => props.onExportSuccess!(format) : undefined,
                      onError: props.onExportError,
                    })
                    await exportData(props.data, { format })
                  }}
                  className="w-full p-4 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3"
                >
                  <span className="text-2xl">
                    {{
                      [ExportFormat.PDF]: '📄',
                      [ExportFormat.EXCEL]: '📊',
                      [ExportFormat.CSV]: '📋',
                      [ExportFormat.JSON]: '{ }',
                    }[format]}
                  </span>
                  <div>
                    <div className="font-medium">
                      {{
                        [ExportFormat.PDF]: 'PDF Document',
                        [ExportFormat.EXCEL]: 'Excel Spreadsheet',
                        [ExportFormat.CSV]: 'CSV File',
                        [ExportFormat.JSON]: 'JSON Data',
                      }[format]}
                    </div>
                    <div className="text-sm text-gray-500">
                      {{
                        [ExportFormat.PDF]: 'Best for printing and sharing',
                        [ExportFormat.EXCEL]: 'Best for further analysis',
                        [ExportFormat.CSV]: 'Best for importing to other tools',
                        [ExportFormat.JSON]: 'Best for API integration',
                      }[format]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowModal(false)}
              className="w-full p-3 text-center text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}