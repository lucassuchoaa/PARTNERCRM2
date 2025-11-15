# 🚀 Partners Platform CRM

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://vercel.com)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/lucasuchoa/partners-platform)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Monitoring](https://img.shields.io/badge/monitoring-Sentry-purple)](https://sentry.io)

Um painel CRM moderno e completo para gerenciamento de parceiros, desenvolvido com React, TypeScript e Tailwind CSS.

## 📋 Sobre o Projeto

O Partners Platform é uma aplicação web enterprise completa para gerenciamento de parceiros comerciais:

- **Dashboard Interativo**: Visualização de métricas e KPIs em tempo real
- **Gerenciamento de Parceiros**: Cadastro, acompanhamento e análise de performance
- **Painel Administrativo**: Controle completo do sistema para administradores e gestores
- **Relatórios Avançados**: Análises detalhadas e relatórios personalizáveis em PDF
- **Integração HubSpot**: Sincronização bidirecional automática de dados CRM
- **Chatbot IA**: Assistente virtual inteligente com Gemini AI
- **Sistema de Indicações**: Gestão completa de leads e comissões
- **Monitoring & Observability**: Sentry error tracking e Web Vitals performance monitoring

## 🛠️ Tecnologias Utilizadas

### Core Stack
- **Frontend**: React 18.2 + TypeScript 5.2
- **Build Tool**: Vite 5.0 (HMR, otimizações avançadas)
- **Styling**: Tailwind CSS 3.4
- **Components**: Headless UI 2.2 + Heroicons 2.2
- **Routing**: React Router 6.22 (hash-based)
- **State Management**: React Query 5.90 (server state) + Context API (client state)

### Integrations
- **CRM**: HubSpot API 13.0
- **AI**: Google Gemini AI
- **Email**: Resend 4.7
- **ERP**: NetSuite (planejado)

### DevOps & Monitoring
- **Hosting**: Vercel (serverless)
- **Error Tracking**: Sentry
- **Performance**: Web Vitals
- **CI/CD**: GitHub Actions (configurável)

### Development
- **Backend Mock**: JSON Server 1.0
- **Type Safety**: TypeScript strict mode
- **Code Quality**: ESLint + React Hooks rules
- **Animation**: Framer Motion 12

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/somapay-dashboard.git
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

4. **Inicie o servidor JSON (em outro terminal)**
   ```bash
   npx json-server --watch db.json --port 3001
   ```

5. **Acesse a aplicação**
   - Frontend: http://localhost:5174/
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
│   │   ├── Dashboard.tsx   # Dashboard principal
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
- Funil de vendas
- Filtros por produto e período

### 👥 Gerenciamento de Usuários
- Cadastro de parceiros e administradores
- Controle de permissões
- Status de usuários (ativo/inativo)
- Histórico de atividades

### 📈 Relatórios
- Relatórios de comissões
- Análise de performance
- Exportação em PDF
- Filtros avançados

### 🔧 Painel Administrativo
- Gerenciamento completo do sistema
- Upload e organização de arquivos
- Processamento de NFe
- Sistema de notificações

### 🔗 Integrações
- **HubSpot**: Sincronização de contatos e deals
- **API REST**: Comunicação com backend
- **Webhooks**: Notificações em tempo real

## 🎨 Design System

- **Cores**: Paleta baseada na identidade Somapay
- **Tipografia**: Inter (sistema) com fallbacks
- **Componentes**: Reutilizáveis e acessíveis
- **Responsividade**: Mobile-first approach
- **Modo Escuro**: Suporte completo (implementação futura)

## 📱 Responsividade

- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: 320px - 767px

## 🔒 Segurança

### Security Headers
- **Content Security Policy (CSP)**: Proteção contra XSS
- **HSTS**: Strict Transport Security
- **X-Frame-Options**: DENY (proteção contra clickjacking)
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin

### Authentication & Authorization
- Role-based access control (RBAC)
- Secure credential storage
- Session timeout
- API key rotation support

### Data Protection
- Input validation e sanitization
- Output encoding
- API keys em environment variables
- Serverless functions para operações sensíveis

## 🚀 Deploy

### Vercel (Recomendado)

**Guia Completo**: Ver [DEPLOY.md](./DEPLOY.md)

**Quick Start**:
1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente (ver abaixo)
3. Deploy automático a cada push

### Variáveis de Ambiente Necessárias

```bash
# Application
VITE_APP_URL=https://your-domain.vercel.app
VITE_API_URL=https://your-domain.vercel.app/api
VITE_APP_VERSION=1.0.0

# Monitoring
VITE_SENTRY_DSN=your-sentry-dsn

# Integrations
VITE_HUBSPOT_API_KEY=your-hubspot-key
VITE_GEMINI_API_KEY=your-gemini-key

# Node
NODE_ENV=production
```

### Verificação Pós-Deploy

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Status check
curl https://your-domain.vercel.app/api/status
```

## 📝 Scripts Disponíveis

### Development
```bash
npm run dev              # Servidor de desenvolvimento (Vite)
npm run server           # Mock API server (JSON Server)
npm run lint             # ESLint code checking
```

### Testing
```bash
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests with Playwright
npm run test:e2e:ui      # Open Playwright UI
```

#### Test Coverage
- **Total Coverage**: 84.31%
- **Statements**: 84.61%
- **Branches**: 65.78%
- **Functions**: 100%
- **Lines**: 84.31%

Tested Services:
- ✅ Auth Service (100% coverage)
- ✅ Email Service (71.42% coverage)
- ✅ API Config (100% coverage)

E2E Tests:
- ✅ Login flow
- ✅ Dashboard loading
- ✅ Application health checks

### Build & Preview
```bash
npm run build            # Build de produção otimizado
npm run preview          # Preview do build local
npm run build:analyze    # Analyze bundle size
```

### Deploy
```bash
npm run deploy:preview   # Deploy para preview (Vercel)
npm run deploy:prod      # Deploy para produção (Vercel)
```

### Health & Monitoring
```bash
npm run health-check     # Verificar health endpoints
npm run smoke-test       # Smoke tests pós-deploy
```

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
- Email: lucasuchoa@hotmail.com
- GitHub: [@lucasuchoa](https://github.com/lucasuchoa)

## 📚 Documentação Completa

- **[DEPLOY.md](./DEPLOY.md)**: Guia completo de deployment e disaster recovery
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Arquitetura do sistema e diagramas
- **[API.md](./API.md)**: Documentação completa da API
- **[HUBSPOT_INTEGRATION.md](./HUBSPOT_INTEGRATION.md)**: Integração HubSpot
- **[NETSUITE_INTEGRATION.md](./NETSUITE_INTEGRATION.md)**: Integração NetSuite (planejado)

## 📊 Monitoring & Observability

### Error Tracking (Sentry)
- Erros de frontend e backend
- Performance monitoring
- User feedback
- Session replay

### Performance Metrics
- Core Web Vitals (LCP, FID, CLS)
- Custom performance measurements
- API response times
- Bundle size tracking

### Health Checks
- `/api/health` - System health and dependencies
- `/api/status` - Public status information
- Automated uptime monitoring

## 🔧 Performance

### Optimizations
- Code splitting (vendor, UI, query chunks)
- Lazy loading (routes and components)
- Tree shaking
- Terser minification
- Asset compression

### Targets
- Load Time: < 3s (3G), < 1s (WiFi)
- Bundle Size: < 500KB initial, < 2MB total
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique a [documentação completa](./DEPLOY.md)
2. Consulte as [issues abertas](https://github.com/lucasuchoa/partners-platform/issues)
3. Crie uma nova issue se necessário
4. Contate o desenvolvedor: lucasuchoa@hotmail.com

---

**Desenvolvido com ❤️ por Lucas Uchoa**
