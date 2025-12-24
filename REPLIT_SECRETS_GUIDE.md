# Guia Completo de Configuração de Replit Secrets

## Índice

1. [Visão Geral](#visão-geral)
2. [Status Atual das Variáveis](#status-atual-das-variáveis)
3. [Como Configurar Replit Secrets](#como-configurar-replit-secrets)
4. [Variáveis Obrigatórias](#variáveis-obrigatórias)
5. [Variáveis de Produção](#variáveis-de-produção)
6. [Variáveis Opcionais](#variáveis-opcionais)
7. [Scripts de Verificação](#scripts-de-verificação)
8. [Diferenças entre Desenvolvimento e Produção](#diferenças-entre-desenvolvimento-e-produção)
9. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Este projeto utiliza **Replit Secrets** para gerenciar variáveis de ambiente de forma segura. Secrets são variáveis de ambiente que não são expostas no código e são armazenadas de forma criptografada.

### Por que usar Replit Secrets?

- ✅ Segurança: Credenciais não são expostas no código
- ✅ Facilidade: Interface visual para gerenciar secrets
- ✅ Ambiente: Diferentes valores para dev/prod
- ✅ Persistência: Valores mantidos entre deploys

---

## Status Atual das Variáveis

### ✅ Variáveis OBRIGATÓRIAS (Configuradas)

| Variável | Status | Descrição | Valor Atual |
|----------|--------|-----------|-------------|
| `DATABASE_URL` | ✅ Configurada | PostgreSQL connection string (Neon) | `postgresql://neondb_owner:npg_...` |
| `SESSION_SECRET` | ✅ Configurada | Secret para gerenciamento de sessões | `OCfQUxaxiMM3nnVPtk7m...` |

### ✅ Variáveis de PRODUÇÃO (Configuradas)

| Variável | Status | Descrição | Valor Atual |
|----------|--------|-----------|-------------|
| `JWT_ACCESS_SECRET` | ✅ Configurada | Secret para JWT access tokens | `47e02b3f66bfca83fc29...` |
| `JWT_REFRESH_SECRET` | ✅ Configurada | Secret para JWT refresh tokens | `ff47a1cd43c2acdbbc67...` |
| `NODE_ENV` | ✅ Configurada | Ambiente de execução | `development` |

### ✅ Variáveis de REPLIT AUTH (Configuradas)

| Variável | Status | Descrição | Valor Atual |
|----------|--------|-----------|-------------|
| `REPL_ID` | ✅ Auto-configurada | ID do deployment Replit | `ff6085d4-0d5d-4b78-8...` |
| `ISSUER_URL` | ⭕ Opcional | URL do OIDC issuer | Usa fallback: `https://replit.com/oidc` |

### ⭕ Variáveis OPCIONAIS (Algumas configuradas)

| Variável | Status | Descrição | Valor Atual |
|----------|--------|-----------|-------------|
| `PORT` | ✅ Configurada | Porta do servidor | `5000` |
| `RESEND_API_KEY` | ✅ Configurada | API key do Resend (email) | `re_Nmsv3wE3_AU1PPisj...` |
| `HUBSPOT_API_KEY` | ❌ Não configurada | API key do HubSpot CRM | - |
| `STRIPE_SECRET_KEY` | ❌ Não configurada | Secret key do Stripe | - |
| `SENTRY_DSN` | ❌ Não configurada | DSN do Sentry (error tracking) | - |

---

## Como Configurar Replit Secrets

### Passo 1: Acessar o Painel de Secrets

1. Abra seu projeto no Replit
2. No painel lateral esquerdo, clique no ícone de **"Tools"** (🔧)
3. Selecione **"Secrets"**
4. Ou use o atalho: clique no ícone de **cadeado** (🔒)

### Passo 2: Adicionar um Novo Secret

1. Clique em **"New Secret"** ou **"+ Add Secret"**
2. Digite o nome da variável (ex: `DATABASE_URL`)
3. Cole o valor da variável
4. Clique em **"Save"** ou pressione Enter

### Passo 3: Verificar Secrets Configurados

```bash
# Execute o script de verificação
npm run verify:env

# Ou diretamente:
node scripts/verify-env-vars.js
```

### Passo 4: Testar Conexão com Banco

```bash
# Teste a conexão com o PostgreSQL
npm run verify:db

# Ou diretamente:
node scripts/verify-database.js
```

---

## Variáveis Obrigatórias

### 1. DATABASE_URL (CRÍTICO)

**Descrição:** String de conexão com PostgreSQL (Neon)

**Formato:**
```
postgresql://username:password@host:port/database?sslmode=require
```

**Como obter:**
1. Acesse seu projeto no [Neon Console](https://console.neon.tech)
2. Vá em **"Connection Details"**
3. Copie a **"Connection String"** completa
4. Certifique-se que inclui `?sslmode=require` no final

**Status Atual:** ✅ Configurada
- Host: `ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech`
- Database: `neondb`
- User: `neondb_owner`
- SSL: Requerido

**Validação:**
- ✅ Deve começar com `postgresql://`
- ✅ Deve incluir `sslmode=require`
- ✅ Host deve ser Neon (`*.neon.tech`)

---

### 2. SESSION_SECRET (CRÍTICO)

**Descrição:** Secret usado para assinar cookies de sessão

**Formato:** String aleatória de no mínimo 32 caracteres

**Como gerar:**
```bash
# Gerar um novo secret (64 bytes):
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Ou hexadecimal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Status Atual:** ✅ Configurada

**Validação:**
- ✅ Mínimo 32 caracteres
- ✅ Deve ser aleatório e único
- ⚠️  NUNCA use valores padrão em produção

**Onde é usado:**
- `/home/runner/workspace/server/production.ts` (linha 28)
- `/home/runner/workspace/server/replitAuth.ts` (linha 31)

---

## Variáveis de Produção

### 1. JWT_ACCESS_SECRET

**Descrição:** Secret para assinar tokens JWT de acesso

**Como gerar:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Status Atual:** ✅ Configurada

**Validação:**
- ✅ Mínimo 32 caracteres (64 hexadecimal)
- ✅ Deve ser diferente de JWT_REFRESH_SECRET

**Onde é usado:**
- `/home/runner/workspace/server/utils/jwt.ts`

---

### 2. JWT_REFRESH_SECRET

**Descrição:** Secret para assinar tokens JWT de refresh

**Como gerar:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Status Atual:** ✅ Configurada

**Validação:**
- ✅ Mínimo 32 caracteres (64 hexadecimal)
- ✅ Deve ser diferente de JWT_ACCESS_SECRET

**Onde é usado:**
- `/home/runner/workspace/server/utils/jwt.ts`

---

### 3. NODE_ENV

**Descrição:** Define o ambiente de execução

**Valores aceitos:**
- `development` - Ambiente de desenvolvimento
- `production` - Ambiente de produção
- `test` - Ambiente de testes

**Status Atual:** ✅ Configurada como `development`

**⚠️  IMPORTANTE para PRODUÇÃO:**
Quando fazer deploy em produção, altere para `production`:
```
NODE_ENV=production
```

Isso ativa:
- ✅ Otimizações de performance
- ✅ Tratamento de erros apropriado
- ✅ Logging adequado
- ✅ SSL enforcement

---

## Variáveis Opcionais

### 1. PORT

**Descrição:** Porta onde o servidor irá rodar

**Padrão:** 5000

**Status Atual:** ✅ Configurada como `5000`

**Nota:** No Replit, a porta é automaticamente configurada. Você pode omitir esta variável.

---

### 2. RESEND_API_KEY

**Descrição:** API key do serviço Resend para envio de emails

**Como obter:**
1. Acesse [Resend Dashboard](https://resend.com/api-keys)
2. Crie uma nova API Key
3. Copie o valor (começa com `re_`)

**Status Atual:** ✅ Configurada

**Validação:**
- ✅ Deve começar com `re_`

**Onde é usado:**
- `/home/runner/workspace/server/routes/email.ts`
- `/home/runner/workspace/src/services/emailService.ts`

---

### 3. HUBSPOT_API_KEY (Opcional)

**Descrição:** API key do HubSpot CRM

**Status Atual:** ❌ Não configurada

**Como obter:**
1. Acesse [HubSpot API Keys](https://app.hubspot.com/settings/api-keys)
2. Gere uma nova Private App
3. Copie o Access Token

**Onde seria usado:**
- `/home/runner/workspace/functions/hubspot/create-contact.ts`
- `/home/runner/workspace/functions/hubspot/validate-prospect.ts`
- `/home/runner/workspace/src/components/ui/HubSpotIntegration.tsx`

---

### 4. STRIPE_SECRET_KEY (Opcional)

**Descrição:** Secret key do Stripe para pagamentos

**Status Atual:** ❌ Não configurada

**Como obter:**
1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copie a **Secret Key** (começa com `sk_`)
3. Use `sk_test_...` para testes, `sk_live_...` para produção

**Validação:**
- Deve começar com `sk_test_` ou `sk_live_`

**Onde seria usado:**
- `/home/runner/workspace/server/routes/stripe.ts`
- `/home/runner/workspace/src/pages/Checkout.tsx`

---

### 5. SENTRY_DSN (Opcional)

**Descrição:** DSN do Sentry para rastreamento de erros

**Status Atual:** ❌ Não configurada

**Como obter:**
1. Acesse [Sentry Project Settings](https://sentry.io/)
2. Vá em Settings > Projects > [Your Project]
3. Copie o DSN

**Validação:**
- Deve começar com `https://`

**Onde seria usado:**
- `/home/runner/workspace/src/config/sentry.config.ts`

---

## Scripts de Verificação

### Script 1: Verificar Variáveis de Ambiente

```bash
npm run verify:env
# ou
node scripts/verify-env-vars.js
```

**O que verifica:**
- ✅ Todas as variáveis obrigatórias estão configuradas
- ✅ Valores são válidos (formato correto)
- ✅ Secrets têm comprimento adequado
- ✅ URLs têm formato correto

**Output:**
```
REQUIRED VARIABLES:
✅ DATABASE_URL              OK
✅ SESSION_SECRET            OK

PRODUCTION VARIABLES:
✅ JWT_ACCESS_SECRET         OK
✅ JWT_REFRESH_SECRET        OK
✅ NODE_ENV                  OK

REPLIT AUTH VARIABLES:
✅ REPL_ID                   OK
⭕ ISSUER_URL                NOT_SET (optional)

OPTIONAL VARIABLES:
✅ PORT                      OK
✅ RESEND_API_KEY            OK
❌ HUBSPOT_API_KEY           MISSING
❌ STRIPE_SECRET_KEY         MISSING
❌ SENTRY_DSN                MISSING
```

---

### Script 2: Testar Conexão com Banco

```bash
npm run verify:db
# ou
node scripts/verify-database.js
```

**O que testa:**
1. ✅ DATABASE_URL está configurada
2. ✅ Formato da URL é válido
3. ✅ Consegue conectar ao banco
4. ✅ Versão do PostgreSQL
5. ✅ Lista tabelas existentes
6. ✅ Verifica conexões ativas
7. ✅ Mostra tamanho do banco

**Output:**
```
Step 1: Checking DATABASE_URL environment variable
DATABASE_URL: postgresql://neondb_owner:npg_...

Step 2: Parsing DATABASE_URL
Protocol: postgresql:
Host: ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech
Port: 5432
Database: neondb
SSL Mode: require
Detected PostgreSQL provider: Neon

Step 3: Testing database connection
Attempting to connect...
Connection successful!

Step 4: Checking PostgreSQL version
PostgreSQL 16.11 (74c6bb6)

Step 5: Checking database tables
Found 13 tables:
  - clients
  - nfe_uploads
  - notifications
  - pricing_plans
  - products
  - prospects
  - remuneration_tables
  - roles
  - sessions
  - support_materials
  - transactions
  - uploads
  - users

Step 6: Checking active connections
Active connections: 1

Step 7: Checking database size
Database size: 8432 kB

✅ VERIFICATION COMPLETED SUCCESSFULLY
```

---

## Diferenças entre Desenvolvimento e Produção

### Arquivo `.env` (Desenvolvimento)

```bash
# Usado apenas em desenvolvimento local
# NÃO é usado no Replit
# NÃO deve ser commitado no Git

DATABASE_URL=postgresql://...
SESSION_SECRET=...
JWT_ACCESS_SECRET=...
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Características:**
- 📁 Arquivo local `.env`
- 🔓 Não criptografado
- 💻 Apenas desenvolvimento
- ⚠️  Não usar em produção

---

### Replit Secrets (Produção)

```bash
# Configurado via interface do Replit
# Criptografado e seguro
# Usado em produção

DATABASE_URL=postgresql://...  (Neon production)
SESSION_SECRET=...              (Strong random)
JWT_ACCESS_SECRET=...           (Strong random)
NODE_ENV=production
```

**Características:**
- 🔒 Criptografado
- ☁️  Cloud-based
- 🚀 Produção
- ✅ Seguro

---

### Como DATABASE_URL é Carregado

```typescript
// server/db.ts (linha 3-4)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,  // ⚠️  PROBLEMA IDENTIFICADO!
  max: 20,
  // ...
});
```

**⚠️  PROBLEMA IDENTIFICADO:**
O arquivo `server/db.ts` está com `ssl: false`, mas o Neon requer `sslmode=require`.

**Solução Aplicada na URL:**
A DATABASE_URL já inclui `?sslmode=require` no final, o que sobrescreve a configuração de `ssl: false`.

**Recomendação:**
Alterar para:
```typescript
ssl: process.env.DATABASE_URL?.includes('sslmode=require')
  ? { rejectUnauthorized: false }
  : false
```

---

### Como SESSION_SECRET é Usado

```typescript
// server/production.ts (linha 28-34)
const requiredEnvVars = ['SESSION_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables`);
  process.exit(1);
}
```

**Validação:**
- ✅ Servidor não inicia sem SESSION_SECRET
- ✅ Valida no startup
- ✅ Falha de forma segura

---

### Replit Auth (REPL_ID)

```typescript
// server/production.ts (linha 36-42)
const replitAuthEnabled = !!process.env.REPL_ID;

if (!replitAuthEnabled) {
  console.warn('⚠️  WARNING: Replit Auth is DISABLED');
  console.warn('⚠️  Server will start without authentication.');
}
```

**Como funciona:**
- `REPL_ID` é configurado automaticamente pelo Replit
- Se presente: Replit Auth está ativado
- Se ausente: Servidor inicia sem autenticação (apenas dev)

---

## Troubleshooting

### ❌ Erro: "Missing required environment variables: DATABASE_URL"

**Causa:** DATABASE_URL não está configurada nos Replit Secrets

**Solução:**
1. Abra o painel de Secrets no Replit
2. Adicione `DATABASE_URL` com o valor do Neon
3. Reinicie o servidor

---

### ❌ Erro: "Connection terminated unexpectedly"

**Causa:** Problema de conexão com o banco Neon

**Soluções possíveis:**

1. **Verificar se o banco está ativo:**
   - Neon pausa bancos inativos após 5 minutos
   - Acesse o Neon Console e ative o banco

2. **Verificar SSL:**
   - Certifique-se que a URL tem `?sslmode=require`
   - Exemplo: `postgresql://user:pass@host/db?sslmode=require`

3. **Verificar credenciais:**
   - Execute `node scripts/verify-database.js`
   - Verifique se o username/password estão corretos

4. **Verificar timeout:**
   - O timeout está configurado para 30s
   - Se persistir, pode ser problema de rede

---

### ❌ Erro: "Replit Auth is DISABLED"

**Causa:** REPL_ID não está configurada

**Solução:**
- `REPL_ID` é configurado automaticamente pelo Replit
- Se estiver em desenvolvimento local, isso é esperado
- Se estiver no Replit, verifique se o deployment foi feito corretamente

---

### ❌ Erro: "Session secret is required"

**Causa:** SESSION_SECRET não está configurada

**Solução:**
1. Gere um novo secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
   ```
2. Adicione aos Replit Secrets como `SESSION_SECRET`
3. Reinicie o servidor

---

### ⚠️  Aviso: "Running in production mode with missing production variables"

**Causa:** NODE_ENV=production mas faltam variáveis de produção

**Solução:**
Certifique-se que estas variáveis estão configuradas:
- ✅ JWT_ACCESS_SECRET
- ✅ JWT_REFRESH_SECRET
- ✅ SESSION_SECRET (com secret forte)
- ✅ DATABASE_URL (Neon production)

---

### 🔍 Como Debugar Problemas de Secrets

```bash
# 1. Verificar quais variáveis estão configuradas
node scripts/verify-env-vars.js

# 2. Testar conexão com banco
node scripts/verify-database.js

# 3. Ver logs do servidor
# (no Replit Console)

# 4. Verificar se .env está sendo usado (dev only)
cat .env

# 5. Listar variáveis disponíveis (mascaradas)
printenv | grep -E "(DATABASE|SESSION|JWT|REPL)"
```

---

## Checklist de Deploy em Produção

Antes de fazer deploy em produção, verifique:

### 1. Secrets Obrigatórios
- [ ] `DATABASE_URL` - PostgreSQL Neon (produção)
- [ ] `SESSION_SECRET` - Secret forte (64+ chars)
- [ ] `JWT_ACCESS_SECRET` - Secret forte (64 hex)
- [ ] `JWT_REFRESH_SECRET` - Secret forte (64 hex)
- [ ] `NODE_ENV` - Configurado como `production`

### 2. Secrets de Auth
- [ ] `REPL_ID` - Auto-configurado pelo Replit
- [ ] Replit Auth testado e funcionando

### 3. Secrets Opcionais (se usar os serviços)
- [ ] `RESEND_API_KEY` - Para envio de emails
- [ ] `HUBSPOT_API_KEY` - Para integração CRM
- [ ] `STRIPE_SECRET_KEY` - Para pagamentos
- [ ] `SENTRY_DSN` - Para rastreamento de erros

### 4. Testes
- [ ] `npm run verify:env` - Passou
- [ ] `npm run verify:db` - Passou
- [ ] Servidor inicia sem erros
- [ ] Login funciona
- [ ] API responde corretamente

### 5. Segurança
- [ ] Todos os secrets são fortes e aleatórios
- [ ] Nenhum secret está hardcoded no código
- [ ] `.env` não está commitado no Git
- [ ] DATABASE_URL usa SSL (`sslmode=require`)

---

## Contatos e Suporte

### Documentação Adicional
- 📄 `/home/runner/workspace/DEPLOY.md` - Guia de deploy
- 📄 `/home/runner/workspace/README.md` - Documentação geral
- 📄 `/home/runner/workspace/ARCHITECTURE.md` - Arquitetura do sistema

### Scripts Úteis
```bash
# Verificar ambiente
npm run verify:env

# Testar banco
npm run verify:db

# Ver logs
# (no Replit Console)
```

### Links Externos
- [Neon Console](https://console.neon.tech) - Gerenciar banco de dados
- [Replit Secrets Docs](https://docs.replit.com/programming-ide/workspace-features/secrets) - Documentação oficial
- [Resend Dashboard](https://resend.com/api-keys) - Gerenciar API keys
- [HubSpot API Keys](https://app.hubspot.com/settings/api-keys) - Gerenciar integração
- [Stripe Dashboard](https://dashboard.stripe.com/apikeys) - Gerenciar pagamentos

---

**Última atualização:** 2025-12-24
**Status:** Todos os secrets obrigatórios estão configurados ✅
**Ambiente:** Development
**Banco:** Neon PostgreSQL - Conectado ✅
