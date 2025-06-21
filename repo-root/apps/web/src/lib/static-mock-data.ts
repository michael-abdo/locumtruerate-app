/**
 * Static Mock Data Provider for Cloudflare Pages Deployment
 * 
 * This file provides mock data to replace server-side API calls
 * when deploying as a static site to Cloudflare Pages.
 */

import type { Job, User, CalculationResult, Lead } from '@locumtruerate/types'

// Mock Jobs Data
export const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Emergency Medicine Physician',
    location: 'Los Angeles, CA',
    specialty: 'Emergency Medicine',
    type: 'locum_tenens',
    payRate: 250,
    payPeriod: 'hourly' as const,
    benefits: ['Health Insurance', 'Travel Allowance', 'Housing'],
    requirements: ['Board Certified', 'DEA License', 'State License'],
    description: 'Seeking an experienced Emergency Medicine physician for a 3-month locum tenens assignment at a busy Level II trauma center.',
    recruiterName: 'Sarah Johnson',
    recruiterEmail: 'sarah@healthstaffing.com',
    recruiterPhone: '555-0123',
    companyName: 'HealthStaffing Solutions',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-05-01'),
    isActive: true,
    featured: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'job-2',
    title: 'Family Medicine Physician',
    location: 'Austin, TX',
    specialty: 'Family Medicine',
    type: 'locum_tenens',
    payRate: 180,
    payPeriod: 'hourly' as const,
    benefits: ['Malpractice Insurance', 'CME Allowance'],
    requirements: ['Board Certified', 'TX License'],
    description: 'Rural family practice seeks locum physician for 6-month coverage.',
    recruiterName: 'Mike Chen',
    recruiterEmail: 'mike@ruralhealth.com',
    recruiterPhone: '555-0456',
    companyName: 'Rural Health Partners',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-09-01'),
    isActive: true,
    featured: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'job-3',
    title: 'Hospitalist Physician',
    location: 'Miami, FL',
    specialty: 'Internal Medicine',
    type: 'locum_tenens',
    payRate: 220,
    payPeriod: 'hourly' as const,
    benefits: ['Health Insurance', 'Housing Stipend', 'Travel'],
    requirements: ['Board Certified IM', 'FL License', 'Hospital Experience'],
    description: 'Large teaching hospital seeks hospitalist for ongoing locum coverage.',
    recruiterName: 'Jessica Martinez',
    recruiterEmail: 'jessica@hospitalstaffing.com',
    recruiterPhone: '555-0789',
    companyName: 'Hospital Staffing Network',
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-08-15'),
    isActive: true,
    featured: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  }
]

// Mock User Data
export const mockUser: Partial<User> = {
  id: 'user-demo',
  email: 'demo@locumtruerate.com',
  firstName: 'Demo',
  lastName: 'User',
  specialty: 'Emergency Medicine',
  isVerified: true,
  preferences: {
    locations: ['California', 'Texas', 'Florida'],
    specialties: ['Emergency Medicine', 'Internal Medicine'],
    payRange: { min: 200, max: 300 },
    travelRadius: 500
  }
}

// Mock Calculation Results
export const mockCalculationResults: CalculationResult[] = [
  {
    id: 'calc-1',
    totalCompensation: 285000,
    hourlyRate: 275,
    weeklyHours: 40,
    weeksPerYear: 26,
    benefits: {
      health: 12000,
      housing: 24000,
      travel: 8000,
      malpractice: 6000
    },
    taxes: {
      federal: 65000,
      state: 18000,
      fica: 21000
    },
    netIncome: 181000,
    createdAt: new Date('2024-01-20')
  }
]

// Mock Leads Data
export const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    email: 'dr.smith@email.com',
    firstName: 'John',
    lastName: 'Smith',
    specialty: 'Emergency Medicine',
    phone: '555-1234',
    source: 'calculator',
    status: 'new',
    createdAt: new Date('2024-01-22')
  }
]

// Mock Analytics Data
export const mockAnalytics = {
  pageViews: 15420,
  uniqueVisitors: 8940,
  bounceRate: 0.34,
  averageSessionDuration: 245,
  topPages: [
    { path: '/', views: 4520, title: 'Home' },
    { path: '/tools/calculator', views: 3200, title: 'Salary Calculator' },
    { path: '/search/jobs', views: 2890, title: 'Job Search' },
    { path: '/about', views: 1240, title: 'About Us' }
  ],
  conversionMetrics: {
    signupRate: 0.12,
    calculatorUsage: 0.28,
    jobApplicationRate: 0.08,
    leadCaptureRate: 0.15,
    visitorToRegistration: { rate: 0.12, visitors: 8940, registrations: 1073 },
    registrationToCalculator: { rate: 0.65, registrations: 1073, calculatorUses: 697 },
    calculatorToLead: { rate: 0.35, calculatorUses: 697, leads: 244 }
  }
}

// API Mock Functions
export const staticMockApi = {
  jobs: {
    list: () => Promise.resolve(mockJobs),
    getById: (id: string) => Promise.resolve(mockJobs.find(job => job.id === id)),
    search: (query: string) => Promise.resolve(
      mockJobs.filter(job => 
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.location.toLowerCase().includes(query.toLowerCase()) ||
        job.specialty.toLowerCase().includes(query.toLowerCase())
      )
    ),
    getByCategory: (category: string) => Promise.resolve(
      mockJobs.filter(job => job.specialty.toLowerCase().includes(category.toLowerCase()))
    ),
    getByLocation: (location: string) => Promise.resolve(
      mockJobs.filter(job => job.location.toLowerCase().includes(location.toLowerCase()))
    )
  },
  
  users: {
    getCurrentUser: () => Promise.resolve(mockUser),
    updateProfile: (data: Partial<User>) => Promise.resolve({ ...mockUser, ...data })
  },
  
  calculations: {
    calculate: (input: any) => Promise.resolve(mockCalculationResults[0]),
    getHistory: () => Promise.resolve(mockCalculationResults)
  },
  
  leads: {
    create: (data: Partial<Lead>) => Promise.resolve({ 
      ...data, 
      id: `lead-${Date.now()}`, 
      createdAt: new Date() 
    } as Lead),
    list: () => Promise.resolve(mockLeads)
  },
  
  analytics: {
    getDashboard: () => Promise.resolve(mockAnalytics),
    getPageViews: () => Promise.resolve(mockAnalytics.pageViews),
    getConversions: () => Promise.resolve(mockAnalytics.conversionMetrics)
  }
}

// Helper function to detect if we're in static export mode
export const isStaticMode = () => {
  return process.env.EXPORT === 'true' || 
         typeof window !== 'undefined' && 
         window.location.hostname.includes('.pages.dev')
}

// Static mode wrapper for API calls
export const withStaticFallback = <T>(
  serverCall: () => Promise<T>,
  staticFallback: () => Promise<T>
): Promise<T> => {
  if (isStaticMode()) {
    return staticFallback()
  }
  return serverCall().catch(() => staticFallback())
}