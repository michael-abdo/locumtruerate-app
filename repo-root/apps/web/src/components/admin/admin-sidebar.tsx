'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Briefcase, Building2, 
  BarChart3, Settings, Shield, FileText, Bell,
  HelpCircle, ChevronLeft, ChevronRight, Search,
  Flag, CreditCard, MessageSquare, Globe,
  UserCheck, AlertTriangle, Activity
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  open: boolean
  onToggle: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    count: null
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    count: 12483
  },
  {
    name: 'Jobs',
    href: '/admin/jobs',
    icon: Briefcase,
    count: 3247
  },
  {
    name: 'Organizations',
    href: '/admin/organizations',
    icon: Building2,
    count: 425
  },
  {
    name: 'Moderation',
    href: '/admin/moderation',
    icon: Shield,
    count: 23,
    urgent: true
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    count: null
  },
  {
    name: 'Content',
    href: '/admin/content',
    icon: FileText,
    count: null
  },
  {
    name: 'Billing',
    href: '/admin/billing',
    icon: CreditCard,
    count: null
  },
  {
    name: 'Support',
    href: '/admin/support',
    icon: MessageSquare,
    count: 15
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    count: null
  }
]

const quickActions = [
  {
    name: 'Flagged Content',
    href: '/admin/moderation/flagged',
    icon: Flag,
    count: 7,
    color: 'red'
  },
  {
    name: 'Pending Verifications',
    href: '/admin/users/verifications',
    icon: UserCheck,
    count: 15,
    color: 'yellow'
  },
  {
    name: 'System Alerts',
    href: '/admin/system/alerts',
    icon: AlertTriangle,
    count: 3,
    color: 'red'
  },
  {
    name: 'Active Sessions',
    href: '/admin/analytics/sessions',
    icon: Activity,
    count: 1247,
    color: 'green'
  }
]

export function AdminSidebar({ open, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: open ? 280 : 80 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 flex flex-col",
          "lg:relative lg:z-auto"
        )}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <motion.div
            initial={false}
            animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3"
          >
            {open && (
              <>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LT</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    LocumTrueRate
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Admin Portal
                  </p>
                </div>
              </>
            )}
          </motion.div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hidden lg:flex"
          >
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <motion.div
                    key={item.name}
                    onHoverStart={() => setHoveredItem(item.name)}
                    onHoverEnd={() => setHoveredItem(null)}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative",
                        isActive
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <Icon 
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive 
                            ? "text-blue-600 dark:text-blue-400" 
                            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                        )} 
                      />
                      
                      <motion.span
                        initial={false}
                        animate={{ 
                          opacity: open ? 1 : 0,
                          x: open ? 0 : -10,
                          display: open ? 'block' : 'none'
                        }}
                        transition={{ duration: 0.2 }}
                        className="ml-3 flex-1 text-left"
                      >
                        {item.name}
                      </motion.span>
                      
                      {/* Count badges */}
                      {open && item.count && (
                        <Badge
                          variant={item.urgent ? 'destructive' : 'secondary'}
                          className="ml-auto text-xs"
                        >
                          {item.count > 999 ? '999+' : item.count}
                        </Badge>
                      )}
                      
                      {/* Tooltip for collapsed state */}
                      {!open && hoveredItem === item.name && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap z-50"
                        >
                          {item.name}
                          {item.count && (
                            <span className="ml-2 text-gray-300">({item.count})</span>
                          )}
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </nav>

          {/* Quick Actions */}
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="px-3 py-4 border-t border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-1">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.name}
                      href={action.href}
                      className="group flex items-center px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="ml-3 flex-1">{action.name}</span>
                      <Badge
                        variant={action.color as any}
                        className="ml-auto text-xs"
                      >
                        {action.count}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  )
}