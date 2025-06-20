'use client'

import { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { DevClerkProvider } from './dev-clerk-provider'

export function ClerkProviderWrapper({ children }: { children: ReactNode }) {
  // Check if we're in development with placeholder keys
  const isDevelopment = process.env.NODE_ENV === 'development'
  const hasPlaceholderKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')
  
  if (isDevelopment && hasPlaceholderKeys) {
    console.warn('🔧 Development Mode: Using mock authentication provider')
    return <DevClerkProvider>{children}</DevClerkProvider>
  }
  
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}