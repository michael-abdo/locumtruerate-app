import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { OnboardingState, OnboardingAction, OnboardingFlow, OnboardingProgress, OnboardingAnalytics } from './types'
import { defaultOnboardingFlows } from './flows'
import { createOnboardingAnalytics } from './analytics'

const initialState: OnboardingState = {
  isActive: false,
  currentFlow: undefined,
  progress: undefined,
  availableFlows: defaultOnboardingFlows,
  userPreferences: {
    showTooltips: true,
    autoPlayTours: false,
    tourSpeed: 'medium',
    showHints: true,
    skipCompleted: true,
  },
}

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'START_FLOW': {
      const flow = action.payload.flow as OnboardingFlow
      const userId = action.payload.userId as string | undefined
      
      const progress: OnboardingProgress = {
        flowId: flow.id,
        userId,
        currentStepIndex: 0,
        completedSteps: [],
        skippedSteps: [],
        startedAt: new Date(),
        lastActiveAt: new Date(),
        metadata: {},
      }
      
      return {
        ...state,
        isActive: true,
        currentFlow: flow,
        progress,
      }
    }
    
    case 'NEXT_STEP': {
      if (!state.currentFlow || !state.progress) return state
      
      const nextIndex = state.progress.currentStepIndex + 1
      const currentStep = state.currentFlow.steps[state.progress.currentStepIndex]
      
      if (nextIndex >= state.currentFlow.steps.length) {
        // Flow completed
        return {
          ...state,
          isActive: false,
          progress: {
            ...state.progress,
            currentStepIndex: nextIndex,
            completedSteps: [...state.progress.completedSteps, currentStep.id],
            completedAt: new Date(),
            lastActiveAt: new Date(),
          },
        }
      }
      
      return {
        ...state,
        progress: {
          ...state.progress,
          currentStepIndex: nextIndex,
          completedSteps: [...state.progress.completedSteps, currentStep.id],
          lastActiveAt: new Date(),
        },
      }
    }
    
    case 'PREVIOUS_STEP': {
      if (!state.currentFlow || !state.progress) return state
      
      const prevIndex = Math.max(0, state.progress.currentStepIndex - 1)
      const currentStep = state.currentFlow.steps[state.progress.currentStepIndex]
      
      return {
        ...state,
        progress: {
          ...state.progress,
          currentStepIndex: prevIndex,
          completedSteps: state.progress.completedSteps.filter(id => id !== currentStep.id),
          lastActiveAt: new Date(),
        },
      }
    }
    
    case 'SKIP_STEP': {
      if (!state.currentFlow || !state.progress) return state
      
      const currentStep = state.currentFlow.steps[state.progress.currentStepIndex]
      const nextIndex = state.progress.currentStepIndex + 1
      
      if (nextIndex >= state.currentFlow.steps.length) {
        // Flow completed
        return {
          ...state,
          isActive: false,
          progress: {
            ...state.progress,
            currentStepIndex: nextIndex,
            skippedSteps: [...state.progress.skippedSteps, currentStep.id],
            completedAt: new Date(),
            lastActiveAt: new Date(),
          },
        }
      }
      
      return {
        ...state,
        progress: {
          ...state.progress,
          currentStepIndex: nextIndex,
          skippedSteps: [...state.progress.skippedSteps, currentStep.id],
          lastActiveAt: new Date(),
        },
      }
    }
    
    case 'COMPLETE_FLOW': {
      if (!state.progress) return state
      
      return {
        ...state,
        isActive: false,
        progress: {
          ...state.progress,
          completedAt: new Date(),
          lastActiveAt: new Date(),
        },
      }
    }
    
    case 'EXIT_FLOW': {
      return {
        ...state,
        isActive: false,
        currentFlow: undefined,
        progress: undefined,
      }
    }
    
    case 'UPDATE_PREFERENCES': {
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload,
        },
      }
    }
    
    default:
      return state
  }
}

interface OnboardingContextValue {
  state: OnboardingState
  startFlow: (flow: OnboardingFlow, userId?: string) => void
  nextStep: () => void
  previousStep: () => void
  skipStep: (reason?: string) => void
  completeFlow: () => void
  exitFlow: () => void
  updatePreferences: (preferences: Partial<OnboardingState['userPreferences']>) => void
  analytics: OnboardingAnalytics
  getCurrentStep: () => import('./types').OnboardingStep | undefined
  getProgress: () => { current: number; total: number; percentage: number }
  canGoNext: () => boolean
  canGoBack: () => boolean
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

export interface OnboardingProviderProps {
  children: ReactNode
  userId?: string
  analytics?: OnboardingAnalytics
  persistProgress?: boolean
  storageKey?: string
}

export function OnboardingProvider({
  children,
  userId,
  analytics,
  persistProgress = true,
  storageKey = 'locumtruerate_onboarding',
}: OnboardingProviderProps) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState)
  const analyticsInstance = analytics || createOnboardingAnalytics()

  // Load persisted progress on mount
  useEffect(() => {
    if (persistProgress && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const savedState = JSON.parse(saved)
          if (savedState.progress) {
            savedState.progress.startedAt = new Date(savedState.progress.startedAt)
            savedState.progress.lastActiveAt = new Date(savedState.progress.lastActiveAt)
            if (savedState.progress.completedAt) {
              savedState.progress.completedAt = new Date(savedState.progress.completedAt)
            }
          }
          
          // Restore state if user hasn't completed the flow
          if (savedState.isActive && savedState.currentFlow && savedState.progress) {
            dispatch({
              type: 'START_FLOW',
              payload: {
                flow: savedState.currentFlow,
                userId: savedState.progress.userId,
              },
            })
            
            // Restore progress
            dispatch({
              type: 'UPDATE_PREFERENCES',
              payload: savedState.userPreferences,
            })
          }
        }
      } catch (error) {
        console.warn('Failed to load onboarding progress:', error)
      }
    }
  }, [persistProgress, storageKey])

  // Persist progress on state changes
  useEffect(() => {
    if (persistProgress && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state))
      } catch (error) {
        console.warn('Failed to save onboarding progress:', error)
      }
    }
  }, [state, persistProgress, storageKey])

  const startFlow = (flow: OnboardingFlow, flowUserId?: string) => {
    const effectiveUserId = flowUserId || userId
    analyticsInstance.flowStarted(flow.id, effectiveUserId)
    
    dispatch({
      type: 'START_FLOW',
      payload: { flow, userId: effectiveUserId },
    })
  }

  const nextStep = async () => {
    if (!state.currentFlow || !state.progress) return
    
    const currentStep = state.currentFlow.steps[state.progress.currentStepIndex]
    const stepStartTime = Date.now()
    
    try {
      // Validate step if validation function exists
      if (currentStep.validation) {
        const isValid = await currentStep.validation()
        if (!isValid) {
          return // Don't proceed if validation fails
        }
      }
      
      // Call onComplete if it exists
      if (currentStep.onComplete) {
        await currentStep.onComplete()
      }
      
      const timeSpent = Date.now() - stepStartTime
      analyticsInstance.stepCompleted(
        state.currentFlow.id,
        currentStep.id,
        timeSpent,
        state.progress.userId
      )
      
      dispatch({ type: 'NEXT_STEP' })
      
      // Check if flow is complete
      if (state.progress.currentStepIndex + 1 >= state.currentFlow.steps.length) {
        const totalTime = Date.now() - state.progress.startedAt.getTime()
        const completionRate = (state.progress.completedSteps.length + 1) / state.currentFlow.steps.length
        
        analyticsInstance.flowCompleted(
          state.currentFlow.id,
          totalTime,
          completionRate,
          state.progress.userId
        )
      }
      
    } catch (error) {
      analyticsInstance.errorOccurred(
        state.currentFlow.id,
        currentStep.id,
        error instanceof Error ? error.message : 'Unknown error',
        state.progress.userId
      )
    }
  }

  const previousStep = () => {
    dispatch({ type: 'PREVIOUS_STEP' })
  }

  const skipStep = (reason?: string) => {
    if (!state.currentFlow || !state.progress) return
    
    const currentStep = state.currentFlow.steps[state.progress.currentStepIndex]
    
    analyticsInstance.stepSkipped(
      state.currentFlow.id,
      currentStep.id,
      reason,
      state.progress.userId
    )
    
    dispatch({ type: 'SKIP_STEP' })
  }

  const completeFlow = () => {
    if (!state.currentFlow || !state.progress) return
    
    const totalTime = Date.now() - state.progress.startedAt.getTime()
    const completionRate = state.progress.completedSteps.length / state.currentFlow.steps.length
    
    analyticsInstance.flowCompleted(
      state.currentFlow.id,
      totalTime,
      completionRate,
      state.progress.userId
    )
    
    dispatch({ type: 'COMPLETE_FLOW' })
  }

  const exitFlow = () => {
    if (!state.currentFlow || !state.progress) return
    
    const lastStep = state.currentFlow.steps[state.progress.currentStepIndex]
    
    analyticsInstance.flowAbandoned(
      state.currentFlow.id,
      lastStep.id,
      'User exited',
      state.progress.userId
    )
    
    dispatch({ type: 'EXIT_FLOW' })
  }

  const updatePreferences = (preferences: Partial<OnboardingState['userPreferences']>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences })
  }

  const getCurrentStep = () => {
    if (!state.currentFlow || !state.progress) return undefined
    return state.currentFlow.steps[state.progress.currentStepIndex]
  }

  const getProgress = () => {
    if (!state.currentFlow || !state.progress) {
      return { current: 0, total: 0, percentage: 0 }
    }
    
    const current = state.progress.currentStepIndex + 1
    const total = state.currentFlow.steps.length
    const percentage = (current / total) * 100
    
    return { current, total, percentage }
  }

  const canGoNext = () => {
    if (!state.currentFlow || !state.progress) return false
    return state.progress.currentStepIndex < state.currentFlow.steps.length - 1
  }

  const canGoBack = () => {
    if (!state.progress) return false
    return state.progress.currentStepIndex > 0
  }

  const value: OnboardingContextValue = {
    state,
    startFlow,
    nextStep,
    previousStep,
    skipStep,
    completeFlow,
    exitFlow,
    updatePreferences,
    analytics: analyticsInstance,
    getCurrentStep,
    getProgress,
    canGoNext,
    canGoBack,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}