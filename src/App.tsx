import { useEffect, useState } from 'react'
import Dashboard from './components/ui/Dashboard'
import ManagerDashboard from './components/ui/ManagerDashboard'
import Login from './components/ui/Login'
import { getCurrentUser } from './services/auth'

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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const hash = useHashLocation()

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser()
      setIsLoggedIn(!!user)
      setCurrentUser(user)
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {!isLoggedIn ? (
        <>
          <div className="relative isolate min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-96 h-96 bg-white opacity-5 rounded-full"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-white opacity-10 rounded-full"></div>
              <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
              <div className="absolute top-1/4 right-1/3 w-48 h-48 bg-white opacity-5 rounded-full"></div>
            </div>
            
            <div className="relative px-6 pt-14 lg:px-8">
              <div className="mx-auto max-w-4xl py-16 sm:py-24 lg:py-32">
                {hash === '#login' ? (
                  <div className="flex flex-col lg:flex-row items-center gap-12">
                    {/* Left side - Branding */}
                    <div className="flex-1 text-center lg:text-left">
                      <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-4">
                          Portal do Parceiro
                        </h1>
                        <h2 className="text-2xl font-semibold text-blue-100 mb-6">
                          Somapay Digital Bank
                        </h2>
                        <p className="text-lg text-blue-100 max-w-md mx-auto lg:mx-0">
                          Conecte empresas às nossas soluções financeiras e gere receita com cada indicação bem-sucedida.
                        </p>
                      </div>
                      
                      {/* Features */}
                      <div className="space-y-4 max-w-md mx-auto lg:mx-0">
                        <div className="flex items-center text-blue-100">
                          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>Comissões atrativas por indicação</span>
                        </div>
                        <div className="flex items-center text-blue-100">
                          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>Suporte completo e material de apoio</span>
                        </div>
                        <div className="flex items-center text-blue-100">
                          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>Dashboard completo para acompanhamento</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Login Form */}
                    <div className="flex-1 max-w-md w-full">
                      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white border-opacity-20">
                        <Login onLogin={() => setIsLoggedIn(true)} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-8">
                      <h1 className="text-5xl font-bold text-white mb-6 sm:text-6xl">
                        Portal do Parceiro Somapay
                      </h1>
                      <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Conecte empresas às soluções financeiras da Somapay e transforme indicações em receita recorrente. 
                        Junte-se à nossa rede de parceiros e acelere o crescimento do seu negócio.
                      </p>
                    </div>
                    
                    {/* Products showcase */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Folha de Pagamento</h3>
                        <p className="text-blue-100 text-sm">Pagamento 100% digital</p>
                      </div>
                      
                      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Crédito Consignado</h3>
                        <p className="text-blue-100 text-sm">Crédito pré-aprovado</p>
                      </div>
                      
                      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Benefícios Flexíveis</h3>
                        <p className="text-blue-100 text-sm">Cartão de benefícios</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                      <a
                        href="#login"
                        className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
                      >
                        Acessar Portal do Parceiro
                      </a>
                      <a href="#" className="text-white font-semibold text-lg hover:text-blue-100 transition-colors">
                        Saiba mais sobre a parceria <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        currentUser?.role === 'manager' ? <ManagerDashboard /> : <Dashboard />
      )}
    </div>
  )
}
