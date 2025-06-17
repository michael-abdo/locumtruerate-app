export interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
  component?: React.ComponentType<any>
  target?: string // CSS selector for guided tour
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  showSkip?: boolean
  showBack?: boolean
  showNext?: boolean
  validation?: () => boolean | Promise<boolean>
  onEnter?: () => void | Promise<void>
  onExit?: () => void | Promise<void>
  onComplete?: () => void | Promise<void>
  metadata?: Record<string, any>
}

export interface OnboardingFlow {
  id: string
  name: string
  description: string
  steps: OnboardingStep[]
  targetUser: 'physician' | 'nurse' | 'admin' | 'all'
  category: 'initial' | 'feature' | 'advanced' | 'troubleshooting'
  estimatedMinutes: number
  prerequisites?: string[]
  outcomes: string[]
}

export interface OnboardingProgress {
  flowId: string
  userId?: string
  currentStepIndex: number
  completedSteps: string[]
  skippedSteps: string[]
  startedAt: Date
  lastActiveAt: Date
  completedAt?: Date
  metadata?: Record<string, any>
}

export interface OnboardingState {
  isActive: boolean
  currentFlow?: OnboardingFlow
  progress?: OnboardingProgress
  availableFlows: OnboardingFlow[]
  userPreferences: {
    showTooltips: boolean
    autoPlayTours: boolean
    tourSpeed: 'slow' | 'medium' | 'fast'
    showHints: boolean
    skipCompleted: boolean
  }
}

export interface OnboardingAction {
  type: 'START_FLOW' | 'NEXT_STEP' | 'PREVIOUS_STEP' | 'SKIP_STEP' | 'COMPLETE_FLOW' | 'EXIT_FLOW' | 'UPDATE_PREFERENCES'
  payload?: any
}

export interface TourHighlight {
  element: string // CSS selector
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right'
  showArrow?: boolean
  highlightPadding?: number
  disableInteraction?: boolean
  customContent?: React.ReactNode
}

export interface GuidedTourStep extends OnboardingStep {
  highlights: TourHighlight[]
  actions?: Array<{
    type: 'click' | 'input' | 'scroll' | 'wait'
    target?: string
    value?: string
    delay?: number
  }>
  interactive?: boolean
  waitForElement?: string
  screenshot?: boolean
}

export interface OnboardingAnalytics {
  flowStarted: (flowId: string, userId?: string) => void
  stepCompleted: (flowId: string, stepId: string, timeSpent: number, userId?: string) => void
  stepSkipped: (flowId: string, stepId: string, reason?: string, userId?: string) => void
  flowCompleted: (flowId: string, totalTime: number, completionRate: number, userId?: string) => void
  flowAbandoned: (flowId: string, lastStepId: string, reason?: string, userId?: string) => void
  errorOccurred: (flowId: string, stepId: string, error: string, userId?: string) => void
}