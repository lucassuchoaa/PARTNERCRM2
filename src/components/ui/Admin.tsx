import { useState, useEffect } from 'react'
import {
  UsersIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
  XCircleIcon,
  BellIcon,
  DocumentTextIcon,
  FunnelIcon,
  CogIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon as CheckCircleIconOutline,
  XCircleIcon as XCircleIconOutline
} from '@heroicons/react/24/outline'
import { getCurrentUser } from '../../services/auth'
import { sendNotificationEmail, sendReportAvailableEmail, sendWelcomeEmail } from '../../services/api/emailService'
import { API_URL } from '../../config/api'
import { fetchWithAuth } from '../../services/api/fetch-with-auth'
import Integrations from './Integrations'
import ProductManagement from './ProductManagement'
import PricingManagement from './PricingManagement'
import ChatAnalytics from './ChatAnalytics'
import ChatBotTraining from './ChatBotTraining'
import RoleManagement from './RoleManagement'

interface User {
  id: number
  email: string
  name: string
  role: string
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
}

interface UploadedFile {
  id: number
  fileName: string
  fileType: string
  uploadedBy: string
  uploadDate: string
  size: number | string
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'available'
  downloadCount: number
}

interface NfeUpload {
  id: number
  fileName: string
  partnerId: number
  partnerName: string
  month: string
  year: number
  uploadDate: string
  fileType: string
  status: string
}

interface Notification {
  id: number
  title: string
  message: string
  type: string
  recipientId: string | null
  recipientType: 'all' | 'specific'
  isRead: boolean
  createdAt: string
  emailSent: boolean
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users')
  const [supportMaterials, setSupportMaterials] = useState<any[]>([])
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    category: 'folha-pagamento',
    type: 'pdf',
    description: '',
    downloadUrl: '#',
    viewUrl: '',
    duration: '',
    fileSize: ''
  })
  const [users, setUsers] = useState<User[]>([])
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [nfeUploads, setNfeUploads] = useState<NfeUpload[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [managers, setManagers] = useState<any[]>([])
  const [remunerationTables, setRemunerationTables] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [showRemunerationModal, setShowRemunerationModal] = useState(false)
  const [editingRemuneration, setEditingRemuneration] = useState<any>(null)
  const [newRemuneration, setNewRemuneration] = useState({
    employeeRangeStart: '',
    employeeRangeEnd: '',
    finderNegotiationMargin: '',
    maxCompanyCashback: '',
    finalFinderCashback: '',
    description: '',
    valueType: 'currency' as 'currency' | 'percentage'
  })
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'partner',
    roleId: '',
    password: '',
    managerId: '',
    remunerationTableIds: [1]
  })
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    recipientType: 'all' as 'all' | 'specific',
    recipientId: null as string | null,
    emailSent: false
  })
  const [filesDateFilter, setFilesDateFilter] = useState<'current' | 'last' | 'custom' | 'all'>('all')
  const [nfeDateFilter, setNfeDateFilter] = useState<'current' | 'last' | 'custom' | 'all'>('all')
  const [filesCustomStartDate, setFilesCustomStartDate] = useState('')
  const [filesCustomEndDate, setFilesCustomEndDate] = useState('')
  const [nfeCustomStartDate, setNfeCustomStartDate] = useState('')
  const [nfeCustomEndDate, setNfeCustomEndDate] = useState('')
  const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([])
  const [filteredNfeUploads, setFilteredNfeUploads] = useState<NfeUpload[]>([])

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        
        if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
          setAccessDenied(true)
          setLoading(false)
          return
        }
        
        // Se é admin, carrega os dados
        fetchUsers()
        fetchUploadedFiles()
        fetchNfeUploads()
        fetchNotifications()
        fetchManagers()
        fetchRemunerationTables()
        fetchRoles()
        fetchSupportMaterials()
      } catch (error) {
        console.error('Erro ao verificar acesso:', error)
        setAccessDenied(true)
        setLoading(false)
      }
    }
    
    checkUserAccess()
  }, [])

  // Filtrar arquivos baseado no filtro de data selecionado
  useEffect(() => {
    const filterFiles = () => {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      let filtered = [...uploadedFiles]
      
      switch (filesDateFilter) {
        case 'current':
          filtered = uploadedFiles.filter(file => {
            const fileDate = new Date(file.uploadDate)
            return fileDate.getMonth() === currentMonth && fileDate.getFullYear() === currentYear
          })
          break
        case 'last':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
          filtered = uploadedFiles.filter(file => {
            const fileDate = new Date(file.uploadDate)
            return fileDate.getMonth() === lastMonth && fileDate.getFullYear() === lastMonthYear
          })
          break
        case 'custom':
          if (filesCustomStartDate && filesCustomEndDate) {
            const startDate = new Date(filesCustomStartDate)
            const endDate = new Date(filesCustomEndDate)
            endDate.setMonth(endDate.getMonth() + 1) // Incluir o mês final completo
            filtered = uploadedFiles.filter(file => {
              const fileDate = new Date(file.uploadDate)
              return fileDate >= startDate && fileDate < endDate
            })
          }
          break
        case 'all':
        default:
          filtered = uploadedFiles
      }
      
      setFilteredFiles(filtered)
    }
    
    filterFiles()
  }, [uploadedFiles, filesDateFilter, filesCustomStartDate, filesCustomEndDate])

  // Filtrar NFe uploads baseado no filtro de data selecionado
  useEffect(() => {
    const filterNfeUploads = () => {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      let filtered = [...nfeUploads]
      
      switch (nfeDateFilter) {
        case 'current':
          filtered = nfeUploads.filter(nfe => {
            const nfeDate = new Date(nfe.uploadDate)
            return nfeDate.getMonth() === currentMonth && nfeDate.getFullYear() === currentYear
          })
          break
        case 'last':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
          filtered = nfeUploads.filter(nfe => {
            const nfeDate = new Date(nfe.uploadDate)
            return nfeDate.getMonth() === lastMonth && nfeDate.getFullYear() === lastMonthYear
          })
          break
        case 'custom':
          if (nfeCustomStartDate && nfeCustomEndDate) {
            const startDate = new Date(nfeCustomStartDate)
            const endDate = new Date(nfeCustomEndDate)
            endDate.setMonth(endDate.getMonth() + 1) // Incluir o mês final completo
            filtered = nfeUploads.filter(nfe => {
              const nfeDate = new Date(nfe.uploadDate)
              return nfeDate >= startDate && nfeDate < endDate
            })
          }
          break
        case 'all':
        default:
          filtered = nfeUploads
      }
      
      setFilteredNfeUploads(filtered)
    }
    
    filterNfeUploads()
  }, [nfeUploads, nfeDateFilter, nfeCustomStartDate, nfeCustomEndDate])

  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/users`)

      if (!response.ok) {
        console.error('Erro ao buscar usuários: resposta não OK')
        // Não limpar os usuários existentes em caso de erro
        return
      }

      const usersData = await response.json()

      // Garantir que sempre seja um array
      const usersArray = Array.isArray(usersData) ? usersData : (usersData?.data && Array.isArray(usersData.data) ? usersData.data : [])

      // Adaptar formato do banco para o formato esperado pelo frontend
      const enhancedUsers = usersArray.map((user: any) => ({
        ...user,
        managerId: user.manager_id,
        remunerationTableIds: user.remuneration_table_ids || [],
        createdAt: user.created_at,
        lastLogin: user.last_login,
        status: user.status || 'active'
      }))

      // Separar usuários ativos dos pendentes
      setUsers(enhancedUsers.filter((u: User) => u.status !== 'pending'))
      setPendingUsers(enhancedUsers.filter((u: User) => u.status === 'pending'))
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      // Não limpar os usuários existentes em caso de erro
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: number) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'active'
        })
      })

      if (response.ok) {
        alert('Usuário aprovado com sucesso!')
        fetchUsers() // Recarregar lista
      } else {
        alert('Erro ao aprovar usuário')
      }
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error)
      alert('Erro ao aprovar usuário')
    }
  }

  const handleRejectUser = async (userId: number) => {
    if (!confirm('Tem certeza que deseja reprovar este cadastro? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Cadastro reprovado e removido')
        fetchUsers() // Recarregar lista
      } else {
        alert('Erro ao reprovar cadastro')
      }
    } catch (error) {
      console.error('Erro ao reprovar cadastro:', error)
      alert('Erro ao reprovar cadastro')
    }
  }

  const fetchManagers = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/managers`)
      
      if (!response.ok) {
        setManagers([])
        return
      }
      
      const managersData = await response.json()
      
      // Garantir que sempre seja um array
      const managersArray = Array.isArray(managersData) ? managersData : (managersData?.data && Array.isArray(managersData.data) ? managersData.data : [])
      setManagers(managersArray)
    } catch (error) {
      console.error('Erro ao buscar gerentes:', error)
      setManagers([])
    }
  }

  const fetchRemunerationTables = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/remuneration-tables`)

      if (!response.ok) {
        setRemunerationTables([])
        return
      }

      const data = await response.json()

      // Garantir que sempre seja um array
      const dataArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : [])

      // Adaptar formato do banco para o formato esperado pelo frontend
      setRemunerationTables(dataArray.map((table: any) => ({
        ...table,
        employeeRangeStart: table.employee_range_start,
        employeeRangeEnd: table.employee_range_end,
        finderNegotiationMargin: table.finder_negotiation_margin,
        maxCompanyCashback: table.max_company_cashback,
        finalFinderCashback: table.final_finder_cashback,
        valueType: table.value_type || 'percentage'
      })))
    } catch (error) {
      console.error('Erro ao buscar tabelas de remuneração:', error)
      setRemunerationTables([])
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/roles`)

      if (!response.ok) {
        setRoles([])
        return
      }

      const data = await response.json()

      // Garantir que sempre seja um array
      const rolesArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : [])
      setRoles(rolesArray)
    } catch (error) {
      console.error('Erro ao buscar roles:', error)
      setRoles([])
    }
  }

  // Função para formatar valores monetários ou percentuais
  const formatValue = (value: string | number, type: 'currency' | 'percentage') => {
    const numValue = parseFloat(value.toString())
    if (type === 'currency') {
      return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    } else {
      return `${numValue}%`
    }
  }

  // Função para formatar valores da tabela baseado no tipo da tabela
  const formatTableValue = (table: any, field: string) => {
    const value = table[field]
    const type = table.valueType || 'currency'
    return formatValue(value, type)
  }

  const fetchSupportMaterials = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/support-materials`)
      
      if (!response.ok) {
        setSupportMaterials([])
        return
      }
      
      const data = await response.json()
      
      // Garantir que sempre seja um array
      const dataArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : [])
      
      // Adaptar formato do banco para o formato esperado pelo frontend
      setSupportMaterials(dataArray.map((material: any) => ({
        ...material,
        downloadUrl: material.download_url,
        viewUrl: material.view_url,
        fileSize: material.file_size,
        createdAt: material.created_at,
        updatedAt: material.updated_at
      })))
    } catch (error) {
      console.error('Erro ao buscar materiais de apoio:', error)
      setSupportMaterials([])
    }
  }
  
  const handleAddMaterial = async () => {
    try {
      // Adicionar data de criação
      const materialToAdd = {
        ...newMaterial,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const response = await fetchWithAuth(`${API_URL}/support-materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newMaterial.title,
          category: newMaterial.category,
          type: newMaterial.type,
          description: newMaterial.description,
          downloadUrl: newMaterial.downloadUrl,
          viewUrl: newMaterial.viewUrl,
          fileSize: newMaterial.fileSize,
          duration: newMaterial.duration
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        const addedMaterial = result.data || result
        await fetchSupportMaterials() // Recarregar da API
        setShowMaterialModal(false)
        setNewMaterial({
          title: '',
          category: 'folha-pagamento',
          type: 'pdf',
          description: '',
          downloadUrl: '#',
          viewUrl: '',
          duration: '',
          fileSize: ''
        })
        alert('Material de apoio adicionado com sucesso!')
      } else {
        alert('Erro ao adicionar material de apoio')
      }
    } catch (error) {
      console.error('Erro ao adicionar material de apoio:', error)
      alert('Erro ao adicionar material de apoio')
    }
  }
  
  const handleUpdateMaterial = async () => {
    if (!editingMaterial) return
    
    try {
      const materialToUpdate = {
        ...editingMaterial,
        updatedAt: new Date().toISOString()
      }
      
      const response = await fetchWithAuth(`${API_URL}/support-materials/${editingMaterial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingMaterial.title,
          category: editingMaterial.category,
          type: editingMaterial.type,
          description: editingMaterial.description,
          downloadUrl: editingMaterial.downloadUrl,
          viewUrl: editingMaterial.viewUrl,
          fileSize: editingMaterial.fileSize,
          duration: editingMaterial.duration
        })
      })
      
      if (response.ok) {
        await fetchSupportMaterials() // Recarregar da API
        setShowMaterialModal(false)
        setEditingMaterial(null)
        alert('Material de apoio atualizado com sucesso!')
      } else {
        alert('Erro ao atualizar material de apoio')
      }
    } catch (error) {
      console.error('Erro ao atualizar material de apoio:', error)
      alert('Erro ao atualizar material de apoio')
    }
  }
  
  const handleDeleteMaterial = async (id: string | number) => {
    if (confirm('Tem certeza que deseja excluir este material de apoio?')) {
      try {
        const response = await fetchWithAuth(`${API_URL}/support-materials/${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await fetchSupportMaterials() // Recarregar da API
          alert('Material de apoio excluído com sucesso!')
        } else {
          alert('Erro ao excluir material de apoio')
        }
      } catch (error) {
        console.error('Erro ao excluir material de apoio:', error)
        alert('Erro ao excluir material de apoio')
      }
    }
  }

  const handleCreateRemuneration = async () => {
    try {
      const isEditing = editingRemuneration !== null
      const url = isEditing 
        ? `${API_URL}/remuneration-tables/${editingRemuneration.id}`
        : `${API_URL}/remuneration-tables`
      
      const method = isEditing ? 'PUT' : 'POST'
      
      const body = {
        employeeRangeStart: newRemuneration.employeeRangeStart,
        employeeRangeEnd: newRemuneration.employeeRangeEnd || null,
        finderNegotiationMargin: newRemuneration.finderNegotiationMargin,
        maxCompanyCashback: newRemuneration.maxCompanyCashback,
        finalFinderCashback: newRemuneration.finalFinderCashback,
        description: newRemuneration.description || null,
        valueType: newRemuneration.valueType || 'percentage'
      }
      
      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        await fetchRemunerationTables()
        setShowRemunerationModal(false)
        setEditingRemuneration(null)
        setNewRemuneration({
          employeeRangeStart: '',
          employeeRangeEnd: '',
          finderNegotiationMargin: '',
          maxCompanyCashback: '',
          finalFinderCashback: '',
          description: '',
          valueType: 'currency'
        })
        alert(isEditing ? 'Tabela de remuneração atualizada com sucesso!' : 'Tabela de remuneração criada com sucesso!')
      } else {
        const errorData = await response.json().catch(() => null)
        alert(errorData?.error || 'Erro ao salvar tabela de remuneração')
      }
    } catch (error) {
      console.error('Erro ao salvar tabela de remuneração:', error)
      alert('Erro ao salvar tabela de remuneração')
    }
  }

  const handleEditRemuneration = (table: any) => {
    setEditingRemuneration(table)
    setNewRemuneration({
      employeeRangeStart: table.employeeRangeStart,
      employeeRangeEnd: table.employeeRangeEnd,
      finderNegotiationMargin: table.finderNegotiationMargin,
      maxCompanyCashback: table.maxCompanyCashback,
      finalFinderCashback: table.finalFinderCashback,
      description: table.description || '',
      valueType: table.valueType || 'currency'
    })
    setShowRemunerationModal(true)
  }

  const handleDeleteRemuneration = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta tabela de remuneração?')) {
      try {
        const response = await fetchWithAuth(`${API_URL}/remuneration-tables/${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await fetchRemunerationTables()
          alert('Tabela de remuneração excluída com sucesso!')
        } else {
          const errorData = await response.json().catch(() => null)
          alert(errorData?.error || 'Erro ao excluir tabela de remuneração')
        }
      } catch (error) {
        console.error('Erro ao excluir tabela de remuneração:', error)
        alert('Erro ao excluir tabela de remuneração')
      }
    }
  }

  const fetchUploadedFiles = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/uploads`)
      
      if (!response.ok) {
        setUploadedFiles([])
        return
      }
      
      const uploadsData = await response.json()
      
      // Garantir que sempre seja um array
      const uploadsArray = Array.isArray(uploadsData) ? uploadsData : []
      
      // Mapear dados da API para o formato esperado
      const enhancedFiles = uploadsArray.map((upload: any) => ({
        id: upload.id,
        fileName: upload.fileName,
        fileType: upload.fileType || 'PDF',
        uploadedBy: upload.uploadedBy || 'admin@somapay.com.br',
        uploadDate: upload.uploadDate || new Date().toISOString(),
        size: upload.size || 0,
        status: upload.status || 'pending',
        downloadCount: upload.downloadCount || 0
      }))
      
      setUploadedFiles(enhancedFiles)
    } catch (error) {
      console.error('Erro ao buscar arquivos:', error)
      setUploadedFiles([])
    }
  }

  const fetchNfeUploads = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/nfe_uploads`)
      
      if (!response.ok) {
        setNfeUploads([])
        return
      }
      
      const nfeData = await response.json()
      
      // Garantir que sempre seja um array
      const nfeArray = Array.isArray(nfeData) ? nfeData : []
      setNfeUploads(nfeArray)
    } catch (error) {
      console.error('Erro ao buscar NFe uploads:', error)
      setNfeUploads([])
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/notifications`)
      
      if (!response.ok) {
        setNotifications([])
        return
      }
      
      const notificationsData = await response.json()
      
      // Garantir que sempre seja um array
      const notificationsArray = Array.isArray(notificationsData) ? notificationsData : []
      setNotifications(notificationsArray)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      setNotifications([])
    }
  }

  const handleCreateUser = async () => {
    try {
      if (editingUser) {
        // Editar usuário existente
        const response = await fetchWithAuth(`${API_URL}/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: editingUser.email,
            name: editingUser.name,
            password: (editingUser as any).password,
            role: editingUser.role,
            roleId: (editingUser as any).roleId || null,
            managerId: (editingUser as any).managerId || null,
            remunerationTableIds: (editingUser as any).remunerationTableIds || [],
            status: editingUser.status
          })
        })
        
        if (response.ok) {
          await fetchUsers() // Recarregar da API
          setShowUserModal(false)
          setEditingUser(null)
          setNewUser({ email: '', name: '', role: 'partner', roleId: '', password: '', managerId: '', remunerationTableIds: [1] })
          alert('Usuário atualizado com sucesso!')
          return
        }
        
        if (editingUser.role === 'partner') {
          // Atualizar também na tabela de parceiros
          const partnerResponse = await fetchWithAuth(`${API_URL}/partners/${editingUser.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...(editingUser as any),
              remunerationTableIds: (editingUser as any).remunerationTableIds || [(editingUser as any).remunerationTableId] || [1]
            })
          })
        }
        
        fetchUsers()
        setShowUserModal(false)
        setEditingUser(null)
        setNewUser({ email: '', name: '', role: 'partner', roleId: '', password: '', managerId: '', remunerationTableIds: [1] })
        alert('Usuário atualizado com sucesso!')
        return
      }
      
      // Criar novo usuário
      const response = await fetchWithAuth(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          password: newUser.password,
          role: newUser.role,
          roleId: newUser.roleId || null,
          managerId: newUser.managerId || null,
          remunerationTableIds: newUser.remunerationTableIds || [],
          status: 'active'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        const userData = result.data || result
        // Se for um parceiro e tem gerente, criar entrada na tabela de parceiros
        if (newUser.role === 'partner' && newUser.managerId) {
          const manager = managers.find(m => m.id === newUser.managerId)
          const partnerData = {
            id: userData.id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: 'partner',
            managerId: newUser.managerId,
            managerName: manager?.name || '',
            remunerationTableIds: newUser.remunerationTableIds,
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

          await fetchWithAuth(`${API_URL}/partners`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(partnerData)
          })

          // Atualizar lista de parceiros do gerente
          const updatedManager = {
            ...manager,
            partnersIds: [...(manager?.partnersIds || []), userData.id.toString()]
          }

          await fetchWithAuth(`${API_URL}/managers/${newUser.managerId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedManager)
          })
        }

        // Se for um gerente, criar entrada na tabela de gerentes
        if (newUser.role === 'manager') {
          const managerData = {
            id: userData.id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: 'manager',
            partnersIds: []
          }

          await fetchWithAuth(`${API_URL}/managers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(managerData)
          })
        }

        // Enviar email de boas-vindas para o novo usuário
        try {
          await sendWelcomeEmail(
            userData.email,
            userData.name,
            newUser.password
          )
        } catch (emailError) {
          console.error('Erro ao enviar email de boas-vindas:', emailError)
        }

        fetchUsers()
        setShowUserModal(false)
        setNewUser({ email: '', name: '', role: 'partner', roleId: '', password: '', managerId: '', remunerationTableIds: [1] })
        alert('Usuário criado com sucesso! Email de boas-vindas enviado.')
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          // Atualizar o estado local removendo apenas o usuário deletado
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
          alert('Usuário excluído com sucesso!')
        } else {
          alert('Erro ao excluir usuário')
        }
      } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        alert('Erro ao excluir usuário')
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUploadReport = async () => {
    if (!selectedFile || !selectedPartnerId || !selectedMonth || !selectedYear) {
      alert('Por favor, preencha todos os campos: arquivo, parceiro, mês e ano de referência.')
      return
    }

    const selectedPartner = users.find(user => user.id.toString() === selectedPartnerId)
    if (!selectedPartner) {
      alert('Parceiro não encontrado.')
      return
    }

    try {
      // Criar nome do arquivo com informações do parceiro e período de referência
      const fileExtension = selectedFile.name.split('.').pop()
      const fileName = `relatorio_${selectedPartner.name.toLowerCase().replace(/\s+/g, '_')}_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.${fileExtension}`

      const newFile: UploadedFile = {
        id: Date.now(),
        fileName: fileName,
        fileType: fileExtension?.toUpperCase() || 'PDF',
        uploadedBy: 'admin@somapay.com.br',
        uploadDate: new Date().toISOString(),
        size: selectedFile.size,
        status: 'approved',
        downloadCount: 0
      }

      // Adicionar à lista de arquivos
      setUploadedFiles(prev => [newFile, ...prev])

      // Adicionar aos relatórios do parceiro no db.json
       const reportData = {
         id: Date.now(),
         fileName: fileName,
         partnerId: selectedPartner.id,
         partnerName: selectedPartner.name,
         referenceMonth: parseInt(selectedMonth),
         referenceYear: parseInt(selectedYear),
         uploadDate: new Date().toISOString(),
         fileType: fileExtension?.toUpperCase() || 'PDF',
         size: selectedFile.size,
         status: 'available'
       }

      await fetchWithAuth(`${API_URL}/partner_reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      })

      // Enviar notificação automática para o parceiro
      await createNotification({
        title: 'Novo relatório disponível',
        message: `Seu relatório de ${selectedMonth}/${selectedYear} está disponível para download.`,
        type: 'report_available',
        recipientId: selectedPartner.id.toString(),
        recipientType: 'specific',
        sendEmail: true
      })

      // Enviar email específico de relatório disponível
      try {
        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ]
        const monthName = monthNames[parseInt(selectedMonth) - 1] || selectedMonth
        
        await sendReportAvailableEmail(
          selectedPartner.email,
          selectedPartner.name,
          monthName,
          parseInt(selectedYear)
        )
      } catch (emailError) {
        console.error('Erro ao enviar email de relatório:', emailError)
      }

      // Resetar modal
       setShowUploadModal(false)
       setSelectedFile(null)
       setSelectedPartnerId('')
       setSelectedMonth('')
       setSelectedYear(new Date().getFullYear().toString())
       alert(`Relatório de ${selectedMonth}/${selectedYear} enviado com sucesso para ${selectedPartner.name}!`)
    } catch (error) {
      console.error('Erro ao fazer upload do relatório:', error)
      alert('Erro ao fazer upload do relatório')
    }
  }

  const handleFileStatusChange = (fileId: number, newStatus: 'pending' | 'approved' | 'rejected' | 'processed' | 'available') => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: newStatus } : file
    ))
  }

  const handleDeleteFile = (fileId: number) => {
    if (confirm('Tem certeza que deseja excluir este arquivo?')) {
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
      alert('Arquivo excluído com sucesso!')
    }
  }

  const sendNotificationEmails = async (notification: any) => {
    try {
      if (notification.recipientType === 'all') {
        // Enviar para todos os parceiros
        const partners = users.filter(user => user.role === 'partner')
        for (const partner of partners) {
          await sendNotificationEmail({
            recipientEmail: partner.email,
            recipientName: partner.name,
            title: notification.title,
            message: notification.message,
            type: notification.type
          })
        }
      } else if (notification.recipientId) {
        // Enviar para parceiro específico
        const recipient = users.find(user => user.id.toString() === notification.recipientId)
        if (recipient) {
          await sendNotificationEmail({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            title: notification.title,
            message: notification.message,
            type: notification.type
          })
        }
      }
      
      // Atualizar status de email enviado
      await fetchWithAuth(`${API_URL}/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailSent: true })
      })
    } catch (error) {
      console.error('Erro ao enviar emails:', error)
    }
  }

  const createNotification = async (notification: {
    title: string
    message: string
    type: string
    recipientId: string | null
    recipientType: 'all' | 'specific'
    sendEmail?: boolean
  }) => {
    try {
      const newNotification = {
        id: Date.now(),
        ...notification,
        isRead: false,
        createdAt: new Date().toISOString(),
        emailSent: false
      }
      
      const response = await fetchWithAuth(`${API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newNotification)
      })
      
      if (response.ok) {
        // Enviar email se solicitado
        if (notification.sendEmail) {
          await sendNotificationEmails(newNotification)
        }
        fetchNotifications()
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
    }
  }

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      alert('Por favor, preencha título e mensagem.')
      return
    }

    if (newNotification.recipientType === 'specific' && !newNotification.recipientId) {
      alert('Por favor, selecione um parceiro específico.')
      return
    }

    await createNotification({
      title: newNotification.title,
      message: newNotification.message,
      type: 'admin_message',
      recipientId: newNotification.recipientType === 'all' ? null : newNotification.recipientId,
      recipientType: newNotification.recipientType,
      sendEmail: newNotification.emailSent
    })

    setNewNotification({
      title: '',
      message: '',
      type: 'info',
      recipientType: 'all',
      recipientId: null,
      emailSent: false
    })
    setShowNotificationModal(false)
    alert('Notificação enviada com sucesso!')
  }

  const handleFileDownload = async (fileName: string, partnerId?: string) => {
    try {
      // Simular download do arquivo
      const link = document.createElement('a')
      link.href = `#` // Em produção, seria a URL real do arquivo
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Se for um arquivo de parceiro, enviar notificação
      if (partnerId) {
        const partner = users.find(u => u.id.toString() === partnerId)
        if (partner) {
          await createNotification({
            title: 'Download realizado',
            message: `O administrador fez download do seu arquivo: ${fileName}`,
            type: 'file_downloaded',
            recipientId: partnerId,
            recipientType: 'specific'
          })
        }
      }
      
      alert(`Download iniciado: ${fileName}`)
    } catch (error) {
      console.error('Erro no download:', error)
      alert('Erro ao fazer download do arquivo')
    }
  }

  const handleFileView = (fileName: string, fileType: string) => {
    try {
      // Simular visualização do arquivo
      if (fileType.toLowerCase().includes('pdf')) {
        // Para PDFs, simular abertura em nova aba
        alert(`Visualizando PDF: ${fileName}\n\nEm produção, o arquivo seria aberto em uma nova aba.`)
      } else {
        // Para outros tipos, mostrar modal de visualização
        alert(`Visualizando arquivo: ${fileName}\nTipo: ${fileType}\n\nEm produção, o arquivo seria exibido em um modal ou nova aba.`)
      }
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error)
      alert('Erro ao visualizar arquivo')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta área. Apenas administradores podem gerenciar usuários e relatórios.
          </p>
          <p className="text-sm text-gray-500">
            Se você acredita que isso é um erro, entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold leading-6 text-gray-900">Painel de Administração</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie usuários, uploads de relatórios e downloads do sistema.
          </p>
        </div>
      </div>

      {/* Sidebar + Content Layout */}
      <div className="mt-8 flex gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-1 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sticky top-8">
            {/* Sistema Section */}
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sistema
              </div>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'users'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UsersIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Usuários
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'approvals'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ClockIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">Aprovações</span>
                {pendingUsers.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BellIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Notificacoes
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'roles'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CogIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Funcoes e Permissoes
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-3"></div>

            {/* Conteúdo Section */}
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Conteúdo
              </div>
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'products'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ShoppingCartIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Produtos
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'pricing'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CurrencyDollarIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Planos de Preços
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'materials'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BookOpenIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Materiais de Apoio
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-3"></div>

            {/* Financeiro Section */}
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Financeiro
              </div>
              <button
                onClick={() => setActiveTab('remuneration')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'remuneration'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CurrencyDollarIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Tabela de Remuneração
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'files'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <DocumentTextIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Relatórios de Parceiros
              </button>
              <button
                onClick={() => setActiveTab('nfe')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'nfe'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <DocumentArrowUpIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Upload de NFe
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-3"></div>

            {/* ChatBot IA Section */}
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ChatBot IA
              </div>
              <button
                onClick={() => setActiveTab('chatanalytics')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'chatanalytics'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Análise de Conversas
              </button>
              <button
                onClick={() => setActiveTab('chattraining')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'chattraining'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CogIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Treinamento do Bot
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-3"></div>

            {/* Integrações Section */}
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Integrações
              </div>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'integrations'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowPathIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                Configurações
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
        {activeTab === 'chatanalytics' && (
          <ChatAnalytics />
        )}

        {activeTab === 'chattraining' && (
          <ChatBotTraining />
        )}

        {activeTab === 'products' && (
          <ProductManagement currentUser={currentUser} />
        )}

        {activeTab === 'pricing' && (
          <PricingManagement />
        )}

        {activeTab === 'roles' && (
          <RoleManagement />
        )}

        {activeTab === 'approvals' && (
          <div>
            {/* Approvals Header */}
            <div className="sm:flex sm:items-center mb-6">
              <div className="sm:flex-auto">
                <h2 className="text-lg font-semibold text-gray-900">Aprovação de Cadastros</h2>
                <p className="mt-1 text-sm text-gray-700">
                  Aprove ou reprove novos cadastros de parceiros aguardando aprovação.
                </p>
              </div>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <CheckCircleIconOutline className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cadastro pendente</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Todos os cadastros foram aprovados ou não há novos cadastros aguardando.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parceiro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data de Cadastro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircleIconOutline className="h-4 w-4 mr-1" />
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XCircleIconOutline className="h-4 w-4 mr-1" />
                              Reprovar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            {/* Users Header */}
            <div className="sm:flex sm:items-center mb-6">
              <div className="sm:flex-auto">
                <h2 className="text-lg font-semibold text-gray-900">Gerenciamento de Usuários</h2>
                <p className="mt-1 text-sm text-gray-700">
                  Visualize e gerencie todos os usuários do sistema.
                </p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button
                  onClick={() => setShowUserModal(true)}
                  className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 inline mr-1" />
                  Novo Usuário
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acesso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : user.role === 'manager'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 
                           user.role === 'manager' ? 'Gerente de Parceiro' : 'Parceiro'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser(user)
                              setShowUserModal(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Integrations Section */}
        {activeTab === 'integrations' && (
          <Integrations />
        )}

        {activeTab === 'remuneration' && (
          <div>
            {/* Remuneration Header */}
            <div className="sm:flex sm:items-center mb-6">
              <div className="sm:flex-auto">
                <h2 className="text-lg font-semibold text-gray-900">Tabelas de Remuneração</h2>
                <p className="mt-1 text-sm text-gray-700">
                  Configure as tabelas de remuneração para parceiros baseadas na quantidade de funcionários das empresas.
                </p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button
                  onClick={() => setShowRemunerationModal(true)}
                  className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 inline mr-1" />
                  Nova Tabela
                </button>
              </div>
            </div>

            {/* Remuneration Table */}
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade de Funcionários
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Margem de Negociação Finder
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cashback Máximo Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cashback Final Finder
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data Criação
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {remunerationTables.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                            Nenhuma tabela de remuneração cadastrada
                          </td>
                        </tr>
                      ) : (
                        remunerationTables.map((table) => (
                          <tr key={table.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {table.employeeRangeEnd ? `${table.employeeRangeStart} a ${table.employeeRangeEnd}` : `A partir de ${table.employeeRangeStart}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTableValue(table, 'finderNegotiationMargin')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTableValue(table, 'maxCompanyCashback')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTableValue(table, 'finalFinderCashback')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                table.valueType === 'percentage' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {table.valueType === 'percentage' ? 'Porcentagem (%)' : 'Reais (R$)'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(table.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2 justify-end">
                                <button
                                  onClick={() => handleDeleteRemuneration(table.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Excluir"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
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
        )}
        
        {activeTab === 'materials' && (
          <div>
            {/* Materials Header */}
            <div className="sm:flex sm:items-center mb-6">
              <div className="sm:flex-auto">
                <h2 className="text-lg font-semibold text-gray-900">Materiais de Apoio</h2>
                <p className="mt-1 text-sm text-gray-700">
                  Gerencie os materiais de apoio disponíveis para os parceiros e usuários do sistema.
                </p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button
                  onClick={() => {
                    setEditingMaterial(null)
                    setNewMaterial({
                      title: '',
                      category: 'folha-pagamento',
                      type: 'pdf',
                      description: '',
                      downloadUrl: '#',
                      viewUrl: '',
                      duration: '',
                      fileSize: ''
                    })
                    setShowMaterialModal(true)
                  }}
                  className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 inline mr-1" />
                  Novo Material
                </button>
              </div>
            </div>

            {/* Materials Table */}
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Criação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {supportMaterials.map((material) => (
                        <tr key={material.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{material.title}</div>
                            <div className="text-sm text-gray-500">{material.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {material.category === 'folha-pagamento' ? 'Folha de Pagamento' :
                             material.category === 'consignado' ? 'Consignado' :
                             material.category === 'beneficios-flexiveis' ? 'Benefícios Flexíveis' : material.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${material.type === 'pdf' ? 'bg-red-100 text-red-800' : material.type === 'video' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              {material.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(material.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingMaterial(material)
                                  setNewMaterial({
                                    title: material.title,
                                    category: material.category,
                                    type: material.type,
                                    description: material.description,
                                    downloadUrl: material.downloadUrl,
                                    viewUrl: material.viewUrl || '',
                                    duration: material.duration || '',
                                    fileSize: material.fileSize || ''
                                  })
                                  setShowMaterialModal(true)
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Editar"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(material.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Excluir"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
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

        {/* Material Modal */}
        {showMaterialModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingMaterial ? 'Editar Material de Apoio' : 'Adicionar Material de Apoio'}
                </h3>
                <button
                  onClick={() => setShowMaterialModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
                  <input
                    type="text"
                    id="title"
                    value={editingMaterial ? editingMaterial.title : newMaterial.title}
                    onChange={(e) => editingMaterial ? setEditingMaterial({...editingMaterial, title: e.target.value}) : setNewMaterial({...newMaterial, title: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                  <select
                    id="category"
                    value={editingMaterial ? editingMaterial.category : newMaterial.category}
                    onChange={(e) => editingMaterial ? setEditingMaterial({...editingMaterial, category: e.target.value}) : setNewMaterial({...newMaterial, category: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="folha-pagamento">Folha de Pagamento</option>
                    <option value="consignado">Consignado</option>
                    <option value="beneficios-flexiveis">Benefícios Flexíveis</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    id="type"
                    value={editingMaterial ? editingMaterial.type : newMaterial.type}
                    onChange={(e) => editingMaterial ? setEditingMaterial({...editingMaterial, type: e.target.value}) : setNewMaterial({...newMaterial, type: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pdf">PDF</option>
                    <option value="video">Vídeo</option>
                    <option value="doc">Documento</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    id="description"
                    value={editingMaterial ? editingMaterial.description : newMaterial.description}
                    onChange={(e) => editingMaterial ? setEditingMaterial({...editingMaterial, description: e.target.value}) : setNewMaterial({...newMaterial, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="downloadUrl" className="block text-sm font-medium text-gray-700">URL de Download</label>
                  <input
                    type="text"
                    id="downloadUrl"
                    value={editingMaterial ? editingMaterial.downloadUrl : newMaterial.downloadUrl}
                    onChange={(e) => editingMaterial ? setEditingMaterial({...editingMaterial, downloadUrl: e.target.value}) : setNewMaterial({...newMaterial, downloadUrl: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="viewUrl" className="block text-sm font-medium text-gray-700">URL de Visualização (opcional)</label>
                  <input
                    type="text"
                    id="viewUrl"
                    value={editingMaterial ? (editingMaterial.viewUrl || '') : newMaterial.viewUrl}
                    onChange={(e) => editingMaterial ? setEditingMaterial({...editingMaterial, viewUrl: e.target.value}) : setNewMaterial({...newMaterial, viewUrl: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fileSize" className="block text-sm font-medium text-gray-700">Tamanho do Arquivo (opcional)</label>
                    <input
                      type="text"
                      id="fileSize"
                      value={editingMaterial ? (editingMaterial.fileSize || '') : newMaterial.fileSize}
                      onChange={(e) => editingMaterial ? setEditingMaterial({...editingMaterial, fileSize: e.target.value}) : setNewMaterial({...newMaterial, fileSize: e.target.value})}
                      placeholder="Ex: 2.5 MB"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duração (para vídeos, opcional)</label>
                    <input
                      type="text"
                      id="duration"
                      value={editingMaterial ? (editingMaterial.duration || '') : newMaterial.duration}
                      onChange={(e) => editingMaterial ? setEditingMaterial({...editingMaterial, duration: e.target.value}) : setNewMaterial({...newMaterial, duration: e.target.value})}
                      placeholder="Ex: 10:30"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={() => editingMaterial ? handleUpdateMaterial() : handleAddMaterial()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                >
                  {editingMaterial ? 'Atualizar' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'files' && (
          <div>
            {/* Files Header */}
            <div className="sm:flex sm:items-center mb-6">
              <div className="sm:flex-auto">
                <h2 className="text-lg font-semibold text-gray-900">Gerenciamento de Arquivos</h2>
                <p className="mt-1 text-sm text-gray-700">
                  Faça upload de relatórios e gerencie downloads para parceiros.
                </p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <DocumentArrowUpIcon className="h-4 w-4 inline mr-1" />
                  Upload Relatório
                </button>
              </div>
            </div>

            {/* Filtros de Data para Arquivos */}
            <div className="mb-6 bg-white shadow rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Filtrar por data de upload:</span>
                </div>
                
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="filesDateFilter"
                      value="all"
                      checked={filesDateFilter === 'all'}
                      onChange={(e) => setFilesDateFilter(e.target.value as 'current' | 'last' | 'custom' | 'all')}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Todos</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="filesDateFilter"
                      value="current"
                      checked={filesDateFilter === 'current'}
                      onChange={(e) => setFilesDateFilter(e.target.value as 'current' | 'last' | 'custom' | 'all')}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Mês Atual</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="filesDateFilter"
                      value="last"
                      checked={filesDateFilter === 'last'}
                      onChange={(e) => setFilesDateFilter(e.target.value as 'current' | 'last' | 'custom' | 'all')}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Mês Passado</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="filesDateFilter"
                      value="custom"
                      checked={filesDateFilter === 'custom'}
                      onChange={(e) => setFilesDateFilter(e.target.value as 'current' | 'last' | 'custom' | 'all')}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Personalizado</span>
                  </label>
                </div>
                
                {filesDateFilter === 'custom' && (
                  <div className="flex space-x-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
                      <input
                        type="month"
                        value={filesCustomStartDate}
                        onChange={(e) => setFilesCustomStartDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
                      <input
                        type="month"
                        value={filesCustomEndDate}
                        onChange={(e) => setFilesCustomEndDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Files Table */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arquivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tamanho
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Downloads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(filesDateFilter === 'all' ? uploadedFiles : filteredFiles).map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{file.fileName}</div>
                          <div className="text-sm text-gray-500">{file.fileType || 'PDF'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof file.size === 'string' ? file.size : formatFileSize(file.size || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{formatDate(file.uploadDate)}</div>
                          <div className="text-sm text-gray-500">{file.uploadedBy}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={file.status}
                          onChange={(e) => handleFileStatusChange(file.id, e.target.value as any)}
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${
                            file.status === 'approved' || file.status === 'available'
                              ? 'bg-green-100 text-green-800'
                              : file.status === 'processed'
                              ? 'bg-yellow-100 text-yellow-800'
                              : file.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="pending">Pendente</option>
                          <option value="approved">Aprovado</option>
                          <option value="rejected">Rejeitado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.downloadCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleFileView(file.fileName, file.fileType)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Visualizar"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleFileDownload(file.fileName)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Download"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NFe Uploads Section */}
        {activeTab === 'nfe' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Uploads de NFe dos Parceiros
                </h3>
                
                {/* Filtros de Data para NFe */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Filtrar por data de upload:</span>
                    </div>
                    
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="nfeDateFilter"
                          value="all"
                          checked={nfeDateFilter === 'all'}
                          onChange={(e) => setNfeDateFilter(e.target.value as 'current' | 'last' | 'custom' | 'all')}
                          className="mr-2 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Todos</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="nfeDateFilter"
                          value="current"
                          checked={nfeDateFilter === 'current'}
                          onChange={(e) => setNfeDateFilter(e.target.value as 'current' | 'last' | 'custom' | 'all')}
                          className="mr-2 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Mês Atual</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="nfeDateFilter"
                          value="last"
                          checked={nfeDateFilter === 'last'}
                          onChange={(e) => setNfeDateFilter(e.target.value as 'current' | 'last' | 'custom' | 'all')}
                          className="mr-2 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Mês Passado</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="nfeDateFilter"
                          value="custom"
                          checked={nfeDateFilter === 'custom'}
                          onChange={(e) => setNfeDateFilter(e.target.value as 'current' | 'last' | 'custom' | 'all')}
                          className="mr-2 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Personalizado</span>
                      </label>
                    </div>
                    
                    {nfeDateFilter === 'custom' && (
                      <div className="flex space-x-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
                          <input
                            type="month"
                            value={nfeCustomStartDate}
                            onChange={(e) => setNfeCustomStartDate(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
                          <input
                            type="month"
                            value={nfeCustomEndDate}
                            onChange={(e) => setNfeCustomEndDate(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parceiro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Arquivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Upload
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(nfeDateFilter === 'all' ? nfeUploads : filteredNfeUploads).map((nfe) => (
                        <tr key={nfe.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {users.find(u => u.id.toString() === nfe.partnerId.toString())?.name || 'Parceiro não encontrado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {nfe.fileName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              nfe.fileType === 'xml' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {nfe.fileType.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(nfe.uploadDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              nfe.status === 'processed' ? 'bg-green-100 text-green-800' :
                              nfe.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {nfe.status === 'processed' ? 'Processado' :
                               nfe.status === 'processing' ? 'Processando' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleFileDownload(nfe.fileName, nfe.partnerId.toString())}
                                className="text-blue-600 hover:text-blue-900"
                                title="Download"
                              >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                              </button>
                              <button
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Visualizar"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
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

        {/* Notifications Section */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Gerenciar Notificações
                  </h3>
                  <button
                    onClick={() => setShowNotificationModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <BellIcon className="h-4 w-4 mr-2" />
                    Nova Notificação
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Destinatário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {notifications.map((notification) => (
                        <tr key={notification.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {notification.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {notification.recipientType === 'all' ? 'Todos os parceiros' :
                             users.find(u => u.id.toString() === notification.recipientId)?.name || 'Usuário não encontrado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                              notification.type === 'success' ? 'bg-green-100 text-green-800' :
                              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {notification.type === 'info' ? 'Informação' :
                               notification.type === 'success' ? 'Sucesso' :
                               notification.type === 'warning' ? 'Aviso' : 'Erro'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              notification.isRead ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {notification.isRead ? 'Lida' : 'Não lida'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              notification.emailSent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.emailSent ? 'Enviado' : 'Não enviado'}
                            </span>
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
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={editingUser ? editingUser.name : newUser.name}
                    onChange={(e) => editingUser 
                      ? setEditingUser({...editingUser, name: e.target.value})
                      : setNewUser({...newUser, name: e.target.value})
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editingUser ? editingUser.email : newUser.email}
                    onChange={(e) => editingUser 
                      ? setEditingUser({...editingUser, email: e.target.value})
                      : setNewUser({...newUser, email: e.target.value})
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Função</label>
                  <select
                    value={editingUser ? (editingUser as any).roleId || editingUser.role : newUser.roleId || newUser.role}
                    onChange={(e) => {
                      const selectedRole = roles.find(r => r.id === e.target.value)
                      if (editingUser) {
                        setEditingUser({
                          ...editingUser,
                          roleId: selectedRole?.id || '',
                          role: selectedRole?.name.toLowerCase().includes('admin') ? 'admin' : selectedRole?.name.toLowerCase().includes('gerente') ? 'manager' : 'partner'
                        } as any)
                      } else {
                        setNewUser({
                          ...newUser,
                          roleId: selectedRole?.id || '',
                          role: selectedRole?.name.toLowerCase().includes('admin') ? 'admin' : selectedRole?.name.toLowerCase().includes('gerente') ? 'manager' : 'partner'
                        })
                      }
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Selecione uma função</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.is_system ? '(Sistema)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {(newUser.role === 'partner' || (editingUser && editingUser.role === 'partner')) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gerente Responsável</label>
                      <select
                        value={editingUser ? (editingUser as any).managerId || '' : newUser.managerId}
                        onChange={(e) => editingUser 
                          ? setEditingUser({...editingUser, managerId: e.target.value} as any)
                          : setNewUser({...newUser, managerId: e.target.value})
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Selecione um gerente</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tabelas de Remuneração</label>
                        <div className="mt-1 space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                          {remunerationTables.map((table) => {
                            const selectedIds = editingUser ? (editingUser as any).remunerationTableIds || [(editingUser as any).remunerationTableId] || [1] : newUser.remunerationTableIds;
                            const isSelected = selectedIds.includes(table.id);
                            
                            return (
                              <label key={table.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const currentIds = editingUser ? (editingUser as any).remunerationTableIds || [(editingUser as any).remunerationTableId] || [1] : newUser.remunerationTableIds;
                                    let newIds;
                                    
                                    if (e.target.checked) {
                                      newIds = [...currentIds, table.id];
                                    } else {
                                      newIds = currentIds.filter((id: number) => id !== table.id);
                                      // Garantir que pelo menos uma tabela esteja selecionada
                                      if (newIds.length === 0) {
                                        newIds = [remunerationTables[0]?.id || 1];
                                      }
                                    }
                                    
                                    if (editingUser) {
                                      setEditingUser({...editingUser, remunerationTableIds: newIds} as any);
                                    } else {
                                      setNewUser({...newUser, remunerationTableIds: newIds});
                                    }
                                  }}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">
                                  {table.employeeRangeEnd ? `${table.employeeRangeStart} a ${table.employeeRangeEnd} funcionários` : `A partir de ${table.employeeRangeStart} funcionários`} - {formatTableValue(table, 'finalFinderCashback')}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {currentUser?.role === 'admin' ? 'Apenas administradores podem alterar as tabelas de remuneração' : 'Gerentes podem alterar a tabela aplicada ao parceiro'}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Senha</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUserModal(false)
                    setEditingUser(null)
                    setNewUser({ email: '', name: '', role: 'partner', roleId: '', password: '', managerId: '', remunerationTableIds: [1] })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {editingUser ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upload de Relatório para Parceiro
              </h3>
              <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700">Selecionar Parceiro</label>
                   <select
                     value={selectedPartnerId}
                     onChange={(e) => setSelectedPartnerId(e.target.value)}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                   >
                     <option value="">Escolha um parceiro...</option>
                     {users.filter(user => user.role === 'partner').map(partner => (
                       <option key={partner.id} value={partner.id.toString()}>
                         {partner.name} ({partner.email})
                       </option>
                     ))}
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700">Mês de Referência</label>
                     <select
                       value={selectedMonth}
                       onChange={(e) => setSelectedMonth(e.target.value)}
                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                     >
                       <option value="">Selecione o mês...</option>
                       <option value="1">Janeiro</option>
                       <option value="2">Fevereiro</option>
                       <option value="3">Março</option>
                       <option value="4">Abril</option>
                       <option value="5">Maio</option>
                       <option value="6">Junho</option>
                       <option value="7">Julho</option>
                       <option value="8">Agosto</option>
                       <option value="9">Setembro</option>
                       <option value="10">Outubro</option>
                       <option value="11">Novembro</option>
                       <option value="12">Dezembro</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">Ano de Referência</label>
                     <select
                       value={selectedYear}
                       onChange={(e) => setSelectedYear(e.target.value)}
                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                     >
                       {Array.from({length: 5}, (_, i) => {
                         const year = new Date().getFullYear() - i
                         return (
                           <option key={year} value={year.toString()}>
                             {year}
                           </option>
                         )
                       })}
                     </select>
                   </div>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Arquivo do Relatório</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFile(null)
                    setSelectedPartnerId('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadReport}
                  disabled={!selectedFile || !selectedPartnerId}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Enviar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remuneration Modal */}
      {showRemunerationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRemuneration ? 'Editar Tabela de Remuneração' : 'Nova Tabela de Remuneração'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Funcionários - Inicial</label>
                    <input
                      type="number"
                      value={newRemuneration.employeeRangeStart}
                      onChange={(e) => setNewRemuneration({...newRemuneration, employeeRangeStart: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Ex: 50"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Funcionários - Final</label>
                    <input
                      type="number"
                      value={newRemuneration.employeeRangeEnd}
                      onChange={(e) => setNewRemuneration({...newRemuneration, employeeRangeEnd: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Ex: 200 (deixe vazio para 'A partir de')"
                      min="1"
                    />
                  </div>
                </div>
                
                {/* Value Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Valor</label>
                  <div className="flex rounded-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => setNewRemuneration({...newRemuneration, valueType: 'currency'})}
                      className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                        newRemuneration.valueType === 'currency'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      R$ (Reais)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRemuneration({...newRemuneration, valueType: 'percentage'})}
                      className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                        newRemuneration.valueType === 'percentage'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      % (Porcentagem)
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Margem de Negociação Finder ({newRemuneration.valueType === 'currency' ? 'R$' : '%'})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRemuneration.finderNegotiationMargin}
                    onChange={(e) => setNewRemuneration({...newRemuneration, finderNegotiationMargin: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ex: 12.00"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cashback Máximo Empresa ({newRemuneration.valueType === 'currency' ? 'R$' : '%'})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRemuneration.maxCompanyCashback}
                    onChange={(e) => setNewRemuneration({...newRemuneration, maxCompanyCashback: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ex: 5.00"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cashback Final Finder ({newRemuneration.valueType === 'currency' ? 'R$' : '%'})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRemuneration.finalFinderCashback}
                    onChange={(e) => setNewRemuneration({...newRemuneration, finalFinderCashback: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Ex: 7.00"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
                  <textarea
                    value={newRemuneration.description}
                    onChange={(e) => setNewRemuneration({...newRemuneration, description: e.target.value})}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Descrição adicional sobre esta faixa de funcionários"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRemunerationModal(false);
                    setEditingRemuneration(null);
                    setNewRemuneration({
                      employeeRangeStart: '',
                      employeeRangeEnd: '',
                      finderNegotiationMargin: '',
                      maxCompanyCashback: '',
                      finalFinderCashback: '',
                      description: '',
                      valueType: 'currency'
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateRemuneration}
                  disabled={!newRemuneration.employeeRangeStart || !newRemuneration.finderNegotiationMargin || !newRemuneration.maxCompanyCashback || !newRemuneration.finalFinderCashback}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {editingRemuneration ? 'Atualizar Tabela' : 'Criar Tabela'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Nova Notificação
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Digite o título da notificação"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mensagem</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Digite a mensagem da notificação"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({...newNotification, type: e.target.value as any})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="info">Informação</option>
                    <option value="success">Sucesso</option>
                    <option value="warning">Aviso</option>
                    <option value="error">Erro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destinatário</label>
                  <select
                    value={newNotification.recipientType === 'all' ? 'all' : newNotification.recipientId || ''}
                    onChange={(e) => {
                      if (e.target.value === 'all') {
                        setNewNotification({...newNotification, recipientType: 'all', recipientId: ''});
                      } else {
                        setNewNotification({...newNotification, recipientType: 'specific', recipientId: e.target.value});
                      }
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="all">Todos os parceiros</option>
                    {users.filter(user => user.role === 'partner').map(partner => (
                      <option key={partner.id} value={partner.id.toString()}>
                        {partner.name} ({partner.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={newNotification.emailSent}
                    onChange={(e) => setNewNotification({...newNotification, emailSent: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-900">
                    Enviar também por email
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNewNotification({
                      title: '',
                      message: '',
                      type: 'info',
                      recipientType: 'all',
                      recipientId: '',
                      emailSent: false
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateNotification}
                  disabled={!newNotification.title || !newNotification.message}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Enviar Notificação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
  )
}