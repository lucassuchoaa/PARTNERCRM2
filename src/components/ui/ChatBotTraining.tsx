import React, { useState, useEffect } from 'react'
import {
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface FlowOption {
  id: string
  text: string
  targetFlow?: string
  response?: string
}

interface Flow {
  id: string
  name: string
  title: string
  emoji: string
  message: string
  options: FlowOption[]
}

const ChatBotTraining: React.FC = () => {
  const [flows, setFlows] = useState<Flow[]>([
    {
      id: 'initial',
      name: 'Menu Inicial',
      emoji: '📋',
      title: 'Bem-vindo!',
      message: 'Como posso ajudá-lo?',
      options: [
        { id: 'opt1', text: 'Tirar dúvidas', targetFlow: 'faq' },
        { id: 'opt2', text: 'Pitch de vendas', targetFlow: 'pitch' },
        { id: 'opt3', text: 'Informações gerais', targetFlow: 'info' },
        { id: 'opt4', text: '🤖 Modo IA', targetFlow: 'ai_mode' }
      ]
    },
    {
      id: 'faq',
      name: 'Dúvidas Frequentes',
      emoji: '❓',
      title: 'Tirar Dúvidas',
      message: 'Escolha sua dúvida:',
      options: [
        {
          id: 'opt1',
          text: 'Como usar a plataforma',
          response: 'Para usar a plataforma:\n1. Faça login\n2. Navegue pelo menu\n3. Adicione indicações'
        },
        {
          id: 'opt2',
          text: 'Comissões',
          response: '💰 Comissões são pagas todo dia 5\nConsulte o saldo na aba Comissões'
        },
        {
          id: 'opt3',
          text: 'Indicações',
          response: 'Para fazer indicações:\n1. Vá em Indicações\n2. Preencha o formulário\n3. Envie!'
        },
        { id: 'opt4', text: 'Menu inicial', targetFlow: 'initial' }
      ]
    },
    {
      id: 'pitch',
      name: 'Pitches de Venda',
      emoji: '🎯',
      title: 'Pitch de Vendas',
      message: 'Escolha o produto para ver o pitch:',
      options: [
        {
          id: 'opt1',
          text: 'Somapay',
          response: '🎯 Pitch Somapay\n\nSolução completa de gestão de folha de pagamento.'
        },
        { id: 'opt2', text: '🤖 Gerar com IA' },
        { id: 'opt3', text: 'Menu inicial', targetFlow: 'initial' }
      ]
    },
    {
      id: 'info',
      name: 'Informações Gerais',
      emoji: 'ℹ️',
      title: 'Informações',
      message: 'Escolha o tópico:',
      options: [
        {
          id: 'opt1',
          text: 'Sobre a Somapay',
          response: 'A Somapay é líder em soluções de RH e folha de pagamento.'
        },
        {
          id: 'opt2',
          text: 'Contatos',
          response: '📧 contato@somapay.com\n📞 (11) 1234-5678'
        },
        { id: 'opt3', text: 'Menu inicial', targetFlow: 'initial' }
      ]
    }
  ])

  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(flows[0])
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null)
  const [editingOption, setEditingOption] = useState<{ flowId: string; option: FlowOption } | null>(null)
  const [showAddFlowModal, setShowAddFlowModal] = useState(false)
  const [showAddOptionModal, setShowAddOptionModal] = useState(false)

  // Salvar configuração no localStorage
  const saveConfiguration = () => {
    localStorage.setItem('chatbot_flows', JSON.stringify(flows))
    alert('✅ Configuração salva! Para aplicar as mudanças, você precisa reiniciar o servidor.')
  }

  // Carregar configuração salva
  useEffect(() => {
    const saved = localStorage.getItem('chatbot_flows')
    if (saved) {
      try {
        setFlows(JSON.parse(saved))
      } catch (e) {
        console.error('Erro ao carregar configuração', e)
      }
    }
  }, [])

  const addFlow = (newFlow: Flow) => {
    setFlows([...flows, newFlow])
    setShowAddFlowModal(false)
  }

  const deleteFlow = (flowId: string) => {
    if (flowId === 'initial') {
      alert('❌ Não é possível deletar o menu inicial!')
      return
    }
    if (confirm('Tem certeza que deseja deletar este fluxo?')) {
      setFlows(flows.filter(f => f.id !== flowId))
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(flows[0])
      }
    }
  }

  const updateFlow = (flowId: string, updates: Partial<Flow>) => {
    setFlows(flows.map(f => f.id === flowId ? { ...f, ...updates } : f))
    setEditingFlow(null)
  }

  const addOption = (flowId: string, option: FlowOption) => {
    setFlows(flows.map(f =>
      f.id === flowId
        ? { ...f, options: [...f.options, { ...option, id: `opt${f.options.length + 1}` }] }
        : f
    ))
    setShowAddOptionModal(false)
  }

  const updateOption = (flowId: string, optionId: string, updates: Partial<FlowOption>) => {
    setFlows(flows.map(f =>
      f.id === flowId
        ? {
            ...f,
            options: f.options.map(opt =>
              opt.id === optionId ? { ...opt, ...updates } : opt
            )
          }
        : f
    ))
    setEditingOption(null)
  }

  const deleteOption = (flowId: string, optionId: string) => {
    if (confirm('Tem certeza que deseja deletar esta opção?')) {
      setFlows(flows.map(f =>
        f.id === flowId
          ? { ...f, options: f.options.filter(opt => opt.id !== optionId) }
          : f
      ))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <AcademicCapIcon className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Editor Visual do ChatBot</h2>
            </div>
            <p className="text-indigo-100">
              Configure a árvore de decisão sem programar - arraste, clique e edite!
            </p>
          </div>
          <button
            onClick={saveConfiguration}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <CheckIcon className="h-5 w-5" />
            Salvar Alterações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Fluxos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Fluxos do ChatBot</h3>
            <button
              onClick={() => setShowAddFlowModal(true)}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            {flows.map(flow => (
              <div
                key={flow.id}
                onClick={() => setSelectedFlow(flow)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedFlow?.id === flow.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{flow.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{flow.name}</p>
                      <p className="text-xs text-gray-500">ID: {flow.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingFlow(flow)
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {flow.id !== 'initial' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteFlow(flow.id)
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">{flow.options.length} opções</p>
              </div>
            ))}
          </div>
        </div>

        {/* Editor de Fluxo Selecionado */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {selectedFlow ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedFlow.emoji}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{selectedFlow.name}</h3>
                    <p className="text-sm text-gray-500">Edite as mensagens e opções abaixo</p>
                  </div>
                </div>
              </div>

              {/* Preview do ChatBot */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">📱 Preview:</p>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-indigo-600 rounded-full p-2">
                      <span className="text-white text-xl">🤖</span>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 max-w-md">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedFlow.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFlow.options.map(opt => (
                      <button
                        key={opt.id}
                        className="bg-white border-2 border-indigo-300 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50"
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor de Mensagem */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensagem do Bot:
                </label>
                <textarea
                  value={selectedFlow.message}
                  onChange={(e) => updateFlow(selectedFlow.id, { message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="Digite a mensagem que o bot irá mostrar..."
                />
              </div>

              {/* Lista de Opções */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Opções de Resposta:
                  </label>
                  <button
                    onClick={() => setShowAddOptionModal(true)}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Adicionar Opção
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedFlow.options.map(option => (
                    <div
                      key={option.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{option.text}</p>
                          {option.targetFlow && (
                            <p className="text-xs text-blue-600 mt-1">
                              ↪️ Vai para: {flows.find(f => f.id === option.targetFlow)?.name || option.targetFlow}
                            </p>
                          )}
                          {option.response && (
                            <p className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">
                              {option.response}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => setEditingOption({ flowId: selectedFlow.id, option })}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteOption(selectedFlow.id, option.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Selecione um fluxo para editar</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Adicionar Novo Fluxo */}
      {showAddFlowModal && (
        <AddFlowModal
          onSave={addFlow}
          onCancel={() => setShowAddFlowModal(false)}
        />
      )}

      {/* Modal: Editar Fluxo */}
      {editingFlow && (
        <EditFlowModal
          flow={editingFlow}
          onSave={(updates) => updateFlow(editingFlow.id, updates)}
          onCancel={() => setEditingFlow(null)}
        />
      )}

      {/* Modal: Adicionar Opção */}
      {showAddOptionModal && selectedFlow && (
        <AddOptionModal
          flows={flows}
          onSave={(option) => addOption(selectedFlow.id, option)}
          onCancel={() => setShowAddOptionModal(false)}
        />
      )}

      {/* Modal: Editar Opção */}
      {editingOption && (
        <EditOptionModal
          option={editingOption.option}
          flows={flows}
          onSave={(updates) => updateOption(editingOption.flowId, editingOption.option.id, updates)}
          onCancel={() => setEditingOption(null)}
        />
      )}

      {/* Informações Importantes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Importante:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Clique em <strong>"Salvar Alterações"</strong> para guardar sua configuração</li>
          <li>• As mudanças serão aplicadas automaticamente no ChatBot</li>
          <li>• Sempre teste o ChatBot após fazer alterações (botão 💬 no canto da tela)</li>
          <li>• O backup da configuração fica salvo no navegador</li>
        </ul>
      </div>
    </div>
  )
}

// Modal: Adicionar Novo Fluxo
const AddFlowModal: React.FC<{ onSave: (flow: Flow) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    emoji: '📋',
    title: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id || !formData.name || !formData.message) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }
    onSave({
      ...formData,
      options: [{ id: 'opt1', text: 'Menu inicial', targetFlow: 'initial' }]
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Adicionar Novo Fluxo</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID do Fluxo *</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="exemplo: vendas_dicas"
            />
            <p className="text-xs text-gray-500 mt-1">Use apenas letras, números e _ (underscore)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Fluxo *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Dicas de Vendas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
            <input
              type="text"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="💡"
              maxLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem do Bot *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Escolha uma opção:"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Criar Fluxo
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal: Editar Fluxo
const EditFlowModal: React.FC<{ flow: Flow; onSave: (updates: Partial<Flow>) => void; onCancel: () => void }> = ({ flow, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: flow.name,
    emoji: flow.emoji,
    message: flow.message
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Editar Fluxo</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Fluxo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
            <input
              type="text"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              maxLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem do Bot</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal: Adicionar Opção
const AddOptionModal: React.FC<{
  flows: Flow[];
  onSave: (option: FlowOption) => void;
  onCancel: () => void
}> = ({ flows, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    text: '',
    type: 'redirect' as 'redirect' | 'response',
    targetFlow: '',
    response: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.text) {
      alert('Digite o texto do botão!')
      return
    }
    if (formData.type === 'redirect' && !formData.targetFlow) {
      alert('Selecione o fluxo de destino!')
      return
    }
    if (formData.type === 'response' && !formData.response) {
      alert('Digite a resposta do bot!')
      return
    }

    const option: FlowOption = {
      id: '', // será gerado
      text: formData.text,
      ...(formData.type === 'redirect' ? { targetFlow: formData.targetFlow } : { response: formData.response })
    }

    onSave(option)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Adicionar Opção</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Botão *</label>
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Como usar a plataforma"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ação *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="response">Mostrar Resposta</option>
              <option value="redirect">Ir para Outro Fluxo</option>
            </select>
          </div>

          {formData.type === 'redirect' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fluxo de Destino *</label>
              <select
                value={formData.targetFlow}
                onChange={(e) => setFormData({ ...formData, targetFlow: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione...</option>
                {flows.map(flow => (
                  <option key={flow.id} value={flow.id}>{flow.emoji} {flow.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.type === 'response' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resposta do Bot *</label>
              <textarea
                value={formData.response}
                onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Digite a resposta que o bot deve dar..."
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal: Editar Opção
const EditOptionModal: React.FC<{
  option: FlowOption;
  flows: Flow[];
  onSave: (updates: Partial<FlowOption>) => void;
  onCancel: () => void
}> = ({ option, flows, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    text: option.text,
    type: (option.targetFlow ? 'redirect' : 'response') as 'redirect' | 'response',
    targetFlow: option.targetFlow || '',
    response: option.response || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updates: Partial<FlowOption> = {
      text: formData.text,
      ...(formData.type === 'redirect'
        ? { targetFlow: formData.targetFlow, response: undefined }
        : { response: formData.response, targetFlow: undefined }
      )
    }
    onSave(updates)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Editar Opção</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Botão</label>
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ação</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="response">Mostrar Resposta</option>
              <option value="redirect">Ir para Outro Fluxo</option>
            </select>
          </div>

          {formData.type === 'redirect' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fluxo de Destino</label>
              <select
                value={formData.targetFlow}
                onChange={(e) => setFormData({ ...formData, targetFlow: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione...</option>
                {flows.map(flow => (
                  <option key={flow.id} value={flow.id}>{flow.emoji} {flow.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.type === 'response' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resposta do Bot</label>
              <textarea
                value={formData.response}
                onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={4}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatBotTraining
