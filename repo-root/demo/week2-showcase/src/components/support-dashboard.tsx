'use client'

import React, { useState, useEffect } from 'react'

interface SupportDashboardProps {
  userRole: 'admin' | 'support' | 'user'
  onTicketAction?: (ticketId: string, action: string, data?: any) => Promise<void>
  onLoadTickets?: (filters?: any) => Promise<any[]>
  onLoadStats?: () => Promise<any>
}

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  user?: {
    name: string
    email: string
  }
  assignedTo?: string
  messages: Array<{
    id: string
    message: string
    authorType: 'user' | 'support'
    createdAt: string
    authorId: string
  }>
}

interface SupportStats {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  avgResponseTime: number
  resolutionRate: string
  categoryBreakdown: Array<{
    category: string
    _count: { category: number }
  }>
}

export default function SupportDashboard({
  userRole,
  onTicketAction,
  onLoadTickets,
  onLoadStats,
}: SupportDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'stats' | 'knowledge'>('tickets')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<SupportStats | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  // Load tickets on mount and filter changes
  useEffect(() => {
    loadTickets()
  }, [filters])

  // Load stats for admin/support users
  useEffect(() => {
    if ((userRole === 'admin' || userRole === 'support') && activeTab === 'stats') {
      loadStats()
    }
  }, [userRole, activeTab])

  const loadTickets = async () => {
    if (!onLoadTickets) return
    
    setIsLoading(true)
    try {
      const loadedTickets = await onLoadTickets(filters)
      setTickets(loadedTickets)
    } catch (error) {
      console.error('Failed to load tickets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    if (!onLoadStats) return
    
    try {
      const loadedStats = await onLoadStats()
      setStats(loadedStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    if (!onTicketAction) return
    
    try {
      await onTicketAction(ticketId, action, data)
      await loadTickets() // Refresh tickets
      
      // Update selected ticket if it's the one being modified
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId)
        if (updatedTicket) {
          setSelectedTicket(updatedTicket)
        }
      }
    } catch (error) {
      console.error('Ticket action failed:', error)
    }
  }

  const handleAddMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return
    
    await handleTicketAction(selectedTicket.id, 'add_message', {
      message: newMessage,
      authorType: userRole === 'user' ? 'user' : 'support',
    })
    
    setNewMessage('')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-purple-600 bg-purple-100'
      case 'waiting_customer': return 'text-orange-600 bg-orange-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {userRole === 'user' ? 'My Support Tickets' : 'Support Dashboard'}
        </h1>
        <p className="text-gray-600">
          {userRole === 'user' 
            ? 'View and manage your support requests'
            : 'Manage customer support tickets and knowledge base'
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎫 Tickets
          </button>
          
          {(userRole === 'admin' || userRole === 'support') && (
            <>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'knowledge'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📚 Knowledge Base
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_customer">Waiting Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="account">Account</option>
                  <option value="job_posting">Job Posting</option>
                  <option value="application">Applications</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="other">Other</option>
                </select>

                <button 
                  onClick={loadTickets} 
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? '⏳' : '🔄'} Refresh
                </button>
              </div>
            </div>

            {/* Tickets */}
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                      <p className="text-sm text-gray-500">#{ticket.ticketNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{ticket.category.replace('_', ' ')}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {ticket.user && (
                    <div className="mt-2 text-sm text-gray-600">
                      👤 {ticket.user.name} ({ticket.user.email})
                    </div>
                  )}
                </div>
              ))}

              {tickets.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-4 block">📭</span>
                  <p>No tickets found</p>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Detail */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">{selectedTicket.subject}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Quick Actions */}
                  {(userRole === 'admin' || userRole === 'support') && (
                    <div className="flex gap-2 mb-4">
                      <select
                        onChange={(e) => handleTicketAction(selectedTicket.id, 'update_status', { status: e.target.value })}
                        value={selectedTicket.status}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_customer">Waiting Customer</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedTicket.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded ${
                        message.authorType === 'support'
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'bg-gray-50 border-l-4 border-gray-300'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {message.authorType === 'support' ? '🎧 Support' : '👤 Customer'} • 
                        {new Date(message.createdAt).toLocaleString()}
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No messages yet</p>
                  )}
                </div>

                {/* Add Message */}
                <div className="space-y-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={handleAddMessage}
                    disabled={!newMessage.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    💬 Send Message
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                <span className="text-4xl mb-4 block">📋</span>
                <p>Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.totalTickets}</div>
            <div className="text-sm text-gray-600">Total Tickets</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-orange-600">{stats.openTickets}</div>
            <div className="text-sm text-gray-600">Open Tickets</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-green-600">{stats.resolvedTickets}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-purple-600">{stats.resolutionRate}%</div>
            <div className="text-sm text-gray-600">Resolution Rate</div>
          </div>

          {/* Category Breakdown */}
          <div className="md:col-span-2 lg:col-span-4 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Tickets by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.categoryBreakdown?.map((item) => (
                <div key={item.category} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{item._count.category}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {item.category.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-4 block">📚</span>
            <h3 className="text-lg font-medium mb-2">Knowledge Base Management</h3>
            <p className="mb-4">Create and manage help articles for customers</p>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => alert('Demo: Create article functionality would be here')}
            >
              📝 Create New Article
            </button>
          </div>
        </div>
      )}
    </div>
  )
}