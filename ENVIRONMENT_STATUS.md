# Status de Variáveis de Ambiente - Partners CRM

**Última Verificação:** 2025-12-24
**Status Geral:** ✅ APROVADO (Desenvolvimento) | ⚠️ APROVADO COM RESSALVAS (Produção)

---

## Status Rápido

```
✅ DATABASE_URL          CONFIGURADA - Neon PostgreSQL conectado
✅ SESSION_SECRET        CONFIGURADA - 64+ caracteres
✅ JWT_ACCESS_SECRET     CONFIGURADA - 64 hex
✅ JWT_REFRESH_SECRET    CONFIGURADA - 64 hex
✅ NODE_ENV              CONFIGURADA - development (alterar para production)
✅ REPL_ID               CONFIGURADA - Auto (Replit)
✅ PORT                  CONFIGURADA - 5000
✅ RESEND_API_KEY        CONFIGURADA - Email service
❌ HUBSPOT_API_KEY       NÃO CONFIGURADA (opcional)
❌ STRIPE_SECRET_KEY     NÃO CONFIGURADA (opcional)
❌ SENTRY_DSN            NÃO CONFIGURADA (recomendado)
```

---

## Teste de Conexão com Banco

```
✅ Conexão: OK
✅ Provider: Neon PostgreSQL
✅ Versão: PostgreSQL 16.11
✅ Host: ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech
✅ Database: neondb
✅ SSL: Habilitado (sslmode=require)
✅ Tabelas: 13 encontradas
✅ Tamanho: 8432 kB (8.4 MB)
✅ Conexões Ativas: 1
```

---

## Como Configurar Replit Secrets

### Passo 1: Abrir Painel de Secrets
1. No Replit, clique no ícone 🔒 (cadeado) no painel lateral
2. Ou vá em Tools > Secrets

### Passo 2: Adicionar Secret
1. Clique em "New Secret" ou "+ Add Secret"
2. Digite o nome da variável (ex: `DATABASE_URL`)
3. Cole o valor
4. Clique em "Save"

### Passo 3: Verificar
```bash
npm run verify:env    # Verifica todas as variáveis
npm run verify:db     # Testa conexão com banco
npm run verify:all    # Executa ambos
```

---

## Variáveis por Prioridade

### 🔴 CRÍTICAS (Obrigatórias - Servidor não inicia sem elas)

**DATABASE_URL**
- Status: ✅ Configurada
- Formato: `postgresql://user:password@host:port/database?sslmode=require`
- Como obter: Neon Console > Connection Details
- Valor atual: `postgresql://neondb_owner:npg_tQTsRLA9yFr5...`

**SESSION_SECRET**
- Status: ✅ Configurada
- Formato: String aleatória (mínimo 32 chars)
- Como gerar: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`
- Valor atual: `OCfQUxaxiMM3nnVPtk7mSI0rrSyFt...`

---

### 🟡 PRODUÇÃO (Necessárias para deploy em produção)

**JWT_ACCESS_SECRET**
- Status: ✅ Configurada
- Formato: 64 caracteres hexadecimal
- Como gerar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Valor atual: `47e02b3f66bfca83fc2906df43c3...`

**JWT_REFRESH_SECRET**
- Status: ✅ Configurada
- Formato: 64 caracteres hexadecimal (diferente de JWT_ACCESS_SECRET)
- Como gerar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Valor atual: `ff47a1cd43c2acdbbc673be94e29...`

**NODE_ENV**
- Status: ✅ Configurada (development)
- ⚠️ AÇÃO NECESSÁRIA: Alterar para `production` antes de deploy
- Valores aceitos: `development`, `production`, `test`

---

### 🔵 REPLIT AUTH (Auto-configuradas)

**REPL_ID**
- Status: ✅ Auto-configurada
- Configurado automaticamente pelo Replit
- Valor atual: `ff6085d4-0d5d-4b78-8bd6-63a74...`

**ISSUER_URL**
- Status: ⭕ Opcional (usa fallback)
- Fallback padrão: `https://replit.com/oidc`
- Não precisa ser configurada manualmente

---

### 🟢 OPCIONAIS (Recursos extras)

**RESEND_API_KEY** (Email Service)
- Status: ✅ Configurada
- Como obter: https://resend.com/api-keys
- Formato: Começa com `re_`
- Valor atual: `re_Nmsv3wE3_AU1PPisjx1H7bhhg...`

**HUBSPOT_API_KEY** (CRM Integration)
- Status: ❌ Não configurada
- Como obter: https://app.hubspot.com/settings/api-keys
- Necessário apenas se usar integração HubSpot

**STRIPE_SECRET_KEY** (Payments)
- Status: ❌ Não configurada
- Como obter: https://dashboard.stripe.com/apikeys
- Formato: `sk_test_` (teste) ou `sk_live_` (produção)
- Necessário apenas se usar pagamentos Stripe

**SENTRY_DSN** (Error Tracking)
- Status: ❌ Não configurada
- Como obter: https://sentry.io/
- Formato: Começa com `https://`
- ⚠️ Recomendado para produção

---

## Scripts de Verificação

### Verificar Variáveis de Ambiente
```bash
npm run verify:env
```

**Saída:**
```
REQUIRED VARIABLES:
✅ DATABASE_URL              OK
✅ SESSION_SECRET            OK

PRODUCTION VARIABLES:
✅ JWT_ACCESS_SECRET         OK
✅ JWT_REFRESH_SECRET        OK
✅ NODE_ENV                  OK

SUMMARY:
✅ All required variables are set
✅ Environment check PASSED
```

### Testar Conexão com Banco
```bash
npm run verify:db
```

**Saída:**
```
Step 1: Checking DATABASE_URL
✅ DATABASE_URL: postgresql://neondb_owner:npg_...

Step 2: Parsing DATABASE_URL
✅ Detected PostgreSQL provider: Neon

Step 3: Testing database connection
✅ Connection successful!

Step 4: Checking PostgreSQL version
✅ PostgreSQL 16.11

Step 5: Checking database tables
✅ Found 13 tables

✅ VERIFICATION COMPLETED SUCCESSFULLY
```

### Verificar Tudo
```bash
npm run verify:all
```

---

## Problemas Identificados

### ⚠️ Problema 1: SSL no Pool do Banco (Prioridade: MÉDIA)

**Arquivo:** `/home/runner/workspace/server/db.ts` (linha 5)

**Problema:**
```typescript
ssl: false,  // ❌ Conflita com sslmode=require
```

**Status:** Funciona atualmente (URL tem `?sslmode=require`), mas pode causar confusão

**Solução Recomendada:**
```typescript
ssl: process.env.DATABASE_URL?.includes('sslmode=require')
  ? { rejectUnauthorized: false }
  : false,
```

---

### ⚠️ Problema 2: NODE_ENV em Development (Prioridade: ALTA para produção)

**Status Atual:** `development`

**Ação Necessária:**
Antes de deploy em produção, alterar nos Replit Secrets:
```
NODE_ENV=production
```

**Impacto:**
- Ativa otimizações de performance
- Melhora segurança
- Ajusta logging
- Força SSL em algumas operações

---

### ⚠️ Problema 3: Sentry Não Configurado (Prioridade: MÉDIA)

**Status:** Não configurado

**Recomendação:**
Configure Sentry para rastreamento de erros em produção.

**Como configurar:**
1. Crie conta no https://sentry.io/
2. Crie novo projeto
3. Copie o DSN
4. Adicione aos Replit Secrets: `SENTRY_DSN=https://...`

---

## Checklist de Deploy em Produção

### Antes de Deploy
- [x] DATABASE_URL configurada e testada
- [x] SESSION_SECRET configurado (forte)
- [x] JWT secrets configurados
- [ ] NODE_ENV alterado para `production`
- [ ] Sentry configurado (recomendado)
- [ ] SSL do banco corrigido (recomendado)

### Testes
- [x] `npm run verify:env` passou
- [x] `npm run verify:db` passou
- [ ] Servidor inicia com NODE_ENV=production
- [ ] Login funciona
- [ ] API responde corretamente

### Segurança
- [x] Secrets são fortes e aleatórios
- [x] Nenhum secret hardcoded no código
- [x] .env não está no Git
- [x] DATABASE_URL usa SSL

---

## Diferenças Dev vs Produção

### Desenvolvimento (.env local)
```bash
NODE_ENV=development
DATABASE_URL=${DATABASE_URL}  # Referência a variável de ambiente
FRONTEND_URL=http://localhost:5173
```

### Produção (Replit Secrets)
```bash
NODE_ENV=production           # ⚠️ ALTERAR
DATABASE_URL=postgresql://... # Neon production
SENTRY_DSN=https://...        # ⚠️ ADICIONAR
```

---

## Comandos Úteis

### Gerar Secrets
```bash
# Secret hexadecimal (64 chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Secret base64 (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Ver Variáveis Configuradas (mascaradas)
```bash
printenv | grep -E "(DATABASE|SESSION|JWT|REPL)"
```

### Testar Servidor
```bash
npm run dev              # Desenvolvimento
npm run start            # Produção
npm run verify:all       # Verificar ambiente
```

---

## Links Importantes

- 📄 [Guia Completo de Secrets](REPLIT_SECRETS_GUIDE.md) - Documentação detalhada
- 📄 [Relatório de Auditoria](ENVIRONMENT_AUDIT_REPORT.md) - Análise completa
- 🔗 [Neon Console](https://console.neon.tech) - Gerenciar banco
- 🔗 [Replit Secrets Docs](https://docs.replit.com/programming-ide/workspace-features/secrets)
- 🔗 [Resend Dashboard](https://resend.com/api-keys) - Email API
- 🔗 [Sentry](https://sentry.io/) - Error tracking

---

## Suporte

### Troubleshooting Comum

**Erro: "Missing required environment variables: DATABASE_URL"**
- Solução: Adicione DATABASE_URL nos Replit Secrets

**Erro: "Connection terminated unexpectedly"**
- Verifique se o banco Neon está ativo (pode pausar após 5min)
- Verifique se a URL tem `?sslmode=require`

**Aviso: "Replit Auth is DISABLED"**
- Normal em desenvolvimento local
- No Replit, REPL_ID é configurado automaticamente

### Scripts de Diagnóstico

```bash
# 1. Verificar variáveis
npm run verify:env

# 2. Testar banco
npm run verify:db

# 3. Verificar tudo
npm run verify:all
```

---

**Resumo:** Ambiente está configurado corretamente para desenvolvimento. Para produção, altere NODE_ENV e configure Sentry.

**Status:** ✅ Pronto para desenvolvimento | ⚠️ Requer ajustes para produção
