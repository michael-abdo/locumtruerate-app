import React from 'react'
import { OnboardingFlow, OnboardingStep } from './types'
import { CalculatorIntro } from './steps/calculator-intro'
import { ProfileSetup } from './steps/profile-setup'
import { FirstCalculation } from './steps/first-calculation'
import { ExploreFeatures } from './steps/explore-features'
import { SearchTutorial } from './steps/search-tutorial'
import { ComparisonTutorial } from './steps/comparison-tutorial'
import { HistoryTutorial } from './steps/history-tutorial'
import { AdminDashboard } from './steps/admin-dashboard'

// Initial onboarding flow for new users
const initialOnboardingFlow: OnboardingFlow = {
  id: 'initial-onboarding',
  name: 'Welcome to LocumTrueRate',
  description: 'Get started with calculating your true compensation and finding the best opportunities',
  targetUser: 'all',
  category: 'initial',
  estimatedMinutes: 8,
  outcomes: [
    'Understand how to use the salary calculator',
    'Set up your professional profile',
    'Perform your first calculation',
    'Know where to find key features',
  ],
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to LocumTrueRate! 👋',
      description: 'Your comprehensive platform for locum tenens financial planning',
      content: (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Calculate Your True Compensation
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
            LocumTrueRate helps healthcare professionals understand their real earnings 
            after taxes, expenses, and benefits across different opportunities.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              📱 <strong>Mobile-First:</strong> Use on any device, anywhere
            </p>
          </div>
        </div>
      ),
      showSkip: false,
      showBack: false,
      showNext: true,
    },
    {
      id: 'profile-setup',
      title: 'Set Up Your Profile',
      description: 'Tell us about your specialty and preferences for personalized calculations',
      component: ProfileSetup,
      target: '[data-onboarding="profile-form"]',
      position: 'center',
      showSkip: true,
      showBack: true,
      showNext: true,
      validation: async () => {
        // Check if minimum profile info is filled
        const specialty = document.querySelector('[data-field="specialty"]') as HTMLInputElement
        return specialty?.value?.length > 0
      },
    },
    {
      id: 'calculator-intro',
      title: 'Meet Your Calculator',
      description: 'Learn how to calculate contract values and paycheck estimates',
      component: CalculatorIntro,
      target: '[data-onboarding="calculator-section"]',
      position: 'right',
      showSkip: true,
      showBack: true,
      showNext: true,
    },
    {
      id: 'first-calculation',
      title: 'Your First Calculation',
      description: 'Let\'s calculate a sample contract together',
      component: FirstCalculation,
      target: '[data-onboarding="calculator-form"]',
      position: 'left',
      showSkip: false,
      showBack: true,
      showNext: true,
      validation: async () => {
        // Check if calculation was performed
        const results = document.querySelector('[data-onboarding="calculation-results"]')
        return results !== null
      },
    },
    {
      id: 'explore-features',
      title: 'Explore Key Features',
      description: 'Discover export, history, and comparison tools',
      component: ExploreFeatures,
      target: '[data-onboarding="feature-nav"]',
      position: 'bottom',
      showSkip: true,
      showBack: true,
      showNext: true,
    },
    {
      id: 'completion',
      title: 'You\'re All Set! 🎉',
      description: 'Start exploring opportunities and calculating your true rate',
      content: (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Find Your Perfect Opportunity!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            You now know how to use LocumTrueRate to make informed financial decisions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Completed</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>Profile setup</li>
                <li>First calculation</li>
                <li>Feature overview</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🚀 Next Steps</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>Browse job listings</li>
                <li>Compare opportunities</li>
                <li>Save calculations</li>
              </ul>
            </div>
          </div>
        </div>
      ),
      showSkip: false,
      showBack: true,
      showNext: false,
      onComplete: async () => {
        // Mark initial onboarding as complete
        if (typeof window !== 'undefined') {
          localStorage.setItem('locumtruerate_initial_onboarding_complete', 'true')
        }
      },
    },
  ],
}

// Physician-specific advanced flow
const physicianAdvancedFlow: OnboardingFlow = {
  id: 'physician-advanced',
  name: 'Advanced Features for Physicians',
  description: 'Master contract analysis, tax optimization, and financial planning',
  targetUser: 'physician',
  category: 'advanced',
  estimatedMinutes: 12,
  prerequisites: ['initial-onboarding'],
  outcomes: [
    'Compare multiple contract opportunities',
    'Understand tax implications by state',
    'Use advanced calculation features',
    'Set up automated tracking',
  ],
  steps: [
    {
      id: 'contract-comparison',
      title: 'Compare Multiple Contracts',
      description: 'Learn to evaluate opportunities side-by-side',
      component: ComparisonTutorial,
      target: '[data-onboarding="comparison-tool"]',
      position: 'center',
      showSkip: true,
      showBack: false,
      showNext: true,
    },
    {
      id: 'tax-optimization',
      title: 'Tax Strategy Insights',
      description: 'Understand how location affects your take-home pay',
      content: (
        <div className="py-6">
          <h3 className="text-lg font-semibold mb-4">State Tax Impact Examples</h3>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800">No State Tax States</h4>
              <p className="text-sm text-green-700">TX, FL, WA, NV - Keep more of your earnings</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800">High Tax States</h4>
              <p className="text-sm text-red-700">CA, NY, NJ - Factor in state taxes</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Pro Tip</h4>
              <p className="text-sm text-blue-700">
                A $50/hour difference might not matter if tax savings are significant
              </p>
            </div>
          </div>
        </div>
      ),
      target: '[data-onboarding="tax-breakdown"]',
      position: 'right',
      showSkip: true,
      showBack: true,
      showNext: true,
    },
    {
      id: 'history-tracking',
      title: 'Track Your History',
      description: 'Save and organize your calculations',
      component: HistoryTutorial,
      target: '[data-onboarding="history-panel"]',
      position: 'left',
      showSkip: true,
      showBack: true,
      showNext: true,
    },
    {
      id: 'export-reports',
      title: 'Export and Share',
      description: 'Generate professional reports for tax planning',
      content: (
        <div className="py-6">
          <h3 className="text-lg font-semibold mb-4">Export Options</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-2xl mb-2">📄</div>
              <h4 className="font-medium">PDF Reports</h4>
              <p className="text-sm text-gray-600">Professional summaries</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-medium">Excel Data</h4>
              <p className="text-sm text-gray-600">Detailed analysis</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl mb-2">📈</div>
              <h4 className="font-medium">CSV Files</h4>
              <p className="text-sm text-gray-600">Raw data export</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl mb-2">🔗</div>
              <h4 className="font-medium">Share Links</h4>
              <p className="text-sm text-gray-600">Collaborate easily</p>
            </div>
          </div>
        </div>
      ),
      target: '[data-onboarding="export-buttons"]',
      position: 'top',
      showSkip: true,
      showBack: true,
      showNext: true,
    },
  ],
}

// Nursing-specific flow
const nursingFlow: OnboardingFlow = {
  id: 'nursing-onboarding',
  name: 'Nursing Compensation Calculator',
  description: 'Specialized tools for nursing professionals including travel nursing',
  targetUser: 'nurse',
  category: 'initial',
  estimatedMinutes: 6,
  outcomes: [
    'Calculate travel nursing packages',
    'Understand stipend taxation',
    'Compare staff vs travel positions',
    'Factor in housing and benefits',
  ],
  steps: [
    {
      id: 'nursing-intro',
      title: 'Welcome, Healthcare Hero! 👩‍⚕️',
      description: 'Specialized tools for nursing compensation',
      content: (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🩺</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Nursing Compensation Made Clear
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
            Calculate your true earnings including stipends, overtime, and shift differentials.
          </p>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-800">
              🏥 <strong>Travel Nursing Ready:</strong> Compare packages accurately
            </p>
          </div>
        </div>
      ),
      showSkip: false,
      showBack: false,
      showNext: true,
    },
    {
      id: 'travel-nursing',
      title: 'Travel Nursing Calculations',
      description: 'Learn to evaluate travel nursing packages',
      content: (
        <div className="py-6">
          <h3 className="text-lg font-semibold mb-4">Travel Package Components</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <span className="text-2xl">💵</span>
              <div>
                <h4 className="font-medium">Hourly Rate</h4>
                <p className="text-sm text-gray-600">Taxable base pay</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
              <span className="text-2xl">🏠</span>
              <div>
                <h4 className="font-medium">Housing Stipend</h4>
                <p className="text-sm text-gray-600">Often tax-free if qualified</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
              <span className="text-2xl">✈️</span>
              <div>
                <h4 className="font-medium">Travel Reimbursement</h4>
                <p className="text-sm text-gray-600">Mileage and airfare</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded">
              <span className="text-2xl">🍽️</span>
              <div>
                <h4 className="font-medium">Meal Allowance</h4>
                <p className="text-sm text-gray-600">Per diem for meals</p>
              </div>
            </div>
          </div>
        </div>
      ),
      target: '[data-onboarding="nursing-calculator"]',
      position: 'center',
      showSkip: true,
      showBack: true,
      showNext: true,
    },
    {
      id: 'shift-differentials',
      title: 'Shift Differentials & Overtime',
      description: 'Factor in premium pay for nights, weekends, and overtime',
      content: (
        <div className="py-6">
          <h3 className="text-lg font-semibold mb-4">Premium Pay Calculator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">🌙 Night Differential</h4>
              <p className="text-sm text-gray-600 mb-2">Typically $3-8/hour extra</p>
              <div className="text-xs text-gray-500">Usually 7 PM - 7 AM</div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">📅 Weekend Premium</h4>
              <p className="text-sm text-gray-600 mb-2">Often $5-15/hour extra</p>
              <div className="text-xs text-gray-500">Saturday & Sunday</div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">⏰ Overtime</h4>
              <p className="text-sm text-gray-600 mb-2">1.5x after 40 hours</p>
              <div className="text-xs text-gray-500">Or 1.5x after 8 hours/day</div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">🎄 Holiday Pay</h4>
              <p className="text-sm text-gray-600 mb-2">Often 2x-2.5x rate</p>
              <div className="text-xs text-gray-500">Major holidays</div>
            </div>
          </div>
        </div>
      ),
      target: '[data-onboarding="shift-calculator"]',
      position: 'right',
      showSkip: true,
      showBack: true,
      showNext: true,
    },
  ],
}

// Admin dashboard onboarding
const adminFlow: OnboardingFlow = {
  id: 'admin-onboarding',
  name: 'Admin Dashboard Overview',
  description: 'Learn to manage users, content, and system settings',
  targetUser: 'admin',
  category: 'initial',
  estimatedMinutes: 10,
  outcomes: [
    'Navigate the admin dashboard',
    'Manage user accounts',
    'Monitor system metrics',
    'Configure platform settings',
  ],
  steps: [
    {
      id: 'admin-welcome',
      title: 'Admin Dashboard',
      description: 'Welcome to the LocumTrueRate admin panel',
      component: AdminDashboard,
      target: '[data-onboarding="admin-nav"]',
      position: 'center',
      showSkip: false,
      showBack: false,
      showNext: true,
    },
  ],
}

// Job search tutorial
const jobSearchFlow: OnboardingFlow = {
  id: 'job-search-tutorial',
  name: 'Master Job Search',
  description: 'Learn to find and evaluate opportunities effectively',
  targetUser: 'all',
  category: 'feature',
  estimatedMinutes: 5,
  outcomes: [
    'Use advanced search filters',
    'Save and track opportunities',
    'Set up job alerts',
    'Apply efficiently',
  ],
  steps: [
    {
      id: 'search-basics',
      title: 'Smart Job Search',
      description: 'Find opportunities that match your criteria',
      component: SearchTutorial,
      target: '[data-onboarding="search-form"]',
      position: 'top',
      showSkip: true,
      showBack: false,
      showNext: true,
    },
  ],
}

export const defaultOnboardingFlows: OnboardingFlow[] = [
  initialOnboardingFlow,
  physicianAdvancedFlow,
  nursingFlow,
  adminFlow,
  jobSearchFlow,
]

// Helper functions for flow management
export function getFlowsForUser(userType: 'physician' | 'nurse' | 'admin' | 'all'): OnboardingFlow[] {
  return defaultOnboardingFlows.filter(
    flow => flow.targetUser === userType || flow.targetUser === 'all'
  )
}

export function getFlowById(id: string): OnboardingFlow | undefined {
  return defaultOnboardingFlows.find(flow => flow.id === id)
}

export function getRecommendedFlow(userType: 'physician' | 'nurse' | 'admin' | 'all', completedFlows: string[] = []): OnboardingFlow | undefined {
  const availableFlows = getFlowsForUser(userType).filter(
    flow => !completedFlows.includes(flow.id)
  )
  
  // Check prerequisites
  const eligibleFlows = availableFlows.filter(flow => {
    if (!flow.prerequisites) return true
    return flow.prerequisites.every(prereq => completedFlows.includes(prereq))
  })
  
  // Return initial flow first, then others by category
  const initialFlow = eligibleFlows.find(flow => flow.category === 'initial')
  if (initialFlow) return initialFlow
  
  const featureFlow = eligibleFlows.find(flow => flow.category === 'feature')
  if (featureFlow) return featureFlow
  
  return eligibleFlows[0]
}