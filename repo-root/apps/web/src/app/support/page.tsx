import React from 'react'
import { Metadata } from 'next'
import { SupportDashboard } from '@locumtruerate/ui/components/support'

export const metadata: Metadata = {
  title: 'Support Center | LocumTrueRate',
  description: 'Get help with your LocumTrueRate account, job postings, and platform features.',
  keywords: ['support', 'help', 'customer service', 'locum tenens', 'healthcare jobs'],
}

export default function SupportPage() {
  // In a real app, this would come from authentication context
  const userRole = 'user' // This would be dynamic based on authenticated user

  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    // This would integrate with tRPC
    console.log('Ticket action:', { ticketId, action, data })
    
    // Example implementation:
    // const result = await trpc.support.updateTicket.mutate({
    //   ticketId,
    //   ...data
    // })
    
    return Promise.resolve()
  }

  const handleLoadTickets = async (filters?: any) => {
    // This would integrate with tRPC
    console.log('Loading tickets with filters:', filters)
    
    // Example implementation:
    // const result = await trpc.support.getMyTickets.query(filters)
    // return result.tickets
    
    // Mock data for demo
    return Promise.resolve([
      {
        id: '1',
        ticketNumber: 'LTR-123456-ABCD',
        subject: 'Unable to post job listing',
        category: 'technical',
        priority: 'medium',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        messages: [
          {
            id: '1',
            message: 'I\'m having trouble posting a new job listing. The form keeps showing an error.',
            authorType: 'user' as const,
            createdAt: new Date().toISOString(),
            authorId: 'user-1',
          },
        ],
      },
      {
        id: '2',
        ticketNumber: 'LTR-123457-EFGH',
        subject: 'Billing question about premium features',
        category: 'billing',
        priority: 'low',
        status: 'resolved',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
        messages: [
          {
            id: '2',
            message: 'Can you explain the difference between the basic and premium plans?',
            authorType: 'user' as const,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            authorId: 'user-2',
          },
          {
            id: '3',
            message: 'The premium plan includes advanced filtering, priority support, and analytics dashboard. Let me know if you have more questions!',
            authorType: 'support' as const,
            createdAt: new Date(Date.now() - 43200000).toISOString(),
            authorId: 'support-1',
          },
        ],
      },
    ])
  }

  const handleLoadStats = async () => {
    // This would integrate with tRPC for admin/support users
    console.log('Loading support stats')
    
    // Example implementation:
    // const result = await trpc.support.getTicketStats.query()
    // return result
    
    // Mock data for demo
    return Promise.resolve({
      totalTickets: 245,
      openTickets: 18,
      resolvedTickets: 203,
      avgResponseTime: 4.2,
      resolutionRate: '92.5',
      categoryBreakdown: [
        { category: 'technical', _count: { category: 85 } },
        { category: 'billing', _count: { category: 62 } },
        { category: 'account', _count: { category: 45 } },
        { category: 'job_posting', _count: { category: 38 } },
        { category: 'other', _count: { category: 15 } },
      ],
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Support Center
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Get help with your LocumTrueRate account and find answers to common questions
              </p>
            </div>
            
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                📚 Knowledge Base
              </button>
              <button
                type="button"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                💬 New Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Help Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Getting Started</h3>
            <p className="text-sm text-gray-600 mb-4">
              New to LocumTrueRate? Learn the basics
            </p>
            <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              View Guides →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">True Rate Calculator</h3>
            <p className="text-sm text-gray-600 mb-4">
              Understand how to calculate competitive rates
            </p>
            <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              Learn More →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Troubleshooting</h3>
            <p className="text-sm text-gray-600 mb-4">
              Solve common technical issues quickly
            </p>
            <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              Get Help →
            </button>
          </div>
        </div>
      </div>

      {/* Support Dashboard */}
      <SupportDashboard
        userRole={userRole}
        onTicketAction={handleTicketAction}
        onLoadTickets={handleLoadTickets}
        onLoadStats={handleLoadStats}
      />

      {/* Contact Section */}
      <div className="bg-blue-50 border-t border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still need help?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Our support team is here to help you succeed. We typically respond within 24 hours 
              for standard inquiries and within 4 hours for urgent issues.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl mb-2">💬</div>
                <h3 className="font-medium text-gray-900 mb-1">Live Chat</h3>
                <p className="text-sm text-gray-600">
                  Available Mon-Fri, 9AM-6PM EST
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-2">📧</div>
                <h3 className="font-medium text-gray-900 mb-1">Email Support</h3>
                <p className="text-sm text-gray-600">
                  support@locumtruerate.com
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-2">📞</div>
                <h3 className="font-medium text-gray-900 mb-1">Phone Support</h3>
                <p className="text-sm text-gray-600">
                  1-800-LOCUM-TR (Premium only)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}