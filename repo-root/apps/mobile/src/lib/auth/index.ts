/**
 * Authentication Module
 * 
 * Exports all authentication-related functionality
 */

export * from './biometric'
export * from './secureStorage'
export * from './authManager'
export { useAuth } from './useAuth'

import { Auth } from './authManager'

// Initialize authentication
export async function initializeAuth() {
  await Auth.initialize()
}