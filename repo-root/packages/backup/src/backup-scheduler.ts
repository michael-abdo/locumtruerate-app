/**
 * Backup scheduling and orchestration
 */

import cron from 'node-cron';
import { logger } from '@locumtruerate/shared';
import { DatabaseBackupService } from './database-backup';
import { FileBackupService } from './file-backup';

export interface BackupSchedule {
  id: string;
  name: string;
  type: 'database' | 'files' | 'full';
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  maxRetries: number;
  retryDelay: number; // minutes
}

export interface BackupJob {
  id: string;
  scheduleId: string;
  type: 'database' | 'files' | 'full';
  status: 'pending' | 'running' | 'success' | 'failed' | 'retrying';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  attempt: number;
  maxAttempts: number;
  error?: string;
  backupIds: string[];
}

export class BackupSchedulerService {
  private schedules: Map<string, BackupSchedule> = new Map();
  private activeJobs: Map<string, BackupJob> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private databaseBackup: DatabaseBackupService;
  private fileBackup: FileBackupService;
  
  constructor(databaseBackup: DatabaseBackupService, fileBackup: FileBackupService) {
    this.databaseBackup = databaseBackup;
    this.fileBackup = fileBackup;
  }
  
  // Initialize scheduler with default schedules
  async initialize(): Promise<void> {
    logger.info('Initializing backup scheduler');
    
    // Create default backup schedules
    await this.createDefaultSchedules();
    
    // Load existing schedules
    await this.loadSchedules();
    
    // Start all enabled schedules
    await this.startAllSchedules();
    
    logger.info('Backup scheduler initialized', {
      scheduleCount: this.schedules.size,
      enabledCount: Array.from(this.schedules.values()).filter(s => s.enabled).length,
    });
  }
  
  // Create a new backup schedule
  async createSchedule(
    name: string,
    type: BackupSchedule['type'],
    cronExpression: string,
    enabled: boolean = true
  ): Promise<string> {
    const scheduleId = this.generateScheduleId();
    
    const schedule: BackupSchedule = {
      id: scheduleId,
      name,
      type,
      cronExpression,
      enabled,
      successCount: 0,
      failureCount: 0,
      avgDuration: 0,
      maxRetries: 3,
      retryDelay: 15,
    };
    
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }
    
    // Calculate next run time
    schedule.nextRun = this.calculateNextRun(cronExpression);
    
    this.schedules.set(scheduleId, schedule);
    
    // Start the schedule if enabled
    if (enabled) {
      await this.startSchedule(scheduleId);
    }
    
    // Save to persistent storage
    await this.saveSchedule(schedule);
    
    logger.info('Backup schedule created', {
      scheduleId,
      name,
      type,
      cronExpression,
      nextRun: schedule.nextRun,
    });
    
    return scheduleId;
  }
  
  // Update an existing schedule
  async updateSchedule(
    scheduleId: string,
    updates: Partial<Pick<BackupSchedule, 'name' | 'cronExpression' | 'enabled' | 'maxRetries' | 'retryDelay'>>
  ): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }
    
    // Stop current cron job
    await this.stopSchedule(scheduleId);
    
    // Apply updates
    Object.assign(schedule, updates);
    
    // Validate new cron expression if provided
    if (updates.cronExpression && !cron.validate(updates.cronExpression)) {
      throw new Error(`Invalid cron expression: ${updates.cronExpression}`);
    }
    
    // Recalculate next run time
    if (updates.cronExpression) {
      schedule.nextRun = this.calculateNextRun(updates.cronExpression);
    }
    
    // Restart if enabled
    if (schedule.enabled) {
      await this.startSchedule(scheduleId);
    }
    
    // Save changes
    await this.saveSchedule(schedule);
    
    logger.info('Backup schedule updated', {
      scheduleId,
      updates,
      nextRun: schedule.nextRun,
    });
  }
  
  // Delete a schedule
  async deleteSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }
    
    // Stop and remove cron job
    await this.stopSchedule(scheduleId);
    
    // Remove from memory
    this.schedules.delete(scheduleId);
    
    // Remove from persistent storage
    await this.removeSchedule(scheduleId);
    
    logger.info('Backup schedule deleted', { scheduleId, name: schedule.name });
  }
  
  // Start a specific schedule
  async startSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }
    
    if (!schedule.enabled) {
      throw new Error(`Schedule ${scheduleId} is disabled`);
    }
    
    // Stop existing cron job if any
    await this.stopSchedule(scheduleId);
    
    // Create new cron job
    const cronJob = cron.schedule(schedule.cronExpression, async () => {
      await this.executeBackupJob(scheduleId);
    }, {
      scheduled: false,
      timezone: 'UTC',
    });
    
    // Start the cron job
    cronJob.start();
    this.cronJobs.set(scheduleId, cronJob);
    
    logger.info('Backup schedule started', {
      scheduleId,
      name: schedule.name,
      cronExpression: schedule.cronExpression,
    });
  }
  
  // Stop a specific schedule
  async stopSchedule(scheduleId: string): Promise<void> {
    const cronJob = this.cronJobs.get(scheduleId);
    if (cronJob) {
      cronJob.stop();
      cronJob.destroy();
      this.cronJobs.delete(scheduleId);
      
      logger.info('Backup schedule stopped', { scheduleId });
    }
  }
  
  // Execute backup job manually
  async executeBackupJob(scheduleId: string): Promise<string> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }
    
    const jobId = this.generateJobId();
    
    const job: BackupJob = {
      id: jobId,
      scheduleId,
      type: schedule.type,
      status: 'pending',
      startTime: new Date(),
      attempt: 1,
      maxAttempts: schedule.maxRetries + 1,
      backupIds: [],
    };
    
    this.activeJobs.set(jobId, job);
    
    logger.info('Starting backup job', {
      jobId,
      scheduleId,
      type: schedule.type,
      scheduleName: schedule.name,
    });
    
    try {
      await this.runBackupJob(job);
    } catch (error) {
      logger.error('Backup job failed', error, { jobId, scheduleId });
      
      // Schedule retry if attempts remaining
      if (job.attempt < job.maxAttempts) {
        await this.scheduleRetry(job, schedule.retryDelay);
      } else {
        job.status = 'failed';
        job.endTime = new Date();
        job.duration = job.endTime.getTime() - job.startTime.getTime();
        schedule.failureCount++;
      }
    }
    
    // Update schedule statistics
    await this.updateScheduleStats(schedule, job);
    
    // Clean up completed job
    this.activeJobs.delete(jobId);
    
    return jobId;
  }
  
  // Get all schedules
  getSchedules(): BackupSchedule[] {
    return Array.from(this.schedules.values());
  }
  
  // Get schedule by ID
  getSchedule(scheduleId: string): BackupSchedule | undefined {
    return this.schedules.get(scheduleId);
  }
  
  // Get active jobs
  getActiveJobs(): BackupJob[] {
    return Array.from(this.activeJobs.values());
  }
  
  // Get backup statistics
  async getBackupStatistics(): Promise<any> {
    const schedules = Array.from(this.schedules.values());
    const activeJobs = Array.from(this.activeJobs.values());
    
    const totalJobs = schedules.reduce((sum, s) => sum + s.successCount + s.failureCount, 0);
    const totalSuccess = schedules.reduce((sum, s) => sum + s.successCount, 0);
    const totalFailures = schedules.reduce((sum, s) => sum + s.failureCount, 0);
    
    return {
      schedules: {
        total: schedules.length,
        enabled: schedules.filter(s => s.enabled).length,
        disabled: schedules.filter(s => !s.enabled).length,
      },
      jobs: {
        active: activeJobs.length,
        total: totalJobs,
        success: totalSuccess,
        failures: totalFailures,
        successRate: totalJobs > 0 ? (totalSuccess / totalJobs * 100).toFixed(1) : '0',
      },
      performance: {
        avgDuration: schedules.reduce((sum, s) => sum + s.avgDuration, 0) / schedules.length,
        nextScheduledRun: this.getNextScheduledRun(),
      },
    };
  }
  
  // Private helper methods
  private generateScheduleId(): string {
    return `schedule-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  private calculateNextRun(cronExpression: string): Date {
    // Use a cron parser to calculate next run time
    // For now, return a placeholder
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day
  }
  
  private async createDefaultSchedules(): Promise<void> {
    const defaultSchedules = [
      {
        name: 'Daily Database Backup',
        type: 'database' as const,
        cronExpression: '0 2 * * *', // Every day at 2 AM
      },
      {
        name: 'Weekly Full Backup',
        type: 'full' as const,
        cronExpression: '0 1 * * 0', // Every Sunday at 1 AM
      },
      {
        name: 'Daily File Backup',
        type: 'files' as const,
        cronExpression: '0 3 * * *', // Every day at 3 AM
      },
    ];
    
    for (const schedule of defaultSchedules) {
      // Check if schedule already exists
      const exists = Array.from(this.schedules.values()).some(s => s.name === schedule.name);
      if (!exists) {
        await this.createSchedule(schedule.name, schedule.type, schedule.cronExpression);
      }
    }
  }
  
  private async loadSchedules(): Promise<void> {
    // Load schedules from persistent storage
    // For now, keep existing in-memory schedules
  }
  
  private async startAllSchedules(): Promise<void> {
    const enabledSchedules = Array.from(this.schedules.values()).filter(s => s.enabled);
    
    for (const schedule of enabledSchedules) {
      try {
        await this.startSchedule(schedule.id);
      } catch (error) {
        logger.error('Failed to start schedule', error, { scheduleId: schedule.id });
      }
    }
  }
  
  private async runBackupJob(job: BackupJob): Promise<void> {
    job.status = 'running';
    
    try {
      switch (job.type) {
        case 'database':
          const dbBackup = await this.databaseBackup.createFullBackup();
          job.backupIds.push(dbBackup.id);
          break;
          
        case 'files':
          const fileBackup = await this.fileBackup.createBackup();
          job.backupIds.push(fileBackup.id);
          break;
          
        case 'full':
          const [dbBackup2, fileBackup2] = await Promise.all([
            this.databaseBackup.createFullBackup(),
            this.fileBackup.createBackup(),
          ]);
          job.backupIds.push(dbBackup2.id, fileBackup2.id);
          break;
      }
      
      job.status = 'success';
      job.endTime = new Date();
      job.duration = job.endTime.getTime() - job.startTime.getTime();
      
      logger.info('Backup job completed successfully', {
        jobId: job.id,
        type: job.type,
        duration: job.duration,
        backupIds: job.backupIds,
      });
      
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }
  
  private async scheduleRetry(job: BackupJob, delayMinutes: number): Promise<void> {
    job.status = 'retrying';
    job.attempt++;
    
    logger.info('Scheduling backup job retry', {
      jobId: job.id,
      attempt: job.attempt,
      maxAttempts: job.maxAttempts,
      delayMinutes,
    });
    
    setTimeout(async () => {
      try {
        await this.runBackupJob(job);
      } catch (error) {
        if (job.attempt < job.maxAttempts) {
          await this.scheduleRetry(job, delayMinutes);
        } else {
          job.status = 'failed';
          job.endTime = new Date();
          job.duration = job.endTime.getTime() - job.startTime.getTime();
        }
      }
    }, delayMinutes * 60 * 1000);
  }
  
  private async updateScheduleStats(schedule: BackupSchedule, job: BackupJob): Promise<void> {
    schedule.lastRun = job.startTime;
    schedule.nextRun = this.calculateNextRun(schedule.cronExpression);
    
    if (job.status === 'success') {
      schedule.successCount++;
      
      // Update average duration
      if (job.duration) {
        schedule.avgDuration = (schedule.avgDuration * (schedule.successCount - 1) + job.duration) / schedule.successCount;
      }
    } else if (job.status === 'failed') {
      schedule.failureCount++;
    }
    
    await this.saveSchedule(schedule);
  }
  
  private getNextScheduledRun(): Date | null {
    const nextRuns = Array.from(this.schedules.values())
      .filter(s => s.enabled && s.nextRun)
      .map(s => s.nextRun!)
      .sort((a, b) => a.getTime() - b.getTime());
    
    return nextRuns.length > 0 ? nextRuns[0] : null;
  }
  
  private async saveSchedule(schedule: BackupSchedule): Promise<void> {
    // Save schedule to persistent storage
    logger.debug('Saving schedule', { scheduleId: schedule.id });
  }
  
  private async removeSchedule(scheduleId: string): Promise<void> {
    // Remove schedule from persistent storage
    logger.debug('Removing schedule', { scheduleId });
  }
}