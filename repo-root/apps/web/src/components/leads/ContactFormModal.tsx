'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Phone, Calendar, HelpCircle } from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody } from '@locumtruerate/ui'
import { LeadCaptureForm } from './LeadCaptureForm'
import { usePageAnalytics } from '@/hooks/use-analytics'

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'button' | 'exit_intent' | 'time_delay' | 'scroll' | 'custom'
  source?: string
  sourceId?: string
  title?: string
  description?: string
  ctaText?: string
  variant?: 'contact' | 'demo' | 'support' | 'consultation'
  showQuickActions?: boolean
  className?: string
  testId?: string
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  description: string
}

export function ContactFormModal({
  isOpen,
  onClose,
  trigger = 'button',
  source = 'modal',
  sourceId,
  title,
  description,
  ctaText,
  variant = 'contact',
  showQuickActions = true,
  className = '',
  testId = 'contact-form-modal'
}: ContactFormModalProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [modalSource, setModalSource] = useState(source)
  const analytics = usePageAnalytics()

  // Update source based on trigger
  useEffect(() => {
    if (trigger) {
      setModalSource(`${source}_${trigger}`)
    }
  }, [source, trigger])

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      analytics.trackFeatureUsage('contact_modal_opened', {
        trigger,
        source: modalSource,
        sourceId,
        variant
      })
    }
  }, [isOpen, trigger, modalSource, sourceId, variant, analytics])

  const handleClose = useCallback(() => {
    analytics.trackFeatureUsage('contact_modal_closed', {
      trigger,
      source: modalSource,
      sourceId,
      variant,
      selectedAction,
      hadInteraction: !!selectedAction
    })
    onClose()
  }, [analytics, trigger, modalSource, sourceId, variant, selectedAction, onClose])

  const handleFormSuccess = useCallback((leadId: string) => {
    analytics.trackFeatureUsage('contact_modal_converted', {
      trigger,
      source: modalSource,
      sourceId,
      variant,
      leadId,
      selectedAction
    })
    
    // Close modal after successful submission
    setTimeout(() => {
      handleClose()
    }, 2000)
  }, [analytics, trigger, modalSource, sourceId, variant, selectedAction, handleClose])

  const handleQuickActionSelect = useCallback((actionId: string) => {
    setSelectedAction(actionId)
    analytics.trackFeatureUsage('contact_modal_quick_action', {
      action: actionId,
      trigger,
      source: modalSource,
      variant
    })
  }, [analytics, trigger, modalSource, variant])

  // Variant-specific configurations
  const variantConfig = {
    contact: {
      title: title || 'Get in Touch',
      description: description || 'We\'re here to help with your locum tenens needs.',
      ctaText: ctaText || 'Send Message',
      icon: <MessageCircle className="h-5 w-5" />
    },
    demo: {
      title: title || 'Schedule a Demo',
      description: description || 'See how LocumTrueRate can transform your locum experience.',
      ctaText: ctaText || 'Request Demo',
      icon: <Calendar className="h-5 w-5" />
    },
    support: {
      title: title || 'Need Help?',
      description: description || 'Our support team is ready to assist you.',
      ctaText: ctaText || 'Get Support',
      icon: <HelpCircle className="h-5 w-5" />
    },
    consultation: {
      title: title || 'Free Consultation',
      description: description || 'Get personalized advice from our locum experts.',
      ctaText: ctaText || 'Book Consultation',
      icon: <Phone className="h-5 w-5" />
    }
  }

  const config = variantConfig[variant]

  // Quick action configurations
  const quickActions: QuickAction[] = [
    {
      id: 'general_inquiry',
      label: 'General Question',
      icon: <MessageCircle className="h-4 w-4" />,
      description: 'Ask about our services',
      action: () => handleQuickActionSelect('general_inquiry')
    },
    {
      id: 'demo_request',
      label: 'Schedule Demo',
      icon: <Calendar className="h-4 w-4" />,
      description: 'See the platform in action',
      action: () => handleQuickActionSelect('demo_request')
    },
    {
      id: 'consultation',
      label: 'Free Consultation',
      icon: <Phone className="h-4 w-4" />,
      description: 'Get personalized advice',
      action: () => handleQuickActionSelect('consultation')
    },
    {
      id: 'support',
      label: 'Technical Support',
      icon: <HelpCircle className="h-4 w-4" />,
      description: 'Get help with the platform',
      action: () => handleQuickActionSelect('support')
    }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      className={className}
      data-testid={testId}
    >
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {config.icon}
          </div>
          <div>
            <ModalTitle>{config.title}</ModalTitle>
            <ModalDescription>{config.description}</ModalDescription>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Quick Actions */}
          {showQuickActions && !selectedAction && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                What can we help you with?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={action.action}
                    className="p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-testid={`quick-action-${action.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-primary mt-0.5">
                        {action.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{action.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
              
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAction('custom')}
                  className="text-muted-foreground"
                >
                  Or write a custom message
                </Button>
              </div>
            </div>
          )}

          {/* Contact Form */}
          <AnimatePresence>
            {(!showQuickActions || selectedAction) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {selectedAction && selectedAction !== 'custom' && (
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {quickActions.find(a => a.id === selectedAction)?.label}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAction(null)}
                        className="h-6 w-6 p-0"
                        aria-label="Change selection"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <LeadCaptureForm
                  source={modalSource}
                  sourceId={sourceId || selectedAction || undefined}
                  variant="compact"
                  showOptionalFields={true}
                  ctaText={config.ctaText}
                  onSuccess={handleFormSuccess}
                  metadata={{
                    trigger,
                    variant,
                    selectedAction: selectedAction || undefined,
                    modalSource: modalSource,
                    quickActionUsed: !!selectedAction && selectedAction !== 'custom'
                  }}
                  initialData={
                    selectedAction && selectedAction !== 'custom'
                      ? {
                          message: `I'm interested in: ${
                            quickActions.find(a => a.id === selectedAction)?.label
                          }`
                        }
                      : undefined
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contact Information */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Need immediate assistance?
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a
                href="tel:+1-555-123-4567"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                onClick={() => analytics.trackFeatureUsage('contact_modal_phone_click', { trigger, variant })}
              >
                <Phone className="h-4 w-4" />
                (555) 123-4567
              </a>
              <span className="text-muted-foreground">|</span>
              <a
                href="mailto:support@locumtruerate.com"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                onClick={() => analytics.trackFeatureUsage('contact_modal_email_click', { trigger, variant })}
              >
                <MessageCircle className="h-4 w-4" />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}

// Hook for exit intent detection
export function useExitIntent(onExitIntent: () => void, enabled: boolean = true) {
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!enabled || hasTriggered) return

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setHasTriggered(true)
        onExitIntent()
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [enabled, hasTriggered, onExitIntent])

  return hasTriggered
}

// Hook for scroll-based triggers
export function useScrollTrigger(threshold: number, onTrigger: () => void, enabled: boolean = true) {
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!enabled || hasTriggered) return

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      if (scrollPercent >= threshold) {
        setHasTriggered(true)
        onTrigger()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [enabled, hasTriggered, threshold, onTrigger])

  return hasTriggered
}

// Hook for time-based triggers
export function useTimeTrigger(delay: number, onTrigger: () => void, enabled: boolean = true) {
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!enabled || hasTriggered) return

    const timer = setTimeout(() => {
      setHasTriggered(true)
      onTrigger()
    }, delay)

    return () => clearTimeout(timer)
  }, [enabled, hasTriggered, delay, onTrigger])

  return hasTriggered
}

export default ContactFormModal