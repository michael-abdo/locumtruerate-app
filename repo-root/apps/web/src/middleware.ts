import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authMiddleware } from '@clerk/nextjs'
import { withSecurityHeaders } from './middleware/security-headers'

// Environment checks
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const hasPlaceholderKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')

// Production logging enforcement
if (isProduction) {
  // Disable debug logging in production
  if (process.env.ENABLE_DEBUG_LOGS === 'true') {
    console.warn('WARNING: Debug logging is enabled in production environment. This should be disabled for security.')
  }
  
  // Override console methods in production if debug logs are disabled
  if (process.env.ENABLE_DEBUG_LOGS !== 'true') {
    console.debug = () => {} // Disable debug logs
    console.info = () => {}  // Disable info logs (keep only warnings and errors)
  }
}

// Simple middleware for development with placeholder keys
function devMiddleware(req: NextRequest) {
  // Always apply security headers
  const securityResponse = withSecurityHeaders(req)
  return securityResponse || NextResponse.next()
}

// Export appropriate middleware based on environment
export default isDevelopment && hasPlaceholderKeys ? devMiddleware : authMiddleware({
    // Allow signed out users to access the specified routes:
    publicRoutes: [
      '/',
      '/simple',
      '/test-legal',
      '/search/jobs',
      '/jobs/(.*)',
      '/tools/calculator',
      '/legal/(.*)',
      '/support',
      '/api/trpc/jobs.getAll',
      '/api/trpc/jobs.getBySlug',
      '/api/trpc/jobs.getFeatured',
      '/api/trpc/support.searchKnowledge',
      '/api/trpc/support.getArticle',
      '/api/trpc/support.getPopularArticles',
      '/api/trpc/support.getArticlesByCategory',
      '/api/trpc/support.rateArticle',
      '/api/trpc/health.check',
      '/api/trpc/version.get',
      '/api/public/(.*)',
    ],
    
    // Prevent the specified routes from accessing authentication information:
    ignoredRoutes: [
      '/api/webhooks/(.*)',
      '/_next/(.*)',
      '/favicon.ico',
    ],

    // Force the specified routes to be accessible only to signed in users:
    afterAuth(auth, req) {
      // Development bypass when Clerk keys are placeholders
      const devBypass = devAuthBypass(req)
      if (devBypass) {
        return devBypass
      }
      // Handle users who aren't authenticated
      if (!auth.userId && !auth.isPublicRoute) {
        const signInUrl = new URL('/sign-in', req.url)
        signInUrl.searchParams.set('redirect_url', req.url)
        return Response.redirect(signInUrl)
      }

      // Redirect signed in users from sign-in page to dashboard
      if (auth.userId && req.nextUrl.pathname === '/sign-in') {
        const dashboardUrl = new URL('/dashboard', req.url)
        return Response.redirect(dashboardUrl)
      }

      // Apply security headers to all requests for HIPAA compliance
      return withSecurityHeaders(req)
    },
  })

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}