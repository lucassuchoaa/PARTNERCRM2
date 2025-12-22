import { useState, useEffect, Fragment } from 'react'
import { Dialog, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, FolderIcon, HomeIcon, UsersIcon, BookOpenIcon, UserPlusIcon, CogIcon } from '@heroicons/react/24/outline'
import { UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid'
import Settings from './Settings'
import Clients from './Clients'
import Reports from './Reports'
import SupportMaterials from './SupportMaterials'
import Referrals from './Referrals'
import Admin from './Admin'
import ChatBotHybrid from './ChatBotHybrid'

import Profile from './Profile'
import { useAuth } from '../../hooks/useAuth'
import { API_URL } from '../../config/api'
import { productService } from '../../services/productService'
import type { Product } from '../../types/products'
import * as HeroIcons from '@heroicons/react/24/outline'
import { fetchWithAuth } from '../../services/api/fetch-with-auth'
import { logout } from '../../services/auth'

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

interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  recipientId: string
  createdAt: string
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
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [productFilter, setProductFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [prospects, setProspects] = useState<any[]>([])
  const [dashboardData, setDashboardData] = useState({
    totalClients: 0,
    totalTransactions: 0,
    currentMonthReferrals: 0,
    previousMonthReferrals: 0,
    referralsGrowth: 0,
    currentMonthCommissions: 0,
    previousMonthCommissions: 0,
    commissionsGrowth: 0
  })
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])

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
    let filteredClients = clients
    
    // Filtrar por produto
    if (productFilter !== 'all') {
      const productMapping: { [key: string]: string[] } = {
        'folha': ['prospeccao', 'apresentacao', 'negociacao', 'contrato_fechado'],
        'consignado': ['negociacao', 'contrato_fechado'],
        'beneficios': ['prospeccao', 'apresentacao', 'contrato_fechado']
      }
      
      const relevantStages = productMapping[productFilter] || []
      filteredClients = filteredClients.filter(client => relevantStages.includes(client.stage))
    }
    
    // Filtrar por etapa
    if (stageFilter !== 'all') {
      filteredClients = filteredClients.filter(client => client.stage === stageFilter)
    }
    
    return filteredClients
  }
  
  const getStageCount = (stage: string) => {
    return clients.filter(client => client.stage === stage).length
  }

  const loadNotifications = async (userId: string) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/notifications?recipientId=${userId}`)
      
      if (!response.ok) {
        // Se a API retornar erro, manter array vazio
        setNotifications([])
        setUnreadCount(0)
        return
      }
      
      const notificationsData = await response.json()
      
      // Garantir que sempre seja um array
      const notificationsArray = Array.isArray(notificationsData) ? notificationsData : []
      setNotifications(notificationsArray)
      
      // Contar notificações não lidas
      const unread = notificationsArray.filter((n: Notification) => !n.isRead).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      // Em caso de erro, garantir array vazio
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await fetchWithAuth(`${API_URL}/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: true })
      })
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  useEffect(() => {
    // Carregar produtos customizáveis
    const loadProducts = async () => {
      const loadedProducts = await productService.getActiveProducts()
      setProducts(loadedProducts)
    }
    loadProducts()
  }, [])

  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        if (authUser) {
          setCurrentUser(authUser)

          // Carregar notificações do usuário
          await loadNotifications(authUser.id.toString())

          // Fetch dashboard data com autenticação
          const [clientsData, transactions, prospectsData] = await Promise.all([
            fetchWithAuth(`${API_URL}/clients`).then(res => res.json()),
            fetchWithAuth(`${API_URL}/transactions`).then(res => res.json()),
            fetchWithAuth(`${API_URL}/prospects`).then(res => res.json())
          ])

          const totalTransactionsAmount = transactions.reduce((acc: number, curr: Transaction) => acc + curr.amount, 0)

          // Calcular indicações do mês atual e anterior
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

          const currentMonthReferrals = prospectsData.filter((prospect: any) => {
            if (!prospect.submittedAt) return false
            const submittedDate = new Date(prospect.submittedAt)
            return submittedDate.getMonth() === currentMonth && submittedDate.getFullYear() === currentYear
          }).length

          const previousMonthReferrals = prospectsData.filter((prospect: any) => {
            if (!prospect.submittedAt) return false
            const submittedDate = new Date(prospect.submittedAt)
            return submittedDate.getMonth() === previousMonth && submittedDate.getFullYear() === previousYear
          }).length

          const referralsGrowth = previousMonthReferrals > 0
            ? ((currentMonthReferrals - previousMonthReferrals) / previousMonthReferrals) * 100
            : currentMonthReferrals > 0 ? 100 : 0

          // Calcular comissões do mês atual e anterior
          const currentMonthCommissions = transactions
            .filter((t: Transaction) => {
              if (!t.date) return false
              const transactionDate = new Date(t.date)
              return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
            })
            .reduce((acc: number, curr: Transaction) => acc + curr.amount, 0)

          const previousMonthCommissions = transactions
            .filter((t: Transaction) => {
              if (!t.date) return false
              const transactionDate = new Date(t.date)
              return transactionDate.getMonth() === previousMonth && transactionDate.getFullYear() === previousYear
            })
            .reduce((acc: number, curr: Transaction) => acc + curr.amount, 0)

          const commissionsGrowth = previousMonthCommissions > 0
            ? ((currentMonthCommissions - previousMonthCommissions) / previousMonthCommissions) * 100
            : currentMonthCommissions > 0 ? 100 : 0

          setDashboardData({
            totalClients: clientsData.length,
            totalTransactions: totalTransactionsAmount,
            currentMonthReferrals,
            previousMonthReferrals,
            referralsGrowth,
            currentMonthCommissions,
            previousMonthCommissions,
            commissionsGrowth
          })
          
          setClients(clientsData)
          setProspects(prospectsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    if (!authLoading && authUser) {
      loadUserAndData()
    }
  }, [authUser, authLoading])

  return (
    <div>
      {/* ChatBot Component */}
      <ChatBotHybrid products={products} />

      {/* Mobile menu */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Fechar sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <h1 className="text-2xl font-bold text-blue-600">Partners CRM</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {getNavigation(currentUser?.role === 'admin').map((item: any) => (
                            <li key={item.name}>
                              <button
                                onClick={() => {
                                  setCurrentView(item.view)
                                  setSidebarOpen(false)
                                }}
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
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-2xl font-bold text-blue-600">Partners CRM</h1>
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
              {/* Notifications */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative">
                  <span className="sr-only">Ver notificações</span>
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Menu.Button>
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Notificações</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Menu.Item key={notification.id}>
                        {({ active }) => (
                          <div
                            className={`px-4 py-3 cursor-pointer ${
                              active ? 'bg-gray-50' : ''
                            } ${!notification.isRead ? 'bg-blue-50' : ''}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                              )}
                            </div>
                          </div>
                        )}
                      </Menu.Item>
                    ))
                  )}
                </Menu.Items>
              </Menu>

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
                          logout()
                          window.location.href = '/#login'
                          window.location.reload()
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
              <Profile onUserUpdate={setCurrentUser} />
            ) : (
              <div>
                {/* Hero Section - Dashboard Overview */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl mb-8">
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                  <div className="relative px-8 py-12">
                    <div className="max-w-4xl mx-auto text-center">
                      <h1 className="text-4xl font-bold text-white mb-4">
                        Bem-vindo ao Portal do Parceiro
                      </h1>
                      <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        A melhor plataforma de parceiros que sua empresa pode ter, simples e completa.
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

                {/* Stats Cards - Dashboard Metrics */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
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
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.currentMonthReferrals}</p>
                          <p className="text-sm text-gray-500 mb-1">Este mês</p>
                          <p className={`text-sm font-medium ${
                            dashboardData.referralsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dashboardData.referralsGrowth >= 0 ? '+' : ''}{dashboardData.referralsGrowth.toFixed(1)}% vs mês anterior ({dashboardData.previousMonthReferrals})
                          </p>
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
                          {dashboardData.commissionsGrowth !== 0 && (
                          <p className={`text-sm font-medium ${dashboardData.commissionsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {dashboardData.commissionsGrowth >= 0 ? '+' : ''}{dashboardData.commissionsGrowth.toFixed(0)}% este mês
                          </p>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>


                </div>

                {/* Produtos - Seção customizável */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Produtos para Indicação</h2>
                    <div className="flex space-x-2 flex-wrap gap-2">
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
                      {products.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => setProductFilter(product.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            productFilter === product.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {product.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {products.map((product) => {
                      const Icon = (HeroIcons as any)[product.icon] || HeroIcons.ShoppingCartIcon;
                      const colorClasses = {
                        blue: { bg: 'from-blue-50 to-indigo-50', iconBg: 'from-blue-500 to-purple-600', text: 'text-blue-600' },
                        green: { bg: 'from-green-50 to-emerald-50', iconBg: 'from-green-500 to-blue-600', text: 'text-green-600' },
                        purple: { bg: 'from-purple-50 to-pink-50', iconBg: 'from-purple-500 to-pink-600', text: 'text-purple-600' },
                        red: { bg: 'from-red-50 to-orange-50', iconBg: 'from-red-500 to-orange-600', text: 'text-red-600' },
                        yellow: { bg: 'from-yellow-50 to-amber-50', iconBg: 'from-yellow-500 to-amber-600', text: 'text-yellow-600' },
                        indigo: { bg: 'from-indigo-50 to-blue-50', iconBg: 'from-indigo-500 to-blue-600', text: 'text-indigo-600' },
                        pink: { bg: 'from-pink-50 to-rose-50', iconBg: 'from-pink-500 to-rose-600', text: 'text-pink-600' },
                        cyan: { bg: 'from-cyan-50 to-teal-50', iconBg: 'from-cyan-500 to-teal-600', text: 'text-cyan-600' },
                      }[product.color] || { bg: 'from-gray-50 to-slate-50', iconBg: 'from-gray-500 to-slate-600', text: 'text-gray-600' };

                      return (
                        <div key={product.id} className={`text-center p-6 bg-gradient-to-br ${colorClasses.bg} rounded-xl`}>
                          <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                          <div className={`text-xs ${colorClasses.text} font-medium`}>
                            {getProductOpportunities(product.id)} oportunidades
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Funil de Vendas e Tabela */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Funil de Vendas</h2>
                      <button
                        onClick={() => setStageFilter('all')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          stageFilter === 'all'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Limpar Filtro
                      </button>
                    </div>
                    <div className="bg-white rounded-lg shadow">
                      <div className="p-6">
                        <svg width="600" height="380" viewBox="0 0 600 380" className="w-full max-w-2xl mx-auto">
                          {/* Funil Stage 1: Prospecção */}
                          <g 
                            className="cursor-pointer transition-opacity hover:opacity-80"
                            onClick={() => setStageFilter(stageFilter === 'prospeccao' ? 'all' : 'prospeccao')}
                          >
                            <path 
                              d="M50,20 L550,20 L520,80 L80,80 Z" 
                              fill={stageFilter === 'prospeccao' ? '#1E40AF' : '#3B82F6'} 
                              opacity="0.9"
                            />
                            <text x="300" y="45" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="18" fontWeight="bold">
                              Prospecção ({getStageCount('prospeccao')})
                            </text>
                            <text x="300" y="62" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10">
                              Clique para filtrar
                            </text>
                          </g>
                          
                          {/* Funil Stage 2: Apresentação */}
                          <g 
                            className="cursor-pointer transition-opacity hover:opacity-80"
                            onClick={() => setStageFilter(stageFilter === 'apresentacao' ? 'all' : 'apresentacao')}
                          >
                            <path 
                              d="M80,90 L520,90 L480,150 L120,150 Z" 
                              fill={stageFilter === 'apresentacao' ? '#1E40AF' : '#6366F1'} 
                              opacity="0.9"
                            />
                            <text x="300" y="115" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="18" fontWeight="bold">
                              Apresentação ({getStageCount('apresentacao')})
                            </text>
                            <text x="300" y="132" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10">
                              Clique para filtrar
                            </text>
                          </g>
                          
                          {/* Funil Stage 3: Negociação */}
                          <g 
                            className="cursor-pointer transition-opacity hover:opacity-80"
                            onClick={() => setStageFilter(stageFilter === 'negociacao' ? 'all' : 'negociacao')}
                          >
                            <path 
                              d="M120,160 L480,160 L440,220 L160,220 Z" 
                              fill={stageFilter === 'negociacao' ? '#DC2626' : '#F59E0B'} 
                              opacity="0.9"
                            />
                            <text x="300" y="185" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="18" fontWeight="bold">
                              Negociação ({getStageCount('negociacao')})
                            </text>
                            <text x="300" y="202" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10">
                              Clique para filtrar
                            </text>
                          </g>
                          
                          {/* Funil Stage 4: Contrato Fechado */}
                          <g 
                            className="cursor-pointer transition-opacity hover:opacity-80"
                            onClick={() => setStageFilter(stageFilter === 'contrato_fechado' ? 'all' : 'contrato_fechado')}
                          >
                            <path 
                              d="M160,230 L440,230 L400,290 L200,290 Z" 
                              fill={stageFilter === 'contrato_fechado' ? '#059669' : '#10B981'} 
                              opacity="0.9"
                            />
                            <text x="300" y="255" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="18" fontWeight="bold">
                              Contrato Fechado ({getStageCount('contrato_fechado')})
                            </text>
                            <text x="300" y="272" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10">
                              Clique para filtrar
                            </text>
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">
                        Detalhamento do Funil
                        {stageFilter !== 'all' && (
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            - Filtrado por: {stageFilter === 'prospeccao' ? 'Prospecção' : 
                                            stageFilter === 'apresentacao' ? 'Apresentação' :
                                            stageFilter === 'negociacao' ? 'Negociação' :
                                            stageFilter === 'contrato_fechado' ? 'Contrato Fechado' : 'Perdido'}
                          </span>
                        )}
                      </h2>
                      {stageFilter !== 'all' && (
                        <span className="text-sm text-gray-500">
                          {getFilteredClients().length} cliente(s)
                        </span>
                      )}
                    </div>
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
                                'prospeccao': { color: 'bg-blue-100 text-blue-800', text: 'Prospecção' },
                                'apresentacao': { color: 'bg-indigo-100 text-indigo-800', text: 'Apresentação' },
                                'negociacao': { color: 'bg-yellow-100 text-yellow-800', text: 'Negociação' },
                                'contrato_fechado': { color: 'bg-green-100 text-green-800', text: 'Contrato Fechado' },
                                'perdido': { color: 'bg-red-100 text-red-800', text: 'Perdido' }
                              }
                              const config = stageConfig[stage as keyof typeof stageConfig] || { color: 'bg-gray-100 text-gray-800', text: stage || 'N/A' }
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