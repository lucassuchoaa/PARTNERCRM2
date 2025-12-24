# Como Configurar Replit Secrets - Guia Visual Passo a Passo

## Índice
1. [O que são Replit Secrets](#o-que-são-replit-secrets)
2. [Como Acessar os Secrets](#como-acessar-os-secrets)
3. [Como Adicionar um Secret](#como-adicionar-um-secret)
4. [Como Editar um Secret](#como-editar-um-secret)
5. [Como Deletar um Secret](#como-deletar-um-secret)
6. [Configuração das Variáveis Obrigatórias](#configuração-das-variáveis-obrigatórias)
7. [Verificação e Testes](#verificação-e-testes)
8. [Troubleshooting](#troubleshooting)

---

## O que são Replit Secrets?

Replit Secrets são **variáveis de ambiente criptografadas** que permitem armazenar informações sensíveis de forma segura:

✅ **Vantagens:**
- Criptografados e seguros
- Não aparecem no código
- Não são commitados no Git
- Fáceis de gerenciar via interface visual
- Persistem entre deploys
- Acessíveis via `process.env.NOME_DA_VARIAVEL`

❌ **NÃO use Secrets para:**
- Configurações públicas (use variáveis normais)
- Valores que mudam frequentemente
- Dados temporários

---

## Como Acessar os Secrets

### Método 1: Painel Lateral (Recomendado)

```
1. No seu projeto Replit, olhe para o painel lateral ESQUERDO
2. Procure pelo ícone de CADEADO 🔒
3. Clique no ícone
4. O painel de Secrets será aberto
```

**Visual:**
```
┌─────────────────────────────────────────┐
│  Replit IDE                             │
├────────┬────────────────────────────────┤
│ 📁     │  Código                        │
│ 🔍     │                                │
│ 🔒 ←── │  CLIQUE AQUI                   │
│ 📦     │                                │
│ 🔧     │                                │
└────────┴────────────────────────────────┘
```

### Método 2: Menu Tools

```
1. Clique no ícone de FERRAMENTAS 🔧 (Tools)
2. No menu que abrir, selecione "Secrets"
3. O painel de Secrets será aberto
```

### Método 3: Atalho de Teclado (Desktop)

- **Mac:** `Cmd + K` > digite "Secrets" > Enter
- **Windows/Linux:** `Ctrl + K` > digite "Secrets" > Enter

---

## Como Adicionar um Secret

### Passo 1: Abrir o Painel de Secrets

Siga um dos métodos acima para abrir o painel de Secrets.

### Passo 2: Clicar em "New Secret"

```
┌─────────────────────────────────────────┐
│  Secrets                                │
├─────────────────────────────────────────┤
│                                         │
│  🔒 Secrets are encrypted environment   │
│     variables                           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  + New Secret                   │ ←─ CLIQUE AQUI
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Passo 3: Preencher o Formulário

```
┌─────────────────────────────────────────┐
│  Add a new secret                       │
├─────────────────────────────────────────┤
│                                         │
│  Key (nome da variável):                │
│  ┌─────────────────────────────────┐   │
│  │ DATABASE_URL                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Value (valor):                         │
│  ┌─────────────────────────────────┐   │
│  │ postgresql://user:pass@host/db  │   │
│  └─────────────────────────────────┘   │
│                                         │
│     [Cancel]  [Add Secret]              │
│                                         │
└─────────────────────────────────────────┘
```

### Passo 4: Salvar

1. Digite o **nome** da variável (ex: `DATABASE_URL`)
2. Cole o **valor** (ex: a string de conexão do Neon)
3. Clique em **"Add Secret"** ou pressione **Enter**

### Passo 5: Verificar

O secret aparecerá na lista:

```
┌─────────────────────────────────────────┐
│  Secrets                                │
├─────────────────────────────────────────┤
│  + New Secret                           │
│                                         │
│  DATABASE_URL                           │
│  postgresql://neon...  [Edit] [Delete] │
│                                         │
│  SESSION_SECRET                         │
│  OCfQUxaxiMM3nn...     [Edit] [Delete] │
│                                         │
└─────────────────────────────────────────┘
```

---

## Como Editar um Secret

### Passo 1: Localizar o Secret

Na lista de Secrets, encontre o que deseja editar.

### Passo 2: Clicar em "Edit"

```
┌─────────────────────────────────────────┐
│  DATABASE_URL                           │
│  postgresql://neon...  [Edit] [Delete] │ ← CLIQUE EM EDIT
└─────────────────────────────────────────┘
```

### Passo 3: Modificar o Valor

1. O formulário de edição será aberto
2. Modifique o valor
3. Clique em "Save" ou pressione Enter

⚠️ **ATENÇÃO:**
- O **nome** (key) não pode ser alterado
- Para mudar o nome, delete e crie um novo
- Alterações são aplicadas imediatamente

---

## Como Deletar um Secret

### Passo 1: Localizar o Secret

Na lista de Secrets, encontre o que deseja deletar.

### Passo 2: Clicar em "Delete"

```
┌─────────────────────────────────────────┐
│  HUBSPOT_API_KEY                        │
│  (empty)               [Edit] [Delete] │ ← CLIQUE EM DELETE
└─────────────────────────────────────────┘
```

### Passo 3: Confirmar

1. Uma confirmação será exibida
2. Clique em "Delete" novamente para confirmar
3. O secret será removido permanentemente

⚠️ **ATENÇÃO:**
- Deleção é **permanente**
- Se deletar um secret obrigatório, o servidor não iniciará
- Faça backup do valor antes de deletar

---

## Configuração das Variáveis Obrigatórias

### 1. DATABASE_URL (CRÍTICO)

**O que é:** String de conexão com PostgreSQL Neon

**Como obter:**

1. Acesse: https://console.neon.tech
2. Selecione seu projeto
3. Vá em "Connection Details"
4. Copie a "Connection String"
5. Certifique-se que tem `?sslmode=require` no final

**Exemplo de valor:**
```
postgresql://neondb_owner:npg_tQTsRLA9yFr5@ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Como adicionar:**

```
Key:   DATABASE_URL
Value: postgresql://neondb_owner:npg_[SUA_SENHA]@ep-[SEU_HOST].neon.tech/neondb?sslmode=require
```

**Validação:**
```bash
npm run verify:db
```

---

### 2. SESSION_SECRET (CRÍTICO)

**O que é:** Secret usado para assinar cookies de sessão

**Como gerar:**

```bash
# No terminal do Replit, execute:
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Exemplo de saída:**
```
OCfQUxaxiMM3nnVPtk7mSI0rrSyFtUVYf2cZDDKbnmj+nHDhONSSRPqa7YMkenP2NK9+Gxn8lwdpSQuVLMfUIA==
```

**Como adicionar:**

```
Key:   SESSION_SECRET
Value: [COLE O VALOR GERADO ACIMA]
```

⚠️ **IMPORTANTE:**
- Mínimo 32 caracteres
- Use o comando acima para gerar
- NUNCA use valores de exemplo em produção

---

### 3. JWT_ACCESS_SECRET (PRODUÇÃO)

**O que é:** Secret para assinar tokens JWT de acesso

**Como gerar:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo de saída:**
```
47e02b3f66bfca83fc2906df43c33e7f77d2e3f293b0829a0364b6080e761c87
```

**Como adicionar:**

```
Key:   JWT_ACCESS_SECRET
Value: [COLE O VALOR GERADO ACIMA]
```

---

### 4. JWT_REFRESH_SECRET (PRODUÇÃO)

**O que é:** Secret para assinar tokens JWT de refresh

**Como gerar:**

```bash
# Execute NOVAMENTE (gere um valor DIFERENTE de JWT_ACCESS_SECRET)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo de saída:**
```
b21149832fb0586f403f348b011ba174737c2cbf78713f292b3fd395bc535e33
```

**Como adicionar:**

```
Key:   JWT_REFRESH_SECRET
Value: [COLE O VALOR GERADO ACIMA - DIFERENTE DO ACCESS]
```

⚠️ **IMPORTANTE:**
- Deve ser DIFERENTE de JWT_ACCESS_SECRET
- Gere um novo valor separado

---

### 5. NODE_ENV (PRODUÇÃO)

**O que é:** Define o ambiente de execução

**Valores possíveis:**
- `development` - Desenvolvimento
- `production` - Produção
- `test` - Testes

**Como adicionar:**

**Para DESENVOLVIMENTO:**
```
Key:   NODE_ENV
Value: development
```

**Para PRODUÇÃO:**
```
Key:   NODE_ENV
Value: production
```

⚠️ **IMPORTANTE:**
- Use `development` enquanto estiver testando
- Altere para `production` antes do deploy final
- Isso ativa otimizações e segurança

---

### 6. REPL_ID (AUTO-CONFIGURADO)

**O que é:** ID único do seu deployment Replit

**Como configurar:**
- **NÃO PRECISA CONFIGURAR MANUALMENTE**
- O Replit configura automaticamente quando você faz deploy
- Se não aparecer, é porque está em desenvolvimento local

**Verificação:**
```bash
# No terminal do Replit:
echo $REPL_ID
```

---

## Variáveis Opcionais (Se usar os serviços)

### RESEND_API_KEY (Email Service)

**Como obter:**

1. Acesse: https://resend.com/api-keys
2. Crie uma conta (se não tiver)
3. Crie uma nova API Key
4. Copie o valor (começa com `re_`)

**Como adicionar:**
```
Key:   RESEND_API_KEY
Value: re_[SUA_API_KEY]
```

---

### HUBSPOT_API_KEY (CRM Integration)

**Como obter:**

1. Acesse: https://app.hubspot.com/settings/api-keys
2. Faça login na sua conta HubSpot
3. Vá em Settings > Integrations > Private Apps
4. Crie uma nova Private App
5. Copie o Access Token

**Como adicionar:**
```
Key:   HUBSPOT_API_KEY
Value: [SEU_ACCESS_TOKEN]
```

---

### STRIPE_SECRET_KEY (Payments)

**Como obter:**

1. Acesse: https://dashboard.stripe.com/apikeys
2. Faça login na sua conta Stripe
3. Copie a "Secret key"
   - Para testes: `sk_test_...`
   - Para produção: `sk_live_...`

**Como adicionar:**

**Para TESTES:**
```
Key:   STRIPE_SECRET_KEY
Value: sk_test_[SUA_KEY]
```

**Para PRODUÇÃO:**
```
Key:   STRIPE_SECRET_KEY
Value: sk_live_[SUA_KEY]
```

---

### SENTRY_DSN (Error Tracking)

**Como obter:**

1. Acesse: https://sentry.io/
2. Crie uma conta (se não tiver)
3. Crie um novo projeto
4. Copie o DSN (Settings > Projects > [Seu Projeto] > Client Keys)

**Como adicionar:**
```
Key:   SENTRY_DSN
Value: https://[SEU_DSN]@sentry.io/[PROJECT_ID]
```

**Recomendação:**
- Altamente recomendado para produção
- Permite rastreamento de erros em tempo real

---

## Verificação e Testes

### Passo 1: Verificar Variáveis de Ambiente

```bash
# No terminal do Replit (Shell):
npm run verify:env
```

**Saída esperada:**
```
REQUIRED VARIABLES:
✅ DATABASE_URL              OK
✅ SESSION_SECRET            OK

PRODUCTION VARIABLES:
✅ JWT_ACCESS_SECRET         OK
✅ JWT_REFRESH_SECRET        OK
✅ NODE_ENV                  OK

✅ Environment check PASSED
```

### Passo 2: Testar Conexão com Banco

```bash
npm run verify:db
```

**Saída esperada:**
```
Step 1: Checking DATABASE_URL
✅ DATABASE_URL: postgresql://neondb_owner:npg_...

Step 2: Parsing DATABASE_URL
✅ Detected PostgreSQL provider: Neon

Step 3: Testing database connection
✅ Connection successful!

✅ VERIFICATION COMPLETED SUCCESSFULLY
```

### Passo 3: Verificar Tudo de Uma Vez

```bash
npm run verify:all
```

Executa ambos os testes acima.

---

## Troubleshooting

### Problema: Secret não aparece após adicionar

**Solução:**
1. Recarregue a página (F5 ou Cmd+R)
2. Feche e abra o painel de Secrets novamente
3. Verifique se clicou em "Add Secret" (não só Enter)

---

### Problema: Erro "Missing required environment variables"

**Causa:** Secret não está configurado ou tem nome errado

**Solução:**
1. Verifique se o nome está EXATAMENTE como mostrado (case-sensitive)
2. Exemplos:
   - ✅ `DATABASE_URL` (correto)
   - ❌ `database_url` (errado - minúsculas)
   - ❌ `DATABASE_URL ` (errado - espaço no final)
3. Execute `npm run verify:env` para ver qual está faltando

---

### Problema: "Connection terminated unexpectedly"

**Causa:** Problema com DATABASE_URL ou banco pausado

**Solução:**
1. Verifique se DATABASE_URL tem `?sslmode=require` no final
2. Acesse Neon Console e verifique se o banco está ativo
3. Neon pausa bancos após 5 minutos de inatividade
4. Execute `npm run verify:db` para diagnosticar

---

### Problema: Secret aparece mas não funciona

**Causa:** Servidor já estava rodando quando adicionou o secret

**Solução:**
1. Pare o servidor (Ctrl+C no terminal)
2. Inicie novamente (`npm run dev` ou `npm run start`)
3. Secrets são carregados apenas no startup

---

### Problema: Como ver o valor de um Secret?

**Resposta:**
- Replit **mascara** os valores por segurança
- Você só vê o valor completo quando está editando
- Para ver o valor:
  1. Clique em "Edit" no secret
  2. O valor aparecerá no campo de edição
  3. Cancele se não quiser alterar

---

### Problema: Deletei um Secret por engano

**Solução:**
1. Se foi um secret gerado (JWT, SESSION):
   - Gere um novo com os comandos mostrados acima
   - Adicione novamente
2. Se foi um secret de serviço (DATABASE_URL, RESEND_API_KEY):
   - Acesse o serviço correspondente
   - Copie o valor novamente
   - Adicione novamente
3. **Não há como recuperar** um secret deletado
4. Por isso, sempre faça backup dos valores importantes

---

### Problema: Secrets funcionam no Replit mas não localmente

**Causa:** Desenvolvimento local não tem acesso aos Replit Secrets

**Solução:**
1. Use o arquivo `.env` para desenvolvimento local
2. Copie os valores dos Secrets para `.env`
3. **NUNCA** commite o `.env` no Git
4. Use `.env.example` como template

**Exemplo de `.env`:**
```bash
DATABASE_URL=postgresql://localhost:5432/dev_db
SESSION_SECRET=dev_secret_only_for_local
NODE_ENV=development
```

---

## Resumo Visual - Fluxo Completo

```
1. ABRIR PAINEL
   ┌─────────────┐
   │ Clique 🔒   │
   └─────────────┘
         ↓

2. ADICIONAR SECRET
   ┌──────────────────────┐
   │ + New Secret         │
   │                      │
   │ Key: DATABASE_URL    │
   │ Value: postgresql:// │
   │                      │
   │ [Add Secret]         │
   └──────────────────────┘
         ↓

3. VERIFICAR
   ┌──────────────────────┐
   │ $ npm run verify:env │
   │ ✅ All checks passed │
   └──────────────────────┘
         ↓

4. TESTAR
   ┌──────────────────────┐
   │ $ npm run verify:db  │
   │ ✅ Connection OK     │
   └──────────────────────┘
         ↓

5. INICIAR SERVIDOR
   ┌──────────────────────┐
   │ $ npm run start      │
   │ 🚀 Server running    │
   └──────────────────────┘
```

---

## Checklist Final

Antes de dar o projeto como pronto, verifique:

### Secrets Obrigatórios
- [ ] DATABASE_URL adicionado e testado
- [ ] SESSION_SECRET adicionado (gerado com comando)
- [ ] JWT_ACCESS_SECRET adicionado (gerado com comando)
- [ ] JWT_REFRESH_SECRET adicionado (diferente do ACCESS)
- [ ] NODE_ENV configurado (`development` ou `production`)

### Verificações
- [ ] `npm run verify:env` passou
- [ ] `npm run verify:db` passou
- [ ] Servidor inicia sem erros
- [ ] Consegue fazer login

### Segurança
- [ ] Todos os secrets foram gerados (não são valores de exemplo)
- [ ] .env não está commitado no Git
- [ ] DATABASE_URL tem `?sslmode=require`

---

## Comandos Rápidos de Referência

```bash
# Gerar SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Gerar JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Verificar variáveis
npm run verify:env

# Testar banco
npm run verify:db

# Verificar tudo
npm run verify:all

# Ver secrets configurados
printenv | grep -E "(DATABASE|SESSION|JWT|REPL)"
```

---

## Próximos Passos

Após configurar todos os secrets:

1. Execute os testes de verificação
2. Inicie o servidor em modo desenvolvimento
3. Teste as funcionalidades principais
4. Quando estiver pronto para produção:
   - Altere `NODE_ENV` para `production`
   - Configure Sentry (recomendado)
   - Execute os testes novamente

---

**Dúvidas?**

Consulte:
- 📄 [Status de Ambiente](ENVIRONMENT_STATUS.md) - Status rápido
- 📄 [Guia Completo de Secrets](REPLIT_SECRETS_GUIDE.md) - Documentação detalhada
- 📄 [Relatório de Auditoria](ENVIRONMENT_AUDIT_REPORT.md) - Análise completa

---

**Última atualização:** 2025-12-24
**Autor:** Claude Sonnet 4.5
**Versão:** 1.0
