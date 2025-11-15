import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'

interface Message {
  id: string
  type: 'bot' | 'user'
  content: string
  timestamp: Date
  options?: string[]
}

interface ChatBotProps {
  products: Array<{ id: string; name: string; description: string }>
}

export default function ChatBot({ products }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [currentFlow, setCurrentFlow] = useState<string>('initial')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(
        'Olá! Sou seu assistente virtual. Como posso ajudá-lo hoje?',
        ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais']
      )
    }
  }, [isOpen])

  const addBotMessage = (content: string, options?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      options
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleOptionClick = (option: string) => {
    addUserMessage(option)
    processUserInput(option)
  }

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      addUserMessage(inputValue)
      processUserInput(inputValue)
      setInputValue('')
    }
  }

  const processUserInput = (input: string) => {
    const lowerInput = input.toLowerCase()

    // Fluxo inicial
    if (currentFlow === 'initial') {
      if (lowerInput.includes('dúvida') || lowerInput.includes('duvida')) {
        setCurrentFlow('doubts')
        setTimeout(() => {
          addBotMessage(
            'Entendo! Sobre qual assunto você tem dúvidas?',
            ['Como fazer indicações', 'Acompanhar clientes', 'Comissões', 'Material de apoio', 'Voltar']
          )
        }, 500)
      } else if (lowerInput.includes('pitch') || lowerInput.includes('venda')) {
        setCurrentFlow('pitch')
        setTimeout(() => {
          addBotMessage(
            'Perfeito! Para qual produto você gostaria de ver o pitch de vendas?',
            products.map(p => p.name).concat(['Voltar'])
          )
        }, 500)
      } else if (lowerInput.includes('informações') || lowerInput.includes('informacoes') || lowerInput.includes('geral')) {
        setTimeout(() => {
          addBotMessage(
            'Aqui estão algumas informações gerais sobre a plataforma:\n\n• Você pode fazer indicações através da aba "Indicações"\n• Acompanhe seus clientes na aba "Clientes"\n• Veja seus relatórios e comissões na aba "Relatórios"\n• Acesse materiais de apoio para suas vendas\n\nComo mais posso ajudar?',
            ['Tirar dúvidas', 'Pitch de vendas', 'Menu inicial']
          )
        }, 500)
      }
    }

    // Fluxo de dúvidas
    else if (currentFlow === 'doubts') {
      if (lowerInput.includes('indicações') || lowerInput.includes('indicacoes')) {
        setTimeout(() => {
          addBotMessage(
            '📋 **Como fazer indicações:**\n\n1. Acesse a aba "Indicações" no menu lateral\n2. Clique em "Nova Indicação"\n3. Preencha os dados do cliente\n4. Selecione o produto de interesse\n5. Envie a indicação\n\nVocê receberá notificações sobre o andamento da sua indicação!\n\nPosso ajudar com mais alguma coisa?',
            ['Outras dúvidas', 'Pitch de vendas', 'Menu inicial']
          )
        }, 500)
      } else if (lowerInput.includes('cliente')) {
        setTimeout(() => {
          addBotMessage(
            '👥 **Acompanhar clientes:**\n\n• Acesse a aba "Clientes" para ver todos os seus clientes indicados\n• Veja o status atual de cada cliente no funil de vendas\n• Acompanhe a temperatura do negócio (frio, morno, quente)\n• Receba notificações sobre mudanças importantes\n\nO que mais você gostaria de saber?',
            ['Outras dúvidas', 'Pitch de vendas', 'Menu inicial']
          )
        }, 500)
      } else if (lowerInput.includes('comissões') || lowerInput.includes('comissoes')) {
        setTimeout(() => {
          addBotMessage(
            '💰 **Sobre comissões:**\n\n• As comissões são calculadas automaticamente\n• Você pode acompanhar na aba "Relatórios"\n• Pagamentos são realizados mensalmente\n• Você receberá um relatório detalhado por email\n\nTem mais alguma dúvida?',
            ['Outras dúvidas', 'Pitch de vendas', 'Menu inicial']
          )
        }, 500)
      } else if (lowerInput.includes('material')) {
        setTimeout(() => {
          addBotMessage(
            '📚 **Material de apoio:**\n\n• Acesse a aba "Material de Apoio"\n• Encontre apresentações, vídeos e documentos\n• Todo material está organizado por produto\n• Baixe e compartilhe com seus clientes\n\nQuer saber mais alguma coisa?',
            ['Outras dúvidas', 'Pitch de vendas', 'Menu inicial']
          )
        }, 500)
      } else if (lowerInput.includes('voltar') || lowerInput.includes('menu')) {
        setCurrentFlow('initial')
        setTimeout(() => {
          addBotMessage(
            'Como posso ajudá-lo?',
            ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais']
          )
        }, 500)
      }
    }

    // Fluxo de pitch de vendas
    else if (currentFlow === 'pitch') {
      const selectedProd = products.find(p => lowerInput.includes(p.name.toLowerCase()))

      if (selectedProd) {
        setSelectedProduct(selectedProd.id)
        setTimeout(() => {
          const pitchContent = generatePitchContent(selectedProd)
          addBotMessage(pitchContent, ['Ver outro produto', 'Tirar dúvidas', 'Menu inicial'])
        }, 500)
      } else if (lowerInput.includes('voltar') || lowerInput.includes('menu')) {
        setCurrentFlow('initial')
        setSelectedProduct(null)
        setTimeout(() => {
          addBotMessage(
            'Como posso ajudá-lo?',
            ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais']
          )
        }, 500)
      } else if (lowerInput.includes('outro produto')) {
        setSelectedProduct(null)
        setTimeout(() => {
          addBotMessage(
            'Para qual produto você gostaria de ver o pitch de vendas?',
            products.map(p => p.name).concat(['Voltar'])
          )
        }, 500)
      }
    }

    // Resposta padrão
    if (
      !lowerInput.includes('dúvida') &&
      !lowerInput.includes('pitch') &&
      !lowerInput.includes('informações') &&
      !lowerInput.includes('indicações') &&
      !lowerInput.includes('cliente') &&
      !lowerInput.includes('comissões') &&
      !lowerInput.includes('material') &&
      !lowerInput.includes('voltar') &&
      !lowerInput.includes('menu') &&
      !lowerInput.includes('outro') &&
      !products.some(p => lowerInput.includes(p.name.toLowerCase()))
    ) {
      setTimeout(() => {
        addBotMessage(
          'Desculpe, não entendi sua pergunta. Por favor, escolha uma das opções disponíveis ou reformule sua pergunta.',
          currentFlow === 'initial'
            ? ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais']
            : currentFlow === 'doubts'
            ? ['Como fazer indicações', 'Acompanhar clientes', 'Comissões', 'Material de apoio', 'Voltar']
            : products.map(p => p.name).concat(['Voltar'])
        )
      }, 500)
    }
  }

  const generatePitchContent = (product: { name: string; description: string }) => {
    const pitches: { [key: string]: string } = {
      'Folha de Pagamento': `
🎯 **Pitch: ${product.name}**

**Abertura:**
"Olá! Você sabia que pode otimizar toda a gestão de folha de pagamento da sua empresa?"

**Problema:**
"Muitas empresas perdem tempo e recursos gerenciando folhas manualmente, com riscos de erros e conformidade."

**Solução:**
"${product.description} Nossa solução automatiza todo o processo, garantindo:"
• ✅ Conformidade com legislação trabalhista
• ✅ Redução de até 70% no tempo de processamento
• ✅ Zero erros em cálculos
• ✅ Relatórios em tempo real

**Benefícios:**
💰 Economia de até R$ 5.000/mês em custos operacionais
⏱️ Mais tempo para focar no crescimento do negócio
🔒 Segurança e conformidade garantidas

**Chamada para ação:**
"Que tal agendar uma demonstração de 15 minutos para ver na prática?"
      `.trim(),

      'Crédito Consignado': `
🎯 **Pitch: ${product.name}**

**Abertura:**
"Já pensou em oferecer crédito com as melhores taxas para seus colaboradores?"

**Problema:**
"Muitos funcionários recorrem a empréstimos com juros abusivos, afetando sua produtividade e bem-estar."

**Solução:**
"${product.description} Oferecemos:"
• ✅ Taxas até 70% menores que cartão de crédito
• ✅ Desconto direto em folha (segurança para empresa e colaborador)
• ✅ Aprovação rápida e simplificada
• ✅ Sem burocracia

**Benefícios:**
💰 Colaboradores mais satisfeitos e produtivos
⏱️ Redução de pedidos de adiantamento
🔒 Zero risco para a empresa

**Chamada para ação:**
"Vamos conversar sobre como implementar isso na sua empresa?"
      `.trim(),

      'Benefícios': `
🎯 **Pitch: ${product.name}**

**Abertura:**
"Que tal oferecer um pacote completo de benefícios para seus colaboradores?"

**Problema:**
"Empresas precisam atrair e reter talentos, mas benefícios tradicionais são caros e inflexíveis."

**Solução:**
"${product.description} Nossa plataforma oferece:"
• ✅ Vale-refeição/alimentação
• ✅ Plano de saúde
• ✅ Vale-transporte
• ✅ Benefícios flexíveis personalizáveis

**Benefícios:**
💰 Redução de até 30% nos custos com benefícios
⏱️ Gestão 100% digital e automatizada
🔒 Satisfação e retenção de talentos

**Chamada para ação:**
"Posso mostrar quanto sua empresa pode economizar?"
      `.trim()
    }

    return pitches[product.name] || `
🎯 **Pitch: ${product.name}**

${product.description}

**Por que escolher nosso produto?**
• ✅ Solução completa e integrada
• ✅ Suporte especializado
• ✅ Tecnologia de ponta
• ✅ Resultados comprovados

**Vamos conversar sobre como podemos ajudar sua empresa?**
    `.trim()
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 group"
        aria-label="Abrir assistente virtual"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          AI
        </span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <SparklesIcon className="h-6 w-6" />
            <span className="absolute -bottom-1 -right-1 bg-green-400 h-3 w-3 rounded-full border-2 border-white"></span>
          </div>
          <div>
            <h3 className="font-semibold">Assistente Virtual</h3>
            <p className="text-xs text-blue-100">Online • Sempre disponível</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded-lg transition-colors"
          aria-label="Fechar chat"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              {message.options && (
                <div className="mt-3 space-y-2">
                  {message.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(option)}
                      className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inputValue.trim()}
            aria-label="Enviar mensagem"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Powered by AI • Respostas instantâneas
        </p>
      </div>
    </div>
  )
}
