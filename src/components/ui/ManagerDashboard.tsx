import { useState, useEffect } from 'react'
import { Dialog, Menu } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, FolderIcon, HomeIcon, UsersIcon, BookOpenIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { UserIcon, ArrowRightOnRectangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid'
import { getCurrentUser, logout } from '../../services/auth'
import { API_URL } from '../../config/api'
import Profile from './Profile'
import Admin from './Admin'
import ChatBotHybrid from './ChatBotHybrid'
import { productService } from '../../services/productService'

interface Partner {
  id: string
  name: string
  email: string
  role: string
  company?: {
    name: string
    cnpj: string
    address: string
    phone: string
  }
  bankData?: {
    bank: string
    agency: string
    account: string
    accountType: string
    pix: string
  }
  managerId?: string
  managerName?: string
  remunerationTableIds?: number[]
}

interface Prospect {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  cnpj: string
  employeeCount: number
  segment: string
  status: 'pending' | 'validated' | 'in-analysis' | 'approved' | 'rejected'
  submittedAt: string
  viabilityScore?: number
  partnerId: string
  managerValidation?: {
    isValidated: boolean
    validatedBy: string
    validatedAt: string
    notes: string
    isApproved: boolean
  }
}

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
  partnerId?: string
}

const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon, current: true, view: 'dashboard' },
  { name: 'Clientes', href: '#', icon: UsersIcon, current: false, view: 'clients' },
  { name: 'Meus Parceiros', href: '#', icon: UsersIcon, current: false, view: 'partners' },
  { name: 'Indicações', href: '#', icon: UserPlusIcon, current: false, view: 'referrals' },
  { name: 'Relatórios', href: '#', icon: ChartBarIcon, current: false, view: 'reports' },
  { name: 'Administração', href: '#', icon: FolderIcon, current: false, view: 'admin' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ManagerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [dashboardData, setDashboardData] = useState({
    totalPartners: 0,
    totalProspects: 0,
    totalClients: 0,
    pendingProspects: 0
  })
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [partnerFilter, setPartnerFilter] = useState<string>('all')
  const [partnerReports, setPartnerReports] = useState<any[]>([])

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setCurrentUser(user)

          // Buscar parceiros vinculados ao gerente
          let myPartners: Partner[] = []

          // Buscar todos os usuários e filtrar os parceiros vinculados a este gerente
          const usersResponse = await fetch(`${API_URL}/users`, { credentials: 'include' })
          if (usersResponse.ok) {
            const allUsers = await usersResponse.json()
            // Filtrar usuários que são parceiros e estão vinculados a este gerente
            myPartners = allUsers.filter((u: any) =>
              u.role === 'partner' &&
              u.managerId === user.id &&
              u.status === 'active'
            )
            setPartners(myPartners)
          } else {
            // Erro ao buscar usuários - definir array vazio
            setPartners([])
          }

          // Buscar prospects - a API ja filtra automaticamente por role
          const prospectsResponse = await fetch(`${API_URL}/prospects`, { credentials: 'include' })
          let myProspects: Prospect[] = []
          if (prospectsResponse.ok) {
            myProspects = await prospectsResponse.json()
            setProspects(myProspects)
          }

          // Buscar clientes - a API ja filtra automaticamente por role
          const clientsResponse = await fetch(`${API_URL}/clients`, { credentials: 'include' })
          let myClients: Client[] = []
          if (clientsResponse.ok) {
            myClients = await clientsResponse.json()
            setClients(myClients)
          }

          // Buscar relatorios dos parceiros - a API ja filtra automaticamente por role
          const reportsResponse = await fetch(`${API_URL}/partner_reports`, { credentials: 'include' })
          if (reportsResponse.ok) {
            const myReports = await reportsResponse.json()
            setPartnerReports(myReports)
          }

          // Calcular estatisticas
          const pendingProspects = myProspects.filter((p: Prospect) => p.status === 'pending' || p.status === 'in-analysis').length

          setDashboardData({
            totalPartners: myPartners.length,
            totalProspects: myProspects.length,
            totalClients: myClients.length,
            pendingProspects
          })
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    loadUserData()
  }, [])

  useEffect(() => {
    // Carregar produtos customizáveis
    const loadedProducts = productService.getActiveProducts()
    setProducts(loadedProducts)
  }, [])

  const getStageCount = (stage: string) => {
    return clients.filter(client => client.stage === stage).length
  }

  const getFilteredClients = () => {
    let filtered = clients
    
    if (stageFilter !== 'all') {
      filtered = filtered.filter(client => client.stage === stageFilter)
    }
    
    if (partnerFilter !== 'all') {
      filtered = filtered.filter(client => client.partnerId === partnerFilter)
    }
    
    return filtered
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' },
      'validated': { color: 'bg-blue-100 text-blue-800', text: 'Validado' },
      'in-analysis': { color: 'bg-purple-100 text-purple-800', text: 'Em Análise' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'Aprovado' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'Rejeitado' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', text: status }
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const validateProspect = async (prospect: Prospect) => {
    try {
      const validationData = {
        isValidated: true,
        validatedBy: currentUser?.name || 'Gerente',
        validatedAt: new Date().toISOString(),
        notes: 'Validado pelo gerente',
        isApproved: true
      }

      const updatedProspect = {
        ...prospect,
        status: 'validated' as const,
        managerValidation: validationData
      }

      // Usar endpoint de validação com campos corretos para o backend
      const response = await fetch(`${API_URL}/prospects/${prospect.id}/validate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          isApproved: true,
          validatedBy: currentUser?.name || 'Gerente',
          validationNotes: 'Validado pelo gerente',
          status: 'validated'
        })
      })

      if (response.ok) {
        setProspects(prev => prev.map(p =>
          p.id === prospect.id ? updatedProspect : p
        ))
        alert(`Indicação de ${prospect.companyName} validada com sucesso!`)
      } else {
        const errorData = await response.json()
        alert(`Erro: ${errorData.error || 'Falha ao validar indicação'}`)
      }
    } catch (error) {
      console.error('Erro ao validar prospect:', error)
      alert('Erro ao validar indicação. Tente novamente.')
    }
  }

  const rejectProspect = async (prospect: Prospect) => {
    const reason = prompt('Motivo da rejeição (opcional):') || 'Rejeitado pelo gerente'

    try {
      const validationData = {
        isValidated: true,
        validatedBy: currentUser?.name || 'Gerente',
        validatedAt: new Date().toISOString(),
        notes: reason,
        isApproved: false
      }

      const updatedProspect = {
        ...prospect,
        status: 'rejected' as const,
        managerValidation: validationData
      }

      // Usar endpoint de validação com campos corretos para o backend
      const response = await fetch(`${API_URL}/prospects/${prospect.id}/validate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          isApproved: false,
          validatedBy: currentUser?.name || 'Gerente',
          validationNotes: reason,
          status: 'rejected'
        })
      })

      if (response.ok) {
        setProspects(prev => prev.map(p =>
          p.id === prospect.id ? updatedProspect : p
        ))
        alert(`Indicação de ${prospect.companyName} rejeitada.`)
      } else {
        const errorData = await response.json()
        alert(`Erro: ${errorData.error || 'Falha ao rejeitar indicação'}`)
      }
    } catch (error) {
      console.error('Erro ao rejeitar prospect:', error)
      alert('Erro ao rejeitar indicação. Tente novamente.')
    }
  }

  const changeProspectStatus = async (prospect: Prospect, newStatus: Prospect['status']) => {
    try {
      const updatedProspect = {
        ...prospect,
        status: newStatus
      }

      const response = await fetch(`${API_URL}/prospects/${prospect.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updatedProspect)
      })

      if (response.ok) {
        setProspects(prev => prev.map(p =>
          p.id === prospect.id ? updatedProspect : p
        ))
        alert(`Status da indicação ${prospect.companyName} alterado para ${getStatusBadge(newStatus).props.children}.`)
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status. Tente novamente.')
    }
  }

  return (
    <div>
      {/* ChatBot Component */}
      <ChatBotHybrid products={products} />

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
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
                  {navigation.map((item) => (
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

          <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
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
                      {currentUser?.name || 'Gerente'}
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
            {currentView === 'profile' ? (
              <Profile onUserUpdate={setCurrentUser} />
            ) : currentView === 'partners' ? (
              <div>
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">Meus Parceiros</h1>
                    <p className="mt-2 text-sm text-gray-700">
                      Lista de parceiros sob sua gestão
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 flow-root">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Parceiro
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Empresa
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CNPJ
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contato
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {partners.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum parceiro vinculado</h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Ainda nao ha parceiros associados a voce. Entre em contato com o administrador para vincular parceiros.
                                  </p>
                                </td>
                              </tr>
                            ) : (
                              partners.map((partner) => (
                                <tr key={partner.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {partner.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {partner.company?.name || 'Nao informado'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {partner.company?.cnpj || 'Nao informado'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {partner.email}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentView === 'referrals' ? (
              <div>
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">Indicações dos Parceiros</h1>
                    <p className="mt-2 text-sm text-gray-700">
                      Acompanhe as indicações feitas pelos seus parceiros
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 flow-root">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Empresa
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contato
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Parceiro
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {prospects.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma indicacao encontrada</h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    {partners.length === 0
                                      ? 'Voce ainda nao possui parceiros vinculados. As indicacoes aparecerao aqui quando seus parceiros enviarem.'
                                      : 'Seus parceiros ainda nao enviaram indicacoes. As indicacoes aparecerao aqui quando forem submetidas.'
                                    }
                                  </p>
                                </td>
                              </tr>
                            ) : (
                              prospects.map((prospect) => {
                                const partner = partners.find(p => p.id === prospect.partnerId.toString())
                                return (
                                  <tr key={prospect.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {prospect.companyName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {prospect.contactName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {partner?.name || 'Nao encontrado'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex flex-col space-y-1">
                                        {getStatusBadge(prospect.status)}
                                        <select
                                          value={prospect.status}
                                          onChange={(e) => changeProspectStatus(prospect, e.target.value as Prospect['status'])}
                                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                                        >
                                          <option value="pending">Pendente</option>
                                          <option value="validated">Validado</option>
                                          <option value="in-analysis">Em Analise</option>
                                          <option value="approved">Aprovado</option>
                                          <option value="rejected">Rejeitado</option>
                                        </select>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex flex-col space-y-1">
                                        <span>{new Date(prospect.submittedAt).toLocaleDateString('pt-BR')}</span>
                                        {prospect.managerValidation?.validatedAt && (
                                          <span className="text-xs text-gray-400">
                                            Validado: {new Date(prospect.managerValidation.validatedAt).toLocaleDateString('pt-BR')}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex space-x-2">
                                        {prospect.status === 'pending' && (
                                          <>
                                            <button
                                              onClick={() => validateProspect(prospect)}
                                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                              title="Validar indicacao"
                                            >
                                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                                              Validar
                                            </button>
                                            <button
                                              onClick={() => rejectProspect(prospect)}
                                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                              title="Rejeitar indicacao"
                                            >
                                              <XCircleIcon className="h-4 w-4 mr-1" />
                                              Rejeitar
                                            </button>
                                          </>
                                        )}
                                        {prospect.status === 'validated' && (
                                          <span className="inline-flex items-center px-3 py-2 text-sm text-green-600">
                                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                                            Validado por {prospect.managerValidation?.validatedBy}
                                          </span>
                                        )}
                                        {prospect.status === 'rejected' && (
                                          <span className="inline-flex items-center px-3 py-2 text-sm text-red-600">
                                            <XCircleIcon className="h-4 w-4 mr-1" />
                                            Rejeitado por {prospect.managerValidation?.validatedBy}
                                          </span>
                                        )}
                                        {(prospect.status === 'in-analysis' || prospect.status === 'approved') && (
                                          <span className="inline-flex items-center px-3 py-2 text-sm text-blue-600">
                                            {prospect.status === 'in-analysis' ? 'Em analise' : 'Aprovado'}
                                          </span>
                                        )}
                                      </div>
                                      {prospect.managerValidation?.notes && (
                                        <div className="mt-1 text-xs text-gray-500">
                                          Obs: {prospect.managerValidation.notes}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentView === 'clients' ? (
              <div>
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold text-gray-900">Clientes dos Parceiros</h1>
                  <p className="mt-2 text-sm text-gray-700">
                    Acompanhe o funil de vendas dos clientes dos seus parceiros
                  </p>
                </div>

                {/* Filtros */}
                <div className="mb-6 flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Parceiro</label>
                    <select
                      value={partnerFilter}
                      onChange={(e) => setPartnerFilter(e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="all">Todos os Parceiros</option>
                      {partners.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Etapa</label>
                    <select
                      value={stageFilter}
                      onChange={(e) => setStageFilter(e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="all">Todas as Etapas</option>
                      <option value="prospeccao">Prospecção</option>
                      <option value="apresentacao">Apresentação</option>
                      <option value="negociacao">Negociação</option>
                      <option value="contrato_fechado">Contrato Fechado</option>
                      <option value="perdido">Perdido</option>
                    </select>
                  </div>
                </div>

                {/* Funil de Vendas e Tabela */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                        Detalhamento dos Clientes
                        {(stageFilter !== 'all' || partnerFilter !== 'all') && (
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            - Filtrado
                          </span>
                        )}
                      </h2>
                      <span className="text-sm text-gray-500">
                        {getFilteredClients().length} cliente(s)
                      </span>
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cliente
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Parceiro
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Etapa
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Temperatura
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getFilteredClients().map((client) => {
                            const partner = partners.find(p => p.id === client.partnerId)
                            
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {client.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {partner?.name || 'Não encontrado'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getStageBadge(client.stage)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getTemperatureBadge(client.temperature)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentView === 'reports' ? (
              <div>
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold text-gray-900">Relatórios dos Parceiros</h1>
                  <p className="mt-2 text-sm text-gray-700">
                    Visualize e gerencie os relatórios dos seus parceiros
                  </p>
                </div>

                {/* Filtros */}
                <div className="mb-6 flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Parceiro</label>
                    <select
                      value={partnerFilter}
                      onChange={(e) => setPartnerFilter(e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="all">Todos os Parceiros</option>
                      {partners.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tabela de Relatórios */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Relatórios Disponíveis
                      {partnerFilter !== 'all' && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          - Filtrado por {partners.find(p => p.id === partnerFilter)?.name}
                        </span>
                      )}
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Parceiro
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Arquivo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Período
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data de Upload
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {(() => {
                             // Filtrar relatórios por parceiro se necessário
                             const filteredReports = partnerFilter === 'all' 
                               ? partnerReports
                               : partnerReports.filter(report => report.partnerId?.toString() === partnerFilter)

                            const formatFileSize = (bytes: number) => {
                              if (bytes === 0) return '0 Bytes'
                              const k = 1024
                              const sizes = ['Bytes', 'KB', 'MB', 'GB']
                              const i = Math.floor(Math.log(bytes) / Math.log(k))
                              return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
                            }

                            const getStatusBadge = (status: string) => {
                              const statusConfig = {
                                'available': { color: 'bg-green-100 text-green-800', text: 'Disponível' },
                                'processing': { color: 'bg-yellow-100 text-yellow-800', text: 'Processando' },
                                'error': { color: 'bg-red-100 text-red-800', text: 'Erro' }
                              }
                              const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', text: status }
                              return (
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
                                  {config.text}
                                </span>
                              )
                            }

                            const handleDownloadReport = (reportId: string, fileName: string) => {
                              // Simular download do relatório
                              alert(`Download iniciado: ${fileName}`)
                            }

                            return filteredReports.map((report) => {
                              const partner = partners.find(p => p.id === report.partnerId)
                              return (
                                <tr key={report.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {partner?.name || 'Parceiro não encontrado'}
                                  </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <svg className="h-4 w-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{report.fileName}</div>
                                      <div className="text-xs text-gray-500">{formatFileSize(report.size)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {String(report.referenceMonth).padStart(2, '0')}/{report.referenceYear}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(report.uploadDate).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {report.fileType}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getStatusBadge(report.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {report.status === 'available' ? (
                                    <button
                                      onClick={() => handleDownloadReport(report.id, report.fileName)}
                                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Baixar
                                    </button>
                                  ) : (
                                    <span className="text-gray-400">Indisponível</span>
                                  )}
                                </td>
                              </tr>
                               )
                            })
                          })()
                          }
                        </tbody>
                      </table>
                    </div>

                    {(() => {
                      const partnerReports = [
                        { partnerId: partners[0]?.id || '' },
                        { partnerId: partners[1]?.id || '' },
                        { partnerId: partners[0]?.id || '' }
                      ]
                      const filteredReports = partnerFilter === 'all' 
                        ? partnerReports.filter(report => partners.some(p => p.id === report.partnerId))
                        : partnerReports.filter(report => report.partnerId === partnerFilter)
                      
                      return filteredReports.length === 0 && (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum relatório encontrado</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {partnerFilter === 'all' 
                              ? 'Não há relatórios disponíveis para seus parceiros.'
                              : `Não há relatórios disponíveis para ${partners.find(p => p.id === partnerFilter)?.name}.`
                            }
                          </p>
                        </div>
                      )
                    })()
                    }
                  </div>
                </div>
              </div>
            ) : currentView === 'admin' ? (
              <Admin />
            ) : (
              <div>
                {/* Dashboard Overview */}
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold text-gray-900">Dashboard do Gerente</h1>
                  <p className="mt-2 text-sm text-gray-700">
                    Visão geral dos seus parceiros e indicações
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UsersIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Parceiros</dt>
                            <dd className="text-lg font-medium text-gray-900">{dashboardData.totalPartners}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UserPlusIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Indicações</dt>
                            <dd className="text-lg font-medium text-gray-900">{dashboardData.totalProspects}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <FolderIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Clientes</dt>
                            <dd className="text-lg font-medium text-gray-900">{dashboardData.totalClients}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ChartBarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Pendentes</dt>
                            <dd className="text-lg font-medium text-gray-900">{dashboardData.pendingProspects}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Atividade Recente</h2>
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul role="list" className="divide-y divide-gray-200">
                      {prospects.slice(0, 5).map((prospect) => {
                        const partner = partners.find(p => p.id === prospect.partnerId.toString())
                        return (
                          <li key={prospect.id}>
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <UserPlusIcon className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">
                                      Nova indicação: {prospect.companyName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Por {partner?.name} • {new Date(prospect.submittedAt).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  {getStatusBadge(prospect.status)}
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
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