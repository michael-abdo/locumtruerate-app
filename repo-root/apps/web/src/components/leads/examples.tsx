/**
 * Usage Examples for Lead Capture Components
 * 
 * This file demonstrates how to integrate the lead capture components
 * into your application with various scenarios and configurations.
 */

'use client'

import React, { useState } from 'react'
import { 
  LeadCaptureForm,
  CalculatorLeadCapture,
  ContactFormModal,
  NewsletterSignup,
  DemoRequestForm,
  useExitIntent,
  useScrollTrigger,
  useTimeTrigger
} from './index'

// Example 1: Landing page with main lead capture form
export function LandingPageExample() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <LeadCaptureForm
          source="landing_page"
          title="Transform Your Locum Experience"
          description="Join thousands of medical professionals who trust LocumTrueRate for their locum needs."
          ctaText="Get Started Free"
          variant="default"
          showOptionalFields={true}
          onSuccess={(leadId) => {
            console.log('Landing page lead captured:', leadId)
            // Redirect to onboarding or thank you page
          }}
        />
      </div>
    </div>
  )
}

// Example 2: Calculator page with triggered lead capture
export function CalculatorPageExample() {
  const [calculationComplete, setCalculationComplete] = useState(false)
  const [calculationData, setCalculationData] = useState(null)

  // Simulate calculation completion
  const handleCalculationComplete = (data: any) => {
    setCalculationData(data)
    setCalculationComplete(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Your calculator component would go here */}
      <div className="bg-muted p-8 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Salary Calculator</h2>
        <p className="mb-4">Calculate your potential earnings...</p>
        <button 
          onClick={() => handleCalculationComplete({
            type: 'contract',
            annualSalary: 250000,
            hourlyRate: 120,
            location: 'Los Angeles, CA',
            specialty: 'Emergency Medicine'
          })}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Calculate
        </button>
      </div>

      {/* Calculator lead capture - appears after calculation */}
      {calculationComplete && calculationData && (
        <CalculatorLeadCapture
          calculationData={calculationData}
          variant="popup"
          delay={2000}
          onDismiss={() => setCalculationComplete(false)}
        />
      )}
    </div>
  )
}

// Example 3: Contact modal with triggers
export function ContactModalExample() {
  const [showModal, setShowModal] = useState(false)
  const [triggerType, setTriggerType] = useState<string>('')

  // Exit intent trigger
  useExitIntent(() => {
    setTriggerType('exit_intent')
    setShowModal(true)
  }, !showModal)

  // Scroll trigger (75% of page)
  useScrollTrigger(75, () => {
    if (!showModal) {
      setTriggerType('scroll_75')
      setShowModal(true)
    }
  }, !showModal)

  // Time trigger (30 seconds)
  useTimeTrigger(30000, () => {
    if (!showModal) {
      setTriggerType('time_30s')
      setShowModal(true)
    }
  }, !showModal)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Our Services</h1>
        <p className="text-lg mb-4">
          Explore our comprehensive locum tenens platform...
        </p>
        
        {/* Manual trigger button */}
        <button
          onClick={() => {
            setTriggerType('manual')
            setShowModal(true)
          }}
          className="bg-primary text-white px-6 py-3 rounded-lg"
        >
          Contact Us
        </button>

        {/* Long content to enable scroll trigger */}
        <div className="mt-12 space-y-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-muted p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Feature {i + 1}</h2>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
            </div>
          ))}
        </div>
      </div>

      <ContactFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        trigger={triggerType as any}
        variant="contact"
        showQuickActions={true}
        title="How can we help you?"
        description="Choose an option below or send us a custom message."
      />
    </div>
  )
}

// Example 4: Newsletter signup variations
export function NewsletterExamples() {
  return (
    <div className="space-y-12 p-8">
      {/* Featured newsletter signup */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Featured Newsletter</h3>
        <NewsletterSignup
          variant="featured"
          size="lg"
          title="🎯 Join 10,000+ Medical Professionals"
          description="Get exclusive insights, premium job alerts, and industry trends."
          showBenefits={true}
          benefits={[
            'Weekly salary insights and market trends',
            'Exclusive high-paying locum opportunities',
            'Industry news and regulatory updates',
            'Expert tips for career advancement'
          ]}
        />
      </div>

      {/* Minimal footer version */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Footer Newsletter</h3>
        <div className="bg-muted p-6 rounded-lg">
          <NewsletterSignup
            variant="footer"
            size="sm"
            title="Stay Updated"
            description="Weekly insights delivered to your inbox."
            showBenefits={false}
            showPrivacyNote={false}
          />
        </div>
      </div>

      {/* Inline compact version */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Inline Newsletter</h3>
        <div className="bg-background border rounded-lg p-4">
          <p className="mb-4">
            Want more content like this? Subscribe to our newsletter for weekly updates.
          </p>
          <NewsletterSignup
            variant="inline"
            size="sm"
            placeholder="your@email.com"
            ctaText="Subscribe"
            showBenefits={false}
          />
        </div>
      </div>
    </div>
  )
}

// Example 5: Demo request form
export function DemoRequestExample() {
  return (
    <div className="container mx-auto px-4 py-12">
      <DemoRequestForm
        variant="full"
        title="See LocumTrueRate in Action"
        description="Get a personalized demo tailored to your organization's needs."
        ctaText="Schedule My Demo"
        showBenefits={true}
        showTestimonial={true}
        onSuccess={(leadId, demoData) => {
          console.log('Demo requested:', leadId, demoData)
          // Redirect to thank you page or calendar booking
        }}
      />
    </div>
  )
}

// Example 6: Multi-step lead capture flow
export function MultiStepLeadFlow() {
  const [step, setStep] = useState(1)
  const [leadData, setLeadData] = useState<any>({})

  const handleLeadCapture = (data: any) => {
    setLeadData(prev => ({ ...prev, ...data }))
    setStep(2)
  }

  const handleNewsletterSignup = (email: string) => {
    setLeadData(prev => ({ ...prev, newsletter: true, email }))
    setStep(3)
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Step 1: Basic Information</h2>
          <LeadCaptureForm
            source="multi_step_flow"
            sourceId="step_1"
            variant="compact"
            title="Tell us about yourself"
            description="We'll personalize your experience based on this information."
            ctaText="Continue"
            showOptionalFields={false}
            onSuccess={handleLeadCapture}
          />
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Step 2: Stay Updated</h2>
          <NewsletterSignup
            variant="default"
            title="Get Weekly Insights"
            description="Receive personalized job alerts and market updates."
            ctaText="Subscribe & Continue"
            showBenefits={true}
            onSuccess={handleNewsletterSignup}
          />
          <button
            onClick={() => setStep(3)}
            className="mt-4 text-muted-foreground underline"
          >
            Skip this step
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to LocumTrueRate!</h2>
          <p className="text-muted-foreground mb-6">
            Your account has been created. Let's get started.
          </p>
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Your Information:</h3>
            <pre className="text-sm text-left">
              {JSON.stringify(leadData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// Example 7: A/B Testing setup
export function ABTestingExample() {
  // Simulate A/B test variant selection
  const [variant] = useState(() => 
    Math.random() > 0.5 ? 'variant_a' : 'variant_b'
  )

  const formConfig = {
    variant_a: {
      title: "Start Your Locum Journey",
      description: "Join the leading platform for locum professionals.",
      ctaText: "Get Started",
      variant: 'default' as const
    },
    variant_b: {
      title: "Boost Your Locum Income",
      description: "Discover high-paying opportunities with our exclusive platform.",
      ctaText: "Unlock Opportunities",
      variant: 'compact' as const
    }
  }

  const config = formConfig[variant as keyof typeof formConfig]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-4 text-sm text-muted-foreground">
        A/B Test Variant: {variant}
      </div>
      
      <LeadCaptureForm
        source="ab_test"
        sourceId={variant}
        title={config.title}
        description={config.description}
        ctaText={config.ctaText}
        variant={config.variant}
        metadata={{
          abTestVariant: variant,
          testName: 'homepage_hero_v1'
        }}
        testId={`lead-form-${variant}`}
      />
    </div>
  )
}

// Example 8: Mobile-optimized implementation
export function MobileOptimizedExample() {
  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="p-4">
      <div className="mb-4 text-sm text-muted-foreground">
        Device: {isMobile ? 'Mobile' : 'Desktop'}
      </div>

      {/* Responsive form that adapts to mobile */}
      <LeadCaptureForm
        source="mobile_optimized"
        variant={isMobile ? 'compact' : 'default'}
        title={isMobile ? "Get Started" : "Transform Your Locum Experience"}
        description={isMobile ? "Join thousands of medical professionals." : "Join thousands of medical professionals who trust LocumTrueRate for their locum needs."}
        ctaText={isMobile ? "Start" : "Get Started Free"}
        showOptionalFields={!isMobile}
        className={isMobile ? 'px-2' : 'px-6'}
      />

      {/* Mobile-specific newsletter placement */}
      {isMobile && (
        <div className="mt-8">
          <NewsletterSignup
            variant="minimal"
            size="sm"
            title="Quick Updates"
            placeholder="Email"
            ctaText="Subscribe"
            showBenefits={false}
          />
        </div>
      )}
    </div>
  )
}

// Export all examples for easy importing
export const examples = {
  LandingPageExample,
  CalculatorPageExample,
  ContactModalExample,
  NewsletterExamples,
  DemoRequestExample,
  MultiStepLeadFlow,
  ABTestingExample,
  MobileOptimizedExample
}