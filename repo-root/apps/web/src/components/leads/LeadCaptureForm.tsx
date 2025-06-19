'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, User, Building, Phone, MessageSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { trpc } from '@/providers/trpc-provider'
import { usePageAnalytics } from '@/hooks/use-analytics'
import toast from 'react-hot-toast'

// Form validation schema
const leadCaptureSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
})

type LeadCaptureForm = z.infer<typeof leadCaptureSchema>

interface LeadCaptureFormProps {
  source?: string
  sourceId?: string
  initialData?: Partial<LeadCaptureForm>
  onSuccess?: (leadId: string) => void
  onError?: (error: string) => void
  className?: string
  variant?: 'default' | 'compact' | 'inline'
  showOptionalFields?: boolean
  ctaText?: string
  title?: string
  description?: string
  calculationData?: Record<string, any>
  metadata?: Record<string, any>
  testId?: string
}

export function LeadCaptureForm({
  source = 'website',
  sourceId,
  initialData = {},
  onSuccess,
  onError,
  className = '',
  variant = 'default',
  showOptionalFields = true,
  ctaText = 'Get Started',
  title,
  description,
  calculationData,
  metadata = {},
  testId = 'lead-capture-form'
}: LeadCaptureFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [leadSource, setLeadSource] = useState(source)
  const analytics = usePageAnalytics()

  // Track lead source from URL params and referrer
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    const utmMedium = urlParams.get('utm_medium')
    const utmCampaign = urlParams.get('utm_campaign')
    const referrer = document.referrer

    // Enhanced source tracking
    let enhancedSource = source
    if (utmSource) {
      enhancedSource = `${utmSource}_${utmMedium || 'direct'}`
    } else if (referrer) {
      try {
        const referrerDomain = new URL(referrer).hostname
        enhancedSource = `referral_${referrerDomain}`
      } catch {
        enhancedSource = 'referral_unknown'
      }
    }

    setLeadSource(enhancedSource)

    // Update metadata with UTM parameters
    if (utmSource || utmMedium || utmCampaign) {
      metadata.utm = {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        referrer: referrer || undefined
      }
    }
  }, [source, metadata])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<LeadCaptureForm>({
    resolver: zodResolver(leadCaptureSchema),
    defaultValues: initialData,
    mode: 'onChange'
  })

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: (result) => {
      setIsSubmitted(true)
      toast.success('Thank you! We\'ll be in touch soon.')
      
      // Analytics tracking
      analytics.trackFeatureUsage('lead_capture', {
        source: leadSource,
        sourceId,
        leadId: result.id,
        hasCalculationData: !!calculationData,
        variant
      })

      // Reset form after success
      setTimeout(() => {
        reset()
        setIsSubmitted(false)
      }, 3000)

      onSuccess?.(result.id)
    },
    onError: (error) => {
      const errorMessage = error.message || 'Something went wrong. Please try again.'
      toast.error(errorMessage)
      
      // Analytics tracking for errors
      analytics.trackError(errorMessage, 'lead_capture_form', {
        source: leadSource,
        variant
      })

      onError?.(errorMessage)
    }
  })

  const onSubmit = (data: LeadCaptureForm) => {
    // Track form submission attempt
    analytics.trackFeatureUsage('lead_capture_submit', {
      source: leadSource,
      sourceId,
      hasCalculationData: !!calculationData,
      variant,
      formData: {
        hasName: !!data.name,
        hasCompany: !!data.company,
        hasPhone: !!data.phone,
        hasMessage: !!data.message
      }
    })

    createLeadMutation.mutate({
      ...data,
      source: leadSource,
      sourceId,
      calculationData,
      metadata: {
        ...metadata,
        formVariant: variant,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })
  }

  // Variant-specific styling
  const variantStyles = {
    default: 'space-y-6 p-6 bg-background border rounded-lg shadow-sm',
    compact: 'space-y-4 p-4 bg-background border rounded-md',
    inline: 'space-y-3'
  }

  const buttonSizes = {
    default: 'lg' as const,
    compact: 'default' as const,
    inline: 'sm' as const
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${variantStyles[variant]} ${className}`}
        data-testid={`${testId}-success`}
      >
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Thank You!
          </h3>
          <p className="text-muted-foreground">
            We've received your information and will be in touch soon.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${variantStyles[variant]} ${className}`}
      data-testid={testId}
    >
      {(title || description) && (
        <div className="text-center mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email - Always required */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              {...register('email')}
              type="email"
              id="email"
              className="pl-10"
              placeholder="your.email@example.com"
              aria-describedby={errors.email ? 'email-error' : undefined}
              data-testid="email-input"
            />
          </div>
          <AnimatePresence>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                id="email-error"
                className="text-sm text-destructive flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Optional fields based on variant and showOptionalFields */}
        {showOptionalFields && (
          <>
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register('name')}
                  type="text"
                  id="name"
                  className="pl-10"
                  placeholder="Dr. Sarah Johnson"
                  data-testid="name-input"
                />
              </div>
              <AnimatePresence>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {errors.name.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">
                Hospital/Practice Name
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register('company')}
                  type="text"
                  id="company"
                  className="pl-10"
                  placeholder="City General Hospital"
                  data-testid="company-input"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  className="pl-10"
                  placeholder="(555) 123-4567"
                  data-testid="phone-input"
                />
              </div>
            </div>

            {/* Message - Only show in default variant */}
            {variant === 'default' && (
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">
                  Additional Information
                </Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    {...register('message')}
                    id="message"
                    className="pl-10 min-h-[100px] resize-none"
                    placeholder="Tell us about your locum needs, preferred locations, or any specific requirements..."
                    data-testid="message-input"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size={buttonSizes[variant]}
          className="w-full"
          loading={createLeadMutation.isPending}
          disabled={!isValid || createLeadMutation.isPending}
          data-testid="submit-button"
        >
          {createLeadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            ctaText
          )}
        </Button>

        {/* Privacy note */}
        <p className="text-xs text-muted-foreground text-center">
          By submitting this form, you agree to our{' '}
          <a href="/legal/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/legal/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>
          .
        </p>
      </form>
    </motion.div>
  )
}

export default LeadCaptureForm