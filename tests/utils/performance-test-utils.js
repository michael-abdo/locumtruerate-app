/**
 * Performance Testing Utilities
 * Specialized utilities for load testing and performance benchmarking
 */

const EventEmitter = require('events');

class PerformanceTestUtils extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: [],
      errors: [],
      responseTimes: [],
      throughput: [],
      concurrency: []
    };
  }

  /**
   * Clear performance metrics
   */
  clearMetrics() {
    this.metrics = {
      requests: [],
      errors: [],
      responseTimes: [],
      throughput: [],
      concurrency: []
    };
  }

  /**
   * Record performance metric
   */
  recordMetric(type, data) {
    if (this.metrics[type]) {
      this.metrics[type].push({
        ...data,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Load test with configurable parameters
   */
  async loadTest(requestFunction, options = {}) {
    const {
      concurrent = 10,
      duration = 30000, // 30 seconds
      rampUp = 5000,    // 5 seconds ramp up
      maxRequests = 1000,
      requestDelay = 0
    } = options;

    console.log(`🚀 Starting load test: ${concurrent} concurrent users, ${duration}ms duration`);
    
    this.clearMetrics();
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    let activeRequests = 0;
    let totalRequests = 0;
    let totalErrors = 0;
    
    // Ramp up users gradually
    const rampUpInterval = rampUp / concurrent;
    const workers = [];
    
    for (let i = 0; i < concurrent; i++) {
      setTimeout(() => {
        workers.push(this.createWorker(
          requestFunction,
          endTime,
          requestDelay,
          maxRequests / concurrent,
          (metrics) => {
            activeRequests = metrics.active;
            totalRequests = metrics.total;
            totalErrors = metrics.errors;
          }
        ));
      }, i * rampUpInterval);
    }
    
    // Monitor performance during test
    const monitorInterval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const throughput = totalRequests / (elapsed / 1000);
      
      this.recordMetric('throughput', {
        elapsed,
        requestsPerSecond: throughput,
        activeRequests,
        totalRequests,
        errorRate: totalErrors / totalRequests * 100
      });
      
      this.emit('progress', {
        elapsed,
        throughput,
        activeRequests,
        totalRequests,
        totalErrors
      });
    }, 1000);
    
    // Wait for test completion
    await new Promise(resolve => setTimeout(resolve, duration + rampUp + 5000));
    clearInterval(monitorInterval);
    
    // Wait for all workers to complete
    await Promise.all(workers);
    
    return this.generateLoadTestReport();
  }

  /**
   * Create a load test worker
   */
  async createWorker(requestFunction, endTime, requestDelay, maxRequests, updateCallback) {
    let requestCount = 0;
    let errorCount = 0;
    let active = 0;
    
    const worker = async () => {
      while (Date.now() < endTime && requestCount < maxRequests) {
        active++;
        const requestStart = process.hrtime.bigint();
        
        try {
          const result = await requestFunction();
          const requestEnd = process.hrtime.bigint();
          const responseTime = Number(requestEnd - requestStart) / 1000000; // Convert to ms
          
          this.recordMetric('requests', {
            responseTime,
            status: result.statusCode || 200,
            success: true
          });
          
          this.recordMetric('responseTimes', {
            responseTime,
            requestId: requestCount
          });
          
        } catch (error) {
          const requestEnd = process.hrtime.bigint();
          const responseTime = Number(requestEnd - requestStart) / 1000000;
          
          errorCount++;
          this.recordMetric('errors', {
            error: error.message,
            responseTime,
            requestId: requestCount
          });
          
          this.recordMetric('requests', {
            responseTime,
            status: error.status || 500,
            success: false
          });
        }
        
        active--;
        requestCount++;
        
        updateCallback({
          active,
          total: requestCount,
          errors: errorCount
        });
        
        if (requestDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, requestDelay));
        }
      }
    };
    
    return worker();
  }

  /**
   * Stress test to find breaking point
   */
  async stressTest(requestFunction, options = {}) {
    const {
      startConcurrency = 1,
      maxConcurrency = 100,
      stepSize = 5,
      stepDuration = 10000, // 10 seconds per step
      errorThreshold = 5    // 5% error rate threshold
    } = options;

    console.log(`🔥 Starting stress test: ${startConcurrency}-${maxConcurrency} users, ${stepDuration}ms per step`);
    
    const results = [];
    let currentConcurrency = startConcurrency;
    
    while (currentConcurrency <= maxConcurrency) {
      console.log(`Testing with ${currentConcurrency} concurrent users...`);
      
      const stepResult = await this.loadTest(requestFunction, {
        concurrent: currentConcurrency,
        duration: stepDuration,
        rampUp: 1000,
        maxRequests: currentConcurrency * 50
      });
      
      results.push({
        concurrency: currentConcurrency,
        ...stepResult.summary
      });
      
      // Check if we've hit the breaking point
      if (stepResult.summary.errorRate > errorThreshold) {
        console.log(`💥 Breaking point reached at ${currentConcurrency} concurrent users (${stepResult.summary.errorRate}% error rate)`);
        break;
      }
      
      if (stepResult.summary.avgResponseTime > 5000) {
        console.log(`💥 Response time threshold exceeded at ${currentConcurrency} concurrent users (${stepResult.summary.avgResponseTime}ms avg)`);
        break;
      }
      
      currentConcurrency += stepSize;
      
      // Brief pause between steps
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return {
      breakingPoint: currentConcurrency - stepSize,
      results,
      recommendations: this.generateStressTestRecommendations(results)
    };
  }

  /**
   * Spike test for sudden load increases
   */
  async spikeTest(requestFunction, options = {}) {
    const {
      baseUsers = 5,
      spikeUsers = 50,
      spikeDuration = 5000,  // 5 seconds
      baseDuration = 10000,  // 10 seconds
      numberOfSpikes = 3
    } = options;

    console.log(`⚡ Starting spike test: ${numberOfSpikes} spikes from ${baseUsers} to ${spikeUsers} users`);
    
    const results = [];
    
    for (let spike = 1; spike <= numberOfSpikes; spike++) {
      console.log(`Spike ${spike}/${numberOfSpikes}:`);
      
      // Base load period
      console.log(`  Base load: ${baseUsers} users for ${baseDuration}ms`);
      const baseResult = await this.loadTest(requestFunction, {
        concurrent: baseUsers,
        duration: baseDuration,
        rampUp: 1000
      });
      
      // Spike period
      console.log(`  Spike load: ${spikeUsers} users for ${spikeDuration}ms`);
      const spikeResult = await this.loadTest(requestFunction, {
        concurrent: spikeUsers,
        duration: spikeDuration,
        rampUp: 500
      });
      
      results.push({
        spike: spike,
        base: baseResult.summary,
        spikeLoad: spikeResult.summary,
        degradation: {
          responseTimeIncrease: ((spikeResult.summary.avgResponseTime - baseResult.summary.avgResponseTime) / baseResult.summary.avgResponseTime * 100).toFixed(2),
          errorRateIncrease: (spikeResult.summary.errorRate - baseResult.summary.errorRate).toFixed(2)
        }
      });
      
      // Recovery period
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return {
      results,
      analysis: this.analyzeSpikeResults(results)
    };
  }

  /**
   * Memory leak detection test
   */
  async memoryLeakTest(requestFunction, options = {}) {
    const {
      duration = 300000, // 5 minutes
      concurrent = 10,
      samplingInterval = 5000 // 5 seconds
    } = options;

    console.log(`🧠 Starting memory leak test: ${duration}ms duration, ${concurrent} concurrent users`);
    
    const memorySnapshots = [];
    const startMemory = process.memoryUsage();
    
    // Take memory snapshots during load test
    const memoryMonitor = setInterval(() => {
      const currentMemory = process.memoryUsage();
      memorySnapshots.push({
        timestamp: Date.now(),
        heapUsed: currentMemory.heapUsed,
        heapTotal: currentMemory.heapTotal,
        external: currentMemory.external,
        rss: currentMemory.rss
      });
      
      console.log(`Memory: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB heap, ${(currentMemory.rss / 1024 / 1024).toFixed(2)}MB RSS`);
    }, samplingInterval);
    
    // Run load test
    const loadResult = await this.loadTest(requestFunction, {
      concurrent,
      duration,
      rampUp: 2000
    });
    
    clearInterval(memoryMonitor);
    
    const endMemory = process.memoryUsage();
    
    return {
      startMemory,
      endMemory,
      memorySnapshots,
      loadResult: loadResult.summary,
      analysis: this.analyzeMemoryUsage(memorySnapshots, startMemory, endMemory)
    };
  }

  /**
   * Generate load test report
   */
  generateLoadTestReport() {
    const requests = this.metrics.requests;
    const errors = this.metrics.errors;
    const responseTimes = this.metrics.responseTimes.map(r => r.responseTime);
    
    if (requests.length === 0) {
      return { error: 'No requests completed' };
    }
    
    const successfulRequests = requests.filter(r => r.success);
    const failedRequests = requests.filter(r => !r.success);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    // Calculate percentiles
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    const totalRequests = requests.length;
    const errorRate = (failedRequests.length / totalRequests * 100).toFixed(2);
    
    const testDuration = Math.max(...this.metrics.throughput.map(t => t.elapsed)) / 1000;
    const throughput = totalRequests / testDuration;
    
    return {
      summary: {
        totalRequests,
        successfulRequests: successfulRequests.length,
        failedRequests: failedRequests.length,
        errorRate: parseFloat(errorRate),
        avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        minResponseTime: parseFloat(minResponseTime.toFixed(2)),
        maxResponseTime: parseFloat(maxResponseTime.toFixed(2)),
        p50ResponseTime: parseFloat(p50.toFixed(2)),
        p95ResponseTime: parseFloat(p95.toFixed(2)),
        p99ResponseTime: parseFloat(p99.toFixed(2)),
        throughput: parseFloat(throughput.toFixed(2)),
        testDuration: parseFloat(testDuration.toFixed(2))
      },
      details: {
        requests,
        errors,
        throughputOverTime: this.metrics.throughput
      }
    };
  }

  /**
   * Generate stress test recommendations
   */
  generateStressTestRecommendations(results) {
    const recommendations = [];
    
    const lastGoodResult = results[results.length - 2];
    const breakingResult = results[results.length - 1];
    
    if (lastGoodResult && breakingResult) {
      recommendations.push(`Maximum recommended concurrent users: ${lastGoodResult.concurrency}`);
      
      if (breakingResult.errorRate > 10) {
        recommendations.push('High error rate indicates server resource exhaustion');
      }
      
      if (breakingResult.avgResponseTime > 10000) {
        recommendations.push('Response time degradation suggests database or I/O bottlenecks');
      }
      
      if (lastGoodResult.throughput < 10) {
        recommendations.push('Low throughput may indicate CPU or memory constraints');
      }
    }
    
    return recommendations;
  }

  /**
   * Analyze spike test results
   */
  analyzeSpikeResults(results) {
    const avgDegradation = results.reduce((sum, r) => sum + parseFloat(r.degradation.responseTimeIncrease), 0) / results.length;
    const maxDegradation = Math.max(...results.map(r => parseFloat(r.degradation.responseTimeIncrease)));
    
    const consistentPerformance = avgDegradation < 50; // Less than 50% degradation
    const recoversWell = results.every(r => parseFloat(r.degradation.errorRateIncrease) < 2); // Less than 2% error increase
    
    return {
      avgResponseTimeDegradation: avgDegradation.toFixed(2),
      maxResponseTimeDegradation: maxDegradation.toFixed(2),
      consistentPerformance,
      recoversWell,
      recommendation: consistentPerformance && recoversWell ? 
        'System handles spikes well' : 
        'Consider implementing load balancing or caching'
    };
  }

  /**
   * Analyze memory usage patterns
   */
  analyzeMemoryUsage(snapshots, startMemory, endMemory) {
    if (snapshots.length < 2) {
      return { error: 'Insufficient memory snapshots' };
    }
    
    const heapUsageIncrease = endMemory.heapUsed - startMemory.heapUsed;
    const rssIncrease = endMemory.rss - startMemory.rss;
    
    // Check for memory growth trend
    const firstHalf = snapshots.slice(0, Math.floor(snapshots.length / 2));
    const secondHalf = snapshots.slice(Math.floor(snapshots.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.heapUsed, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.heapUsed, 0) / secondHalf.length;
    
    const memoryGrowthRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100);
    
    const potentialLeak = memoryGrowthRate > 10; // More than 10% growth
    
    return {
      heapUsageIncrease: (heapUsageIncrease / 1024 / 1024).toFixed(2) + 'MB',
      rssIncrease: (rssIncrease / 1024 / 1024).toFixed(2) + 'MB',
      memoryGrowthRate: memoryGrowthRate.toFixed(2) + '%',
      potentialLeak,
      recommendation: potentialLeak ? 
        'Potential memory leak detected - investigate object retention' : 
        'Memory usage appears stable'
    };
  }
}

module.exports = PerformanceTestUtils;