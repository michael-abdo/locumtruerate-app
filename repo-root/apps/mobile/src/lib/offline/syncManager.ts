/**
 * Sync Manager
 * 
 * Handles synchronization between offline and online data
 */

import NetInfo from '@react-native-community/netinfo'
import { executeSql, executeBatch } from './database'
import { JobRepository } from './jobRepository'
import { ApplicationQueue } from './applicationQueue'
import { Analytics } from '../../services/analytics'
import { trpc } from '../../lib/trpc'

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime?: string
  pendingOperations: number
  errors: SyncError[]
}

export interface SyncError {
  id: string
  entityType: string
  operation: string
  error: string
  timestamp: string
}

export class SyncManager {
  private static instance: SyncManager
  private jobRepository: JobRepository
  private applicationQueue: ApplicationQueue
  private isSyncing = false
  private syncListeners: Set<(status: SyncStatus) => void> = new Set()
  private networkUnsubscribe: (() => void) | null = null
  private syncInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.jobRepository = new JobRepository()
    this.applicationQueue = new ApplicationQueue()
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  // Initialize sync manager
  async initialize() {
    // Set up network monitoring
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      this.handleNetworkChange(state.isConnected || false)
    })

    // Set up periodic sync (every 5 minutes when online)
    this.syncInterval = setInterval(() => {
      this.syncIfNeeded()
    }, 5 * 60 * 1000)

    // Initial sync check
    const netState = await NetInfo.fetch()
    if (netState.isConnected) {
      this.syncIfNeeded()
    }

    Analytics.addBreadcrumb('Sync manager initialized')
  }

  // Clean up resources
  destroy() {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe()
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.syncListeners.clear()
  }

  // Add sync status listener
  addSyncListener(listener: (status: SyncStatus) => void) {
    this.syncListeners.add(listener)
    // Send current status immediately
    this.notifyListeners()
  }

  // Remove sync status listener
  removeSyncListener(listener: (status: SyncStatus) => void) {
    this.syncListeners.delete(listener)
  }

  // Handle network state changes
  private async handleNetworkChange(isOnline: boolean) {
    Analytics.addBreadcrumb('Network state changed', { isOnline })
    
    if (isOnline && !this.isSyncing) {
      // Delay sync to avoid immediate sync on network flicker
      setTimeout(() => {
        this.syncIfNeeded()
      }, 2000)
    }
    
    this.notifyListeners()
  }

  // Check if sync is needed
  private async syncIfNeeded() {
    const netState = await NetInfo.fetch()
    if (!netState.isConnected || this.isSyncing) {
      return
    }

    const pendingCount = await this.getPendingOperationsCount()
    if (pendingCount > 0) {
      this.performSync()
    }
  }

  // Perform full sync
  async performSync() {
    if (this.isSyncing) {
      console.log('Sync already in progress')
      return
    }

    const netState = await NetInfo.fetch()
    if (!netState.isConnected) {
      console.log('Cannot sync: No network connection')
      return
    }

    this.isSyncing = true
    this.notifyListeners()

    const startTime = Date.now()
    let successCount = 0
    let errorCount = 0

    try {
      Analytics.trackEvent('sync_started', {
        pending_operations: await this.getPendingOperationsCount()
      })

      // 1. Sync pending job applications
      const applicationResults = await this.syncPendingApplications()
      successCount += applicationResults.success
      errorCount += applicationResults.errors

      // 2. Sync saved calculations
      const calculationResults = await this.syncCalculations()
      successCount += calculationResults.success
      errorCount += calculationResults.errors

      // 3. Sync user preferences
      const preferenceResults = await this.syncPreferences()
      successCount += preferenceResults.success
      errorCount += preferenceResults.errors

      // 4. Update cached job data
      await this.updateCachedJobs()

      // 5. Clean up old data
      await this.jobRepository.cleanupOldJobs()

      // Update last sync time
      await executeSql(
        `INSERT OR REPLACE INTO offline_preferences (key, value) VALUES (?, ?)`,
        ['last_sync_time', new Date().toISOString()]
      )

      Analytics.trackEvent('sync_completed', {
        duration_ms: Date.now() - startTime,
        success_count: successCount,
        error_count: errorCount
      })

    } catch (error) {
      console.error('Sync error:', error)
      Analytics.captureError(error as Error, { context: 'sync_manager' })
    } finally {
      this.isSyncing = false
      this.notifyListeners()
    }
  }

  // Sync pending job applications
  private async syncPendingApplications(): Promise<{ success: number; errors: number }> {
    const pendingApplications = await this.applicationQueue.getPendingApplications()
    let success = 0
    let errors = 0

    for (const application of pendingApplications) {
      try {
        // Call API to submit application
        await trpc.applications.create.mutate({
          jobId: application.jobId,
          ...JSON.parse(application.applicationData)
        })

        // Mark as synced
        await this.applicationQueue.markAsSynced(application.id)
        success++

        Analytics.addBreadcrumb('Application synced', { 
          applicationId: application.id,
          jobId: application.jobId 
        })

      } catch (error: any) {
        errors++
        await this.applicationQueue.markAsError(
          application.id, 
          error.message || 'Unknown error'
        )

        Analytics.captureError(error, {
          context: 'sync_applications',
          applicationId: application.id
        })
      }
    }

    return { success, errors }
  }

  // Sync saved calculations
  private async syncCalculations(): Promise<{ success: number; errors: number }> {
    const result = await executeSql(
      `SELECT * FROM offline_calculations WHERE synced_at IS NULL`
    )

    let success = 0
    let errors = 0

    for (let i = 0; i < result.rows.length; i++) {
      const calc = result.rows.item(i)
      
      try {
        // In a real app, you'd call an API to save calculations
        // For now, just mark as synced
        await executeSql(
          `UPDATE offline_calculations SET synced_at = ? WHERE id = ?`,
          [new Date().toISOString(), calc.id]
        )
        success++

      } catch (error) {
        errors++
        console.error('Failed to sync calculation:', error)
      }
    }

    return { success, errors }
  }

  // Sync user preferences
  private async syncPreferences(): Promise<{ success: number; errors: number }> {
    // In a real app, this would sync preferences with the server
    // For now, just return success
    return { success: 0, errors: 0 }
  }

  // Update cached job data
  private async updateCachedJobs() {
    const jobIds = await this.jobRepository.getJobsForSync(50)
    
    if (jobIds.length === 0) {
      return
    }

    try {
      // In a real app, you'd fetch updated job data from the API
      // For now, just update sync timestamps
      await this.jobRepository.updateSyncTimestamp(jobIds)
      
      Analytics.addBreadcrumb('Updated cached jobs', { count: jobIds.length })
    } catch (error) {
      console.error('Failed to update cached jobs:', error)
    }
  }

  // Get pending operations count
  async getPendingOperationsCount(): Promise<number> {
    const results = await Promise.all([
      executeSql('SELECT COUNT(*) as count FROM offline_applications WHERE status = ?', ['pending']),
      executeSql('SELECT COUNT(*) as count FROM offline_calculations WHERE synced_at IS NULL'),
      executeSql('SELECT COUNT(*) as count FROM sync_queue WHERE retry_count < 3')
    ])

    return results.reduce((total, result) => {
      return total + (result.rows.item(0).count || 0)
    }, 0)
  }

  // Get sync errors
  async getSyncErrors(): Promise<SyncError[]> {
    const result = await executeSql(
      `SELECT * FROM sync_queue 
       WHERE error IS NOT NULL 
       ORDER BY last_attempt DESC 
       LIMIT 10`
    )

    const errors: SyncError[] = []
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i)
      errors.push({
        id: row.id,
        entityType: row.entity_type,
        operation: row.operation,
        error: row.error,
        timestamp: row.last_attempt
      })
    }

    return errors
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const netState = await NetInfo.fetch()
    const pendingOperations = await this.getPendingOperationsCount()
    const errors = await this.getSyncErrors()
    
    const lastSyncResult = await executeSql(
      `SELECT value FROM offline_preferences WHERE key = ?`,
      ['last_sync_time']
    )
    
    const lastSyncTime = lastSyncResult.rows.length > 0 
      ? lastSyncResult.rows.item(0).value 
      : undefined

    return {
      isOnline: netState.isConnected || false,
      isSyncing: this.isSyncing,
      lastSyncTime,
      pendingOperations,
      errors
    }
  }

  // Notify all listeners of status change
  private async notifyListeners() {
    const status = await this.getSyncStatus()
    this.syncListeners.forEach(listener => {
      listener(status)
    })
  }

  // Force sync (user-triggered)
  async forceSync() {
    Analytics.trackEvent('sync_requested', { source: 'user' })
    await this.performSync()
  }

  // Clear sync errors
  async clearSyncErrors() {
    await executeSql(
      `DELETE FROM sync_queue WHERE error IS NOT NULL`
    )
    this.notifyListeners()
  }
}