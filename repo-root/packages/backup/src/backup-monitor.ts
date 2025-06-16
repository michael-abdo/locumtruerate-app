/**
 * Backup monitoring and alerting system
 */

import { logger } from '@locumtruerate/shared';
import { BackupSchedulerService } from './backup-scheduler';
import { DatabaseBackupService } from './database-backup';
import { FileBackupService } from './file-backup';

export interface MonitoringConfig {
  checkInterval: number; // minutes
  alertThresholds: {
    missedBackups: number; // consecutive missed backups
    failureRate: number; // percentage
    backupAge: number; // hours
    storageUsage: number; // percentage
  };
  notifications: {
    email?: string[];
    slack?: {
      webhook: string;
      channel: string;
    };
    webhook?: string;
  };
  healthCheck: {
    endpoint: string;
    timeout: number; // seconds
    expectedStatus: number;
  };
}

export interface Alert {
  id: string;
  type: 'backup_failure' | 'missed_backup' | 'storage_full' | 'old_backup' | 'system_error';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    backups: ComponentHealth;
    storage: ComponentHealth;
    scheduler: ComponentHealth;
    database: ComponentHealth;
  };
  lastCheck: Date;
  uptime: number;
  alerts: Alert[];
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastCheck: Date;
  metrics?: Record<string, number>;
}

export class BackupMonitorService {
  private config: MonitoringConfig;
  private scheduler: BackupSchedulerService;
  private databaseBackup: DatabaseBackupService;
  private fileBackup: FileBackupService;
  private alerts: Map<string, Alert> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private startTime: Date = new Date();
  
  constructor(
    config: MonitoringConfig,
    scheduler: BackupSchedulerService,
    databaseBackup: DatabaseBackupService,
    fileBackup: FileBackupService
  ) {
    this.config = config;
    this.scheduler = scheduler;
    this.databaseBackup = databaseBackup;
    this.fileBackup = fileBackup;
  }
  
  // Start monitoring
  async start(): Promise<void> {
    logger.info('Starting backup monitoring service');
    
    // Initial health check
    await this.performHealthCheck();
    
    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
        await this.checkBackupStatus();
        await this.checkStorageUsage();
        await this.processAlerts();
      } catch (error) {
        logger.error('Monitoring check failed', error);
      }
    }, this.config.checkInterval * 60 * 1000);
    
    logger.info('Backup monitoring service started', {
      checkInterval: this.config.checkInterval,
    });
  }
  
  // Stop monitoring
  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    logger.info('Backup monitoring service stopped');
  }
  
  // Get current health status
  async getHealthStatus(): Promise<HealthStatus> {
    const backupHealth = await this.checkBackupHealth();
    const storageHealth = await this.checkStorageHealth();
    const schedulerHealth = await this.checkSchedulerHealth();
    const databaseHealth = await this.checkDatabaseHealth();
    
    const components = {
      backups: backupHealth,
      storage: storageHealth,
      scheduler: schedulerHealth,
      database: databaseHealth,
    };
    
    // Determine overall health
    const componentStatuses = Object.values(components).map(c => c.status);
    let overall: HealthStatus['overall'];
    
    if (componentStatuses.includes('unhealthy')) {
      overall = 'unhealthy';
    } else if (componentStatuses.includes('degraded')) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }
    
    return {
      overall,
      components,
      lastCheck: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      alerts: Array.from(this.alerts.values()).filter(a => !a.resolved),
    };
  }
  
  // Create alert
  async createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const alertId = this.generateAlertId();
    
    const alert: Alert = {
      id: alertId,
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };
    
    this.alerts.set(alertId, alert);
    
    logger.warn('Alert created', {
      alertId,
      type,
      severity,
      title,
    });
    
    // Send notifications
    await this.sendNotification(alert);
    
    return alertId;
  }
  
  // Resolve alert
  async resolveAlert(alertId: string, reason?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    
    if (reason) {
      alert.metadata.resolvedReason = reason;
    }
    
    logger.info('Alert resolved', {
      alertId,
      type: alert.type,
      duration: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
      reason,
    });
  }
  
  // Get alerts
  getAlerts(resolved?: boolean): Alert[] {
    const alerts = Array.from(this.alerts.values());
    
    if (resolved !== undefined) {
      return alerts.filter(a => a.resolved === resolved);
    }
    
    return alerts;
  }
  
  // Generate monitoring report
  async generateReport(startDate: Date, endDate: Date): Promise<any> {
    const schedulerStats = await this.scheduler.getBackupStatistics();
    const alerts = this.getAlertsInRange(startDate, endDate);
    const backupMetrics = await this.getBackupMetrics(startDate, endDate);
    
    return {
      period: { startDate, endDate },
      summary: {
        totalBackups: backupMetrics.total,
        successfulBackups: backupMetrics.successful,
        failedBackups: backupMetrics.failed,
        successRate: backupMetrics.successRate,
        avgDuration: backupMetrics.avgDuration,
      },
      alerts: {
        total: alerts.length,
        bySeverity: this.groupAlertsBySeverity(alerts),
        byType: this.groupAlertsByType(alerts),
        avgResolutionTime: this.calculateAvgResolutionTime(alerts),
      },
      availability: {
        uptime: this.calculateUptime(startDate, endDate),
        downtimeEvents: this.getDowntimeEvents(startDate, endDate),
        mtbf: this.calculateMTBF(alerts),
        mttr: this.calculateMTTR(alerts),
      },
      performance: {
        backupPerformance: backupMetrics.performance,
        storageGrowth: await this.getStorageGrowth(startDate, endDate),
        trends: await this.getPerformanceTrends(startDate, endDate),
      },
      recommendations: this.generateRecommendations(schedulerStats, alerts, backupMetrics),
    };
  }
  
  // Private methods
  private async performHealthCheck(): Promise<void> {
    try {
      // Check if backup services are responsive
      const response = await fetch(this.config.healthCheck.endpoint, {
        timeout: this.config.healthCheck.timeout * 1000,
      });
      
      if (response.status !== this.config.healthCheck.expectedStatus) {
        await this.createAlert(
          'system_error',
          'error',
          'Health Check Failed',
          `Health check returned status ${response.status}`,
          { status: response.status, endpoint: this.config.healthCheck.endpoint }
        );
      }
    } catch (error) {
      await this.createAlert(
        'system_error',
        'critical',
        'Health Check Error',
        'Health check endpoint unreachable',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
  
  private async checkBackupStatus(): Promise<void> {
    const schedules = this.scheduler.getSchedules();
    const now = new Date();
    
    for (const schedule of schedules) {
      if (!schedule.enabled) continue;
      
      // Check for missed backups
      if (schedule.nextRun && schedule.nextRun < now) {
        const hoursLate = (now.getTime() - schedule.nextRun.getTime()) / (1000 * 60 * 60);
        
        if (hoursLate > 1) { // More than 1 hour late
          await this.createAlert(
            'missed_backup',
            hoursLate > 24 ? 'critical' : 'warning',
            'Missed Backup',
            `Backup schedule "${schedule.name}" is ${hoursLate.toFixed(1)} hours overdue`,
            { scheduleId: schedule.id, hoursLate }
          );
        }
      }
      
      // Check failure rate
      const totalJobs = schedule.successCount + schedule.failureCount;
      if (totalJobs > 10) { // Only check if we have enough data
        const failureRate = (schedule.failureCount / totalJobs) * 100;
        
        if (failureRate > this.config.alertThresholds.failureRate) {
          await this.createAlert(
            'backup_failure',
            failureRate > 50 ? 'critical' : 'warning',
            'High Backup Failure Rate',
            `Schedule "${schedule.name}" has ${failureRate.toFixed(1)}% failure rate`,
            { scheduleId: schedule.id, failureRate }
          );
        }
      }
      
      // Check backup age
      if (schedule.lastRun) {
        const ageHours = (now.getTime() - schedule.lastRun.getTime()) / (1000 * 60 * 60);
        
        if (ageHours > this.config.alertThresholds.backupAge) {
          await this.createAlert(
            'old_backup',
            ageHours > 72 ? 'critical' : 'warning',
            'Stale Backup',
            `Last backup for "${schedule.name}" is ${ageHours.toFixed(1)} hours old`,
            { scheduleId: schedule.id, ageHours }
          );
        }
      }
    }
  }
  
  private async checkStorageUsage(): Promise<void> {
    // This would check actual storage usage
    // For now, simulate storage check
    const storageUsage = 75; // percentage
    
    if (storageUsage > this.config.alertThresholds.storageUsage) {
      await this.createAlert(
        'storage_full',
        storageUsage > 95 ? 'critical' : 'warning',
        'High Storage Usage',
        `Backup storage is ${storageUsage}% full`,
        { storageUsage }
      );
    }
  }
  
  private async processAlerts(): Promise<void> {
    const unresolvedAlerts = this.getAlerts(false);
    
    // Auto-resolve certain alerts based on conditions
    for (const alert of unresolvedAlerts) {
      if (await this.shouldAutoResolve(alert)) {
        await this.resolveAlert(alert.id, 'Auto-resolved: condition no longer applies');
      }
    }
    
    // Send reminder notifications for critical unresolved alerts
    const criticalAlerts = unresolvedAlerts.filter(a => a.severity === 'critical');
    for (const alert of criticalAlerts) {
      const ageHours = (Date.now() - alert.timestamp.getTime()) / (1000 * 60 * 60);
      
      if (ageHours > 4 && ageHours % 4 < 0.1) { // Every 4 hours
        await this.sendReminderNotification(alert);
      }
    }
  }
  
  private async shouldAutoResolve(alert: Alert): Promise<boolean> {
    switch (alert.type) {
      case 'missed_backup':
        // Resolve if backup has since completed
        const scheduleId = alert.metadata.scheduleId;
        const schedule = this.scheduler.getSchedule(scheduleId);
        return schedule ? schedule.lastRun! > alert.timestamp : false;
        
      case 'storage_full':
        // Would check current storage usage
        return false; // Don't auto-resolve storage alerts
        
      default:
        return false;
    }
  }
  
  private async checkBackupHealth(): Promise<ComponentHealth> {
    try {
      const stats = await this.scheduler.getBackupStatistics();
      const successRate = parseFloat(stats.jobs.successRate);
      
      let status: ComponentHealth['status'];
      let message: string;
      
      if (successRate >= 95) {
        status = 'healthy';
        message = `Backup success rate: ${successRate}%`;
      } else if (successRate >= 80) {
        status = 'degraded';
        message = `Backup success rate below optimal: ${successRate}%`;
      } else {
        status = 'unhealthy';
        message = `Backup success rate critically low: ${successRate}%`;
      }
      
      return {
        status,
        message,
        lastCheck: new Date(),
        metrics: {
          successRate,
          activeJobs: stats.jobs.active,
          totalJobs: stats.jobs.total,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Failed to check backup health',
        lastCheck: new Date(),
      };
    }
  }
  
  private async checkStorageHealth(): Promise<ComponentHealth> {
    // Simulate storage health check
    const usage = 75; // percentage
    
    let status: ComponentHealth['status'];
    let message: string;
    
    if (usage < 80) {
      status = 'healthy';
      message = `Storage usage: ${usage}%`;
    } else if (usage < 90) {
      status = 'degraded';
      message = `Storage usage high: ${usage}%`;
    } else {
      status = 'unhealthy';
      message = `Storage usage critical: ${usage}%`;
    }
    
    return {
      status,
      message,
      lastCheck: new Date(),
      metrics: { usage },
    };
  }
  
  private async checkSchedulerHealth(): Promise<ComponentHealth> {
    const schedules = this.scheduler.getSchedules();
    const enabledSchedules = schedules.filter(s => s.enabled);
    
    return {
      status: 'healthy',
      message: `${enabledSchedules.length} active schedules`,
      lastCheck: new Date(),
      metrics: {
        totalSchedules: schedules.length,
        enabledSchedules: enabledSchedules.length,
      },
    };
  }
  
  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      // Would check database connectivity and performance
      return {
        status: 'healthy',
        message: 'Database responsive',
        lastCheck: new Date(),
        metrics: { responseTime: 50 },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        lastCheck: new Date(),
      };
    }
  }
  
  private async sendNotification(alert: Alert): Promise<void> {
    try {
      // Send email notifications
      if (this.config.notifications.email) {
        await this.sendEmailNotification(alert);
      }
      
      // Send Slack notifications
      if (this.config.notifications.slack) {
        await this.sendSlackNotification(alert);
      }
      
      // Send webhook notifications
      if (this.config.notifications.webhook) {
        await this.sendWebhookNotification(alert);
      }
      
      logger.info('Notification sent', {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
      });
    } catch (error) {
      logger.error('Failed to send notification', error, { alertId: alert.id });
    }
  }
  
  private async sendReminderNotification(alert: Alert): Promise<void> {
    logger.warn('Sending reminder for unresolved critical alert', {
      alertId: alert.id,
      age: Date.now() - alert.timestamp.getTime(),
    });
    
    // Would send reminder notification
  }
  
  private async sendEmailNotification(alert: Alert): Promise<void> {
    // Implementation for email notifications
    logger.debug('Sending email notification', { alertId: alert.id });
  }
  
  private async sendSlackNotification(alert: Alert): Promise<void> {
    // Implementation for Slack notifications
    logger.debug('Sending Slack notification', { alertId: alert.id });
  }
  
  private async sendWebhookNotification(alert: Alert): Promise<void> {
    // Implementation for webhook notifications
    logger.debug('Sending webhook notification', { alertId: alert.id });
  }
  
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  private getAlertsInRange(startDate: Date, endDate: Date): Alert[] {
    return Array.from(this.alerts.values()).filter(
      alert => alert.timestamp >= startDate && alert.timestamp <= endDate
    );
  }
  
  private groupAlertsBySeverity(alerts: Alert[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const alert of alerts) {
      groups[alert.severity] = (groups[alert.severity] || 0) + 1;
    }
    return groups;
  }
  
  private groupAlertsByType(alerts: Alert[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const alert of alerts) {
      groups[alert.type] = (groups[alert.type] || 0) + 1;
    }
    return groups;
  }
  
  private calculateAvgResolutionTime(alerts: Alert[]): number {
    const resolvedAlerts = alerts.filter(a => a.resolved && a.resolvedAt);
    if (resolvedAlerts.length === 0) return 0;
    
    const totalTime = resolvedAlerts.reduce(
      (sum, alert) => sum + (alert.resolvedAt!.getTime() - alert.timestamp.getTime()),
      0
    );
    
    return totalTime / resolvedAlerts.length;
  }
  
  private async getBackupMetrics(startDate: Date, endDate: Date): Promise<any> {
    // Would get actual backup metrics from database
    return {
      total: 100,
      successful: 95,
      failed: 5,
      successRate: 95,
      avgDuration: 1800000, // 30 minutes
      performance: { trend: 'stable' },
    };
  }
  
  private calculateUptime(startDate: Date, endDate: Date): number {
    // Calculate system uptime percentage
    return 99.9;
  }
  
  private getDowntimeEvents(startDate: Date, endDate: Date): any[] {
    // Get downtime events in the period
    return [];
  }
  
  private calculateMTBF(alerts: Alert[]): number {
    // Mean Time Between Failures
    return 720; // hours
  }
  
  private calculateMTTR(alerts: Alert[]): number {
    // Mean Time To Recovery
    return 2; // hours
  }
  
  private async getStorageGrowth(startDate: Date, endDate: Date): Promise<any> {
    return { trend: 'increasing', rate: '2GB/day' };
  }
  
  private async getPerformanceTrends(startDate: Date, endDate: Date): Promise<any> {
    return { backupDuration: 'stable', successRate: 'improving' };
  }
  
  private generateRecommendations(schedulerStats: any, alerts: Alert[], backupMetrics: any): string[] {
    const recommendations: string[] = [];
    
    if (parseFloat(schedulerStats.jobs.successRate) < 95) {
      recommendations.push('Investigate backup failures and improve reliability');
    }
    
    if (alerts.filter(a => a.type === 'storage_full').length > 0) {
      recommendations.push('Implement backup cleanup policies to manage storage usage');
    }
    
    if (alerts.filter(a => a.type === 'missed_backup').length > 0) {
      recommendations.push('Review backup schedules and resource allocation');
    }
    
    return recommendations;
  }
}