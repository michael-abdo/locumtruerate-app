import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { TRPCProvider } from '@/providers/trpc-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { ToastProvider } from '@/providers/toast-provider'
import { AnalyticsProvider } from '@/providers/analytics-provider'
import { OfflineProvider } from '@/providers/offline-provider'
import { AccessibilityProvider, accessibilityStyles, SkipNavigation } from '@/components/accessibility'
import { AccessibilityManager } from '@/components/layout/accessibility-manager'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'LocumTrueRate - Healthcare Staffing Platform',
    template: '%s | LocumTrueRate'
  },
  description: 'Find the perfect locum tenens opportunities with transparent compensation analysis. Compare contracts, calculate true rates, and advance your healthcare career.',
  keywords: [
    'locum tenens',
    'healthcare jobs',
    'medical staffing',
    'physician jobs',
    'nurse practitioner jobs',
    'healthcare careers',
    'contract calculator',
    'medical contracts'
  ],
  authors: [{ name: 'LocumTrueRate' }],
  creator: 'LocumTrueRate',
  publisher: 'LocumTrueRate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://locumtruerate.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'LocumTrueRate',
    title: 'LocumTrueRate - Healthcare Staffing Platform',
    description: 'Find the perfect locum tenens opportunities with transparent compensation analysis.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LocumTrueRate - Healthcare Staffing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@locumtruerate',
    creator: '@locumtruerate',
    title: 'LocumTrueRate - Healthcare Staffing Platform',
    description: 'Find the perfect locum tenens opportunities with transparent compensation analysis.',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined, // Will be set by ThemeProvider
        variables: {
          colorPrimary: '#2563eb',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorDanger: '#dc2626',
        },
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'shadow-xl border border-gray-200',
          headerTitle: 'text-2xl font-bold text-gray-900',
          socialButtonsBlockButton: 'border border-gray-300 hover:border-gray-400',
        },
      }}
    >
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="LocumTrueRate" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-TileColor" content="#2563eb" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          
          {/* SEO and Performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="//www.google-analytics.com" />
          <link rel="dns-prefetch" href="//analytics.google.com" />
          
          {/* Accessibility Styles */}
          <style dangerouslySetInnerHTML={{ __html: accessibilityStyles }} />
          
          {/* Organization Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'LocumTrueRate',
                description: 'Healthcare staffing platform connecting medical professionals with locum tenens opportunities',
                url: process.env.NEXT_PUBLIC_APP_URL || 'https://locumtruerate.com',
                logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://locumtruerate.com'}/logo.png`,
                industry: 'Healthcare Staffing',
                foundingDate: '2024',
                sameAs: [
                  'https://twitter.com/locumtruerate',
                  'https://linkedin.com/company/locumtruerate'
                ],
                contactPoint: {
                  '@type': 'ContactPoint',
                  contactType: 'customer service',
                  email: 'support@locumtruerate.com'
                }
              }, null, 2)
            }}
          />
        </head>
        <body className={`${inter.className} antialiased min-h-screen bg-background`}>
          <AccessibilityProvider>
            <SkipNavigation />
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TRPCProvider>
                <AnalyticsProvider>
                  <OfflineProvider>
                    <ToastProvider>
                      <div className="relative flex min-h-screen flex-col">
                        <Header />
                        
                        <main 
                          id="main-content"
                          className="flex-1"
                          role="main"
                          tabIndex={-1}
                        >
                          {children}
                        </main>
                        
                        <Footer />
                      </div>
                      
                      {/* Skip to content for screen readers */}
                      <div id="skip-nav-target" />
                      
                      {/* Live region for global announcements */}
                      <div
                        id="global-live-region"
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                      />
                      
                      {/* Assertive live region for urgent announcements */}
                      <div
                        id="global-alert-region"
                        aria-live="assertive"
                        aria-atomic="true"
                        className="sr-only"
                      />
                      
                      {/* Accessibility Manager */}
                      <AccessibilityManager />
                    </ToastProvider>
                  </OfflineProvider>
                </AnalyticsProvider>
              </TRPCProvider>
            </ThemeProvider>
          </AccessibilityProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}