import { useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { fetchWithAuth } from '../../services/api/fetch-with-auth'
import { API_URL } from '../../config/api'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  is_system: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Permission {
  key: string
  label: string
  category: string
}

interface GroupedPermissions {
  [category: string]: Permission[]
}

const CATEGORY_LABELS: { [key: string]: string } = {
  dashboard: 'Dashboard',
  clients: 'Clientes',
  referrals: 'Indicacoes',
  reports: 'Relatorios',
  support: 'Material de Apoio',
  admin: 'Administracao',
  commissions: 'Comissoes',
  chatbot: 'ChatBot'
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  })

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    try {
      console.log('[RoleManagement] Buscando roles em:', `${API_URL}/roles`)
      const response = await fetchWithAuth(`${API_URL}/roles`)
      console.log('[RoleManagement] Response status:', response.status)
      const data = await response.json()
      console.log('[RoleManagement] Data recebida:', data)
      if (data.success) {
        console.log('[RoleManagement] Total de roles:', data.data?.length)
        setRoles(data.data)
      } else {
        console.error('[RoleManagement] API retornou success=false:', data)
        setError(data.error || 'Erro ao carregar funcoes')
      }
    } catch (error) {
      console.error('[RoleManagement] Erro ao buscar funcoes:', error)
      setError('Erro ao carregar funcoes')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/roles/permissions`)
      const data = await response.json()
      if (data.success) {
        setPermissions(data.data.permissions)
        setGroupedPermissions(data.data.grouped)
      }
    } catch (error) {
      console.error('Erro ao buscar permissoes:', error)
    }
  }

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      const perms = typeof role.permissions === 'string'
        ? JSON.parse(role.permissions)
        : role.permissions
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: perms || [],
        isActive: role.is_active
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        description: '',
        permissions: [],
        isActive: true
      })
    }
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRole(null)
    setFormData({
      name: '',
      description: '',
      permissions: [],
      isActive: true
    })
  }

  const handleTogglePermission = (permKey: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter(p => p !== permKey)
        : [...prev.permissions, permKey]
    }))
  }

  const handleToggleCategory = (category: string) => {
    const categoryPerms = groupedPermissions[category]?.map(p => p.key) || []
    const allSelected = categoryPerms.every(p => formData.permissions.includes(p))

    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPerms.includes(p))
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPerms])]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim()) {
      setError('Nome da funcao e obrigatorio')
      return
    }

    try {
      const url = editingRole
        ? `${API_URL}/roles/${editingRole.id}`
        : `${API_URL}/roles`

      const method = editingRole ? 'PUT' : 'POST'

      console.log('[RoleManagement] Salvando funcao...')
      console.log('[RoleManagement] URL:', url)
      console.log('[RoleManagement] Method:', method)
      console.log('[RoleManagement] Form data:', formData)

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      console.log('[RoleManagement] Response status:', response.status)
      const data = await response.json()
      console.log('[RoleManagement] Response data:', data)

      if (data.success) {
        setSuccess(editingRole ? 'Funcao atualizada com sucesso!' : 'Funcao criada com sucesso!')
        fetchRoles()
        setTimeout(() => {
          handleCloseModal()
        }, 1500)
      } else {
        console.error('[RoleManagement] Erro do servidor:', data.error)
        setError(data.error || 'Erro ao salvar funcao')
      }
    } catch (error) {
      console.error('[RoleManagement] Erro ao salvar funcao:', error)
      setError('Erro ao salvar funcao')
    }
  }

  const handleDelete = async (roleId: string) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/roles/${roleId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Funcao excluida com sucesso!')
        fetchRoles()
        setDeleteConfirm(null)
      } else {
        setError(data.error || 'Erro ao excluir funcao')
      }
    } catch (error) {
      console.error('Erro ao excluir funcao:', error)
      setError('Erro ao excluir funcao')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gerenciamento de Funcoes</h2>
          <p className="mt-1 text-sm text-gray-700">
            Crie e gerencie as funcoes e permissoes dos usuarios do sistema.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Nova Funcao
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => {
          const perms = typeof role.permissions === 'string'
            ? JSON.parse(role.permissions)
            : role.permissions

          return (
            <div
              key={role.id}
              className={`bg-white rounded-lg shadow-sm border p-6 ${
                !role.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${
                    role.is_system ? 'bg-purple-100' : 'bg-indigo-100'
                  }`}>
                    <ShieldCheckIcon className={`h-6 w-6 ${
                      role.is_system ? 'text-purple-600' : 'text-indigo-600'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{role.name}</h3>
                    {role.is_system && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Sistema
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenModal(role)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                    title="Editar"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  {!role.is_system && (
                    <button
                      onClick={() => setDeleteConfirm(role.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Excluir"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {role.description && (
                <p className="mt-3 text-sm text-gray-500">{role.description}</p>
              )}

              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Permissoes ({perms?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1">
                  {perms?.slice(0, 5).map((perm: string) => (
                    <span
                      key={perm}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {perm.split('.')[1]}
                    </span>
                  ))}
                  {perms?.length > 5 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                      +{perms.length - 5} mais
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Status: {role.is_active ? 'Ativo' : 'Inativo'}</span>
                  <span>
                    {new Date(role.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === role.id && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800 mb-3">
                    Tem certeza que deseja excluir esta funcao?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma funcao encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece criando uma nova funcao para o sistema.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nova Funcao
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingRole ? 'Editar Funcao' : 'Nova Funcao'}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 rounded-md">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 p-3 bg-green-50 rounded-md">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome da Funcao *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={editingRole?.is_system}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                        placeholder="Ex: Gerente de Parceiros"
                      />
                      {editingRole?.is_system && (
                        <p className="mt-1 text-xs text-gray-500">
                          Funcoes do sistema nao podem ter o nome alterado
                        </p>
                      )}
                    </div>

                    {/* Descricao */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Descricao
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Descricao da funcao..."
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Funcao ativa
                      </label>
                    </div>

                    {/* Permissoes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Permissoes
                      </label>
                      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                        {Object.entries(groupedPermissions).map(([category, perms]) => {
                          const categoryPerms = perms.map(p => p.key)
                          const allSelected = categoryPerms.every(p => formData.permissions.includes(p))
                          const someSelected = categoryPerms.some(p => formData.permissions.includes(p))

                          return (
                            <div key={category} className="border-b border-gray-200 last:border-b-0">
                              <div
                                className="flex items-center px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleToggleCategory(category)}
                              >
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  ref={input => {
                                    if (input) {
                                      input.indeterminate = someSelected && !allSelected
                                    }
                                  }}
                                  onChange={() => handleToggleCategory(category)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-900">
                                  {CATEGORY_LABELS[category] || category}
                                </span>
                                <span className="ml-auto text-xs text-gray-500">
                                  {categoryPerms.filter(p => formData.permissions.includes(p)).length}/{categoryPerms.length}
                                </span>
                              </div>
                              <div className="px-4 py-2 space-y-2">
                                {perms.map(perm => (
                                  <div key={perm.key} className="flex items-center ml-6">
                                    <input
                                      type="checkbox"
                                      id={perm.key}
                                      checked={formData.permissions.includes(perm.key)}
                                      onChange={() => handleTogglePermission(perm.key)}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={perm.key} className="ml-2 text-sm text-gray-700">
                                      {perm.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {formData.permissions.length} permissao(oes) selecionada(s)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingRole ? 'Salvar Alteracoes' : 'Criar Funcao'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
