# 🚀 Somapay Dashboard

Um painel administrativo moderno e responsivo para a Somapay, desenvolvido com React, TypeScript e Tailwind CSS.

## 📋 Sobre o Projeto

O Somapay Dashboard é uma aplicação web completa que oferece:

- **Dashboard Interativo**: Visualização de métricas e KPIs em tempo real
- **Gerenciamento de Parceiros**: Cadastro e acompanhamento de parceiros comerciais
- **Painel Administrativo**: Controle completo do sistema para administradores
- **Relatórios Detalhados**: Análises e relatórios personalizáveis
- **Integração HubSpot**: Sincronização automática de dados
- **Sistema de Notificações**: Comunicação eficiente com usuários

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: Headless UI + Heroicons
- **Build Tool**: Vite
- **Backend**: JSON Server (desenvolvimento)
- **Autenticação**: Sistema próprio com localStorage
- **Deploy**: Vercel

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

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique a [documentação](docs/)
2. Consulte as [issues abertas](https://github.com/seu-usuario/somapay-dashboard/issues)
3. Crie uma nova issue se necessário

---

**Desenvolvido com ❤️ para a Somapay**
