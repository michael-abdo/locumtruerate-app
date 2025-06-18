'use client'

import React, { useState } from 'react'
import SupportWidget from './support-widget'

interface FloatingSupportButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  onTicketSubmit?: (ticket: any) => Promise<void>
  onKnowledgeSearch?: (query: string) => Promise<any[]>
  customContent?: React.ReactNode
  theme?: 'blue' | 'green' | 'purple' | 'orange'
  size?: 'sm' | 'md' | 'lg'
}

export function FloatingSupportButton({
  position = 'bottom-right',
  onTicketSubmit,
  onKnowledgeSearch,
  customContent,
  theme = 'blue',
  size = 'md',
}: FloatingSupportButtonProps) {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)

  // Default handlers
  const defaultTicketSubmit = async (ticket: any) => {
    console.log('Demo: Support ticket submitted:', ticket)
    alert(`Demo: Support ticket "${ticket.subject}" has been submitted successfully!`)
    return Promise.resolve()
  }

  const defaultKnowledgeSearch = async (query: string) => {
    console.log('Demo: Knowledge search:', query)
    
    // Mock knowledge base articles for demo
    const mockArticles = [
      {
        id: '1',
        title: 'How to post a job listing',
        content: 'Step-by-step guide to posting your first job on LocumTrueRate. Start by creating your account, then navigate to the Post Job section...',
        category: 'getting_started',
        estimatedReadTime: 3,
        helpful: 15,
        notHelpful: 2,
      },
      {
        id: '2',
        title: 'Understanding the True Rate Calculator',
        content: 'The True Rate Calculator helps you determine fair compensation by factoring in benefits, housing, travel, and other costs...',
        category: 'calculations',
        estimatedReadTime: 5,
        helpful: 28,
        notHelpful: 1,
      },
      {
        id: '3',
        title: 'Setting up your profile',
        content: 'Complete your profile to attract the best candidates. Include your facility information, credentials required, and work environment details...',
        category: 'account',
        estimatedReadTime: 4,
        helpful: 22,
        notHelpful: 3,
      },
      {
        id: '4',
        title: 'Billing and payment options',
        content: 'Learn about our flexible payment plans, how to update billing information, and view your usage history...',
        category: 'billing',
        estimatedReadTime: 2,
        helpful: 18,
        notHelpful: 0,
      },
      {
        id: '5',
        title: 'Mobile app features',
        content: 'Download the LocumTrueRate mobile app to manage jobs, communicate with candidates, and access the calculator on the go...',
        category: 'mobile',
        estimatedReadTime: 3,
        helpful: 14,
        notHelpful: 2,
      },
    ]

    // Filter articles based on search query
    const filteredArticles = mockArticles.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.content.toLowerCase().includes(query.toLowerCase()) ||
      article.category.toLowerCase().includes(query.toLowerCase())
    )

    return Promise.resolve(filteredArticles)
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
  }

  const themeClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    orange: 'bg-orange-600 hover:bg-orange-700 text-white',
  }

  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  }

  return (
    <>
      {/* Floating Button */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <button
          onClick={() => setIsWidgetOpen(true)}
          className={`
            relative ${sizeClasses[size]} ${themeClasses[theme]}
            rounded-full shadow-lg transition-all duration-200 transform hover:scale-105
            focus:outline-none focus:ring-4 focus:ring-opacity-30 focus:ring-blue-500
            animate-pulse hover:animate-none
          `}
          aria-label="Open support chat"
        >
          {customContent || (
            <span className="flex items-center justify-center">
              💬
            </span>
          )}
          
          {/* Notification Badge */}
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          )}
          
          {/* Pulsing Ring */}
          <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm py-1 px-3 rounded whitespace-nowrap">
            Need help? Chat with us!
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      </div>

      {/* Support Widget Modal */}
      <SupportWidget
        isOpen={isWidgetOpen}
        onClose={() => setIsWidgetOpen(false)}
        onSubmitTicket={onTicketSubmit || defaultTicketSubmit}
        onSearchKnowledge={onKnowledgeSearch || defaultKnowledgeSearch}
      />

      {/* Background Overlay when Widget is Open */}
      {isWidgetOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setIsWidgetOpen(false)}
        />
      )}
    </>
  )
}

export default FloatingSupportButton