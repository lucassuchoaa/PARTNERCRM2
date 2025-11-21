import { useState, useEffect } from 'react'
import { CurrencyDollarIcon, UsersIcon, CheckIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline'
import { API_URL } from '../../config/api'
import { fetchWithAuth } from '../../services/api/fetch-with-auth'

interface PricingPlan {
  id: string
  name: string
  description: string
  basePrice: number
  includedUsers: number
  additionalUserPrice: number
  features: string[]
  isActive: boolean
  order: number
}

export default function PricingManagement() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/pricing-plans`)
      if (response.ok) {
        const result = await response.json()
        const plansData = result.success ? result.data : (Array.isArray(result) ? result : [])
        const plansArray = Array.isArray(plansData) ? plansData : []
        
        const formattedPlans = plansArray.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          basePrice: parseFloat(plan.base_price || plan.basePrice || 0),
          includedUsers: parseInt(plan.included_users || plan.includedUsers || 0),
          additionalUserPrice: parseFloat(plan.additional_user_price || plan.additionalUserPrice || 0),
          features: plan.features || [],
          isActive: plan.is_active !== undefined ? plan.is_active : plan.isActive,
          order: plan.order || 0
        }))
        
        setPlans(formattedPlans.sort((a: PricingPlan, b: PricingPlan) => a.order - b.order))
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan({ ...plan })
    setIsEditModalOpen(true)
  }

  const handleSavePlan = async () => {
    if (!editingPlan) return

    setSaving(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/pricing-plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPlan)
      })

      if (response.ok) {
        await fetchPlans()
        setIsEditModalOpen(false)
        setEditingPlan(null)
        alert('Plano atualizado com sucesso!')
      } else {
        const errorData = await response.json().catch(() => null)
        alert(errorData?.error || 'Erro ao atualizar plano')
      }
    } catch (error) {
      console.error('Error updating pricing plan:', error)
      alert('Erro ao atualizar plano')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciamento de Preços</h2>
        <p className="text-sm text-gray-600">
          Configure os valores dos planos, quantidade de usuários inclusos e preços de licenças avulsas.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg shadow-md border-2 transition-all ${
              plan.isActive
                ? 'border-indigo-500 bg-white'
                : 'border-gray-200 bg-gray-50 opacity-75'
            }`}
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  plan.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {plan.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="p-6">
              {/* Plan Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              {/* Pricing Info */}
              <div className="space-y-4 mb-6">
                {/* Base Price */}
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Valor Base</span>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">
                    {formatCurrency(plan.basePrice)}
                  </span>
                </div>

                {/* Included Users */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Usuários Inclusos</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {plan.includedUsers}
                  </span>
                </div>

                {/* Additional User Price */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Licença Avulsa</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(plan.additionalUserPrice)}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Recursos Inclusos:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => handleEditPlan(plan)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                Editar Plano
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsEditModalOpen(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Editar Plano: {editingPlan.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure os valores e características do plano.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Base Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Base (Mensal)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingPlan.basePrice}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            basePrice: parseFloat(e.target.value) || 0
                          })
                        }
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Included Users */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade de Usuários Inclusos
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingPlan.includedUsers}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          includedUsers: parseInt(e.target.value) || 1
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Additional User Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço por Licença Avulsa (Mensal)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingPlan.additionalUserPrice}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            additionalUserPrice: parseFloat(e.target.value) || 0
                          })
                        }
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição do Plano
                    </label>
                    <textarea
                      rows={2}
                      value={editingPlan.description}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          description: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingPlan.isActive}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          isActive: e.target.checked
                        })
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Plano Ativo (visível para clientes)
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={saving}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePlan}
                    disabled={saving}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
