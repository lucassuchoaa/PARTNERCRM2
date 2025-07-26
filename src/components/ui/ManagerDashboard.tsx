import { useState, useEffect } from 'react'
import { Dialog, Menu } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, FolderIcon, HomeIcon, UsersIcon, BookOpenIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid'
import { getCurrentUser } from '../../services/auth'
import Profile from './Profile'

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
  status: string
  submittedAt: string
  viabilityScore?: number
  partnerId: string
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
  { name: 'Meus Parceiros', href: '#', icon: UsersIcon, current: false, view: 'partners' },
  { name: 'Indicações', href: '#', icon: UserPlusIcon, current: false, view: 'referrals' },
  { name: 'Relatórios', href: '#', icon: ChartBarIcon, current: false, view: 'reports' },
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
  const [dashboardData, setDashboardData] = useState({
    totalPartners: 0,
    totalProspects: 0,
    totalClients: 0,
    pendingProspects: 0
  })

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setCurrentUser(user)
          
          // Buscar dados do gerente
          const managerResponse = await fetch(`http://localhost:3001/managers/${user.id}`)
          if (managerResponse.ok) {
            const managerData = await managerResponse.json()
            
            // Buscar parceiros vinculados ao gerente
            const partnersResponse = await fetch('http://localhost:3001/partners')
            if (partnersResponse.ok) {
              const allPartners = await partnersResponse.json()
              const myPartners = allPartners.filter((partner: Partner) => 
                managerData.partnersIds.includes(partner.id)
              )
              setPartners(myPartners)
              
              // Buscar prospects dos parceiros
              const prospectsResponse = await fetch('http://localhost:3001/prospects')
              let myProspects: Prospect[] = []
              if (prospectsResponse.ok) {
                const allProspects = await prospectsResponse.json()
                myProspects = allProspects.filter((prospect: Prospect) => 
                  managerData.partnersIds.includes(prospect.partnerId.toString())
                )
                setProspects(myProspects)
              }
              
              // Buscar clientes dos parceiros
              const clientsResponse = await fetch('http://localhost:3001/clients')
              let myClients: Client[] = []
              if (clientsResponse.ok) {
                const allClients = await clientsResponse.json()
                myClients = allClients.filter((client: Client) => 
                  client.partnerId && managerData.partnersIds.includes(client.partnerId.toString())
                )
                setClients(myClients)
              }
              
              // Calcular estatísticas
              const pendingProspects = myProspects.filter((p: Prospect) => p.status === 'pending' || p.status === 'in-analysis').length
              
              setDashboardData({
                totalPartners: myPartners.length,
                totalProspects: myProspects.length,
                totalClients: myClients.length,
                pendingProspects
              })
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    loadUserData()
  }, [])

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

  return (
    <div>
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
            {currentView === 'profile' ? (
              <Profile />
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
                            {partners.map((partner) => (
                              <tr key={partner.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {partner.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {partner.company?.name || 'Não informado'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {partner.company?.cnpj || 'Não informado'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {partner.email}
                                </td>
                              </tr>
                            ))}
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
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {prospects.map((prospect) => {
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
                                    {partner?.name || 'Não encontrado'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(prospect.status)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(prospect.submittedAt).toLocaleDateString('pt-BR')}
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
              </div>
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