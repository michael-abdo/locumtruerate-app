/**
 * Job Detail Screen
 * 
 * Displays detailed job information with share functionality
 */

import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, Stack, router } from 'expo-router'
import { trpc } from '@/lib/trpc'
import { ShareJobButton } from '@/components/ShareButton'
import { trackScreen, trackEvent, trackScreenLoadTime } from '@/services/analytics'
import { useOfflineJobs, useOfflineApplications } from '@/lib/offline'

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isOffline, toggleFavorite, isJobFavorite, jobRepository } = useOfflineJobs()
  const { submitApplication } = useOfflineApplications()
  
  // Track screen view
  useEffect(() => {
    trackScreen('Job Detail', { job_id: id })
    return () => {
      trackScreenLoadTime('Job Detail')
    }
  }, [id])

  // Fetch job data
  const { data: job, isLoading, error } = trpc.jobs.getById.useQuery(
    { id: id! },
    {
      enabled: !!id && !isOffline,
      onError: (error) => {
        console.error('Failed to fetch job:', error)
      }
    }
  )

  // Load offline job if needed
  const [offlineJob, setOfflineJob] = React.useState<any>(null)
  const [isFavorite, setIsFavorite] = React.useState(false)

  useEffect(() => {
    if (isOffline && id) {
      jobRepository.getJobById(id).then(job => {
        if (job) {
          setOfflineJob(job)
          setIsFavorite(job.isFavorite || false)
        }
      })
    } else if (id) {
      setIsFavorite(isJobFavorite(id))
    }
  }, [isOffline, id])

  const displayJob = job || offlineJob

  // Apply to job
  const handleApply = async () => {
    if (!displayJob) return

    Alert.alert(
      'Apply to Job',
      'Are you sure you want to apply to this position?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          style: 'default',
          onPress: async () => {
            try {
              if (isOffline) {
                // Queue application for later
                const result = await submitApplication(displayJob.id, {
                  coverLetter: 'Interested in this position',
                  availability: 'Immediate'
                })
                
                if (result.queued) {
                  Alert.alert(
                    'Application Queued',
                    'Your application will be submitted when you\'re back online.',
                    [{ text: 'OK' }]
                  )
                }
              } else {
                // Submit application online
                await trpc.applications.create.mutate({ jobId: displayJob.id })
                
                Alert.alert(
                  'Application Submitted',
                  'Your application has been successfully submitted!',
                  [{ text: 'OK' }]
                )
              }

              trackEvent('job_applied', {
                job_id: displayJob.id,
                job_title: displayJob.title,
                offline: isOffline,
                source: 'job_detail'
              })
            } catch (error: any) {
              Alert.alert(
                'Application Failed',
                error.message || 'Failed to submit application',
                [{ text: 'OK' }]
              )
            }
          }
        }
      ]
    )
  }

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!displayJob) return

    const newStatus = await toggleFavorite(displayJob.id)
    setIsFavorite(newStatus)
    
    trackEvent('job_saved', {
      job_id: displayJob.id,
      saved: newStatus,
      source: 'job_detail'
    })
  }

  if (isLoading || (!displayJob && !isOffline)) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !displayJob) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || 'Job not found'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const formatSalary = () => {
    if (displayJob.salary) {
      return `$${(displayJob.salary / 1000).toFixed(0)}k per year`
    }
    if (displayJob.salaryMin && displayJob.salaryMax) {
      return `$${(displayJob.salaryMin / 1000).toFixed(0)}k - $${(displayJob.salaryMax / 1000).toFixed(0)}k`
    }
    if (displayJob.salaryMin) {
      return `$${(displayJob.salaryMin / 1000).toFixed(0)}k+`
    }
    return 'Salary TBD'
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: displayJob.title,
          headerRight: () => (
            <TouchableOpacity onPress={handleToggleFavorite}>
              <Text style={styles.favoriteIcon}>
                {isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Company Header */}
        <View style={styles.header}>
          <View style={styles.companyLogo}>
            <Text style={styles.companyLogoText}>
              {displayJob.company.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.companyName}>{displayJob.company.name}</Text>
            <Text style={styles.jobTitle}>{displayJob.title}</Text>
          </View>
        </View>

        {/* Job Meta */}
        <View style={styles.metaContainer}>
          {displayJob.urgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>🔥 Urgent</Text>
            </View>
          )}
          {displayJob.remote && (
            <View style={styles.remoteBadge}>
              <Text style={styles.remoteText}>🏠 Remote</Text>
            </View>
          )}
          {displayJob.isBoosted && (
            <View style={styles.boostedBadge}>
              <Text style={styles.boostedText}>⭐ Featured</Text>
            </View>
          )}
        </View>

        {/* Key Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Location</Text>
            <Text style={styles.detailValue}>{displayJob.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Salary</Text>
            <Text style={styles.detailValue}>{formatSalary()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💼 Type</Text>
            <Text style={styles.detailValue}>{displayJob.jobType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Posted</Text>
            <Text style={styles.detailValue}>
              {new Date(displayJob.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {displayJob.expiresAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⏰ Expires</Text>
              <Text style={styles.detailValue}>
                {new Date(displayJob.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{displayJob.description}</Text>
        </View>

        {/* Requirements */}
        {displayJob.requirements && displayJob.requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            {displayJob.requirements.map((req: string, index: number) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Benefits */}
        {displayJob.benefits && displayJob.benefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            {displayJob.benefits.map((benefit: string, index: number) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.bulletText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Share Button */}
        <View style={styles.shareContainer}>
          <ShareJobButton
            jobId={displayJob.id}
            jobTitle={displayJob.title}
            companyName={displayJob.company.name}
            salary={formatSalary()}
            location={displayJob.location}
            style={styles.shareButton}
          />
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>
            {isOffline ? 'Queue Application' : 'Apply Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  companyLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  headerText: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  favoriteIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    paddingTop: 12,
    paddingBottom: 0,
    gap: 8,
  },
  urgentBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  urgentText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
  },
  remoteBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  remoteText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '500',
  },
  boostedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  boostedText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailRow: {
    borderBottomWidth: 0,
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
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#2563eb',
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  shareContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  shareButton: {
    marginTop: 8,
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  applyButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})