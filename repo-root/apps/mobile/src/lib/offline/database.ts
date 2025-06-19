/**
 * Offline Database Setup
 * 
 * SQLite database for offline data storage and sync
 */

import * as SQLite from 'expo-sqlite'

const DATABASE_NAME = 'locumtruerate_offline.db'

// Open database connection
export const db = SQLite.openDatabase(DATABASE_NAME)

// Database version for migrations
const CURRENT_VERSION = 1

// Initialize database tables
export async function initializeDatabase() {
  return new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        // Version table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS db_version (
            version INTEGER PRIMARY KEY,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )`
        )

        // Jobs table for offline caching
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS offline_jobs (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            last_synced TEXT DEFAULT CURRENT_TIMESTAMP,
            is_favorite INTEGER DEFAULT 0,
            is_applied INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )`
        )

        // Job applications queue
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS offline_applications (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            application_data TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            synced_at TEXT,
            error TEXT
          )`
        )

        // Saved calculations
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS offline_calculations (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            input_data TEXT NOT NULL,
            result_data TEXT NOT NULL,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            synced_at TEXT
          )`
        )

        // User preferences
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS offline_preferences (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )`
        )

        // Sync queue for all pending operations
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            operation TEXT NOT NULL,
            data TEXT NOT NULL,
            priority INTEGER DEFAULT 0,
            retry_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_attempt TEXT,
            error TEXT
          )`
        )

        // Search history
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS search_history (
            id TEXT PRIMARY KEY,
            query TEXT NOT NULL,
            filters TEXT,
            results_count INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )`
        )

        // Create indexes for performance
        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_jobs_favorite ON offline_jobs(is_favorite)'
        )
        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_jobs_applied ON offline_jobs(is_applied)'
        )
        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_applications_status ON offline_applications(status)'
        )
        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(entity_type, created_at)'
        )

        // Check current version
        tx.executeSql(
          'SELECT version FROM db_version ORDER BY version DESC LIMIT 1',
          [],
          (_, result) => {
            const currentVersion = result.rows.length > 0 
              ? result.rows.item(0).version 
              : 0

            if (currentVersion < CURRENT_VERSION) {
              // Run migrations if needed
              runMigrations(tx, currentVersion, CURRENT_VERSION)
            }
          }
        )
      },
      error => {
        console.error('Database initialization error:', error)
        reject(error)
      },
      () => {
        resolve()
      }
    )
  })
}

// Run database migrations
function runMigrations(
  tx: SQLite.SQLTransaction, 
  fromVersion: number, 
  toVersion: number
) {
  // Add migration logic here as database evolves
  // For now, just update version
  tx.executeSql(
    'INSERT OR REPLACE INTO db_version (version) VALUES (?)',
    [toVersion]
  )
}

// Helper function to execute SQL with promise
export function executeSql(
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          reject(error)
          return true
        }
      )
    })
  })
}

// Helper function for batch operations
export function executeBatch(
  operations: Array<{ sql: string; params?: any[] }>
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        operations.forEach(({ sql, params = [] }) => {
          tx.executeSql(sql, params)
        })
      },
      error => reject(error),
      () => resolve()
    )
  })
}

// Clear all offline data
export async function clearOfflineData() {
  const tables = [
    'offline_jobs',
    'offline_applications',
    'offline_calculations',
    'offline_preferences',
    'sync_queue',
    'search_history'
  ]

  const operations = tables.map(table => ({
    sql: `DELETE FROM ${table}`
  }))

  await executeBatch(operations)
}

// Get database size info
export async function getDatabaseInfo() {
  const tables = [
    'offline_jobs',
    'offline_applications',
    'offline_calculations',
    'sync_queue'
  ]

  const info: Record<string, number> = {}

  for (const table of tables) {
    const result = await executeSql(
      `SELECT COUNT(*) as count FROM ${table}`
    )
    info[table] = result.rows.item(0).count
  }

  return info
}