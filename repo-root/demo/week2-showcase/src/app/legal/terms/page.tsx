'use client'

import React from 'react'

export default function TermsOfServicePage() {
  const lastUpdated = "January 16, 2024"
  const effectiveDate = "January 16, 2024"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Legal terms and conditions for using LocumTrueRate
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated} • Effective: {effectiveDate}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Quick Navigation */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Quick Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <a href="#acceptance" className="text-blue-600 hover:text-blue-800">1. Acceptance of Terms</a>
              <a href="#description" className="text-blue-600 hover:text-blue-800">2. Service Description</a>
              <a href="#eligibility" className="text-blue-600 hover:text-blue-800">3. Eligibility & Registration</a>
              <a href="#user-responsibilities" className="text-blue-600 hover:text-blue-800">4. User Responsibilities</a>
              <a href="#prohibited-conduct" className="text-blue-600 hover:text-blue-800">5. Prohibited Conduct</a>
              <a href="#content-policy" className="text-blue-600 hover:text-blue-800">6. Content & Intellectual Property</a>
              <a href="#privacy-data" className="text-blue-600 hover:text-blue-800">7. Privacy & Data</a>
              <a href="#fees-payments" className="text-blue-600 hover:text-blue-800">8. Fees & Payments</a>
              <a href="#disclaimers" className="text-blue-600 hover:text-blue-800">9. Disclaimers & Limitations</a>
              <a href="#termination" className="text-blue-600 hover:text-blue-800">10. Termination</a>
              <a href="#dispute-resolution" className="text-blue-600 hover:text-blue-800">11. Dispute Resolution</a>
              <a href="#miscellaneous" className="text-blue-600 hover:text-blue-800">12. Miscellaneous</a>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h2>
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Please read these terms carefully.</strong> By accessing or using LocumTrueRate, you agree to be bound by these terms. 
              If you do not agree to these terms, do not use our services.
            </p>
            <p className="text-sm text-yellow-800">
              <strong>Healthcare Professionals:</strong> This platform facilitates job matching only. You remain responsible 
              for verifying employer credentials, license requirements, and compliance with professional standards.
            </p>
          </div>

          {/* 1. Acceptance of Terms */}
          <section id="acceptance" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and LocumTrueRate, Inc. 
                ("LocumTrueRate," "we," "us," or "our") regarding your use of our website, mobile applications, and related services 
                (collectively, the "Service").
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Agreement Formation</h3>
                <p className="text-blue-700 text-sm mb-2">You agree to these terms by:</p>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm ml-4">
                  <li>Creating an account on our platform</li>
                  <li>Accessing or using any part of our Service</li>
                  <li>Clicking "I Accept" or similar acknowledgment</li>
                  <li>Continuing to use the Service after term updates</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Related Agreements</h3>
                <p className="text-gray-700 text-sm">
                  These Terms incorporate by reference our Privacy Policy, Cookie Policy, and any additional terms 
                  applicable to specific features or services you use.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Service Description */}
          <section id="description" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            
            <div className="space-y-6">
              <p className="text-gray-700">
                LocumTrueRate is a healthcare job matching platform that connects qualified healthcare professionals 
                with employers seeking temporary, contract, and permanent staffing solutions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">For Healthcare Professionals</h3>
                  <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                    <li>Job search and application tools</li>
                    <li>True Rate compensation calculator</li>
                    <li>Profile and credential management</li>
                    <li>Direct communication with employers</li>
                    <li>Contract and assignment tracking</li>
                    <li>Professional development resources</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">For Healthcare Employers</h3>
                  <ul className="list-disc list-inside text-purple-700 space-y-1 text-sm">
                    <li>Job posting and candidate sourcing</li>
                    <li>Candidate screening and verification</li>
                    <li>Application and interview management</li>
                    <li>Credential and license verification</li>
                    <li>Competitive compensation analysis</li>
                    <li>Compliance and reporting tools</li>
                  </ul>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Service Limitations</h3>
                <p className="text-red-700 text-sm">
                  LocumTrueRate is a platform service only. We do not employ healthcare professionals, provide healthcare services, 
                  or guarantee job placement. Employment relationships are directly between healthcare professionals and employers.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Eligibility and Registration */}
          <section id="eligibility" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Eligibility and Registration</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Eligibility Requirements</h3>
                <p className="text-gray-700 mb-2">To use LocumTrueRate, you must:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Be at least 18 years of age</li>
                  <li>Have legal authorization to work in the United States</li>
                  <li>For healthcare professionals: Hold valid, current professional licenses</li>
                  <li>For employers: Be legally authorized to hire healthcare professionals</li>
                  <li>Provide accurate and complete information during registration</li>
                  <li>Maintain the security and confidentiality of your account credentials</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Registration</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Healthcare Professional Requirements</h4>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm ml-4">
                    <li>Valid professional license in good standing</li>
                    <li>Current malpractice insurance (for clinical roles)</li>
                    <li>Completed professional education and training</li>
                    <li>Clean background check and drug screening</li>
                    <li>Compliance with continuing education requirements</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-green-800 mb-2">Employer Requirements</h4>
                  <ul className="list-disc list-inside text-green-700 space-y-1 text-sm ml-4">
                    <li>Valid business license and healthcare facility certification</li>
                    <li>Compliance with local, state, and federal employment laws</li>
                    <li>Appropriate malpractice and liability insurance coverage</li>
                    <li>Credentialing and privileging processes in place</li>
                    <li>Verification of identity and authority to hire</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Security</h3>
                <p className="text-gray-700 mb-2">You are responsible for:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Immediately notifying us of any unauthorized access or security breach</li>
                  <li>Using strong passwords and enabling two-factor authentication when available</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. User Responsibilities */}
          <section id="user-responsibilities" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Professional Standards</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm mb-2">
                    <strong>Healthcare Professionals:</strong> You must maintain all professional standards, licenses, 
                    and certifications required for your practice. This includes:
                  </p>
                  <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm ml-4">
                    <li>Keeping licenses current and in good standing</li>
                    <li>Complying with continuing education requirements</li>
                    <li>Maintaining professional liability insurance</li>
                    <li>Following scope of practice limitations</li>
                    <li>Adhering to professional ethics and standards</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Information Accuracy</h3>
                <p className="text-gray-700 mb-2">You agree to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Update your profile and credentials promptly when changes occur</li>
                  <li>Verify all information before submission</li>
                  <li>Report any errors or discrepancies immediately</li>
                  <li>Maintain documentation to support your credentials and qualifications</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Communication Standards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Professional Communication</h4>
                    <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                      <li>Maintain professional tone and language</li>
                      <li>Respond to communications promptly</li>
                      <li>Respect confidentiality and privacy</li>
                      <li>Use secure communication methods</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Platform Usage</h4>
                    <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                      <li>Use the platform for intended purposes only</li>
                      <li>Respect other users' rights and privacy</li>
                      <li>Follow all posted guidelines and policies</li>
                      <li>Report violations or concerns promptly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Prohibited Conduct */}
          <section id="prohibited-conduct" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Conduct</h2>
            
            <div className="space-y-6">
              <p className="text-gray-700">
                The following activities are strictly prohibited on our platform:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">Account Misuse</h3>
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li>Creating false or misleading profiles</li>
                    <li>Impersonating another person or entity</li>
                    <li>Using multiple accounts to evade restrictions</li>
                    <li>Sharing account credentials with others</li>
                    <li>Automated account creation or usage</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3">Professional Misconduct</h3>
                  <ul className="list-disc list-inside text-orange-700 space-y-1 text-sm">
                    <li>Misrepresenting credentials or qualifications</li>
                    <li>Practicing beyond scope of license</li>
                    <li>Violating professional ethics standards</li>
                    <li>Engaging in unlicensed practice</li>
                    <li>Fraudulent credentialing or documentation</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">Platform Abuse</h3>
                  <ul className="list-disc list-inside text-purple-700 space-y-1 text-sm">
                    <li>Spamming or unsolicited communications</li>
                    <li>Attempting to circumvent security measures</li>
                    <li>Disrupting platform functionality</li>
                    <li>Harvesting user data without permission</li>
                    <li>Reverse engineering or unauthorized access</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Legal Violations</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Discrimination or harassment</li>
                    <li>Posting illegal or harmful content</li>
                    <li>Violating intellectual property rights</li>
                    <li>Engaging in fraudulent activities</li>
                    <li>Non-compliance with healthcare regulations</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Enforcement</h3>
                <p className="text-yellow-700 text-sm">
                  Violations may result in account suspension, termination, removal of content, legal action, 
                  and reporting to relevant professional licensing boards or regulatory authorities.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Content and Intellectual Property */}
          <section id="content-policy" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Content and Intellectual Property</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">User Content</h3>
                <p className="text-gray-700 mb-2">
                  You retain ownership of content you submit to our platform, but grant us certain rights to use it:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">License Grant</h4>
                  <p className="text-blue-700 text-sm mb-2">
                    You grant LocumTrueRate a worldwide, non-exclusive, royalty-free license to:
                  </p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm ml-4">
                    <li>Display your profile and credentials to potential employers</li>
                    <li>Process and analyze your information to improve matching</li>
                    <li>Store and transmit your content through our systems</li>
                    <li>Create anonymized aggregated data for analytics</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">LocumTrueRate Intellectual Property</h3>
                <p className="text-gray-700 mb-2">
                  Our platform, including software, algorithms, designs, and content, is protected by intellectual property laws:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Trademarks: "LocumTrueRate" and related marks</li>
                  <li>Proprietary algorithms and matching technology</li>
                  <li>Platform design, user interface, and user experience</li>
                  <li>Documentation, guides, and educational content</li>
                  <li>True Rate calculation methodology and tools</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Content Standards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Acceptable Content</h4>
                    <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                      <li>Accurate professional information</li>
                      <li>Legitimate job postings and descriptions</li>
                      <li>Professional communications</li>
                      <li>Relevant educational content</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Prohibited Content</h4>
                    <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                      <li>False or misleading information</li>
                      <li>Discriminatory job postings</li>
                      <li>Personal health information (PHI)</li>
                      <li>Copyrighted material without permission</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Privacy and Data Protection */}
          <section id="privacy-data" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Your privacy is important to us. Our collection, use, and protection of your personal information 
                is governed by our Privacy Policy, which is incorporated into these Terms.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Key Privacy Principles</h3>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm ml-4">
                  <li>We only collect information necessary for our services</li>
                  <li>Your data is encrypted and securely stored</li>
                  <li>We do not sell your personal information to third parties</li>
                  <li>You have control over your privacy settings and data</li>
                  <li>We comply with applicable privacy laws (GDPR, CCPA, etc.)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Healthcare Data Notice</h3>
                <p className="text-yellow-700 text-sm">
                  While we handle professional healthcare information, LocumTrueRate is not a covered entity under HIPAA. 
                  We do not access, store, or process Protected Health Information (PHI) about patients.
                </p>
              </div>

              <div className="flex gap-2">
                <a href="/legal/privacy" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  Read Full Privacy Policy
                </a>
                <a href="/legal/gdpr" className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
                  GDPR Compliance
                </a>
              </div>
            </div>
          </section>

          {/* 8. Fees and Payments */}
          <section id="fees-payments" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Fees and Payments</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Fees</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Healthcare Professionals</h4>
                    <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                      <li>Basic job search and applications: Free</li>
                      <li>Premium features and priority listing: Subscription fees</li>
                      <li>Advanced analytics and insights: Tiered pricing</li>
                      <li>Certification and verification services: One-time fees</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">Healthcare Employers</h4>
                    <ul className="list-disc list-inside text-purple-700 space-y-1 text-sm">
                      <li>Job posting fees: Per listing or subscription</li>
                      <li>Candidate access and communication: Included</li>
                      <li>Premium screening and verification: Additional fees</li>
                      <li>Enterprise solutions: Custom pricing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Terms</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                    <li>All fees are payable in advance unless otherwise specified</li>
                    <li>Subscription fees are billed monthly or annually</li>
                    <li>Payment methods include credit cards and ACH transfers</li>
                    <li>Automatic renewal for subscriptions unless cancelled</li>
                    <li>Pro-rated refunds for unused subscription periods</li>
                    <li>Late payment fees may apply to overdue accounts</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Refunds and Cancellations</h3>
                <p className="text-gray-700 mb-2">
                  Refund eligibility depends on the specific service and circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Subscription cancellations: 30-day notice required</li>
                  <li>Unused subscription credits: Pro-rated refund available</li>
                  <li>One-time service fees: Generally non-refundable</li>
                  <li>Technical issues: Full refund if service unavailable</li>
                  <li>Account violations: No refund for terminated accounts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 9. Disclaimers and Limitations */}
          <section id="disclaimers" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers and Limitation of Liability</h2>
            
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Important Disclaimers</h3>
                <div className="text-red-700 text-sm space-y-2">
                  <p><strong>No Employment Guarantee:</strong> We do not guarantee job placement, employment offers, or hiring outcomes.</p>
                  <p><strong>Platform Only:</strong> We are a technology platform connecting parties; we are not an employer or employment agency.</p>
                  <p><strong>User Verification:</strong> While we provide verification tools, users are responsible for their own due diligence.</p>
                  <p><strong>Professional Responsibility:</strong> Healthcare professionals remain solely responsible for their practice and compliance.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Availability</h3>
                <p className="text-gray-700 mb-2">
                  Our Service is provided "as is" and "as available." We make no warranties regarding:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Continuous, uninterrupted, or error-free operation</li>
                  <li>Accuracy or completeness of information on the platform</li>
                  <li>Compatibility with all devices or systems</li>
                  <li>Security against all possible threats or vulnerabilities</li>
                  <li>Results or outcomes from using our services</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Limitation of Liability</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm mb-2">
                    <strong>IMPORTANT:</strong> To the maximum extent permitted by law, LocumTrueRate's total liability 
                    for any claims arising from your use of our services is limited to:
                  </p>
                  <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm ml-4">
                    <li>The amount you paid to us in the 12 months preceding the claim</li>
                    <li>$100 if you have not paid any fees to us</li>
                    <li>We are not liable for indirect, consequential, or punitive damages</li>
                    <li>We are not liable for loss of profits, data, or business opportunities</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 10. Termination */}
          <section id="termination" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Termination by You</h3>
                <p className="text-gray-700 mb-2">
                  You may terminate your account at any time by:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Using the account deletion option in your profile settings</li>
                  <li>Contacting our support team to request account closure</li>
                  <li>Providing 30 days notice for employer accounts with active job postings</li>
                  <li>Settling any outstanding fees or obligations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Termination by LocumTrueRate</h3>
                <p className="text-gray-700 mb-2">
                  We reserve the right to suspend or terminate your account if:
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li>You violate these Terms of Service or other policies</li>
                    <li>You provide false or misleading information</li>
                    <li>You engage in fraudulent or illegal activities</li>
                    <li>You fail to maintain required professional credentials</li>
                    <li>You abuse the platform or harass other users</li>
                    <li>You fail to pay fees when due after repeated notices</li>
                    <li>We are required to do so by law or regulatory order</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Effects of Termination</h3>
                <p className="text-gray-700 mb-2">
                  Upon termination of your account:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Your access to the platform will be immediately revoked</li>
                  <li>Active job postings or applications will be cancelled</li>
                  <li>Unpaid fees remain due and payable</li>
                  <li>Your data will be handled according to our Privacy Policy</li>
                  <li>You may request data export within 30 days of termination</li>
                  <li>Certain provisions of these Terms survive termination</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Surviving Provisions</h3>
                <p className="text-blue-700 text-sm">
                  The following sections survive termination: Intellectual Property, Disclaimers, 
                  Limitation of Liability, Indemnification, Dispute Resolution, and any provisions 
                  that by their nature should survive.
                </p>
              </div>
            </div>
          </section>

          {/* 11. Dispute Resolution */}
          <section id="dispute-resolution" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Dispute Resolution</h2>
            
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">PLEASE READ CAREFULLY</h3>
                <p className="text-yellow-700 text-sm">
                  This section affects your legal rights and includes an arbitration agreement and class action waiver. 
                  By agreeing to these Terms, you agree to resolve disputes through binding arbitration rather than court proceedings.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Informal Resolution</h3>
                <p className="text-gray-700 mb-2">
                  Before initiating formal proceedings, we encourage you to contact us to seek informal resolution:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Email: disputes@locumtruerate.com</li>
                  <li>Response time: Within 10 business days</li>
                  <li>Good faith negotiation period: 30 days</li>
                  <li>Most disputes can be resolved without formal proceedings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Binding Arbitration</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Arbitration Agreement</h4>
                  <p className="text-blue-700 text-sm mb-2">
                    Any dispute not resolved informally will be resolved through binding arbitration:
                  </p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm ml-4">
                    <li>Arbitration administered by JAMS under its Streamlined Arbitration Rules</li>
                    <li>Location: San Francisco, California (or via video conference)</li>
                    <li>One neutral arbitrator selected jointly</li>
                    <li>English language proceedings</li>
                    <li>Limited discovery as determined by arbitrator</li>
                    <li>Arbitrator's decision is final and binding</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Class Action Waiver</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm font-semibold mb-2">
                    YOU AND LOCUMTRUERATE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR 
                    OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED 
                    CLASS OR REPRESENTATIVE PROCEEDING.
                  </p>
                  <p className="text-red-700 text-sm">
                    The arbitrator may not consolidate more than one person's claims and may not preside 
                    over any form of representative or class proceeding.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Exceptions</h3>
                <p className="text-gray-700 mb-2">
                  The following disputes are not subject to arbitration:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Small claims court actions within jurisdictional limits</li>
                  <li>Injunctive relief for intellectual property violations</li>
                  <li>Disputes that cannot be arbitrated under applicable law</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Opt-Out Right</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 text-sm">
                    You have the right to opt out of this arbitration agreement by sending written notice 
                    to optout@locumtruerate.com within 30 days of first accepting these Terms. If you opt out, 
                    disputes will be resolved in court subject to the terms below.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Governing Law and Jurisdiction</h3>
                <p className="text-gray-700">
                  These Terms are governed by the laws of the State of California, without regard to conflict 
                  of law principles. If arbitration is not applicable, you agree to the exclusive jurisdiction 
                  of the state and federal courts located in San Francisco County, California.
                </p>
              </div>
            </div>
          </section>

          {/* 12. Miscellaneous */}
          <section id="miscellaneous" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Miscellaneous Provisions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Entire Agreement</h3>
                <p className="text-gray-700">
                  These Terms, together with our Privacy Policy and any other agreements expressly incorporated 
                  by reference, constitute the entire agreement between you and LocumTrueRate regarding the use 
                  of our Service.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Modifications to Terms</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 text-sm mb-2">
                    We may modify these Terms at any time. When we make changes:
                  </p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm ml-4">
                    <li>We will notify you via email or platform notification</li>
                    <li>The updated Terms will be posted with a new effective date</li>
                    <li>Continued use after changes constitutes acceptance</li>
                    <li>You may terminate your account if you disagree with changes</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Severability</h3>
                <p className="text-gray-700">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision 
                  will be limited or eliminated to the minimum extent necessary so that these Terms will 
                  otherwise remain in full force and effect.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Waiver</h3>
                <p className="text-gray-700">
                  Our failure to enforce any right or provision of these Terms will not be considered a 
                  waiver of those rights. Any waiver must be in writing and signed by an authorized 
                  representative of LocumTrueRate.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Assignment</h3>
                <p className="text-gray-700">
                  You may not assign or transfer these Terms without our prior written consent. We may 
                  assign our rights and obligations under these Terms without restriction.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Indemnification</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-700 text-sm">
                    You agree to indemnify, defend, and hold harmless LocumTrueRate, its affiliates, and their 
                    respective officers, directors, employees, and agents from any claims, damages, losses, 
                    liabilities, and expenses (including reasonable attorneys' fees) arising from your use of 
                    the Service, violation of these Terms, or infringement of any third-party rights.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Force Majeure</h3>
                <p className="text-gray-700">
                  Neither party will be liable for any failure or delay in performance under these Terms 
                  due to circumstances beyond its reasonable control, including but not limited to acts of 
                  God, natural disasters, war, terrorism, labor disputes, or government actions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Notices</h3>
                <p className="text-gray-700 mb-2">
                  Legal notices to LocumTrueRate should be sent to:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 text-sm">
                    LocumTrueRate, Inc.<br />
                    Attn: Legal Department<br />
                    123 Healthcare Plaza, Suite 456<br />
                    Medical City, MC 12345<br />
                    Email: legal@locumtruerate.com
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Questions About These Terms</h3>
                <p className="text-gray-700 mb-3">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="flex gap-2">
                  <a href="mailto:legal@locumtruerate.com" className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700">
                    Email Legal Team
                  </a>
                  <a href="/support" className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-gray-500 mb-4 md:mb-0">
                These terms are effective as of {effectiveDate} and replace all previous versions.
              </p>
              <div className="flex gap-2">
                <a href="/legal/privacy" className="text-xs text-blue-600 hover:text-blue-800">Privacy Policy</a>
                <span className="text-xs text-gray-400">•</span>
                <a href="/legal/cookies" className="text-xs text-blue-600 hover:text-blue-800">Cookie Policy</a>
                <span className="text-xs text-gray-400">•</span>
                <a href="/support" className="text-xs text-blue-600 hover:text-blue-800">Contact Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}