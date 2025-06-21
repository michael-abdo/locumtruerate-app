'use client'

import React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { PaycheckCalculationEngine, PaycheckInput, PaycheckCalculationResult, US_STATES, PayFrequency, FilingStatus } from '@locumtruerate/calc-core'
import { Button, Input, Select, type SelectOption } from '@locumtruerate/ui'
import { useCalculatorAnalytics } from '@/hooks/use-analytics'
import { ChevronDown, ChevronUp, Download, Save, Calculator, RefreshCw, GitCompare, Plus, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { SaveCalculationDialog } from './save-calculation-dialog'
import { z } from 'zod'
import { safeTextSchema, moneySchema } from '@/lib/validation/schemas'
import { safeParse } from '@/lib/validation/apply-validation'

// Validation schema for paycheck calculator
const paycheckCalculatorSchema = z.object({
  // Basic Info
  grossSalary: z.coerce.number()
    .min(0.01, 'Gross salary must be positive')
    .max(10000000, 'Gross salary seems too high'),
  payPeriod: z.enum(['WEEKLY', 'BI_WEEKLY', 'SEMI_MONTHLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  payDate: z.string().optional(),
  
  // Location
  workState: z.string().min(1, 'Work state is required'),
  residenceState: z.string().min(1, 'Residence state is required'),
  city: safeTextSchema(1, 100),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  
  // Tax Info
  filingStatus: z.enum(['SINGLE', 'MARRIED_FILING_JOINTLY', 'MARRIED_FILING_SEPARATELY', 'HEAD_OF_HOUSEHOLD', 'QUALIFYING_WIDOW']),
  allowances: z.coerce.number()
    .int('Allowances must be a whole number')
    .min(0, 'Allowances cannot be negative')
    .max(20, 'Allowances seem too high'),
  additionalExemptions: z.coerce.number().min(0).optional().default(0),
  
  // Year-to-date (optional)
  ytdGross: z.coerce.number().min(0).optional().default(0),
  ytdFederalTax: z.coerce.number().min(0).optional().default(0),
  ytdStateTax: z.coerce.number().min(0).optional().default(0),
  ytdSocialSecurity: z.coerce.number().min(0).optional().default(0),
  ytdMedicare: z.coerce.number().min(0).optional().default(0),
  ytdStateDisability: z.coerce.number().min(0).optional().default(0),
  
  // Pre-tax deductions (optional)
  retirement401k: z.coerce.number().min(0).optional().default(0),
  healthInsurance: z.coerce.number().min(0).optional().default(0),
  dentalInsurance: z.coerce.number().min(0).optional().default(0),
  visionInsurance: z.coerce.number().min(0).optional().default(0),
  otherPreTax: z.coerce.number().min(0).optional().default(0),
  
  // Post-tax deductions (optional)
  rothContribution: z.coerce.number().min(0).optional().default(0),
  otherPostTax: z.coerce.number().min(0).optional().default(0),
  
  // Additional withholdings
  additionalFederalWithholding: z.coerce.number().min(0).optional().default(0),
  additionalStateWithholding: z.coerce.number().min(0).optional().default(0),
  
  // Overtime (optional)
  hoursWorked: z.coerce.number().min(0).max(168).optional().default(40),
  overtimeHours: z.coerce.number().min(0).max(168).optional().default(0),
  overtimeMultiplier: z.coerce.number().min(1).max(3).optional().default(1.5)
})

type FormData = z.infer<typeof paycheckCalculatorSchema>

interface FormErrors {
  [key: string]: string
}

const PAY_PERIOD_OPTIONS: SelectOption[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BI_WEEKLY', label: 'Bi-weekly' },
  { value: 'SEMI_MONTHLY', label: 'Semi-monthly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUALLY', label: 'Annually' }
]

const FILING_STATUS_OPTIONS: SelectOption[] = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED_FILING_JOINTLY', label: 'Married Filing Jointly' },
  { value: 'MARRIED_FILING_SEPARATELY', label: 'Married Filing Separately' },
  { value: 'HEAD_OF_HOUSEHOLD', label: 'Head of Household' },
  { value: 'QUALIFYING_WIDOW', label: 'Qualifying Widow(er)' }
]

const STATE_OPTIONS: SelectOption[] = US_STATES.map(state => ({
  value: state,
  label: state
}))

const initialFormData: FormData = {
  grossSalary: '',
  payPeriod: 'BI_WEEKLY',
  payDate: format(new Date(), 'yyyy-MM-dd'),
  workState: '',
  residenceState: '',
  city: '',
  zipCode: '',
  filingStatus: 'SINGLE',
  allowances: '0',
  additionalExemptions: '',
  ytdGross: '',
  ytdFederalTax: '',
  ytdStateTax: '',
  ytdSocialSecurity: '',
  ytdMedicare: '',
  ytdStateDisability: '',
  retirement401k: '',
  healthInsurance: '',
  dentalInsurance: '',
  visionInsurance: '',
  otherPreTax: '',
  rothContribution: '',
  otherPostTax: '',
  additionalFederalWithholding: '',
  additionalStateWithholding: '',
  hoursWorked: '',
  overtimeHours: '',
  overtimeMultiplier: '1.5'
}

export function PaycheckCalculator() {
  const [formData, setFormData] = useState<FormData>({
    grossSalary: 0,
    payPeriod: 'BI_WEEKLY',
    payDate: format(new Date(), 'yyyy-MM-dd'),
    workState: '',
    residenceState: '',
    city: '',
    zipCode: '',
    filingStatus: 'SINGLE',
    allowances: 0,
    additionalExemptions: 0,
    ytdGross: 0,
    ytdFederalTax: 0,
    ytdStateTax: 0,
    ytdSocialSecurity: 0,
    ytdMedicare: 0,
    ytdStateDisability: 0,
    retirement401k: 0,
    healthInsurance: 0,
    dentalInsurance: 0,
    visionInsurance: 0,
    otherPreTax: 0,
    rothContribution: 0,
    otherPostTax: 0,
    additionalFederalWithholding: 0,
    additionalStateWithholding: 0,
    hoursWorked: 40,
    overtimeHours: 0,
    overtimeMultiplier: 1.5
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<PaycheckCalculationResult | null>(null)
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false)
  const [showDeductions, setShowDeductions] = useState(false)
  const [showYearToDate, setShowYearToDate] = useState(false)
  const [showOvertime, setShowOvertime] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [calculationEngine] = useState(() => new PaycheckCalculationEngine())
  
  const { trackCalculatorUsage, trackCalculatorError, trackCalculatorExport } = useCalculatorAnalytics()

  // Handle input changes with validation
  const handleInputChange = useCallback((field: keyof FormData, value: string | number) => {
    // Update form data
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validate the specific field
    try {
      const fieldSchema = paycheckCalculatorSchema.shape[field]
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

  // Calculate gross pay for the period based on annual salary
  const calculatePeriodGrossPay = useCallback((annualSalary: number, payPeriod: PayFrequency): number => {
    const periodsPerYear: Record<PayFrequency, number> = {
      'WEEKLY': 52,
      'BI_WEEKLY': 26,
      'SEMI_MONTHLY': 24,
      'MONTHLY': 12,
      'QUARTERLY': 4,
      'ANNUALLY': 1
    }
    
    return annualSalary / periodsPerYear[payPeriod]
  }, [])

  // Validate form using Zod schema
  const validateForm = useCallback((): boolean => {
    const result = safeParse(paycheckCalculatorSchema, formData)
    
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
      // Calculate gross pay for this period
      const annualSalary = parseFloat(formData.grossSalary)
      const periodGrossPay = calculatePeriodGrossPay(annualSalary, formData.payPeriod)
      
      // Calculate total pre-tax deductions
      const preTaxDeductions = 
        (formData.retirement401k ? parseFloat(formData.retirement401k) : 0) +
        (formData.healthInsurance ? parseFloat(formData.healthInsurance) : 0) +
        (formData.dentalInsurance ? parseFloat(formData.dentalInsurance) : 0) +
        (formData.visionInsurance ? parseFloat(formData.visionInsurance) : 0) +
        (formData.otherPreTax ? parseFloat(formData.otherPreTax) : 0)
      
      // Calculate Roth deductions
      const rothDeductions = formData.rothContribution ? parseFloat(formData.rothContribution) : 0
      
      // Calculate after-tax deductions
      const afterTaxDeductions = formData.otherPostTax ? parseFloat(formData.otherPostTax) : 0
      
      // Build paycheck input
      const paycheckInput: PaycheckInput = {
        grossPay: periodGrossPay,
        payFrequency: formData.payPeriod,
        payDate: new Date(formData.payDate),
        filingStatus: formData.filingStatus,
        exemptions: parseInt(formData.allowances),
        workState: formData.workState as any,
        residenceState: formData.residenceState as any,
        ytdGross: formData.ytdGross ? parseFloat(formData.ytdGross) : 0,
        ytdFederalTax: formData.ytdFederalTax ? parseFloat(formData.ytdFederalTax) : 0,
        ytdStateTax: formData.ytdStateTax ? parseFloat(formData.ytdStateTax) : 0,
        ytdSocialSecurity: formData.ytdSocialSecurity ? parseFloat(formData.ytdSocialSecurity) : 0,
        ytdMedicare: formData.ytdMedicare ? parseFloat(formData.ytdMedicare) : 0,
        ytdStateDisability: formData.ytdStateDisability ? parseFloat(formData.ytdStateDisability) : 0,
        preTaxDeductions,
        rothDeductions,
        afterTaxDeductions,
        additionalFederalWithholding: formData.additionalFederalWithholding ? parseFloat(formData.additionalFederalWithholding) : 0,
        additionalStateWithholding: formData.additionalStateWithholding ? parseFloat(formData.additionalStateWithholding) : 0
      }
      
      const calculationResult = await calculationEngine.calculatePaycheck(paycheckInput)
      setResult(calculationResult)
      
      trackCalculatorUsage({
        calculatorType: 'paycheck',
        payPeriod: formData.payPeriod,
        grossSalary: annualSalary,
        location: formData.workState
      })
    } catch (error) {
      console.error('Calculation error:', error)
      setErrors({ general: 'Calculation error: ' + (error as Error).message })
      trackCalculatorError({
        calculatorType: 'paycheck',
        error: (error as Error).message
      })
    } finally {
      setIsCalculating(false)
    }
  }, [formData, validateForm, calculatePeriodGrossPay, calculationEngine, trackCalculatorUsage, trackCalculatorError])

  // Reset form
  const handleReset = useCallback(() => {
    setFormData(initialFormData)
    setErrors({})
    setResult(null)
    setShowTaxBreakdown(false)
    setShowDeductions(false)
    setShowYearToDate(false)
    setShowOvertime(false)
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
      calculatorType: 'paycheck',
      action: 'save',
      name
    })
    
    // In a real implementation, you'd save the calculation data
    console.log('Saving calculation:', { name, formData, result })
  }, [result, formData, trackCalculatorUsage])

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Paycheck Calculator</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
            aria-expanded={showComparison}
            aria-controls="comparison-panel"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Scenarios
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
          {/* Paycheck Details */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="text-lg font-semibold">Paycheck Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Gross Salary (Annual)"
                type="number"
                value={formData.grossSalary}
                onChange={(e) => handleInputChange('grossSalary', e.target.value)}
                error={errors.grossSalary}
                required
                min="0"
                step="1000"
                placeholder="120000"
                aria-label="Gross salary"
              />
              
              <Select
                label="Pay Period"
                value={formData.payPeriod}
                onChange={(value) => handleInputChange('payPeriod', value as PayFrequency)}
                options={PAY_PERIOD_OPTIONS}
                aria-label="Pay period"
              />
              
              <Input
                label="Pay Date"
                type="date"
                value={formData.payDate}
                onChange={(e) => handleInputChange('payDate', e.target.value)}
              />
              
              <Input
                label="Hours Worked"
                type="number"
                value={formData.hoursWorked}
                onChange={(e) => handleInputChange('hoursWorked', e.target.value)}
                placeholder="80"
                min="0"
                max="168"
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                error={errors.city}
                required
                placeholder="e.g., Dallas"
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
              
              <Select
                label="Work State"
                value={formData.workState}
                onChange={(value) => handleInputChange('workState', value)}
                options={STATE_OPTIONS}
                error={errors.workState}
                required
                aria-label="State"
              />
              
              <Select
                label="Residence State"
                value={formData.residenceState || formData.workState}
                onChange={(value) => handleInputChange('residenceState', value)}
                options={STATE_OPTIONS}
                error={errors.residenceState}
                required
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
                onChange={(value) => handleInputChange('filingStatus', value as FilingStatus)}
                options={FILING_STATUS_OPTIONS}
                aria-label="Filing status"
              />
              
              <Input
                label="Allowances"
                type="number"
                value={formData.allowances}
                onChange={(e) => handleInputChange('allowances', e.target.value)}
                min="0"
                placeholder="0"
                aria-label="Allowances"
              />
              
              <Input
                label="Additional Exemptions ($)"
                type="number"
                value={formData.additionalExemptions}
                onChange={(e) => handleInputChange('additionalExemptions', e.target.value)}
                min="0"
                step="100"
                placeholder="0"
                aria-label="Additional exemptions"
              />
            </div>
          </div>

          {/* Pre-tax Deductions (Optional) */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pre-tax Deductions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeductions(!showDeductions)}
                aria-expanded={showDeductions}
                aria-controls="deductions-section"
              >
                {showDeductions ? (
                  <>Hide <ChevronUp className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Add Deductions <ChevronDown className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
            
            {showDeductions && (
              <div id="deductions-section" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="401(k) Contribution ($)"
                  type="number"
                  value={formData.retirement401k}
                  onChange={(e) => handleInputChange('retirement401k', e.target.value)}
                  min="0"
                  placeholder="500"
                  aria-label="401k contribution"
                />
                
                <Input
                  label="Health Insurance ($)"
                  type="number"
                  value={formData.healthInsurance}
                  onChange={(e) => handleInputChange('healthInsurance', e.target.value)}
                  min="0"
                  placeholder="200"
                  aria-label="Health insurance"
                />
                
                <Input
                  label="Dental Insurance ($)"
                  type="number"
                  value={formData.dentalInsurance}
                  onChange={(e) => handleInputChange('dentalInsurance', e.target.value)}
                  min="0"
                  placeholder="25"
                  aria-label="Dental insurance"
                />
                
                <Input
                  label="Vision Insurance ($)"
                  type="number"
                  value={formData.visionInsurance}
                  onChange={(e) => handleInputChange('visionInsurance', e.target.value)}
                  min="0"
                  placeholder="10"
                />
                
                <Input
                  label="Other Pre-tax ($)"
                  type="number"
                  value={formData.otherPreTax}
                  onChange={(e) => handleInputChange('otherPreTax', e.target.value)}
                  min="0"
                  placeholder="0"
                />
                
                <Input
                  label="Roth 401(k) ($)"
                  type="number"
                  value={formData.rothContribution}
                  onChange={(e) => handleInputChange('rothContribution', e.target.value)}
                  min="0"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Year-to-Date (Optional) */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Year-to-Date Information</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowYearToDate(!showYearToDate)}
                aria-expanded={showYearToDate}
                aria-controls="ytd-section"
              >
                {showYearToDate ? (
                  <>Hide <ChevronUp className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Year to Date <ChevronDown className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
            
            {showYearToDate && (
              <div id="ytd-section" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="YTD Gross ($)"
                  type="number"
                  value={formData.ytdGross}
                  onChange={(e) => handleInputChange('ytdGross', e.target.value)}
                  min="0"
                  placeholder="60000"
                  aria-label="YTD gross"
                />
                
                <Input
                  label="YTD Federal Tax ($)"
                  type="number"
                  value={formData.ytdFederalTax}
                  onChange={(e) => handleInputChange('ytdFederalTax', e.target.value)}
                  min="0"
                  placeholder="8000"
                  aria-label="YTD taxes"
                />
                
                <Input
                  label="YTD State Tax ($)"
                  type="number"
                  value={formData.ytdStateTax}
                  onChange={(e) => handleInputChange('ytdStateTax', e.target.value)}
                  min="0"
                  placeholder="2000"
                />
                
                <Input
                  label="YTD Social Security ($)"
                  type="number"
                  value={formData.ytdSocialSecurity}
                  onChange={(e) => handleInputChange('ytdSocialSecurity', e.target.value)}
                  min="0"
                  placeholder="3720"
                />
                
                <Input
                  label="YTD Medicare ($)"
                  type="number"
                  value={formData.ytdMedicare}
                  onChange={(e) => handleInputChange('ytdMedicare', e.target.value)}
                  min="0"
                  placeholder="870"
                />
                
                <Input
                  label="YTD State Disability ($)"
                  type="number"
                  value={formData.ytdStateDisability}
                  onChange={(e) => handleInputChange('ytdStateDisability', e.target.value)}
                  min="0"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Overtime (Optional) */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Overtime</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOvertime(!showOvertime)}
                aria-expanded={showOvertime}
                aria-controls="overtime-section"
              >
                {showOvertime ? (
                  <>Hide <ChevronUp className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Add Overtime <ChevronDown className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
            
            {showOvertime && (
              <div id="overtime-section" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Overtime Hours"
                  type="number"
                  value={formData.overtimeHours}
                  onChange={(e) => handleInputChange('overtimeHours', e.target.value)}
                  min="0"
                  placeholder="10"
                  aria-label="Overtime hours"
                />
                
                <Input
                  label="Overtime Rate Multiplier"
                  type="number"
                  value={formData.overtimeMultiplier}
                  onChange={(e) => handleInputChange('overtimeMultiplier', e.target.value)}
                  min="1"
                  step="0.5"
                  placeholder="1.5"
                  aria-label="Overtime rate multiplier"
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
            Calculate Paycheck
          </Button>
        </div>

        {/* Comparison Panel */}
        {showComparison && (
          <div id="comparison-panel" className="bg-gray-50 rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Scenario B</h3>
            <p className="text-sm text-gray-600">
              Comparison mode allows you to evaluate different paycheck scenarios side by side.
              Fill in the details for a second scenario to compare.
            </p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Paycheck Results</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  trackCalculatorExport({ format: 'pdf', calculatorType: 'paycheck' })
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
                {formatCurrency(result.currentPay.grossPay)}
              </p>
              <p className="text-xs text-blue-600">This pay period</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Net Pay</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(result.currentPay.netPay)}
              </p>
              <p className="text-xs text-green-600">Take home</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">Total Taxes</p>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(result.currentPay.totalTaxes)}
              </p>
              <p className="text-xs text-orange-600">
                {formatPercentage(result.taxes.effectiveRate)} effective rate
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
              aria-label="View breakdown"
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
                  <span className="text-sm text-gray-600">Federal Income Tax</span>
                  <span className="text-sm font-medium">{formatCurrency(result.taxes.federal)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">State Income Tax</span>
                  <span className="text-sm font-medium">{formatCurrency(result.taxes.state)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Social Security</span>
                  <span className="text-sm font-medium">{formatCurrency(result.taxes.socialSecurity)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Medicare</span>
                  <span className="text-sm font-medium">{formatCurrency(result.taxes.medicare)}</span>
                </div>
                {result.taxes.stateDisability.toNumber() > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">State Disability</span>
                    <span className="text-sm font-medium">{formatCurrency(result.taxes.stateDisability)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Annual Projection */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Annual Projection</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Annual Gross</span>
                <span className="text-sm font-medium">
                  {formatCurrency(result.projections.annualGross)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Annual Net</span>
                <span className="text-sm font-medium">
                  {formatCurrency(result.projections.annualNet)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Annual Taxes</span>
                <span className="text-sm font-medium">
                  {formatCurrency(result.projections.annualTaxes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Remaining Paychecks</span>
                <span className="text-sm font-medium">
                  {result.projections.remainingPaychecks}
                </span>
              </div>
            </div>
          </div>

          {/* YTD Summary */}
          {result.ytd.grossPay.toNumber() > 0 && (
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Year-to-Date Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">YTD Gross</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(result.ytd.grossPay)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">YTD Net</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(result.ytd.netPay)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">YTD Taxes</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(result.ytd.totalTaxes)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">YTD Effective Tax Rate</span>
                  <span className="text-sm font-medium">
                    {formatPercentage(result.ytd.effectiveTaxRate)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Calculation Dialog */}
      <SaveCalculationDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveCalculation}
        calculationType="paycheck"
      />
    </div>
  )
}