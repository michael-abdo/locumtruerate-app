import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { trpc } from '@/lib/trpc'

// Types
interface Job {
  id: string
  title: string
  company: {
    name: string
    logo?: string
  }
  location: string
  salary?: number
  salaryMin?: number
  salaryMax?: number
  jobType: string
  remote: boolean
  urgent: boolean
  description: string
  requirements?: string[]
  benefits?: string[]
  expiresAt: string
  createdAt: string
  isBoosted?: boolean
  boostType?: string
}

interface FilterOptions {
  location: string
  jobType: string
  remote: boolean | null
  salaryMin: number | null
  salaryMax: number | null
  urgent: boolean | null
}

const initialFilters: FilterOptions = {
  location: '',
  jobType: '',
  remote: null,
  salaryMin: null,
  salaryMax: null,
  urgent: null,
}

export default function JobsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // API calls
  const { 
    data: jobsData, 
    isLoading, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = trpc.jobs.getAll.useInfiniteQuery(
    {
      limit: 20,
      search: searchQuery,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      filters: {
        location: filters.location || undefined,
        jobType: filters.jobType || undefined,
        remote: filters.remote ?? undefined,
        salaryMin: filters.salaryMin ?? undefined,
        salaryMax: filters.salaryMax ?? undefined,
        urgent: filters.urgent ?? undefined,
      }
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    }
  )

  const applyToJobMutation = trpc.applications.create.useMutation({
    onSuccess: () => {
      Alert.alert(
        'Application Submitted',
        'Your application has been successfully submitted! The employer will be notified.',
        [{ text: 'OK' }]
      )
    },
    onError: (error) => {
      Alert.alert(
        'Application Failed',
        error.message || 'Failed to submit application. Please try again.',
        [{ text: 'OK' }]
      )
    },
  })

  // Get flattened jobs list
  const jobs = jobsData?.pages.flatMap(page => page.jobs) || []
  const totalJobs = jobsData?.pages[0]?.total || 0

  const categories = [
    { id: 'all', label: 'All Jobs', count: totalJobs },
    { id: 'emergency', label: 'Emergency', specialty: 'Emergency Medicine' },
    { id: 'internal', label: 'Internal Med', specialty: 'Internal Medicine' },
    { id: 'family', label: 'Family Med', specialty: 'Family Medicine' },
    { id: 'surgery', label: 'Surgery', specialty: 'Surgery' },
    { id: 'remote', label: 'Remote', filter: 'remote' },
  ]

  const handleSearch = (text: string) => {
    setSearchQuery(text)
    setPage(1)
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    const category = categories.find(c => c.id === categoryId)
    
    if (category?.specialty) {
      setSearchQuery(category.specialty)
    } else if (category?.filter === 'remote') {
      setFilters({ ...filters, remote: true })
    } else {
      setSearchQuery('')
      setFilters(initialFilters)
    }
    setPage(1)
  }

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    setShowFilters(false)
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setSearchQuery('')
    setSelectedCategory('all')
    setPage(1)
  }

  const handleJobApply = (jobId: string) => {
    Alert.alert(
      'Apply to Job',
      'Are you sure you want to apply to this position?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          style: 'default',
          onPress: () => {
            applyToJobMutation.mutate({ jobId })
          }
        }
      ]
    )
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const formatSalary = (job: Job) => {
    if (job.salary) {
      return `$${(job.salary / 1000).toFixed(0)}k`
    }
    if (job.salaryMin && job.salaryMax) {
      return `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k`
    }
    if (job.salaryMin) {
      return `$${(job.salaryMin / 1000).toFixed(0)}k+`
    }
    return 'Salary TBD'
  }

  const renderJobCard = ({ item: job }: { item: Job }) => (
    <TouchableOpacity 
      style={[styles.jobCard, job.isBoosted && styles.boostedJobCard]}
      onPress={() => router.push(`/job/${job.id}`)}
    >
      {/* Boost Badge */}
      {job.isBoosted && (
        <View style={styles.boostBadge}>
          <Text style={styles.boostText}>⭐ Boosted</Text>
        </View>
      )}

      {/* Urgent Badge */}
      {job.urgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>🔥 Urgent</Text>
        </View>
      )}

      {/* Company Logo Placeholder */}
      <View style={styles.jobHeader}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyLogoText}>
            {job.company.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.jobHeaderText}>
          <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
          <Text style={styles.companyName}>{job.company.name}</Text>
        </View>
      </View>

      {/* Location and Remote */}
      <View style={styles.locationContainer}>
        <Text style={styles.jobLocation}>📍 {job.location}</Text>
        {job.remote && (
          <View style={styles.remoteBadge}>
            <Text style={styles.remoteText}>Remote</Text>
          </View>
        )}
      </View>
      
      {/* Job Details */}
      <View style={styles.jobDetails}>
        <View style={styles.jobDetailItem}>
          <Text style={styles.jobDetailLabel}>Salary</Text>
          <Text style={styles.jobDetailValue}>{formatSalary(job)}</Text>
        </View>
        
        <View style={styles.jobDetailItem}>
          <Text style={styles.jobDetailLabel}>Type</Text>
          <Text style={styles.jobDetailValue}>{job.jobType}</Text>
        </View>
        
        <View style={styles.jobDetailItem}>
          <Text style={styles.jobDetailLabel}>Posted</Text>
          <Text style={styles.jobDetailValue}>
            {new Date(job.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Description Preview */}
      <Text style={styles.jobDescription} numberOfLines={2}>
        {job.description}
      </Text>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => router.push(`/job/${job.id}`)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={() => handleJobApply(job.id)}
          disabled={applyToJobMutation.isLoading}
        >
          <Text style={styles.applyButtonText}>
            {applyToJobMutation.isLoading ? 'Applying...' : 'Quick Apply'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.filterCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.filterClearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* Location Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Location</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Enter city, state, or ZIP"
              value={filters.location}
              onChangeText={(text) => setFilters({ ...filters, location: text })}
            />
          </View>

          {/* Job Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Job Type</Text>
            <View style={styles.filterOptions}>
              {['Full-time', 'Part-time', 'Contract', 'Per Diem'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    filters.jobType === type && styles.filterOptionActive
                  ]}
                  onPress={() => setFilters({ 
                    ...filters, 
                    jobType: filters.jobType === type ? '' : type 
                  })}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.jobType === type && styles.filterOptionTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Remote Work Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Work Location</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.remote === false && styles.filterOptionActive
                ]}
                onPress={() => setFilters({ ...filters, remote: false })}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.remote === false && styles.filterOptionTextActive
                ]}>
                  On-site
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.remote === true && styles.filterOptionActive
                ]}
                onPress={() => setFilters({ ...filters, remote: true })}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.remote === true && styles.filterOptionTextActive
                ]}>
                  Remote
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Salary Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Salary Range</Text>
            <View style={styles.salaryInputs}>
              <TextInput
                style={styles.salaryInput}
                placeholder="Min ($)"
                value={filters.salaryMin?.toString() || ''}
                onChangeText={(text) => setFilters({ 
                  ...filters, 
                  salaryMin: text ? parseInt(text) : null 
                })}
                keyboardType="numeric"
              />
              <Text style={styles.salaryDash}>to</Text>
              <TextInput
                style={styles.salaryInput}
                placeholder="Max ($)"
                value={filters.salaryMax?.toString() || ''}
                onChangeText={(text) => setFilters({ 
                  ...filters, 
                  salaryMax: text ? parseInt(text) : null 
                })}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Urgent Jobs Filter */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFilters({ 
                ...filters, 
                urgent: filters.urgent ? null : true 
              })}
            >
              <View style={[
                styles.checkbox,
                filters.urgent && styles.checkboxActive
              ]}>
                {filters.urgent && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Show urgent jobs only</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.filterFooter}>
          <TouchableOpacity
            style={styles.applyFiltersButton}
            onPress={() => handleApplyFilters(filters)}
          >
            <Text style={styles.applyFiltersText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs by specialty, location..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterText}>🔧</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tags */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterTags}
        contentContainerStyle={styles.filterTagsContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterTag,
              selectedCategory === category.id && styles.activeFilter
            ]}
            onPress={() => handleCategorySelect(category.id)}
          >
            <Text style={[
              styles.filterTagText,
              selectedCategory === category.id && styles.activeFilterText
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {isLoading ? 'Loading...' : `${totalJobs} jobs found`}
        </Text>
        <TouchableOpacity onPress={() => {
          const newOrder = sortOrder === 'desc' ? 'asc' : 'desc'
          setSortOrder(newOrder)
        }}>
          <Text style={styles.sortText}>
            Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Job List */}
      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        style={styles.jobList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => (
          isFetchingNextPage ? (
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingText}>Loading more jobs...</Text>
            </View>
          ) : null
        )}
        ListEmptyComponent={() => (
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptyDescription}>
                Try adjusting your search criteria or filters
              </Text>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          ) : null
        )}
      />

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 16,
  },
  filterTags: {
    paddingBottom: 16,
  },
  filterTagsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeFilter: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterTagText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#64748b',
  },
  sortText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  jobList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  jobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  boostedJobCard: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.1,
  },
  boostBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  boostText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  urgentText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyLogoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  jobHeaderText: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#64748b',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  jobLocation: {
    fontSize: 14,
    color: '#64748b',
  },
  remoteBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  remoteText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  jobDetailItem: {
    alignItems: 'center',
  },
  jobDetailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  jobDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  jobDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Filter Modal Styles
  filterModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterCancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  filterClearText: {
    fontSize: 16,
    color: '#dc2626',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
  salaryInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  salaryInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  salaryDash: {
    fontSize: 16,
    color: '#64748b',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1e293b',
  },
  filterFooter: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  applyFiltersButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})