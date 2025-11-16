/**
 * Performance Monitoring Configuration
 * Web Vitals tracking for Core Web Vitals metrics
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial render
 * - TTFB (Time to First Byte): Server response time
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';

const ENVIRONMENT = import.meta.env.NODE_ENV || 'development';

/**
 * Performance thresholds based on Google's recommendations
 */
export const PERFORMANCE_THRESHOLDS = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
};

/**
 * Get performance rating based on metric value
 */
const getRating = (metric: Metric): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS];

  if (!thresholds) return 'good';

  if (metric.value <= thresholds.good) return 'good';
  if (metric.value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
};

/**
 * Send metric to analytics
 */
const sendToAnalytics = (metric: Metric) => {
  const rating = getRating(metric);

  // Log to console in development
  if (ENVIRONMENT === 'development') {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating,
      id: metric.id,
      navigationType: metric.navigationType,
    });
  }

  // Send to Sentry as measurement
  Sentry.setMeasurement(metric.name, metric.value, 'millisecond');

  // Add breadcrumb for tracking
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${metric.name}: ${metric.value}ms (${rating})`,
    level: rating === 'poor' ? 'warning' : 'info',
    data: {
      metric: metric.name,
      value: metric.value,
      rating,
      navigationType: metric.navigationType,
    },
  });

  // Send custom event to analytics (if available)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint
  sendToCustomAnalytics(metric, rating);
};

/**
 * Send to custom analytics endpoint
 */
const sendToCustomAnalytics = (metric: Metric, rating: string) => {
  const API_URL = import.meta.env.VITE_API_URL;

  if (!API_URL) return;

  // Use beacon API for reliable delivery
  const data = JSON.stringify({
    metric: metric.name,
    value: metric.value,
    rating,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(`${API_URL}/analytics/web-vitals`, data);
  } else {
    // Fallback to fetch
    fetch(`${API_URL}/analytics/web-vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true,
    }).catch(() => {
      // Silently fail - analytics shouldn't break the app
    });
  }
};

/**
 * Initialize Web Vitals tracking
 */
export const initPerformanceMonitoring = () => {
  // Track Core Web Vitals
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);

  console.info('Performance monitoring initialized');
};

/**
 * Custom performance measurement
 */
export const measurePerformance = (name: string, startTime: number) => {
  const duration = performance.now() - startTime;

  if (ENVIRONMENT === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }

  Sentry.setMeasurement(name, duration, 'millisecond');

  return duration;
};

/**
 * Track component render time
 */
export const trackComponentRender = (componentName: string) => {
  const startTime = performance.now();

  return () => {
    measurePerformance(`${componentName} render`, startTime);
  };
};

/**
 * Track API call performance
 */
export const trackAPICall = (endpoint: string, method: string = 'GET') => {
  const startTime = performance.now();

  return (success: boolean) => {
    const duration = measurePerformance(`API ${method} ${endpoint}`, startTime);

    Sentry.addBreadcrumb({
      category: 'api',
      message: `${method} ${endpoint} - ${success ? 'success' : 'failed'}`,
      level: success ? 'info' : 'error',
      data: {
        endpoint,
        method,
        duration,
        success,
      },
    });
  };
};

/**
 * Monitor bundle size
 */
export const logBundleSize = () => {
  if (ENVIRONMENT !== 'production') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const scripts = resources.filter(r => r.initiatorType === 'script');
  const styles = resources.filter(r => r.initiatorType === 'link' || r.initiatorType === 'css');

  const totalScriptSize = scripts.reduce((acc, r) => acc + (r.transferSize || 0), 0);
  const totalStyleSize = styles.reduce((acc, r) => acc + (r.transferSize || 0), 0);

  console.log('[Bundle Size]', {
    scripts: `${(totalScriptSize / 1024).toFixed(2)} KB`,
    styles: `${(totalStyleSize / 1024).toFixed(2)} KB`,
    total: `${((totalScriptSize + totalStyleSize) / 1024).toFixed(2)} KB`,
  });

  Sentry.setMeasurement('bundle.scripts', totalScriptSize / 1024, 'kilobyte');
  Sentry.setMeasurement('bundle.styles', totalStyleSize / 1024, 'kilobyte');
};

/**
 * Get performance report
 */
export const getPerformanceReport = () => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (!navigation) return null;

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    load: navigation.loadEventEnd - navigation.loadEventStart,
    total: navigation.loadEventEnd - navigation.fetchStart,
  };
};

export default {
  initPerformanceMonitoring,
  measurePerformance,
  trackComponentRender,
  trackAPICall,
  logBundleSize,
  getPerformanceReport,
};
