/**
 * Database backup and restoration utilities
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import archiver from 'archiver';
import { S3 } from 'aws-sdk';
import { logger } from '@locumtruerate/shared';
import { PrismaClient } from '@locumtruerate/database';

export interface BackupConfig {
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
  };
  storage: {
    type: 'local' | 's3' | 'cloudflare-r2';
    path?: string;
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string;
  };
  retention: {
    daily: number;    // Keep daily backups for N days
    weekly: number;   // Keep weekly backups for N weeks
    monthly: number;  // Keep monthly backups for N months
  };
  compression: boolean;
  encryption: boolean;
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  duration: number;
  status: 'success' | 'failed' | 'in_progress';
  location: string;
  checksum: string;
  tables: string[];
  error?: string;
}

export class DatabaseBackupService {
  private config: BackupConfig;
  private s3?: S3;
  private prisma: PrismaClient;
  
  constructor(config: BackupConfig, prisma: PrismaClient) {
    this.config = config;
    this.prisma = prisma;
    
    if (config.storage.type === 's3' || config.storage.type === 'cloudflare-r2') {
      this.s3 = new S3({
        accessKeyId: config.storage.accessKeyId!,
        secretAccessKey: config.storage.secretAccessKey!,
        region: config.storage.region,
        endpoint: config.storage.endpoint,
        s3ForcePathStyle: config.storage.type === 'cloudflare-r2',
      });
    }
  }
  
  // Create full database backup
  async createFullBackup(): Promise<BackupMetadata> {
    const startTime = Date.now();
    const backupId = this.generateBackupId('full');
    
    logger.info('Starting full database backup', { backupId });
    
    try {
      // Create backup metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        type: 'full',
        size: 0,
        duration: 0,
        status: 'in_progress',
        location: '',
        checksum: '',
        tables: [],
      };
      
      // Get list of all tables
      const tables = await this.getDatabaseTables();
      metadata.tables = tables;
      
      // Create database dump
      const dumpPath = await this.createDatabaseDump(backupId);
      
      // Compress if enabled
      let finalPath = dumpPath;
      if (this.config.compression) {
        finalPath = await this.compressBackup(dumpPath);
        await fs.unlink(dumpPath); // Remove uncompressed file
      }
      
      // Calculate file size and checksum
      const stats = await fs.stat(finalPath);
      metadata.size = stats.size;
      metadata.checksum = await this.calculateChecksum(finalPath);
      
      // Upload to storage
      metadata.location = await this.uploadBackup(finalPath, backupId);
      
      // Clean up local file if uploaded to remote storage
      if (this.config.storage.type !== 'local') {
        await fs.unlink(finalPath);
      }
      
      // Update metadata
      metadata.duration = Date.now() - startTime;
      metadata.status = 'success';
      
      // Store backup metadata
      await this.storeBackupMetadata(metadata);
      
      logger.info('Full database backup completed', {
        backupId,
        duration: metadata.duration,
        size: metadata.size,
        location: metadata.location,
      });
      
      return metadata;
    } catch (error) {
      logger.error('Full database backup failed', error, { backupId });
      
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        type: 'full',
        size: 0,
        duration: Date.now() - startTime,
        status: 'failed',
        location: '',
        checksum: '',
        tables: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      await this.storeBackupMetadata(metadata);
      throw error;
    }
  }
  
  // Create incremental backup
  async createIncrementalBackup(lastBackupTime: Date): Promise<BackupMetadata> {
    const startTime = Date.now();
    const backupId = this.generateBackupId('incremental');
    
    logger.info('Starting incremental database backup', { backupId, lastBackupTime });
    
    try {
      // Get changed data since last backup
      const changes = await this.getDataChanges(lastBackupTime);
      
      if (changes.length === 0) {
        logger.info('No changes found for incremental backup', { backupId });
        
        const metadata: BackupMetadata = {
          id: backupId,
          timestamp: new Date(),
          type: 'incremental',
          size: 0,
          duration: Date.now() - startTime,
          status: 'success',
          location: 'no-changes',
          checksum: '',
          tables: [],
        };
        
        await this.storeBackupMetadata(metadata);
        return metadata;
      }
      
      // Create incremental backup file
      const backupPath = await this.createIncrementalDump(backupId, changes);
      
      // Process similar to full backup
      let finalPath = backupPath;
      if (this.config.compression) {
        finalPath = await this.compressBackup(backupPath);
        await fs.unlink(backupPath);
      }
      
      const stats = await fs.stat(finalPath);
      const checksum = await this.calculateChecksum(finalPath);
      const location = await this.uploadBackup(finalPath, backupId);
      
      if (this.config.storage.type !== 'local') {
        await fs.unlink(finalPath);
      }
      
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        type: 'incremental',
        size: stats.size,
        duration: Date.now() - startTime,
        status: 'success',
        location,
        checksum,
        tables: changes.map(c => c.table),
      };
      
      await this.storeBackupMetadata(metadata);
      
      logger.info('Incremental database backup completed', {
        backupId,
        changes: changes.length,
        duration: metadata.duration,
        size: metadata.size,
      });
      
      return metadata;
    } catch (error) {
      logger.error('Incremental database backup failed', error, { backupId });
      throw error;
    }
  }
  
  // Restore database from backup
  async restoreFromBackup(backupId: string, targetDatabase?: string): Promise<void> {
    logger.info('Starting database restore', { backupId, targetDatabase });
    
    try {
      // Get backup metadata
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup ${backupId} not found`);
      }
      
      // Download backup file
      const backupPath = await this.downloadBackup(metadata);
      
      // Decompress if needed
      let restorePath = backupPath;
      if (this.config.compression && backupPath.endsWith('.gz')) {
        restorePath = await this.decompressBackup(backupPath);
      }
      
      // Verify checksum
      const actualChecksum = await this.calculateChecksum(restorePath);
      if (actualChecksum !== metadata.checksum) {
        throw new Error('Backup file integrity check failed');
      }
      
      // Perform restore
      await this.restoreDatabase(restorePath, targetDatabase);
      
      // Clean up
      await fs.unlink(restorePath);
      if (restorePath !== backupPath) {
        await fs.unlink(backupPath);
      }
      
      logger.info('Database restore completed', { backupId, targetDatabase });
    } catch (error) {
      logger.error('Database restore failed', error, { backupId });
      throw error;
    }
  }
  
  // Clean up old backups based on retention policy
  async cleanupOldBackups(): Promise<void> {
    try {
      const now = new Date();
      const cutoffDates = {
        daily: new Date(now.getTime() - this.config.retention.daily * 24 * 60 * 60 * 1000),
        weekly: new Date(now.getTime() - this.config.retention.weekly * 7 * 24 * 60 * 60 * 1000),
        monthly: new Date(now.getTime() - this.config.retention.monthly * 30 * 24 * 60 * 60 * 1000),
      };
      
      // Get all backups
      const allBackups = await this.getAllBackupMetadata();
      
      // Determine which backups to keep
      const backupsToDelete = this.determineBackupsToDelete(allBackups, cutoffDates);
      
      // Delete old backups
      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup);
      }
      
      logger.info('Backup cleanup completed', {
        totalBackups: allBackups.length,
        deletedBackups: backupsToDelete.length,
      });
    } catch (error) {
      logger.error('Backup cleanup failed', error);
      throw error;
    }
  }
  
  // Verify backup integrity
  async verifyBackup(backupId: string): Promise<boolean> {
    try {
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        return false;
      }
      
      // Download and verify checksum
      const backupPath = await this.downloadBackup(metadata);
      const actualChecksum = await this.calculateChecksum(backupPath);
      
      // Clean up
      if (this.config.storage.type !== 'local') {
        await fs.unlink(backupPath);
      }
      
      const isValid = actualChecksum === metadata.checksum;
      
      logger.info('Backup verification completed', {
        backupId,
        isValid,
        expectedChecksum: metadata.checksum,
        actualChecksum,
      });
      
      return isValid;
    } catch (error) {
      logger.error('Backup verification failed', error, { backupId });
      return false;
    }
  }
  
  // Private helper methods
  private generateBackupId(type: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${type}-${timestamp}-${Math.random().toString(36).substring(7)}`;
  }
  
  private async getDatabaseTables(): Promise<string[]> {
    const result = await this.prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    return result.map(row => row.tablename);
  }
  
  private async createDatabaseDump(backupId: string): Promise<string> {
    const dumpPath = join('/tmp', `${backupId}.sql`);
    
    return new Promise((resolve, reject) => {
      const pgDump = spawn('pg_dump', [
        '--host', this.config.database.host,
        '--port', this.config.database.port.toString(),
        '--username', this.config.database.username,
        '--dbname', this.config.database.name,
        '--file', dumpPath,
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
      ], {
        env: {
          ...process.env,
          PGPASSWORD: this.config.database.password,
        },
      });
      
      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve(dumpPath);
        } else {
          reject(new Error(`pg_dump failed with code ${code}`));
        }
      });
      
      pgDump.on('error', reject);
    });
  }
  
  private async getDataChanges(since: Date): Promise<any[]> {
    // This would be implemented based on your specific change tracking strategy
    // For example, using created_at/updated_at columns, WAL logs, or triggers
    return [];
  }
  
  private async createIncrementalDump(backupId: string, changes: any[]): Promise<string> {
    // Create SQL file with only changed data
    const dumpPath = join('/tmp', `${backupId}.sql`);
    // Implementation would depend on your change tracking strategy
    await fs.writeFile(dumpPath, '-- Incremental backup placeholder\n');
    return dumpPath;
  }
  
  private async compressBackup(filePath: string): Promise<string> {
    const compressedPath = `${filePath}.gz`;
    
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(compressedPath);
      const archive = archiver('gzip');
      
      output.on('close', () => resolve(compressedPath));
      archive.on('error', reject);
      
      archive.pipe(output);
      archive.file(filePath, { name: require('path').basename(filePath) });
      archive.finalize();
    });
  }
  
  private async calculateChecksum(filePath: string): Promise<string> {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const data = await fs.readFile(filePath);
    hash.update(data);
    return hash.digest('hex');
  }
  
  private async uploadBackup(filePath: string, backupId: string): Promise<string> {
    const fileName = require('path').basename(filePath);
    
    switch (this.config.storage.type) {
      case 'local':
        const localPath = join(this.config.storage.path!, fileName);
        await fs.copyFile(filePath, localPath);
        return localPath;
        
      case 's3':
      case 'cloudflare-r2':
        const key = `backups/database/${backupId}/${fileName}`;
        const fileContent = await fs.readFile(filePath);
        
        await this.s3!.upload({
          Bucket: this.config.storage.bucket!,
          Key: key,
          Body: fileContent,
        }).promise();
        
        return `s3://${this.config.storage.bucket}/${key}`;
        
      default:
        throw new Error(`Unsupported storage type: ${this.config.storage.type}`);
    }
  }
  
  private async downloadBackup(metadata: BackupMetadata): Promise<string> {
    const fileName = `${metadata.id}.sql${this.config.compression ? '.gz' : ''}`;
    const localPath = join('/tmp', fileName);
    
    if (metadata.location.startsWith('s3://')) {
      const key = metadata.location.replace(`s3://${this.config.storage.bucket}/`, '');
      const result = await this.s3!.getObject({
        Bucket: this.config.storage.bucket!,
        Key: key,
      }).promise();
      
      await fs.writeFile(localPath, result.Body as Buffer);
    } else {
      // Local file
      await fs.copyFile(metadata.location, localPath);
    }
    
    return localPath;
  }
  
  private async decompressBackup(filePath: string): Promise<string> {
    // Implementation for decompression
    const outputPath = filePath.replace('.gz', '');
    // Use zlib or similar to decompress
    return outputPath;
  }
  
  private async restoreDatabase(backupPath: string, targetDatabase?: string): Promise<void> {
    const dbName = targetDatabase || this.config.database.name;
    
    return new Promise((resolve, reject) => {
      const psql = spawn('psql', [
        '--host', this.config.database.host,
        '--port', this.config.database.port.toString(),
        '--username', this.config.database.username,
        '--dbname', dbName,
        '--file', backupPath,
      ], {
        env: {
          ...process.env,
          PGPASSWORD: this.config.database.password,
        },
      });
      
      psql.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`psql restore failed with code ${code}`));
        }
      });
      
      psql.on('error', reject);
    });
  }
  
  private async storeBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      await this.prisma.backupMetadata.create({
        data: {
          id: metadata.id,
          timestamp: metadata.timestamp,
          type: metadata.type,
          size: metadata.size,
          duration: metadata.duration,
          status: metadata.status,
          location: metadata.location,
          checksum: metadata.checksum,
          tables: metadata.tables,
          error: metadata.error,
        },
      });
    } catch (error) {
      logger.error('Failed to store backup metadata', error, { backupId: metadata.id });
    }
  }
  
  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      const backup = await this.prisma.backupMetadata.findUnique({
        where: { id: backupId },
      });
      return backup as BackupMetadata | null;
    } catch (error) {
      logger.error('Failed to get backup metadata', error, { backupId });
      return null;
    }
  }
  
  private async getAllBackupMetadata(): Promise<BackupMetadata[]> {
    try {
      const backups = await this.prisma.backupMetadata.findMany({
        orderBy: { timestamp: 'desc' },
      });
      return backups as BackupMetadata[];
    } catch (error) {
      logger.error('Failed to get all backup metadata', error);
      return [];
    }
  }
  
  private determineBackupsToDelete(
    allBackups: BackupMetadata[], 
    cutoffDates: { daily: Date; weekly: Date; monthly: Date }
  ): BackupMetadata[] {
    // Implement retention logic
    // Keep all backups within daily retention period
    // Keep weekly backups (e.g., Sunday backups) within weekly retention period
    // Keep monthly backups (e.g., first of month) within monthly retention period
    
    const toDelete: BackupMetadata[] = [];
    
    for (const backup of allBackups) {
      const backupDate = new Date(backup.timestamp);
      
      // Keep if within daily retention
      if (backupDate > cutoffDates.daily) {
        continue;
      }
      
      // Keep if it's a weekly backup within weekly retention
      if (backupDate > cutoffDates.weekly && backupDate.getDay() === 0) {
        continue;
      }
      
      // Keep if it's a monthly backup within monthly retention
      if (backupDate > cutoffDates.monthly && backupDate.getDate() === 1) {
        continue;
      }
      
      // Otherwise, mark for deletion
      toDelete.push(backup);
    }
    
    return toDelete;
  }
  
  private async deleteBackup(backup: BackupMetadata): Promise<void> {
    try {
      // Delete from storage
      if (backup.location.startsWith('s3://')) {
        const key = backup.location.replace(`s3://${this.config.storage.bucket}/`, '');
        await this.s3!.deleteObject({
          Bucket: this.config.storage.bucket!,
          Key: key,
        }).promise();
      } else {
        await fs.unlink(backup.location);
      }
      
      // Delete metadata
      await this.prisma.backupMetadata.delete({
        where: { id: backup.id },
      });
      
      logger.info('Backup deleted', { backupId: backup.id, location: backup.location });
    } catch (error) {
      logger.error('Failed to delete backup', error, { backupId: backup.id });
    }
  }
}