'use client'

import React, { useState, useEffect } from 'react'

export default function CookiePolicyPage() {
  const lastUpdated = "January 16, 2024"
  
  // Cookie preference state
  const [cookiePreferences, setCookiePreferences] = useState({
    functional: false,
    analytics: false,
    marketing: false
  })
  
  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('cookiePreferences')
    if (savedPreferences) {
      setCookiePreferences(JSON.parse(savedPreferences))
    }
  }, [])
  
  // Save preferences to localStorage
  const savePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences))
    alert('Cookie preferences saved successfully!')
  }
  
  // Accept all cookies
  const acceptAll = () => {
    const allAccepted = {
      functional: true,
      analytics: true,
      marketing: true
    }
    setCookiePreferences(allAccepted)
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted))
    alert('All cookies accepted!')
  }
  
  // Reject all non-essential cookies
  const rejectAll = () => {
    const allRejected = {
      functional: false,
      analytics: false,
      marketing: false
    }
    setCookiePreferences(allRejected)
    localStorage.setItem('cookiePreferences', JSON.stringify(allRejected))
    alert('All non-essential cookies rejected!')
  }
  
  // Toggle individual cookie preference
  const togglePreference = (type: keyof typeof cookiePreferences) => {
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Cookie Policy
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            How we use cookies and tracking technologies on LocumTrueRate
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Cookie Preference Banner */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🍪</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">Manage Your Cookie Preferences</h2>
                <p className="text-blue-800 text-sm mb-3">
                  You can control which cookies we use through your browser settings or our preference center. 
                  Essential cookies are required for the platform to function properly.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => document.getElementById('cookie-center')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                    Cookie Preferences
                  </button>
                  <button 
                    onClick={acceptAll}
                    className="px-4 py-2 border border-blue-600 text-blue-600 text-sm rounded-md hover:bg-blue-50">
                    Accept All Cookies
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* What Are Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit our website. 
                They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">First-Party Cookies</h3>
                  <p className="text-green-700 text-sm">
                    Set directly by LocumTrueRate to enable core functionality and improve your experience on our platform.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Third-Party Cookies</h3>
                  <p className="text-blue-700 text-sm">
                    Set by external services we use, such as analytics providers and support tools, with your consent.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Session vs Persistent</h3>
                  <p className="text-purple-700 text-sm">
                    Session cookies expire when you close your browser. Persistent cookies remain until they expire or you delete them.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Types of Cookies We Use */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Essential Cookies (Always Active)</h3>
                    <p className="text-red-700 text-sm mb-3">
                      These cookies are necessary for the platform to function and cannot be disabled. They are usually set in response 
                      to actions you take, such as logging in or filling out forms.
                    </p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-red-200">
                            <th className="text-left p-2 text-red-800">Cookie Name</th>
                            <th className="text-left p-2 text-red-800">Purpose</th>
                            <th className="text-left p-2 text-red-800">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-red-700">
                          <tr className="border-b border-red-100">
                            <td className="p-2 font-mono">auth_token</td>
                            <td className="p-2">User authentication and session management</td>
                            <td className="p-2">Session</td>
                          </tr>
                          <tr className="border-b border-red-100">
                            <td className="p-2 font-mono">csrf_token</td>
                            <td className="p-2">Cross-site request forgery protection</td>
                            <td className="p-2">Session</td>
                          </tr>
                          <tr className="border-b border-red-100">
                            <td className="p-2 font-mono">form_data</td>
                            <td className="p-2">Preserve form data during navigation</td>
                            <td className="p-2">1 hour</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono">security_session</td>
                            <td className="p-2">Security monitoring and fraud prevention</td>
                            <td className="p-2">24 hours</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚙️</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Functional Cookies</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      These cookies enhance functionality and personalization, such as remembering your preferences 
                      and settings. You can disable these cookies, but some features may not work properly.
                    </p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-blue-200">
                            <th className="text-left p-2 text-blue-800">Cookie Name</th>
                            <th className="text-left p-2 text-blue-800">Purpose</th>
                            <th className="text-left p-2 text-blue-800">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-blue-700">
                          <tr className="border-b border-blue-100">
                            <td className="p-2 font-mono">user_preferences</td>
                            <td className="p-2">Language, timezone, and display preferences</td>
                            <td className="p-2">1 year</td>
                          </tr>
                          <tr className="border-b border-blue-100">
                            <td className="p-2 font-mono">search_filters</td>
                            <td className="p-2">Remember job search filters and criteria</td>
                            <td className="p-2">30 days</td>
                          </tr>
                          <tr className="border-b border-blue-100">
                            <td className="p-2 font-mono">notification_settings</td>
                            <td className="p-2">Notification preferences and permissions</td>
                            <td className="p-2">6 months</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono">calculator_history</td>
                            <td className="p-2">Recent True Rate calculations</td>
                            <td className="p-2">90 days</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Analytics Cookies</h3>
                    <p className="text-green-700 text-sm mb-3">
                      These cookies help us understand how you use our platform so we can improve it. 
                      All data is anonymized and used for statistical purposes only.
                    </p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-green-200">
                            <th className="text-left p-2 text-green-800">Service</th>
                            <th className="text-left p-2 text-green-800">Purpose</th>
                            <th className="text-left p-2 text-green-800">Duration</th>
                            <th className="text-left p-2 text-green-800">Provider</th>
                          </tr>
                        </thead>
                        <tbody className="text-green-700">
                          <tr className="border-b border-green-100">
                            <td className="p-2">Google Analytics</td>
                            <td className="p-2">Website usage statistics and user behavior</td>
                            <td className="p-2">26 months</td>
                            <td className="p-2">Google</td>
                          </tr>
                          <tr className="border-b border-green-100">
                            <td className="p-2">Mixpanel</td>
                            <td className="p-2">Feature usage and conversion tracking</td>
                            <td className="p-2">1 year</td>
                            <td className="p-2">Mixpanel</td>
                          </tr>
                          <tr className="border-b border-green-100">
                            <td className="p-2">Hotjar</td>
                            <td className="p-2">User experience analysis and heatmaps</td>
                            <td className="p-2">1 year</td>
                            <td className="p-2">Hotjar</td>
                          </tr>
                          <tr>
                            <td className="p-2">Custom Analytics</td>
                            <td className="p-2">Platform-specific metrics and performance</td>
                            <td className="p-2">2 years</td>
                            <td className="p-2">LocumTrueRate</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📢</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">Marketing Cookies</h3>
                    <p className="text-purple-700 text-sm mb-3">
                      These cookies are used to deliver relevant advertisements and measure the effectiveness of marketing campaigns. 
                      They may be set by us or third-party advertising partners.
                    </p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-purple-200">
                            <th className="text-left p-2 text-purple-800">Service</th>
                            <th className="text-left p-2 text-purple-800">Purpose</th>
                            <th className="text-left p-2 text-purple-800">Duration</th>
                            <th className="text-left p-2 text-purple-800">Provider</th>
                          </tr>
                        </thead>
                        <tbody className="text-purple-700">
                          <tr className="border-b border-purple-100">
                            <td className="p-2">Google Ads</td>
                            <td className="p-2">Conversion tracking and remarketing</td>
                            <td className="p-2">90 days</td>
                            <td className="p-2">Google</td>
                          </tr>
                          <tr className="border-b border-purple-100">
                            <td className="p-2">Facebook Pixel</td>
                            <td className="p-2">Social media advertising and tracking</td>
                            <td className="p-2">90 days</td>
                            <td className="p-2">Meta</td>
                          </tr>
                          <tr className="border-b border-purple-100">
                            <td className="p-2">LinkedIn Insight</td>
                            <td className="p-2">Professional network advertising</td>
                            <td className="p-2">90 days</td>
                            <td className="p-2">LinkedIn</td>
                          </tr>
                          <tr>
                            <td className="p-2">Campaign Tracking</td>
                            <td className="p-2">Email and referral campaign performance</td>
                            <td className="p-2">6 months</td>
                            <td className="p-2">LocumTrueRate</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
            
            <div className="space-y-6">
              <div id="cookie-center" className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">LocumTrueRate Cookie Center</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Use our cookie preference center to control which categories of cookies you allow:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-blue-200 rounded p-3 text-center">
                    <div className="text-lg mb-2">⚡</div>
                    <h4 className="font-medium text-blue-800 text-sm">Essential</h4>
                    <p className="text-xs text-blue-600">Always On</p>
                  </div>
                  <div className="bg-white border border-blue-200 rounded p-3 text-center">
                    <div className="text-lg mb-2">⚙️</div>
                    <h4 className="font-medium text-blue-800 text-sm">Functional</h4>
                    <button 
                      onClick={() => togglePreference('functional')}
                      className={`text-xs px-2 py-1 rounded ${
                        cookiePreferences.functional 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                      {cookiePreferences.functional ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="bg-white border border-blue-200 rounded p-3 text-center">
                    <div className="text-lg mb-2">📊</div>
                    <h4 className="font-medium text-blue-800 text-sm">Analytics</h4>
                    <button 
                      onClick={() => togglePreference('analytics')}
                      className={`text-xs px-2 py-1 rounded ${
                        cookiePreferences.analytics 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                      {cookiePreferences.analytics ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="bg-white border border-blue-200 rounded p-3 text-center">
                    <div className="text-lg mb-2">📢</div>
                    <h4 className="font-medium text-blue-800 text-sm">Marketing</h4>
                    <button 
                      onClick={() => togglePreference('marketing')}
                      className={`text-xs px-2 py-1 rounded ${
                        cookiePreferences.marketing 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                      {cookiePreferences.marketing ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={savePreferences}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                    Save Preferences
                  </button>
                  <button 
                    onClick={acceptAll}
                    className="px-4 py-2 border border-blue-600 text-blue-600 text-sm rounded-md hover:bg-blue-50">
                    Accept All
                  </button>
                  <button 
                    onClick={rejectAll}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
                    Reject All
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Browser Settings</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  You can also control cookies through your browser settings. Here's how to manage cookies in popular browsers:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Desktop Browsers</h4>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                      <li><strong>Chrome:</strong> Settings &gt; Privacy & Security &gt; Cookies</li>
                      <li><strong>Firefox:</strong> Preferences &gt; Privacy & Security</li>
                      <li><strong>Safari:</strong> Preferences &gt; Privacy</li>
                      <li><strong>Edge:</strong> Settings &gt; Cookies and site permissions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Mobile Browsers</h4>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                      <li><strong>iOS Safari:</strong> Settings &gt; Safari &gt; Privacy & Security</li>
                      <li><strong>Android Chrome:</strong> Settings &gt; Site settings &gt; Cookies</li>
                      <li><strong>Mobile Firefox:</strong> Settings &gt; Data Management</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Important Note</h3>
                <p className="text-red-700 text-sm">
                  Disabling certain cookies may affect your experience on LocumTrueRate. Essential cookies cannot be disabled 
                  as they are necessary for the platform to function. If you disable functional cookies, some features like 
                  saved preferences and personalized content may not work properly.
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services and Opt-Out</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                We use various third-party services that may set their own cookies. You can opt out of tracking 
                by these services using the links below:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Analytics Services</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Google Analytics</span>
                      <a href="https://tools.google.com/dlpage/gaoptout" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                        Opt Out
                      </a>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Mixpanel</span>
                      <a href="https://mixpanel.com/optout" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                        Opt Out
                      </a>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Hotjar</span>
                      <a href="https://www.hotjar.com/policies/do-not-track/" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                        Opt Out
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Advertising Services</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Google Ads</span>
                      <a href="https://adssettings.google.com/" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                        Ad Settings
                      </a>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Facebook</span>
                      <a href="https://www.facebook.com/settings?tab=ads" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                        Ad Preferences
                      </a>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">LinkedIn</span>
                      <a href="https://www.linkedin.com/psettings/advertising" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                        Ad Settings
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Industry Opt-Out Tools</h3>
                <p className="text-blue-700 text-sm mb-3">
                  You can also use industry-wide opt-out tools to control advertising cookies:
                </p>
                <div className="flex gap-2">
                  <a href="http://optout.aboutads.info/" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    NAI Opt-Out
                  </a>
                  <a href="http://optout.networkadvertising.org/" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    DAA Opt-Out
                  </a>
                  <a href="https://youronlinechoices.eu/" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    EU Choices
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile App Tracking */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mobile App Tracking</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Our mobile apps use similar tracking technologies to cookies, including device identifiers 
                and local storage. You can control these through your device settings:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">iOS Devices</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li><strong>App Tracking:</strong> Settings &gt; Privacy & Security &gt; Tracking</li>
                    <li><strong>Advertising ID:</strong> Settings &gt; Privacy & Security &gt; Apple Advertising</li>
                    <li><strong>Location Services:</strong> Settings &gt; Privacy & Security &gt; Location Services</li>
                    <li><strong>Analytics:</strong> Settings &gt; Privacy & Security &gt; Analytics & Improvements</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Android Devices</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li><strong>Ad Personalization:</strong> Settings &gt; Google &gt; Ads</li>
                    <li><strong>App Permissions:</strong> Settings &gt; Apps &gt; LocumTrueRate &gt; Permissions</li>
                    <li><strong>Location Sharing:</strong> Settings &gt; Location</li>
                    <li><strong>Usage Analytics:</strong> Settings &gt; Google &gt; Usage & Diagnostics</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Contact and Updates */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions and Updates</h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Contact Us</h3>
                <p className="text-green-700 text-sm mb-3">
                  If you have questions about our use of cookies or this policy, please contact us:
                </p>
                <div className="flex gap-2">
                  <a href="mailto:privacy@locumtruerate.com" 
                     className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                    Email Privacy Team
                  </a>
                  <a href="/support" 
                     className="px-3 py-1 border border-green-600 text-green-600 text-xs rounded hover:bg-green-50">
                    Support Center
                  </a>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Policy Updates</h3>
                <p className="text-yellow-700 text-sm">
                  We may update this Cookie Policy from time to time. When we make significant changes, 
                  we will notify you through the platform and update the "Last updated" date at the top of this page. 
                  Your continued use of our services constitutes acceptance of the updated policy.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-gray-500 mb-4 md:mb-0">
                This Cookie Policy is effective as of {lastUpdated}.
              </p>
              <div className="flex gap-2">
                <a href="/legal/privacy" className="text-xs text-blue-600 hover:text-blue-800">Privacy Policy</a>
                <span className="text-xs text-gray-400">•</span>
                <a href="/legal/terms" className="text-xs text-blue-600 hover:text-blue-800">Terms of Service</a>
                <span className="text-xs text-gray-400">•</span>
                <a href="/legal/gdpr" className="text-xs text-blue-600 hover:text-blue-800">GDPR Compliance</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}