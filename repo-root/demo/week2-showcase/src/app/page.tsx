export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Week 2 Development Showcase
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Legal Compliance System & Support Infrastructure
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Project Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Development Scope</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>GDPR/CCPA Compliant Legal Pages</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Healthcare-Specific Terms of Service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Advanced Cookie Policy Management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Comprehensive Support System</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Technical Achievements</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>2,500+ lines of production-ready code</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Mobile-first responsive design</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Cross-platform component architecture</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Accessibility WCAG 2.1 compliant</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Legal Compliance System
            </h2>
            <p className="text-gray-600 mb-4">
              Comprehensive legal documentation system designed specifically for healthcare platforms,
              ensuring full compliance with GDPR, CCPA, and HIPAA requirements.
            </p>
            <div className="space-y-3">
              <a href="/legal/privacy" className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                Privacy Policy
              </a>
              <a href="/legal/terms" className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                Terms of Service
              </a>
              <a href="/legal/cookies" className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                Cookie Policy
              </a>
              <a href="/legal/gdpr" className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                GDPR Compliance
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Support System
            </h2>
            <p className="text-gray-600 mb-4">
              Advanced support infrastructure with ticket management, knowledge base, and
              role-based access control for both users and administrators.
            </p>
            <div className="space-y-3">
              <a href="/support" className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded hover:bg-green-700 transition-colors">
                Support Dashboard
              </a>
              <div className="pt-2 text-sm text-gray-500">
                <p>Features include:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Ticket creation & management</li>
                  <li>• Knowledge base search</li>
                  <li>• Priority-based routing</li>
                  <li>• Real-time status updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Development Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">4</p>
              <p className="text-sm text-gray-600">Legal Pages</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">2,500+</p>
              <p className="text-sm text-gray-600">Lines of Code</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">100%</p>
              <p className="text-sm text-gray-600">Mobile Ready</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">WCAG 2.1</p>
              <p className="text-sm text-gray-600">Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}