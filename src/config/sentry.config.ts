/**
 * Sentry Configuration for Error Tracking and Performance Monitoring
 *
 * Environment Variables Required:
 * - VITE_SENTRY_DSN: Sentry Data Source Name
 * - VITE_APP_URL: Application URL
 * - NODE_ENV: Environment (production, development, etc)
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const ENVIRONMENT = import.meta.env.NODE_ENV || 'development';

export const initSentry = () => {
  // Only initialize Sentry in production or if DSN is explicitly provided
  if (!SENTRY_DSN && ENVIRONMENT !== 'production') {
    console.info('Sentry not initialized: DSN not provided');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring Sample Rate
    // 100% in development, 20% in production
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1.0,

    // Session Replay Sample Rate
    // 10% of sessions in production
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0,

    // Session Replay on Error Sample Rate
    // 100% of sessions with errors
    replaysOnErrorSampleRate: 1.0,

    // Release tracking
    release: `partners-platform@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    // Ignore specific errors
    ignoreErrors: [
      // Network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',

      // Browser extensions
      'Extension context invalidated',
      'chrome-extension://',

      // User cancelled actions
      'AbortError',
      'User cancelled',

      // ResizeObserver (non-critical)
      'ResizeObserver loop limit exceeded',
    ],

    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from error context
      if (event.request) {
        delete event.request.cookies;

        // Filter authorization headers
        if (event.request.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.authorization;
        }
      }

      // Filter sensitive query parameters
      if (event.request?.url) {
        const url = new URL(event.request.url);
        const sensitiveParams = ['token', 'password', 'api_key', 'apiKey', 'secret'];

        sensitiveParams.forEach(param => {
          if (url.searchParams.has(param)) {
            url.searchParams.set(param, '[FILTERED]');
          }
        });

        event.request.url = url.toString();
      }

      // Log to console in development
      if (ENVIRONMENT === 'development') {
        console.error('Sentry Error:', hint.originalException || hint.syntheticException);
      }

      return event;
    },

    // Breadcrumbs configuration
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter sensitive breadcrumb data
      if (breadcrumb.category === 'console') {
        // Don't send console logs to Sentry
        return null;
      }

      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
        // Filter sensitive request data
        if (breadcrumb.data?.url) {
          const url = new URL(breadcrumb.data.url);
          const sensitiveParams = ['token', 'password', 'api_key', 'apiKey', 'secret'];

          sensitiveParams.forEach(param => {
            if (url.searchParams.has(param)) {
              url.searchParams.set(param, '[FILTERED]');
            }
          });

          breadcrumb.data.url = url.toString();
        }
      }

      return breadcrumb;
    },
  });

  // Set user context (without sensitive data)
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      Sentry.setUser({
        id: userData.id,
        email: userData.email,
        role: userData.role,
      });
    } catch (error) {
      console.error('Failed to set Sentry user context:', error);
    }
  }

  console.info('Sentry initialized successfully');
};

/**
 * Capture custom error with context
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
};

/**
 * Capture custom message
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb for tracking user actions
 */
export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
};

/**
 * Set custom context
 */
export const setContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

/**
 * Set tag for filtering errors
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Performance monitoring for specific operations
 * Using startSpan for modern Sentry API
 */
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({
    name,
    op,
  }, (span) => span);
};

export default Sentry;
