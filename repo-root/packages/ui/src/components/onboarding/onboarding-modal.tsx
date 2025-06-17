import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOnboarding } from './onboarding-context'
import { OnboardingStep } from './types'
import { GuidedTour } from './guided-tour'

interface OnboardingModalProps {
  className?: string
}

export function OnboardingModal({ className }: OnboardingModalProps) {
  const {
    state,
    getCurrentStep,
    getProgress,
    nextStep,
    previousStep,
    skipStep,
    exitFlow,
    canGoNext,
    canGoBack,
  } = useOnboarding()
  
  const [mounted, setMounted] = useState(false)
  const currentStep = getCurrentStep()
  const progress = getProgress()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted || !state.isActive || !currentStep) {
    return null
  }
  
  // If step has guided tour highlights, use GuidedTour component
  const guidedStep = currentStep as any
  if (guidedStep.highlights && guidedStep.highlights.length > 0) {
    return (
      <GuidedTour
        step={guidedStep}
        isActive={true}
        onStepComplete={nextStep}
        onStepSkip={() => skipStep('user_skipped_guided_step')}
        onTourExit={() => exitFlow()}
      />
    )
  }
  
  // Regular modal for non-guided steps
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={() => exitFlow()}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm font-bold">
                {progress.current}
              </div>
              <div>
                <h2 className="text-xl font-bold">{currentStep.title}</h2>
                <p className="text-blue-100 text-sm">{currentStep.description}</p>
              </div>
            </div>
            <button
              onClick={() => exitFlow()}
              className="text-white hover:text-blue-100 transition-colors p-1"
              aria-label="Close onboarding"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-blue-100 mt-1">
            <span>Step {progress.current} of {progress.total}</span>
            <span>{Math.round(progress.percentage)}% Complete</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {currentStep.component ? (
            <currentStep.component />
          ) : (
            currentStep.content
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div className="flex items-center gap-3">
            {canGoBack() && currentStep.showBack !== false && (
              <button
                onClick={previousStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </button>
            )}
            
            {currentStep.showSkip !== false && (
              <button
                onClick={() => skipStep('user_skipped')}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {state.currentFlow && (
              <div className="text-xs text-gray-500">
                Estimated time: {state.currentFlow.estimatedMinutes} min
              </div>
            )}
            
            {currentStep.showNext !== false && (
              <button
                onClick={nextStep}
                disabled={currentStep.validation ? false : false} // Will be handled by validation
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {progress.current === progress.total ? 'Complete' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Compact floating widget for minimal onboarding
export function OnboardingWidget() {
  const { state, getCurrentStep, exitFlow } = useOnboarding()
  const [isMinimized, setIsMinimized] = useState(false)
  
  const currentStep = getCurrentStep()
  
  if (!state.isActive || !currentStep) {
    return null
  }
  
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{currentStep.title}</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => exitFlow()}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">{currentStep.description}</p>
          
          {currentStep.component ? (
            <currentStep.component />
          ) : (
            <div className="text-sm">{currentStep.content}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// Tooltip-style onboarding for subtle guidance
export function OnboardingTooltip() {
  const { state, getCurrentStep } = useOnboarding()
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isVisible, setIsVisible] = useState(false)
  
  const currentStep = getCurrentStep()
  
  useEffect(() => {
    if (!state.isActive || !currentStep || !currentStep.target) {
      setIsVisible(false)
      return
    }
    
    const targetElement = document.querySelector(currentStep.target)
    if (!targetElement) {
      setIsVisible(false)
      return
    }
    
    const rect = targetElement.getBoundingClientRect()
    const position = currentStep.position || 'bottom'
    
    let top = rect.top
    let left = rect.left
    
    switch (position) {
      case 'top':
        top = rect.top - 60
        left = rect.left + rect.width / 2
        break
      case 'bottom':
        top = rect.bottom + 10
        left = rect.left + rect.width / 2
        break
      case 'left':
        top = rect.top + rect.height / 2
        left = rect.left - 300
        break
      case 'right':
        top = rect.top + rect.height / 2
        left = rect.right + 10
        break
      case 'center':
        top = window.innerHeight / 2
        left = window.innerWidth / 2
        break
    }
    
    setTooltipPosition({ top, left })
    setIsVisible(true)
  }, [state.isActive, currentStep])
  
  if (!isVisible || !currentStep) {
    return null
  }
  
  return createPortal(
    <div
      className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg max-w-xs pointer-events-none"
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="font-medium mb-1">{currentStep.title}</div>
      <div className="text-gray-300">{currentStep.description}</div>
    </div>,
    document.body
  )
}