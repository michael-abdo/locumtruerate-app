'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  Lock,
  Calendar,
  Building
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { cn } from '@/lib/utils'

interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'paypal'
  isDefault: boolean
  card?: {
    brand: string
    last4: string
    expiryMonth: number
    expiryYear: number
    holderName: string
  }
  bank?: {
    bankName: string
    accountType: 'checking' | 'savings'
    last4: string
  }
  paypal?: {
    email: string
  }
  billingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  createdAt: Date
}

interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[]
  onAddPaymentMethod: () => void
  onEditPaymentMethod: (methodId: string) => void
  onDeletePaymentMethod: (methodId: string) => void
  onSetDefault: (methodId: string) => void
  loading?: boolean
  className?: string
}

// Mock data generator
const generateMockPaymentMethods = (): PaymentMethod[] => [
  {
    id: 'pm_1',
    type: 'card',
    isDefault: true,
    card: {
      brand: 'Visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2026,
      holderName: 'John Doe'
    },
    billingAddress: {
      line1: '123 Business St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US'
    },
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'pm_2',
    type: 'card',
    isDefault: false,
    card: {
      brand: 'Mastercard',
      last4: '8888',
      expiryMonth: 8,
      expiryYear: 2025,
      holderName: 'John Doe'
    },
    billingAddress: {
      line1: '456 Corporate Ave',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    },
    createdAt: new Date('2023-11-20')
  }
]

function PaymentMethodCard({ 
  method, 
  onEdit, 
  onDelete, 
  onSetDefault,
  loading = false 
}: {
  method: PaymentMethod
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
  loading?: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)

  const getCardIcon = (brand: string) => {
    // In a real app, you'd use proper card brand icons
    return <CreditCard className="w-6 h-6" />
  }

  const formatExpiryDate = (month: number, year: number) => {
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
  }

  const getCardBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'text-blue-600'
      case 'mastercard':
        return 'text-red-600'
      case 'amex':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <motion.div
      layout
      className={cn(
        'relative bg-white dark:bg-gray-800 rounded-lg border-2 p-6 transition-all duration-200',
        method.isDefault 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      )}
    >
      {/* Default Badge */}
      {method.isDefault && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" />
            Default
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {method.type === 'card' && method.card && (
            <>
              <div className={cn('p-2 rounded-lg bg-gray-100 dark:bg-gray-700', getCardBrandColor(method.card.brand))}>
                {getCardIcon(method.card.brand)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {method.card.brand} •••• {method.card.last4}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Expires {formatExpiryDate(method.card.expiryMonth, method.card.expiryYear)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {method.card.holderName}
                </div>
              </div>
            </>
          )}

          {method.type === 'bank' && method.bank && (
            <>
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Building className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {method.bank.bankName} •••• {method.bank.last4}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {method.bank.accountType.charAt(0).toUpperCase() + method.bank.accountType.slice(1)} Account
                </div>
              </div>
            </>
          )}

          {method.type === 'paypal' && method.paypal && (
            <>
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs font-bold flex items-center justify-center">
                  PP
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  PayPal
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {method.paypal.email}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              {!method.isDefault && (
                <button
                  onClick={() => {
                    onSetDefault()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Set as Default
                </button>
              )}
              <button
                onClick={() => {
                  onEdit()
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete()
                  setShowMenu(false)
                }}
                disabled={method.isDefault}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Billing Address */}
      {method.billingAddress && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">Billing Address</div>
            <div>{method.billingAddress.line1}</div>
            {method.billingAddress.line2 && <div>{method.billingAddress.line2}</div>}
            <div>
              {method.billingAddress.city}, {method.billingAddress.state} {method.billingAddress.postalCode}
            </div>
            <div>{method.billingAddress.country}</div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Lock className="w-3 h-3" />
          <span>Secured by 256-bit SSL encryption</span>
        </div>
      </div>
    </motion.div>
  )
}

export function PaymentMethodManager({
  paymentMethods = generateMockPaymentMethods(),
  onAddPaymentMethod,
  onEditPaymentMethod,
  onDeletePaymentMethod,
  onSetDefault,
  loading = false,
  className
}: PaymentMethodManagerProps) {
  const [deletingMethod, setDeletingMethod] = useState<string | null>(null)

  const handleDelete = async (methodId: string) => {
    setDeletingMethod(methodId)
    try {
      await onDeletePaymentMethod(methodId)
    } finally {
      setDeletingMethod(null)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Methods
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your payment methods for subscription billing
          </p>
        </div>

        <Button onClick={onAddPaymentMethod} disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Your payment information is secure
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              All payment data is encrypted and stored securely with our PCI-compliant payment processor. 
              We never store your full credit card numbers on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No payment methods added
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add a payment method to start your subscription or make payments
          </p>
          <Button onClick={onAddPaymentMethod}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Payment Method
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onEdit={() => onEditPaymentMethod(method.id)}
                onDelete={() => handleDelete(method.id)}
                onSetDefault={() => onSetDefault(method.id)}
                loading={deletingMethod === method.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Payment Method Guidelines */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Payment Method Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Credit and debit cards accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>PayPal payments supported</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Bank transfers available</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Payments are processed securely</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Failed payments may suspend service</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Update expiring cards to avoid interruption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethodManager