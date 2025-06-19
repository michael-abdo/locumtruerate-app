/** @type {import('next').NextConfig} */

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

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
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

module.exports = nextConfig