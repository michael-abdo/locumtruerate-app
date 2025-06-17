import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | LocumTrueRate',
  description: 'How LocumTrueRate collects, uses, and protects your personal information in compliance with GDPR, CCPA, and healthcare regulations.',
  robots: 'index, follow',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 16, 2024"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            LocumTrueRate is committed to protecting your privacy and personal data
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Quick Navigation */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Quick Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <a href="#information-collection" className="text-blue-600 hover:text-blue-800">1. Information We Collect</a>
              <a href="#how-we-use" className="text-blue-600 hover:text-blue-800">2. How We Use Information</a>
              <a href="#sharing" className="text-blue-600 hover:text-blue-800">3. Information Sharing</a>
              <a href="#data-security" className="text-blue-600 hover:text-blue-800">4. Data Security</a>
              <a href="#your-rights" className="text-blue-600 hover:text-blue-800">5. Your Rights</a>
              <a href="#cookies" className="text-blue-600 hover:text-blue-800">6. Cookies & Tracking</a>
              <a href="#healthcare-specific" className="text-blue-600 hover:text-blue-800">7. Healthcare Data</a>
              <a href="#international" className="text-blue-600 hover:text-blue-800">8. International Users</a>
              <a href="#changes" className="text-blue-600 hover:text-blue-800">9. Policy Changes</a>
              <a href="#contact" className="text-blue-600 hover:text-blue-800">10. Contact Us</a>
            </div>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> As a healthcare job platform, LocumTrueRate handles sensitive professional information. 
                This policy explains how we protect your data in compliance with healthcare regulations, GDPR, CCPA, and other applicable laws.
              </p>
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-4">
              LocumTrueRate ("we," "our," or "us") operates a healthcare job matching platform that connects healthcare professionals 
              with employers. We are committed to protecting your privacy and handling your personal information with the highest 
              standards of security and transparency.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section id="information-collection" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Name, email address, and phone number</li>
                  <li>Professional credentials and license information</li>
                  <li>Education, certifications, and work experience</li>
                  <li>Resume/CV and supporting documents</li>
                  <li>Professional references and contact information</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Profile and Preferences</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Job preferences (location, specialty, schedule)</li>
                  <li>Salary expectations and compensation requirements</li>
                  <li>Availability and assignment preferences</li>
                  <li>Communication preferences and notification settings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Usage Data</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Log data, IP addresses, and device information</li>
                  <li>Browser type, operating system, and access times</li>
                  <li>Pages visited, features used, and interaction data</li>
                  <li>Search queries and application activities</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Financial Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Payment method information (processed by secure third parties)</li>
                  <li>Billing addresses and tax identification numbers</li>
                  <li>Payroll and compensation calculation data</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. How We Use Information */}
          <section id="how-we-use" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Primary Purposes</h3>
                <ul className="list-disc list-inside text-green-700 space-y-1 ml-4">
                  <li>Matching healthcare professionals with appropriate job opportunities</li>
                  <li>Facilitating communication between candidates and employers</li>
                  <li>Processing applications and managing the hiring process</li>
                  <li>Providing True Rate calculations and compensation insights</li>
                  <li>Customer support and technical assistance</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Platform Improvement</h3>
                <ul className="list-disc list-inside text-blue-700 space-y-1 ml-4">
                  <li>Analytics to improve matching algorithms and user experience</li>
                  <li>Research and development of new features</li>
                  <li>Security monitoring and fraud prevention</li>
                  <li>Performance optimization and technical maintenance</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Legal and Compliance</h3>
                <ul className="list-disc list-inside text-purple-700 space-y-1 ml-4">
                  <li>Compliance with healthcare regulations and licensing requirements</li>
                  <li>Verification of professional credentials and qualifications</li>
                  <li>Legal proceedings and regulatory inquiries</li>
                  <li>Audit and compliance reporting</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Information Sharing */}
          <section id="sharing" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">With Healthcare Employers</h3>
                <p className="text-gray-700 mb-2">
                  We share relevant professional information with potential employers when you apply for positions or express interest:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Resume, qualifications, and professional experience</li>
                  <li>License information and certifications</li>
                  <li>Contact information for interview scheduling</li>
                  <li>Availability and preference information</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Providers</h3>
                <p className="text-gray-700 mb-2">
                  We work with trusted third-party providers who assist with platform operations:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Authentication and identity verification services</li>
                  <li>Payment processing and financial services</li>
                  <li>Background check and credential verification</li>
                  <li>Email and communication services</li>
                  <li>Analytics and performance monitoring</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">We DO NOT Sell Your Data</h3>
                <p className="text-red-700 text-sm">
                  LocumTrueRate does not sell, rent, or trade your personal information to third parties for marketing purposes. 
                  Your professional data is only shared as necessary to provide our job matching services.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Data Security */}
          <section id="data-security" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security and Protection</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Technical Safeguards</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>256-bit SSL encryption for data transmission</li>
                  <li>AES-256 encryption for data at rest</li>
                  <li>Multi-factor authentication for account access</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>SOC 2 Type II compliance monitoring</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Administrative Controls</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Role-based access controls and permissions</li>
                  <li>Background checks for all employees</li>
                  <li>Regular privacy and security training</li>
                  <li>Incident response and breach notification procedures</li>
                  <li>Data retention and disposal policies</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 text-sm">
                <strong>Healthcare Compliance:</strong> Our security measures meet or exceed requirements for handling 
                healthcare professional data, including compliance with relevant portions of HIPAA, state licensing 
                board requirements, and professional credentialing standards.
              </p>
            </div>
          </section>

          {/* 5. Your Rights */}
          <section id="your-rights" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Privacy Rights</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Universal Rights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Access & Portability</h4>
                    <ul className="list-disc list-inside text-blue-700 space-y-1">
                      <li>Request copies of your personal data</li>
                      <li>Export your profile and application data</li>
                      <li>Review how we process your information</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Control & Deletion</h4>
                    <ul className="list-disc list-inside text-blue-700 space-y-1">
                      <li>Update or correct your information</li>
                      <li>Request deletion of your account</li>
                      <li>Restrict certain processing activities</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">GDPR Rights (EU Users)</h3>
                <p className="text-green-700 text-sm mb-2">
                  If you are located in the European Union, you have additional rights under the General Data Protection Regulation:
                </p>
                <ul className="list-disc list-inside text-green-700 space-y-1 text-sm ml-4">
                  <li>Right to object to processing for legitimate interests</li>
                  <li>Right to data portability in machine-readable format</li>
                  <li>Right to lodge complaints with supervisory authorities</li>
                  <li>Right to withdraw consent for consent-based processing</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">CCPA Rights (California Users)</h3>
                <p className="text-purple-700 text-sm mb-2">
                  California residents have specific rights under the California Consumer Privacy Act:
                </p>
                <ul className="list-disc list-inside text-purple-700 space-y-1 text-sm ml-4">
                  <li>Right to know what personal information is collected and used</li>
                  <li>Right to delete personal information (with certain exceptions)</li>
                  <li>Right to opt-out of the sale of personal information</li>
                  <li>Right to non-discrimination for exercising privacy rights</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Exercising Your Rights</h3>
              <p className="text-gray-700 text-sm mb-3">
                To exercise any of these rights, contact us at <a href="mailto:privacy@locumtruerate.com" className="text-blue-600 hover:text-blue-800">privacy@locumtruerate.com</a> 
                or use our privacy request form. We will respond to verified requests within 30 days.
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  Submit Privacy Request
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
                  Download My Data
                </button>
              </div>
            </div>
          </section>

          {/* 6. Cookies and Tracking */}
          <section id="cookies" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, 
                and provide personalized content. You can control cookie preferences through your browser settings.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Essential Cookies</h3>
                  <p className="text-green-700 text-sm mb-2">Required for platform functionality:</p>
                  <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                    <li>Authentication and security</li>
                    <li>Session management</li>
                    <li>Form data preservation</li>
                    <li>Error reporting</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Analytics Cookies</h3>
                  <p className="text-blue-700 text-sm mb-2">Help us improve the platform:</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                    <li>Usage statistics</li>
                    <li>Performance monitoring</li>
                    <li>Feature effectiveness</li>
                    <li>User journey analysis</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Preference Cookies</h3>
                  <p className="text-purple-700 text-sm mb-2">Enhance your experience:</p>
                  <ul className="list-disc list-inside text-purple-700 space-y-1 text-sm">
                    <li>Language and region</li>
                    <li>Display preferences</li>
                    <li>Notification settings</li>
                    <li>Customization options</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Managing Cookie Preferences</h3>
                <p className="text-gray-700 text-sm mb-3">
                  You can control cookies through your browser settings or our cookie preference center. 
                  Note that disabling essential cookies may affect platform functionality.
                </p>
                <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700">
                  Cookie Preferences
                </button>
              </div>
            </div>
          </section>

          {/* 7. Healthcare-Specific Considerations */}
          <section id="healthcare-specific" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Healthcare-Specific Data Handling</h2>
            
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Important Distinction</h3>
                <p className="text-red-700 text-sm">
                  LocumTrueRate is a job matching platform and does not handle Protected Health Information (PHI) 
                  as defined by HIPAA. We only process professional credentialing and employment-related information.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Professional Information We Handle</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Medical licenses and state registrations</li>
                  <li>Board certifications and specialty credentials</li>
                  <li>Professional references and work history</li>
                  <li>Malpractice insurance information</li>
                  <li>Hospital affiliations and privileges</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Credential Verification</h3>
                <p className="text-gray-700 mb-2">
                  We work with licensed verification services to confirm professional credentials:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Primary source verification of licenses and certifications</li>
                  <li>Background checks through authorized screening services</li>
                  <li>Professional reference verification</li>
                  <li>Compliance with state and federal credentialing requirements</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 8. International Users */}
          <section id="international" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                LocumTrueRate primarily serves healthcare professionals in the United States. If you access our 
                platform from outside the US, your information may be transferred to and processed in the United States.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">EU/UK Users</h3>
                <p className="text-blue-700 text-sm mb-2">
                  For users in the European Union or United Kingdom, we ensure adequate protection through:
                </p>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm ml-4">
                  <li>Standard Contractual Clauses (SCCs) with service providers</li>
                  <li>Adequacy decisions where available</li>
                  <li>Additional technical and organizational safeguards</li>
                  <li>Regular compliance assessments and updates</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Canadian Users</h3>
                <p className="text-green-700 text-sm">
                  We recognize the privacy rights of Canadian healthcare professionals and comply with applicable 
                  provincial privacy legislation, including PIPEDA and provincial health information protection acts.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Changes to Policy */}
          <section id="changes" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                We may update this privacy policy periodically to reflect changes in our practices, technology, 
                legal requirements, or other factors. We will notify you of significant changes through:
              </p>

              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Email notifications to your registered address</li>
                <li>Prominent notices on our platform</li>
                <li>In-app notifications for mobile users</li>
                <li>Updated effective dates and version tracking</li>
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Material Changes:</strong> For significant changes that affect your rights or how we handle 
                  your information, we will provide at least 30 days' notice and may require renewed consent where legally required.
                </p>
              </div>
            </div>
          </section>

          {/* 10. Contact Information */}
          <section id="contact" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            
            <div className="space-y-6">
              <p className="text-gray-700">
                If you have questions about this privacy policy or how we handle your personal information, 
                we encourage you to contact us:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">General Privacy Inquiries</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> <a href="mailto:privacy@locumtruerate.com" className="text-blue-600 hover:text-blue-800">privacy@locumtruerate.com</a></p>
                    <p><strong>Response Time:</strong> Within 5 business days</p>
                    <p><strong>Languages:</strong> English, Spanish</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Protection Officer</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> <a href="mailto:dpo@locumtruerate.com" className="text-blue-600 hover:text-blue-800">dpo@locumtruerate.com</a></p>
                    <p><strong>For:</strong> GDPR, CCPA, and compliance matters</p>
                    <p><strong>Response Time:</strong> Within 3 business days</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Mailing Address</h3>
                <div className="text-blue-700 text-sm">
                  <p>LocumTrueRate, Inc.</p>
                  <p>Attn: Privacy Team</p>
                  <p>123 Healthcare Plaza, Suite 456</p>
                  <p>Medical City, MC 12345</p>
                  <p>United States</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  Contact Privacy Team
                </button>
                <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
                  Submit Data Request
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
                  Privacy FAQ
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-gray-500 mb-4 md:mb-0">
                This privacy policy is effective as of {lastUpdated} and replaces all previous versions.
              </p>
              <div className="flex gap-2">
                <a href="/legal/terms" className="text-xs text-blue-600 hover:text-blue-800">Terms of Service</a>
                <span className="text-xs text-gray-400">•</span>
                <a href="/legal/cookies" className="text-xs text-blue-600 hover:text-blue-800">Cookie Policy</a>
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