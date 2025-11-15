# 🚀 Como Iniciar o Sistema - Guia Completo

## ⚠️ PROBLEMA ATUAL

O erro "Unexpected token '<', '<!DOCTYPE'..." acontece porque o **servidor JSON não está rodando**.

O sistema precisa de **2 servidores rodando ao mesmo tempo**:
1. **Servidor Frontend** (Vite) - Interface do usuário
2. **Servidor Backend** (JSON Server) - API de dados

---

## ✅ SOLUÇÃO: Iniciar os 2 Servidores

### 📋 Opção 1: Usando 2 Terminais (Recomendado)

#### Terminal 1 - Backend (JSON Server)
```bash
cd /Users/lucasuchoa/newpartnercrm/partners-platform
npm run server
```

**Deve aparecer:**
```
JSON Server started on PORT :3001
http://localhost:3001
```

#### Terminal 2 - Frontend (Vite)
```bash
cd /Users/lucasuchoa/newpartnercrm/partners-platform
npm run dev
```

**Deve aparecer:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

### 📋 Opção 2: Usando 1 Terminal (Mais Simples)

Vou criar um script que inicia os dois automaticamente:

1. **Execute este comando:**
```bash
cd /Users/lucasuchoa/newpartnercrm/partners-platform
npm run server & npm run dev
```

OU use o script que vou criar para você (veja abaixo)

---

## 🔧 Script Automático (Vou Criar Agora)

Vou criar um arquivo `start.sh` que inicia tudo automaticamente para você.

---

## 📝 Credenciais de Login

Depois que os servidores estiverem rodando, use:

### Admin Principal:
- **Email:** admin@somapay.com.br
- **Senha:** SomaPay@2024!

### Seu Usuário:
- **Email:** lucasuchoa@hotmail.com
- **Senha:** lucas123

### Parceiro Teste:
- **Email:** parceiro1@empresa.com
- **Senha:** parceiro123

---

## ✅ Verificar se Está Funcionando

### 1. Testar Backend (JSON Server)
Abra no navegador: http://localhost:3001/users

**Deve mostrar:** Lista de usuários em JSON

### 2. Testar Frontend (Vite)
Abra no navegador: http://localhost:5173/

**Deve mostrar:** Página de login

---

## 🐛 Troubleshooting

### Erro: "Port 3001 already in use"
```bash
# Encontrar e matar processo na porta 3001
lsof -ti:3001 | xargs kill -9

# Tentar novamente
npm run server
```

### Erro: "Port 5173 already in use"
```bash
# Encontrar e matar processo na porta 5173
lsof -ti:5173 | xargs kill -9

# Tentar novamente
npm run dev
```

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
npm install

# Tentar novamente
npm run server
npm run dev
```

---

## 🎯 Checklist de Inicialização

- [ ] Terminal 1: `npm run server` rodando
- [ ] Ver mensagem: "JSON Server started on PORT :3001"
- [ ] Terminal 2: `npm run dev` rodando
- [ ] Ver mensagem: "Local: http://localhost:5173/"
- [ ] Abrir: http://localhost:5173/
- [ ] Fazer login com credenciais acima
- [ ] ✅ Sistema funcionando!

---

## 📦 Estrutura de Pastas

```
partners-platform/
├── db.json              ← Banco de dados (JSON Server)
├── package.json         ← Scripts npm
├── src/                 ← Código fonte
│   ├── components/      ← Componentes React
│   ├── services/        ← Serviços (auth, cnpj, etc)
│   └── config/          ← Configurações
└── dist/               ← Build de produção
```

---

## 🚀 Para Produção

### Build
```bash
npm run build
```

### Preview do Build
```bash
npm run preview
```

---

## 💡 Dica

Crie aliases no seu terminal para facilitar:

```bash
# Adicione ao seu ~/.zshrc ou ~/.bashrc
alias partners-start='cd /Users/lucasuchoa/newpartnercrm/partners-platform && npm run server & npm run dev'
alias partners-stop='lsof -ti:3001 | xargs kill -9 && lsof -ti:5173 | xargs kill -9'
```

Depois é só executar:
```bash
partners-start  # Inicia tudo
partners-stop   # Para tudo
```

---

## ❓ FAQ

**P: Por que preciso de 2 servidores?**
R: O Vite serve a interface (frontend) e o JSON Server serve os dados (backend/API).

**P: Posso usar apenas 1 terminal?**
R: Sim, use o comando com `&` ou o script start.sh que vou criar.

**P: O que fazer se esquecer de iniciar o JSON Server?**
R: Você verá o erro de JSON ao tentar fazer login. Basta iniciar com `npm run server`.

**P: Como sei se está tudo rodando?**
R: Acesse http://localhost:3001/users (deve mostrar JSON) e http://localhost:5173/ (deve mostrar login).

---

## 🎉 Pronto!

Agora execute os comandos acima e o sistema funcionará perfeitamente! 🚀
