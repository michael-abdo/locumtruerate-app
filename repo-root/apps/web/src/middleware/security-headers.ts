import { NextRequest, NextResponse } from 'next/server'

/**
 * HIPAA-Compliant Security Headers Middleware
 * 
 * This middleware adds comprehensive security headers to protect PHI
 * and ensure healthcare compliance standards are met.
 */

export function withSecurityHeaders(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)

  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Security headers for HIPAA compliance
  const securityHeaders = {
    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // XSS protection for older browsers
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy for privacy protection
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Force HTTPS (only in production)
    'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
      ? 'max-age=31536000; includeSubDomains; preload'
      : 'max-age=0',
    
    // Content Security Policy for healthcare application
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.locumtruerate.com https://*.clerk.accounts.dev https://browser.sentry-cdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://api.locumtruerate.com https://*.clerk.accounts.dev https://*.sentry.io wss://clerk.locumtruerate.com",
      "frame-src 'self' https://*.clerk.accounts.dev",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : ""
    ].filter(Boolean).join('; '),
    
    // Permissions Policy - restrict sensitive APIs for HIPAA compliance
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=()',
      'vibrate=()',
      'fullscreen=(self)',
      'sync-xhr=()'
    ].join(', '),
    
    // Cross-Origin policies for security isolation
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    
    // Cache control for sensitive pages
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add custom headers for audit trail
  response.headers.set('X-Request-ID', crypto.randomUUID())
  response.headers.set('X-Content-Protection', 'HIPAA-Compliant')

  return response
}

/**
 * Get Content Security Policy for specific environments
 */
export function getCSPForEnvironment(env: string = process.env.NODE_ENV || 'development') {
  const baseCSP = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      "'unsafe-eval'",   // Required for development
      "https://clerk.locumtruerate.com",
      "https://*.clerk.accounts.dev",
      "https://browser.sentry-cdn.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components
      "https://fonts.googleapis.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "blob:"
    ],
    'media-src': [
      "'self'",
      "https:"
    ],
    'connect-src': [
      "'self'",
      "https://api.locumtruerate.com",
      "https://*.clerk.accounts.dev",
      "https://*.sentry.io",
      "wss://clerk.locumtruerate.com"
    ],
    'frame-src': [
      "'self'",
      "https://*.clerk.accounts.dev"
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"]
  }

  // Add development-specific allowances
  if (env === 'development') {
    baseCSP['connect-src'].push('ws://localhost:*', 'http://localhost:*')
    baseCSP['script-src'].push('http://localhost:*')
  } else {
    // Production-only directives
    baseCSP['upgrade-insecure-requests'] = []
  }

  // Convert to CSP string format
  return Object.entries(baseCSP)
    .map(([directive, sources]) => 
      sources.length > 0 ? `${directive} ${sources.join(' ')}` : directive
    )
    .join('; ')
}

/**
 * Security headers specifically for API routes
 */
export function getAPISecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-API-Protection': 'HIPAA-Compliant'
  }
}

/**
 * Security headers for static assets
 */
export function getStaticAssetHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cache-Control': 'public, max-age=31536000, immutable'
  }
}