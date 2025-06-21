'use client'

import React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { ContractCalculationEngine, ContractInput, ContractCalculationResult, US_STATES, ContractType } from '@locumtruerate/calc-core'
import { Button } from '@locumtruerate/ui'
import { Input } from '@/components/ui/input'
import { Select, SelectOption } from '@/components/ui/select'
import { useCalculatorAnalytics } from '@/hooks/use-analytics'
import { ChevronDown, ChevronUp, Download, Save, Calculator, RefreshCw, GitCompare, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { SaveCalculationDialog } from './save-calculation-dialog'
import { z } from 'zod'
import { safeTextSchema, moneySchema } from '@/lib/validation/schemas'
import { safeParse } from '@/lib/validation/apply-validation'

// Validation schema for contract calculator
const contractCalculatorSchema = z.object({
  // Basic Info
  title: safeTextSchema(0, 200),
  specialty: safeTextSchema(0, 100),
  
  // Location
  state: z.string().min(1, 'State is required'),
  city: safeTextSchema(1, 100),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  
  // Contract Terms
  contractType: z.enum(['LOCUM_TENENS', 'PERMANENT', 'CONTRACT_TO_HIRE', 'TRAVEL_NURSING', 'CONSULTING']),
  hourlyRate: z.coerce.number()
    .min(0.01, 'Hourly rate must be positive')
    .max(10000, 'Hourly rate seems too high'),
  hoursPerWeek: z.coerce.number()
    .min(1, 'Hours per week must be at least 1')
    .max(168, 'Hours per week cannot exceed 168'),
  duration: z.coerce.number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 week')
    .max(260, 'Duration cannot exceed 5 years'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  
  // Tax Info
  filingStatus: z.enum(['SINGLE', 'MARRIED_FILING_JOINTLY', 'MARRIED_FILING_SEPARATELY', 'HEAD_OF_HOUSEHOLD']),
  federalExemptions: z.coerce.number()
    .int('Exemptions must be a whole number')
    .min(0, 'Exemptions cannot be negative')
    .max(20, 'Exemptions seem too high'),
  
  // Expenses (optional)
  travelExpenses: z.coerce.number().min(0).optional().default(0),
  housingAllowance: z.coerce.number().min(0).optional().default(0),
  malpracticeInsurance: z.coerce.number().min(0).optional().default(0)
})

type FormData = z.infer<typeof contractCalculatorSchema>

interface FormErrors {
  [key: string]: string
}

const CONTRACT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'LOCUM_TENENS', label: 'Locum Tenens' },
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT_TO_HIRE', label: 'Contract to Hire' },
  { value: 'TRAVEL_NURSING', label: 'Travel Nursing' },
  { value: 'CONSULTING', label: 'Consulting' }
]

const FILING_STATUS_OPTIONS: SelectOption[] = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED_FILING_JOINTLY', label: 'Married Filing Jointly' },
  { value: 'MARRIED_FILING_SEPARATELY', label: 'Married Filing Separately' },
  { value: 'HEAD_OF_HOUSEHOLD', label: 'Head of Household' }
]

const STATE_OPTIONS: SelectOption[] = US_STATES.map(state => ({
  value: state,
  label: state
}))

const initialFormData: FormData = {
  title: '',
  specialty: '',
  state: '',
  city: '',
  zipCode: '',
  contractType: 'LOCUM_TENENS',
  hourlyRate: '',
  hoursPerWeek: '',
  duration: '',
  startDate: '',
  endDate: '',
  filingStatus: 'SINGLE',
  federalExemptions: '0',
  travelExpenses: '',
  housingAllowance: '',
  malpracticeInsurance: ''
}

export function ContractCalculator() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    specialty: '',
    state: '',
    city: '',
    zipCode: '',
    contractType: 'LOCUM_TENENS',
    hourlyRate: 0,
    hoursPerWeek: 0,
    duration: 0,
    startDate: '',
    endDate: '',
    filingStatus: 'SINGLE',
    federalExemptions: 0,
    travelExpenses: 0,
    housingAllowance: 0,
    malpracticeInsurance: 0
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<ContractCalculationResult | null>(null)
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false)
  const [showExpenses, setShowExpenses] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [calculationEngine] = useState(() => new ContractCalculationEngine())
  
  const { trackCalculatorUsage, trackCalculatorError, trackCalculatorExport } = useCalculatorAnalytics()

  // Handle input changes with validation
  const handleInputChange = useCallback((field: keyof FormData, value: string | number) => {
    // Update form data
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validate the specific field
    try {
      const fieldSchema = contractCalculatorSchema.shape[field]
      fieldSchema.parse(value)
      
      // Clear error for this field if validation passes
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [field]: error.errors[0].message
        }))
      }
    }
  }, [])

  // Validate form using Zod schema
  const validateForm = useCallback((): boolean => {
    const result = safeParse(contractCalculatorSchema, formData)
    
    if (!result.success) {
      setErrors(result.errors)
      return false
    }
    
    setErrors({})
    return true
  }, [formData])

  // Handle calculation
  const handleCalculate = useCallback(async () => {
    if (!validateForm()) {
      return
    }
    
    setIsCalculating(true)
    
    try {
      // Build contract input
      const contractInput: ContractInput = {
        title: formData.title || 'Contract Position',
        specialty: formData.specialty || 'General',
        location: {
          state: formData.state as any,
          city: formData.city,
          zipCode: formData.zipCode
        },
        contractType: formData.contractType as ContractType,
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : new Date(Date.now() + parseInt(formData.duration) * 7 * 24 * 60 * 60 * 1000),
        duration: parseInt(formData.duration) || 0,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        hoursPerWeek: parseFloat(formData.hoursPerWeek) || 0,
        overtimeThreshold: 40,
        bonuses: [],
        stipends: {
          housing: parseFloat(formData.housingAllowance) || 0,
          travel: parseFloat(formData.travelExpenses) || 0,
          meals: 0,
          licensure: 0,
          malpractice: parseFloat(formData.malpracticeInsurance) || 0,
          cme: 0,
          other: 0
        },
        deductions: {
          healthInsurance: 0,
          dentalInsurance: 0,
          visionInsurance: 0,
          retirement401k: 0,
          professionalFees: 0,
          parking: 0,
          other: 0
        },
        taxInfo: {
          filingStatus: formData.filingStatus,
          federalExemptions: formData.federalExemptions,
          stateExemptions: 0,
          additionalFederalWithholding: 0,
          additionalStateWithholding: 0,
          isResident: true
        }
      }
      
      const calculationResult = await calculationEngine.calculateContract(contractInput)
      setResult(calculationResult)
      
      trackCalculatorUsage({
        calculatorType: 'contract',
        contractType: formData.contractType,
        hourlyRate: parseFloat(formData.hourlyRate),
        location: formData.state
      })
    } catch (error) {
      const errorMessage = (error as Error).message
      setErrors({ general: 'Calculation error: ' + errorMessage })
      trackCalculatorError({
        calculatorType: 'contract',
        error: errorMessage
      })
    } finally {
      setIsCalculating(false)
    }
  }, [formData, validateForm, calculationEngine, trackCalculatorUsage, trackCalculatorError])

  // Reset form
  const handleReset = useCallback(() => {
    setFormData({
      title: '',
      specialty: '',
      state: '',
      city: '',
      zipCode: '',
      contractType: 'LOCUM_TENENS',
      hourlyRate: 0,
      hoursPerWeek: 0,
      duration: 0,
      startDate: '',
      endDate: '',
      filingStatus: 'SINGLE',
      federalExemptions: 0,
      travelExpenses: 0,
      housingAllowance: 0,
      malpracticeInsurance: 0
    })
    setErrors({})
    setResult(null)
    setShowTaxBreakdown(false)
    setShowExpenses(false)
  }, [])

  // Format currency
  const formatCurrency = (value: any) => {
    const num = typeof value === 'object' && value.toNumber ? value.toNumber() : parseFloat(value)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  // Format percentage
  const formatPercentage = (value: any) => {
    const num = typeof value === 'object' && value.toNumber ? value.toNumber() : parseFloat(value)
    return `${num.toFixed(1)}%`
  }

  // Handle save calculation
  const handleSaveCalculation = useCallback(async (name: string) => {
    if (!result) return
    
    // Here you would typically save to a backend or local storage
    // For now, we'll just track the event
    trackCalculatorUsage({
      calculatorType: 'contract',
      action: 'save',
      name
    })
    
    // In a real implementation, you'd save the calculation data to backend
    // For now, we just track the analytics event
  }, [result, formData, trackCalculatorUsage])

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Contract Calculator</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
            aria-expanded={showComparison}
            aria-controls="comparison-panel"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Contracts
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            aria-label="Reset calculator form"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "grid gap-6",
        showComparison ? "lg:grid-cols-2" : "lg:grid-cols-1"
      )}>
        {/* Calculator Form */}
        <div className="space-y-6">
          {/* Contract Details */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="text-lg font-semibold">Contract Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contract Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Emergency Medicine Physician"
              />
              
              <Input
                label="Medical Specialty"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                placeholder="e.g., Emergency Medicine"
              />
              
              <Select
                label="Contract Type"
                value={formData.contractType}
                onChange={(value) => handleInputChange('contractType', value)}
                options={CONTRACT_TYPE_OPTIONS}
              />
              
              <Input
                label="Contract Duration (weeks)"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                error={errors.duration}
                required
                min="1"
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                error={errors.city}
                required
                placeholder="e.g., Dallas"
              />
              
              <Select
                label="State"
                value={formData.state}
                onChange={(value) => handleInputChange('state', value)}
                options={STATE_OPTIONS}
                error={errors.state}
                required
              />
              
              <Input
                label="ZIP Code"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                error={errors.zipCode}
                required
                placeholder="12345"
                pattern="^\d{5}(-\d{4})?$"
              />
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="text-lg font-semibold">Compensation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Hourly Rate ($)"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                error={errors.hourlyRate}
                required
                min="0"
                step="0.01"
                placeholder="150"
              />
              
              <Input
                label="Hours per Week"
                type="number"
                value={formData.hoursPerWeek}
                onChange={(e) => handleInputChange('hoursPerWeek', e.target.value)}
                error={errors.hoursPerWeek}
                required
                min="1"
                max="168"
                placeholder="40"
              />
            </div>
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="text-lg font-semibold">Tax Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Filing Status"
                value={formData.filingStatus}
                onChange={(value) => handleInputChange('filingStatus', value)}
                options={FILING_STATUS_OPTIONS}
              />
              
              <Input
                label="Federal Exemptions"
                type="number"
                value={formData.federalExemptions}
                onChange={(e) => handleInputChange('federalExemptions', e.target.value)}
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Expenses (Optional) */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Expenses & Stipends</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExpenses(!showExpenses)}
                aria-expanded={showExpenses}
                aria-controls="expenses-section"
              >
                {showExpenses ? (
                  <>Hide <ChevronUp className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Add Expenses <ChevronDown className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
            
            {showExpenses && (
              <div id="expenses-section" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Travel Expenses ($)"
                  type="number"
                  value={formData.travelExpenses}
                  onChange={(e) => handleInputChange('travelExpenses', e.target.value)}
                  min="0"
                  placeholder="5000"
                />
                
                <Input
                  label="Housing Allowance ($/week)"
                  type="number"
                  value={formData.housingAllowance}
                  onChange={(e) => handleInputChange('housingAllowance', e.target.value)}
                  min="0"
                  placeholder="3000"
                />
                
                <Input
                  label="Malpractice Insurance ($)"
                  type="number"
                  value={formData.malpracticeInsurance}
                  onChange={(e) => handleInputChange('malpracticeInsurance', e.target.value)}
                  min="0"
                  placeholder="2000"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg" role="alert">
              <p className="text-sm">{errors.general}</p>
            </div>
          )}

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            loading={isCalculating}
            className="w-full"
            size="lg"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate
          </Button>
        </div>

        {/* Comparison Panel */}
        {showComparison && (
          <div id="comparison-panel" className="bg-gray-50 rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Contract B</h3>
            <p className="text-sm text-gray-600">
              Comparison mode allows you to evaluate multiple contracts side by side.
              Fill in the details for a second contract to compare.
            </p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Calculation Results</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  trackCalculatorExport({ format: 'pdf', calculatorType: 'contract' })
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Calculation
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Gross Pay</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(result.totals.grossAnnualPay)}
              </p>
              <p className="text-xs text-blue-600">Total contract value</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Net Pay</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(result.totals.netAnnualPay)}
              </p>
              <p className="text-xs text-green-600">After taxes & deductions</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">Total Taxes</p>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(result.totals.totalTaxes)}
              </p>
              <p className="text-xs text-orange-600">
                {formatPercentage(result.metrics.taxRate)} effective rate
              </p>
            </div>
          </div>

          {/* Tax Breakdown */}
          <div className="border-t pt-6">
            <Button
              variant="ghost"
              onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
              aria-expanded={showTaxBreakdown}
              aria-controls="tax-breakdown"
              className="w-full justify-between"
            >
              <span className="font-medium">Tax Breakdown</span>
              {showTaxBreakdown ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            
            {showTaxBreakdown && (
              <div id="tax-breakdown" className="mt-4 space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Federal Tax</span>
                  <span className="text-sm font-medium">{formatCurrency(result.breakdown.taxes.federal)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">State Tax</span>
                  <span className="text-sm font-medium">{formatCurrency(result.breakdown.taxes.state)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Social Security</span>
                  <span className="text-sm font-medium">{formatCurrency(result.breakdown.taxes.socialSecurity)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Medicare</span>
                  <span className="text-sm font-medium">{formatCurrency(result.breakdown.taxes.medicare)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Key Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Effective Hourly Rate</span>
                <span className="text-sm font-medium">
                  {formatCurrency(result.totals.effectiveHourlyRate)}/hour
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Take-Home Percentage</span>
                <span className="text-sm font-medium">
                  {formatPercentage(result.metrics.takeHomePercentage)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Per Pay Period (Bi-weekly)</span>
                <span className="text-sm font-medium">
                  {formatCurrency(result.payPeriods.netPerPeriod)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Benefits Value</span>
                <span className="text-sm font-medium">
                  {formatCurrency(result.metrics.benefitsValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Calculation Dialog */}
      <SaveCalculationDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveCalculation}
        calculationType="contract"
      />
    </div>
  )
}