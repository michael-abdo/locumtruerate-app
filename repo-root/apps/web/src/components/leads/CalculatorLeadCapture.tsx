'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, TrendingUp, Mail, Sparkles, ChevronRight, Clock, DollarSign } from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LeadCaptureForm } from './LeadCaptureForm'
import { usePageAnalytics } from '@/hooks/use-analytics'
import { z } from 'zod'
import { safeTextSchema } from '@/lib/validation/schemas'

// Validation schema for calculation result
const calculationResultSchema = z.object({
  type: z.enum(['contract', 'paycheck', 'hourly', 'comparison']),
  annualSalary: z.number().min(0).max(10000000).optional(),
  hourlyRate: z.number().min(0).max(10000).optional(),
  weeklyPay: z.number().min(0).max(50000).optional(),
  monthlyPay: z.number().min(0).max(200000).optional(),
  netPay: z.number().min(0).max(10000000).optional(),
  location: safeTextSchema(0, 100).optional(),
  specialty: safeTextSchema(0, 100).optional(),
  experience: z.number().int().min(0).max(50).optional()
}).passthrough() // Allow additional properties

interface CalculationResult {
  type: 'contract' | 'paycheck' | 'hourly' | 'comparison'
  annualSalary?: number
  hourlyRate?: number
  weeklyPay?: number
  monthlyPay?: number
  netPay?: number
  location?: string
  specialty?: string
  experience?: number
  [key: string]: any
}

// Validation schema for component props
const calculatorLeadCapturePropsSchema = z.object({
  variant: z.enum(['popup', 'inline', 'sidebar']).optional().default('popup'),
  delay: z.number().int().min(0).max(30000).optional().default(2000),
  className: safeTextSchema(0, 200).optional().default(''),
  testId: safeTextSchema(0, 50).optional().default('calculator-lead-capture'),
  isVisible: z.boolean().optional().default(true)
})

interface CalculatorLeadCaptureProps {
  calculationData: CalculationResult
  isVisible?: boolean
  onDismiss?: () => void
  className?: string
  variant?: 'popup' | 'inline' | 'sidebar'
  delay?: number
  testId?: string
}

export function CalculatorLeadCapture({
  calculationData,
  isVisible = true,
  onDismiss,
  className = '',
  variant = 'popup',
  delay = 2000,
  testId = 'calculator-lead-capture'
}: CalculatorLeadCaptureProps) {
  // Validate calculation data
  const validatedCalculationData = React.useMemo(() => {
    try {
      return calculationResultSchema.parse(calculationData)
    } catch (error) {
      console.error('CalculatorLeadCapture: Invalid calculation data', error)
      // Return minimal valid data as fallback
      return { type: 'contract' as const }
    }
  }, [calculationData])

  // Validate props
  const validatedProps = React.useMemo(() => {
    try {
      return calculatorLeadCapturePropsSchema.parse({
        variant,
        delay,
        className,
        testId,
        isVisible
      })
    } catch (error) {
      console.error('CalculatorLeadCapture: Invalid props', error)
      return calculatorLeadCapturePropsSchema.parse({}) // Use defaults
    }
  }, [variant, delay, className, testId, isVisible])
  const [showForm, setShowForm] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const analytics = usePageAnalytics()

  // Auto-trigger after delay
  React.useEffect(() => {
    if (validatedProps.isVisible && !hasTriggered && validatedProps.delay > 0) {
      const timer = setTimeout(() => {
        setHasTriggered(true)
        analytics.trackFeatureUsage('calculator_lead_capture_triggered', {
          calculationType: validatedCalculationData.type,
          delay: validatedProps.delay,
          variant: validatedProps.variant,
          calculationValue: validatedCalculationData.annualSalary || validatedCalculationData.hourlyRate || 0
        })
      }, validatedProps.delay)

      return () => clearTimeout(timer)
    }
  }, [validatedProps.isVisible, hasTriggered, validatedProps.delay, analytics, validatedCalculationData, validatedProps.variant])

  const handleShowForm = useCallback(() => {
    setShowForm(true)
    analytics.trackFeatureUsage('calculator_lead_capture_opened', {
      calculationType: validatedCalculationData.type,
      variant: validatedProps.variant,
      calculationValue: validatedCalculationData.annualSalary || validatedCalculationData.hourlyRate || 0
    })
  }, [analytics, validatedCalculationData, validatedProps.variant])

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    analytics.trackFeatureUsage('calculator_lead_capture_dismissed', {
      calculationType: calculationData.type,
      variant,
      showedForm: showForm
    })
    onDismiss?.()
  }, [analytics, calculationData, variant, showForm, onDismiss])

  const handleFormSuccess = useCallback((leadId: string) => {
    analytics.trackFeatureUsage('calculator_lead_capture_converted', {
      calculationType: calculationData.type,
      leadId,
      variant,
      calculationValue: calculationData.annualSalary || calculationData.hourlyRate || 0
    })
    
    // Auto-dismiss after successful conversion
    setTimeout(() => {
      setIsDismissed(true)
      onDismiss?.()
    }, 2000)
  }, [analytics, calculationData, variant, onDismiss])

  // Generate insights based on calculation data
  const generateInsights = (): string[] => {
    const insights: string[] = []
    
    if (calculationData.annualSalary && calculationData.annualSalary > 200000) {
      insights.push('High-value position identified')
    }
    
    if (calculationData.hourlyRate && calculationData.hourlyRate > 100) {
      insights.push('Premium hourly rate opportunity')
    }
    
    if (calculationData.location) {
      insights.push(`${calculationData.location} market analysis`)
    }
    
    if (calculationData.specialty) {
      insights.push(`${calculationData.specialty} specialization bonus`)
    }
    
    // Default insights if none specific
    if (insights.length === 0) {
      insights.push('Personalized recommendations available', 'Market rate optimization')
    }
    
    return insights.slice(0, 3) // Limit to 3 insights
  }

  const formatValue = (value: number, type: 'currency' | 'percentage' = 'currency'): string => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value)
    }
    return `${value}%`
  }

  // Don't render if dismissed or not visible
  if (isDismissed || !isVisible || !hasTriggered) {
    return null
  }

  const insights = generateInsights()

  // Variant-specific styling
  const variantStyles = {
    popup: 'fixed bottom-4 right-4 z-50 max-w-sm',
    inline: 'w-full max-w-md mx-auto',
    sidebar: 'w-full'
  }

  const cardStyles = {
    popup: 'shadow-2xl border-2 bg-background/95 backdrop-blur-sm',
    inline: 'shadow-lg bg-background',
    sidebar: 'shadow-md bg-background'
  }

  if (showForm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${variantStyles[variant]} ${className}`}
        data-testid={`${testId}-form`}
      >
        <Card className={cardStyles[variant]}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Get Personalized Insights</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Based on your {calculationData.type} calculation
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
                aria-label="Close"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <LeadCaptureForm
              source="calculator"
              sourceId={calculationData.type}
              variant="compact"
              showOptionalFields={false}
              ctaText="Get My Personalized Report"
              calculationData={calculationData}
              onSuccess={handleFormSuccess}
              metadata={{
                triggerDelay: delay,
                variant,
                insights: insights.join(', ')
              }}
            />
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`${variantStyles[variant]} ${className}`}
        data-testid={testId}
      >
        <Card className={cardStyles[variant]}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Unlock More Insights
                    <Badge variant="secondary" className="text-xs">Free</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Get personalized recommendations based on your calculation
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Calculation Summary */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Your {calculationData.type} calculation
                </span>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-4">
                {calculationData.annualSalary && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">
                      {formatValue(calculationData.annualSalary)}
                    </span>
                    <span className="text-xs text-muted-foreground">annual</span>
                  </div>
                )}
                {calculationData.hourlyRate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-600">
                      {formatValue(calculationData.hourlyRate)}
                    </span>
                    <span className="text-xs text-muted-foreground">hourly</span>
                  </div>
                )}
              </div>
            </div>

            {/* Insights Preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium">What you'll get:</p>
              <ul className="space-y-1">
                {insights.map((insight, index) => (
                  <motion.li
                    key={insight}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <TrendingUp className="h-3 w-3 text-primary flex-shrink-0" />
                    {insight}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleShowForm}
                className="flex-1"
                size="sm"
                data-testid="get-insights-button"
              >
                <Mail className="h-4 w-4 mr-2" />
                Get Free Insights
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                Maybe Later
              </Button>
            </div>

            {/* Trust indicator */}
            <p className="text-xs text-center text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                📊 Trusted by 10,000+ medical professionals
              </span>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

export default CalculatorLeadCapture