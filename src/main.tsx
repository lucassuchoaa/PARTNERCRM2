import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
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
      <App />
    </HelmetProvider>
  </StrictMode>,
)
