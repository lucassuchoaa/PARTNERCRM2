import { useState, useEffect } from 'react'
import { DocumentTextIcon, BookOpenIcon, AcademicCapIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline'
import { API_URL } from '../../config/api'
import { fetchWithAuth } from '../../services/api/fetch-with-auth'

interface SupportMaterial {
  id: number
  title: string
  category: 'folha-pagamento' | 'consignado' | 'beneficios-flexiveis'
  type: 'pdf' | 'video' | 'webinar' | 'guia'
  description: string
  downloadUrl?: string
  viewUrl?: string
  duration?: string
  fileSize?: string
  createdAt?: string
  updatedAt?: string
}

export default function SupportMaterials() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [materials, setMaterials] = useState<SupportMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingMaterial, setViewingMaterial] = useState<SupportMaterial | null>(null)
  
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true)
        const response = await fetchWithAuth(`${API_URL}/support-materials`)
        if (response.ok) {
          const data = await response.json()
          let rawMaterials = []

          if (data.success && Array.isArray(data.data)) {
            rawMaterials = data.data
          } else if (Array.isArray(data)) {
            rawMaterials = data
          }

          // Mapear snake_case do backend para camelCase do frontend
          const mappedMaterials = rawMaterials.map((material: any) => ({
            id: material.id,
            title: material.title,
            category: material.category,
            type: material.type,
            description: material.description,
            downloadUrl: material.download_url || material.downloadUrl,
            viewUrl: material.view_url || material.viewUrl,
            duration: material.duration,
            fileSize: material.file_size || material.fileSize,
            createdAt: material.created_at || material.createdAt,
            updatedAt: material.updated_at || material.updatedAt
          }))

          setMaterials(mappedMaterials)
        } else {
          console.error('Erro ao buscar materiais de apoio:', response.status)
        }
      } catch (error) {
        console.error('Erro ao buscar materiais de apoio:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  const categories = [
    { id: 'all', name: 'Todos os Materiais', count: materials.length },
    { id: 'folha-pagamento', name: 'Folha de Pagamento', count: materials.filter(m => m.category === 'folha-pagamento').length },
    { id: 'consignado', name: 'Consignado', count: materials.filter(m => m.category === 'consignado').length },
    { id: 'beneficios-flexiveis', name: 'Benefícios Flexíveis', count: materials.filter(m => m.category === 'beneficios-flexiveis').length }
  ]

  // Mostrar indicador de carregamento enquanto os dados estão sendo buscados
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-700">Carregando materiais...</span>
      </div>
    )
  }

  const filteredMaterials = selectedCategory === 'all' 
    ? materials 
    : materials.filter(material => material.category === selectedCategory)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <DocumentTextIcon className="h-5 w-5" />
      case 'video':
        return <EyeIcon className="h-5 w-5" />
      case 'webinar':
        return <AcademicCapIcon className="h-5 w-5" />
      case 'guia':
        return <BookOpenIcon className="h-5 w-5" />
      default:
        return <DocumentTextIcon className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'text-red-600 bg-red-100'
      case 'video':
        return 'text-blue-600 bg-blue-100'
      case 'webinar':
        return 'text-purple-600 bg-purple-100'
      case 'guia':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleDownload = (material: SupportMaterial) => {
    if (!material.downloadUrl) {
      console.error('URL de download não disponível')
      alert('Arquivo não disponível para download')
      return
    }

    console.log(`Baixando: ${material.title}`)
    console.log('Download URL:', material.downloadUrl)

    // Usar URL diretamente (o proxy do Vite vai lidar com /uploads)
    const link = document.createElement('a')
    link.href = material.downloadUrl
    link.download = material.title || 'download'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = (material: SupportMaterial) => {
    const urlToOpen = material.viewUrl || material.downloadUrl

    if (!urlToOpen) {
      console.error('URL de visualização não disponível')
      alert('Arquivo não disponível para visualização')
      return
    }

    console.log(`Visualizando: ${material.title}`)

    // Abrir modal de visualização
    setViewingMaterial(material)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Material de Apoio</h1>
          <p className="mt-2 text-sm text-gray-700">
            Acesse materiais de apoio relacionados aos produtos Somapay: Folha de Pagamento, Consignado e Benefícios Flexíveis.
          </p>
        </div>
      </div>

      {/* Filtros por categoria */}
      <div className="mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`${
                  selectedCategory === category.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`}
              >
                {category.name}
                <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-900">
                  {category.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Grid de materiais */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.map((material) => (
          <div key={material.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-2 rounded-md ${getTypeColor(material.type)}`}>
                  {getTypeIcon(material.type)}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {material.title}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize mt-1">
                    {material.type}
                    {material.duration && ` • ${material.duration}`}
                    {material.fileSize && ` • ${material.fileSize}`}
                  </p>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                {material.description}
              </p>
              
              <div className="mt-6 flex space-x-3">
                {material.downloadUrl && (
                  <button
                    onClick={() => handleDownload(material)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Baixar
                  </button>
                )}
                {material.viewUrl && (
                  <button
                    onClick={() => handleView(material)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Visualizar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum material encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Não há materiais disponíveis para esta categoria.</p>
        </div>
      )}

      {/* Modal de Visualização */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setViewingMaterial(null)}
            ></div>

            {/* Modal Content */}
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
                    {viewingMaterial.title}
                  </h3>
                  <button
                    onClick={() => setViewingMaterial(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Fechar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Viewer */}
                <div className="w-full" style={{ height: '80vh' }}>
                  <iframe
                    src={viewingMaterial.viewUrl || viewingMaterial.downloadUrl}
                    className="w-full h-full border-0 rounded"
                    title={viewingMaterial.title}
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => handleDownload(viewingMaterial)}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Baixar
                </button>
                <button
                  type="button"
                  onClick={() => setViewingMaterial(null)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}