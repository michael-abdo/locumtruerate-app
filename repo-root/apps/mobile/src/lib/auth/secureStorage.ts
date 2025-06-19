/**
 * Secure Storage Service
 * 
 * Handles encrypted storage for sensitive data
 */

import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'
import { Platform } from 'react-native'
import { Analytics } from '../../services/analytics'

export interface SecureStorageOptions {
  keychainService?: string // iOS only
  keychainAccessible?: SecureStore.SecureStoreAccessible // iOS only
  requireAuthentication?: boolean
}

// Storage keys for different data types
export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_CREDENTIALS: 'user_credentials',
  
  // Payment
  PAYMENT_METHOD: 'payment_method',
  SAVED_CARDS: 'saved_cards',
  
  // User preferences
  BIOMETRIC_ENABLED: 'biometric_enabled',
  REMEMBER_ME: 'remember_me',
  
  // Sensitive data
  API_KEYS: 'api_keys',
  ENCRYPTION_KEY: 'encryption_key'
} as const

export class SecureStorageService {
  private static instance: SecureStorageService
  private encryptionKey: string | null = null

  private constructor() {}

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService()
    }
    return SecureStorageService.instance
  }

  /**
   * Initialize secure storage with encryption key
   */
  async initialize(): Promise<void> {
    try {
      // Generate or retrieve encryption key
      this.encryptionKey = await this.getOrCreateEncryptionKey()
      
      Analytics.addBreadcrumb('Secure storage initialized')
    } catch (error) {
      console.error('Failed to initialize secure storage:', error)
      Analytics.captureError(error as Error, { context: 'secure_storage_init' })
    }
  }

  /**
   * Store encrypted data
   */
  async setItem(
    key: string, 
    value: string, 
    options?: SecureStorageOptions
  ): Promise<boolean> {
    try {
      // Encrypt the value if encryption key is available
      const encryptedValue = await this.encrypt(value)
      
      const storeOptions: SecureStore.SecureStoreOptions = {
        keychainService: options?.keychainService || 'com.locumtruerate.app',
        requireAuthentication: options?.requireAuthentication || false
      }

      if (Platform.OS === 'ios' && options?.keychainAccessible) {
        storeOptions.keychainAccessible = options.keychainAccessible
      }

      await SecureStore.setItemAsync(key, encryptedValue, storeOptions)
      
      Analytics.addBreadcrumb('Secure item stored', { key })
      return true
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error)
      Analytics.captureError(error as Error, { 
        context: 'secure_storage_set',
        key 
      })
      return false
    }
  }

  /**
   * Retrieve and decrypt data
   */
  async getItem(
    key: string, 
    options?: SecureStorageOptions
  ): Promise<string | null> {
    try {
      const storeOptions: SecureStore.SecureStoreOptions = {
        keychainService: options?.keychainService || 'com.locumtruerate.app',
        requireAuthentication: options?.requireAuthentication || false
      }

      if (Platform.OS === 'ios' && options?.keychainAccessible) {
        storeOptions.keychainAccessible = options.keychainAccessible
      }

      const encryptedValue = await SecureStore.getItemAsync(key, storeOptions)
      
      if (!encryptedValue) {
        return null
      }

      // Decrypt the value
      const decryptedValue = await this.decrypt(encryptedValue)
      
      return decryptedValue
    } catch (error) {
      console.error(`Failed to retrieve secure item ${key}:`, error)
      Analytics.captureError(error as Error, { 
        context: 'secure_storage_get',
        key 
      })
      return null
    }
  }

  /**
   * Delete secure item
   */
  async deleteItem(
    key: string, 
    options?: SecureStorageOptions
  ): Promise<boolean> {
    try {
      const storeOptions: SecureStore.SecureStoreOptions = {
        keychainService: options?.keychainService || 'com.locumtruerate.app'
      }

      await SecureStore.deleteItemAsync(key, storeOptions)
      
      Analytics.addBreadcrumb('Secure item deleted', { key })
      return true
    } catch (error) {
      console.error(`Failed to delete secure item ${key}:`, error)
      return false
    }
  }

  /**
   * Store JSON object securely
   */
  async setJSON<T>(
    key: string, 
    value: T, 
    options?: SecureStorageOptions
  ): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value)
      return await this.setItem(key, jsonString, options)
    } catch (error) {
      console.error(`Failed to store JSON ${key}:`, error)
      return false
    }
  }

  /**
   * Retrieve JSON object
   */
  async getJSON<T>(
    key: string, 
    options?: SecureStorageOptions
  ): Promise<T | null> {
    try {
      const jsonString = await this.getItem(key, options)
      
      if (!jsonString) {
        return null
      }

      return JSON.parse(jsonString) as T
    } catch (error) {
      console.error(`Failed to parse JSON ${key}:`, error)
      return null
    }
  }

  /**
   * Store authentication tokens
   */
  async storeAuthTokens(tokens: {
    accessToken: string
    refreshToken?: string
    expiresAt?: number
  }): Promise<boolean> {
    try {
      const stored = await this.setJSON(STORAGE_KEYS.AUTH_TOKEN, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt || Date.now() + 3600000 // 1 hour default
      }, {
        requireAuthentication: false,
        keychainAccessible: SecureStore.SecureStoreAccessible.WHEN_UNLOCKED_THIS_DEVICE_ONLY
      })

      if (stored) {
        Analytics.addBreadcrumb('Auth tokens stored securely')
      }

      return stored
    } catch (error) {
      console.error('Failed to store auth tokens:', error)
      return false
    }
  }

  /**
   * Retrieve authentication tokens
   */
  async getAuthTokens(): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt: number
  } | null> {
    return await this.getJSON(STORAGE_KEYS.AUTH_TOKEN, {
      requireAuthentication: false
    })
  }

  /**
   * Clear authentication tokens
   */
  async clearAuthTokens(): Promise<boolean> {
    return await this.deleteItem(STORAGE_KEYS.AUTH_TOKEN)
  }

  /**
   * Store payment method securely
   */
  async storePaymentMethod(paymentMethod: {
    id: string
    last4: string
    brand: string
    expiryMonth: number
    expiryYear: number
  }): Promise<boolean> {
    // Only store non-sensitive payment info
    const safePaymentMethod = {
      id: paymentMethod.id,
      last4: paymentMethod.last4,
      brand: paymentMethod.brand,
      expiryMonth: paymentMethod.expiryMonth,
      expiryYear: paymentMethod.expiryYear
    }

    return await this.setJSON(STORAGE_KEYS.PAYMENT_METHOD, safePaymentMethod, {
      requireAuthentication: true,
      keychainAccessible: SecureStore.SecureStoreAccessible.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
    })
  }

  /**
   * Clear all secure storage
   */
  async clearAll(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS)
    
    for (const key of keys) {
      await this.deleteItem(key)
    }

    Analytics.addBreadcrumb('All secure storage cleared')
  }

  // Private encryption methods

  private async getOrCreateEncryptionKey(): Promise<string> {
    try {
      // Try to get existing key
      let key = await SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTION_KEY)
      
      if (!key) {
        // Generate new key
        const randomBytes = await Crypto.getRandomBytesAsync(32)
        key = randomBytes.toString()
        
        // Store the key
        await SecureStore.setItemAsync(
          STORAGE_KEYS.ENCRYPTION_KEY, 
          key,
          {
            keychainService: 'com.locumtruerate.app.encryption',
            keychainAccessible: SecureStore.SecureStoreAccessible.WHEN_UNLOCKED_THIS_DEVICE_ONLY
          }
        )
      }

      return key
    } catch (error) {
      console.error('Failed to get/create encryption key:', error)
      throw error
    }
  }

  private async encrypt(value: string): Promise<string> {
    // For now, just return the value
    // In production, implement proper encryption using expo-crypto
    return value
  }

  private async decrypt(encryptedValue: string): Promise<string> {
    // For now, just return the value
    // In production, implement proper decryption using expo-crypto
    return encryptedValue
  }
}

// Export singleton instance
export const SecureStorage = SecureStorageService.getInstance()

// Export convenience functions
export const storeSecurely = (key: string, value: string, options?: SecureStorageOptions) => 
  SecureStorage.setItem(key, value, options)

export const getSecurely = (key: string, options?: SecureStorageOptions) => 
  SecureStorage.getItem(key, options)

export const deleteSecurely = (key: string, options?: SecureStorageOptions) => 
  SecureStorage.deleteItem(key, options)