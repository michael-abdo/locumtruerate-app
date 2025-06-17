/**
 * Cloudflare Pages Performance Optimization
 * Bundle analysis and optimization utilities
 */

export class Performance {
  /**
   * Analyze bundle size and provide optimization recommendations
   */
  static analyzeBundleSize(buildDir: string): {
    totalSize: number;
    recommendations: string[];
    files: Array<{ name: string; size: number; gzipped: number }>;
  } {
    const fs = require('fs');
    const path = require('path');
    const zlib = require('zlib');

    const files: Array<{ name: string; size: number; gzipped: number }> = [];
    const recommendations: string[] = [];
    let totalSize = 0;

    const analyzeFile = (filePath: string, fileName: string) => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath);
      const size = content.length;
      const gzipped = zlib.gzipSync(content).length;

      files.push({ name: fileName, size, gzipped });
      totalSize += size;

      // Generate recommendations
      if (size > 1024 * 1024) { // > 1MB
        recommendations.push(`${fileName} is large (${(size / 1024 / 1024).toFixed(2)}MB). Consider code splitting.`);
      }

      if (gzipped / size > 0.8) { // Poor compression ratio
        recommendations.push(`${fileName} has poor compression. Check for repetitive code or large data.`);
      }
    };

    // Analyze common files
    const commonFiles = [
      'index.js',
      'main.js',
      'app.js',
      'bundle.js',
      'vendor.js',
      'runtime.js',
      'polyfills.js'
    ];

    commonFiles.forEach(file => {
      analyzeFile(path.join(buildDir, file), file);
    });

    // Analyze CSS files
    const cssFiles = fs.readdirSync(buildDir)
      .filter((file: string) => file.endsWith('.css'))
      .slice(0, 10); // Limit to first 10 CSS files

    cssFiles.forEach((file: string) => {
      analyzeFile(path.join(buildDir, file), file);
    });

    // General recommendations
    if (totalSize > 5 * 1024 * 1024) { // > 5MB total
      recommendations.push('Total bundle size is large. Consider lazy loading and code splitting.');
    }

    if (files.length > 20) {
      recommendations.push('Many files detected. Consider bundling smaller files together.');
    }

    return {
      totalSize,
      recommendations,
      files: files.sort((a, b) => b.size - a.size)
    };
  }

  /**
   * Generate performance budget recommendations
   */
  static generatePerformanceBudget(): {
    budgets: Record<string, number>;
    description: string;
  } {
    return {
      budgets: {
        'bundle.js': 512 * 1024,        // 512KB
        'vendor.js': 1024 * 1024,       // 1MB
        'main.css': 100 * 1024,         // 100KB
        'total': 2 * 1024 * 1024,       // 2MB total
        'firstLoad': 512 * 1024         // 512KB for first load
      },
      description: `
Performance Budget for LocumTrueRate:
- Main bundle should be under 512KB (gzipped)
- Vendor libraries under 1MB (gzipped)
- CSS files under 100KB (gzipped)
- Total initial load under 2MB
- First meaningful paint under 2 seconds
- Largest contentful paint under 2.5 seconds
`
    };
  }

  /**
   * Generate Cloudflare Workers performance optimization script
   */
  static generateWorkerOptimization(): string {
    return `
// Cloudflare Worker for Performance Optimization
// Place in /functions/_middleware.js

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  
  // Skip optimization for API routes
  if (url.pathname.startsWith('/api/')) {
    return context.next();
  }
  
  // Get response from origin
  const response = await context.next();
  
  // Clone response to modify headers
  const newResponse = new Response(response.body, response);
  
  // Add performance headers
  newResponse.headers.set('Server-Timing', 'edge;dur=1');
  
  // Add preload hints for critical resources
  if (url.pathname === '/') {
    newResponse.headers.set('Link', [
      '</assets/critical.css>; rel=preload; as=style',
      '</assets/app.js>; rel=preload; as=script',
      '</assets/fonts/main.woff2>; rel=preload; as=font; type=font/woff2; crossorigin'
    ].join(', '));
  }
  
  // Optimize images
  if (request.headers.get('Accept')?.includes('image/webp')) {
    // Convert images to WebP if supported
    if (url.pathname.match(/\\.(jpg|jpeg|png)$/)) {
      const webpUrl = url.pathname.replace(/\\.(jpg|jpeg|png)$/, '.webp');
      return fetch(webpUrl).catch(() => response);
    }
  }
  
  // Add caching headers based on file type
  const fileExtension = url.pathname.split('.').pop();
  
  switch (fileExtension) {
    case 'js':
    case 'css':
    case 'woff2':
    case 'woff':
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      break;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'svg':
      newResponse.headers.set('Cache-Control', 'public, max-age=86400');
      break;
    case 'html':
      newResponse.headers.set('Cache-Control', 'public, max-age=3600');
      break;
  }
  
  return newResponse;
}
`;
  }

  /**
   * Generate critical CSS extraction recommendations
   */
  static generateCriticalCSSConfig(): {
    config: any;
    instructions: string[];
  } {
    return {
      config: {
        inline: true,
        base: 'dist/',
        src: 'index.html',
        target: {
          css: 'assets/critical.css',
          html: 'index.html'
        },
        width: 1200,
        height: 900,
        penthouse: {
          blockJSRequests: false,
          forceInclude: [
            '.hero',
            '.navigation',
            '.header',
            '.search-form'
          ]
        }
      },
      instructions: [
        '1. Install critical CSS tools: npm install --save-dev critical',
        '2. Add to build script: critical src/index.html --base dist/',
        '3. Inline critical CSS in HTML head',
        '4. Load non-critical CSS asynchronously',
        '5. Use preload for fonts and key resources'
      ]
    };
  }

  /**
   * Web Vitals monitoring setup
   */
  static generateWebVitalsMonitoring(): string {
    return `
// Web Vitals Monitoring for LocumTrueRate
// Add to your main application

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
  
  // Send to custom analytics
  fetch('/api/analytics/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      url: window.location.href,
      timestamp: Date.now()
    })
  }).catch(console.error);
}

// Initialize monitoring
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// Performance observer for additional metrics
if ('PerformanceObserver' in window) {
  // Monitor long tasks
  const longTaskObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        sendToAnalytics({
          name: 'LongTask',
          value: entry.duration,
          id: 'long-task-' + Date.now()
        });
      }
    }
  });
  
  longTaskObserver.observe({ entryTypes: ['longtask'] });
  
  // Monitor layout shifts
  const layoutShiftObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        sendToAnalytics({
          name: 'LayoutShift',
          value: entry.value,
          id: 'layout-shift-' + Date.now()
        });
      }
    }
  });
  
  layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
}

// Export for external use
export { sendToAnalytics };
`;
  }

  /**
   * Generate lighthouse CI configuration
   */
  static generateLighthouseConfig(): any {
    return {
      ci: {
        collect: {
          url: [
            'http://localhost:3000',
            'http://localhost:3000/jobs',
            'http://localhost:3000/about'
          ],
          numberOfRuns: 3,
          settings: {
            chromeFlags: '--no-sandbox --headless'
          }
        },
        assert: {
          assertions: {
            'categories:performance': ['error', { minScore: 0.85 }],
            'categories:accessibility': ['error', { minScore: 0.95 }],
            'categories:best-practices': ['error', { minScore: 0.90 }],
            'categories:seo': ['error', { minScore: 0.90 }],
            'categories:pwa': ['warn', { minScore: 0.80 }]
          }
        },
        upload: {
          target: 'temporary-public-storage'
        }
      }
    };
  }
}