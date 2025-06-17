// Main onboarding exports
export * from './types'
export * from './onboarding-context'
export * from './flows'
export * from './analytics'
export * from './guided-tour'
export * from './onboarding-modal'

// Step components
export * from './steps'

// Re-export commonly used items
export { useOnboarding } from './onboarding-context'
export { OnboardingProvider } from './onboarding-context'
export { OnboardingModal, OnboardingWidget, OnboardingTooltip } from './onboarding-modal'
export { GuidedTour, useGuidedTour } from './guided-tour'
export { defaultOnboardingFlows, getFlowsForUser, getRecommendedFlow } from './flows'
export { createOnboardingAnalytics, analyticsIntegrations } from './analytics'