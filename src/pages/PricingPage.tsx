/**
 * Pricing Page - Transparent Pricing Plans
 *
 * Complete pricing page with:
 * - Three tiers (Starter, Pro, Enterprise)
 * - Per-user pricing model
 * - Feature comparison
 * - FAQ section
 * - SEO optimization
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import SEO, { generateProductSchema, generateFAQSchema } from '../components/layout/SEO';

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfeito para começar',
    features: [
      'Até 10 usuários',
      'CRM Básico',
      'Checkout Integrado',
      'Relatórios Mensais',
      'Suporte por Email',
      '100 GB de Armazenamento',
    ],
    cta: 'Começar Grátis',
    popular: false,
  },
  {
    name: 'Pro',
    price: 49,
    description: 'Para equipes em crescimento',
    features: [
      'Usuários Ilimitados',
      'CRM Completo',
      'Checkout Avançado',
      'Relatórios em Tempo Real',
      'Suporte Prioritário 24/7',
      'Armazenamento Ilimitado',
      'Integrações Avançadas',
      'API Personalizada',
      'White Label',
    ],
    cta: 'Começar Teste Grátis',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Solução personalizada',
    features: [
      'Tudo do Pro, mais:',
      'Gerente de Conta Dedicado',
      'Onboarding Personalizado',
      'SLA Garantido',
      'Suporte Técnico Dedicado',
      'Treinamento da Equipe',
      'Customizações Sob Demanda',
      'Infraestrutura Dedicada',
    ],
    cta: 'Falar com Vendas',
    popular: false,
  },
];

const faqs = [
  {
    question: 'Como funciona o período de teste gratuito?',
    answer: 'Você tem 14 dias para testar todas as funcionalidades da plataforma sem precisar inserir cartão de crédito. Após o período, você pode escolher o plano que melhor se adequa ao seu negócio.',
  },
  {
    question: 'Posso mudar de plano a qualquer momento?',
    answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas imediatamente e o valor é ajustado proporcionalmente.',
  },
  {
    question: 'O que acontece se eu ultrapassar o limite de usuários?',
    answer: 'No plano Starter, você será notificado ao se aproximar do limite e poderá fazer upgrade para o Pro. No plano Pro, não há limite de usuários.',
  },
  {
    question: 'Vocês oferecem descontos para pagamento anual?',
    answer: 'Sim! Oferecemos 20% de desconto para clientes que optarem pelo pagamento anual. Entre em contato com nossa equipe de vendas para mais informações.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Aceitamos cartões de crédito (Visa, Mastercard, Amex), boleto bancário e Pix. Para planos Enterprise, também aceitamos faturamento por nota fiscal.',
  },
  {
    question: 'Os dados estão seguros?',
    answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta, certificação SSL, e estamos em conformidade com a LGPD. Seus dados são armazenados em servidores seguros com backup diário.',
  },
];

const productSchema = generateProductSchema({
  name: 'Partners CRM - Plano Pro',
  description: 'Plataforma completa de CRM para parceiros com checkout integrado',
  price: 49,
  currency: 'BRL',
  sku: 'PCRM-PRO',
  brand: 'Partners CRM',
});

const faqSchema = generateFAQSchema(faqs);

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <>
      <SEO
        title="Preços"
        description="Planos transparentes e sem surpresas. A partir de R$ 29 por usuário/mês. Teste grátis por 14 dias sem cartão de crédito."
        keywords="preços crm, planos crm parceiros, preço por usuário, teste grátis"
        structuredData={productSchema}
      />

      <div className="bg-white min-h-screen">
        {/* Header */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="text-2xl font-bold text-blue-600">Partners CRM</a>
              <div className="flex items-center gap-6">
                <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Início</a>
                <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
                <a href="#login" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Entrar
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-20 pb-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Preços simples e transparentes
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Sem taxas escondidas. Sem surpresas. Cancele quando quiser.
            </motion.p>

            {/* Billing Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-4 bg-gray-100 rounded-full p-1 mb-12"
            >
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Anual
                <span className="ml-2 text-green-600 text-sm">-20%</span>
              </button>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 ${
                    plan.popular
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl scale-105'
                      : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-bold">
                      Mais Popular
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={plan.popular ? 'text-blue-100' : 'text-gray-600'}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    {plan.price ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                            R$ {billingPeriod === 'yearly' ? Math.round(plan.price * 0.8) : plan.price}
                          </span>
                          <span className={plan.popular ? 'text-blue-100' : 'text-gray-600'}>
                            /usuário/mês
                          </span>
                        </div>
                        {billingPeriod === 'yearly' && (
                          <p className={`mt-2 text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                            Faturado anualmente (R$ {Math.round(plan.price * 0.8 * 12)}/usuário/ano)
                          </p>
                        )}
                      </>
                    ) : (
                      <div className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                        Personalizado
                      </div>
                    )}
                  </div>

                  <button
                    className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${
                      plan.popular
                        ? 'bg-white text-blue-600 hover:bg-gray-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg
                          className={`w-6 h-6 flex-shrink-0 ${plan.popular ? 'text-green-300' : 'text-green-500'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className={plan.popular ? 'text-blue-50' : 'text-gray-700'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Trust Badge */}
            <div className="mt-16 text-center">
              <p className="text-gray-600 mb-6">Mais de 10.000 empresas confiam na Partners CRM</p>
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
                <div className="text-2xl font-bold text-gray-400">EMPRESA 1</div>
                <div className="text-2xl font-bold text-gray-400">EMPRESA 2</div>
                <div className="text-2xl font-bold text-gray-400">EMPRESA 3</div>
                <div className="text-2xl font-bold text-gray-400">EMPRESA 4</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-xl text-gray-600">
                Tudo que você precisa saber sobre nossos planos
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.details
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <svg
                      className="w-6 h-6 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.details>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">Não encontrou a resposta que procurava?</p>
              <a
                href="#contact"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Fale Conosco
              </a>
            </div>
          </div>

          {/* FAQ Structured Data */}
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para começar?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              14 dias grátis. Sem cartão de crédito. Cancele quando quiser.
            </p>
            <a
              href="#signup"
              className="inline-block px-10 py-5 bg-white text-blue-600 rounded-lg font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
            >
              Começar Teste Gratuito
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
