/**
 * Offline Sync Hook
 * 
 * React hook for managing offline sync status and operations
 */

import { useState, useEffect, useCallback } from 'react'
import { SyncManager, SyncStatus } from './syncManager'
import { JobRepository } from './jobRepository'
import { ApplicationQueue } from './applicationQueue'
import { Analytics } from '../../services/analytics'

export interface OfflineSyncHook {
  syncStatus: SyncStatus
  isOffline: boolean
  isSyncing: boolean
  pendingCount: number
  forceSync: () => Promise<void>
  clearErrors: () => Promise<void>
  jobRepository: JobRepository
  applicationQueue: ApplicationQueue
}

export function useOfflineSync(): OfflineSyncHook {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingOperations: 0,
    errors: []
  })

  const syncManager = SyncManager.getInstance()
  const jobRepository = new JobRepository()
  const applicationQueue = new ApplicationQueue()

  useEffect(() => {
    // Subscribe to sync status updates
    const handleStatusUpdate = (status: SyncStatus) => {
      setSyncStatus(status)
      
      // Track sync status changes
      if (status.isSyncing) {
        Analytics.addBreadcrumb('Sync status changed', {
          online: status.isOnline,
          syncing: status.isSyncing,
          pending: status.pendingOperations
        })
      }
    }

    syncManager.addSyncListener(handleStatusUpdate)

    // Get initial status
    syncManager.getSyncStatus().then(setSyncStatus)

    return () => {
      syncManager.removeSyncListener(handleStatusUpdate)
    }
  }, [])

  const forceSync = useCallback(async () => {
    Analytics.trackEvent('sync_requested', {
      source: 'user_action',
      pending_count: syncStatus.pendingOperations
    })
    
    await syncManager.forceSync()
  }, [syncStatus.pendingOperations])

  const clearErrors = useCallback(async () => {
    await syncManager.clearSyncErrors()
    Analytics.trackEvent('sync_requested', {
      action: 'clear_errors'
    })
  }, [])

  return {
    syncStatus,
    isOffline: !syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    pendingCount: syncStatus.pendingOperations,
    forceSync,
    clearErrors,
    jobRepository,
    applicationQueue
  }
}

// Hook for offline job management
export function useOfflineJobs() {
  const { jobRepository, isOffline } = useOfflineSync()
  const [favoriteJobs, setFavoriteJobs] = useState<Set<string>>(new Set())

  // Load favorite jobs on mount
  useEffect(() => {
    jobRepository.getAllJobs({ onlyFavorites: true }).then(jobs => {
      setFavoriteJobs(new Set(jobs.map(j => j.id)))
    })
  }, [])

  const toggleFavorite = useCallback(async (jobId: string) => {
    const newStatus = await jobRepository.toggleFavorite(jobId)
    
    setFavoriteJobs(prev => {
      const newSet = new Set(prev)
      if (newStatus) {
        newSet.add(jobId)
      } else {
        newSet.delete(jobId)
      }
      return newSet
    })

    return newStatus
  }, [jobRepository])

  const isJobFavorite = useCallback((jobId: string) => {
    return favoriteJobs.has(jobId)
  }, [favoriteJobs])

  return {
    isOffline,
    favoriteJobs,
    toggleFavorite,
    isJobFavorite,
    jobRepository
  }
}

// Hook for offline application management
export function useOfflineApplications() {
  const { applicationQueue, isOffline } = useOfflineSync()
  const [statistics, setStatistics] = useState({
    pending: 0,
    synced: 0,
    errors: 0
  })

  // Load statistics on mount and when sync status changes
  useEffect(() => {
    applicationQueue.getStatistics().then(setStatistics)
  }, [isOffline])

  const submitApplication = useCallback(async (
    jobId: string,
    applicationData: any
  ) => {
    if (isOffline) {
      // Queue for later submission
      const applicationId = await applicationQueue.queueApplication(
        jobId,
        applicationData
      )
      
      // Update statistics
      setStatistics(prev => ({
        ...prev,
        pending: prev.pending + 1
      }))

      return { queued: true, applicationId }
    }

    // If online, submit directly (handled by main app logic)
    return { queued: false }
  }, [applicationQueue, isOffline])

  const retryFailed = useCallback(async () => {
    const retryCount = await applicationQueue.retryFailedApplications()
    
    if (retryCount > 0) {
      // Refresh statistics
      const newStats = await applicationQueue.getStatistics()
      setStatistics(newStats)
    }

    return retryCount
  }, [applicationQueue])

  return {
    isOffline,
    statistics,
    submitApplication,
    retryFailed,
    applicationQueue
  }
}