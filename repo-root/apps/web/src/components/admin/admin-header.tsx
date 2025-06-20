'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { 
  Search, Bell, Settings, Menu, X, 
  HelpCircle, LogOut, User, Shield 
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { useClerkUser } from '@/hooks/use-clerk-user'
import { validateAdminSearch } from '@/lib/validation/schemas/admin'

export function AdminHeader() {
  const router = useRouter()
  const { user } = useClerkUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState<string>('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const notifications = [
    {
      id: '1',
      title: 'New job posting requires approval',
      description: 'Metro General Hospital posted a new Emergency Medicine position',
      time: '5 minutes ago',
      unread: true,
      type: 'job'
    },
    {
      id: '2', 
      title: 'User verification request',
      description: 'Dr. Sarah Johnson submitted credentials for verification',
      time: '1 hour ago',
      unread: true,
      type: 'user'
    },
    {
      id: '3',
      title: 'System alert',
      description: 'High API usage detected - 85% of monthly limit',
      time: '3 hours ago',
      unread: false,
      type: 'system'
    }
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchError('')
    
    const validation = validateAdminSearch(searchQuery)
    
    if (!validation.isValid) {
      setSearchError(validation.error || 'Invalid search query')
      return
    }
    
    if (validation.sanitized) {
      router.push(`/admin/search?q=${encodeURIComponent(validation.sanitized)}`)
      setSearchQuery('')
      setShowSearch(false)
    }
  }
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setSearchError('') // Clear error on new input
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Admin Portal
            </h2>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              {showSearch ? (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  onSubmit={handleSearch}
                  className="flex items-center"
                >
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search users, jobs, or content..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className={`w-64 ${searchError ? 'border-red-500' : ''}`}
                      autoFocus
                      aria-invalid={!!searchError}
                      aria-describedby={searchError ? 'search-error' : undefined}
                    />
                    {searchError && (
                      <p id="search-error" className="absolute text-xs text-red-500 mt-1 -bottom-5">
                        {searchError}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearch(false)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.form>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </Button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                            notification.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {notification.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {notification.time}
                              </p>
                            </div>
                            {notification.unread && (
                              <div className="ml-2">
                                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/admin/notifications')}
                        className="text-sm"
                      >
                        View all notifications
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Help */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/help')}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Super Admin
                </p>
              </div>
              {process.env.NODE_ENV === 'development' && 
               process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder') ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/sign-in')}
                  className="h-10 w-10 rounded-full p-0"
                >
                  <User className="h-5 w-5" />
                </Button>
              ) : (
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'h-10 w-10'
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}