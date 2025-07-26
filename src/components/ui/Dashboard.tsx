import { useState, useEffect } from 'react'
import { Dialog, Menu } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, FolderIcon, HomeIcon, UsersIcon, BookOpenIcon, UserPlusIcon, CogIcon } from '@heroicons/react/24/outline'
import { UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid'
import Settings from './Settings'
import Clients from './Clients'
import Reports from './Reports'
import SupportMaterials from './SupportMaterials'
import Referrals from './Referrals'
import Admin from './Admin'

import Profile from './Profile'
import { getCurrentUser } from '../../services/auth'

interface Client {
  id: number
  name: string
  cnpj: string
  status: string
  stage: string
  temperature: string
  totalLives: number
  contractEndDate: string
  lastUpdated: string
}

interface Transaction {
  id: number
  clientId: number
  type: string
  amount: number
  status: string
  date: string
}

interface Document {
  id: number
  clientId: number
  type: string
  status: string
  uploadDate: string
}

const getNavigation = (isAdmin: boolean) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '#', icon: HomeIcon, current: true, view: 'dashboard' },
    { name: 'Clientes', href: '#', icon: UsersIcon, current: false, view: 'clients' },
    { name: 'Relatórios', href: '#', icon: ChartBarIcon, current: false, view: 'reports' },
    { name: 'Material de Apoio', href: '#', icon: BookOpenIcon, current: false, view: 'support-materials' },
    { name: 'Indicações', href: '#', icon: UserPlusIcon, current: false, view: 'referrals' },
  ]
  
  if (isAdmin) {
    baseNavigation.push(
      { name: 'Administração', href: '#', icon: CogIcon, current: false, view: 'admin' }
    )
  }
  
  return baseNavigation
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [productFilter, setProductFilter] = useState('all')
  const [prospects, setProspects] = useState<any[]>([])
  const [dashboardData, setDashboardData] = useState({
    totalClients: 0,
    totalTransactions: 0,
    pendingDocuments: 0
  })
  const [clients, setClients] = useState<Client[]>([])

  const getProductOpportunities = (product: string) => {
    if (product === 'all') {
      return prospects.filter(p => p.status === 'in-analysis' || p.status === 'approved').length
    }
    
    // Simular contagem baseada no segmento do prospect
    const productMapping: { [key: string]: string[] } = {
      'folha': ['Tecnologia', 'Serviços', 'Indústria'],
      'consignado': ['Comércio', 'Serviços'],
      'beneficios': ['Tecnologia', 'Comércio', 'Indústria']
    }
    
    const relevantSegments = productMapping[product] || []
    return prospects.filter(p => 
      (p.status === 'in-analysis' || p.status === 'approved') && 
      relevantSegments.includes(p.segment)
    ).length
  }

  const getFilteredClients = () => {
    if (productFilter === 'all') {
      return clients
    }
    
    // Filtrar clientes baseado no produto selecionado
    const productMapping: { [key: string]: string[] } = {
      'folha': ['lead', 'negociacao', 'fechado'],
      'consignado': ['negociacao', 'proposta', 'fechado'],
      'beneficios': ['lead', 'proposta', 'fechado']
    }
    
    const relevantStages = productMapping[productFilter] || []
    return clients.filter(client => relevantStages.includes(client.stage))
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const user = await getCurrentUser()
        setCurrentUser(user)
        
        // Fetch dashboard data
        const [clientsData, transactions, documents, prospectsData] = await Promise.all([
          fetch('http://localhost:3001/clients').then(res => res.json()),
          fetch('http://localhost:3001/transactions').then(res => res.json()),
          fetch('http://localhost:3001/documents').then(res => res.json()),
          fetch('http://localhost:3001/prospects').then(res => res.json())
        ])

        const totalTransactionsAmount = transactions.reduce((acc: number, curr: Transaction) => acc + curr.amount, 0)
        const pendingDocs = documents.filter((doc: Document) => doc.status === 'pending').length

        setDashboardData({
          totalClients: clientsData.length,
          totalTransactions: totalTransactionsAmount,
          pendingDocuments: pendingDocs
        })
        
        setClients(clientsData)
        setProspects(prospectsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  return (
    <div>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="/src/assets/somapay-new-logo.svg"
              alt="Somapay"
            />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {getNavigation(currentUser?.role === 'admin').map((item: any) => (
                    <li key={item.name}>
                      <button
                        onClick={() => setCurrentView(item.view)}
                        className={classNames(
                          currentView === item.view
                            ? 'bg-gray-50 text-indigo-600'
                            : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-left'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            currentView === item.view ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              {currentUser?.role === 'admin' && (
                <li className="mt-auto">
                  <a
                    href="#"
                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                  >
                    <svg
                      className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Configurações
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Abrir sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                <span className="sr-only">Ver notificações</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
              </button>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Abrir menu do usuário</span>
                  <img
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt=""
                  />
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                      {currentUser?.name || 'Usuário'}
                    </span>
                  </span>
                </Menu.Button>
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setCurrentView('profile')}
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'flex items-center px-3 py-1.5 text-sm leading-6 text-gray-900 w-full text-left'
                        )}
                      >
                        <UserIcon className="mr-2 h-5 w-5 text-gray-400" />
                        Perfil
                      </button>
                    )}
                  </Menu.Item>
                  {currentUser?.role === 'admin' && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setCurrentView('settings')}
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'flex items-center px-3 py-1.5 text-sm leading-6 text-gray-900 w-full text-left'
                          )}
                        >
                          <Cog6ToothIcon className="mr-2 h-5 w-5 text-gray-400" />
                          Configurações
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'flex items-center px-3 py-1.5 text-sm leading-6 text-gray-900'
                        )}
                        onClick={() => {
                          localStorage.removeItem('user')
                          window.location.href = '/'
                        }}
                      >
                        <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5 text-gray-400" />
                        Logout
                      </a>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {currentView === 'settings' ? (
              <Settings />
            ) : currentView === 'clients' ? (
              <Clients />
            ) : currentView === 'reports' ? (
              <Reports />
            ) : currentView === 'support-materials' ? (
              <SupportMaterials />
            ) : currentView === 'referrals' ? (
              <Referrals />
            ) : currentView === 'admin' && currentUser?.role === 'admin' ? (
              <Admin />
            ) : currentView === 'profile' ? (
              <Profile />
            ) : (
              <div>
                {/* Hero Section - Inspirado na Somapay */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl mb-8">
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                  <div className="relative px-8 py-12">
                    <div className="max-w-4xl mx-auto text-center">
                      <h1 className="text-4xl font-bold text-white mb-4">
                        Portal do Parceiro Somapay
                      </h1>
                      <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Conecte empresas às soluções financeiras da Somapay e gere receita com cada indicação bem-sucedida.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                          onClick={() => setCurrentView('referrals')}
                          className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                        >
                          Fazer Nova Indicação
                        </button>
                        <button 
                          onClick={() => setCurrentView('support-materials')}
                          className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                        >
                          Material de Apoio
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                  <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white opacity-5 rounded-full"></div>
                </div>

                {/* Stats Cards - Redesenhados com cores da Somapay */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <UsersIcon className="h-6 w-6 text-white" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-600">Clientes Indicados</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.totalClients}</p>
                          <p className="text-sm text-green-600 font-medium">+12% este mês</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-600">Comissões Geradas</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(dashboardData.totalTransactions)}
                          </p>
                          <p className="text-sm text-green-600 font-medium">+8% este mês</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <FolderIcon className="h-6 w-6 text-white" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-600">Propostas Pendentes</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.pendingDocuments}</p>
                          <p className="text-sm text-yellow-600 font-medium">Aguardando análise</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Produtos Somapay - Seção com filtros */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Produtos Somapay para Indicação</h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setProductFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          productFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setProductFilter('folha')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          productFilter === 'folha'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Folha de Pagamento
                      </button>
                      <button
                        onClick={() => setProductFilter('consignado')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          productFilter === 'consignado'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Consignado
                      </button>
                      <button
                        onClick={() => setProductFilter('beneficios')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          productFilter === 'beneficios'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Benefícios
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Folha de Pagamento</h3>
                      <p className="text-sm text-gray-600 mb-3">Pagamento de folha 100% digital com integração ERP</p>
                      <div className="text-xs text-blue-600 font-medium">
                        {getProductOpportunities('folha')} oportunidades
                      </div>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Crédito Consignado</h3>
                      <p className="text-sm text-gray-600 mb-3">Crédito pré-aprovado para colaboradores</p>
                      <div className="text-xs text-green-600 font-medium">
                        {getProductOpportunities('consignado')} oportunidades
                      </div>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Benefícios Flexíveis</h3>
                      <p className="text-sm text-gray-600 mb-3">Cartão de benefícios e gestão de despesas</p>
                      <div className="text-xs text-purple-600 font-medium">
                        {getProductOpportunities('beneficios')} oportunidades
                      </div>
                    </div>
                  </div>
                </div>

                {/* Funil de Vendas e Tabela */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Funil de Vendas</h2>
                    <div className="bg-white rounded-lg shadow">
                      <div className="p-6">
                        <svg width="600" height="300" viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
                          {/* Funil Stage 1: Leads */}
                          <path d="M50,20 L550,20 L500,100 L100,100 Z" fill="#4F46E5" opacity="0.9"/>
                          <text x="300" y="70" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="24">Leads</text>
                          
                          {/* Funil Stage 2: Negociação */}
                          <path d="M100,110 L500,110 L450,190 L150,190 Z" fill="#6366F1" opacity="0.9"/>
                          <text x="300" y="160" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="24">Negociação</text>
                          
                          {/* Funil Stage 3: Contrato Fechado */}
                          <path d="M150,200 L450,200 L400,280 L200,280 Z" fill="#818CF8" opacity="0.9"/>
                          <text x="300" y="250" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="24">Contrato Fechado</text>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Detalhamento do Funil</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cliente
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Etapa
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Temperatura
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Qtde de vidas
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getFilteredClients().map((client) => {
                            const getStageBadge = (stage: string) => {
                              const stageConfig = {
                                'lead': { color: 'bg-blue-100 text-blue-800', text: 'Lead' },
                                'negociacao': { color: 'bg-yellow-100 text-yellow-800', text: 'Negociação' },
                                'proposta': { color: 'bg-purple-100 text-purple-800', text: 'Proposta' },
                                'fechado': { color: 'bg-green-100 text-green-800', text: 'Fechado' },
                                'perdido': { color: 'bg-red-100 text-red-800', text: 'Perdido' }
                              }
                              const config = stageConfig[stage as keyof typeof stageConfig] || { color: 'bg-gray-100 text-gray-800', text: stage }
                              return (
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
                                  {config.text}
                                </span>
                              )
                            }

                            const getTemperatureBadge = (temperature: string) => {
                              const tempConfig = {
                                'frio': { color: 'bg-blue-100 text-blue-800', text: 'Frio' },
                                'morno': { color: 'bg-yellow-100 text-yellow-800', text: 'Morno' },
                                'quente': { color: 'bg-red-100 text-red-800', text: 'Quente' }
                              }
                              const config = tempConfig[temperature as keyof typeof tempConfig] || { color: 'bg-gray-100 text-gray-800', text: temperature }
                              return (
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
                                  {config.text}
                                </span>
                              )
                            }

                            return (
                              <tr key={client.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {getStageBadge(client.stage)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {getTemperatureBadge(client.temperature)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.totalLives}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}