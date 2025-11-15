# 🤖 Guia Completo do ChatBot com IA - Partners CRM

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Configuração](#configuração)
3. [Como Funciona](#como-funciona)
4. [Uso do Sistema](#uso-do-sistema)
5. [Dashboard de Análise](#dashboard-de-análise)
6. [Treinamento e Customização](#treinamento-e-customização)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O ChatBot do Partners CRM é um **sistema híbrido** que combina:

- ✅ **Árvore de Decisão**: Respostas rápidas e estruturadas para perguntas comuns
- ✅ **Google Gemini AI**: Inteligência artificial para perguntas complexas e pitches personalizados
- ✅ **Sistema de Métricas**: Análise completa de interações e performance
- ✅ **Dashboard Administrativo**: Visualização e exportação de dados

### Funcionalidades Principais

1. **Modo Padrão** (Árvore de Decisão)
   - Respostas instantâneas
   - Fluxos predefinidos (dúvidas, pitches, informações)
   - Zero custo operacional

2. **Modo IA** (Google Gemini)
   - Respostas contextualizadas
   - Geração de pitches personalizados
   - Compreensão de linguagem natural
   - 15 requisições/minuto (plano gratuito)

3. **Sistema de Métricas**
   - Registro de todas as interações
   - Taxa de utilidade (feedback positivo/negativo)
   - Análise de fluxos mais usados
   - Tempo médio de resposta
   - Uso de tokens de IA

---

## ⚙️ Configuração

### 1. Obter API Key do Google Gemini

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada

### 2. Configurar no Projeto

1. Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

2. Edite o arquivo `.env.local` e adicione sua chave:

```env
VITE_GEMINI_API_KEY=sua-chave-aqui
```

3. Reinicie os servidores:

```bash
# Parar servidores (Ctrl+C)
# Iniciar novamente
./start.sh
```

### 3. Verificar Integração

1. Faça login no sistema
2. Clique no botão flutuante do ChatBot (canto inferior direito)
3. Clique em **"🤖 Modo IA"**
4. Digite uma pergunta
5. Você deve receber uma resposta gerada por IA

✅ **Funcionou?** → Configuração completa!
❌ **Erro?** → Veja [Troubleshooting](#troubleshooting)

---

## 🔧 Como Funciona

### Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                   ChatBotHybrid                      │
│  (Interface principal - /src/components/ui/)         │
└──────────────┬──────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│   Árvore    │  │  Gemini AI  │
│  Decisão    │  │   Service   │
│  (Local)    │  │  (API)      │
└──────┬──────┘  └──────┬──────┘
       │                │
       └────────┬───────┘
                ▼
        ┌───────────────┐
        │   Métricas    │
        │   Service     │
        │  (db.json)    │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │   Dashboard   │
        │   Analytics   │
        └───────────────┘
```

### Fluxo de Interação

1. **Usuário envia mensagem**
   - Sistema registra métrica (user message)

2. **Sistema decide rota**
   - Modo IA ativo? → Gemini API
   - Modo padrão? → Árvore de decisão

3. **Bot responde**
   - Sistema registra métrica (bot message)
   - Registra tokens usados (se IA)
   - Registra tempo de resposta

4. **Usuário avalia (opcional)**
   - 👍 Útil / 👎 Não útil
   - Sistema registra feedback

---

## 📱 Uso do Sistema

### Para Parceiros

#### Iniciar Conversa

1. Clique no botão flutuante 💬 (canto inferior direito)
2. Escolha uma opção:
   - **Tirar dúvidas**: FAQ estruturado
   - **Pitch de vendas**: Templates de pitch por produto
   - **Informações gerais**: Ajuda sobre a plataforma
   - **🤖 Modo IA**: Ativar inteligência artificial

#### Usar Modo IA

1. Clique em **"🤖 Modo IA"**
2. Faça qualquer pergunta em linguagem natural
3. Exemplos:
   - "Como posso aumentar minhas vendas?"
   - "Me ajude a fazer um pitch para uma empresa de 500 funcionários"
   - "Quais são os benefícios do produto X vs Y?"
4. Para voltar: Clique em **"Desativar IA"**

#### Gerar Pitch com IA

1. Escolha **"Pitch de vendas"**
2. Selecione o produto
3. Clique em **"🤖 Gerar com IA"**
4. O sistema gerará um pitch personalizado

#### Avaliar Respostas

- Clique em 👍 se a resposta foi útil
- Clique em 👎 se não ajudou
- Isso ajuda a melhorar o sistema!

### Para Administradores

#### Acessar Dashboard de Análise

1. Faça login como Admin
2. Vá para **"Administração"** no menu
3. Clique na aba **"📊 Análise ChatBot"**

#### Visualizar Métricas

O dashboard mostra:

- **Total de Interações**: Quantidade total de mensagens
- **Sessões Únicas**: Número de conversas
- **Taxa de Utilidade**: % de feedbacks positivos
- **Uso de IA**: % de mensagens geradas por IA
- **Fluxos Mais Acessados**: Quais tópicos são mais populares
- **Opções Mais Clicadas**: Quais botões são mais usados
- **Taxa de Conclusão**: % de conversas completadas
- **Top Usuários**: Parceiros mais ativos
- **Interações por Dia**: Gráfico de uso diário

#### Filtrar Dados

1. Selecione **Data Início** e **Data Fim**
2. Clique em **"Aplicar Filtro"**
3. Veja métricas do período selecionado

#### Exportar Dados

1. Clique em **"📥 Exportar CSV"**
2. Arquivo será baixado com todas as métricas
3. Abra no Excel/Google Sheets para análise

---

## 📊 Dashboard de Análise

### Métricas Principais

#### 1. Total de Interações
- **O que é**: Número total de mensagens (usuário + bot)
- **Para que serve**: Medir engajamento geral
- **Ideal**: Crescimento constante ao longo do tempo

#### 2. Sessões Únicas
- **O que é**: Número de conversas independentes
- **Para que serve**: Quantos usuários estão usando o bot
- **Cálculo**: Uma sessão = do início até fechar o chat

#### 3. Taxa de Utilidade
- **O que é**: % de feedbacks positivos (👍)
- **Para que serve**: Medir qualidade das respostas
- **Ideal**: Acima de 70%
- **Ação se baixa**: Revisar fluxos e treinar IA

#### 4. Uso de IA
- **O que é**: % de mensagens geradas por Gemini
- **Para que serve**: Monitorar custos e adoção do modo IA
- **Ideal**: 20-40% (equilíbrio custo/benefício)

#### 5. Tokens Usados
- **O que é**: Quantidade de tokens consumidos pela API
- **Para que serve**: Controlar custos da IA
- **Limite gratuito**: 1M tokens/mês
- **Ação se alto**: Otimizar prompts ou reduzir uso

#### 6. Tempo Médio de Resposta
- **O que é**: Quanto tempo o bot leva para responder
- **Para que serve**: Medir performance
- **Ideal**:
  - Árvore: < 100ms
  - IA: 1000-3000ms

### Análises Detalhadas

#### Fluxos Mais Acessados
Mostra quais tópicos os usuários mais procuram:
- **Dúvidas** → Precisa melhorar documentação?
- **Pitches** → Parceiros vendendo ativamente!
- **Informações** → Usuários perdidos na plataforma?

#### Opções Mais Clicadas
Identifica quais botões são mais usados:
- Alta taxa em "Voltar" → Fluxo confuso
- Alta taxa em "Modo IA" → Preferência por IA
- Baixa taxa em algum tópico → Remover ou melhorar

#### Taxa de Conclusão por Fluxo
Mede quantas conversas chegam até o fim:
- **Verde (>70%)**: Fluxo eficiente
- **Amarelo (40-70%)**: Precisa melhorias
- **Vermelho (<40%)**: Redesenhar fluxo

#### Top Usuários
Identifica parceiros mais engajados:
- Útil para reconhecer champions
- Útil para identificar quem precisa mais suporte

#### Interações por Dia
Gráfico mostrando uso ao longo do tempo:
- **Picos**: Campanhas, lançamentos
- **Quedas**: Problemas, falta de engajamento
- **Tendência**: Crescimento ou queda geral

---

## 🎓 Treinamento e Customização

### 🌳 Guia Completo da Árvore de Decisão

A árvore de decisão é o cérebro do ChatBot no modo padrão. Ela funciona como um mapa de conversação onde cada resposta do usuário leva a um novo caminho.

#### 📍 Localização
**Arquivo**: `/src/components/ui/ChatBotHybrid.tsx`
**Função**: `processUserInput()` - linha ~120

#### 🎯 Estrutura Atual

```
MENU INICIAL (flow: 'initial')
├── Tirar dúvidas (flow: 'faq')
│   ├── Como usar a plataforma
│   ├── Comissões
│   ├── Indicações
│   └── Voltar
│
├── Pitch de vendas (flow: 'pitch')
│   ├── [Lista de Produtos]
│   ├── 🤖 Gerar com IA
│   └── Voltar
│
├── Informações gerais (flow: 'info')
│   ├── Sobre a Somapay
│   ├── Contatos
│   ├── Suporte
│   └── Voltar
│
└── 🤖 Modo IA (flow: 'ai_mode')
    └── [Conversa livre com Gemini]
```

#### 🔧 Conceitos Importantes

**1. Flow (Fluxo)**
- É o "estado" atual da conversa
- Define qual menu está ativo
- Exemplo: `currentFlow = 'faq'` significa que estamos no menu de dúvidas

**2. Bot Message**
- Mensagem enviada pelo bot
- Pode incluir botões de opções
- Exemplo: `addBotMessage('Olá!', ['Opção 1', 'Opção 2'])`

**3. User Input**
- Texto digitado pelo usuário OU botão clicado
- Processado em minúsculas para facilitar comparação
- Exemplo: `lowerInput = userInput.toLowerCase()`

#### 📝 Como Adicionar Novo Fluxo

**Exemplo: Adicionar menu "Dicas de Vendas"**

**PASSO 1**: Adicionar botão no menu inicial

Localize a função que mostra o menu inicial (procure por `"Como posso ajudá-lo?"`) e adicione o novo botão:

```typescript
// ANTES
addBotMessage(
  'Como posso ajudá-lo?',
  ['Tirar dúvidas', 'Pitch de vendas', 'Informações gerais', '🤖 Modo IA']
)

// DEPOIS
addBotMessage(
  'Como posso ajudá-lo?',
  ['Tirar dúvidas', 'Pitch de vendas', '💡 Dicas de Vendas', 'Informações gerais', '🤖 Modo IA']
)
```

**PASSO 2**: Criar detector no fluxo inicial

Ainda dentro de `if (currentFlow === 'initial')`, adicione:

```typescript
if (currentFlow === 'initial') {
  // ... outros ifs existentes ...

  // ADICIONAR ESTE BLOCO
  else if (lowerInput.includes('dicas') || lowerInput.includes('vendas')) {
    setCurrentFlow('sales_tips')

    await logInteraction('bot', 'Acessou menu de dicas de vendas', {
      flow: 'sales_tips'
    })

    setTimeout(() => {
      addBotMessage(
        '💡 **Dicas de Vendas**\n\nEscolha um tópico:',
        [
          'Como abordar cliente',
          'Técnicas de fechamento',
          'Objeções comuns',
          'Pós-venda',
          'Menu inicial'
        ]
      )
    }, 500)
  }
}
```

**PASSO 3**: Criar handler do novo fluxo

Logo após o bloco do `currentFlow === 'initial'`, adicione:

```typescript
// NOVO FLUXO: Dicas de Vendas
else if (currentFlow === 'sales_tips') {

  if (lowerInput.includes('abordar')) {
    setTimeout(() => {
      addBotMessage(
        '🎯 **Como Abordar o Cliente**\n\n' +
        '1️⃣ Pesquise sobre a empresa antes\n' +
        '2️⃣ Identifique a dor do cliente\n' +
        '3️⃣ Mostre como você resolve o problema\n' +
        '4️⃣ Use cases de sucesso\n' +
        '5️⃣ Faça perguntas abertas\n\n' +
        '💡 Dica Extra: Use LinkedIn para pesquisar!',
        ['Outras dicas', 'Menu inicial']
      )
    }, 500)
  }

  else if (lowerInput.includes('fechamento')) {
    setTimeout(() => {
      addBotMessage(
        '🏆 **Técnicas de Fechamento**\n\n' +
        '✅ Alternativa: "Prefere implementar em janeiro ou fevereiro?"\n' +
        '✅ Resumo: "Então você quer X, Y e Z, correto?"\n' +
        '✅ Urgência: "Oferta válida até sexta-feira"\n' +
        '✅ Teste: "Se eu conseguir X, você fecha hoje?"\n' +
        '✅ Silêncio: Faça proposta e aguarde\n\n' +
        '🎯 Lembre-se: Sempre assuma que vai fechar!',
        ['Outras dicas', 'Menu inicial']
      )
    }, 500)
  }

  else if (lowerInput.includes('objeções') || lowerInput.includes('objeçoes')) {
    setTimeout(() => {
      addBotMessage(
        '🛡️ **Objeções Comuns e Como Responder**\n\n' +
        '❌ "Está caro"\n' +
        '✅ "Vamos comparar com o custo de não ter..."\n\n' +
        '❌ "Preciso pensar"\n' +
        '✅ "Claro! O que especificamente você gostaria de analisar?"\n\n' +
        '❌ "Não tenho orçamento"\n' +
        '✅ "Entendo. Quando vocês revisam o orçamento?"\n\n' +
        '💡 Toda objeção é uma oportunidade de aprofundar!',
        ['Outras dicas', 'Menu inicial']
      )
    }, 500)
  }

  else if (lowerInput.includes('pós') || lowerInput.includes('pos-venda')) {
    setTimeout(() => {
      addBotMessage(
        '🤝 **Pós-Venda de Sucesso**\n\n' +
        '1️⃣ Ligue 24h após implementação\n' +
        '2️⃣ Agende follow-ups quinzenais\n' +
        '3️⃣ Compartilhe dicas de uso\n' +
        '4️⃣ Peça feedback constantemente\n' +
        '5️⃣ Ofereça upsell no momento certo\n\n' +
        '⭐ Cliente satisfeito = indicações!',
        ['Outras dicas', 'Menu inicial']
      )
    }, 500)
  }

  // Voltar ao menu
  else if (lowerInput.includes('menu') || lowerInput.includes('voltar') || lowerInput.includes('inicial')) {
    setCurrentFlow('initial')
    setTimeout(() => {
      addBotMessage(
        'Como posso ajudá-lo?',
        ['Tirar dúvidas', 'Pitch de vendas', '💡 Dicas de Vendas', 'Informações gerais', '🤖 Modo IA']
      )
    }, 500)
  }

  // Não entendeu
  else {
    setTimeout(() => {
      addBotMessage(
        'Desculpe, não entendi. Escolha uma das opções:',
        [
          'Como abordar cliente',
          'Técnicas de fechamento',
          'Objeções comuns',
          'Pós-venda',
          'Menu inicial'
        ]
      )
    }, 500)
  }
}
```

**RESULTADO**: Agora você tem um novo menu "Dicas de Vendas" com 4 sub-opções!

#### 🎨 Dicas de Boas Práticas

**1. Use Emojis para Visual**
```typescript
addBotMessage('💡 Dica importante!', [...])  // Chama atenção
addBotMessage('✅ Sucesso!', [...])          // Feedback positivo
addBotMessage('❌ Atenção!', [...])          // Alerta
```

**2. Sempre Ofereça Volta**
```typescript
// SEMPRE inclua opção de retornar
['Opção 1', 'Opção 2', 'Menu inicial']  // ✅ BOM
['Opção 1', 'Opção 2']                   // ❌ RUIM - usuário fica preso
```

**3. Use Delays para Naturalidade**
```typescript
setTimeout(() => {
  addBotMessage('...', [...])
}, 500)  // 500ms = meio segundo (parece digitação natural)
```

**4. Registre Métricas**
```typescript
await logInteraction('bot', 'Texto da mensagem', {
  flow: 'nome_do_fluxo',           // Para saber qual menu
  selectedOption: 'Opção clicada'  // Para saber o que usuário escolheu
})
```

**5. Nomes de Flow**
- Use snake_case: `sales_tips`, `faq_comissions`
- Seja descritivo: `pitch_product_x` melhor que `p1`
- Evite acentos: `pos_venda` melhor que `pós_venda`

#### 🔍 Como Modificar Fluxos Existentes

**Exemplo 1: Adicionar nova pergunta no FAQ**

Localize o bloco `currentFlow === 'faq'` e adicione:

```typescript
else if (currentFlow === 'faq') {
  // ... perguntas existentes ...

  // ADICIONAR NOVA PERGUNTA
  else if (lowerInput.includes('suporte') || lowerInput.includes('ajuda')) {
    setTimeout(() => {
      addBotMessage(
        '🆘 **Suporte Técnico**\n\n' +
        '📧 Email: suporte@somapay.com\n' +
        '📞 Telefone: (11) 1234-5678\n' +
        '💬 WhatsApp: (11) 98765-4321\n\n' +
        'Horário: Seg-Sex, 9h-18h',
        ['Outras dúvidas', 'Menu inicial']
      )
    }, 500)
  }
}
```

**Exemplo 2: Atualizar informação existente**

```typescript
// ANTES
addBotMessage(
  'Comissões são pagas todo dia 5',
  [...]
)

// DEPOIS
addBotMessage(
  '💰 **Comissões**\n\n' +
  '📅 Pagamento: Todo dia 5\n' +
  '💳 Forma: PIX ou Transferência\n' +
  '📊 Consulte seu saldo na aba "Comissões"\n' +
  '📈 Comissão base: 10% sobre vendas\n' +
  '🏆 Bônus por performance: até 5% extra',
  ['Outras dúvidas', 'Menu inicial']
)
```

#### 🧪 Como Testar Suas Mudanças

**1. Teste o Caminho Feliz**
- Clique em cada botão
- Verifique se as mensagens aparecem
- Confirme que botões funcionam

**2. Teste Entrada de Texto**
```typescript
// Se você criou detecção por texto:
lowerInput.includes('vendas')

// Teste digitando:
- "vendas"     ✅ deve funcionar
- "VENDAS"     ✅ deve funcionar
- "Vendas!"    ✅ deve funcionar
- "dicas"      ✅ deve funcionar se incluir no includes()
```

**3. Teste Voltar ao Menu**
- De cada sub-menu, clique em "Menu inicial"
- Confirme que volta ao menu principal
- Teste "Voltar" se existir

**4. Verifique Métricas**
- Abra Admin > Análise ChatBot
- Use o bot
- Confirme que interações aparecem no dashboard

#### 📊 Exemplo Completo: Árvore Visual

```
USUÁRIO CLICA "💡 Dicas de Vendas"
         ↓
    [Flow muda para 'sales_tips']
         ↓
    Registra métrica
         ↓
    Mostra opções:
    - Como abordar cliente
    - Técnicas de fechamento
    - Objeções comuns
    - Pós-venda
    - Menu inicial
         ↓
USUÁRIO CLICA "Como abordar cliente"
         ↓
    [Ainda em 'sales_tips']
         ↓
    Mostra conteúdo da dica
         ↓
    Oferece opções:
    - Outras dicas (volta ao menu de dicas)
    - Menu inicial (volta ao início)
```

#### 💾 Checklist de Modificação

Antes de salvar suas mudanças, confirme:

- [ ] Adicionei botão no menu correto?
- [ ] Criei detecção com `lowerInput.includes()`?
- [ ] Mudei o `currentFlow` com `setCurrentFlow()`?
- [ ] Adicionei `setTimeout()` antes de `addBotMessage()`?
- [ ] Incluí botões de navegação (Voltar/Menu)?
- [ ] Registrei métrica com `logInteraction()`?
- [ ] Testei todos os caminhos?
- [ ] Adicionei tratamento para entrada não reconhecida (`else`)?

#### Como Modificar Pitches

Localize a seção de pitches:
```typescript
else if (currentFlow === 'pitch') {
  const selectedProd = products.find(p => lowerInput.includes(p.name.toLowerCase()))

  if (selectedProd) {
    let pitch = ''

    if (selectedProd.name.toLowerCase().includes('seu-produto')) {
      pitch = '🎯 **Pitch: Seu Produto**\n\n' +
             '✨ **Abertura impactante**\n' +
             '...'
    }
  }
}
```

### Inteligência Artificial (Gemini)

#### Onde Modificar
Arquivo: `/src/services/geminiService.ts`

#### Customizar Contexto da IA

```typescript
export async function askGemini(message: string, context?: string): Promise<GeminiResponse> {
  const prompt = context
    ? `Contexto: ${context}\n\nPergunta: ${message}\n\n
       Responda como um especialista em vendas da Somapay.
       Foque em ajudar parceiros a fecharem mais negócios.
       Seja persuasivo mas honesto.
       Use dados e exemplos concretos quando possível.`
    : `Pergunta: ${message}\n\nResponda de forma clara e objetiva.`

  // ... rest of code
}
```

#### Ajustar Parâmetros da IA

```typescript
generationConfig: {
  temperature: 0.7,      // Criatividade (0-1). Menor = mais conservador
  topK: 40,              // Variedade (1-100). Menor = mais focado
  topP: 0.95,            // Probabilidade acumulada (0-1)
  maxOutputTokens: 1024, // Tamanho máximo da resposta
}
```

**Recomendações**:
- **Pitches de vendas**: temperature: 0.9 (mais criativo)
- **Informações técnicas**: temperature: 0.3 (mais preciso)
- **Respostas curtas**: maxOutputTokens: 512
- **Respostas detalhadas**: maxOutputTokens: 2048

#### Criar Função Especializada

```typescript
export async function generateCustomPitch(
  productName: string,
  clientSize: number,
  clientSegment: string
): Promise<string> {
  const context = `Crie um pitch de vendas para o produto "${productName}".

Cliente:
- Tamanho: ${clientSize} funcionários
- Segmento: ${clientSegment}

O pitch deve:
1. Abordar dores específicas deste perfil
2. Destacar ROI esperado para empresas deste porte
3. Incluir case de sucesso similar
4. Ter call-to-action forte

Mantenha tom profissional e persuasivo.`

  const result = await askGemini('Gere o pitch', context)
  return result.response
}
```

### Sistema de Métricas

#### Adicionar Nova Métrica

1. **Atualizar interface** (`/src/services/chatMetricsService.ts`):
```typescript
export interface ChatMetric {
  // ... campos existentes
  customMetric?: string  // Nova métrica
}
```

2. **Registrar no log**:
```typescript
await logChatMetric({
  // ... campos existentes
  customMetric: 'valor'
})
```

3. **Exibir no dashboard** (`/src/components/ui/ChatAnalytics.tsx`):
```typescript
// Adicionar card de estatística
<div className="bg-white p-6 rounded-lg shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600 mb-1">Sua Métrica</p>
      <p className="text-3xl font-bold text-gray-800">{summary.customMetric}</p>
    </div>
    <div className="text-4xl">📈</div>
  </div>
</div>
```

---

## 🐛 Troubleshooting

### Erro: "GEMINI_API_KEY não configurada"

**Causa**: Chave de API não foi configurada
**Solução**:
1. Crie arquivo `.env.local`
2. Adicione: `VITE_GEMINI_API_KEY=sua-chave`
3. Reinicie servidores

### Erro: "Gemini API error: 429"

**Causa**: Limite de requisições excedido (15/minuto)
**Solução**:
- Aguarde 1 minuto
- Implemente rate limiting no frontend
- Considere upgrade do plano

### Erro: "Failed to fetch"

**Causa**: Problema de rede ou CORS
**Solução**:
1. Verifique conexão com internet
2. Verifique se API Key está válida
3. Tente novamente

### Dashboard sem dados

**Causa**: Nenhuma interação registrada ainda
**Solução**:
- Use o ChatBot algumas vezes
- Verifique se `db.json` tem array `chat_metrics`
- Reinicie json-server

### Métricas não aparecem

**Causa**: Erro ao salvar no db.json
**Solução**:
1. Verifique console do navegador (F12)
2. Verifique se json-server está rodando (porta 3001)
3. Teste manualmente: `curl http://localhost:3001/chat_metrics`

### ChatBot não abre

**Causa**: Erro de JavaScript
**Solução**:
1. Abra console (F12)
2. Veja mensagem de erro
3. Verifique se todos os arquivos foram criados
4. Execute: `npm install` e reinicie

---

## 📚 Arquivos do Sistema

### Componentes React
- `/src/components/ui/ChatBotHybrid.tsx` - ChatBot principal
- `/src/components/ui/ChatBot.tsx` - ChatBot antigo (backup)
- `/src/components/ui/ChatAnalytics.tsx` - Dashboard de análise

### Serviços
- `/src/services/geminiService.ts` - Integração com Gemini AI
- `/src/services/chatMetricsService.ts` - Sistema de métricas

### Configuração
- `.env.example` - Template de configuração
- `.env.local` - Suas configurações (não commitado)
- `db.json` - Banco de dados local

### Documentação
- `CHATBOT_AI_GUIDE.md` - Este guia
- `COMO_INICIAR.md` - Guia de inicialização
- `CHATBOT_GUIDE.md` - Guia do ChatBot original

---

## 🚀 Próximos Passos

### Melhorias Sugeridas

1. **Backend para API Keys**
   - Mover GEMINI_API_KEY para backend
   - Implementar proxy de requisições
   - Adicionar rate limiting server-side

2. **Análise Avançada**
   - Sentiment analysis nas mensagens
   - Identificação automática de tópicos
   - Sugestões de melhoria baseadas em IA

3. **Personalização por Usuário**
   - Histórico de conversas persistente
   - Recomendações baseadas em comportamento
   - Preferências de comunicação

4. **Integração com CRM**
   - Sugerir indicações baseadas em conversas
   - Criar tarefas automaticamente
   - Notificar gerentes sobre dúvidas frequentes

5. **A/B Testing**
   - Testar diferentes abordagens de pitch
   - Comparar árvore vs IA
   - Otimizar fluxos com base em dados

---

## ❓ FAQ

**P: O ChatBot funciona offline?**
R: Modo padrão sim, modo IA não (precisa de internet).

**P: Quantas requisições posso fazer por dia?**
R: Plano gratuito: ~21.600 requisições/dia (15/min).

**P: Os dados ficam salvos onde?**
R: db.json localmente. Para produção, usar banco real.

**P: Posso usar outra IA além do Gemini?**
R: Sim! Crie um novo serviço similar ao geminiService.ts.

**P: O ChatBot aprende sozinho?**
R: Não. Usa a IA do Gemini, que é treinada pelo Google.

**P: Como faço backup das métricas?**
R: Exporte CSV regularmente ou copie array `chat_metrics` do db.json.

**P: Posso desativar a IA?**
R: Sim! Não configure a API key ou remova o botão "Modo IA".

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Consulte este guia
2. Veja os logs no console (F12)
3. Verifique `TROUBLESHOOTING_CNPJ.md`
4. Abra issue no repositório

---

**Última atualização**: 2025-11-05
**Versão**: 2.0.0 (Sistema Híbrido com IA)
