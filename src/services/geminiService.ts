/**
 * Serviço de integração com Google Gemini API
 * Plano gratuito: 15 requisições por minuto, 1 milhão de tokens por minuto
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export interface GeminiResponse {
  response: string
  isFromAI: boolean
  tokens?: number
}

/**
 * Envia mensagem para o Gemini e retorna resposta
 */
export async function askGemini(message: string, context?: string): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada. Configure no arquivo .env')
  }

  try {
    const prompt = context
      ? `Contexto: ${context}\n\nPergunta do usuário: ${message}\n\nResponda de forma clara, objetiva e amigável em português. Foque em ajudar parceiros da Somapay com vendas e dúvidas sobre produtos financeiros.`
      : `Pergunta: ${message}\n\nResponda de forma clara, objetiva e amigável em português. Você é um assistente da Somapay ajudando parceiros com vendas.`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui gerar uma resposta.'
    const tokens = data.usageMetadata?.totalTokenCount || 0

    return {
      response: aiResponse,
      isFromAI: true,
      tokens
    }
  } catch (error: any) {
    console.error('Erro ao chamar Gemini:', error)
    throw new Error(error.message || 'Erro ao conectar com a IA. Tente novamente.')
  }
}

/**
 * Gera pitch de vendas personalizado usando IA
 */
export async function generateSalesPitch(productName: string, clientContext?: string): Promise<string> {
  const context = `Você é um especialista em vendas da Somapay. Crie um pitch de vendas persuasivo e profissional para o produto "${productName}".

${clientContext ? `Contexto do cliente: ${clientContext}` : ''}

O pitch deve incluir:
1. Abertura impactante
2. 3-4 benefícios principais
3. Diferencial competitivo
4. Call to action forte

Mantenha tom profissional mas acessível.`

  try {
    const result = await askGemini('Crie o pitch de vendas', context)
    return result.response
  } catch (error) {
    // Fallback para pitch padrão se IA falhar
    return `Olá! Gostaria de apresentar nosso produto ${productName}.

Com a Somapay, você oferece uma solução completa e moderna que simplifica processos, reduz custos e aumenta a satisfação dos colaboradores.

Principais benefícios:
• Implementação rápida e sem burocracia
• Economia de até 30% em custos operacionais
• Suporte especializado 24/7
• Plataforma intuitiva e segura

Vamos agendar uma demonstração?`
  }
}

export default {
  askGemini,
  generateSalesPitch
}
