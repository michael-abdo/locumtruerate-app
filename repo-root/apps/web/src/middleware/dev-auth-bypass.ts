/**
 * Development Authentication Bypass
 * 
 * This middleware provides a simple authentication bypass for local development
 * when Clerk keys are not configured. This should NEVER be used in production.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Mock user for development
const DEV_USER = {
  userId: 'dev_user_123',
  sessionId: 'dev_session_123',
  email: 'dev@locumtruerate.com',
  role: 'USER',
}

export function devAuthBypass(req: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const hasPlaceholderKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')
  
  if (!isDevelopment || !hasPlaceholderKeys) {
    return null // Don't bypass in production or if real keys are configured
  }

  // Check if this is an API route that needs auth
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')
  const isProtectedRoute = !isPublicRoute(req.nextUrl.pathname)
  
  if (isApiRoute || isProtectedRoute) {
    // Add development user to headers for API context
    const headers = new Headers(req.headers)
    headers.set('x-dev-user-id', DEV_USER.userId)
    headers.set('x-dev-session-id', DEV_USER.sessionId)
    headers.set('x-dev-user-email', DEV_USER.email)
    headers.set('x-dev-user-role', DEV_USER.role)
    
    return NextResponse.next({
      request: {
        headers,
      },
    })
  }
  
  return null
}

function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/simple',
    '/test-legal',
    '/search/jobs',
    '/jobs/',
    '/tools/calculator',
    '/legal/',
    '/support',
    '/api/trpc/health.check',
    '/api/trpc/version.get',
    '/api/public/',
    '/_next/',
    '/favicon.ico',
  ]
  
  return publicRoutes.some(route => pathname.startsWith(route))
}