/**
 * Biometric Authentication Service
 * 
 * Handles Face ID, Touch ID, and fingerprint authentication
 */

import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { Analytics, trackEvent } from '../../services/analytics'

export interface BiometricResult {
  success: boolean
  error?: string
  biometricType?: 'faceId' | 'touchId' | 'fingerprint' | 'iris' | 'unknown'
}

export interface BiometricCapabilities {
  hasHardware: boolean
  isEnrolled: boolean
  supportedTypes: LocalAuthentication.AuthenticationType[]
  biometricType: string
}

export class BiometricAuthService {
  private static instance: BiometricAuthService
  private isInitialized = false
  private capabilities: BiometricCapabilities | null = null

  private constructor() {}

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService()
    }
    return BiometricAuthService.instance
  }

  /**
   * Initialize biometric authentication
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.capabilities = await this.checkCapabilities()
      this.isInitialized = true
      
      Analytics.setContext('biometric', {
        hasHardware: this.capabilities.hasHardware,
        isEnrolled: this.capabilities.isEnrolled,
        type: this.capabilities.biometricType
      })
    } catch (error) {
      console.error('Failed to initialize biometric auth:', error)
      Analytics.captureError(error as Error, { context: 'biometric_init' })
    }
  }

  /**
   * Check device biometric capabilities
   */
  async checkCapabilities(): Promise<BiometricCapabilities> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()

    // Determine the primary biometric type
    let biometricType = 'none'
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint'
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'Iris Scanner'
    }

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      biometricType
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(
    reason: string = 'Authenticate to access your account'
  ): Promise<BiometricResult> {
    try {
      // Ensure we're initialized
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Check if biometric authentication is available
      if (!this.capabilities?.hasHardware) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device'
        }
      }

      if (!this.capabilities?.isEnrolled) {
        return {
          success: false,
          error: 'No biometric data enrolled. Please set up biometrics in your device settings.'
        }
      }

      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false
      })

      if (result.success) {
        trackEvent('biometric_auth_used', {
          biometric_type: this.getBiometricType(),
          success: true
        })

        return {
          success: true,
          biometricType: this.getBiometricType()
        }
      } else {
        let errorMessage = 'Authentication failed'
        
        switch (result.error) {
          case 'UserCancel':
            errorMessage = 'Authentication was cancelled'
            break
          case 'SystemCancel':
            errorMessage = 'Authentication was cancelled by the system'
            break
          case 'PasscodeNotSet':
            errorMessage = 'Device passcode not set'
            break
          case 'BiometryNotAvailable':
            errorMessage = 'Biometric authentication not available'
            break
          case 'BiometryNotEnrolled':
            errorMessage = 'No biometric data enrolled'
            break
          case 'BiometryLockout':
            errorMessage = 'Too many failed attempts. Biometry is locked'
            break
          case 'UserFallback':
            errorMessage = 'User chose to use passcode'
            break
          default:
            errorMessage = result.error || 'Unknown error'
        }

        trackEvent('biometric_auth_used', {
          biometric_type: this.getBiometricType(),
          success: false,
          error: result.error
        })

        return {
          success: false,
          error: errorMessage
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error)
      Analytics.captureError(error as Error, { context: 'biometric_auth' })
      
      return {
        success: false,
        error: 'An unexpected error occurred during authentication'
      }
    }
  }

  /**
   * Enable biometric authentication for the app
   */
  async enableBiometric(userId: string): Promise<boolean> {
    try {
      // First authenticate to ensure it's the right user
      const authResult = await this.authenticate(
        'Authenticate to enable biometric login'
      )

      if (!authResult.success) {
        return false
      }

      // Store a flag indicating biometric is enabled
      await SecureStore.setItemAsync('biometric_enabled', 'true')
      await SecureStore.setItemAsync('biometric_user_id', userId)

      trackEvent('biometric_auth_enabled', {
        biometric_type: this.getBiometricType()
      })

      return true
    } catch (error) {
      console.error('Failed to enable biometric:', error)
      return false
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync('biometric_enabled')
      await SecureStore.deleteItemAsync('biometric_user_id')
      
      Analytics.trackEvent('biometric_auth_enabled', {
        enabled: false
      })

      return true
    } catch (error) {
      console.error('Failed to disable biometric:', error)
      return false
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync('biometric_enabled')
      return enabled === 'true'
    } catch {
      return false
    }
  }

  /**
   * Get the stored user ID for biometric authentication
   */
  async getBiometricUserId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('biometric_user_id')
    } catch {
      return null
    }
  }

  /**
   * Get the current biometric type
   */
  private getBiometricType(): 'faceId' | 'touchId' | 'fingerprint' | 'iris' | 'unknown' {
    if (!this.capabilities?.supportedTypes.length) {
      return 'unknown'
    }

    const types = this.capabilities.supportedTypes

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'faceId' : 'fingerprint'
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'touchId' : 'fingerprint'
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris'
    }

    return 'unknown'
  }

  /**
   * Get user-friendly biometric type name
   */
  getBiometricTypeName(): string {
    return this.capabilities?.biometricType || 'Biometric Authentication'
  }

  /**
   * Check if device has biometric hardware
   */
  hasHardware(): boolean {
    return this.capabilities?.hasHardware || false
  }

  /**
   * Check if user has enrolled biometric data
   */
  isEnrolled(): boolean {
    return this.capabilities?.isEnrolled || false
  }
}

// Export singleton instance
export const BiometricAuth = BiometricAuthService.getInstance()