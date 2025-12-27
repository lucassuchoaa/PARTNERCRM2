import { useState, lazy, Suspense } from 'react'
import Login from './components/ui/Login'
import ErrorBoundary from './components/ErrorBoundary'
import { useAuth } from './hooks/useAuth'
import { useEffect } from 'react'

// Lazy load dashboard and page components for better performance
const Dashboard = lazy(() => import('./components/ui/Dashboard'))
const ManagerDashboard = lazy(() => import('./components/ui/ManagerDashboard'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const Checkout = lazy(() => import('./pages/Checkout'))
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'))
const DiagnosticoRoles = lazy(() => import('./components/DiagnosticoRoles'))

function useHashLocation() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return hash
}

export default function App() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const hash = useHashLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-t-transparent" aria-label="Carregando"></div>
        <span className="sr-only">Carregando aplicação...</span>
      </div>
    )
  }

  const renderPublicPages = () => {
    // Login page route
    if (hash === '#login') {
      return (
        <div className="relative isolate min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-96 h-96 bg-white opacity-5 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-white opacity-10 rounded-full"></div>
          </div>

          <div className="relative px-6 pt-14 lg:px-8">
            <div className="mx-auto max-w-4xl py-16 sm:py-24 lg:py-32">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 text-center lg:text-left">
                  <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">
                      Partners CRM
                    </h1>
                    <p className="text-lg text-blue-100 max-w-md mx-auto lg:mx-0">
                      A melhor plataforma de parceiros que sua empresa pode ter, simples e completa.
                    </p>
                  </div>
                </div>

                <div className="flex-1 max-w-md w-full">
                  <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white border-opacity-20">
                    <Login />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Signup page route
    if (hash === '#signup' || hash === '#cadastro') {
      return (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-t-transparent" aria-label="Carregando"></div>
              <span className="sr-only">Carregando página...</span>
            </div>
          }
        >
          <SignupPage />
        </Suspense>
      )
    }

    // Pricing page route
    if (hash === '#pricing') {
      return (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent" aria-label="Carregando"></div>
              <span className="sr-only">Carregando página...</span>
            </div>
          }
        >
          <PricingPage />
        </Suspense>
      )
    }

    // Checkout route
    if (hash === '#checkout') {
      return (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent" aria-label="Carregando"></div>
              <span className="sr-only">Carregando checkout...</span>
            </div>
          }
        >
          <Checkout />
        </Suspense>
      )
    }

    // Checkout success route
    if (hash === '#checkout-success') {
      return (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent" aria-label="Carregando"></div>
              <span className="sr-only">Carregando...</span>
            </div>
          }
        >
          <CheckoutSuccess />
        </Suspense>
      )
    }

    // Diagnostico de roles (para debug)
    if (hash === '#diagnostico-roles') {
      return (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent" aria-label="Carregando"></div>
              <span className="sr-only">Carregando diagnóstico...</span>
            </div>
          }
        >
          <DiagnosticoRoles />
        </Suspense>
      )
    }

    // Default landing page
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent" aria-label="Carregando"></div>
            <span className="sr-only">Carregando página...</span>
          </div>
        }
      >
        <LandingPage />
      </Suspense>
    )
  }

  return (
    <ErrorBoundary>
      <div className="bg-white">
      {!isAuthenticated ? (
        renderPublicPages()
      ) : (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-t-transparent" aria-label="Carregando dashboard"></div>
              <span className="sr-only">Carregando dashboard...</span>
            </div>
          }
        >
          {user?.role === 'manager' ? <ManagerDashboard /> : <Dashboard />}
        </Suspense>
      )}
    </div>
    </ErrorBoundary>
  )
}
