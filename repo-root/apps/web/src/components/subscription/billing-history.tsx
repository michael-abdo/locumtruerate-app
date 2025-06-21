'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Download, 
  Eye, 
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Receipt,
  FileText
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { safeTextSchema } from '@/lib/validation/schemas'
import { safeParse } from '@/lib/validation/apply-validation'

interface BillingRecord {
  id: string
  date: Date
  description: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  invoiceNumber: string
  paymentMethod: {
    type: 'card' | 'bank' | 'paypal'
    last4?: string
    brand?: string
  }
  downloadUrl?: string
  period: {
    start: Date
    end: Date
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
}

interface BillingHistoryProps {
  records: BillingRecord[]
  loading?: boolean
  onDownloadInvoice?: (recordId: string) => void
  onViewDetails?: (recordId: string) => void
  className?: string
}

// Mock data generator
const generateMockBillingRecords = (): BillingRecord[] => {
  const records: BillingRecord[] = []
  const statuses: BillingRecord['status'][] = ['paid', 'pending', 'failed', 'refunded']
  
  for (let i = 0; i < 12; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    
    const status = i === 0 ? 'pending' : i === 1 ? 'paid' : statuses[Math.floor(Math.random() * statuses.length)]
    const amount = [29, 99, 290, 990, 2990][Math.floor(Math.random() * 5)]
    
    records.push({
      id: `invoice_${Date.now()}_${i}`,
      date,
      description: `Professional Plan - ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      amount,
      currency: 'USD',
      status,
      invoiceNumber: `INV-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
      paymentMethod: {
        type: 'card',
        last4: '4242',
        brand: 'Visa'
      },
      downloadUrl: status === 'paid' ? `/invoices/${records.length + i}.pdf` : undefined,
      period: {
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0)
      },
      items: [
        {
          description: 'Professional Plan Subscription',
          quantity: 1,
          unitPrice: amount,
          total: amount
        }
      ]
    })
  }
  
  return records
}

// Validation schemas
const searchQuerySchema = safeTextSchema(0, 100)
const filterSchema = z.enum(['all', 'paid', 'pending', 'failed', 'refunded'])

export function BillingHistory({
  records = generateMockBillingRecords(),
  loading = false,
  onDownloadInvoice,
  onViewDetails,
  className
}: BillingHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

  const filteredRecords = records.filter(record => {
    const matchesFilter = filter === 'all' || record.status === filter
    const matchesSearch = searchQuery === '' || 
      record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getStatusIcon = (status: BillingRecord['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'refunded':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: BillingRecord['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  }

  const getPaymentMethodDisplay = (method: BillingRecord['paymentMethod']) => {
    if (method.type === 'card') {
      return `${method.brand} •••• ${method.last4}`
    }
    return method.type.charAt(0).toUpperCase() + method.type.slice(1)
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Billing History
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and download your payment history and invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm w-48"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Billing Records */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No billing records found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Your billing history will appear here once you make your first payment'
              }
            </p>
          </div>
        ) : (
          filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {record.description}
                      </h3>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(record.status)}
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getStatusColor(record.status)
                        )}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{record.date.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{record.invoiceNumber}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        <span>{getPaymentMethodDisplay(record.paymentMethod)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(record.amount, record.currency)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {record.period.start.toLocaleDateString()} - {record.period.end.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedRecord(
                          expandedRecord === record.id ? null : record.id
                        )}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {record.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownloadInvoice?.(record.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRecord === record.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Invoice Details */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Invoice Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Invoice Number:</span>
                            <span className="font-medium">{record.invoiceNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Issue Date:</span>
                            <span className="font-medium">{record.date.toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Billing Period:</span>
                            <span className="font-medium">
                              {record.period.start.toLocaleDateString()} - {record.period.end.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                            <span className="font-medium">{getPaymentMethodDisplay(record.paymentMethod)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Items
                        </h4>
                        <div className="space-y-2">
                          {record.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex justify-between text-sm">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {item.description}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  Qty: {item.quantity} × {formatCurrency(item.unitPrice, record.currency)}
                                </div>
                              </div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(item.total, record.currency)}
                              </div>
                            </div>
                          ))}
                          
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between font-semibold">
                              <span>Total</span>
                              <span>{formatCurrency(record.amount, record.currency)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex items-center gap-3">
                      {record.downloadUrl && (
                        <Button
                          variant="outline"
                          onClick={() => onDownloadInvoice?.(record.id)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => onViewDetails?.(record.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Details
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {filteredRecords.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Billing Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  filteredRecords
                    .filter(r => r.status === 'paid')
                    .reduce((sum, r) => sum + r.amount, 0),
                  'USD'
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredRecords.filter(r => r.status === 'paid').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Successful Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Date(Math.min(...filteredRecords.map(r => r.date.getTime()))).getFullYear()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Member Since</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingHistory