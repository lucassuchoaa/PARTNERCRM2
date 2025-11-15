/**
 * React Query Configuration
 *
 * Centralized configuration for @tanstack/react-query
 * Provides API caching, background refetching, and error handling
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the React Query client
 *
 * @see https://tanstack.com/query/latest/docs/react/reference/QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests 2 times with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (useful for dashboards)
      refetchOnWindowFocus: true,

      // Refetch on reconnect (handle offline scenarios)
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,

      // Network mode: online only (don't run queries when offline)
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,

      // Network mode for mutations
      networkMode: 'online',

      // Global error handler for mutations
      onError: (error) => {
        // Log errors in development
        if (import.meta.env.DEV) {
          console.error('Mutation error:', error);
        }

        // In production, you would send to error tracking service
        // Example: Sentry.captureException(error);
      },
    },
  },
});

/**
 * Query Keys Factory
 *
 * Centralized query key management for type safety and consistency
 */
export const queryKeys = {
  // Authentication
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
    permissions: (userId: string) => ['auth', 'permissions', userId] as const,
  },

  // Clients
  clients: {
    all: ['clients'] as const,
    list: (filters?: Record<string, unknown>) => ['clients', 'list', filters] as const,
    detail: (id: string) => ['clients', 'detail', id] as const,
    search: (query: string) => ['clients', 'search', query] as const,
  },

  // Referrals
  referrals: {
    all: ['referrals'] as const,
    list: (filters?: Record<string, unknown>) => ['referrals', 'list', filters] as const,
    detail: (id: string) => ['referrals', 'detail', id] as const,
    byPartner: (partnerId: string) => ['referrals', 'byPartner', partnerId] as const,
    stats: (partnerId: string) => ['referrals', 'stats', partnerId] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    list: (filters?: Record<string, unknown>) => ['reports', 'list', filters] as const,
    detail: (id: string) => ['reports', 'detail', id] as const,
    monthly: (year: number, month: number) => ['reports', 'monthly', year, month] as const,
  },

  // Dashboard
  dashboard: {
    stats: (userId: string) => ['dashboard', 'stats', userId] as const,
    chart: (userId: string, type: string) => ['dashboard', 'chart', userId, type] as const,
  },

  // Integrations
  integrations: {
    hubspot: {
      contacts: ['integrations', 'hubspot', 'contacts'] as const,
      sync: ['integrations', 'hubspot', 'sync'] as const,
    },
    netsuite: {
      customers: ['integrations', 'netsuite', 'customers'] as const,
      sync: ['integrations', 'netsuite', 'sync'] as const,
    },
  },
} as const;

/**
 * Helper to invalidate related queries
 *
 * Example:
 * ```ts
 * await invalidateQueries(queryClient, 'clients')
 * // Invalidates all client-related queries
 * ```
 */
export function invalidateQueries(
  client: QueryClient,
  key: keyof typeof queryKeys
): Promise<void> {
  return client.invalidateQueries({ queryKey: [key] });
}

/**
 * Helper to prefetch data
 *
 * Example:
 * ```ts
 * await prefetchQuery(queryClient, queryKeys.clients.detail('123'), () => fetchClient('123'))
 * ```
 */
export async function prefetchQuery<T>(
  client: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
): Promise<void> {
  await client.prefetchQuery({
    queryKey,
    queryFn,
  });
}
