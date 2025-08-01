'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search, Filter, MoreHorizontal, Eye, Edit, 
  Shield, ShieldCheck, ShieldX, Mail, Phone,
  Calendar, MapPin, Briefcase, AlertTriangle,
  User, Users, CheckCircle, XCircle
} from 'lucide-react'
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input
} from '@locumtruerate/ui'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
// import { trpc } from '@/providers/trpc-provider' // Temporarily disabled
import { z } from 'zod'
import { searchQuerySchema } from '@/lib/validation/schemas'
import { debounce } from 'lodash'

type UserRole = 'physician' | 'nurse-practitioner' | 'company'
type FilterRole = UserRole | 'ALL'

// Validation schemas
const roleFilterSchema = z.enum(['ALL', 'physician', 'nurse-practitioner', 'company'])
const verificationFilterSchema = z.enum(['ALL', 'VERIFIED', 'UNVERIFIED'])

const roleConfig = {
  physician: { label: 'Physician', color: 'blue', icon: User },
  'nurse-practitioner': { label: 'Nurse Practitioner', color: 'green', icon: User },
  company: { label: 'Company', color: 'purple', icon: Briefcase }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [roleFilter, setRoleFilter] = useState<FilterRole>('ALL')
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>()
  const [page, setPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  // Debounced search handler
  const handleSearchChange = debounce((value: string) => {
    try {
      const sanitized = value.trim()
      if (sanitized) {
        searchQuerySchema.parse(sanitized)
      }
      setSearchQuery(sanitized)
      setSearchError('')
      setPage(1) // Reset to first page on search
    } catch (error) {
      if (error instanceof z.ZodError) {
        setSearchError(error.errors[0].message)
      }
    }
  }, 300)

  // Mock data until routers are enabled
  const usersData = {
    users: [],
    pagination: {
      total: 0,
      totalPages: 0,
      currentPage: 1,
      perPage: 25
    }
  }
  const isLoading = false
  const refetch = () => {}

  // Mock flagged users count
  const flaggedUsers = {
    users: [],
    pagination: {
      total: 0
    }
  }

  // Mock user verification mutation
  const verifyUserMutation = {
    mutateAsync: async (data: any) => {
      console.log('Verifying user:', data)
      return { success: true }
    },
    isLoading: false
  }

  const handleVerifyUser = async (userId: string, verified: boolean, reason?: string) => {
    try {
      await verifyUserMutation.mutateAsync({
        userId,
        verified,
        reason
      })
    } catch (error) {
      console.error('Failed to update user verification:', error)
    }
  }

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === usersData?.users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(usersData?.users.map(user => user.id) || []))
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const config = roleConfig[role]
    const Icon = config.icon
    return (
      <Badge variant={config.color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getVerificationBadge = (verified: boolean) => {
    return verified ? (
      <Badge variant="green" className="flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        Verified
      </Badge>
    ) : (
      <Badge variant="yellow" className="flex items-center gap-1">
        <ShieldX className="h-3 w-3" />
        Unverified
      </Badge>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    User Management
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage user accounts, verification, and access controls
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {flaggedUsers && flaggedUsers.pagination.total > 0 && (
                    <Badge variant="red" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {flaggedUsers.pagination.total} flagged
                    </Badge>
                  )}
                  <Button onClick={() => router.push('/admin/users/new')}>
                    Add User
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search users by name, email, or credentials..."
                      defaultValue={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className={`pl-10 ${searchError ? 'border-red-500' : ''}`}
                      aria-invalid={!!searchError}
                      aria-describedby={searchError ? 'search-error' : undefined}
                    />
                    {searchError && (
                      <p id="search-error" className="absolute -bottom-5 left-0 text-sm text-red-600">
                        {searchError}
                      </p>
                    )}
                  </div>
                  
                  {/* Role Filter */}
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      try {
                        const validated = roleFilterSchema.parse(e.target.value)
                        setRoleFilter(validated as FilterRole)
                        setPage(1) // Reset pagination
                      } catch (error) {
                        console.error('Invalid role filter:', e.target.value)
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Filter users by role"
                  >
                    <option value="ALL">All Roles</option>
                    {Object.entries(roleConfig).map(([role, config]) => (
                      <option key={role} value={role}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  
                  {/* Verification Filter */}
                  <select
                    value={verifiedFilter === undefined ? 'ALL' : verifiedFilter ? 'VERIFIED' : 'UNVERIFIED'}
                    onChange={(e) => {
                      try {
                        const validated = verificationFilterSchema.parse(e.target.value)
                        setVerifiedFilter(validated === 'ALL' ? undefined : validated === 'VERIFIED')
                        setPage(1) // Reset pagination
                      } catch (error) {
                        console.error('Invalid verification filter:', e.target.value)
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Filter users by verification status"
                  >
                    <option value="ALL">All Status</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="UNVERIFIED">Unverified</option>
                  </select>
                  
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Users ({usersData?.pagination.total || 0})</CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedUsers.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedUsers.size} selected
                        </span>
                        <Button variant="outline" size="sm">
                          Bulk Actions
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : usersData?.users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                      No users found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Try adjusting your search criteria
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="hidden md:flex items-center py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">
                      <div className="w-8">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === usersData?.users.length && usersData.users.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </div>
                      <div className="flex-1">User Details</div>
                      <div className="w-32 text-center">Role</div>
                      <div className="w-32 text-center">Status</div>
                      <div className="w-32 text-center">Joined</div>
                      <div className="w-24 text-center">Actions</div>
                    </div>

                    {/* User Rows */}
                    {usersData?.users.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex flex-col md:flex-row items-start md:items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        {/* Checkbox */}
                        <div className="hidden md:block w-8">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="rounded"
                          />
                        </div>

                        {/* User Details */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </h3>
                              <div className="flex flex-col gap-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  {user.email}
                                </span>
                                {user.profile?.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    {user.profile.phone}
                                  </span>
                                )}
                                {user.profile?.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {user.profile.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Role */}
                        <div className="w-full md:w-32 mt-3 md:mt-0 text-center">
                          {getRoleBadge(user.role as UserRole)}
                        </div>

                        {/* Verification Status */}
                        <div className="w-full md:w-32 mt-2 md:mt-0 text-center">
                          {getVerificationBadge(user.verified)}
                        </div>

                        {/* Joined Date */}
                        <div className="w-full md:w-32 mt-2 md:mt-0 text-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="w-full md:w-24 mt-3 md:mt-0 flex justify-center">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {!user.verified && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerifyUser(user.id, true, 'Manual verification by admin')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                disabled={verifyUserMutation.isLoading}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {user.verified && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerifyUser(user.id, false, 'Verification revoked by admin')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={verifyUserMutation.isLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {usersData && usersData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, usersData.pagination.total)} of {usersData.pagination.total} users
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {page} of {usersData.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === usersData.pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}