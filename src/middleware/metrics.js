/**
 * Application Performance Monitoring and Metrics
 * Tracks performance metrics for application endpoints
 */

const config = require('../config/config');

class ApplicationMetrics {
  constructor() {
    this.metrics = {
      applications: {
        totalCreated: 0,
        totalWithdrawn: 0,
        statusUpdates: 0,
        duplicateAttempts: 0,
        averageResponseTime: 0,
        requestCounts: {
          'POST /applications': 0,
          'GET /applications/my': 0,
          'GET /applications/for-job': 0,
          'PUT /applications/status': 0,
          'DELETE /applications': 0
        },
        errorCounts: {
          validation: 0,
          authorization: 0,
          duplicates: 0,
          notFound: 0,
          serverErrors: 0
        },
        responseTimes: [],
        hourlyStats: new Map(),
        userActivity: new Map()
      }
    };
    
    // Clean up old metrics every hour
    setInterval(() => this.cleanupOldMetrics(), 60 * 60 * 1000);
  }

  /**
   * Record application creation metric
   */
  recordApplicationCreated(userId, jobId, responseTime) {
    this.metrics.applications.totalCreated++;
    this.recordResponseTime('POST /applications', responseTime);
    this.recordUserActivity(userId, 'application_created');
    
    config.logger.info(`Application created - User: ${userId}, Job: ${jobId}, ResponseTime: ${responseTime}ms`, 'METRICS');
  }

  /**
   * Record application withdrawal metric
   */
  recordApplicationWithdrawn(userId, applicationId, responseTime) {
    this.metrics.applications.totalWithdrawn++;
    this.recordResponseTime('DELETE /applications', responseTime);
    this.recordUserActivity(userId, 'application_withdrawn');
    
    config.logger.info(`Application withdrawn - User: ${userId}, App: ${applicationId}, ResponseTime: ${responseTime}ms`, 'METRICS');
  }

  /**
   * Record status update metric
   */
  recordStatusUpdate(recruiterId, applicationId, newStatus, responseTime) {
    this.metrics.applications.statusUpdates++;
    this.recordResponseTime('PUT /applications/status', responseTime);
    this.recordUserActivity(recruiterId, 'status_updated');
    
    config.logger.info(`Status updated - Recruiter: ${recruiterId}, App: ${applicationId}, Status: ${newStatus}, ResponseTime: ${responseTime}ms`, 'METRICS');
  }

  /**
   * Record duplicate application attempt
   */
  recordDuplicateAttempt(userId, jobId) {
    this.metrics.applications.duplicateAttempts++;
    this.recordError('duplicates');
    
    config.logger.warn(`Duplicate application attempt - User: ${userId}, Job: ${jobId}`, 'METRICS');
  }

  /**
   * Record API request
   */
  recordRequest(endpoint, responseTime, statusCode, userId = null) {
    const endpointKey = this.normalizeEndpoint(endpoint);
    
    if (this.metrics.applications.requestCounts[endpointKey] !== undefined) {
      this.metrics.applications.requestCounts[endpointKey]++;
      this.recordResponseTime(endpointKey, responseTime);
      
      // Record hourly statistics
      const hour = new Date().getHours();
      const hourKey = `${new Date().toDateString()}-${hour}`;
      
      if (!this.metrics.applications.hourlyStats.has(hourKey)) {
        this.metrics.applications.hourlyStats.set(hourKey, {
          requests: 0,
          totalResponseTime: 0,
          errors: 0
        });
      }
      
      const hourStats = this.metrics.applications.hourlyStats.get(hourKey);
      hourStats.requests++;
      hourStats.totalResponseTime += responseTime;
      
      if (statusCode >= 400) {
        hourStats.errors++;
        this.recordErrorByStatusCode(statusCode);
      }
      
      if (userId) {
        this.recordUserActivity(userId, 'api_request');
      }
    }
  }

  /**
   * Record error by type
   */
  recordError(errorType) {
    if (this.metrics.applications.errorCounts[errorType] !== undefined) {
      this.metrics.applications.errorCounts[errorType]++;
    }
  }

  /**
   * Record error by HTTP status code
   */
  recordErrorByStatusCode(statusCode) {
    if (statusCode === 400) {
      this.recordError('validation');
    } else if (statusCode === 401 || statusCode === 403) {
      this.recordError('authorization');
    } else if (statusCode === 404) {
      this.recordError('notFound');
    } else if (statusCode >= 500) {
      this.recordError('serverErrors');
    }
  }

  /**
   * Record response time and update average
   */
  recordResponseTime(endpoint, responseTime) {
    this.metrics.applications.responseTimes.push({
      endpoint,
      responseTime,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 response times to prevent memory bloat
    if (this.metrics.applications.responseTimes.length > 1000) {
      this.metrics.applications.responseTimes = this.metrics.applications.responseTimes.slice(-1000);
    }
    
    // Update average response time
    const recentTimes = this.metrics.applications.responseTimes
      .filter(rt => Date.now() - rt.timestamp < 60 * 60 * 1000) // Last hour
      .map(rt => rt.responseTime);
    
    if (recentTimes.length > 0) {
      this.metrics.applications.averageResponseTime = 
        recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;
    }
  }

  /**
   * Record user activity
   */
  recordUserActivity(userId, activity) {
    if (!this.metrics.applications.userActivity.has(userId)) {
      this.metrics.applications.userActivity.set(userId, {
        lastActivity: Date.now(),
        totalRequests: 0,
        activities: []
      });
    }
    
    const userStats = this.metrics.applications.userActivity.get(userId);
    userStats.lastActivity = Date.now();
    userStats.totalRequests++;
    userStats.activities.push({
      activity,
      timestamp: Date.now()
    });
    
    // Keep only last 50 activities per user
    if (userStats.activities.length > 50) {
      userStats.activities = userStats.activities.slice(-50);
    }
  }

  /**
   * Normalize endpoint names for consistent tracking
   */
  normalizeEndpoint(endpoint) {
    if (endpoint.includes('POST') && endpoint.includes('/applications')) {
      return 'POST /applications';
    } else if (endpoint.includes('GET') && endpoint.includes('/applications/my')) {
      return 'GET /applications/my';
    } else if (endpoint.includes('GET') && endpoint.includes('/applications/for-job')) {
      return 'GET /applications/for-job';
    } else if (endpoint.includes('PUT') && endpoint.includes('/applications') && endpoint.includes('/status')) {
      return 'PUT /applications/status';
    } else if (endpoint.includes('DELETE') && endpoint.includes('/applications')) {
      return 'DELETE /applications';
    }
    return endpoint;
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Calculate recent metrics (last hour)
    const recentResponseTimes = this.metrics.applications.responseTimes
      .filter(rt => rt.timestamp > oneHourAgo);
    
    const recentAverageResponseTime = recentResponseTimes.length > 0
      ? recentResponseTimes.reduce((sum, rt) => sum + rt.responseTime, 0) / recentResponseTimes.length
      : 0;
    
    // Calculate active users (last hour)
    const activeUsers = Array.from(this.metrics.applications.userActivity.entries())
      .filter(([userId, stats]) => stats.lastActivity > oneHourAgo).length;
    
    return {
      timestamp: new Date().toISOString(),
      applications: {
        totalCreated: this.metrics.applications.totalCreated,
        totalWithdrawn: this.metrics.applications.totalWithdrawn,
        statusUpdates: this.metrics.applications.statusUpdates,
        duplicateAttempts: this.metrics.applications.duplicateAttempts,
        averageResponseTime: Math.round(this.metrics.applications.averageResponseTime),
        recentAverageResponseTime: Math.round(recentAverageResponseTime),
        totalRequests: Object.values(this.metrics.applications.requestCounts).reduce((a, b) => a + b, 0),
        totalErrors: Object.values(this.metrics.applications.errorCounts).reduce((a, b) => a + b, 0),
        activeUsers,
        requestCounts: { ...this.metrics.applications.requestCounts },
        errorCounts: { ...this.metrics.applications.errorCounts }
      }
    };
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport() {
    const summary = this.getMetricsSummary();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Response time percentiles (last hour)
    const recentTimes = this.metrics.applications.responseTimes
      .filter(rt => rt.timestamp > oneHourAgo)
      .map(rt => rt.responseTime)
      .sort((a, b) => a - b);
    
    const percentiles = {};
    if (recentTimes.length > 0) {
      percentiles.p50 = recentTimes[Math.floor(recentTimes.length * 0.5)];
      percentiles.p95 = recentTimes[Math.floor(recentTimes.length * 0.95)];
      percentiles.p99 = recentTimes[Math.floor(recentTimes.length * 0.99)];
      percentiles.max = Math.max(...recentTimes);
      percentiles.min = Math.min(...recentTimes);
    }
    
    // Error rate calculation
    const totalRecentRequests = summary.applications.totalRequests;
    const totalRecentErrors = summary.applications.totalErrors;
    const errorRate = totalRecentRequests > 0 
      ? ((totalRecentErrors / totalRecentRequests) * 100).toFixed(2)
      : 0;
    
    return {
      ...summary,
      performance: {
        responseTimePercentiles: percentiles,
        errorRate: `${errorRate}%`,
        throughput: `${(totalRecentRequests / 60).toFixed(2)} req/min`,
        availability: `${(100 - parseFloat(errorRate)).toFixed(2)}%`
      },
      healthStatus: this.getHealthStatus()
    };
  }

  /**
   * Determine overall health status
   */
  getHealthStatus() {
    const summary = this.getMetricsSummary();
    const avgResponseTime = summary.applications.averageResponseTime;
    const totalRequests = summary.applications.totalRequests;
    const totalErrors = summary.applications.totalErrors;
    
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    
    if (avgResponseTime > 1000 || errorRate > 5) {
      return 'critical';
    } else if (avgResponseTime > 500 || errorRate > 1) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupOldMetrics() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Clean old response times
    this.metrics.applications.responseTimes = this.metrics.applications.responseTimes
      .filter(rt => rt.timestamp > oneDayAgo);
    
    // Clean old hourly stats
    for (const [hourKey, stats] of this.metrics.applications.hourlyStats.entries()) {
      const [dateStr, hour] = hourKey.split('-');
      const hourTimestamp = new Date(dateStr).getTime() + (parseInt(hour) * 60 * 60 * 1000);
      
      if (hourTimestamp < oneDayAgo) {
        this.metrics.applications.hourlyStats.delete(hourKey);
      }
    }
    
    // Clean old user activity
    for (const [userId, stats] of this.metrics.applications.userActivity.entries()) {
      if (stats.lastActivity < oneDayAgo) {
        this.metrics.applications.userActivity.delete(userId);
      } else {
        // Clean old activities for active users
        stats.activities = stats.activities.filter(a => a.timestamp > oneDayAgo);
      }
    }
    
    config.logger.info('Metrics cleanup completed', 'METRICS');
  }

  /**
   * Reset all metrics (for testing purposes)
   */
  reset() {
    this.metrics = {
      applications: {
        totalCreated: 0,
        totalWithdrawn: 0,
        statusUpdates: 0,
        duplicateAttempts: 0,
        averageResponseTime: 0,
        requestCounts: {
          'POST /applications': 0,
          'GET /applications/my': 0,
          'GET /applications/for-job': 0,
          'PUT /applications/status': 0,
          'DELETE /applications': 0
        },
        errorCounts: {
          validation: 0,
          authorization: 0,
          duplicates: 0,
          notFound: 0,
          serverErrors: 0
        },
        responseTimes: [],
        hourlyStats: new Map(),
        userActivity: new Map()
      }
    };
  }
}

// Global metrics instance
const metricsInstance = new ApplicationMetrics();

/**
 * Express middleware to track request metrics
 */
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Track the original end method
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    const endpoint = `${req.method} ${req.path}`;
    const userId = req.user ? req.user.id : null;
    
    // Record the request
    metricsInstance.recordRequest(endpoint, responseTime, res.statusCode, userId);
    
    // Call the original end method
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = {
  ApplicationMetrics,
  metricsInstance,
  metricsMiddleware
};