import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HelmetProvider } from 'react-helmet-async'
import { queryClient } from './lib/queryClient'
import { initSentry } from './config/sentry.config'
import { initPerformanceMonitoring, logBundleSize } from './config/performance.config'
import './index.css'
import App from './App.tsx'

// Initialize Sentry error tracking
initSentry()

// Initialize Web Vitals performance monitoring
initPerformanceMonitoring()

// Log bundle size in production
if (import.meta.env.PROD) {
  window.addEventListener('load', () => {
    logBundleSize()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        {/* React Query Devtools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
)
