import type { NextRequest } from 'next/server'
import { authMiddleware } from '@clerk/nextjs'
import { withSecurityHeaders } from './middleware/security-headers'

export default authMiddleware({
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