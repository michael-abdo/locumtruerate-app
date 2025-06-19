import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProviderWrapper } from '@/providers/clerk-provider'
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
    default: 'LocumTrueRate - Healthcare Jobs & Salary Calculator',
    template: '%s | LocumTrueRate',
  },
  description: 'Find locum tenens opportunities with transparent compensation. Calculate your take-home pay accurately for any healthcare contract.',
  keywords: ['locum tenens', 'healthcare jobs', 'physician jobs', 'nurse jobs', 'salary calculator', 'contract calculator'],
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
    title: 'LocumTrueRate - Healthcare Jobs & Salary Calculator',
    description: 'Find locum tenens opportunities with transparent compensation. Calculate your take-home pay accurately for any healthcare contract.',
    siteName: 'LocumTrueRate',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LocumTrueRate - Healthcare Jobs & Salary Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocumTrueRate - Healthcare Jobs & Salary Calculator',
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ClerkProviderWrapper>
          <ThemeProvider>
            <TRPCProvider>
              <AnalyticsProvider>
                <OfflineProvider>
                  <ToastProvider>
                    <AccessibilityProvider>
                      <AccessibilityManager />
                      <SkipNavigation />
                      <div className="flex min-h-screen flex-col">
                        <Header />
                        <main className="flex-1">
                          {children}
                        </main>
                        <Footer />
                      </div>
                    </AccessibilityProvider>
                  </ToastProvider>
                </OfflineProvider>
              </AnalyticsProvider>
            </TRPCProvider>
          </ThemeProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  )
}