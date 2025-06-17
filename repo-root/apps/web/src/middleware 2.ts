import { authMiddleware } from '@clerk/nextjs'

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware

export default authMiddleware({
  // Allow signed out users to access the specified routes:
  publicRoutes: [
    '/',
    '/search/jobs',
    '/jobs/(.*)',
    '/tools/calculator',
    '/api/trpc/jobs.getAll',
    '/api/trpc/jobs.getBySlug',
    '/api/trpc/jobs.getFeatured',
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
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}