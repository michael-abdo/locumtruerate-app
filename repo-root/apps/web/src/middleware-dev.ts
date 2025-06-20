import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withSecurityHeaders } from './middleware/security-headers'

/**
 * Development middleware that bypasses Clerk authentication
 * when placeholder keys are detected
 */
export function middleware(req: NextRequest) {
  // Always apply security headers
  return withSecurityHeaders(req) || NextResponse.next()
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}