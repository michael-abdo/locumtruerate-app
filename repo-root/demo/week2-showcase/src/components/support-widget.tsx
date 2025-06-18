'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { Input } from './input'

interface SupportWidgetProps {
  isOpen: boolean
  onClose: () => void
  onSubmitTicket: (ticket: TicketData) => Promise<void>
  onSearchKnowledge: (query: string) => Promise<KnowledgeArticle[]>
}

interface TicketData {
  subject: string
  description: string
  category: string
  priority: string
  email: string
  name: string
}

interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category: string
  estimatedReadTime: number
  helpful: number
  notHelpful: number
}

type SupportTab = 'help' | 'contact' | 'status'

export function SupportWidget({ 
  isOpen, 
  onClose, 
  onSubmitTicket, 
  onSearchKnowledge 
}: SupportWidgetProps) {
  const [activeTab, setActiveTab] = useState<SupportTab>('help')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<KnowledgeArticle[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [ticketForm, setTicketForm] = useState<TicketData>({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'medium',
    email: '',
    name: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Search knowledge base
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await onSearchKnowledge(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Knowledge search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Submit support ticket
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmitTicket(ticketForm)
      setSubmitSuccess(true)
      setTicketForm({
        subject: '',
        description: '',
        category: 'technical',
        priority: 'medium',
        email: '',
        name: '',
      })
    } catch (error) {
      console.error('Ticket submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'help' as const, label: '🔍 Find Answers', icon: '📚' },
    { id: 'contact' as const, label: '💬 Contact Support', icon: '🎧' },
    { id: 'status' as const, label: '📋 Check Status', icon: '📊' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="LocumTrueRate Support" maxWidth="2xl">
      <div className="flex flex-col h-[600px] max-h-[80vh]">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'help' && (
            <div className="h-full flex flex-col">
              {/* Search Section */}
              <div className="p-4 border-b bg-gray-50">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search for help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {isSearching ? (
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                    ) : (
                      <span className="text-gray-400">🔍</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Results or Popular Articles */}
              <div className="flex-1 overflow-y-auto p-4">
                {searchQuery ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Search Results ({searchResults.length})
                    </h3>
                    {searchResults.length === 0 && !isSearching ? (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-4 block">🤔</span>
                        <p>No articles found for "{searchQuery}"</p>
                        <p className="text-sm mt-2">Try different keywords or contact support</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.map((article) => (
                          <ArticleCard key={article.id} article={article} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Popular Help Topics</h3>
                    <div className="space-y-3">
                      <QuickHelpCard 
                        title="Getting Started Guide"
                        description="Learn how to post jobs and find candidates"
                        icon="🚀"
                        category="getting_started"
                      />
                      <QuickHelpCard 
                        title="Understanding True Rate Calculator"
                        description="How to calculate competitive compensation"
                        icon="💰"
                        category="calculations"
                      />
                      <QuickHelpCard 
                        title="Account & Profile Setup"
                        description="Manage your account settings and preferences"
                        icon="⚙️"
                        category="account"
                      />
                      <QuickHelpCard 
                        title="Billing & Payments"
                        description="Payment methods, invoices, and billing questions"
                        icon="💳"
                        category="billing"
                      />
                      <QuickHelpCard 
                        title="Mobile App Help"
                        description="Using LocumTrueRate on your mobile device"
                        icon="📱"
                        category="mobile"
                      />
                      <QuickHelpCard 
                        title="Technical Issues"
                        description="Troubleshooting common technical problems"
                        icon="🔧"
                        category="technical"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('contact')}
                    className="flex-1"
                  >
                    💬 Contact Support
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('status')}
                    className="flex-1"
                  >
                    📋 Check Tickets
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="h-full overflow-y-auto p-4">
              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-green-600 mb-2">
                    Ticket Submitted Successfully!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We've received your support request and will respond within 24 hours.
                  </p>
                  <Button
                    onClick={() => {
                      setSubmitSuccess(false)
                      setActiveTab('status')
                    }}
                    className="mr-2"
                  >
                    Check Status
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitSuccess(false)}
                  >
                    Submit Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Contact Support</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Can't find what you're looking for? Our support team is here to help.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      placeholder="Your Name"
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing Question</option>
                      <option value="account">Account Help</option>
                      <option value="job_posting">Job Posting</option>
                      <option value="application">Applications</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="bug_report">Bug Report</option>
                      <option value="other">Other</option>
                    </select>

                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <Input
                    type="text"
                    placeholder="Subject"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />

                  <textarea
                    placeholder="Describe your issue or question in detail..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Submitting...
                        </div>
                      ) : (
                        '📤 Submit Ticket'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('help')}
                    >
                      🔍 Search Help
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>Response Times:</strong> We typically respond within 24 hours for standard issues, 
                    4 hours for high priority, and 1 hour for urgent issues during business hours.
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <div className="h-full overflow-y-auto p-4">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sign In Required
                </h3>
                <p className="text-gray-600 mb-6">
                  Please sign in to view your support tickets and their status.
                </p>
                <div className="space-y-3">
                  <Button className="w-full">
                    🔑 Sign In to Your Account
                  </Button>
                  <Button variant="outline" className="w-full">
                    📧 Check by Email
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function ArticleCard({ article }: { article: KnowledgeArticle }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      <div 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
          <span className="text-gray-400 ml-2">
            {isExpanded ? '−' : '+'}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
          <span>📖 {article.estimatedReadTime} min read</span>
          <span>👍 {article.helpful}</span>
          <span className="capitalize bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {article.category.replace('_', ' ')}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div 
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ 
              __html: article.content.replace(/\n/g, '<br>').substring(0, 500) + '...' 
            }}
          />
          
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline">
              📖 Read Full Article
            </Button>
            <Button size="sm" variant="outline">
              👍 Helpful
            </Button>
            <Button size="sm" variant="outline">
              👎 Not Helpful
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickHelpCard({ 
  title, 
  description, 
  icon, 
  category 
}: { 
  title: string
  description: string
  icon: string
  category: string
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <span className="text-gray-400">→</span>
      </div>
    </div>
  )
}

export default SupportWidget