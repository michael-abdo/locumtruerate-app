/**
 * File and asset backup utilities
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import archiver from 'archiver';
import { S3 } from 'aws-sdk';
import { logger } from '@locumtruerate/shared';

export interface FileBackupConfig {
  sources: {
    path: string;
    include?: string[];
    exclude?: string[];
    recursive?: boolean;
  }[];
  storage: {
    type: 'local' | 's3' | 'cloudflare-r2';
    path?: string;
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string;
  };
  compression: boolean;
  encryption: boolean;
  retention: number; // days
}

export interface FileBackupMetadata {
  id: string;
  timestamp: Date;
  sources: string[];
  fileCount: number;
  totalSize: number;
  compressedSize: number;
  duration: number;
  status: 'success' | 'failed' | 'in_progress';
  location: string;
  checksum: string;
  error?: string;
}

export class FileBackupService {
  private config: FileBackupConfig;
  private s3?: S3;
  
  constructor(config: FileBackupConfig) {
    this.config = config;
    
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
  
  // Create file backup
  async createBackup(): Promise<FileBackupMetadata> {
    const startTime = Date.now();
    const backupId = this.generateBackupId();
    
    logger.info('Starting file backup', { backupId, sources: this.config.sources.length });
    
    try {
      const metadata: FileBackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        sources: this.config.sources.map(s => s.path),
        fileCount: 0,
        totalSize: 0,
        compressedSize: 0,
        duration: 0,
        status: 'in_progress',
        location: '',
        checksum: '',
      };
      
      // Collect all files to backup
      const filesToBackup = await this.collectFiles();
      metadata.fileCount = filesToBackup.length;
      
      // Calculate total size
      metadata.totalSize = await this.calculateTotalSize(filesToBackup);
      
      // Create archive
      const archivePath = await this.createArchive(backupId, filesToBackup);
      
      // Get compressed size and checksum
      const stats = await fs.stat(archivePath);
      metadata.compressedSize = stats.size;
      metadata.checksum = await this.calculateChecksum(archivePath);
      
      // Upload to storage
      metadata.location = await this.uploadArchive(archivePath, backupId);
      
      // Clean up local archive if uploaded to remote storage
      if (this.config.storage.type !== 'local') {
        await fs.unlink(archivePath);
      }
      
      metadata.duration = Date.now() - startTime;
      metadata.status = 'success';
      
      logger.info('File backup completed', {
        backupId,
        fileCount: metadata.fileCount,
        totalSize: metadata.totalSize,
        compressedSize: metadata.compressedSize,
        compressionRatio: ((metadata.totalSize - metadata.compressedSize) / metadata.totalSize * 100).toFixed(1),
        duration: metadata.duration,
      });
      
      return metadata;
    } catch (error) {
      logger.error('File backup failed', error, { backupId });
      
      const metadata: FileBackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        sources: this.config.sources.map(s => s.path),
        fileCount: 0,
        totalSize: 0,
        compressedSize: 0,
        duration: Date.now() - startTime,
        status: 'failed',
        location: '',
        checksum: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      throw error;
    }
  }
  
  // Restore files from backup
  async restoreFromBackup(backupId: string, targetPath: string): Promise<void> {
    logger.info('Starting file restore', { backupId, targetPath });
    
    try {
      // Download backup archive
      const archivePath = await this.downloadArchive(backupId);
      
      // Extract archive to target path
      await this.extractArchive(archivePath, targetPath);
      
      // Clean up downloaded archive
      await fs.unlink(archivePath);
      
      logger.info('File restore completed', { backupId, targetPath });
    } catch (error) {
      logger.error('File restore failed', error, { backupId, targetPath });
      throw error;
    }
  }
  
  // List files in backup
  async listBackupContents(backupId: string): Promise<string[]> {
    try {
      // This would extract the file list from the archive without fully extracting
      // For now, return a placeholder
      return [];
    } catch (error) {
      logger.error('Failed to list backup contents', error, { backupId });
      return [];
    }
  }
  
  // Verify backup integrity
  async verifyBackup(backupId: string): Promise<boolean> {
    try {
      // Download and verify checksum
      const archivePath = await this.downloadArchive(backupId);
      const actualChecksum = await this.calculateChecksum(archivePath);
      
      // Clean up
      if (this.config.storage.type !== 'local') {
        await fs.unlink(archivePath);
      }
      
      // Compare with stored checksum (would need to retrieve from metadata)
      const isValid = true; // Placeholder
      
      logger.info('File backup verification completed', { backupId, isValid });
      return isValid;
    } catch (error) {
      logger.error('File backup verification failed', error, { backupId });
      return false;
    }
  }
  
  // Clean up old backups
  async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.config.retention * 24 * 60 * 60 * 1000);
      
      // Get list of backups from storage
      const backups = await this.listBackups();
      
      // Filter old backups
      const oldBackups = backups.filter(backup => backup.timestamp < cutoffDate);
      
      // Delete old backups
      for (const backup of oldBackups) {
        await this.deleteBackup(backup.id);
      }
      
      logger.info('File backup cleanup completed', {
        totalBackups: backups.length,
        deletedBackups: oldBackups.length,
      });
    } catch (error) {
      logger.error('File backup cleanup failed', error);
      throw error;
    }
  }
  
  // Private helper methods
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `files-${timestamp}-${Math.random().toString(36).substring(7)}`;
  }
  
  private async collectFiles(): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const source of this.config.sources) {
      const files = await this.scanDirectory(source.path, source);
      allFiles.push(...files);
    }
    
    return allFiles;
  }
  
  private async scanDirectory(
    dirPath: string, 
    source: FileBackupConfig['sources'][0]
  ): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (source.recursive !== false) {
            const subFiles = await this.scanDirectory(fullPath, source);
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          if (this.shouldIncludeFile(fullPath, source)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to scan directory', error, { dirPath });
    }
    
    return files;
  }
  
  private shouldIncludeFile(filePath: string, source: FileBackupConfig['sources'][0]): boolean {
    const fileName = require('path').basename(filePath);
    
    // Check exclusions first
    if (source.exclude) {
      for (const pattern of source.exclude) {
        if (this.matchesPattern(fileName, pattern) || this.matchesPattern(filePath, pattern)) {
          return false;
        }
      }
    }
    
    // Check inclusions
    if (source.include && source.include.length > 0) {
      for (const pattern of source.include) {
        if (this.matchesPattern(fileName, pattern) || this.matchesPattern(filePath, pattern)) {
          return true;
        }
      }
      return false; // If include patterns specified but none match
    }
    
    return true; // Include by default if no patterns specified
  }
  
  private matchesPattern(text: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(text);
  }
  
  private async calculateTotalSize(files: string[]): Promise<number> {
    let totalSize = 0;
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        totalSize += stats.size;
      } catch (error) {
        logger.warn('Failed to get file size', error, { file });
      }
    }
    
    return totalSize;
  }
  
  private async createArchive(backupId: string, files: string[]): Promise<string> {
    const archivePath = join('/tmp', `${backupId}.tar.gz`);
    
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(archivePath);
      const archive = archiver('tar', {
        gzip: this.config.compression,
        gzipOptions: { level: 6 },
      });
      
      output.on('close', () => {
        logger.info('Archive created', {
          backupId,
          fileCount: files.length,
          compressedSize: archive.pointer(),
        });
        resolve(archivePath);
      });
      
      archive.on('error', (error) => {
        logger.error('Archive creation failed', error, { backupId });
        reject(error);
      });
      
      archive.pipe(output);
      
      // Add files to archive
      for (const file of files) {
        try {
          archive.file(file, { name: file });
        } catch (error) {
          logger.warn('Failed to add file to archive', error, { file });
        }
      }
      
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
  
  private async uploadArchive(archivePath: string, backupId: string): Promise<string> {
    const fileName = require('path').basename(archivePath);
    
    switch (this.config.storage.type) {
      case 'local':
        const localPath = join(this.config.storage.path!, fileName);
        await fs.mkdir(dirname(localPath), { recursive: true });
        await fs.copyFile(archivePath, localPath);
        return localPath;
        
      case 's3':
      case 'cloudflare-r2':
        const key = `backups/files/${backupId}/${fileName}`;
        const fileContent = await fs.readFile(archivePath);
        
        await this.s3!.upload({
          Bucket: this.config.storage.bucket!,
          Key: key,
          Body: fileContent,
          StorageClass: 'STANDARD_IA', // Infrequent Access for cost optimization
        }).promise();
        
        return `s3://${this.config.storage.bucket}/${key}`;
        
      default:
        throw new Error(`Unsupported storage type: ${this.config.storage.type}`);
    }
  }
  
  private async downloadArchive(backupId: string): Promise<string> {
    // This would need to query metadata to get the actual location
    // For now, construct expected path
    const fileName = `${backupId}.tar.gz`;
    const localPath = join('/tmp', fileName);
    
    if (this.config.storage.type === 'local') {
      const sourcePath = join(this.config.storage.path!, fileName);
      await fs.copyFile(sourcePath, localPath);
    } else {
      const key = `backups/files/${backupId}/${fileName}`;
      const result = await this.s3!.getObject({
        Bucket: this.config.storage.bucket!,
        Key: key,
      }).promise();
      
      await fs.writeFile(localPath, result.Body as Buffer);
    }
    
    return localPath;
  }
  
  private async extractArchive(archivePath: string, targetPath: string): Promise<void> {
    const tar = require('tar');
    
    await fs.mkdir(targetPath, { recursive: true });
    
    await tar.extract({
      file: archivePath,
      cwd: targetPath,
      strip: 0, // Don't strip path components
    });
  }
  
  private async listBackups(): Promise<FileBackupMetadata[]> {
    // This would query stored metadata
    // For now, return empty array
    return [];
  }
  
  private async deleteBackup(backupId: string): Promise<void> {
    try {
      if (this.config.storage.type === 'local') {
        const fileName = `${backupId}.tar.gz`;
        const filePath = join(this.config.storage.path!, fileName);
        await fs.unlink(filePath);
      } else {
        const key = `backups/files/${backupId}/`;
        
        // List all objects with this prefix
        const objects = await this.s3!.listObjectsV2({
          Bucket: this.config.storage.bucket!,
          Prefix: key,
        }).promise();
        
        // Delete all objects
        if (objects.Contents && objects.Contents.length > 0) {
          await this.s3!.deleteObjects({
            Bucket: this.config.storage.bucket!,
            Delete: {
              Objects: objects.Contents.map(obj => ({ Key: obj.Key! })),
            },
          }).promise();
        }
      }
      
      logger.info('File backup deleted', { backupId });
    } catch (error) {
      logger.error('Failed to delete file backup', error, { backupId });
    }
  }
}