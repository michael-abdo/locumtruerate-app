'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { 
  AccessibilitySettingsPanel,
  Heading,
  ScreenReaderOnly,
  AccessibleProgress 
} from '@/components/accessibility'
import { Button } from '@locumtruerate/ui'
import { 
  Eye,
  Ear,
  Hand,
  Brain,
  Heart,
  Shield,
  CheckCircle,
  ExternalLink,
  Download,
  Phone,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

const accessibilityFeatures = [
  {
    icon: Eye,
    title: 'Visual Accessibility',
    description: 'High contrast modes, large text options, and screen reader compatibility',
    features: [
      'High contrast color schemes',
      'Scalable text up to 200%',
      'Screen reader optimization',
      'Alternative text for images',
      'Clear visual hierarchy'
    ]
  },
  {
    icon: Hand,
    title: 'Motor Accessibility',
    description: 'Keyboard navigation, large touch targets, and reduced motion options',
    features: [
      'Full keyboard navigation',
      'Large touch targets (44px minimum)',
      'Reduced motion preferences',
      'Voice control compatibility',
      'Sticky interactive elements'
    ]
  },
  {
    icon: Ear,
    title: 'Auditory Accessibility',
    description: 'Visual alternatives to audio cues and customizable notifications',
    features: [
      'Visual notification indicators',
      'Captions for video content',
      'Audio descriptions available',
      'Customizable alert preferences',
      'No auto-playing audio'
    ]
  },
  {
    icon: Brain,
    title: 'Cognitive Accessibility',
    description: 'Clear navigation, consistent layouts, and helpful explanations',
    features: [
      'Simple, consistent navigation',
      'Clear error messages',
      'Progress indicators',
      'Helpful tooltips and hints',
      'Undo and confirm actions'
    ]
  }
]

const complianceStandards = [
  {
    name: 'WCAG 2.1 AA',
    description: 'Web Content Accessibility Guidelines Level AA compliance',
    status: 'Compliant',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    name: 'Section 508',
    description: 'US Federal accessibility requirements',
    status: 'Compliant',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    name: 'ADA',
    description: 'Americans with Disabilities Act compliance',
    status: 'Compliant',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    name: 'AODA',
    description: 'Accessibility for Ontarians with Disabilities Act',
    status: 'Compliant',
    icon: CheckCircle,
    color: 'text-green-600'
  }
]

const supportedTechnologies = [
  'JAWS (Job Access With Speech)',
  'NVDA (NonVisual Desktop Access)',
  'VoiceOver (macOS/iOS)',
  'TalkBack (Android)',
  'Dragon NaturallySpeaking',
  'Switch Control',
  'Eye tracking software',
  'Voice control systems'
]

export default function AccessibilityPage() {
  const [showSettings, setShowSettings] = React.useState(false)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="bg-white dark:bg-gray-800 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-6">
                <Heart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              <Heading level={1} className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Accessibility at LocumTrueRate
              </Heading>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
                We're committed to making our platform accessible to everyone. Our goal is to provide 
                an inclusive experience that empowers all healthcare professionals to find opportunities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Open Accessibility Settings
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Accessibility Guide
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Accessibility Features */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Accessibility Features
              </Heading>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Our platform includes comprehensive accessibility features designed to support 
                users with diverse needs and abilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {accessibilityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Heading level={3} className="text-xl font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </Heading>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Standards */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Compliance & Standards
              </Heading>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                We adhere to international accessibility standards and regulations to ensure 
                our platform meets the highest accessibility requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {complianceStandards.map((standard, index) => (
                <motion.div
                  key={standard.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <standard.icon className={cn('w-8 h-8 mx-auto mb-4', standard.color)} />
                  <Heading level={3} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {standard.name}
                  </Heading>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {standard.description}
                  </p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {standard.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Technologies */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Supported Assistive Technologies
              </Heading>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Our platform is tested and optimized for compatibility with popular assistive technologies.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportedTechnologies.map((tech, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{tech}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Don't see your assistive technology listed? 
                  <a href="#contact" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-1">
                    Contact our accessibility team
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility Progress */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Accessibility Journey
              </Heading>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                We're continuously improving our accessibility. Here's our current progress.
              </p>
            </div>

            <div className="space-y-8">
              <AccessibleProgress
                value={95}
                label="WCAG 2.1 AA Compliance"
                description="Web Content Accessibility Guidelines compliance across all pages"
                className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg"
              />
              
              <AccessibleProgress
                value={92}
                label="Screen Reader Compatibility"
                description="Optimization for major screen reading software"
                className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg"
              />
              
              <AccessibleProgress
                value={98}
                label="Keyboard Navigation"
                description="Full keyboard accessibility across all interactive elements"
                className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg"
              />
              
              <AccessibleProgress
                value={90}
                label="Mobile Accessibility"
                description="Touch-friendly design with proper mobile accessibility features"
                className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Contact & Support */}
        <section id="contact" className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Get Accessibility Support
              </Heading>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Have questions about our accessibility features or need assistance? We're here to help.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mb-4">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Heading level={3} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Email Support
                </Heading>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get help via email from our accessibility team
                </p>
                <a 
                  href="mailto:accessibility@locumtruerate.com"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  accessibility@locumtruerate.com
                </a>
              </div>

              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mb-4">
                  <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <Heading level={3} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Phone Support
                </Heading>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Speak directly with our accessibility specialists
                </p>
                <a 
                  href="tel:+1-800-555-0123"
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                >
                  1-800-555-0123
                </a>
              </div>

              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mb-4">
                  <ExternalLink className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <Heading level={3} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Documentation
                </Heading>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Access our complete accessibility guide
                </p>
                <a 
                  href="/docs/accessibility"
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                >
                  View Documentation
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="py-16 bg-blue-50 dark:bg-blue-900/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-6" />
            
            <Heading level={2} className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Help Us Improve
            </Heading>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Your feedback helps us continue improving our accessibility. Share your experience 
              or suggest improvements to make our platform more inclusive.
            </p>
            
            <Button className="mr-4">
              Share Feedback
            </Button>
            
            <Button variant="outline">
              Report Accessibility Issue
            </Button>
          </div>
        </section>
      </main>

      {/* Hidden screen reader content */}
      <ScreenReaderOnly>
        This page provides comprehensive information about LocumTrueRate's accessibility features, 
        compliance standards, and support options. Use the accessibility settings panel to 
        customize your experience.
      </ScreenReaderOnly>

      {/* Accessibility Settings Panel */}
      <AccessibilitySettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      <Footer />
    </>
  )
}