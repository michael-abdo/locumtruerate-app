import React from 'react'

export function ExploreFeatures() {
  const features = [
    {
      icon: '📈',
      title: 'Export Results',
      description: 'Save calculations as PDF, Excel, or CSV',
      action: 'Click the export button after any calculation',
    },
    {
      icon: '💾',
      title: 'Calculation History',
      description: 'Access all your previous calculations',
      action: 'View in the History tab or sidebar',
    },
    {
      icon: '⚖️',
      title: 'Compare Opportunities',
      description: 'Side-by-side comparison of contracts',
      action: 'Use the Compare tool for multiple contracts',
    },
    {
      icon: '🔔',
      title: 'Job Alerts',
      description: 'Get notified of matching opportunities',
      action: 'Set up alerts in your profile settings',
    },
    {
      icon: '📱',
      title: 'Mobile Access',
      description: 'Use on any device, anywhere',
      action: 'Same features on web and mobile',
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is encrypted and secure',
      action: 'All calculations are private to you',
    },
  ]

  return (
    <div className="py-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Powerful Features at Your Fingertips
        </h3>
        <p className="text-gray-600">
          Discover tools that make financial planning effortless
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-onboarding="feature-nav">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{feature.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {feature.description}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  {feature.action}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🚀</span>
          <h4 className="font-semibold text-gray-900">Ready to Get Started?</h4>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          You now have everything you need to make informed financial decisions about 
          your healthcare career opportunities.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-2 rounded border">
            <span className="font-medium text-green-700">✓ Profile Setup</span>
          </div>
          <div className="bg-white p-2 rounded border">
            <span className="font-medium text-green-700">✓ Calculator Basics</span>
          </div>
          <div className="bg-white p-2 rounded border">
            <span className="font-medium text-green-700">✓ Feature Overview</span>
          </div>
        </div>
      </div>
    </div>
  )
}