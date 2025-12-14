import { useState, useEffect } from 'react'
import { getCurrentUser } from '../../services/auth'
import { UserIcon, BuildingOfficeIcon, CreditCardIcon, BanknotesIcon, CameraIcon } from '@heroicons/react/24/outline'
import { API_URL } from '../../config/api'

interface Partner {
  id: string | number
  name: string
  email: string
  role: string
  profilePhoto?: string
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

interface ProfileProps {
  onUserUpdate?: (user: any) => void
}

export default function Profile({ onUserUpdate }: ProfileProps) {
  const [currentUser, setCurrentUser] = useState<Partner | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [formData, setFormData] = useState<Partner>({
    id: '',
    name: '',
    email: '',
    role: '',
    company: {
      name: '',
      cnpj: '',
      address: '',
      phone: ''
    },
    bankData: {
      bank: '',
      agency: '',
      account: '',
      accountType: 'corrente',
      pix: ''
    }
  })

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          // Buscar dados completos do parceiro
          const response = await fetch(`${API_URL}/partners/${user.id}`, { credentials: 'include' })
          if (response.ok) {
            const partnerData = await response.json()
            setCurrentUser(partnerData)
            setFormData(partnerData)
          } else {
            // Se não existir dados de parceiro, usar dados básicos do usuário
            const basicData = {
              ...user,
              company: {
                name: '',
                cnpj: '',
                address: '',
                phone: ''
              },
              bankData: {
                bank: '',
                agency: '',
                account: '',
                accountType: 'corrente',
                pix: ''
              }
            }
            setCurrentUser(basicData)
            setFormData(basicData)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }

    loadUserData()
  }, [])

  const handleSave = async () => {
    try {
      // Verificar se o parceiro já existe no banco de dados
      const checkResponse = await fetch(`${API_URL}/partners/${currentUser?.id}`, { credentials: 'include' })
      const partnerExists = checkResponse.ok
      
      const method = partnerExists ? 'PUT' : 'POST'
      const url = partnerExists ? `${API_URL}/partners/${currentUser?.id}` : `${API_URL}/partners`
      
      const dataToSave = partnerExists ? formData : { ...formData, id: currentUser?.id }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(dataToSave)
      })

      if (response.ok) {
        const updatedData = await response.json()
        setCurrentUser(updatedData)
        setIsEditing(false)
        alert('Dados atualizados com sucesso!')
        
        // Atualiza o usuário no Dashboard
        if (onUserUpdate) {
          onUserUpdate(updatedData)
        }
      } else {
        const errorText = await response.text()
        console.error('Erro na resposta:', errorText)
        throw new Error(`Erro ao salvar dados: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert(`Erro ao salvar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`)
    }
  }

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof Partner] as any),
        [field]: value
      }
    }))
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.')
      return
    }

    setUploadingPhoto(true)

    try {
      // Converter para base64 para armazenar no JSON
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        
        // Atualizar o perfil com a nova foto
         const updatedUser = {
           ...currentUser!,
           profilePhoto: base64
         }

         const response = await fetch(`${API_URL}/partners/${currentUser?.id}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json'
           },
           credentials: 'include',
           body: JSON.stringify(updatedUser)
         })

         if (response.ok) {
           setCurrentUser(updatedUser)
           setFormData(updatedUser)
           alert('Foto atualizada com sucesso!')
         } else {
           throw new Error('Erro ao salvar foto')
         }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      alert('Erro ao fazer upload da foto. Tente novamente.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20">
                {currentUser.profilePhoto ? (
                  <img
                    src={currentUser.profilePhoto}
                    alt="Foto do perfil"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white">
                    <UserIcon className="w-10 h-10 text-blue-600" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CameraIcon className="w-4 h-4 text-white" />
                  )}
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{currentUser.name}</h1>
                <p className="text-blue-100">{currentUser.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                  {currentUser.role === 'admin' ? 'Administrador' : 
                   currentUser.role === 'partner' ? 'Parceiro' : 
                   currentUser.role === 'manager' ? 'Gerente' : 'Usuário'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              {isEditing ? 'Cancelar' : 'Editar Perfil'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dados da Empresa */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <BuildingOfficeIcon className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Dados da Empresa</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company?.name || ''}
                      onChange={(e) => handleInputChange('company', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser.company?.name || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company?.cnpj || ''}
                      onChange={(e) => handleInputChange('company', 'cnpj', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="00.000.000/0000-00"
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser.company?.cnpj || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  {isEditing ? (
                    <textarea
                      value={formData.company?.address || ''}
                      onChange={(e) => handleInputChange('company', 'address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser.company?.address || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company?.phone || ''}
                      onChange={(e) => handleInputChange('company', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser.company?.phone || 'Não informado'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dados Bancários */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <BanknotesIcon className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Dados Bancários</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.bankData?.bank || ''}
                      onChange={(e) => handleInputChange('bankData', 'bank', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do banco"
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser.bankData?.bank || 'Não informado'}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.bankData?.agency || ''}
                        onChange={(e) => handleInputChange('bankData', 'agency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0000"
                      />
                    ) : (
                      <p className="text-gray-900">{currentUser.bankData?.agency || 'Não informado'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.bankData?.account || ''}
                        onChange={(e) => handleInputChange('bankData', 'account', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="00000-0"
                      />
                    ) : (
                      <p className="text-gray-900">{currentUser.bankData?.account || 'Não informado'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                  {isEditing ? (
                    <select
                      value={formData.bankData?.accountType || 'corrente'}
                      onChange={(e) => handleInputChange('bankData', 'accountType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Conta Poupança</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {currentUser.bankData?.accountType === 'corrente' ? 'Conta Corrente' : 
                       currentUser.bankData?.accountType === 'poupanca' ? 'Conta Poupança' : 'Não informado'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIX</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.bankData?.pix || ''}
                      onChange={(e) => handleInputChange('bankData', 'pix', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                    />
                  ) : (
                    <p className="text-gray-900">{currentUser.bankData?.pix || 'Não informado'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gerente Responsável */}
          {currentUser.role === 'partner' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <UserIcon className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Gerente Responsável</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 font-medium">{currentUser.managerName || 'Não atribuído'}</p>
                <p className="text-sm text-gray-600">Gerente responsável pelo acompanhamento das suas indicações</p>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          {isEditing && (
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}