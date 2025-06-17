export interface SupportWidgetProps {
  isOpen: boolean
  onClose: () => void
  onSubmitTicket: (ticket: TicketData) => Promise<void>
  onSearchKnowledge: (query: string) => Promise<KnowledgeArticle[]>
}

export interface FloatingSupportButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  onTicketSubmit?: (ticket: any) => Promise<void>
  onKnowledgeSearch?: (query: string) => Promise<any[]>
  customContent?: React.ReactNode
  theme?: 'blue' | 'green' | 'purple' | 'orange'
  size?: 'sm' | 'md' | 'lg'
}

export interface SupportDashboardProps {
  userRole: 'admin' | 'support' | 'user'
  onTicketAction?: (ticketId: string, action: string, data?: any) => Promise<void>
  onLoadTickets?: (filters?: any) => Promise<any[]>
  onLoadStats?: () => Promise<any>
}

export interface TicketData {
  subject: string
  description: string
  category: string
  priority: string
  email: string
  name: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category: string
  estimatedReadTime: number
  helpful: number
  notHelpful: number
}

export interface Ticket {
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

export interface SupportStats {
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