'use client'

import './globals.css'
import FloatingSupportButton from '@/components/floating-support-button'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Week 2 Showcase - LocumTrueRate</title>
        <meta name="description" content="Legal Compliance & Support System Demo" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  LocumTrueRate - Week 2 Demo
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-gray-900">Home</a>
                <a href="/legal/privacy" className="text-gray-700 hover:text-gray-900">Legal</a>
                <a href="/support" className="text-gray-700 hover:text-gray-900">Support</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-gray-100 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-600">
              © 2025 LocumTrueRate - Week 2 Showcase Demo
            </p>
          </div>
        </footer>

        {/* Floating Support Widget - Available on all pages */}
        <FloatingSupportButton 
          position="bottom-right" 
          theme="blue" 
          size="md"
        />
      </body>
    </html>
  )
}