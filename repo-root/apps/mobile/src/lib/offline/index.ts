/**
 * Offline Functionality Module
 * 
 * Exports all offline-related functionality
 */

export * from './database'
export * from './jobRepository'
export * from './applicationQueue'
export * from './syncManager'
export { useOfflineSync } from './useOfflineSync'

import { initializeDatabase } from './database'
import { SyncManager } from './syncManager'

// Initialize offline functionality
export async function initializeOffline() {
  try {
    // Initialize database
    await initializeDatabase()
    
    // Initialize sync manager
    const syncManager = SyncManager.getInstance()
    await syncManager.initialize()
    
    console.log('Offline functionality initialized')
  } catch (error) {
    console.error('Failed to initialize offline functionality:', error)
    throw error
  }
}