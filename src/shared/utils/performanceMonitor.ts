// src/shared/utils/performanceMonitor.ts

/**
 * Performance monitoring utilities for tracking app performance
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 100;
  private startTimes: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(metricName: string): void {
    this.startTimes.set(metricName, performance.now());
  }

  /**
   * End timing an operation and record the metric
   */
  end(metricName: string): number | null {
    const startTime = this.startTimes.get(metricName);
    if (!startTime) {
      console.warn(`No start time found for metric: ${metricName}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(metricName);

    // Record metric
    this.recordMetric({
      name: metricName,
      duration,
      timestamp: Date.now(),
    });

    return duration;
  }

  /**
   * Measure an async operation
   */
  async measure<T>(metricName: string, fn: () => Promise<T>): Promise<T> {
    this.start(metricName);
    try {
      const result = await fn();
      this.end(metricName);
      return result;
    } catch (error) {
      this.end(metricName);
      throw error;
    }
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === "development" && metric.duration > 1000) {
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get statistics for a specific metric
   */
  getStats(metricName: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const relevantMetrics = this.metrics.filter(m => m.name === metricName);
    
    if (relevantMetrics.length === 0) {
      return null;
    }

    const durations = relevantMetrics.map(m => m.duration);
    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
    };
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  /**
   * Get a summary report of all metrics
   */
  getReport(): Record<string, ReturnType<typeof this.getStats>> {
    const metricNames = [...new Set(this.metrics.map(m => m.name))];
    const report: Record<string, ReturnType<typeof this.getStats>> = {};
    
    metricNames.forEach(name => {
      report[name] = this.getStats(name);
    });

    return report;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * HOF to wrap a function with performance monitoring
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  metricName: string,
  fn: T
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    performanceMonitor.start(metricName);
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.end(metricName);
        }) as ReturnType<T>;
      }
      
      performanceMonitor.end(metricName);
      return result;
    } catch (error) {
      performanceMonitor.end(metricName);
      throw error;
    }
  }) as T;
}
