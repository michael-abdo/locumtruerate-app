import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { TourHighlight, GuidedTourStep } from './types'
import { useOnboarding } from './onboarding-context'

interface TourOverlayProps {
  highlight: TourHighlight
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  onClose?: () => void
  showNavigation?: boolean
  currentStep?: number
  totalSteps?: number
}

function TourOverlay({
  highlight,
  onNext,
  onPrevious,
  onSkip,
  onClose,
  showNavigation = true,
  currentStep = 1,
  totalSteps = 1,
}: TourOverlayProps) {
  const [targetElement, setTargetElement] = useState<Element | null>(null)
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = document.querySelector(highlight.element)
    if (element) {
      setTargetElement(element)
      updatePositions(element)
    }
  }, [highlight.element])

  const updatePositions = useCallback((element: Element) => {
    const rect = element.getBoundingClientRect()
    const padding = highlight.highlightPadding || 8
    
    setOverlayPosition({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    })

    // Calculate tooltip position
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      let tooltipTop = rect.top
      let tooltipLeft = rect.left

      switch (highlight.position) {
        case 'top':
          tooltipTop = rect.top - tooltipRect.height - 16
          tooltipLeft = rect.left + (rect.width - tooltipRect.width) / 2
          break
        case 'bottom':
          tooltipTop = rect.bottom + 16
          tooltipLeft = rect.left + (rect.width - tooltipRect.width) / 2
          break
        case 'left':
          tooltipTop = rect.top + (rect.height - tooltipRect.height) / 2
          tooltipLeft = rect.left - tooltipRect.width - 16
          break
        case 'right':
          tooltipTop = rect.top + (rect.height - tooltipRect.height) / 2
          tooltipLeft = rect.right + 16
          break
      }

      // Keep tooltip within viewport
      tooltipTop = Math.max(16, Math.min(window.innerHeight - tooltipRect.height - 16, tooltipTop))
      tooltipLeft = Math.max(16, Math.min(window.innerWidth - tooltipRect.width - 16, tooltipLeft))

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft })
    }
  }, [highlight])

  useEffect(() => {
    const handleResize = () => {
      if (targetElement) {
        updatePositions(targetElement)
      }
    }

    const handleScroll = () => {
      if (targetElement) {
        updatePositions(targetElement)
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [targetElement, updatePositions])

  if (!targetElement) return null

  return createPortal(
    <>
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        style={{ pointerEvents: highlight.disableInteraction ? 'auto' : 'none' }}
        onClick={onClose}
      />
      
      {/* Highlight cutout */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          top: overlayPosition.top,
          left: overlayPosition.left,
          width: overlayPosition.width,
          height: overlayPosition.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
        }}
      />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white rounded-lg shadow-xl border max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {highlight.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {highlight.description}
            </p>
            {highlight.customContent && (
              <div className="mt-4">
                {highlight.customContent}
              </div>
            )}
          </div>
          
          {/* Navigation */}
          {showNavigation && (
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {onPrevious && (
                  <button
                    onClick={onPrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Previous
                  </button>
                )}
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Skip
                  </button>
                )}
              </div>
              
              {onNext && (
                <button
                  onClick={onNext}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {currentStep === totalSteps ? 'Finish' : 'Next'}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Arrow pointer */}
        {highlight.showArrow !== false && (
          <div
            className={`absolute w-0 h-0 ${
              highlight.position === 'top' ? 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white' :
              highlight.position === 'bottom' ? 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white' :
              highlight.position === 'left' ? 'right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white' :
              'left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white'
            }`}
          />
        )}
      </div>
    </>,
    document.body
  )
}

interface GuidedTourProps {
  step: GuidedTourStep
  isActive: boolean
  onStepComplete?: () => void
  onStepSkip?: () => void
  onTourExit?: () => void
}

export function GuidedTour({ step, isActive, onStepComplete, onStepSkip, onTourExit }: GuidedTourProps) {
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0)
  const [isExecutingActions, setIsExecutingActions] = useState(false)
  const { state, canGoNext, canGoBack, nextStep, previousStep } = useOnboarding()
  
  const currentHighlight = step.highlights[currentHighlightIndex]
  const progress = state.progress
  
  useEffect(() => {
    if (!isActive) {
      setCurrentHighlightIndex(0)
      return
    }
    
    // Execute step entry actions
    if (step.onEnter) {
      step.onEnter()
    }
    
    // Wait for elements if specified
    if (step.waitForElement) {
      const checkElement = () => {
        const element = document.querySelector(step.waitForElement!)
        if (!element) {
          setTimeout(checkElement, 100)
        }
      }
      checkElement()
    }
    
    return () => {
      if (step.onExit) {
        step.onExit()
      }
    }
  }, [isActive, step])
  
  useEffect(() => {
    if (!isActive || !step.actions || isExecutingActions) return
    
    // Execute automated actions for the current highlight
    const executeActions = async () => {
      setIsExecutingActions(true)
      
      for (const action of step.actions!) {
        switch (action.type) {
          case 'click':
            if (action.target) {
              const element = document.querySelector(action.target) as HTMLElement
              if (element) {
                element.click()
              }
            }
            break
            
          case 'input':
            if (action.target && action.value) {
              const element = document.querySelector(action.target) as HTMLInputElement
              if (element) {
                element.value = action.value
                element.dispatchEvent(new Event('input', { bubbles: true }))
                element.dispatchEvent(new Event('change', { bubbles: true }))
              }
            }
            break
            
          case 'scroll':
            if (action.target) {
              const element = document.querySelector(action.target)
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }
            break
            
          case 'wait':
            await new Promise(resolve => setTimeout(resolve, action.delay || 1000))
            break
        }
        
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay))
        }
      }
      
      setIsExecutingActions(false)
    }
    
    if (!step.interactive) {
      executeActions()
    }
  }, [currentHighlightIndex, isActive, step, isExecutingActions])
  
  const handleNext = () => {
    if (currentHighlightIndex < step.highlights.length - 1) {
      setCurrentHighlightIndex(prev => prev + 1)
    } else {
      onStepComplete?.()
    }
  }
  
  const handlePrevious = () => {
    if (currentHighlightIndex > 0) {
      setCurrentHighlightIndex(prev => prev - 1)
    } else if (canGoBack()) {
      previousStep()
    }
  }
  
  const handleSkip = () => {
    onStepSkip?.()
  }
  
  const handleClose = () => {
    onTourExit?.()
  }
  
  if (!isActive || !currentHighlight) return null
  
  return (
    <TourOverlay
      highlight={currentHighlight}
      onNext={handleNext}
      onPrevious={currentHighlightIndex > 0 || canGoBack() ? handlePrevious : undefined}
      onSkip={handleSkip}
      onClose={handleClose}
      currentStep={currentHighlightIndex + 1}
      totalSteps={step.highlights.length}
    />
  )
}

// Hook for managing guided tours
export function useGuidedTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState<GuidedTourStep | null>(null)
  
  const startTour = (step: GuidedTourStep) => {
    setCurrentStep(step)
    setIsActive(true)
  }
  
  const endTour = () => {
    setIsActive(false)
    setCurrentStep(null)
  }
  
  const pauseTour = () => {
    setIsActive(false)
  }
  
  const resumeTour = () => {
    if (currentStep) {
      setIsActive(true)
    }
  }
  
  return {
    isActive,
    currentStep,
    startTour,
    endTour,
    pauseTour,
    resumeTour,
  }
}

// Helper function to create tour highlights from DOM elements
export function createHighlightFromElement(
  selector: string,
  title: string,
  description: string,
  position: TourHighlight['position'] = 'bottom'
): TourHighlight {
  return {
    element: selector,
    title,
    description,
    position,
    showArrow: true,
    highlightPadding: 8,
    disableInteraction: false,
  }
}

// Utility to auto-generate tour from data attributes
export function generateTourFromDataAttributes(): TourHighlight[] {
  const elements = document.querySelectorAll('[data-tour-title]')
  const highlights: TourHighlight[] = []
  
  elements.forEach((element, index) => {
    const title = element.getAttribute('data-tour-title') || `Step ${index + 1}`
    const description = element.getAttribute('data-tour-description') || ''
    const position = (element.getAttribute('data-tour-position') as TourHighlight['position']) || 'bottom'
    
    // Create a unique selector for this element
    const tagName = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const className = element.className ? `.${element.className.split(' ').join('.')}` : ''
    const selector = `${tagName}${id}${className}`
    
    highlights.push({
      element: selector,
      title,
      description,
      position,
      showArrow: true,
    })
  })
  
  return highlights
}