import Link from 'next/link'
import { 
  Facebook, Twitter, LinkedIn, Instagram,
  Mail, Phone, MapPin, ExternalLink
} from 'lucide-react'

const navigation = {
  main: [
    { name: 'Find Jobs', href: '/search/jobs' },
    { name: 'Calculator', href: '/tools/calculator' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blog', href: '/blog' },
    { name: 'Help Center', href: '/help' },
  ],
  specialties: [
    { name: 'Emergency Medicine', href: '/specialties/emergency-medicine' },
    { name: 'Family Medicine', href: '/specialties/family-medicine' },
    { name: 'Internal Medicine', href: '/specialties/internal-medicine' },
    { name: 'Psychiatry', href: '/specialties/psychiatry' },
    { name: 'Radiology', href: '/specialties/radiology' },
    { name: 'Anesthesiology', href: '/specialties/anesthesiology' },
  ],
  resources: [
    { name: 'Salary Guide', href: '/resources/salary-guide' },
    { name: 'Contract Tips', href: '/resources/contract-tips' },
    { name: 'Tax Planning', href: '/resources/tax-planning' },
    { name: 'Career Advice', href: '/resources/career-advice' },
    { name: 'State Licensing', href: '/resources/licensing' },
    { name: 'Credentialing', href: '/resources/credentialing' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Partners', href: '/partners' },
    { name: 'Investors', href: '/investors' },
    { name: 'Security', href: '/security' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'GDPR', href: '/gdpr' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'Compliance', href: '/compliance' },
  ],
}

const social = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/locumtruerate',
    icon: Facebook,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/locumtruerate',
    icon: Twitter,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/locumtruerate',
    icon: LinkedIn,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/locumtruerate',
    icon: Instagram,
  },
]

const contact = {
  phone: '+1 (555) 123-4567',
  email: 'support@locumtruerate.com',
  address: '123 Healthcare Plaza, Medical District, CA 90210'
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">LT</span>
              </div>
              <span className="text-xl font-bold">LocumTrueRate</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              The leading platform for transparent locum tenens opportunities. 
              Find your perfect healthcare position with our advanced contract 
              calculator and comprehensive job matching.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href={`tel:${contact.phone}`} className="hover:text-white transition-colors">
                  {contact.phone}
                </a>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                  {contact.email}
                </a>
              </div>
              <div className="flex items-start space-x-3 text-sm text-gray-300">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{contact.address}</span>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Platform
            </h3>
            <ul className="space-y-3">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Specialties
            </h3>
            <ul className="space-y-3">
              {navigation.specialties.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Stay Updated
              </h3>
              <p className="text-gray-300 text-sm">
                Get the latest job opportunities and healthcare industry insights delivered to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Social links and certifications */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex space-x-4">
                {social.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <span className="sr-only">{item.name}</span>
                      <Icon className="h-5 w-5" />
                    </a>
                  )
                })}
              </div>
              
              {/* Security badges */}
              <div className="hidden lg:flex items-center space-x-4 text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>SOC 2 Type II</span>
                </div>
              </div>
            </div>

            <div className="mt-4 lg:mt-0">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400">
                {navigation.legal.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between text-xs text-gray-400">
            <div>
              <p>
                © {new Date().getFullYear()} LocumTrueRate, Inc. All rights reserved.
              </p>
            </div>
            <div className="mt-2 lg:mt-0 flex items-center space-x-4">
              <span>Made with ❤️ for healthcare professionals</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}