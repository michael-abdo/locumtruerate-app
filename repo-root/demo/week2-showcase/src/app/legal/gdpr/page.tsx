'use client'

import React, { useState } from 'react'

export default function GDPRCompliancePage() {
  const lastUpdated = "January 16, 2024"
  
  // Local state for any interactive elements
  const [activeTab, setActiveTab] = useState('rights')
  const [showRequestForm, setShowRequestForm] = useState(false)

  const handleDataRequest = (requestType: string) => {
    // In a real app, this would trigger an API call
    console.log(`GDPR Request: ${requestType}`)
    alert(`Your ${requestType} request has been submitted. We'll respond within 72 hours.`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            GDPR Compliance
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            How LocumTrueRate protects EU healthcare professionals under GDPR
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* EU Flag Notice */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🇪🇺</span>
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">For EU Healthcare Professionals</h2>
                <p className="text-blue-800 text-sm mb-2">
                  This page explains how LocumTrueRate complies with the General Data Protection Regulation (GDPR) 
                  when processing personal data of healthcare professionals located in the European Union.
                </p>
                <p className="text-blue-700 text-sm">
                  <strong>Your Rights:</strong> As an EU resident, you have enhanced rights over your personal data. 
                  We are committed to protecting these rights while connecting you with healthcare opportunities.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => handleDataRequest('data export')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-lg mb-2">📋</div>
              <h3 className="font-medium text-gray-900 mb-1">Request My Data</h3>
              <p className="text-sm text-gray-600">Download all personal data we hold about you</p>
            </button>
            <button 
              onClick={() => handleDataRequest('data update')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-lg mb-2">✏️</div>
              <h3 className="font-medium text-gray-900 mb-1">Update My Data</h3>
              <p className="text-sm text-gray-600">Correct or update your personal information</p>
            </button>
            <button 
              onClick={() => handleDataRequest('data deletion')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-lg mb-2">🗑️</div>
              <h3 className="font-medium text-gray-900 mb-1">Delete My Data</h3>
              <p className="text-sm text-gray-600">Request deletion of your personal data</p>
            </button>
          </div>

          {/* Legal Basis for Processing */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Legal Basis for Processing Your Data</h2>
            
            <p className="text-gray-700 mb-4">
              Under GDPR, we must have a legal basis for processing your personal data. We rely on the following lawful bases:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Contractual Necessity</h3>
                <p className="text-green-700 text-sm mb-2">
                  Processing necessary to perform our contract with you:
                </p>
                <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                  <li>Creating and managing your account</li>
                  <li>Matching you with job opportunities</li>
                  <li>Facilitating communications with employers</li>
                  <li>Providing customer support</li>
                  <li>Processing payments for premium services</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Legitimate Interests</h3>
                <p className="text-blue-700 text-sm mb-2">
                  Processing for our legitimate business interests:
                </p>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                  <li>Improving our platform and services</li>
                  <li>Security and fraud prevention</li>
                  <li>Analytics and performance monitoring</li>
                  <li>Research and development</li>
                  <li>Direct marketing (with opt-out option)</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">Legal Compliance</h3>
                <p className="text-purple-700 text-sm mb-2">
                  Processing required by law:
                </p>
                <ul className="list-disc list-inside text-purple-700 space-y-1 text-sm">
                  <li>Professional license verification</li>
                  <li>Tax and financial reporting</li>
                  <li>Regulatory compliance</li>
                  <li>Legal proceedings and investigations</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Consent</h3>
                <p className="text-yellow-700 text-sm mb-2">
                  Processing based on your explicit consent:
                </p>
                <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                  <li>Marketing communications</li>
                  <li>Optional data sharing for research</li>
                  <li>Enhanced profile features</li>
                  <li>Third-party integrations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your GDPR Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights Under GDPR</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Right to Information (Articles 13 & 14)</h3>
                <p className="text-blue-700 text-sm mb-2">
                  You have the right to know how we collect and use your personal data:
                </p>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm ml-4">
                  <li>What data we collect and why</li>
                  <li>How long we keep your data</li>
                  <li>Who we share your data with</li>
                  <li>Your rights and how to exercise them</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Right of Access (Article 15)</h3>
                  <p className="text-green-700 text-sm mb-2">You can request:</p>
                  <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                    <li>Copies of all personal data we hold</li>
                    <li>Information about how we process your data</li>
                    <li>Details about data sharing and transfers</li>
                  </ul>
                  <button 
                    onClick={() => handleDataRequest('data access')}
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                  >
                    Request Data Copy
                  </button>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Right to Rectification (Article 16)</h3>
                  <p className="text-purple-700 text-sm mb-2">You can request:</p>
                  <ul className="list-disc list-inside text-purple-700 space-y-1 text-sm">
                    <li>Correction of inaccurate data</li>
                    <li>Completion of incomplete data</li>
                    <li>Updates to outdated information</li>
                  </ul>
                  <button 
                    onClick={() => handleDataRequest('data rectification')}
                    className="mt-2 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                  >
                    Update My Data
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Right to Erasure (Article 17)</h3>
                  <p className="text-red-700 text-sm mb-2">"Right to be forgotten" when:</p>
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li>Data no longer necessary for original purpose</li>
                    <li>You withdraw consent</li>
                    <li>Data processed unlawfully</li>
                  </ul>
                  <button 
                    onClick={() => handleDataRequest('data erasure')}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Request Deletion
                  </button>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">Right to Restrict (Article 18)</h3>
                  <p className="text-orange-700 text-sm mb-2">You can request we limit processing when:</p>
                  <ul className="list-disc list-inside text-orange-700 space-y-1 text-sm">
                    <li>Accuracy is contested</li>
                    <li>Processing is unlawful</li>
                    <li>You object to processing</li>
                  </ul>
                  <button 
                    onClick={() => handleDataRequest('processing restriction')}
                    className="mt-2 px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                  >
                    Restrict Processing
                  </button>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-indigo-800 mb-2">Right to Portability (Article 20)</h3>
                  <p className="text-indigo-700 text-sm mb-2">You can request:</p>
                  <ul className="list-disc list-inside text-indigo-700 space-y-1 text-sm">
                    <li>Data in machine-readable format</li>
                    <li>Direct transfer to another service</li>
                    <li>Export of consent-based data</li>
                  </ul>
                  <button 
                    onClick={() => handleDataRequest('data portability')}
                    className="mt-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                  >
                    Export Data
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Right to Object (Article 21)</h3>
                  <p className="text-gray-700 text-sm mb-2">You can object to:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Processing for legitimate interests</li>
                    <li>Direct marketing communications</li>
                    <li>Profiling and automated decision-making</li>
                  </ul>
                  <button 
                    onClick={() => handleDataRequest('processing objection')}
                    className="mt-2 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                  >
                    Object to Processing
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Data Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">International Data Transfers</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                LocumTrueRate primarily operates in the United States. When we transfer your personal data 
                outside the EU/EEA, we ensure adequate protection through:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Standard Contractual Clauses (SCCs)</h3>
                  <p className="text-blue-700 text-sm mb-2">
                    We use EU-approved Standard Contractual Clauses with our US operations and service providers:
                  </p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                    <li>Legally binding data protection obligations</li>
                    <li>Your rights remain enforceable</li>
                    <li>Regular compliance monitoring</li>
                    <li>Suspension rights for non-compliance</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Additional Safeguards</h3>
                  <p className="text-green-700 text-sm mb-2">
                    We implement supplementary measures for enhanced protection:
                  </p>
                  <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                    <li>End-to-end encryption for data transmission</li>
                    <li>AES-256 encryption for data at rest</li>
                    <li>Access controls and audit logging</li>
                    <li>Regular security assessments</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">US Service Providers</h3>
                <p className="text-yellow-700 text-sm mb-2">
                  We work with the following types of US-based service providers under appropriate safeguards:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">☁️</span>
                    <h4 className="font-medium text-yellow-800">Cloud Infrastructure</h4>
                    <p className="text-xs text-yellow-700">AWS, Google Cloud (with SCCs)</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">💳</span>
                    <h4 className="font-medium text-yellow-800">Payment Processing</h4>
                    <p className="text-xs text-yellow-700">Stripe (PCI DSS compliant)</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📧</span>
                    <h4 className="font-medium text-yellow-800">Email Services</h4>
                    <p className="text-xs text-yellow-700">SendGrid (with SCCs)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention Periods</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                We only keep your personal data as long as necessary for the purposes we collected it. 
                Here are our retention periods:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Active Account Data</h3>
                  <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                    <li><strong>Profile & Credentials:</strong> While account is active</li>
                    <li><strong>Application History:</strong> 3 years after last activity</li>
                    <li><strong>Communication Records:</strong> 2 years for support purposes</li>
                    <li><strong>Payment Data:</strong> 7 years for tax compliance</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">After Account Deletion</h3>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                    <li><strong>Personal Data:</strong> Deleted within 30 days</li>
                    <li><strong>Anonymized Analytics:</strong> Retained indefinitely</li>
                    <li><strong>Legal/Financial Records:</strong> 7 years minimum</li>
                    <li><strong>Backup Systems:</strong> Purged within 90 days</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Automated Deletion</h3>
                <p className="text-yellow-700 text-sm">
                  We use automated systems to delete data when retention periods expire. You can also request 
                  immediate deletion of your account and personal data at any time, subject to legal obligations.
                </p>
              </div>
            </div>
          </section>

          {/* Exercising Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Exercise Your Rights</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Submit a Request</h3>
                <p className="text-blue-700 text-sm mb-3">
                  You can exercise your GDPR rights through multiple channels:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🌐</span>
                    <h4 className="font-medium text-blue-800">Online Form</h4>
                    <p className="text-xs text-blue-700 mb-2">Privacy request portal</p>
                    <button 
                      onClick={() => setShowRequestForm(true)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Submit Request
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📧</span>
                    <h4 className="font-medium text-blue-800">Email</h4>
                    <p className="text-xs text-blue-700 mb-2">gdpr@locumtruerate.com</p>
                    <a 
                      href="mailto:gdpr@locumtruerate.com"
                      className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Send Email
                    </a>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📞</span>
                    <h4 className="font-medium text-blue-800">Phone</h4>
                    <p className="text-xs text-blue-700 mb-2">+1-800-GDPR-REQ</p>
                    <a 
                      href="tel:+1800GDPRREQ"
                      className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Call Us
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">What to Include</h3>
                <p className="text-green-700 text-sm mb-2">To process your request quickly, please provide:</p>
                <ul className="list-disc list-inside text-green-700 space-y-1 text-sm ml-4">
                  <li>Your full name and email address</li>
                  <li>Specific right you want to exercise</li>
                  <li>Clear description of your request</li>
                  <li>Proof of identity (for security)</li>
                  <li>Any relevant account information</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Response Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-purple-800">Initial Response</h4>
                    <p className="text-purple-700">Within 72 hours</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-800">Full Response</h4>
                    <p className="text-purple-700">Within 30 days</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-800">Complex Requests</h4>
                    <p className="text-purple-700">Up to 60 days (with notice)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Our Data Protection Team</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Protection Officer</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> <a href="mailto:dpo@locumtruerate.com" className="text-blue-600 hover:text-blue-800">dpo@locumtruerate.com</a></p>
                  <p><strong>Phone:</strong> +1-800-DPO-HELP</p>
                  <p><strong>Languages:</strong> English, German, French, Spanish</p>
                  <p><strong>Office Hours:</strong> 9 AM - 6 PM CET</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">EU Representative</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Company:</strong> LocumTrueRate EU Data Services B.V.</p>
                  <p><strong>Address:</strong> Prinsengracht 263-267<br />1016 GV Amsterdam, Netherlands</p>
                  <p><strong>Email:</strong> <a href="mailto:eu-rep@locumtruerate.com" className="text-blue-600 hover:text-blue-800">eu-rep@locumtruerate.com</a></p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Supervisory Authority Complaints</h3>
              <p className="text-red-700 text-sm">
                If you believe we have not adequately addressed your concerns, you have the right to lodge a complaint 
                with your local data protection supervisory authority. For a list of EU supervisory authorities, 
                visit: <a href="https://edpb.europa.eu/about-edpb/board/members_en" className="underline" target="_blank" rel="noopener">edpb.europa.eu</a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-gray-500 mb-4 md:mb-0">
                This GDPR compliance information is effective as of {lastUpdated}.
              </p>
              <div className="flex gap-2">
                <a href="/legal/privacy" className="text-xs text-blue-600 hover:text-blue-800">Privacy Policy</a>
                <span className="text-xs text-gray-400">•</span>
                <a href="/legal/terms" className="text-xs text-blue-600 hover:text-blue-800">Terms of Service</a>
                <span className="text-xs text-gray-400">•</span>
                <a href="/legal/cookies" className="text-xs text-blue-600 hover:text-blue-800">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Submit GDPR Request</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                handleDataRequest('form submission')
                setShowRequestForm(false)
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Request Type</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2">
                    <option>Data Access</option>
                    <option>Data Update</option>
                    <option>Data Deletion</option>
                    <option>Data Export</option>
                    <option>Processing Restriction</option>
                    <option>Processing Objection</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Your Email</label>
                  <input type="email" className="w-full border border-gray-300 rounded px-3 py-2" required />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea className="w-full border border-gray-300 rounded px-3 py-2" rows={3} required></textarea>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Submit Request
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowRequestForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}