import { useState } from 'react'
import { DocumentTextIcon, BookOpenIcon, AcademicCapIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline'

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
}

export default function SupportMaterials() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [materials] = useState<SupportMaterial[]>([
    {
      id: 1,
      title: 'Guia Completo de Folha de Pagamento Digital',
      category: 'folha-pagamento',
      type: 'pdf',
      description: 'Manual completo sobre como implementar e gerenciar folha de pagamento digital com a Somapay.',
      downloadUrl: '#',
      fileSize: '2.5 MB'
    },
    {
      id: 2,
      title: 'Webinar: Modernização da Folha de Pagamento',
      category: 'folha-pagamento',
      type: 'webinar',
      description: 'Apresentação sobre as melhores práticas para modernizar processos de folha de pagamento.',
      viewUrl: '#',
      duration: '45 min'
    },
    {
      id: 3,
      title: 'Manual de Crédito Consignado',
      category: 'consignado',
      type: 'pdf',
      description: 'Guia detalhado sobre produtos de crédito consignado e como oferecê-los aos colaboradores.',
      downloadUrl: '#',
      fileSize: '1.8 MB'
    },
    {
      id: 4,
      title: 'Vídeo: Como Funciona o Consignado Somapay',
      category: 'consignado',
      type: 'video',
      description: 'Explicação em vídeo sobre o funcionamento do crédito consignado na plataforma Somapay.',
      viewUrl: '#',
      duration: '12 min'
    },
    {
      id: 5,
      title: 'Guia de Benefícios Flexíveis',
      category: 'beneficios-flexiveis',
      type: 'guia',
      description: 'Como implementar e gerenciar benefícios flexíveis para aumentar a satisfação dos colaboradores.',
      downloadUrl: '#',
      fileSize: '3.2 MB'
    },
    {
      id: 6,
      title: 'Webinar: Tendências em Benefícios Corporativos',
      category: 'beneficios-flexiveis',
      type: 'webinar',
      description: 'Apresentação sobre as principais tendências em benefícios corporativos e como aplicá-las.',
      viewUrl: '#',
      duration: '38 min'
    },
    {
      id: 7,
      title: 'Calculadora de ROI - Benefícios Flexíveis',
      category: 'beneficios-flexiveis',
      type: 'pdf',
      description: 'Ferramenta para calcular o retorno sobre investimento em programas de benefícios flexíveis.',
      downloadUrl: '#',
      fileSize: '850 KB'
    },
    {
      id: 8,
      title: 'Checklist de Implementação - Folha Digital',
      category: 'folha-pagamento',
      type: 'pdf',
      description: 'Lista de verificação completa para implementação bem-sucedida da folha de pagamento digital.',
      downloadUrl: '#',
      fileSize: '1.2 MB'
    }
  ])

  const categories = [
    { id: 'all', name: 'Todos os Materiais', count: materials.length },
    { id: 'folha-pagamento', name: 'Folha de Pagamento', count: materials.filter(m => m.category === 'folha-pagamento').length },
    { id: 'consignado', name: 'Consignado', count: materials.filter(m => m.category === 'consignado').length },
    { id: 'beneficios-flexiveis', name: 'Benefícios Flexíveis', count: materials.filter(m => m.category === 'beneficios-flexiveis').length }
  ]

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
    console.log(`Baixando: ${material.title}`)
    alert(`Baixando: ${material.title}`)
  }

  const handleView = (material: SupportMaterial) => {
    console.log(`Visualizando: ${material.title}`)
    alert(`Abrindo: ${material.title}`)
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
    </div>
  )
}