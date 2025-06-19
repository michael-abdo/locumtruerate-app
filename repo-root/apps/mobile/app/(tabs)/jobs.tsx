import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

const mockJobs = [
  {
    id: '1',
    title: 'Emergency Medicine Physician',
    location: 'Seattle, WA',
    rate: '$145/hour',
    duration: '3 months',
    type: 'Full-time',
    urgent: true,
  },
  {
    id: '2',
    title: 'Internal Medicine - Hospitalist',
    location: 'Portland, OR',
    rate: '$125/hour',
    duration: '6 months',
    type: 'Part-time',
    urgent: false,
  },
  {
    id: '3',
    title: 'Family Medicine Physician',
    location: 'San Francisco, CA',
    rate: '$135/hour',
    duration: '12 months',
    type: 'Full-time',
    urgent: false,
  },
]

export default function JobsScreen() {
  const renderJobCard = ({ item }: { item: typeof mockJobs[0] }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => router.push(`/job/${item.id}`)}
    >
      {item.urgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>🔥 Urgent</Text>
        </View>
      )}
      
      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.jobLocation}>📍 {item.location}</Text>
      
      <View style={styles.jobDetails}>
        <View style={styles.jobDetailItem}>
          <Text style={styles.jobDetailLabel}>Rate</Text>
          <Text style={styles.jobDetailValue}>{item.rate}</Text>
        </View>
        
        <View style={styles.jobDetailItem}>
          <Text style={styles.jobDetailLabel}>Duration</Text>
          <Text style={styles.jobDetailValue}>{item.duration}</Text>
        </View>
        
        <View style={styles.jobDetailItem}>
          <Text style={styles.jobDetailLabel}>Type</Text>
          <Text style={styles.jobDetailValue}>{item.type}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.applyButton}>
        <Text style={styles.applyButtonText}>View Details</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs by specialty, location..."
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>🔧</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tags */}
      <View style={styles.filterTags}>
        <TouchableOpacity style={[styles.filterTag, styles.activeFilter]}>
          <Text style={[styles.filterTagText, styles.activeFilterText]}>All Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTag}>
          <Text style={styles.filterTagText}>Emergency</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTag}>
          <Text style={styles.filterTagText}>Internal Med</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTag}>
          <Text style={styles.filterTagText}>Family Med</Text>
        </TouchableOpacity>
      </View>

      {/* Job Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{mockJobs.length} jobs found</Text>
        <TouchableOpacity>
          <Text style={styles.sortText}>Sort by: Newest</Text>
        </TouchableOpacity>
      </View>

      {/* Job List */}
      <FlatList
        data={mockJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        style={styles.jobList}
        showsVerticalScrollIndicator={false}
      />
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  urgentText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  jobLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  applyButton: {
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
})