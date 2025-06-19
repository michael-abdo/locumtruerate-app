/**
 * Authentication Manager
 * 
 * Handles authentication flow with biometric support
 */

import { BiometricAuth } from './biometric'
import { SecureStorage, STORAGE_KEYS } from './secureStorage'
import { Analytics, trackEvent } from '../../services/analytics'
import { trpc } from '../../lib/trpc'

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  biometricEnabled: boolean
  rememberMe: boolean
}

export interface User {
  id: string
  email: string
  name: string
  role: 'candidate' | 'employer' | 'admin'
  subscriptionTier?: 'FREE' | 'PRO' | 'ENTERPRISE'
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export class AuthManager {
  private static instance: AuthManager
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    biometricEnabled: false,
    rememberMe: false
  }
  private authListeners: Set<(state: AuthState) => void> = new Set()

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * Initialize authentication manager
   */
  async initialize(): Promise<void> {
    try {
      // Initialize dependencies
      await SecureStorage.initialize()
      await BiometricAuth.initialize()

      // Check for existing session
      await this.checkExistingSession()

      // Check biometric settings
      this.authState.biometricEnabled = await BiometricAuth.isBiometricEnabled()

      Analytics.addBreadcrumb('Auth manager initialized', {
        hasSession: this.authState.isAuthenticated,
        biometricEnabled: this.authState.biometricEnabled
      })
    } catch (error) {
      console.error('Failed to initialize auth manager:', error)
      Analytics.captureError(error as Error, { context: 'auth_init' })
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      trackEvent('sign_in', {
        method: 'email',
        remember_me: credentials.rememberMe || false
      })

      // Call login API
      const response = await trpc.auth.login.mutate({
        email: credentials.email,
        password: credentials.password
      })

      if (response.token && response.user) {
        // Store auth tokens
        await SecureStorage.storeAuthTokens({
          accessToken: response.token,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt
        })

        // Store user data
        await this.setUser(response.user)

        // Handle remember me
        if (credentials.rememberMe) {
          await SecureStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
          await SecureStorage.setJSON(STORAGE_KEYS.USER_CREDENTIALS, {
            email: credentials.email
          })
        }

        this.authState.rememberMe = credentials.rememberMe || false
        this.notifyListeners()

        return { success: true }
      }

      return { 
        success: false, 
        error: 'Invalid credentials' 
      }
    } catch (error: any) {
      console.error('Login error:', error)
      Analytics.captureError(error, { context: 'login' })

      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    }
  }

  /**
   * Login with biometric authentication
   */
  async loginWithBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if biometric is enabled
      if (!this.authState.biometricEnabled) {
        return { 
          success: false, 
          error: 'Biometric authentication not enabled' 
        }
      }

      // Get stored user ID
      const userId = await BiometricAuth.getBiometricUserId()
      if (!userId) {
        return { 
          success: false, 
          error: 'No biometric user found' 
        }
      }

      // Authenticate with biometric
      const biometricResult = await BiometricAuth.authenticate(
        'Log in to LocumTrueRate'
      )

      if (!biometricResult.success) {
        return { 
          success: false, 
          error: biometricResult.error 
        }
      }

      trackEvent('sign_in', {
        method: 'biometric',
        biometric_type: biometricResult.biometricType
      })

      // Get stored tokens and refresh if needed
      const tokens = await SecureStorage.getAuthTokens()
      if (!tokens) {
        return { 
          success: false, 
          error: 'No stored session found' 
        }
      }

      // Check if token is expired
      if (tokens.expiresAt < Date.now()) {
        // Refresh token
        if (tokens.refreshToken) {
          const refreshResult = await this.refreshToken(tokens.refreshToken)
          if (!refreshResult.success) {
            return refreshResult
          }
        } else {
          return { 
            success: false, 
            error: 'Session expired' 
          }
        }
      }

      // Get user data
      const userData = await this.fetchUserData()
      if (userData) {
        await this.setUser(userData)
        return { success: true }
      }

      return { 
        success: false, 
        error: 'Failed to load user data' 
      }
    } catch (error: any) {
      console.error('Biometric login error:', error)
      Analytics.captureError(error, { context: 'biometric_login' })

      return { 
        success: false, 
        error: error.message || 'Biometric login failed' 
      }
    }
  }

  /**
   * Enable biometric authentication for current user
   */
  async enableBiometric(): Promise<boolean> {
    if (!this.authState.user) {
      console.error('No user logged in')
      return false
    }

    const enabled = await BiometricAuth.enableBiometric(this.authState.user.id)
    
    if (enabled) {
      this.authState.biometricEnabled = true
      this.notifyListeners()
    }

    return enabled
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<boolean> {
    const disabled = await BiometricAuth.disableBiometric()
    
    if (disabled) {
      this.authState.biometricEnabled = false
      this.notifyListeners()
    }

    return disabled
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      trackEvent('sign_out', {
        user_id: this.authState.user?.id
      })

      // Call logout API if needed
      // await trpc.auth.logout.mutate()

      // Clear stored data
      await SecureStorage.clearAuthTokens()
      
      // Keep remember me preference
      if (!this.authState.rememberMe) {
        await SecureStorage.deleteItem(STORAGE_KEYS.USER_CREDENTIALS)
      }

      // Reset state
      this.authState = {
        isAuthenticated: false,
        user: null,
        biometricEnabled: this.authState.biometricEnabled,
        rememberMe: this.authState.rememberMe
      }

      this.notifyListeners()
    } catch (error) {
      console.error('Logout error:', error)
      Analytics.captureError(error as Error, { context: 'logout' })
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await trpc.auth.refresh.mutate({ refreshToken })

      if (response.token) {
        await SecureStorage.storeAuthTokens({
          accessToken: response.token,
          refreshToken: response.refreshToken || refreshToken,
          expiresAt: response.expiresAt
        })

        return { success: true }
      }

      return { 
        success: false, 
        error: 'Failed to refresh token' 
      }
    } catch (error: any) {
      console.error('Token refresh error:', error)
      return { 
        success: false, 
        error: error.message || 'Token refresh failed' 
      }
    }
  }

  /**
   * Check for existing session
   */
  private async checkExistingSession(): Promise<void> {
    try {
      const tokens = await SecureStorage.getAuthTokens()
      
      if (!tokens) {
        return
      }

      // Check if token is expired
      if (tokens.expiresAt < Date.now()) {
        // Try to refresh
        if (tokens.refreshToken) {
          const refreshResult = await this.refreshToken(tokens.refreshToken)
          if (!refreshResult.success) {
            await this.logout()
            return
          }
        } else {
          await this.logout()
          return
        }
      }

      // Get user data
      const userData = await this.fetchUserData()
      if (userData) {
        await this.setUser(userData)
      }
    } catch (error) {
      console.error('Session check error:', error)
      await this.logout()
    }
  }

  /**
   * Fetch user data from API
   */
  private async fetchUserData(): Promise<User | null> {
    try {
      const response = await trpc.users.getProfile.query()
      
      if (response) {
        return {
          id: response.id,
          email: response.email,
          name: response.name || response.email,
          role: response.role as 'candidate' | 'employer' | 'admin',
          subscriptionTier: response.subscriptionTier
        }
      }

      return null
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      return null
    }
  }

  /**
   * Set user data
   */
  private async setUser(user: User): Promise<void> {
    this.authState.isAuthenticated = true
    this.authState.user = user

    Analytics.identify(user.id, {
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      userType: user.role
    })
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  /**
   * Subscribe to auth state changes
   */
  addAuthListener(listener: (state: AuthState) => void): void {
    this.authListeners.add(listener)
    // Send current state immediately
    listener(this.getAuthState())
  }

  /**
   * Unsubscribe from auth state changes
   */
  removeAuthListener(listener: (state: AuthState) => void): void {
    this.authListeners.delete(listener)
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getAuthState()
    this.authListeners.forEach(listener => listener(state))
  }

  /**
   * Get biometric capabilities
   */
  getBiometricCapabilities() {
    return {
      hasHardware: BiometricAuth.hasHardware(),
      isEnrolled: BiometricAuth.isEnrolled(),
      biometricType: BiometricAuth.getBiometricTypeName()
    }
  }
}

// Export singleton instance
export const Auth = AuthManager.getInstance()