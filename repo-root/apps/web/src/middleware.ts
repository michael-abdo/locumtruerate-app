import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware

export default function middleware(req: NextRequest) {
  // Development bypass for middleware
  if (process.env.NODE_ENV === 'development' && 
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')) {
    // In development with placeholder keys, bypass auth middleware entirely
    return NextResponse.next()
  }
  
  // In production or with real keys, use actual Clerk middleware
  return authMiddleware({
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
  },
  })(req)
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}