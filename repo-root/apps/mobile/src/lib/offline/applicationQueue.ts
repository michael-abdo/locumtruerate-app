/**
 * Application Queue Manager
 * 
 * Handles offline job application submissions
 */

import { nanoid } from 'nanoid/non-secure'
import { executeSql, executeBatch } from './database'
import { Analytics } from '../../services/analytics'

export interface QueuedApplication {
  id: string
  jobId: string
  applicationData: string
  status: 'pending' | 'syncing' | 'synced' | 'error'
  createdAt: string
  syncedAt?: string
  error?: string
  retryCount: number
}

export interface ApplicationData {
  coverLetter?: string
  resume?: string
  answers?: Record<string, string>
  availability?: string
  expectedSalary?: number
}

export class ApplicationQueue {
  // Queue a new application
  async queueApplication(
    jobId: string, 
    applicationData: ApplicationData
  ): Promise<string> {
    const id = nanoid()
    
    await executeSql(
      `INSERT INTO offline_applications 
       (id, job_id, application_data, status, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        jobId,
        JSON.stringify(applicationData),
        'pending',
        new Date().toISOString()
      ]
    )

    // Also add to sync queue for redundancy
    await executeSql(
      `INSERT INTO sync_queue 
       (id, entity_type, entity_id, operation, data, priority) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        'application',
        id,
        'create',
        JSON.stringify({ jobId, applicationData }),
        1 // High priority
      ]
    )

    Analytics.trackEvent('job_applied', {
      job_id: jobId,
      offline: true,
      queued: true
    })

    return id
  }

  // Get all pending applications
  async getPendingApplications(): Promise<QueuedApplication[]> {
    const result = await executeSql(
      `SELECT * FROM offline_applications 
       WHERE status = ? 
       ORDER BY created_at ASC`,
      ['pending']
    )

    const applications: QueuedApplication[] = []
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i)
      applications.push({
        id: row.id,
        jobId: row.job_id,
        applicationData: row.application_data,
        status: row.status,
        createdAt: row.created_at,
        syncedAt: row.synced_at,
        error: row.error,
        retryCount: 0
      })
    }

    return applications
  }

  // Get application by ID
  async getApplication(applicationId: string): Promise<QueuedApplication | null> {
    const result = await executeSql(
      'SELECT * FROM offline_applications WHERE id = ?',
      [applicationId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows.item(0)
    return {
      id: row.id,
      jobId: row.job_id,
      applicationData: row.application_data,
      status: row.status,
      createdAt: row.created_at,
      syncedAt: row.synced_at,
      error: row.error,
      retryCount: 0
    }
  }

  // Mark application as syncing
  async markAsSyncing(applicationId: string): Promise<void> {
    await executeSql(
      'UPDATE offline_applications SET status = ? WHERE id = ?',
      ['syncing', applicationId]
    )
  }

  // Mark application as synced
  async markAsSynced(applicationId: string): Promise<void> {
    const now = new Date().toISOString()
    
    await executeSql(
      `UPDATE offline_applications 
       SET status = ?, synced_at = ?, error = NULL 
       WHERE id = ?`,
      ['synced', now, applicationId]
    )

    // Remove from sync queue
    await executeSql(
      'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
      ['application', applicationId]
    )

    Analytics.addBreadcrumb('Application synced successfully', { applicationId })
  }

  // Mark application as error
  async markAsError(applicationId: string, error: string): Promise<void> {
    await executeSql(
      `UPDATE offline_applications 
       SET status = ?, error = ? 
       WHERE id = ?`,
      ['error', error, applicationId]
    )

    // Update sync queue with error
    await executeSql(
      `UPDATE sync_queue 
       SET error = ?, last_attempt = ?, retry_count = retry_count + 1 
       WHERE entity_type = ? AND entity_id = ?`,
      [error, new Date().toISOString(), 'application', applicationId]
    )

    Analytics.captureError(new Error(`Application sync failed: ${error}`), {
      applicationId
    })
  }

  // Get application statistics
  async getStatistics() {
    const results = await Promise.all([
      executeSql('SELECT COUNT(*) as count FROM offline_applications WHERE status = ?', ['pending']),
      executeSql('SELECT COUNT(*) as count FROM offline_applications WHERE status = ?', ['synced']),
      executeSql('SELECT COUNT(*) as count FROM offline_applications WHERE status = ?', ['error'])
    ])

    return {
      pending: results[0].rows.item(0).count,
      synced: results[1].rows.item(0).count,
      errors: results[2].rows.item(0).count
    }
  }

  // Get applications by job ID
  async getApplicationsByJobId(jobId: string): Promise<QueuedApplication[]> {
    const result = await executeSql(
      `SELECT * FROM offline_applications 
       WHERE job_id = ? 
       ORDER BY created_at DESC`,
      [jobId]
    )

    const applications: QueuedApplication[] = []
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i)
      applications.push({
        id: row.id,
        jobId: row.job_id,
        applicationData: row.application_data,
        status: row.status,
        createdAt: row.created_at,
        syncedAt: row.synced_at,
        error: row.error,
        retryCount: 0
      })
    }

    return applications
  }

  // Retry failed applications
  async retryFailedApplications(): Promise<number> {
    const result = await executeSql(
      `UPDATE offline_applications 
       SET status = ?, error = NULL 
       WHERE status = ?`,
      ['pending', 'error']
    )

    const retryCount = result.rowsAffected

    if (retryCount > 0) {
      Analytics.trackEvent('job_applied', {
        retry: true,
        count: retryCount
      })
    }

    return retryCount
  }

  // Clean up old synced applications
  async cleanupSyncedApplications(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await executeSql(
      `DELETE FROM offline_applications 
       WHERE status = ? AND synced_at < ?`,
      ['synced', cutoffDate.toISOString()]
    )

    return result.rowsAffected
  }

  // Cancel pending application
  async cancelApplication(applicationId: string): Promise<void> {
    await executeBatch([
      {
        sql: 'DELETE FROM offline_applications WHERE id = ?',
        params: [applicationId]
      },
      {
        sql: 'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
        params: ['application', applicationId]
      }
    ])

    Analytics.trackEvent('job_applied', {
      cancelled: true,
      offline: true
    })
  }
}