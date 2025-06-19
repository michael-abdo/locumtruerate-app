/**
 * Offline Job Repository
 * 
 * Handles offline storage and retrieval of job listings
 */

import { nanoid } from 'nanoid/non-secure'
import { executeSql, executeBatch } from './database'
import { Analytics } from '../../services/analytics'

export interface OfflineJob {
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
  // Offline-specific fields
  isFavorite?: boolean
  isApplied?: boolean
  lastSynced?: string
}

export class JobRepository {
  // Save jobs to offline storage
  async saveJobs(jobs: OfflineJob[]): Promise<void> {
    const operations = jobs.map(job => ({
      sql: `INSERT OR REPLACE INTO offline_jobs (id, data, last_synced) VALUES (?, ?, ?)`,
      params: [
        job.id,
        JSON.stringify(job),
        new Date().toISOString()
      ]
    }))

    await executeBatch(operations)
    
    Analytics.addBreadcrumb('Jobs saved offline', { count: jobs.length })
  }

  // Get all offline jobs
  async getAllJobs(options?: {
    onlyFavorites?: boolean
    onlyApplied?: boolean
    limit?: number
    offset?: number
  }): Promise<OfflineJob[]> {
    let sql = 'SELECT * FROM offline_jobs WHERE 1=1'
    const params: any[] = []

    if (options?.onlyFavorites) {
      sql += ' AND is_favorite = 1'
    }

    if (options?.onlyApplied) {
      sql += ' AND is_applied = 1'
    }

    sql += ' ORDER BY created_at DESC'

    if (options?.limit) {
      sql += ' LIMIT ?'
      params.push(options.limit)
      
      if (options?.offset) {
        sql += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const result = await executeSql(sql, params)
    const jobs: OfflineJob[] = []

    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i)
      const jobData = JSON.parse(row.data)
      jobs.push({
        ...jobData,
        isFavorite: row.is_favorite === 1,
        isApplied: row.is_applied === 1,
        lastSynced: row.last_synced
      })
    }

    return jobs
  }

  // Get single job by ID
  async getJobById(jobId: string): Promise<OfflineJob | null> {
    const result = await executeSql(
      'SELECT * FROM offline_jobs WHERE id = ?',
      [jobId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows.item(0)
    const jobData = JSON.parse(row.data)
    
    return {
      ...jobData,
      isFavorite: row.is_favorite === 1,
      isApplied: row.is_applied === 1,
      lastSynced: row.last_synced
    }
  }

  // Toggle favorite status
  async toggleFavorite(jobId: string): Promise<boolean> {
    // First check current status
    const job = await this.getJobById(jobId)
    if (!job) {
      throw new Error('Job not found')
    }

    const newStatus = !job.isFavorite
    
    await executeSql(
      'UPDATE offline_jobs SET is_favorite = ? WHERE id = ?',
      [newStatus ? 1 : 0, jobId]
    )

    Analytics.trackEvent('job_saved', {
      job_id: jobId,
      saved: newStatus,
      offline: true
    })

    return newStatus
  }

  // Mark job as applied
  async markAsApplied(jobId: string): Promise<void> {
    await executeSql(
      'UPDATE offline_jobs SET is_applied = 1 WHERE id = ?',
      [jobId]
    )

    Analytics.addBreadcrumb('Job marked as applied offline', { jobId })
  }

  // Search jobs offline
  async searchJobs(query: string, filters?: {
    location?: string
    jobType?: string
    remote?: boolean
    salaryMin?: number
    salaryMax?: number
  }): Promise<OfflineJob[]> {
    // For offline search, we'll do basic filtering in memory
    // In a production app, you might want to use FTS5 for better search
    const allJobs = await this.getAllJobs()
    
    return allJobs.filter(job => {
      // Text search
      if (query) {
        const searchText = query.toLowerCase()
        const matchesText = 
          job.title.toLowerCase().includes(searchText) ||
          job.company.name.toLowerCase().includes(searchText) ||
          job.description.toLowerCase().includes(searchText) ||
          job.location.toLowerCase().includes(searchText)
        
        if (!matchesText) return false
      }

      // Location filter
      if (filters?.location && 
          !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false
      }

      // Job type filter
      if (filters?.jobType && job.jobType !== filters.jobType) {
        return false
      }

      // Remote filter
      if (filters?.remote !== undefined && job.remote !== filters.remote) {
        return false
      }

      // Salary filters
      if (filters?.salaryMin) {
        const jobMinSalary = job.salaryMin || job.salary || 0
        if (jobMinSalary < filters.salaryMin) return false
      }

      if (filters?.salaryMax) {
        const jobMaxSalary = job.salaryMax || job.salary || Infinity
        if (jobMaxSalary > filters.salaryMax) return false
      }

      return true
    })
  }

  // Get jobs that need syncing
  async getJobsForSync(limit: number = 50): Promise<string[]> {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 24) // 24 hours ago

    const result = await executeSql(
      `SELECT id FROM offline_jobs 
       WHERE last_synced < ? OR last_synced IS NULL
       ORDER BY last_synced ASC
       LIMIT ?`,
      [cutoffDate.toISOString(), limit]
    )

    const jobIds: string[] = []
    for (let i = 0; i < result.rows.length; i++) {
      jobIds.push(result.rows.item(i).id)
    }

    return jobIds
  }

  // Update sync timestamp
  async updateSyncTimestamp(jobIds: string[]): Promise<void> {
    const timestamp = new Date().toISOString()
    const operations = jobIds.map(id => ({
      sql: 'UPDATE offline_jobs SET last_synced = ? WHERE id = ?',
      params: [timestamp, id]
    }))

    await executeBatch(operations)
  }

  // Clean up old jobs
  async cleanupOldJobs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await executeSql(
      `DELETE FROM offline_jobs 
       WHERE created_at < ? 
       AND is_favorite = 0 
       AND is_applied = 0`,
      [cutoffDate.toISOString()]
    )

    const deletedCount = result.rowsAffected
    
    if (deletedCount > 0) {
      Analytics.addBreadcrumb('Cleaned up old offline jobs', { 
        count: deletedCount,
        daysToKeep 
      })
    }

    return deletedCount
  }

  // Get storage stats
  async getStorageStats() {
    const totalResult = await executeSql(
      'SELECT COUNT(*) as count FROM offline_jobs'
    )
    const favoriteResult = await executeSql(
      'SELECT COUNT(*) as count FROM offline_jobs WHERE is_favorite = 1'
    )
    const appliedResult = await executeSql(
      'SELECT COUNT(*) as count FROM offline_jobs WHERE is_applied = 1'
    )

    return {
      total: totalResult.rows.item(0).count,
      favorites: favoriteResult.rows.item(0).count,
      applied: appliedResult.rows.item(0).count
    }
  }
}