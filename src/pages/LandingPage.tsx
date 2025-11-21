/**
 * Landing Page - Modern CRM Platform
 * Completely functional with demo modal and sales chat
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SEO from '../components/layout/SEO'
import { XMarkIcon, PlayIcon } from '@heroicons/react/24/outline'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showSalesChat, setShowSalesChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: '👋 Olá! Sou o assistente de vendas. Como posso ajudá-lo?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [startingPrice, setStartingPrice] = useState<number | null>(29)
  const [pricingPlans, setPricingPlans] = useState<any[]>([])

  const handleDemoClick = () => {
    setShowDemoModal(true)
  }

  const handleSalesClick = () => {
    setShowSalesChat(true)
  }

  const handleChatSend = () => {
    if (!chatInput.trim()) return

    // Adiciona mensagem do usuário
    const userMessage = { type: 'user', text: chatInput }
    setChatMessages([...chatMessages, userMessage])

    // Simula resposta do bot
    setTimeout(() => {
      let botResponse = ''
      const lower = chatInput.toLowerCase()

      if (lower.includes('preço') || lower.includes('valor') || lower.includes('custo')) {
        botResponse = '💰 Nossos planos começam em R$ 29/usuário/mês. Gostaria de ver todos os planos disponíveis?'
      } else if (lower.includes('demonstração') || lower.includes('demo') || lower.includes('teste')) {
        botResponse = '🎯 Ótimo! Temos um teste gratuito de 14 dias sem precisar de cartão de crédito. Posso te direcionar para criar sua conta agora?'
      } else if (lower.includes('funcionalidade') || lower.includes('recurso') || lower.includes('feature')) {
        botResponse = '✨ Temos CRM completo, checkout integrado, gestão de comissões, relatórios avançados, integrações com HubSpot e NetSuite, e muito mais! Sobre qual você gostaria de saber mais?'
      } else if (lower.includes('suporte') || lower.includes('ajuda') || lower.includes('dúvida')) {
        botResponse = '🆘 Nosso suporte está disponível 24/7 por chat, email e telefone. Todos os planos incluem suporte prioritário!'
      } else if (lower.includes('sim') || lower.includes('quero') || lower.includes('gostaria')) {
        botResponse = '🎉 Perfeito! Vou te redirecionar para a página de cadastro. Um momento...'
        setTimeout(() => { window.location.hash = 'login' }, 2000)
      } else {
        botResponse = 'Entendo! Posso te ajudar com informações sobre:\n\n💰 Preços e planos\n🎯 Demonstração gratuita\n✨ Funcionalidades\n🆘 Suporte\n\nSobre o que você gostaria de saber?'
      }

      setChatMessages(prev => [...prev, { type: 'bot', text: botResponse }])
    }, 1000)

    setChatInput('')
  }

  // Buscar menor preço ativo da API
  useEffect(() => {
    const fetchStartingPrice = async () => {
      try {
        const response = await fetch('/api/pricing-plans')
        if (!response.ok) return
        
        const result = await response.json()
        const plansData = result.success ? result.data : (Array.isArray(result) ? result : [])
        const plansArray = Array.isArray(plansData) ? plansData : []
        
        if (plansArray.length > 0) {
          const formattedPlans = plansArray.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            basePrice: parseFloat(p.base_price || p.basePrice || 0),
            includedUsers: parseInt(p.included_users || p.includedUsers || 0),
            additionalUserPrice: parseFloat(p.additional_user_price || p.additionalUserPrice || 0),
            features: p.features || [],
            isActive: p.is_active !== undefined ? p.is_active : p.isActive,
            order: p.order || 0
          }))
          
          setPricingPlans(formattedPlans)
          
          const activePlans = formattedPlans.filter((p: any) => p.isActive)
          const plansToConsider = activePlans.length > 0 ? activePlans : formattedPlans
          
          if (plansToConsider.length === 0) return
          
          const minBase = plansToConsider.reduce(
            (min: number, p: any) => (typeof p.basePrice === 'number' && p.basePrice < min ? p.basePrice : min),
            plansToConsider[0].basePrice,
          )
          
          if (typeof minBase === 'number' && !Number.isNaN(minBase)) {
            setStartingPrice(minBase)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar planos de preço:', error)
      }
    }

    fetchStartingPrice()
  }, [])

  return (
    <>
      <SEO
        title="Início"
        description="A melhor plataforma de parceiros que sua empresa pode ter, simples e completa. Gerencie vendas, clientes e comissões em um só lugar com checkout integrado."
        keywords="crm parceiros, plataforma vendas online, gestão comissões, checkout integrado, vender online"
      />

      <div className="bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 pt-20 pb-32">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8 border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Mais de 10.000 parceiros ativos
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              >
                A melhor plataforma de parceiros
                <br />
                <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  simples e completa
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUp}
                className="text-xl sm:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed"
              >
                Gerencie vendas, clientes e comissões em um só lugar.
                <br />
                Com checkout integrado e precificação transparente.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                <button
                  onClick={() => { window.location.hash = 'login' }}
                  className="group w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Começar Gratuitamente
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={handleDemoClick}
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <PlayIcon className="w-5 h-5" />
                  Ver Demonstração
                </button>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center justify-center gap-8 text-blue-200"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>14 dias grátis</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cancele quando quiser</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Wave separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-24" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '10.000+', label: 'Parceiros Ativos' },
                { value: '500+', label: 'Empresas Confiando' },
                { value: '98%', label: 'Satisfação' },
                { value: 'R$ 50M+', label: 'Processado/Mês' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Tudo que você precisa em um só lugar
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Ferramentas completas para gerenciar seus parceiros, vendas e comissões
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: '💼',
                  title: 'CRM Completo',
                  description: 'Gerencie leads, oportunidades e pipeline de vendas com facilidade'
                },
                {
                  icon: '🛒',
                  title: 'Checkout Integrado',
                  description: 'Venda online com checkout pronto e pagamentos seguros'
                },
                {
                  icon: '💰',
                  title: 'Gestão de Comissões',
                  description: 'Calcule e acompanhe comissões automaticamente'
                },
                {
                  icon: '📊',
                  title: 'Relatórios Avançados',
                  description: 'Análises e insights em tempo real do seu negócio'
                },
                {
                  icon: '🔗',
                  title: 'Integrações',
                  description: 'Conecte com HubSpot, NetSuite e outras ferramentas'
                },
                {
                  icon: '📱',
                  title: 'Mobile First',
                  description: 'Acesse de qualquer lugar, em qualquer dispositivo'
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Preços transparentes e justos
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Pague apenas pelo que usar. Sem surpresas, sem taxas escondidas.
              </p>
            </div>

            {pricingPlans.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                {pricingPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative bg-white rounded-2xl shadow-xl ${index === 1 ? 'ring-2 ring-blue-600 scale-105' : ''}`}
                  >
                    {index === 1 && (
                      <div className="absolute -top-5 left-0 right-0 mx-auto w-fit px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                        Mais Popular
                      </div>
                    )}
                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-6">{plan.description}</p>
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-5xl font-bold text-blue-600">
                            R$ {plan.basePrice.toFixed(0)}
                          </span>
                          <span className="text-gray-500">/mês</span>
                        </div>
                        <p className="text-sm text-gray-500">Até {plan.includedUsers} usuários inclusos</p>
                        <p className="text-sm text-gray-500">+R$ {plan.additionalUserPrice.toFixed(2)} por usuário adicional</p>
                      </div>
                      <button
                        onClick={() => { window.location.hash = 'login' }}
                        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                          index === 1
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        Começar Agora
                      </button>
                      <div className="mt-8">
                        <p className="text-sm font-semibold text-gray-900 mb-4">Recursos inclusos:</p>
                        <ul className="space-y-3">
                          {plan.features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-600 text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando planos...</p>
              </div>
            )}

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">Precisa de um plano personalizado?</p>
              <button
                onClick={handleSalesClick}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Falar com Vendas
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Amado por milhares de parceiros
              </h2>
              <p className="text-xl text-gray-600">
                Veja o que nossos clientes dizem sobre nós
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: 'Aumentamos nossas vendas em 300% no primeiro ano. A plataforma é intuitiva e completa.',
                  author: 'Maria Silva',
                  role: 'CEO',
                  company: 'TechSales'
                },
                {
                  quote: 'O melhor investimento que fizemos. O checkout integrado facilitou muito nossas vendas online.',
                  author: 'João Santos',
                  role: 'Diretor Comercial',
                  company: 'SalesHub'
                },
                {
                  quote: 'Suporte excepcional e funcionalidades que realmente fazem diferença no dia a dia.',
                  author: 'Ana Costa',
                  role: 'Gerente de Parcerias',
                  company: 'Partners Co'
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-8 shadow-lg"
                >
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-gray-600">{testimonial.role} - {testimonial.company}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para transformar suas vendas?
            </h2>
            <p className="text-xl text-blue-100 mb-12">
              Junte-se a milhares de empresas que já confiam na nossa plataforma
            </p>
            <button
              onClick={() => { window.location.hash = 'login' }}
              className="inline-block px-10 py-5 bg-white text-blue-600 rounded-lg font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
            >
              Começar Teste Gratuito de 14 Dias
            </button>
            <p className="mt-6 text-blue-200">Sem cartão de crédito • Cancele quando quiser</p>
          </div>
        </section>

        {/* Footer */}
        <footer id="footer" className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-4">Partners CRM</h3>
                <p className="text-gray-400">A melhor plataforma de parceiros que sua empresa pode ter.</p>
                <div className="mt-4 flex gap-4">
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Produto</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                  <li><button onClick={handleDemoClick} className="hover:text-white transition-colors">Demonstração</button></li>
                  <li><button onClick={() => { window.location.hash = 'login' }} className="hover:text-white transition-colors">Teste Grátis</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Empresa</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><button onClick={handleSalesClick} className="hover:text-white transition-colors">Sobre Nós</button></li>
                  <li><button onClick={handleSalesClick} className="hover:text-white transition-colors">Contato</button></li>
                  <li><button onClick={handleSalesClick} className="hover:text-white transition-colors">Carreiras</button></li>
                  <li><button onClick={handleSalesClick} className="hover:text-white transition-colors">Blog</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Suporte</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><button onClick={handleSalesClick} className="hover:text-white transition-colors">Central de Ajuda</button></li>
                  <li><button onClick={handleSalesClick} className="hover:text-white transition-colors">Documentação</button></li>
                  <li><a href="mailto:contato@partnerscrm.com" className="hover:text-white transition-colors">Email: contato@partnerscrm.com</a></li>
                  <li><a href="tel:+5511999999999" className="hover:text-white transition-colors">Tel: (11) 99999-9999</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400">
              <p>&copy; 2025 Partners CRM. Todos os direitos reservados.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <button onClick={handleSalesClick} className="hover:text-white transition-colors">Privacidade</button>
                <button onClick={handleSalesClick} className="hover:text-white transition-colors">Termos de Uso</button>
                <button onClick={handleSalesClick} className="hover:text-white transition-colors">Cookies</button>
              </div>
            </div>
          </div>
        </footer>

        {/* Demo Modal */}
        <AnimatePresence>
          {showDemoModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDemoModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900">🎯 Demonstração do Sistema</h3>
                  <button
                    onClick={() => setShowDemoModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <h4 className="text-lg font-bold text-blue-900 mb-3">📊 Dashboard Completo</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Visão geral de vendas e comissões em tempo real</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Gráficos interativos de performance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Métricas de conversão e funil de vendas</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                      <h4 className="text-lg font-bold text-green-900 mb-3">🎯 Gestão de Clientes</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>CRM completo com histórico de interações</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Pipeline de vendas visual e intuitivo</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Automação de follow-ups e lembretes</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                      <h4 className="text-lg font-bold text-purple-900 mb-3">💰 Comissões Automáticas</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Cálculo automático de comissões por venda</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Relatórios detalhados de ganhos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Histórico completo de pagamentos</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
                      <h4 className="text-lg font-bold text-orange-900 mb-3">🤖 ChatBot Inteligente</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Assistente virtual com IA integrada</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Respostas automáticas personalizadas</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Geração de pitches de vendas com AI</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">🎨 Interface Moderna e Intuitiva</h4>
                    <p className="text-gray-700 mb-4">
                      Nossa plataforma foi desenhada para ser extremamente fácil de usar, com design moderno e responsivo que funciona perfeitamente em desktop, tablet e mobile.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-3xl mb-2">🎨</div>
                        <p className="text-sm font-medium text-gray-700">Design Moderno</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-3xl mb-2">📱</div>
                        <p className="text-sm font-medium text-gray-700">100% Responsivo</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-3xl mb-2">⚡</div>
                        <p className="text-sm font-medium text-gray-700">Super Rápido</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowDemoModal(false)
                        window.location.hash = 'login'
                      }}
                      className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Criar Minha Conta Grátis
                    </button>
                    <button
                      onClick={() => {
                        setShowDemoModal(false)
                        setShowSalesChat(true)
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Falar com Vendedor
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sales Chat */}
        <AnimatePresence>
          {showSalesChat && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl">
                    🤖
                  </div>
                  <div>
                    <h4 className="font-bold">Assistente de Vendas</h4>
                    <p className="text-xs text-blue-100">Online agora</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSalesChat(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleChatSend}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Enviar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Respondemos em menos de 1 minuto
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
