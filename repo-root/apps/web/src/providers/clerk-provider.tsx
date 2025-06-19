'use client'

import { ReactNode } from 'react'

// Development bypass for Clerk provider
export function ClerkProviderWrapper({ children }: { children: ReactNode }) {
  // In development, bypass Clerk if no valid key
  if (process.env.NODE_ENV === 'development' && 
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')) {
    return <>{children}</>
  }
  
  // In production, use actual Clerk
  const { ClerkProvider } = require('@clerk/nextjs')
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}