/**
 * Screenshot Generator Component
 * 
 * Generates app store screenshots with sample data
 */

import React from 'react'
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Mock data for screenshots
const mockJobs = [
  {
    id: '1',
    title: 'Emergency Medicine Physician',
    company: { name: 'Regional Medical Center' },
    location: 'Austin, TX',
    salary: 300000,
    jobType: 'Full-time',
    remote: false,
    urgent: true,
    isBoosted: true
  },
  {
    id: '2',
    title: 'Internal Medicine - Hospitalist',
    company: { name: 'Metro General Hospital' },
    location: 'Denver, CO',
    salary: 275000,
    jobType: 'Contract',
    remote: false,
    urgent: false,
    isBoosted: false
  },
  {
    id: '3',
    title: 'Family Medicine Physician',
    company: { name: 'Community Health Network' },
    location: 'Nashville, TN',
    salaryMin: 250000,
    salaryMax: 320000,
    jobType: 'Locum Tenens',
    remote: true,
    urgent: false,
    isBoosted: true
  }
]

// Screenshot 1: Job Search Home
export function JobSearchScreenshot() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LocumTrueRate</Text>
        <Text style={styles.headerSubtitle}>Find Your Perfect Position</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Text style={styles.searchPlaceholder}>Emergency Medicine, Austin TX</Text>
        </View>
        <View style={styles.filterButton}>
          <Text style={styles.filterText}>🔧</Text>
        </View>
      </View>

      {/* Category Tags */}
      <ScrollView horizontal style={styles.categoryTags}>
        <View style={[styles.categoryTag, styles.activeCategoryTag]}>
          <Text style={styles.activeCategoryText}>All Jobs</Text>
        </View>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>Emergency</Text>
        </View>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>Internal Med</Text>
        </View>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>Remote</Text>
        </View>
      </ScrollView>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>247 jobs found</Text>
        <Text style={styles.sortText}>Sort: Newest</Text>
      </View>

      {/* Job Cards */}
      <ScrollView style={styles.jobList}>
        {mockJobs.map((job, index) => (
          <View key={job.id} style={[
            styles.jobCard,
            job.isBoosted && styles.boostedJobCard
          ]}>
            {job.urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>🔥 Urgent</Text>
              </View>
            )}
            
            <View style={styles.jobHeader}>
              <View style={styles.companyLogo}>
                <Text style={styles.companyLogoText}>
                  {job.company.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.jobHeaderText}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.companyName}>{job.company.name}</Text>
              </View>
            </View>

            <View style={styles.jobDetails}>
              <Text style={styles.jobLocation}>📍 {job.location}</Text>
              <Text style={styles.jobSalary}>
                💰 ${(job.salary || job.salaryMin || 0) / 1000}k
              </Text>
              <Text style={styles.jobType}>💼 {job.jobType}</Text>
            </View>

            <View style={styles.actionButtons}>
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
              </View>
              <View style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Quick Apply</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

// Screenshot 2: Job Details
export function JobDetailsScreenshot() {
  const job = mockJobs[0]
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.detailHeader}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyLogoText}>R</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.companyName}>{job.company.name}</Text>
          <Text style={styles.jobTitle}>{job.title}</Text>
        </View>
        <Text style={styles.favoriteIcon}>❤️</Text>
      </View>

      <ScrollView style={styles.detailContent}>
        {/* Badges */}
        <View style={styles.badgeContainer}>
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>🔥 Urgent</Text>
          </View>
          <View style={styles.boostedBadge}>
            <Text style={styles.boostedText}>⭐ Featured</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Location</Text>
            <Text style={styles.detailValue}>{job.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Salary</Text>
            <Text style={styles.detailValue}>${job.salary!.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💼 Type</Text>
            <Text style={styles.detailValue}>{job.jobType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Posted</Text>
            <Text style={styles.detailValue}>2 hours ago</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>
            We are seeking a board-certified Emergency Medicine physician for our Level I Trauma Center. 
            This is an excellent opportunity to work with a dynamic team in a state-of-the-art facility.
            {'\n\n'}
            The ideal candidate will have experience in emergency medicine and trauma care, with strong 
            clinical skills and the ability to work effectively under pressure.
          </Text>
        </View>

        {/* Share Button */}
        <View style={styles.shareContainer}>
          <View style={styles.shareButton}>
            <Text style={styles.shareButtonText}>📤 Share Job</Text>
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <View style={styles.applyButton}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

// Screenshot 3: Rate Calculator
export function CalculatorScreenshot() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rate Calculator</Text>
        <Text style={styles.headerSubtitle}>Calculate Your True Take-Home</Text>
      </View>

      <ScrollView style={styles.calculatorContent}>
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <View style={[styles.tab, styles.activeTab]}>
            <Text style={styles.activeTabText}>Contract Calculator</Text>
          </View>
          <View style={styles.tab}>
            <Text style={styles.tabText}>Paycheck Calculator</Text>
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Contract Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hourly Rate ($)</Text>
            <View style={styles.input}>
              <Text style={styles.inputValue}>125.00</Text>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hours per Week</Text>
            <View style={styles.input}>
              <Text style={styles.inputValue}>40</Text>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contract Length (weeks)</Text>
            <View style={styles.input}>
              <Text style={styles.inputValue}>13</Text>
            </View>
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Weekly Gross</Text>
            <Text style={styles.resultValue}>$5,000</Text>
          </View>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Monthly Gross</Text>
            <Text style={styles.resultValue}>$21,650</Text>
          </View>
          
          <View style={[styles.resultCard, styles.primaryResult]}>
            <Text style={styles.resultLabel}>Total Contract Value</Text>
            <Text style={[styles.resultValue, styles.primaryResultValue]}>
              $65,000
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <View style={styles.saveButton}>
            <Text style={styles.saveButtonText}>💾 Save Calculation</Text>
          </View>
          
          <View style={styles.shareButton}>
            <Text style={styles.shareButtonText}>📤 Share Results</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#64748b',
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
  categoryTags: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  activeCategoryTag: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  activeCategoryText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  boostedJobCard: {
    borderWidth: 2,
    borderColor: '#fbbf24',
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
  boostedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  boostedText: {
    fontSize: 12,
    color: '#d97706',
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
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  jobLocation: {
    fontSize: 12,
    color: '#64748b',
  },
  jobSalary: {
    fontSize: 12,
    color: '#64748b',
  },
  jobType: {
    fontSize: 12,
    color: '#64748b',
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
  // Job Details styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  detailContent: {
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 8,
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  shareContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  shareButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  // Calculator styles
  calculatorContent: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  inputSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputValue: {
    fontSize: 16,
    color: '#1e293b',
  },
  resultsSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  primaryResult: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  primaryResultValue: {
    fontSize: 18,
    color: '#2563eb',
  },
  actionSection: {
    margin: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})