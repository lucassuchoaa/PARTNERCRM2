import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { askGemini, generateSalesPitch } from '../../services/geminiService'
import { logChatMetric } from '../../services/chatMetricsService'
import { getCurrentUser } from '../../services/auth'

interface Message {
  id: string
  type: 'bot' | 'user'
  content: string
  timestamp: Date
  options?: string[]
  isAI?: boolean
  isLoading?: boolean
}

interface ChatBotProps {
  products: Array<{ id: string; name: string; description: string }>
}

export default function ChatBotHybrid({ products }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [currentFlow, setCurrentFlow] = useState<string>('initial')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [useAI, setUseAI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(
        'Olá! Sou seu assistente virtual. Como posso ajudá-lo hoje?',
        ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais', '🤖 Modo IA']
      )
    }
  }, [isOpen])

  const logInteraction = async (messageType: 'user' | 'bot', message: string, options?: {
    selectedOption?: string,
    wasHelpful?: boolean,
    aiGenerated?: boolean,
    tokensUsed?: number,
    responseTime?: number
  }) => {
    if (!currentUser) return

    await logChatMetric({
      userId: currentUser.id.toString(),
      userName: currentUser.name,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      sessionId,
      messageType,
      message,
      flow: currentFlow,
      selectedOption: options?.selectedOption,
      wasHelpful: options?.wasHelpful,
      aiGenerated: options?.aiGenerated || false,
      tokensUsed: options?.tokensUsed || 0,
      responseTime: options?.responseTime || 0
    })
  }

  const addBotMessage = (content: string, options?: string[], isAI = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      options,
      isAI
    }
    setMessages(prev => [...prev, newMessage])
    logInteraction('bot', content, { aiGenerated: isAI })
  }

  const addLoadingMessage = () => {
    const loadingMessage: Message = {
      id: 'loading',
      type: 'bot',
      content: '...',
      timestamp: new Date(),
      isLoading: true
    }
    setMessages(prev => [...prev, loadingMessage])
  }

  const removeLoadingMessage = () => {
    setMessages(prev => prev.filter(msg => msg.id !== 'loading'))
  }

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    logInteraction('user', content)
  }

  const handleOptionClick = (option: string) => {
    addUserMessage(option)
    logInteraction('user', option, { selectedOption: option })

    // Ativar modo IA
    if (option === '🤖 Modo IA') {
      setUseAI(true)
      setTimeout(() => {
        addBotMessage(
          '🤖 Modo IA ativado! Agora estou usando inteligência artificial avançada para responder suas perguntas. Pergunte qualquer coisa!',
          ['Voltar ao menu', 'Desativar IA']
        )
      }, 500)
      return
    }

    // Desativar modo IA
    if (option === 'Desativar IA') {
      setUseAI(false)
      setCurrentFlow('initial')
      setTimeout(() => {
        addBotMessage(
          'Modo IA desativado. Voltando ao menu principal.',
          ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais', '🤖 Modo IA']
        )
      }, 500)
      return
    }

    processUserInput(option)
  }

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      addUserMessage(inputValue)
      const message = inputValue
      setInputValue('')

      // Se modo IA está ativado, usar Gemini
      if (useAI) {
        addLoadingMessage()
        const startTime = Date.now()

        try {
          const context = `Sistema: Você é assistente da Somapay ajudando parceiros com vendas de produtos financeiros.
Produtos disponíveis: ${products.map(p => p.name).join(', ')}.
Usuário: ${currentUser?.name || 'Parceiro'}`

          const result = await askGemini(message, context)
          removeLoadingMessage()

          const responseTime = Date.now() - startTime

          addBotMessage(
            result.response,
            ['Fazer outra pergunta', 'Voltar ao menu', 'Desativar IA'],
            true
          )

          await logInteraction('bot', result.response, {
            aiGenerated: true,
            tokensUsed: result.tokens,
            responseTime
          })
        } catch (error: any) {
          removeLoadingMessage()
          addBotMessage(
            'Desculpe, houve um erro ao conectar com a IA. Vou responder usando meu conhecimento padrão.',
            ['Tentar novamente', 'Voltar ao menu']
          )
        }
        return
      }

      processUserInput(message)
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
            products.map(p => p.name).concat(['🤖 Gerar com IA', 'Voltar'])
          )
        }, 500)
      } else if (lowerInput.includes('informações') || lowerInput.includes('informacoes') || lowerInput.includes('geral')) {
        setTimeout(() => {
          addBotMessage(
            'Aqui estão algumas informações gerais sobre a plataforma:\n\n• Você pode fazer indicações através da aba "Indicações"\n• Acompanhe seus clientes na aba "Clientes"\n• Veja seus relatórios e comissões na aba "Relatórios"\n• Acesse materiais de apoio para suas vendas\n\nComo mais posso ajudar?',
            ['Tirar dúvidas', 'Pitch de vendas', '🤖 Modo IA', 'Menu inicial']
          )
        }, 500)
      }
    }

    // Fluxo de dúvidas
    else if (currentFlow === 'doubts') {
      if (lowerInput.includes('indicações') || lowerInput.includes('indicacoes')) {
        setTimeout(() => {
          addBotMessage(
            '📋 **Como fazer indicações:**\n\n1. Acesse a aba "Indicações" no menu lateral\n2. Clique em "Nova Indicação"\n3. Preencha os dados do cliente (use o campo CNPJ para buscar automaticamente!)\n4. Selecione o produto de interesse\n5. Envie a indicação\n\nVocê receberá notificações sobre o andamento da sua indicação!\n\nPosso ajudar com mais alguma coisa?',
            ['Outras dúvidas', 'Pitch de vendas', '🤖 Modo IA', 'Menu inicial']
          )
        }, 500)
      } else if (lowerInput.includes('cliente')) {
        setTimeout(() => {
          addBotMessage(
            '👥 **Acompanhar clientes:**\n\n• Acesse a aba "Clientes" para ver todos os seus clientes indicados\n• Veja o status atual de cada cliente no funil de vendas\n• Acompanhe a temperatura do negócio (frio, morno, quente)\n• Receba notificações sobre mudanças importantes\n\nO que mais você gostaria de saber?',
            ['Outras dúvidas', 'Pitch de vendas', '🤖 Modo IA', 'Menu inicial']
          )
        }, 500)
      } else if (lowerInput.includes('comissões') || lowerInput.includes('comissoes')) {
        setTimeout(() => {
          addBotMessage(
            '💰 **Sobre comissões:**\n\n• As comissões são calculadas automaticamente\n• Você pode acompanhar na aba "Relatórios"\n• Pagamentos são realizados mensalmente\n• Você receberá um relatório detalhado por email\n\nTem mais alguma dúvida?',
            ['Outras dúvidas', 'Pitch de vendas', '🤖 Modo IA', 'Menu inicial']
          )
        }, 500)
      } else if (lowerInput.includes('material')) {
        setTimeout(() => {
          addBotMessage(
            '📚 **Material de apoio:**\n\n• Acesse a aba "Material de Apoio"\n• Encontre apresentações, vídeos e documentos\n• Todo material está organizado por produto\n• Baixe e compartilhe com seus clientes\n\nQuer saber mais alguma coisa?',
            ['Outras dúvidas', 'Pitch de vendas', '🤖 Modo IA', 'Menu inicial']
          )
        }, 500)
      } else if (lowerInput.includes('voltar') || lowerInput.includes('menu')) {
        setCurrentFlow('initial')
        setTimeout(() => {
          addBotMessage(
            'Como posso ajudá-lo?',
            ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais', '🤖 Modo IA']
          )
        }, 500)
      }
    }

    // Fluxo de pitch de vendas
    else if (currentFlow === 'pitch') {
      if (lowerInput.includes('gerar com ia') || lowerInput.includes('🤖')) {
        setTimeout(async () => {
          addBotMessage(
            'Para qual produto você gostaria que eu gerasse um pitch com IA?',
            products.map(p => p.name).concat(['Voltar'])
          )
          setCurrentFlow('pitch-ai')
        }, 500)
        return
      }

      const selectedProd = products.find(p => lowerInput.includes(p.name.toLowerCase()))

      if (selectedProd) {
        setSelectedProduct(selectedProd.name)
        setTimeout(() => {
          // Pitch padrão da árvore de decisão
          let pitch = ''

          if (selectedProd.name.toLowerCase().includes('folha')) {
            pitch = '💼 **Pitch: Folha de Pagamento**\n\n' +
                   '🎯 **Abertura:**\n' +
                   'Você sabia que pode reduzir até 40% dos custos com folha de pagamento e ainda aumentar a satisfação dos colaboradores?\n\n' +
                   '✨ **Benefícios:**\n' +
                   '• Processamento automatizado e sem erros\n' +
                   '• Conformidade garantida com a legislação\n' +
                   '• Relatórios em tempo real\n' +
                   '• Integração completa com sistemas de RH\n\n' +
                   '🚀 **Diferencial:**\n' +
                   'Nossa plataforma é a única que oferece IA para prevenir erros e suporte 24/7 especializado.\n\n' +
                   '📞 **Call to Action:**\n' +
                   'Que tal agendar uma demonstração gratuita? Em 30 minutos eu mostro como transformar a gestão de folha da sua empresa!'
          } else if (selectedProd.name.toLowerCase().includes('benefício') || selectedProd.name.toLowerCase().includes('beneficio')) {
            pitch = '🎁 **Pitch: Benefícios Flexíveis**\n\n' +
                   '🎯 **Abertura:**\n' +
                   'E se seus colaboradores pudessem escolher os benefícios que realmente fazem sentido para eles?\n\n' +
                   '✨ **Benefícios:**\n' +
                   '• Cartão multi-benefícios em um só lugar\n' +
                   '• Flexibilidade total para os colaboradores\n' +
                   '• Economia de até 25% vs benefícios tradicionais\n' +
                   '• Gestão 100% digital e automatizada\n\n' +
                   '🚀 **Diferencial:**\n' +
                   'Única plataforma com saldo unificado e app premiado pelos colaboradores.\n\n' +
                   '📞 **Call to Action:**\n' +
                   'Posso fazer uma simulação personalizada para sua empresa? Leva apenas 5 minutos!'
          } else {
            pitch = `✨ **Pitch: ${selectedProd.name}**\n\n` +
                   `${selectedProd.description}\n\n` +
                   '🎯 **Por que escolher a Somapay?**\n' +
                   '• Tecnologia de ponta\n' +
                   '• Suporte especializado\n' +
                   '• Implementação rápida\n' +
                   '• ROI comprovado\n\n' +
                   'Vamos conversar sobre como isso pode transformar seu negócio?'
          }

          addBotMessage(pitch, ['Outro produto', '🤖 Gerar com IA', 'Pitch de vendas', 'Menu inicial'])
        }, 500)
      } else if (lowerInput.includes('voltar') || lowerInput.includes('menu')) {
        setCurrentFlow('initial')
        setTimeout(() => {
          addBotMessage(
            'Como posso ajudá-lo?',
            ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais', '🤖 Modo IA']
          )
        }, 500)
      }
    }

    // Fluxo de pitch com IA
    else if (currentFlow === 'pitch-ai') {
      const selectedProd = products.find(p => lowerInput.includes(p.name.toLowerCase()))

      if (selectedProd) {
        addLoadingMessage()

        generateSalesPitch(selectedProd.name, selectedProd.description).then(pitch => {
          removeLoadingMessage()
          addBotMessage(
            `🤖 **Pitch gerado por IA: ${selectedProd.name}**\n\n${pitch}`,
            ['Outro produto', 'Regenerar pitch', 'Menu inicial'],
            true
          )
        }).catch(() => {
          removeLoadingMessage()
          addBotMessage(
            'Desculpe, não consegui gerar o pitch com IA. Vou mostrar a versão padrão.',
            ['Ver pitch padrão', 'Menu inicial']
          )
          setCurrentFlow('pitch')
        })
      } else if (lowerInput.includes('voltar') || lowerInput.includes('menu')) {
        setCurrentFlow('initial')
        setTimeout(() => {
          addBotMessage(
            'Como posso ajudá-lo?',
            ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais', '🤖 Modo IA']
          )
        }, 500)
      }
    }
  }

  const handleFeedback = (messageId: string, wasHelpful: boolean) => {
    logInteraction('bot', '', { wasHelpful })

    addBotMessage(
      wasHelpful
        ? '😊 Ótimo! Fico feliz em poder ajudar!'
        : '😔 Desculpe não ter ajudado mais. Vou melhorar!',
      ['Continuar conversa', 'Menu inicial']
    )
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-50 animate-bounce"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-6 w-6" />
              <div>
                <h3 className="font-bold">Assistente Virtual</h3>
                <p className="text-xs opacity-90">{useAI ? '🤖 Modo IA Ativo' : '💬 Modo Padrão'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-lg transition-colors"
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
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : message.isLoading
                      ? 'bg-gray-200 text-gray-600'
                      : 'bg-white text-gray-800 shadow-md border border-gray-200'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        {message.isAI && <span className="text-xs">🤖 IA</span>}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {message.options && message.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleOptionClick(option)}
                              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}

                      {message.type === 'bot' && !message.isLoading && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => handleFeedback(message.id, true)}
                            className="text-xs text-gray-500 hover:text-green-600 flex items-center gap-1"
                          >
                            <HandThumbUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, false)}
                            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                          >
                            <HandThumbDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={useAI ? "Pergunte qualquer coisa..." : "Digite sua mensagem..."}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-full hover:scale-105 transition-transform"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
