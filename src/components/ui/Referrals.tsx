import { useState, useEffect } from 'react'
import { UserPlusIcon, BuildingOfficeIcon, MagnifyingGlassIcon, CheckCircleIcon, ClockIcon, XCircleIcon, DocumentArrowUpIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
// Removido: import HubSpotService from '../../services/hubspot'
import { getCurrentUser } from '../../services/auth'
import { API_URL } from '../../config/api'
import { fetchCNPJData, formatCNPJ, validateCNPJ, mapCNAEToSegment, estimateEmployeesByPorte } from '../../services/cnpjService'

interface Prospect {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  cnpj: string
  employees: string
  segment: string
  status: 'pending' | 'validated' | 'in-analysis' | 'approved' | 'rejected'
  partnerId?: string
  adminValidation?: {
    isValidated: boolean
    validatedBy: string
    validatedAt: string
    notes: string
    isApproved: boolean
  }
}

interface ProductValue {
  product: string
  totalLives?: number
  benefitDetails?: {
    vt?: number
    vr?: number
    premiacao?: number
    gestaoCorporativa?: number
  }
}

interface PortfolioClient {
  id: string
  companyName: string
  cnpj: string
  employeeCount: number
  segment: string
  currentProducts: string[]
  viabilityScore: number
  potentialProducts: string[]
  lastAnalysis: string
  potentialProductsWithValues?: ProductValue[]
  customRecommendations?: string
}

export default function Referrals() {
  const [activeTab, setActiveTab] = useState<'indicate' | 'portfolio'>('indicate')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [portfolioClients, setPortfolioClients] = useState<PortfolioClient[]>([])  
  const [portfolioFilter, setPortfolioFilter] = useState('all')
  const [selectedClient, setSelectedClient] = useState<PortfolioClient | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingClient, setEditingClient] = useState<PortfolioClient | null>(null)
  const [editingProductValues, setEditingProductValues] = useState(false)
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<string | null>(null)
  const [isEditingRecommendations, setIsEditingRecommendations] = useState(false)
  const [editingRecommendations, setEditingRecommendations] = useState<string>('')

  const [newProspect, setNewProspect] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    cnpj: '',
    employeeCount: '',
    segment: ''
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false)
  const [cnpjError, setCnpjError] = useState<string>('')

  // Função de busca de CNPJ
  const handleCNPJSearch = async (cnpj: string) => {
    // Limpar erros anteriores
    setCnpjError('')

    // Formatar CNPJ enquanto digita
    const formatted = formatCNPJ(cnpj)
    setNewProspect({ ...newProspect, cnpj: formatted })

    // Só buscar quando CNPJ estiver completo (14 dígitos)
    const cleanedCNPJ = cnpj.replace(/\D/g, '')
    if (cleanedCNPJ.length !== 14) {
      return
    }

    // Validar CNPJ
    if (!validateCNPJ(cleanedCNPJ)) {
      setCnpjError('CNPJ inválido')
      return
    }

    // Buscar dados da empresa
    setIsSearchingCNPJ(true)
    try {
      const data = await fetchCNPJData(cleanedCNPJ)

      // Preencher campos automaticamente
      setNewProspect({
        ...newProspect,
        cnpj: data.cnpj,
        companyName: data.nomeFantasia || data.razaoSocial,
        phone: data.telefone || newProspect.phone,
        email: data.email || newProspect.email,
        employeeCount: data.quantidadeFuncionarios
          ? String(data.quantidadeFuncionarios)
          : String(estimateEmployeesByPorte(data.porte)),
        segment: mapCNAEToSegment(data.atividadePrincipal)
      })

      // Mostrar mensagem de sucesso
      setCnpjError('')
    } catch (error: any) {
      console.error('Erro ao buscar CNPJ:', error)
      setCnpjError(error.message || 'Erro ao consultar CNPJ. Tente novamente.')
    } finally {
      setIsSearchingCNPJ(false)
    }
  }

  // Funções de edição
  const startEdit = (client: PortfolioClient) => {
    setEditingClient({ ...client })
    setIsEditMode(true)
  }

  const cancelEdit = () => {
    setIsEditMode(false)
    setEditingClient(null)
  }

  const saveChanges = async () => {
    if (!editingClient) return
    
    try {
      // Atualizar no backend
      const response = await fetch(`${API_URL}/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...editingClient,
          currentProducts: editingClient.currentProducts,
          viabilityScore: editingClient.viabilityScore,
          potentialProductsWithValues: editingClient.potentialProductsWithValues
        })
      })
      
      if (response.ok) {
        // Atualizar estado local
        setPortfolioClients(prev => 
          prev.map(client => 
            client.id === editingClient.id ? editingClient : client
          )
        )
        setSelectedClient(editingClient)
        setIsEditMode(false)
        setEditingClient(null)
        alert('Alterações salvas com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar alterações:', error)
      alert('Erro ao salvar alterações')
    }
  }

  const addCurrentProduct = (product: string) => {
    if (!editingClient) return
    setEditingClient({
      ...editingClient,
      currentProducts: [...(editingClient.currentProducts || []), product]
    })
  }

  const availableProducts = ['Folha de Pagamento', 'Consignado', 'Benefícios']

  const removeCurrentProduct = (index: number) => {
    if (!editingClient) return
    setEditingClient({
      ...editingClient,
      currentProducts: editingClient.currentProducts?.filter((_, i) => i !== index) || []
    })
  }

  const addPotentialProduct = (product: string) => {
    if (!editingClient) return
    
    // Adicionar produto à lista
    const updatedProducts = [...(editingClient.potentialProducts || []), product]
    
    // Inicializar valores do produto
    const productValue: ProductValue = {
      product,
      ...(product === 'Folha de Pagamento' || product === 'Consignado' 
        ? { totalLives: 0 }
        : product === 'Benefícios'
        ? { benefitDetails: { vt: 0, vr: 0, premiacao: 0, gestaoCorporativa: 0 } }
        : {})
    }
    
    const updatedProductValues = [...(editingClient.potentialProductsWithValues || []), productValue]
    
    setEditingClient({
      ...editingClient,
      potentialProducts: updatedProducts,
      potentialProductsWithValues: updatedProductValues
    })
  }

  const removePotentialProduct = (index: number) => {
    if (!editingClient) return
    
    const productToRemove = editingClient.potentialProducts?.[index]
    const updatedProducts = editingClient.potentialProducts?.filter((_, i) => i !== index) || []
    const updatedProductValues = editingClient.potentialProductsWithValues?.filter(pv => pv.product !== productToRemove) || []
    
    setEditingClient({
      ...editingClient,
      potentialProducts: updatedProducts,
      potentialProductsWithValues: updatedProductValues
    })
  }

  const updateViabilityScore = (score: number) => {
    if (!editingClient) return
    setEditingClient({
      ...editingClient,
      viabilityScore: Math.max(0, Math.min(100, score))
    })
  }

  const updateProductValue = (product: string, field: string, value: number) => {
    if (!editingClient) return
    
    const updatedProductValues = editingClient.potentialProductsWithValues?.map(pv => {
      if (pv.product === product) {
        if (field === 'totalLives') {
          return { ...pv, totalLives: value }
        } else if (pv.benefitDetails && ['vt', 'vr', 'premiacao', 'gestaoCorporativa'].includes(field)) {
          return {
            ...pv,
            benefitDetails: {
              ...pv.benefitDetails,
              [field]: value
            }
          }
        }
      }
      return pv
    }) || []
    
    setEditingClient({
      ...editingClient,
      potentialProductsWithValues: updatedProductValues
    })
  }

  const getProductValue = (product: string): ProductValue | undefined => {
    return editingClient?.potentialProductsWithValues?.find(pv => pv.product === product)
  }

  const getProductValueForDisplay = (product: string, client: PortfolioClient): ProductValue | undefined => {
    return client.potentialProductsWithValues?.find(pv => pv.product === product)
  }

  const startEditingRecommendations = () => {
    if (selectedClient) {
      const currentRecommendations = selectedClient.customRecommendations || generateAnalysisReport(selectedClient).join('\n')
      setEditingRecommendations(currentRecommendations)
      setIsEditingRecommendations(true)
    }
  }

  const cancelEditingRecommendations = () => {
    setIsEditingRecommendations(false)
    setEditingRecommendations('')
  }

  const saveRecommendations = async () => {
    if (!selectedClient) return

    try {
      const response = await fetch(`${API_URL}/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...selectedClient,
          customRecommendations: editingRecommendations
        })
      })

      if (response.ok) {
        // Atualizar estado local
        const updatedClient = { ...selectedClient, customRecommendations: editingRecommendations }
        setPortfolioClients(prev => 
          prev.map(client => 
            client.id === selectedClient.id ? updatedClient : client
          )
        )
        setSelectedClient(updatedClient)
        setIsEditingRecommendations(false)
        setEditingRecommendations('')
        alert('Recomendações salvas com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar recomendações:', error)
      alert('Erro ao salvar recomendações')
    }
  }

  // Carregar prospects existentes do backend
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Carregar usuário atual
        const user = await getCurrentUser()
        setCurrentUser(user)

        // Carregar prospects
        const response = await fetch(`${API_URL}/prospects`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          
          // Filtrar prospects por parceiro (se não for admin)
          if (user && user.role !== 'admin') {
            const userProspects = data.filter((prospect: Prospect) => prospect.partnerId === user.id.toString())
            setProspects(userProspects)
          } else {
            setProspects(data)
          }
        }

        // Carregar clientes da carteira
        const clientsResponse = await fetch(`${API_URL}/clients`, {
          credentials: 'include'
        })
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          // Converter clientes para formato de análise de carteira
          const portfolioData = clientsData
            .filter((client: any) => user?.role === 'admin' || client.partnerId === user?.id?.toString())
            .map((client: any) => ({
              id: client.id,
              companyName: client.companyName || client.name || 'Nome não informado',
              cnpj: client.cnpj || 'CNPJ não informado',
              employeeCount: parseInt(client.employees || client.employeeCount) || Math.floor(Math.random() * 500) + 50,
              segment: client.segment || 'Não informado',
              currentProducts: client.currentProducts || ['Folha de Pagamento'],
              viabilityScore: client.viabilityScore || calculateViabilityScore(client),
              potentialProducts: client.potentialProducts || getPotentialProducts(client),
              lastAnalysis: client.lastAnalysis || new Date().toISOString().split('T')[0]
            }))
          setPortfolioClients(portfolioData)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    initializeData()
  }, [])

  const handleSubmitProspect = async (e: React.FormEvent) => {
    e.preventDefault()
    const prospect: Prospect = {
      id: Date.now().toString(),
      companyName: newProspect.companyName,
      contactName: newProspect.contactName,
      email: newProspect.email,
      phone: newProspect.phone,
      cnpj: newProspect.cnpj,
      employees: newProspect.employeeCount,
      segment: newProspect.segment,
      status: 'pending',
      partnerId: currentUser?.id.toString() || '0'
    }
    
    try {
      // Salvar no backend
      const response = await fetch(`${API_URL}/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(prospect)
      })
      
      if (response.ok) {
        const savedProspect = await response.json()
        setProspects([...prospects, savedProspect])
        setNewProspect({
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          cnpj: '',
          employeeCount: '',
          segment: ''
        })
        alert('Prospect indicado com sucesso!')
      } else {
        throw new Error('Erro ao salvar prospect')
      }
    } catch (error) {
      console.error('Erro ao salvar prospect:', error)
      alert('Erro ao salvar indicação. Tente novamente.')
    }
  }

  const markAsValidated = async (prospect: Prospect) => {
    try {
      const updatedProspect = {
        ...prospect,
        status: 'validated' as const,
        adminValidation: {
          isValidated: true,
          validatedBy: currentUser?.name || 'Admin',
          validatedAt: new Date().toISOString(),
          notes: 'Validado manualmente pelo administrador',
          isApproved: true
        }
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
        alert(`Indicação de ${prospect.companyName} validada com sucesso! Agora seguirá para análise de carteira.`)
        
        // Automaticamente mover para análise após validação
        setTimeout(() => {
          moveToAnalysis(updatedProspect)
        }, 2000)
      }
    } catch (error) {
      console.error('Erro ao validar prospect:', error)
      alert('Erro ao validar indicação. Tente novamente.')
    }
  }

  const moveToAnalysis = async (prospect: Prospect) => {
    try {
      const updatedProspect = {
        ...prospect,
        status: 'in-analysis' as const
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
      }
    } catch (error) {
      console.error('Erro ao mover para análise:', error)
    }
  }

  const approveProspect = async (prospect: Prospect) => {
    try {
      // Atualizar status do prospect para aprovado
      const updatedProspect = {
        ...prospect,
        status: 'approved' as const
      }

      const prospectResponse = await fetch(`${API_URL}/prospects/${prospect.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updatedProspect)
      })

      if (prospectResponse.ok) {
        // Criar cliente baseado no prospect aprovado
        const newClient = {
          id: Date.now().toString(),
          name: prospect.companyName,
          cnpj: prospect.cnpj,
          status: 'active',
          stage: 'prospeccao',
          temperature: 'morno',
          totalLives: 0,
          contractEndDate: '',
          lastUpdated: new Date().toISOString(),
          partnerId: prospect.partnerId,
          contactName: prospect.contactName,
          email: prospect.email,
          phone: prospect.phone,
          employees: prospect.employees,
          segment: prospect.segment
        }

        const clientResponse = await fetch(`${API_URL}/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(newClient)
        })

        if (clientResponse.ok) {
          setProspects(prev => prev.map(p => 
            p.id === prospect.id ? updatedProspect : p
          ))
          alert(`Prospect ${prospect.companyName} aprovado e movido para área de clientes!`)
        }
      }
    } catch (error) {
      console.error('Erro ao aprovar prospect:', error)
      alert('Erro ao aprovar prospect. Tente novamente.')
    }
  }

  const rejectProspect = async (prospect: Prospect) => {
    try {
      const updatedProspect = {
        ...prospect,
        status: 'rejected' as const
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
        alert(`Prospect ${prospect.companyName} rejeitado.`)
      }
    } catch (error) {
      console.error('Erro ao rejeitar prospect:', error)
      alert('Erro ao rejeitar prospect. Tente novamente.')
    }
  }

  const downloadTemplate = () => {
    const headers = ['Nome da Empresa', 'Nome do Contato', 'E-mail', 'Telefone', 'CNPJ', 'Número de Funcionários', 'Segmento']
    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'modelo_indicacoes.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setIsUploading(true)

    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',')
      
      const newProspects: Prospect[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',')
        if (values.length >= 7 && values[0].trim()) {
          const prospect: Prospect = {
            id: (Date.now() + i).toString(),
            companyName: values[0].trim(),
            contactName: values[1].trim(),
            email: values[2].trim(),
            phone: values[3].trim(),
            cnpj: values[4].trim(),
            employees: values[5].trim(),
            segment: values[6].trim(),
            status: 'pending',
            partnerId: currentUser?.id.toString() || '0'
          }
          newProspects.push(prospect)
        }
      }
      
      // Salvar todos os prospects no backend
      const savedProspects = []
      for (const prospect of newProspects) {
        try {
          const response = await fetch(`${API_URL}/prospects`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(prospect)
          })
          
          if (response.ok) {
            const savedProspect = await response.json()
            savedProspects.push(savedProspect)
          }
        } catch (error) {
          console.error('Erro ao salvar prospect:', error)
        }
      }
      
      setProspects([...prospects, ...savedProspects])
      alert(`${savedProspects.length} indicações importadas com sucesso!`)
      setSelectedFile(null)
      e.target.value = ''
    } catch (error) {
      alert('Erro ao processar arquivo. Verifique o formato e tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'in-analysis':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'validated':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado'
      case 'rejected':
        return 'Rejeitado'
      case 'in-analysis':
        return 'Em Análise'
      case 'validated':
        return 'Validado'
      default:
        return 'Pendente'
    }
  }

  const getValidationStatusIcon = (validation?: Prospect['adminValidation'], status?: string) => {
    if (status === 'approved') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" title="Aprovado" />
    }
    if (status === 'rejected') {
      return <XCircleIcon className="h-5 w-5 text-red-500" title="Rejeitado" />
    }
    if (status === 'in-analysis') {
      return <ClockIcon className="h-5 w-5 text-orange-500" title="Em análise" />
    }
    if (status === 'validated') {
      return <CheckCircleIcon className="h-5 w-5 text-blue-500" title="Validado" />
    }
    if (!validation || !validation.isValidated) {
      return <ClockIcon className="h-5 w-5 text-gray-400" title="Aguardando validação" />
    }
    
    if (validation.isApproved) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" title="Validado e aprovado" />
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-500" title="Validado mas rejeitado" />
    }
  }

  const getValidationStatusText = (validation?: Prospect['adminValidation'], status?: string) => {
    if (status === 'approved') {
      return 'Aprovado'
    }
    if (status === 'rejected') {
      return 'Rejeitado'
    }
    if (status === 'in-analysis') {
      return 'Em Análise'
    }
    if (status === 'validated') {
      return 'Validado'
    }
    if (!validation || !validation.isValidated) {
      return 'Aguardando validação'
    }
    
    if (validation.isApproved) {
      return 'Validado'
    } else {
      return 'Rejeitado'
    }
  }

  const calculateViabilityScore = (client: any) => {
    let score = 50 // Base score
    
    // Pontuação baseada no número de funcionários
    const employees = parseInt(client.employees) || 0
    if (employees > 500) score += 30
    else if (employees > 100) score += 20
    else if (employees > 50) score += 10
    
    // Pontuação baseada no segmento
    const highValueSegments = ['Tecnologia', 'Indústria', 'Saúde']
    if (highValueSegments.includes(client.segment)) score += 15
    
    // Pontuação baseada no status do cliente
    if (client.status === 'active') score += 10
    
    return Math.min(score, 100)
  }

  const getPotentialProducts = (client: any) => {
    const allProducts = ['Folha de Pagamento', 'Consignado', 'Benefícios']
    
    const currentProducts = client.currentProducts || ['Folha de Pagamento']
    const potential = allProducts.filter(product => !currentProducts.includes(product))
    
    // Retorna até 3 produtos potenciais baseado no perfil
    const employees = parseInt(client.employees) || 0
    if (employees > 100) {
      return potential.slice(0, 3)
    } else if (employees > 50) {
      return potential.slice(0, 2)
    } else {
      return potential.slice(0, 1)
    }
  }

  const getViabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const analyzeClient = (client: PortfolioClient) => {
    setSelectedClient(client)
    setShowAnalysisModal(true)
  }

  const getFilteredPortfolioClients = () => {
    if (portfolioFilter === 'all') return portfolioClients
    if (portfolioFilter === 'high') return portfolioClients.filter(c => c.viabilityScore >= 80)
    if (portfolioFilter === 'medium') return portfolioClients.filter(c => c.viabilityScore >= 60 && c.viabilityScore < 80)
    if (portfolioFilter === 'low') return portfolioClients.filter(c => c.viabilityScore < 60)
    return portfolioClients.filter(c => c.segment === portfolioFilter)
  }

  const generateAnalysisReport = (client: PortfolioClient) => {
    const recommendations = []
    
    if (client.employeeCount > 100 && !client.currentProducts.includes('Departamento Pessoal')) {
      recommendations.push('Departamento Pessoal: Alto potencial devido ao número de funcionários')
    }
    
    if (client.segment === 'Indústria' && !client.currentProducts.includes('Segurança do Trabalho')) {
      recommendations.push('Segurança do Trabalho: Essencial para empresas industriais')
    }
    
    if (client.employeeCount > 50 && !client.currentProducts.includes('Medicina do Trabalho')) {
      recommendations.push('Medicina do Trabalho: Obrigatório para empresas com mais de 50 funcionários')
    }
    
    return recommendations
  }

  const generateCommercialProposalPDF = async (client: PortfolioClient) => {
    const jsPDF = (await import('jspdf')).default
    const doc = new jsPDF()
    const productValues = client.potentialProductsWithValues || []
    
    // Configurações de cores baseadas no anexo
    const primaryColor: [number, number, number] = [102, 45, 145] // Roxo principal
    const secondaryColor: [number, number, number] = [255, 255, 255] // Branco
    const accentColor: [number, number, number] = [255, 165, 0] // Laranja
    
    // Header com fundo roxo
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 210, 60, 'F')
    
    // Logo e título (simulado)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('somapay', 20, 25)
    
    // Balão de proposta comercial
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(130, 15, 70, 20, 5, 5, 'F')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text('Proposta Comercial', 135, 22)
    doc.text('Seguro Segurança', 135, 28)
    
    // Título principal
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text('Tudo em', 20, 45)
    doc.text('um só lugar', 20, 55)
    
    // Subtítulo
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Uma solução completa para sua empresa', 20, 70)
    doc.text('Benefícios e crédito para seus colaboradores', 20, 78)
    
    // Seção de gestão de pagamentos
    let yPos = 95
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Gestão de pagamentos de ponta a ponta', 20, yPos)
    
    yPos += 8
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Cartão pré-pago para sua folha de pagamento', 20, yPos)
    
    // Informações da empresa
    yPos += 20
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('DADOS DA EMPRESA', 20, yPos)
    
    yPos += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Empresa: ${client.companyName}`, 20, yPos)
    yPos += 6
    doc.text(`CNPJ: ${client.cnpj}`, 20, yPos)
    yPos += 6
    doc.text(`Segmento: ${client.segment}`, 20, yPos)
    yPos += 6
    doc.text(`Número de Funcionários: ${client.employeeCount}`, 20, yPos)
    
    // Produtos recomendados
    if (productValues.length > 0) {
      yPos += 15
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('PRODUTOS RECOMENDADOS', 20, yPos)
      
      productValues.forEach(pv => {
        if (pv.product === 'Folha de Pagamento' && pv.totalLives && pv.totalLives > 0) {
          yPos += 12
          doc.setFillColor(...accentColor)
          doc.circle(25, yPos - 2, 2, 'F')
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text('FOLHA DE PAGAMENTO', 30, yPos)
          yPos += 6
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.text(`Total de vidas: ${pv.totalLives}`, 35, yPos)
          yPos += 4
          doc.text('Gestão completa da folha de pagamento', 35, yPos)
          yPos += 4
          doc.text('Cartão pré-pago integrado', 35, yPos)
        }
        
        if (pv.product === 'Consignado' && pv.totalLives && pv.totalLives > 0) {
          yPos += 12
          doc.setFillColor(...accentColor)
          doc.circle(25, yPos - 2, 2, 'F')
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text('CONSIGNADO', 30, yPos)
          yPos += 6
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.text(`Total de vidas: ${pv.totalLives}`, 35, yPos)
          yPos += 4
          doc.text('Crédito consignado para colaboradores', 35, yPos)
          yPos += 4
          doc.text('Taxas competitivas', 35, yPos)
        }
        
        if (pv.product === 'Benefícios' && pv.benefitDetails) {
          yPos += 12
          doc.setFillColor(...accentColor)
          doc.circle(25, yPos - 2, 2, 'F')
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text('BENEFÍCIOS', 30, yPos)
          yPos += 6
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          
          if (pv.benefitDetails.vt && pv.benefitDetails.vt > 0) {
            doc.text(`Vale Transporte: ${pv.benefitDetails.vt} colaboradores`, 35, yPos)
            yPos += 4
          }
          if (pv.benefitDetails.vr && pv.benefitDetails.vr > 0) {
            doc.text(`Vale Refeição: ${pv.benefitDetails.vr} colaboradores`, 35, yPos)
            yPos += 4
          }
          if (pv.benefitDetails.premiacao && pv.benefitDetails.premiacao > 0) {
            doc.text(`Premiação: ${pv.benefitDetails.premiacao} colaboradores`, 35, yPos)
            yPos += 4
          }
          if (pv.benefitDetails.gestaoCorporativa && pv.benefitDetails.gestaoCorporativa > 0) {
            doc.text(`Gestão Corporativa: ${pv.benefitDetails.gestaoCorporativa} colaboradores`, 35, yPos)
            yPos += 4
          }
        }
      })
    }
    
    // Nova página se necessário
    if (yPos > 250) {
      doc.addPage()
      yPos = 30
    }
    
    // Vantagens
    yPos += 15
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('VANTAGENS', 20, yPos)
    
    const advantages = [
      'Centralização de todos os processos',
      'Redução de custos operacionais',
      'Maior controle e transparência',
      'Segurança e compliance',
      'Suporte especializado'
    ]
    
    advantages.forEach(advantage => {
      yPos += 8
      doc.setFillColor(...accentColor)
      doc.circle(25, yPos - 2, 2, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(advantage, 30, yPos)
    })
    
    // Próximos passos
    yPos += 15
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PRÓXIMOS PASSOS', 20, yPos)
    
    const steps = [
      'Análise detalhada das necessidades',
      'Apresentação da solução personalizada',
      'Implementação e treinamento',
      'Acompanhamento contínuo'
    ]
    
    steps.forEach((step, index) => {
      yPos += 8
      doc.setFillColor(...accentColor)
      doc.circle(25, yPos - 2, 2, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`${index + 1}. ${step}`, 30, yPos)
    })
    
    // Footer
    yPos += 20
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Entre em contato para mais informações e agendamento de reunião.', 20, yPos)
    
    yPos += 10
    doc.setFont('helvetica', 'bold')
    doc.text('Atenciosamente,', 20, yPos)
    yPos += 6
    doc.text('Equipe SomaPay', 20, yPos)
    
    return doc
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Indicações</h1>
          <p className="mt-2 text-sm text-gray-700">
            Indique novos prospects ou analise a viabilidade de prospecção da sua carteira atual.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('indicate')}
              className={`${
                activeTab === 'indicate'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } flex items-center whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`}
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Indicar Prospect
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`${
                activeTab === 'portfolio'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } flex items-center whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`}
            >
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Análise de Carteira
            </button>
          </nav>
        </div>
      </div>

      {/* Indicações Tab */}
      {activeTab === 'indicate' && (
        <div className="mt-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de Indicação */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Indicação</h3>
              
              {/* Seção de Upload de Planilha - Apenas para Gerentes e Administradores */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Importar Indicações via Planilha</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Baixar Modelo
                    </button>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          isUploading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-orange-600 hover:bg-orange-700 cursor-pointer'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
                      >
                        <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                        {isUploading ? 'Processando...' : 'Enviar Planilha'}
                      </label>
                    </div>
                  </div>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Formatos aceitos: CSV, Excel (.xlsx, .xls). Use o modelo para garantir a formatação correta.
                  </p>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Ou preencha manualmente:</h4>
              </div>
              
              <form onSubmit={handleSubmitProspect} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                  <input
                    type="text"
                    required
                    value={newProspect.companyName}
                    onChange={(e) => setNewProspect({...newProspect, companyName: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome do Contato</label>
                  <input
                    type="text"
                    required
                    value={newProspect.contactName}
                    onChange={(e) => setNewProspect({...newProspect, contactName: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail</label>
                  <input
                    type="email"
                    required
                    value={newProspect.email}
                    onChange={(e) => setNewProspect({...newProspect, email: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    type="tel"
                    required
                    value={newProspect.phone}
                    onChange={(e) => setNewProspect({...newProspect, phone: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CNPJ
                    <span className="text-xs text-gray-500 ml-2">(Preenche dados automaticamente)</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      required
                      value={newProspect.cnpj}
                      onChange={(e) => handleCNPJSearch(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className={`block w-full rounded-md shadow-sm sm:text-sm pr-24 ${
                        cnpjError
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                    />
                    {isSearchingCNPJ && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {!isSearchingCNPJ && newProspect.cnpj && validateCNPJ(newProspect.cnpj) && !cnpjError && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {cnpjError && (
                    <p className="mt-1 text-sm text-red-600">{cnpjError}</p>
                  )}
                  {isSearchingCNPJ && (
                    <p className="mt-1 text-sm text-indigo-600">Buscando dados da empresa...</p>
                  )}
                  {!isSearchingCNPJ && newProspect.cnpj && validateCNPJ(newProspect.cnpj) && !cnpjError && newProspect.companyName && (
                    <p className="mt-1 text-sm text-green-600">✓ Dados carregados automaticamente</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número de Funcionários</label>
                  <input
                    type="number"
                    required
                    value={newProspect.employeeCount}
                    onChange={(e) => setNewProspect({...newProspect, employeeCount: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Segmento</label>
                  <select
                    required
                    value={newProspect.segment}
                    onChange={(e) => setNewProspect({...newProspect, segment: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Selecione um segmento</option>
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Comércio">Comércio</option>
                    <option value="Indústria">Indústria</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Educação">Educação</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Enviar Indicação
                </button>
              </form>
            </div>

            {/* Lista de Indicações */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Minhas Indicações</h3>
                <p className="text-sm text-gray-600 mt-1">Gerencie suas indicações e acompanhe o processo de validação.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Viabilidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prospects.map((prospect) => (
                      <tr key={prospect.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{prospect.companyName}</div>
                            <div className="text-sm text-gray-500">{prospect.segment} • {prospect.employees} funcionários</div>
                            <div className="text-sm text-gray-500">{prospect.cnpj}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{prospect.contactName}</div>
                            <div className="text-sm text-gray-500">{prospect.email}</div>
                            <div className="text-sm text-gray-500">{prospect.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(prospect.status)}
                            <span className="ml-2 text-sm text-gray-600">{getStatusText(prospect.status)}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
            {new Date().toLocaleDateString('pt-BR')}
          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getValidationStatusIcon(prospect.adminValidation, prospect.status)}
                            <span className="ml-2 text-sm text-gray-600">{getValidationStatusText(prospect.adminValidation, prospect.status)}</span>
                          </div>
                          {prospect.adminValidation?.validatedAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(prospect.adminValidation.validatedAt).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-400">-</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {currentUser?.role === 'admin' ? (
                            <div className="flex space-x-2">
                              {prospect.status === 'pending' && (
                                <button
                                  onClick={() => markAsValidated(prospect)}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                                  title="Validar indicação manualmente"
                                >
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Validar
                                </button>
                              )}
                              {prospect.status === 'in-analysis' && (
                                <>
                                  <button
                                    onClick={() => approveProspect(prospect)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    title="Aprovar e mover para clientes"
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => rejectProspect(prospect)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                    title="Rejeitar prospect"
                                  >
                                    <XMarkIcon className="h-4 w-4 mr-1" />
                                    Rejeitar
                                  </button>
                                </>
                              )}
                              {prospect.status === 'validated' && (
                                <span className="inline-flex items-center px-3 py-2 text-sm text-blue-600">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Validado
                                </span>
                              )}
                              {prospect.status === 'approved' && (
                                <span className="inline-flex items-center px-3 py-2 text-sm text-green-600">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Aprovado
                                </span>
                              )}
                              {prospect.status === 'rejected' && (
                                <span className="inline-flex items-center px-3 py-2 text-sm text-red-600">
                                  <XMarkIcon className="h-4 w-4 mr-1" />
                                  Rejeitado
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {prospects.length === 0 && (
                  <div className="text-center py-12">
                    <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma indicação</h3>
                    <p className="mt-1 text-sm text-gray-500">Comece criando sua primeira indicação.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Análise de Carteira Tab */}
      {activeTab === 'portfolio' && (
        <div className="mt-8">
          {/* Filtros e Estatísticas */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Análise de Viabilidade da Carteira</h3>
              <p className="text-sm text-gray-600 mt-1">Verifique o potencial de cross-sell e up-sell dos seus clientes atuais.</p>
            </div>
            
            {/* Filtros */}
            <div className="px-6 py-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setPortfolioFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    portfolioFilter === 'all'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos ({portfolioClients.length})
                </button>
                <button
                  onClick={() => setPortfolioFilter('high')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    portfolioFilter === 'high'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alta Viabilidade ({portfolioClients.filter(c => c.viabilityScore >= 80).length})
                </button>
                <button
                  onClick={() => setPortfolioFilter('medium')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    portfolioFilter === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Média Viabilidade ({portfolioClients.filter(c => c.viabilityScore >= 60 && c.viabilityScore < 80).length})
                </button>
                <button
                  onClick={() => setPortfolioFilter('low')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    portfolioFilter === 'low'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Baixa Viabilidade ({portfolioClients.filter(c => c.viabilityScore < 60).length})
                </button>
              </div>
              
              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {portfolioClients.reduce((sum, client) => sum + client.potentialProducts.length, 0)}
                  </div>
                  <div className="text-sm text-blue-600">Oportunidades Totais</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(portfolioClients.reduce((sum, client) => sum + client.viabilityScore, 0) / portfolioClients.length || 0)}%
                  </div>
                  <div className="text-sm text-green-600">Viabilidade Média</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {portfolioClients.filter(c => c.viabilityScore >= 80).length}
                  </div>
                  <div className="text-sm text-purple-600">Clientes Prioritários</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    R$ {(portfolioClients.filter(c => c.viabilityScore >= 80).length * 15000).toLocaleString()}
                  </div>
                  <div className="text-sm text-orange-600">Potencial de Receita</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Clientes da Carteira</h3>
              <p className="text-sm text-gray-600 mt-1">Análise detalhada de oportunidades por cliente.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produtos Atuais
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Viabilidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produtos Potenciais
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredPortfolioClients().map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.companyName}</div>
                          <div className="text-sm text-gray-500">{client.segment} • {client.employeeCount} funcionários</div>
                          <div className="text-sm text-gray-500">{client.cnpj}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {client.currentProducts.map((product, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getViabilityColor(client.viabilityScore)}`}>
                            {client.viabilityScore}%
                          </span>
                          {client.viabilityScore >= 80 && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              🎯 Prioritário
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {client.potentialProducts.slice(0, 2).map((product, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {product}
                            </span>
                          ))}
                          {client.potentialProducts.length > 2 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{client.potentialProducts.length - 2} mais
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => analyzeClient(client)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                        >
                          <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                          Analisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {getFilteredPortfolioClients().length === 0 && (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">Ajuste os filtros para ver mais resultados.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Análise Detalhada */}
      {showAnalysisModal && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Análise Detalhada - {selectedClient.companyName}
                </h3>
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informações da Empresa</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">CNPJ:</span>
                      <span className="ml-2 font-medium">{selectedClient.cnpj}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Segmento:</span>
                      <span className="ml-2 font-medium">{selectedClient.segment}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Funcionários:</span>
                      <span className="ml-2 font-medium">{selectedClient.employeeCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Última Análise:</span>
                      <span className="ml-2 font-medium">{new Date(selectedClient.lastAnalysis).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Score de Viabilidade */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Score de Viabilidade</h4>
                    {isEditMode && (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingClient?.viabilityScore ?? 0}
                         onChange={(e) => updateViabilityScore(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    )}
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          (isEditMode ? (editingClient?.viabilityScore ?? 0) : selectedClient.viabilityScore) >= 80 ? 'bg-green-500' :
                           (isEditMode ? (editingClient?.viabilityScore ?? 0) : selectedClient.viabilityScore) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${isEditMode ? (editingClient?.viabilityScore ?? 0) : selectedClient.viabilityScore}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-lg font-bold">{isEditMode ? (editingClient?.viabilityScore ?? 0) : selectedClient.viabilityScore}%</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {(isEditMode ? (editingClient?.viabilityScore ?? 0) : selectedClient.viabilityScore) >= 80 ? 'Excelente potencial para novos produtos' :
                      (isEditMode ? (editingClient?.viabilityScore ?? 0) : selectedClient.viabilityScore) >= 60 ? 'Bom potencial com algumas oportunidades' :
                     'Potencial limitado, focar em relacionamento'}
                  </p>
                </div>

                {/* Produtos Atuais */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Produtos Atuais</h4>
                    {isEditMode && (
                      <select
                        onChange={(e) => {
                          if (e.target.value && !editingClient?.currentProducts?.includes(e.target.value)) {
                            addCurrentProduct(e.target.value)
                            e.target.value = ''
                          }
                        }}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        <option value="">+ Adicionar</option>
                        {availableProducts
                          .filter(product => !editingClient?.currentProducts?.includes(product))
                          .map(product => (
                            <option key={product} value={product}>{product}</option>
                          ))
                        }
                      </select>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(isEditMode ? editingClient?.currentProducts : selectedClient.currentProducts)?.map((product, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {product}
                        {isEditMode && (
                          <button
                            onClick={() => removeCurrentProduct(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Oportunidades */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Oportunidades Identificadas</h4>
                    {isEditMode && (
                       <select
                         onChange={(e) => {
                           if (e.target.value && !editingClient?.potentialProducts?.includes(e.target.value)) {
                             addPotentialProduct(e.target.value)
                             e.target.value = ''
                           }
                         }}
                         className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                       >
                         <option value="">+ Adicionar</option>
                         {availableProducts
                           .filter(product => !editingClient?.potentialProducts?.includes(product))
                           .map(product => (
                             <option key={product} value={product}>{product}</option>
                           ))
                         }
                       </select>
                     )}
                  </div>
                  <div className="space-y-2">
                    {(isEditMode ? editingClient?.potentialProducts : selectedClient.potentialProducts)?.map((product, index) => {
                      const productValue = isEditMode ? getProductValue(product) : getProductValueForDisplay(product, selectedClient)
                      return (
                        <div key={index} className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-green-800">{product}</span>
                              {productValue && (
                                <div className="text-sm text-green-600">
                                  {product === 'Folha de Pagamento' || product === 'Consignado' ? (
                                    productValue.totalLives && productValue.totalLives > 0 && (
                                      <span>({productValue.totalLives} vidas)</span>
                                    )
                                  ) : product === 'Benefícios' && productValue.benefitDetails ? (
                                    <span>
                                      ({[
                                        productValue.benefitDetails.vt && productValue.benefitDetails.vt > 0 && `VT: ${productValue.benefitDetails.vt}`,
                                        productValue.benefitDetails.vr && productValue.benefitDetails.vr > 0 && `VR: ${productValue.benefitDetails.vr}`,
                                        productValue.benefitDetails.premiacao && productValue.benefitDetails.premiacao > 0 && `Premiação: ${productValue.benefitDetails.premiacao}`,
                                        productValue.benefitDetails.gestaoCorporativa && productValue.benefitDetails.gestaoCorporativa > 0 && `Gestão Corp.: ${productValue.benefitDetails.gestaoCorporativa}`
                                      ].filter(Boolean).join(', ')})
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {isEditMode && (
                                <button
                                  onClick={() => removePotentialProduct(index)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {isEditMode && (
                            <div className="mt-2 space-y-2">
                              {(product === 'Folha de Pagamento' || product === 'Consignado') && (
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm text-gray-600 w-24">Total de vidas:</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={productValue?.totalLives || 0}
                                    onChange={(e) => updateProductValue(product, 'totalLives', parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                              )}
                              
                              {product === 'Benefícios' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-600 w-16">VT:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={productValue?.benefitDetails?.vt || 0}
                                      onChange={(e) => updateProductValue(product, 'vt', parseInt(e.target.value) || 0)}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-600 w-16">VR:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={productValue?.benefitDetails?.vr || 0}
                                      onChange={(e) => updateProductValue(product, 'vr', parseInt(e.target.value) || 0)}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-600 w-16">Premiação:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={productValue?.benefitDetails?.premiacao || 0}
                                      onChange={(e) => updateProductValue(product, 'premiacao', parseInt(e.target.value) || 0)}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-600 w-16">Gestão Corp.:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={productValue?.benefitDetails?.gestaoCorporativa || 0}
                                      onChange={(e) => updateProductValue(product, 'gestaoCorporativa', parseInt(e.target.value) || 0)}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Recomendações */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Recomendações</h4>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'partner_manager') && !isEditingRecommendations && (
                      <button
                        onClick={startEditingRecommendations}
                        className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  
                  {isEditingRecommendations ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingRecommendations}
                        onChange={(e) => setEditingRecommendations(e.target.value)}
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Digite as recomendações personalizadas...\n\nSugestões:\n• Implementar Departamento Pessoal para otimizar gestão de RH\n• Considerar Medicina do Trabalho devido ao número de funcionários\n• Avaliar Segurança do Trabalho para compliance industrial\n• Expandir benefícios com VT/VR para retenção de talentos"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={saveRecommendations}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={cancelEditingRecommendations}
                          className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(selectedClient.customRecommendations 
                        ? selectedClient.customRecommendations.split('\n').filter(line => line.trim())
                        : generateAnalysisReport(selectedClient)
                      ).map((recommendation, index) => (
                        <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                          <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3"></div>
                          <span className="text-sm text-yellow-800">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-3">
                    {!isEditMode ? (
                      <button
                        onClick={() => startEdit(selectedClient)}
                        className="px-4 py-2 bg-yellow-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-yellow-700"
                      >
                        Editar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={saveChanges}
                          className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAnalysisModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Fechar
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const doc = await generateCommercialProposalPDF(selectedClient)
                          doc.save(`Proposta_Comercial_${selectedClient.companyName.replace(/\s+/g, '_')}.pdf`)
                        } catch (error) {
                          console.error('Erro ao gerar PDF:', error)
                          alert('Erro ao gerar proposta em PDF')
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Gerar Proposta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}