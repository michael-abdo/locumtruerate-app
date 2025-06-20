'use client'

import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, User, Building, Mail, Phone, MessageSquare, 
  CheckCircle, AlertCircle, Loader2, Users, MapPin, 
  Clock, Video, StarIcon, Award
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/providers/trpc-provider'
import { usePageAnalytics } from '@/hooks/use-analytics'
import toast from 'react-hot-toast'
import { emailSchema, phoneSchema, safeTextSchema } from '@/lib/validation/schemas'

// Demo request validation schema
const demoRequestSchema = z.object({
  email: emailSchema,
  name: safeTextSchema(2, 100),
  company: safeTextSchema(2, 200),
  phone: phoneSchema.optional(),
  jobTitle: safeTextSchema(2, 100).optional(),
  teamSize: z.enum(['1-10', '11-50', '51-200', '200+', 'individual']).optional(),
  useCase: safeTextSchema(0, 500).optional(),
  currentChallenges: safeTextSchema(0, 1000).optional(),
  preferredTime: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
  timezone: z.string().max(50).optional(),
  urgency: z.enum(['asap', 'this_week', 'this_month', 'exploring']).default('exploring'),
  additionalInfo: safeTextSchema(0, 2000).optional(),
})

type DemoRequestForm = z.infer<typeof demoRequestSchema>

interface DemoRequestFormProps {
  variant?: 'full' | 'compact' | 'consultation'
  source?: string
  sourceId?: string
  title?: string
  description?: string
  ctaText?: string
  showBenefits?: boolean
  showTestimonial?: boolean
  className?: string
  testId?: string
  onSuccess?: (leadId: string, demoData: DemoRequestForm) => void
  onError?: (error: string) => void
}

const benefits = [
  'Personalized platform walkthrough',
  'Custom demo based on your needs',
  'Q&A with locum experts',
  'Pricing and implementation discussion'
]

const testimonial = {
  quote: "LocumTrueRate transformed how we manage locum placements. The demo showed us exactly what we needed.",
  author: "Dr. Sarah Chen",
  title: "Chief Medical Officer",
  company: "Regional Health Network"
}

export function DemoRequestForm({
  variant = 'full',
  source = 'demo_request',
  sourceId,
  title,
  description,
  ctaText = 'Request Demo',
  showBenefits = true,
  showTestimonial = false,
  className = '',
  testId = 'demo-request-form',
  onSuccess,
  onError
}: DemoRequestFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [demoSource, setDemoSource] = useState(source)
  const analytics = usePageAnalytics()

  // Track source from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    const utmMedium = urlParams.get('utm_medium')
    
    if (utmSource) {
      setDemoSource(`${source}_${utmSource}_${utmMedium || 'direct'}`)
    }
  }, [source])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<DemoRequestForm>({
    resolver: zodResolver(demoRequestSchema),
    mode: 'onChange'
  })

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: (result) => {
      setIsSubmitted(true)
      toast.success('Demo request received! We\'ll contact you within 24 hours.')
      
      // Analytics tracking
      analytics.trackFeatureUsage('demo_request', {
        source: demoSource,
        sourceId,
        leadId: result.id,
        variant,
        teamSize: watch('teamSize'),
        urgency: watch('urgency')
      })

      // Reset form after delay
      setTimeout(() => {
        reset()
        setIsSubmitted(false)
      }, 5000)

      onSuccess?.(result.id, watch())
    },
    onError: (error) => {
      const errorMessage = error.message || 'Something went wrong. Please try again.'
      toast.error(errorMessage)
      
      // Analytics tracking for errors
      analytics.trackError(errorMessage, 'demo_request_form', {
        source: demoSource,
        variant
      })

      onError?.(errorMessage)
    }
  })

  const onSubmit = useCallback((data: DemoRequestForm) => {
    // Track submission attempt
    analytics.trackFeatureUsage('demo_request_submit', {
      source: demoSource,
      sourceId,
      variant,
      hasUseCase: !!data.useCase,
      hasChallenges: !!data.currentChallenges,
      teamSize: data.teamSize,
      urgency: data.urgency
    })

    createLeadMutation.mutate({
      email: data.email,
      name: data.name,
      company: data.company,
      phone: data.phone,
      message: `Demo Request - ${data.useCase || 'General interest'}`,
      source: demoSource,
      sourceId,
      metadata: {
        type: 'demo_request',
        variant,
        formData: {
          jobTitle: data.jobTitle,
          teamSize: data.teamSize,
          useCase: data.useCase,
          currentChallenges: data.currentChallenges,
          preferredTime: data.preferredTime,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          urgency: data.urgency,
          additionalInfo: data.additionalInfo
        },
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      }
    })
  }, [analytics, createLeadMutation, demoSource, sourceId, variant])

  // Variant-specific configurations
  const variantConfig = {
    full: {
      title: title || 'Schedule Your Personalized Demo',
      description: description || 'See how LocumTrueRate can transform your locum management process.',
      containerClass: 'max-w-2xl mx-auto',
      showAllFields: true
    },
    compact: {
      title: title || 'Request Demo',
      description: description || 'Get a personalized platform walkthrough.',
      containerClass: 'max-w-lg',
      showAllFields: false
    },
    consultation: {
      title: title || 'Free Consultation & Demo',
      description: description || 'Get expert advice and see the platform in action.',
      containerClass: 'max-w-xl',
      showAllFields: true
    }
  }

  const config = variantConfig[variant]

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${config.containerClass} ${className}`}
        data-testid={`${testId}-success`}
      >
        <Card className="text-center p-8">
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Demo Request Received!
                </h3>
                <p className="text-muted-foreground">
                  Thank you for your interest in LocumTrueRate. Our team will contact you within 24 hours to schedule your personalized demo.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Our team will call you within 24 hours
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  We'll schedule a convenient time for your demo
                </li>
                <li className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  30-minute personalized platform walkthrough
                </li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Questions? Email us at{' '}
              <a href="mailto:demo@locumtruerate.com" className="text-primary hover:underline">
                demo@locumtruerate.com
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.containerClass} ${className}`}
      data-testid={testId}
    >
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs">
              Free 30-min Demo
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold">
            {config.title}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {config.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Benefits */}
          {showBenefits && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                What's included in your demo:
              </h4>
              <ul className="space-y-2">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {benefit}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Testimonial */}
          {showTestimonial && (
            <div className="border-l-4 border-primary/30 pl-4 py-2">
              <blockquote className="text-sm italic text-muted-foreground mb-2">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  — {testimonial.author}, {testimonial.title}
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name *
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
                    placeholder="sarah@hospital.com"
                    data-testid="email-input"
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-destructive flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Hospital/Organization *
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
                <AnimatePresence>
                  {errors.company && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-destructive flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.company.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

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
            </div>

            {/* Additional fields for full variant */}
            {config.showAllFields && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-sm font-medium">
                      Job Title
                    </Label>
                    <Input
                      {...register('jobTitle')}
                      type="text"
                      id="jobTitle"
                      placeholder="Chief Medical Officer"
                      data-testid="job-title-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamSize" className="text-sm font-medium">
                      Team Size
                    </Label>
                    <select
                      {...register('teamSize')}
                      id="teamSize"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      data-testid="team-size-select"
                    >
                      <option value="">Select team size</option>
                      <option value="individual">Individual practitioner</option>
                      <option value="1-10">1-10 people</option>
                      <option value="11-50">11-50 people</option>
                      <option value="51-200">51-200 people</option>
                      <option value="200+">200+ people</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredTime" className="text-sm font-medium">
                      Preferred Demo Time
                    </Label>
                    <select
                      {...register('preferredTime')}
                      id="preferredTime"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      data-testid="preferred-time-select"
                    >
                      <option value="">Any time</option>
                      <option value="morning">Morning (9AM - 12PM)</option>
                      <option value="afternoon">Afternoon (12PM - 5PM)</option>
                      <option value="evening">Evening (5PM - 8PM)</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgency" className="text-sm font-medium">
                      Timeline
                    </Label>
                    <select
                      {...register('urgency')}
                      id="urgency"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      data-testid="urgency-select"
                    >
                      <option value="exploring">Just exploring</option>
                      <option value="this_month">Within this month</option>
                      <option value="this_week">This week</option>
                      <option value="asap">ASAP</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="useCase" className="text-sm font-medium">
                    Primary Use Case
                  </Label>
                  <Textarea
                    {...register('useCase')}
                    id="useCase"
                    className="min-h-[80px] resize-none"
                    placeholder="Tell us about your main goals with locum management (e.g., streamline scheduling, improve coverage, reduce costs)"
                    data-testid="use-case-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentChallenges" className="text-sm font-medium">
                    Current Challenges
                  </Label>
                  <Textarea
                    {...register('currentChallenges')}
                    id="currentChallenges"
                    className="min-h-[80px] resize-none"
                    placeholder="What are your biggest challenges with locum management today?"
                    data-testid="challenges-input"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={createLeadMutation.isPending}
              disabled={!isValid || createLeadMutation.isPending}
              data-testid="submit-button"
            >
              {createLeadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  {ctaText}
                </>
              )}
            </Button>

            {/* Privacy note */}
            <p className="text-xs text-muted-foreground text-center">
              By requesting a demo, you agree to our{' '}
              <a href="/legal/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              . We'll only contact you about your demo request.
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default DemoRequestForm