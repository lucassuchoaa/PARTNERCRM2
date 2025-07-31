# 🚀 Somapay Dashboard

Um painel administrativo moderno e responsivo para a Somapay, desenvolvido com React, TypeScript e Tailwind CSS.

## 📋 Sobre o Projeto

O Somapay Dashboard é uma aplicação web completa que oferece:

- **Dashboard Interativo**: Visualização de métricas e KPIs em tempo real com funil clicável
- **Gerenciamento de Parceiros**: Cadastro e acompanhamento de parceiros comerciais
- **Painel Administrativo**: Controle completo do sistema para administradores
- **Relatórios Detalhados**: Análises e relatórios personalizáveis
- **Integração HubSpot**: Sincronização automática de dados
- **Sistema de Notificações**: Comunicação eficiente com usuários
- **Funil Interativo**: Etapas clicáveis para filtrar dados dinamicamente

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: Headless UI + Heroicons
- **Build Tool**: Vite
- **Backend**: JSON Server (desenvolvimento)
- **Autenticação**: Sistema próprio com localStorage
- **E-mail**: Resend - Serviço de envio de e-mails transacionais
- **Deploy**: Vercel

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/lucassuchoaa/somapay-dashboard.git
   cd somapay-dashboard
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Configure as variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
    # HubSpot Configuration
    VITE_HUBSPOT_ACCESS_TOKEN=seu-token-hubspot-aqui
    
    # Resend API Configuration
    # IMPORTANTE: Use VITE_ prefix para variáveis acessíveis no frontend
    VITE_RESEND_API_KEY=sua-chave-resend-aqui
    VITE_DEFAULT_FROM_EMAIL=noreply@somapay.com
    VITE_APP_URL=http://localhost:5173
    VITE_API_URL=http://localhost:3001
    ```

5. **Inicie o servidor JSON (em outro terminal)**
   ```bash
   npx json-server --watch db.json --port 3001
   ```

6. **Acesse a aplicação**
   - Frontend: http://localhost:5173/
   - API: http://localhost:3001/

## 🔐 Credenciais de Acesso

### Administrador
- **Email**: admin@somapay.com.br
- **Senha**: SomaPay@2024!

### Parceiro de Teste
- **Email**: parceiro1@empresa.com
- **Senha**: parceiro123

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                 # Componentes da interface
│   │   ├── Dashboard.tsx   # Dashboard principal com funil interativo
│   │   ├── Admin.tsx       # Painel administrativo
│   │   ├── Login.tsx       # Tela de login
│   │   ├── Clients.tsx     # Gerenciamento de clientes
│   │   ├── Reports.tsx     # Relatórios
│   │   └── ...
│   └── examples/           # Componentes de exemplo
├── services/               # Serviços e APIs
│   ├── auth.ts            # Autenticação
│   └── hubspot.ts         # Integração HubSpot
├── assets/                # Recursos estáticos
└── ...
```

## 🎯 Funcionalidades Principais

### 📊 Dashboard
- Cards de estatísticas em tempo real
- Gráficos interativos
- **Funil de vendas clicável** com 4 etapas:
  - **Leads**: Primeira etapa do funil
  - **Negociação**: Segunda etapa do processo
  - **Proposta**: Terceira etapa de apresentação
  - **Fechados**: Contratos finalizados
- Filtros por produto e etapa
- Contadores dinâmicos em cada etapa
- Feedback visual ao selecionar filtros

### 🖱️ Funil Interativo (Nova Funcionalidade)
- **Etapas clicáveis**: Cada seção do funil filtra automaticamente a tabela
- **Contadores em tempo real**: Mostra quantidade de clientes por etapa
- **Filtros combinados**: Funciona junto com filtros de produto
- **Botão limpar filtro**: Remove filtros rapidamente
- **Indicadores visuais**: Mostra qual filtro está ativo
- **Cores diferenciadas**: Cada etapa muda de cor quando selecionada

### 👥 Gerenciamento de Usuários
- Cadastro de parceiros e administradores
- Controle de permissões
- Status de usuários (ativo/inativo)
- **E-mail de boas-vindas automático** para novos usuários
- Histórico de atividades

### 📈 Relatórios
- Relatórios de comissões
- Análise de performance
- Exportação em PDF
- **Notificação por e-mail** quando relatórios estão disponíveis
- Filtros avançados

### 🔧 Painel Administrativo
- Gerenciamento completo do sistema
- Upload e organização de arquivos
- Processamento de NFe
- Sistema de notificações
- **Envio automático por e-mail** para parceiros

### 🔗 Integrações
- **HubSpot**: Sincronização de contatos e deals
- **Resend**: Envio de e-mails transacionais
- **API REST**: Comunicação com backend
- **Webhooks**: Notificações em tempo real

## 🎨 Design System

- **Cores**: Paleta baseada na identidade Somapay
- **Tipografia**: Inter (sistema) com fallbacks
- **Componentes**: Reutilizáveis e acessíveis
- **Responsividade**: Mobile-first approach
- **Interatividade**: Elementos clicáveis com feedback visual
- **Modo Escuro**: Suporte completo (implementação futura)

## 📱 Responsividade

- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: 320px - 767px
- **Funil adaptativo**: Mantém funcionalidade em todos os tamanhos

## 🔒 Segurança

- Autenticação baseada em tokens
- Validação de permissões por rota
- Sanitização de dados de entrada
- Headers de segurança configurados

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte o repositório ao Vercel**
2. **Configure as variáveis de ambiente**
3. **Deploy automático a cada push**

### Build Manual

```bash
npm run build
npm run preview
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
npm run type-check   # Verificação de tipos
```

## 🆕 Últimas Atualizações

### Versão 2.2.0 - Integração de E-mail
- ✅ Integração com Resend para envio de e-mails
- ✅ E-mail de boas-vindas para novos usuários
- ✅ Notificações por e-mail para parceiros
- ✅ E-mail automático quando relatórios estão disponíveis
- ✅ Templates HTML personalizados para cada tipo de e-mail
- ✅ Configuração de variáveis de ambiente para Resend

### Versão 2.1.0 - Funil Interativo
- ✅ Implementado funil clicável com 4 etapas
- ✅ Contadores dinâmicos por etapa
- ✅ Filtros combinados (produto + etapa)
- ✅ Feedback visual e cores diferenciadas
- ✅ Botão para limpar filtros
- ✅ Indicadores de filtro ativo na tabela
- ✅ Responsividade mantida em todos os dispositivos

### Como Usar o Funil Interativo
1. **Visualize o funil**: Veja as 4 etapas com contadores em tempo real
2. **Clique em uma etapa**: A tabela será filtrada automaticamente
3. **Combine filtros**: Use filtros de produto junto com etapas
4. **Limpe filtros**: Use o botão "Limpar Filtro" ou clique na etapa ativa novamente
5. **Acompanhe resultados**: Veja quantos clientes estão sendo exibidos

### Sistema de E-mails

#### Tipos de E-mail Enviados:
1. **E-mail de Boas-vindas**: Enviado automaticamente quando um novo usuário é criado
2. **Notificações**: Enviadas para parceiros quando uma nova notificação é criada
3. **Relatórios Disponíveis**: Enviados quando um novo relatório é carregado no sistema

#### Como obter as chaves de API:

**HubSpot:**
1. Acesse sua conta HubSpot
2. Vá para Configurações → Integrações → Chaves de API
3. Clique em "Criar chave de API"
4. Copie o token gerado

**Resend:**
1. Acesse [https://resend.com/](https://resend.com/)
2. Faça login ou crie uma conta
3. Vá para API Keys
4. Clique em "Create API Key"
5. Copie a chave gerada

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Desenvolvedor

**Lucas Uchoa**
- Email: lucassuchoa@gmail.com
- GitHub: [@lucassuchoaa](https://github.com/lucassuchoaa)

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique a [documentação](docs/)
2. Consulte as [issues abertas](https://github.com/lucassuchoaa/somapay-dashboard/issues)
3. Crie uma nova issue se necessário

## 🔗 Links Úteis

- **Repositório**: https://github.com/lucassuchoaa/somapay-dashboard
- **Demo Online**: [Em breve]
- **Documentação Técnica**: [Em desenvolvimento]

---

**Desenvolvido com ❤️ para a Somapay**

*Última atualização: Dezembro 2024*