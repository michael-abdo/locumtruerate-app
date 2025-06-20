'use client'

import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, CheckCircle, AlertCircle, Loader2, Shield, Gift, Newspaper, TrendingUp } from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/providers/trpc-provider'
import { usePageAnalytics } from '@/hooks/use-analytics'
import toast from 'react-hot-toast'

import { emailSchema } from '@/lib/validation/schemas'

// Newsletter signup schema
const newsletterSchema = z.object({
  email: emailSchema,
})

type NewsletterForm = z.infer<typeof newsletterSchema>

interface NewsletterSignupProps {
  variant?: 'default' | 'minimal' | 'featured' | 'footer' | 'inline'
  source?: string
  sourceId?: string
  title?: string
  description?: string
  ctaText?: string
  benefits?: string[]
  showBenefits?: boolean
  showPrivacyNote?: boolean
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  testId?: string
  onSuccess?: (email: string) => void
  onError?: (error: string) => void
}

const defaultBenefits = [
  'Weekly market insights and salary trends',
  'Exclusive job opportunities',
  'Locum tips and best practices',
  'Industry news and updates'
]

export function NewsletterSignup({
  variant = 'default',
  source = 'newsletter',
  sourceId,
  title,
  description,
  ctaText = 'Subscribe',
  benefits = defaultBenefits,
  showBenefits = true,
  showPrivacyNote = true,
  placeholder = 'Enter your email address',
  size = 'md',
  className = '',
  testId = 'newsletter-signup',
  onSuccess,
  onError
}: NewsletterSignupProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [newsletterSource, setNewsletterSource] = useState(source)
  const analytics = usePageAnalytics()

  // Track source from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    const utmMedium = urlParams.get('utm_medium')
    
    if (utmSource) {
      setNewsletterSource(`${source}_${utmSource}_${utmMedium || 'direct'}`)
    }
  }, [source])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema),
    mode: 'onChange'
  })

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: (result) => {
      setIsSubmitted(true)
      toast.success('Thanks for subscribing! Check your email to confirm.')
      
      // Analytics tracking
      analytics.trackFeatureUsage('newsletter_signup', {
        source: newsletterSource,
        sourceId,
        leadId: result.id,
        variant,
        size
      })

      // Reset form after delay
      setTimeout(() => {
        reset()
        setIsSubmitted(false)
      }, 5000)

      onSuccess?.(watch('email'))
    },
    onError: (error) => {
      const errorMessage = error.message || 'Something went wrong. Please try again.'
      toast.error(errorMessage)
      
      // Analytics tracking for errors
      analytics.trackError(errorMessage, 'newsletter_signup', {
        source: newsletterSource,
        variant,
        email: watch('email')
      })

      onError?.(errorMessage)
    }
  })

  const onSubmit = useCallback((data: NewsletterForm) => {
    // Track submission attempt
    analytics.trackFeatureUsage('newsletter_signup_attempt', {
      source: newsletterSource,
      sourceId,
      variant,
      size
    })

    createLeadMutation.mutate({
      email: data.email,
      source: newsletterSource,
      sourceId,
      metadata: {
        type: 'newsletter',
        variant,
        size,
        doubleOptIn: true,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      }
    })
  }, [analytics, createLeadMutation, newsletterSource, sourceId, variant, size])

  // Variant-specific configurations
  const variantConfig = {
    default: {
      title: title || 'Stay Updated',
      description: description || 'Get the latest locum insights delivered to your inbox.',
      containerClass: 'bg-background border rounded-lg p-6',
      titleClass: 'text-xl font-semibold text-foreground mb-2',
      descriptionClass: 'text-muted-foreground mb-4'
    },
    minimal: {
      title: title || 'Newsletter',
      description: description || 'Stay updated with locum insights.',
      containerClass: 'bg-muted/30 rounded-lg p-4',
      titleClass: 'text-lg font-medium text-foreground mb-2',
      descriptionClass: 'text-sm text-muted-foreground mb-3'
    },
    featured: {
      title: title || '🎯 Join 10,000+ Medical Professionals',
      description: description || 'Get exclusive insights, premium job alerts, and industry trends.',
      containerClass: 'bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl p-6',
      titleClass: 'text-2xl font-bold text-foreground mb-3',
      descriptionClass: 'text-muted-foreground mb-4'
    },
    footer: {
      title: title || 'Newsletter',
      description: description || 'Weekly updates and insights.',
      containerClass: 'space-y-3',
      titleClass: 'text-lg font-medium text-foreground',
      descriptionClass: 'text-sm text-muted-foreground'
    },
    inline: {
      title: title || '',
      description: description || '',
      containerClass: 'space-y-2',
      titleClass: 'text-base font-medium text-foreground',
      descriptionClass: 'text-sm text-muted-foreground'
    }
  }

  const config = variantConfig[variant]

  // Size configurations
  const sizeConfig = {
    sm: {
      inputClass: 'h-9 text-sm',
      buttonClass: 'h-9 px-3 text-sm',
      iconSize: 'h-4 w-4'
    },
    md: {
      inputClass: 'h-10',
      buttonClass: 'h-10 px-4',
      iconSize: 'h-4 w-4'
    },
    lg: {
      inputClass: 'h-11 text-base',
      buttonClass: 'h-11 px-6',
      iconSize: 'h-5 w-5'
    }
  }

  const sizes = sizeConfig[size]

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${config.containerClass} ${className}`}
        data-testid={`${testId}-success`}
      >
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Thanks for subscribing!
          </h3>
          <p className="text-muted-foreground text-sm">
            Please check your email and click the confirmation link to complete your subscription.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Double opt-in ensures your privacy</span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.containerClass} ${className}`}
      data-testid={testId}
    >
      {/* Header */}
      {config.title && (
        <div className="text-center mb-4">
          <h3 className={config.titleClass}>
            {config.title}
          </h3>
          {config.description && (
            <p className={config.descriptionClass}>
              {config.description}
            </p>
          )}
        </div>
      )}

      {/* Benefits */}
      {showBenefits && variant !== 'footer' && variant !== 'inline' && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">What you'll get:</span>
          </div>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {variant === 'featured' ? (
                    <TrendingUp className="h-3 w-3 text-primary" />
                  ) : (
                    <div className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5" />
                  )}
                </div>
                {benefit}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-2">
          {variant !== 'footer' && variant !== 'inline' && (
            <Label htmlFor="newsletter-email" className="text-sm font-medium">
              Email Address
            </Label>
          )}
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${sizes.iconSize} text-muted-foreground`} />
            <Input
              {...register('email')}
              type="email"
              id="newsletter-email"
              className={`pl-10 ${sizes.inputClass}`}
              placeholder={placeholder}
              aria-describedby={errors.email ? 'newsletter-email-error' : undefined}
              data-testid="newsletter-email-input"
            />
          </div>
          <AnimatePresence>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                id="newsletter-email-error"
                className="text-sm text-destructive flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <Button
          type="submit"
          className={`w-full ${sizes.buttonClass}`}
          loading={createLeadMutation.isPending}
          disabled={!isValid || createLeadMutation.isPending}
          data-testid="newsletter-submit-button"
        >
          {createLeadMutation.isPending ? (
            <>
              <Loader2 className={`mr-2 ${sizes.iconSize} animate-spin`} />
              Subscribing...
            </>
          ) : (
            <>
              <Newspaper className={`mr-2 ${sizes.iconSize}`} />
              {ctaText}
            </>
          )}
        </Button>

        {/* Trust indicators */}
        {variant === 'featured' && (
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Spam-free</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>Weekly digest</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Unsubscribe anytime</span>
            </div>
          </div>
        )}

        {/* Privacy note */}
        {showPrivacyNote && (
          <p className="text-xs text-muted-foreground text-center">
            By subscribing, you agree to our{' '}
            <a href="/legal/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            . Unsubscribe anytime.
          </p>
        )}
      </form>

      {/* Popular badge for featured variant */}
      {variant === 'featured' && (
        <div className="absolute -top-3 -right-3">
          <Badge className="bg-primary text-primary-foreground shadow-lg">
            Popular
          </Badge>
        </div>
      )}
    </motion.div>
  )
}

export default NewsletterSignup