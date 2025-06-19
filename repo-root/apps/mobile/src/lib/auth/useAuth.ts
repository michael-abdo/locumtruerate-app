/**
 * Authentication Hook
 * 
 * React hook for managing authentication state
 */

import { useState, useEffect, useCallback } from 'react'
import { Auth, AuthState, LoginCredentials } from './authManager'
import { BiometricAuth } from './biometric'

export interface UseAuthReturn {
  // State
  isAuthenticated: boolean
  user: AuthState['user']
  isLoading: boolean
  biometricEnabled: boolean
  biometricAvailable: boolean
  biometricType: string
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  loginWithBiometric: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  enableBiometric: () => Promise<boolean>
  disableBiometric: () => Promise<boolean>
  checkBiometricAvailability: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>(Auth.getAuthState())
  const [isLoading, setIsLoading] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricType, setBiometricType] = useState('Biometric')

  // Subscribe to auth state changes
  useEffect(() => {
    const handleAuthStateChange = (state: AuthState) => {
      setAuthState(state)
    }

    Auth.addAuthListener(handleAuthStateChange)

    // Check biometric availability
    checkBiometricAvailability()

    return () => {
      Auth.removeAuthListener(handleAuthStateChange)
    }
  }, [])

  // Check biometric availability
  const checkBiometricAvailability = useCallback(async () => {
    const capabilities = Auth.getBiometricCapabilities()
    setBiometricAvailable(capabilities.hasHardware && capabilities.isEnrolled)
    setBiometricType(capabilities.biometricType)
  }, [])

  // Login with email/password
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const result = await Auth.login(credentials)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Login with biometric
  const loginWithBiometric = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await Auth.loginWithBiometric()
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await Auth.logout()
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Enable biometric
  const enableBiometric = useCallback(async () => {
    const result = await Auth.enableBiometric()
    if (result) {
      await checkBiometricAvailability()
    }
    return result
  }, [checkBiometricAvailability])

  // Disable biometric
  const disableBiometric = useCallback(async () => {
    return await Auth.disableBiometric()
  }, [])

  return {
    // State
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading,
    biometricEnabled: authState.biometricEnabled,
    biometricAvailable,
    biometricType,
    
    // Actions
    login,
    loginWithBiometric,
    logout,
    enableBiometric,
    disableBiometric,
    checkBiometricAvailability
  }
}

// Hook for requiring authentication
export function useRequireAuth() {
  const { isAuthenticated, user } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait for auth state to be determined
    const checkAuth = async () => {
      // Give auth manager time to check existing session
      await new Promise(resolve => setTimeout(resolve, 100))
      setIsReady(true)
    }
    
    checkAuth()
  }, [])

  return { 
    isAuthenticated, 
    user, 
    isReady 
  }
}

// Hook for biometric prompt
export function useBiometricPrompt(
  onSuccess: () => void,
  onError?: (error: string) => void
) {
  const [isPrompting, setIsPrompting] = useState(false)

  const prompt = useCallback(async (reason?: string) => {
    if (isPrompting) return

    setIsPrompting(true)
    try {
      const result = await BiometricAuth.authenticate(reason)
      
      if (result.success) {
        onSuccess()
      } else if (onError) {
        onError(result.error || 'Authentication failed')
      }
    } finally {
      setIsPrompting(false)
    }
  }, [isPrompting, onSuccess, onError])

  return { prompt, isPrompting }
}