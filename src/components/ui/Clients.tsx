import { useState, useEffect } from 'react'
import { UsersIcon, PencilIcon, CheckIcon, XMarkIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { getCurrentUser } from '../../services/auth'
import { API_URL } from '../../config/api'
import { fetchWithAuth } from '../../services/api/fetch-with-auth'

interface Client {
  id: number
  name: string
  cnpj: string
  status: string
  contractEndDate?: string
  totalLives?: number
  stage?: string
  temperature?: string
  lastUpdated?: string
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/clients`)
        
        if (!response.ok) {
          setClients([])
          return
        }
        
        const clientsData = await response.json()
        
        // Garantir que sempre seja um array
        const clientsArray = Array.isArray(clientsData) ? clientsData : (clientsData?.data && Array.isArray(clientsData.data) ? clientsData.data : [])
        setClients(clientsArray)
      } catch (error) {
        console.error('Error fetching clients:', error)
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    const checkUserRole = async () => {
      try {
        const user = await getCurrentUser()
        setIsAdmin(user?.role === 'admin')
        setIsManager(user?.role === 'manager')
      } catch (error) {
        console.error('Error checking user role:', error)
        setIsAdmin(false)
        setIsManager(false)
      }
    }

    fetchClients()
    checkUserRole()
  }, [])

  const updateClient = async (clientId: number, updates: Partial<Client>) => {
    setUpdating(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          lastUpdated: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const updatedClient = await response.json()
        setClients(prev => prev.map(client => 
          client.id === clientId ? updatedClient : client
        ))
      }
    } catch (error) {
      console.error('Error updating client:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient({ ...client })
    setIsEditModalOpen(true)
  }

  const handleSaveClient = async () => {
    if (!editingClient) return
    
    await updateClient(editingClient.id, {
      status: editingClient.status,
      stage: editingClient.stage,
      temperature: editingClient.temperature,
      contractEndDate: editingClient.contractEndDate,
      totalLives: editingClient.totalLives
    })
    
    setIsEditModalOpen(false)
    setEditingClient(null)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Ativo' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' },
      inactive: { color: 'bg-red-100 text-red-800', text: 'Inativo' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getStageBadge = (stage: string) => {
    const stageConfig = {
      prospeccao: { color: 'bg-blue-100 text-blue-800', text: 'Prospecção' },
      apresentacao: { color: 'bg-indigo-100 text-indigo-800', text: 'Apresentação' },
      negociacao: { color: 'bg-yellow-100 text-yellow-800', text: 'Negociação' },
      contrato_fechado: { color: 'bg-green-100 text-green-800', text: 'Contrato Fechado' },
      perdido: { color: 'bg-red-100 text-red-800', text: 'Perdido' }
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
      frio: { color: 'bg-blue-100 text-blue-800', text: '🧊 Frio', icon: '❄️' },
      morno: { color: 'bg-yellow-100 text-yellow-800', text: '🌤️ Morno', icon: '🌤️' },
      quente: { color: 'bg-red-100 text-red-800', text: '🔥 Quente', icon: '🔥' }
    }
    
    const config = tempConfig[temperature as keyof typeof tempConfig] || { color: 'bg-gray-100 text-gray-800', text: temperature || 'N/A', icon: '❓' }
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
        {config.icon} {config.text.split(' ')[1]}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const kanbanStages = [
    { id: 'prospeccao', title: 'Prospecção', color: 'bg-blue-100 border-blue-300' },
    { id: 'apresentacao', title: 'Apresentação', color: 'bg-indigo-100 border-indigo-300' },
    { id: 'negociacao', title: 'Negociação', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'contrato_fechado', title: 'Contrato Fechado', color: 'bg-green-100 border-green-300' },
    { id: 'perdido', title: 'Perdido', color: 'bg-red-100 border-red-300' }
  ]

  const getClientsByStage = (stage: string) => {
    return clients.filter(client => client.stage === stage || (!client.stage && stage === 'prospeccao'))
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Clientes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de todos os clientes cadastrados no sistema.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="mt-4 sm:mt-0 flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ListBulletIcon className="h-5 w-5" />
            <span className="font-medium">Lista</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Squares2X2Icon className="h-5 w-5" />
            <span className="font-medium">Kanban</span>
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <UsersIcon className="h-5 w-5 mr-2" />
                        Nome do Cliente
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Etapa
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temperatura
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contrato Ativo Até
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total de Vidas
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{client.cnpj}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStageBadge(client.stage || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTemperatureBadge(client.temperature || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client.contractEndDate ? formatDate(client.contractEndDate) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.totalLives?.toLocaleString('pt-BR') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isAdmin && (
                          <button 
                            onClick={() => handleEditClient(client)}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                            disabled={updating}
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="mt-8">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanStages.map(stage => (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <div className={`rounded-lg border-2 ${stage.color} p-4`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{stage.title}</h3>
                    <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-full">
                      {getClientsByStage(stage.id).length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {getClientsByStage(stage.id).map(client => (
                      <div
                        key={client.id}
                        className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleEditClient(client)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{client.name}</h4>
                          {client.temperature && getTemperatureBadge(client.temperature)}
                        </div>

                        <p className="text-xs text-gray-600 mb-2">
                          CNPJ: {client.cnpj}
                        </p>

                        <div className="flex items-center justify-between">
                          {getStatusBadge(client.status)}

                          {client.totalLives && (
                            <span className="text-xs text-gray-600">
                              {client.totalLives} vidas
                            </span>
                          )}
                        </div>

                        {client.contractEndDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Contrato: {formatDate(client.contractEndDate)}
                          </p>
                        )}

                        {(isAdmin || isManager) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClient(client)
                            }}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
                          >
                            <PencilIcon className="h-3 w-3" />
                            Editar
                          </button>
                        )}
                      </div>
                    ))}

                    {getClientsByStage(stage.id).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">Nenhum cliente</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {clients.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum cliente encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Não há clientes cadastrados no sistema.</p>
        </div>
      )}

      {/* Modal de Edição */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsEditModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    Editar Cliente: {editingClient?.name}
                  </Dialog.Title>
                  
                  {editingClient && (
                    <div className="space-y-4">
                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={editingClient.status}
                          onChange={(e) => setEditingClient({...editingClient, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="active">Ativo</option>
                          <option value="pending">Pendente</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </div>

                      {/* Etapa */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Etapa
                        </label>
                        <select
                          value={editingClient.stage || ''}
                          onChange={(e) => setEditingClient({...editingClient, stage: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Selecione uma etapa</option>
                          <option value="prospeccao">Prospecção</option>
                          <option value="apresentacao">Apresentação</option>
                          <option value="negociacao">Negociação</option>
                          {(isAdmin || isManager) && (
                            <option value="contrato_fechado">Contrato Fechado</option>
                          )}
                          <option value="perdido">Perdido</option>
                        </select>
                      </div>

                      {/* Temperatura */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temperatura
                        </label>
                        <select
                          value={editingClient.temperature || ''}
                          onChange={(e) => setEditingClient({...editingClient, temperature: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Selecione uma temperatura</option>
                          <option value="frio">❄️ Frio</option>
                          <option value="morno">🌤️ Morno</option>
                          <option value="quente">🔥 Quente</option>
                        </select>
                      </div>

                      {/* Contrato Ativo Até */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contrato Ativo Até
                        </label>
                        <input
                          type="date"
                          value={editingClient.contractEndDate || ''}
                          onChange={(e) => setEditingClient({...editingClient, contractEndDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      {/* Total de Vidas */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total de Vidas
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editingClient.totalLives || ''}
                          onChange={(e) => setEditingClient({...editingClient, totalLives: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Digite o número de vidas"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsEditModalOpen(false)}
                      disabled={updating}
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                      onClick={handleSaveClient}
                      disabled={updating}
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}