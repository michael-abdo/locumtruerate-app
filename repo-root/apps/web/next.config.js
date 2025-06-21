/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  experimental: {
    // Enable experimental features for better performance
    optimizePackageImports: ['lucide-react', '@locumtruerate/ui'],
    // Handle ESM packages
    esmExternals: 'loose',
    // Disable turbo temporarily to fix CSS processing
    // turbo: {
    //   resolveAlias: {
    //     '@locumtruerate/api': '../packages/api/src',
    //     '@locumtruerate/calc-core': '../packages/calc-core/src',
    //     '@locumtruerate/shared': '../packages/shared/src',
    //     '@locumtruerate/types': '../packages/types/src',
    //     '@locumtruerate/ui': '../packages/ui/src'
    //   }
    // }
  },
  
  // Performance optimizations
  swcMinify: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['cdn.locumtruerate.com', 'images.clerk.dev'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // HIPAA-compliant security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Clickjacking protection - prevent embedding in frames
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // MIME type sniffing protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS protection for older browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer policy for privacy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // HTTP Strict Transport Security (HSTS) - HTTPS only
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Content Security Policy for healthcare application
          {
            key: 'Content-Security-Policy',
            value: [
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
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Permissions Policy - restrict sensitive APIs for HIPAA compliance
          {
            key: 'Permissions-Policy',
            value: [
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
            ].join(', ')
          },
          // Cross-Origin Embedder Policy for security isolation
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          // Cross-Origin Opener Policy to prevent window.opener access
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          // Cross-Origin Resource Policy
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/jobs/search',
        destination: '/search/jobs',
        permanent: true
      },
      {
        source: '/calculator',
        destination: '/tools/calculator',
        permanent: true
      }
    ]
  },

  // PWA and mobile optimization
  async rewrites() {
    return [
      {
        source: '/service-worker.js',
        destination: '/_next/static/service-worker.js'
      }
    ]
  },

  // Bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    plugins: [
      require('@next/bundle-analyzer')({
        enabled: true,
        openAnalyzer: true
      })
    ]
  }),

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.1.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    // Production logging configuration
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'ERROR' : 'INFO'),
    DEPLOYMENT_ID: process.env.DEPLOYMENT_ID || 'local-dev',
    DEPLOYMENT_COMMIT_SHA: process.env.DEPLOYMENT_COMMIT_SHA || 'unknown',
    DEPLOYMENT_TIMESTAMP: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString(),
  },

  // Transpile workspace packages
  transpilePackages: [
    '@locumtruerate/api',
    '@locumtruerate/calc-core',
    '@locumtruerate/shared',
    '@locumtruerate/types',
    '@locumtruerate/ui',
    '@locumtruerate/database',
    '@locumtruerate/support'
  ],

  // Webpack configuration for better tree shaking and ESM support
  webpack: (config, { dev, isServer }) => {
    // Handle ESM packages like nanoid
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts'],
      '.jsx': ['.jsx', '.tsx'],
    }

    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        locumtruerate: {
          name: 'locumtruerate',
          test: /[\\/]packages[\\/]/,
          chunks: 'all',
          priority: 10,
        },
      }
    }

    return config
  },

  // Output configuration for static export if needed
  output: process.env.EXPORT ? 'export' : undefined,
  trailingSlash: false,
  skipTrailingSlashRedirect: true,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

// Sentry configuration for healthcare application monitoring
const sentryWebpackPluginOptions = {
  // Healthcare-specific Sentry configuration
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Authentication
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Source maps for production debugging (HIPAA-compliant)
  silent: process.env.NODE_ENV === 'production',
  
  // Upload source maps only in CI/production
  dryRun: process.env.NODE_ENV !== 'production',
  
  // Disable source map upload in development
  disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
  disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
  
  // Hide source maps from the public (security requirement)
  hideSourceMaps: true,
  
  // Release naming for healthcare deployments
  release: {
    name: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION,
    deploy: {
      env: process.env.NODE_ENV
    }
  },
  
  // Error handling during build
  errorHandler: (err, invokeErr, compilation) => {
    compilation.warnings.push('Sentry CLI Plugin: ' + err.message)
  }
}

// Only apply Sentry in production or when explicitly enabled
const shouldUseSentry = process.env.NODE_ENV === 'production' || process.env.ENABLE_SENTRY === 'true'

module.exports = shouldUseSentry 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig