/**
 * Deep Linking Configuration
 * 
 * Handles deep links for sharing and navigation
 */

import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { Platform } from 'react-native'
import { Analytics, trackEvent } from '../services/analytics'

// Deep link patterns
export const DEEP_LINK_PATTERNS = {
  // Job links
  JOB_DETAIL: 'job/:id',
  JOB_SEARCH: 'jobs',
  
  // Calculator links
  CALCULATOR_CONTRACT: 'calculator/contract',
  CALCULATOR_PAYCHECK: 'calculator/paycheck',
  CALCULATOR_SAVED: 'calculator/saved/:id',
  
  // Application links
  APPLICATION_STATUS: 'applications/:id',
  
  // Profile links
  PROFILE: 'profile',
  SETTINGS: 'settings',
  
  // Auth links
  LOGIN: 'auth/login',
  SIGNUP: 'auth/signup',
  RESET_PASSWORD: 'auth/reset-password',
  
  // Payment links
  SUBSCRIPTION: 'subscription',
  PAYMENT_SUCCESS: 'payment/success',
  PAYMENT_CANCEL: 'payment/cancel'
}

export interface DeepLinkData {
  path: string
  params?: Record<string, string>
  queryParams?: Record<string, string>
}

export class DeepLinkingService {
  private static instance: DeepLinkingService
  private initialURL: string | null = null
  private linkingListeners: Set<(url: string) => void> = new Set()

  private constructor() {}

  static getInstance(): DeepLinkingService {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService()
    }
    return DeepLinkingService.instance
  }

  /**
   * Initialize deep linking
   */
  async initialize() {
    try {
      // Get initial URL if app was opened via deep link
      this.initialURL = await Linking.getInitialURL()
      
      if (this.initialURL) {
        this.handleDeepLink(this.initialURL)
      }

      // Subscribe to URL changes
      Linking.addEventListener('url', this.handleURLEvent)

      Analytics.addBreadcrumb('Deep linking initialized', {
        initialURL: this.initialURL
      })
    } catch (error) {
      console.error('Failed to initialize deep linking:', error)
      Analytics.captureError(error as Error, { context: 'deep_linking_init' })
    }
  }

  /**
   * Clean up listeners
   */
  destroy() {
    Linking.removeEventListener('url', this.handleURLEvent)
    this.linkingListeners.clear()
  }

  /**
   * Handle URL event
   */
  private handleURLEvent = (event: { url: string }) => {
    this.handleDeepLink(event.url)
  }

  /**
   * Handle deep link navigation
   */
  private handleDeepLink(url: string) {
    try {
      const { hostname, path, queryParams } = Linking.parse(url)

      trackEvent('deep_link_opened', {
        url,
        hostname,
        path,
        has_params: Object.keys(queryParams).length > 0
      })

      // Notify listeners
      this.linkingListeners.forEach(listener => listener(url))

      // Route to appropriate screen
      this.navigateToDeepLink(path, queryParams)
    } catch (error) {
      console.error('Failed to handle deep link:', error)
      Analytics.captureError(error as Error, { 
        context: 'deep_link_handle',
        url 
      })
    }
  }

  /**
   * Navigate to deep link destination
   */
  private navigateToDeepLink(path: string, queryParams: Record<string, string>) {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    // Job routes
    if (cleanPath.startsWith('job/')) {
      const jobId = cleanPath.split('/')[1]
      router.push(`/job/${jobId}`)
    } 
    // Calculator routes
    else if (cleanPath.startsWith('calculator/')) {
      const type = cleanPath.split('/')[1]
      if (type === 'saved') {
        const id = cleanPath.split('/')[2]
        router.push({
          pathname: '/calculator/[type]',
          params: { type: 'saved', id }
        })
      } else {
        router.push({
          pathname: '/calculator/[type]',
          params: { type }
        })
      }
    }
    // Application routes
    else if (cleanPath.startsWith('applications/')) {
      const appId = cleanPath.split('/')[1]
      router.push(`/applications/${appId}`)
    }
    // Auth routes
    else if (cleanPath.startsWith('auth/')) {
      const authAction = cleanPath.split('/')[1]
      switch (authAction) {
        case 'login':
          router.push('/auth/login')
          break
        case 'signup':
          router.push('/auth/signup')
          break
        case 'reset-password':
          router.push({
            pathname: '/auth/reset-password',
            params: queryParams
          })
          break
      }
    }
    // Payment routes
    else if (cleanPath.startsWith('payment/')) {
      const status = cleanPath.split('/')[1]
      router.push({
        pathname: '/payment-result',
        params: { status, ...queryParams }
      })
    }
    // Default routes
    else {
      switch (cleanPath) {
        case 'jobs':
          router.push('/(tabs)/jobs')
          break
        case 'profile':
          router.push('/(tabs)/profile')
          break
        case 'settings':
          router.push('/settings')
          break
        case 'subscription':
          router.push('/subscription')
          break
        default:
          // Navigate to home if unknown route
          router.push('/')
      }
    }
  }

  /**
   * Create shareable link for a job
   */
  createJobLink(jobId: string, jobTitle?: string): string {
    const baseURL = Linking.createURL(`job/${jobId}`)
    
    trackEvent('job_shared', {
      job_id: jobId,
      job_title: jobTitle,
      share_method: 'link'
    })

    return baseURL
  }

  /**
   * Create shareable link for a calculation
   */
  createCalculationLink(
    type: 'contract' | 'paycheck',
    data: Record<string, any>
  ): string {
    // Encode calculation data as query params
    const queryString = Object.entries(data)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')

    const baseURL = Linking.createURL(`calculator/${type}?${queryString}`)

    trackEvent('calculation_shared', {
      calculator_type: type,
      has_data: true,
      share_method: 'link'
    })

    return baseURL
  }

  /**
   * Create shareable link for saved calculation
   */
  createSavedCalculationLink(calculationId: string): string {
    const baseURL = Linking.createURL(`calculator/saved/${calculationId}`)

    trackEvent('calculation_shared', {
      calculation_id: calculationId,
      share_method: 'link'
    })

    return baseURL
  }

  /**
   * Add deep link listener
   */
  addLinkListener(listener: (url: string) => void) {
    this.linkingListeners.add(listener)
  }

  /**
   * Remove deep link listener
   */
  removeLinkListener(listener: (url: string) => void) {
    this.linkingListeners.delete(listener)
  }

  /**
   * Open external URL
   */
  async openURL(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url)
      
      if (canOpen) {
        await Linking.openURL(url)
        
        trackEvent('deep_link_opened', {
          url,
          type: 'external'
        })
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to open URL:', error)
      return false
    }
  }

  /**
   * Make a phone call
   */
  async makePhoneCall(phoneNumber: string): Promise<boolean> {
    const url = `tel:${phoneNumber}`
    return await this.openURL(url)
  }

  /**
   * Send email
   */
  async sendEmail(
    email: string,
    subject?: string,
    body?: string
  ): Promise<boolean> {
    let url = `mailto:${email}`
    
    const params: string[] = []
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
    if (body) params.push(`body=${encodeURIComponent(body)}`)
    
    if (params.length > 0) {
      url += `?${params.join('&')}`
    }
    
    return await this.openURL(url)
  }

  /**
   * Open map with address
   */
  async openMap(address: string): Promise<boolean> {
    const encoded = encodeURIComponent(address)
    const url = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`
    })
    
    return await this.openURL(url || '')
  }

  /**
   * Get initial URL (for handling cold start deep links)
   */
  getInitialURL(): string | null {
    return this.initialURL
  }
}

// Export singleton instance
export const DeepLinking = DeepLinkingService.getInstance()

// Export convenience functions
export const createJobLink = (jobId: string, jobTitle?: string) => 
  DeepLinking.createJobLink(jobId, jobTitle)

export const createCalculationLink = (
  type: 'contract' | 'paycheck',
  data: Record<string, any>
) => DeepLinking.createCalculationLink(type, data)

export const openExternalURL = (url: string) => 
  DeepLinking.openURL(url)