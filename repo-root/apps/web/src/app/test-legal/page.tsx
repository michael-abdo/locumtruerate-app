import Link from 'next/link'

export default function TestLegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            LocumTrueRate Legal Pages - Week 2 Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the legal compliance features implemented in Week 2
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/legal/privacy"
            className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Policy</h3>
            <p className="text-sm text-gray-600">
              Comprehensive GDPR and CCPA compliant privacy policy for healthcare professionals
            </p>
          </Link>

          <Link 
            href="/legal/terms"
            className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms of Service</h3>
            <p className="text-sm text-gray-600">
              Healthcare-specific terms with 12 comprehensive sections
            </p>
          </Link>

          <Link 
            href="/legal/cookies"
            className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-4">🍪</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Policy</h3>
            <p className="text-sm text-gray-600">
              Cookie management with preference controls and opt-out options
            </p>
          </Link>

          <Link 
            href="/legal/gdpr"
            className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-4">🇪🇺</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">GDPR Compliance</h3>
            <p className="text-sm text-gray-600">
              EU data protection rights and compliance information
            </p>
          </Link>
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Week 2 Features Implemented</h2>
          <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
            <li>Legal compliance pages with mobile-first responsive design</li>
            <li>GDPR/CCPA compliant privacy policy with data handling procedures</li>
            <li>Healthcare-specific terms of service with arbitration clauses</li>
            <li>Cookie policy with preference management and third-party opt-outs</li>
            <li>GDPR compliance page with EU data rights and contact information</li>
            <li>Support system infrastructure (requires authentication to test fully)</li>
            <li>API versioning strategy and documentation generation</li>
            <li>Database schema for support tickets and knowledge base</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Note: Some features may require authentication setup or database connection
          </p>
        </div>
      </div>
    </div>
  )
}