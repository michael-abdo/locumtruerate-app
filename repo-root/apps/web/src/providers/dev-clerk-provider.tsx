'use client'

import React from 'react'

/**
 * Development Clerk Provider
 * Provides a mock Clerk context for development when real keys aren't available
 */

// Mock useAuth hook for development
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'dev_user_123',
  sessionId: 'dev_session_123',
  user: {
    id: 'dev_user_123',
    emailAddresses: [{ emailAddress: 'dev@locumtruerate.com' }],
    firstName: 'Dev',
    lastName: 'User',
    fullName: 'Dev User',
  },
  signOut: () => Promise.resolve(),
})

// Mock useUser hook
export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: 'dev_user_123',
    emailAddresses: [{ emailAddress: 'dev@locumtruerate.com' }],
    firstName: 'Dev',
    lastName: 'User',
    fullName: 'Dev User',
  },
})

// Mock SignIn component
export const SignIn = () => (
  <div className="p-4 border rounded">
    <h2>Development Mode - Auto Signed In</h2>
    <p>You are signed in as dev@locumtruerate.com</p>
  </div>
)

// Mock SignUp component
export const SignUp = () => (
  <div className="p-4 border rounded">
    <h2>Development Mode - Auto Signed In</h2>
    <p>You are signed in as dev@locumtruerate.com</p>
  </div>
)

// Mock ClerkProvider
export function DevClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// Mock auth() function for server components
export const auth = () => ({
  userId: 'dev_user_123',
  sessionId: 'dev_session_123',
})