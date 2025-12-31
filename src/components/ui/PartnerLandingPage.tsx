import { useState, useEffect } from 'react'
import { API_URL } from '../../config/api'
import {
  UserGroupIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'

interface PartnerInfo {
  id: string
  name: string
  company: string
  partnerSlug: string
}

interface PartnerLandingPageProps {
  slug: string
}

export default function PartnerLandingPage({ slug }: PartnerLandingPageProps) {
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    cnpj: ''
  })

  useEffect(() => {
    const fetchPartnerInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/partner_prospects/public/partner/${slug}`)

        if (!response.ok) {
          setError('Parceiro não encontrado')
          setLoading(false)
          return
        }

        const data = await response.json()
        setPartnerInfo(data)
      } catch (error) {
        console.error('Error fetching partner info:', error)
        setError('Erro ao carregar informações do parceiro')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPartnerInfo()
    }
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/partner_prospects/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          referredByPartnerSlug: slug
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar cadastro')
      }

      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        cnpj: ''
      })
    } catch (error: any) {
      console.error('Error submitting form:', error)
      setError(error.message || 'Erro ao enviar cadastro')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error && !partnerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parceiro não encontrado</h2>
          <p className="text-gray-600 mb-6">Verifique o link e tente novamente.</p>
          <button
            onClick={() => { window.location.hash = '' }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <UserGroupIcon className="h-16 w-16 text-indigo-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              Torne-se um <span className="text-indigo-600">Parceiro</span>
            </h1>
            <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
              Indicado por <span className="font-bold text-indigo-600">{partnerInfo?.name}</span>
            </p>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              Junte-se à nossa rede de parceiros e ganhe comissões ajudando empresas a crescer
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Por que se tornar um parceiro?
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105">
            <div className="flex justify-center mb-4">
              <CurrencyDollarIcon className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Comissões Recorrentes</h3>
            <p className="text-gray-600">
              Ganhe comissões mensais sobre os contratos fechados
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105">
            <div className="flex justify-center mb-4">
              <ChartBarIcon className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard Completo</h3>
            <p className="text-gray-600">
              Acompanhe seus clientes e ganhos em tempo real
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105">
            <div className="flex justify-center mb-4">
              <DocumentCheckIcon className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Suporte Completo</h3>
            <p className="text-gray-600">
              Material de apoio e treinamento para você vender mais
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105">
            <div className="flex justify-center mb-4">
              <UserGroupIcon className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Rede de Parceiros</h3>
            <p className="text-gray-600">
              Faça parte de uma comunidade ativa e colaborativa
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {success ? (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Cadastro Enviado!</h2>
            <p className="text-lg text-gray-600 mb-2">
              Obrigado pelo seu interesse em se tornar um parceiro!
            </p>
            <p className="text-gray-500 mb-8">
              Nossa equipe irá analisar seu cadastro e entrar em contato em breve.
            </p>
            <button
              onClick={() => {
                setSuccess(false)
                setError('')
              }}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Enviar Outra Indicação
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Cadastre-se Agora
            </h2>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nome da sua empresa"
                />
              </div>

              <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Quero ser Parceiro'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Ao se cadastrar, você concorda com nossos termos de serviço e política de privacidade.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Partner CRM. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
