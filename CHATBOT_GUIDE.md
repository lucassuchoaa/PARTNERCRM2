# 🤖 Guia do ChatBot - Assistente Virtual

## Visão Geral

O ChatBot é um assistente virtual inteligente integrado na área logada do Partners CRM, projetado para ajudar parceiros com dúvidas frequentes e fornecer pitches de vendas personalizados para cada produto.

## 🎯 Funcionalidades Principais

### 1. **Interface Interativa**
- Botão flutuante no canto inferior direito da tela
- Badge "AI" indicando assistente de inteligência artificial
- Interface de chat moderna e responsiva
- Animações e efeitos visuais suaves

### 2. **Árvore de Decisão Inteligente**

O bot opera através de uma árvore de decisão com três fluxos principais:

#### **Fluxo 1: Tirar Dúvidas**
Ajuda os parceiros com questões sobre:
- **Como fazer indicações**: Passo a passo completo do processo
- **Acompanhar clientes**: Como usar o funil de vendas e rastrear status
- **Comissões**: Informações sobre cálculo e pagamento
- **Material de apoio**: Como acessar e utilizar os recursos disponíveis

#### **Fluxo 2: Pitch de Vendas**
Fornece pitches estruturados e personalizados para cada produto:
- **Estrutura do Pitch**:
  - 🎯 Abertura impactante
  - 💡 Identificação do problema
  - ✅ Apresentação da solução
  - 💰 Benefícios mensuráveis
  - 📞 Chamada para ação (CTA)

- **Produtos Cobertos**:
  - Folha de Pagamento
  - Crédito Consignado
  - Benefícios
  - Produtos customizados adicionados pelo admin

#### **Fluxo 3: Informações Gerais**
Fornece uma visão geral da plataforma e suas funcionalidades.

### 3. **Características Técnicas**

#### **Interação**
- Resposta automática baseada em palavras-chave
- Opções de resposta rápida (botões)
- Campo de texto livre para perguntas personalizadas
- Histórico de conversa mantido durante a sessão

#### **UX/UI**
- Design responsivo e moderno
- Mensagens do usuário: gradiente azul/roxo
- Mensagens do bot: fundo branco com borda
- Timestamp em cada mensagem
- Scroll automático para última mensagem
- Indicador visual de bot online

#### **Navegação**
- Botão "Voltar" para retornar ao menu anterior
- Opção "Menu inicial" disponível em todos os fluxos
- Navegação contextual baseada no fluxo atual

## 📋 Exemplos de Uso

### Exemplo 1: Consultar processo de indicação
```
Usuário: "Como fazer indicações?"
Bot: [Fornece passo a passo completo com emojis e formatação]
```

### Exemplo 2: Solicitar pitch de vendas
```
Usuário: "Pitch de vendas"
Bot: "Para qual produto você gostaria de ver o pitch?"
Usuário: "Folha de Pagamento"
Bot: [Fornece pitch estruturado com todos os elementos]
```

### Exemplo 3: Tirar dúvida sobre comissões
```
Usuário: "Como funcionam as comissões?"
Bot: [Explica cálculo, pagamento e acompanhamento]
```

## 🛠️ Integração Técnica

### Componentes
- **ChatBot.tsx**: Componente principal do bot
- **Dashboard.tsx**: Integra o bot na área do parceiro
- **ManagerDashboard.tsx**: Integra o bot na área do gerente

### Props
```typescript
interface ChatBotProps {
  products: Array<{
    id: string
    name: string
    description: string
  }>
}
```

### Estados Principais
- `isOpen`: Controla visibilidade do chat
- `messages`: Histórico de mensagens
- `currentFlow`: Fluxo atual de conversa
- `selectedProduct`: Produto selecionado para pitch

## 🎨 Personalização

### Adicionar Novos Pitches
Para adicionar um pitch personalizado para um novo produto:

1. Localize a função `generatePitchContent` em `ChatBot.tsx`
2. Adicione uma nova entrada no objeto `pitches`:

```typescript
const pitches: { [key: string]: string } = {
  'Nome do Produto': `
🎯 **Pitch: Nome do Produto**

**Abertura:**
"Sua mensagem de abertura aqui..."

**Problema:**
"Descrição do problema que o produto resolve..."

**Solução:**
"Como o produto resolve o problema..."
• ✅ Benefício 1
• ✅ Benefício 2
• ✅ Benefício 3

**Benefícios:**
💰 Benefício quantificável
⏱️ Benefício de tempo
🔒 Benefício de segurança

**Chamada para ação:**
"CTA persuasivo..."
  `.trim()
}
```

### Adicionar Novas Categorias de Dúvidas
Para adicionar uma nova categoria de dúvidas:

1. Localize a seção `// Fluxo de dúvidas` na função `processUserInput`
2. Adicione um novo bloco condicional:

```typescript
else if (lowerInput.includes('nova_categoria')) {
  setTimeout(() => {
    addBotMessage(
      'Resposta detalhada para a nova categoria...',
      ['Outras dúvidas', 'Menu inicial']
    )
  }, 500)
}
```

3. Adicione a opção no menu de dúvidas:

```typescript
addBotMessage(
  'Entendo! Sobre qual assunto você tem dúvidas?',
  ['Como fazer indicações', 'Nova Categoria', 'Voltar']
)
```

## 🚀 Melhorias Futuras

### Sugestões de Evolução
1. **Integração com IA Real**: Conectar a OpenAI, Claude ou outro LLM
2. **Análise de Sentimento**: Detectar frustração e escalar para humano
3. **Histórico Persistente**: Salvar conversas no backend
4. **Notificações**: Alertar parceiro sobre novidades via bot
5. **Multi-idioma**: Suportar português, inglês e espanhol
6. **Analytics**: Rastrear perguntas mais frequentes
7. **Feedback**: Permitir avaliação das respostas
8. **Contexto Dinâmico**: Adaptar respostas baseado no perfil do usuário
9. **Sugestões Proativas**: Ofertar ajuda baseado em comportamento
10. **Voice-to-Text**: Permitir interação por voz

## 📱 Responsividade

O ChatBot está otimizado para:
- ✅ Desktop (largura fixa 384px)
- ✅ Tablet (adaptável)
- ✅ Mobile (ajuste automático)

## 🔒 Segurança

- Não coleta dados sensíveis
- Não envia informações para servidores externos
- Todo processamento é client-side
- Respeita privacidade do usuário

## 📊 Métricas de Sucesso

Para avaliar eficácia do bot, considere rastrear:
- Taxa de engajamento (% de usuários que abrem o bot)
- Perguntas mais frequentes
- Taxa de resolução (usuários que encontraram resposta)
- Tempo médio de sessão
- Fluxos mais utilizados
- Produtos com mais consultas de pitch

## 🆘 Troubleshooting

### Bot não aparece
- Verifique se está logado na plataforma
- Verifique se produtos foram carregados corretamente
- Limpe cache do navegador

### Respostas não funcionam
- Verifique palavras-chave no código
- Teste com opções de botão primeiro
- Verifique console do navegador para erros

### Estilização quebrada
- Verifique se Tailwind CSS está configurado
- Verifique imports de ícones do Heroicons
- Limpe build e reconstrua projeto

## 📞 Suporte

Para dúvidas sobre implementação ou melhorias:
1. Consulte a documentação do código
2. Verifique exemplos de uso neste guia
3. Entre em contato com a equipe de desenvolvimento
