# Environment Setup - Partners CRM

**Status:** ✅ CONFIGURADO (Desenvolvimento) | ⚠️ Requer ajustes para Produção

---

## Início Rápido

### 1. Verificar Status Atual

```bash
npm run verify:all
```

Este comando verifica:
- ✅ Todas as variáveis de ambiente necessárias
- ✅ Conexão com banco de dados PostgreSQL
- ✅ Formato e validação dos secrets

### 2. Ver Status Detalhado

```bash
npm run verify:env    # Apenas variáveis de ambiente
npm run verify:db     # Apenas conexão com banco
```

---

## Status Atual (2025-12-24)

### ✅ Configurado e Funcionando

| Variável | Status | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | ✅ OK | PostgreSQL Neon conectado |
| `SESSION_SECRET` | ✅ OK | Secret forte (64+ chars) |
| `JWT_ACCESS_SECRET` | ✅ OK | Token de acesso |
| `JWT_REFRESH_SECRET` | ✅ OK | Token de refresh |
| `REPL_ID` | ✅ OK | Auto-configurado |
| `RESEND_API_KEY` | ✅ OK | Serviço de email |

### ⚠️ Requer Atenção

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| `NODE_ENV` | development | Alterar para `production` antes de deploy |
| `SENTRY_DSN` | Não configurado | Recomendado para rastreamento de erros |
| SSL config | Funciona | Melhorar configuração em `server/db.ts` |

### ❌ Opcionais Não Configurados

- `HUBSPOT_API_KEY` - Integração CRM (opcional)
- `STRIPE_SECRET_KEY` - Pagamentos (opcional)

---

## Documentação Disponível

### 📄 Guias Práticos

1. **[HOW_TO_CONFIGURE_SECRETS.md](HOW_TO_CONFIGURE_SECRETS.md)**
   - Guia visual passo a passo
   - Como adicionar/editar/deletar secrets
   - Comandos para gerar secrets
   - Troubleshooting comum

2. **[ENVIRONMENT_STATUS.md](ENVIRONMENT_STATUS.md)**
   - Status rápido de todas as variáveis
   - Checklist de produção
   - Comandos úteis

### 📊 Documentação Técnica

3. **[REPLIT_SECRETS_GUIDE.md](REPLIT_SECRETS_GUIDE.md)**
   - Documentação completa
   - Descrição detalhada de cada variável
   - Diferenças dev vs produção
   - Troubleshooting avançado

4. **[ENVIRONMENT_AUDIT_REPORT.md](ENVIRONMENT_AUDIT_REPORT.md)**
   - Relatório de auditoria completo
   - Análise de segurança
   - Problemas identificados
   - Recomendações priorizadas

---

## Scripts Disponíveis

### Verificação de Ambiente

```bash
# Verificar variáveis de ambiente
npm run verify:env

# Testar conexão com banco de dados
npm run verify:db

# Verificar tudo (env + db)
npm run verify:all
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Iniciar apenas backend
npm run dev:backend
```

### Produção

```bash
# Iniciar servidor de produção
npm run start

# Build para produção
npm run build
```

---

## Teste de Conexão com Banco

### Resultado Atual

```
✅ Provider: Neon PostgreSQL
✅ Versão: PostgreSQL 16.11
✅ Host: ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech
✅ Database: neondb
✅ SSL: Habilitado (sslmode=require)
✅ Tabelas: 13 encontradas
✅ Tamanho: 8.4 MB
✅ Conexões: 1 ativa
```

### Tabelas Encontradas

1. `clients` - Clientes
2. `nfe_uploads` - Notas fiscais
3. `notifications` - Notificações
4. `pricing_plans` - Planos de preço
5. `products` - Produtos
6. `prospects` - Leads/Prospects
7. `remuneration_tables` - Tabelas de remuneração
8. `roles` - Papéis de usuários
9. `sessions` - Sessões de auth
10. `support_materials` - Materiais de suporte
11. `transactions` - Transações
12. `uploads` - Uploads gerais
13. `users` - Usuários

---

## Como Configurar um Novo Secret

### Passo 1: Abrir Painel de Secrets

No Replit:
1. Clique no ícone 🔒 (cadeado) no painel lateral
2. Ou vá em Tools > Secrets

### Passo 2: Adicionar Secret

1. Clique em "+ New Secret"
2. Digite o nome (ex: `DATABASE_URL`)
3. Cole o valor
4. Clique em "Add Secret"

### Passo 3: Verificar

```bash
npm run verify:env
```

**Veja o guia completo:** [HOW_TO_CONFIGURE_SECRETS.md](HOW_TO_CONFIGURE_SECRETS.md)

---

## Gerar Secrets Fortes

### SESSION_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### JWT Secrets

```bash
# JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT_REFRESH_SECRET (gere outro diferente)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Checklist de Produção

### Antes de Deploy

- [x] DATABASE_URL configurada e testada
- [x] SESSION_SECRET configurado (forte)
- [x] JWT secrets configurados
- [ ] NODE_ENV alterado para `production`
- [ ] Sentry configurado (recomendado)
- [ ] SSL do banco corrigido (opcional)

### Testes

- [x] `npm run verify:env` passou
- [x] `npm run verify:db` passou
- [ ] Servidor inicia com NODE_ENV=production
- [ ] Login funciona em produção
- [ ] API responde corretamente

### Segurança

- [x] Secrets são fortes e aleatórios
- [x] Nenhum secret hardcoded no código
- [x] .env não está no Git
- [x] DATABASE_URL usa SSL

---

## Problemas Conhecidos

### 1. SSL no Pool do Banco (Prioridade: MÉDIA)

**Arquivo:** `server/db.ts` linha 5

**Problema:**
```typescript
ssl: false,  // Conflita com sslmode=require
```

**Status:** Funciona (URL tem `?sslmode=require`), mas pode melhorar

**Solução:** Ver [ENVIRONMENT_AUDIT_REPORT.md](ENVIRONMENT_AUDIT_REPORT.md) seção 5.1

---

### 2. NODE_ENV em Development (Prioridade: ALTA para produção)

**Atual:** `development`

**Ação:** Alterar para `production` antes de deploy final

**Como:**
1. Abra Replit Secrets
2. Edite `NODE_ENV`
3. Altere valor para `production`
4. Reinicie servidor

---

### 3. Sentry Não Configurado (Prioridade: MÉDIA)

**Recomendação:** Configure para rastreamento de erros em produção

**Como:**
1. Crie conta no https://sentry.io/
2. Crie projeto
3. Copie DSN
4. Adicione `SENTRY_DSN` nos Secrets

---

## Troubleshooting Rápido

### Erro: "Missing required environment variables"

```bash
# Verifique quais estão faltando
npm run verify:env

# Adicione a variável faltante nos Replit Secrets
```

### Erro: "Connection terminated unexpectedly"

```bash
# Teste a conexão
npm run verify:db

# Verifique se banco Neon está ativo
# (Neon pausa após 5min de inatividade)
```

### Aviso: "Replit Auth is DISABLED"

- Normal em desenvolvimento local
- No Replit, `REPL_ID` é auto-configurado
- Se aparecer no Replit, verifique deploy

---

## Links Úteis

### Serviços

- [Neon Console](https://console.neon.tech) - Gerenciar banco PostgreSQL
- [Resend Dashboard](https://resend.com/api-keys) - Email service
- [Sentry](https://sentry.io/) - Error tracking
- [HubSpot API](https://app.hubspot.com/settings/api-keys) - CRM integration
- [Stripe Dashboard](https://dashboard.stripe.com/apikeys) - Payments

### Documentação

- [Replit Secrets Docs](https://docs.replit.com/programming-ide/workspace-features/secrets)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express.js Docs](https://expressjs.com/)

---

## Arquivos Criados

### Scripts de Verificação

- `/home/runner/workspace/scripts/verify-env-vars.js` - Verificar variáveis
- `/home/runner/workspace/scripts/verify-database.js` - Testar banco

### Documentação

- `/home/runner/workspace/HOW_TO_CONFIGURE_SECRETS.md` - Guia visual
- `/home/runner/workspace/ENVIRONMENT_STATUS.md` - Status rápido
- `/home/runner/workspace/REPLIT_SECRETS_GUIDE.md` - Guia completo
- `/home/runner/workspace/ENVIRONMENT_AUDIT_REPORT.md` - Relatório técnico
- `/home/runner/workspace/README_ENVIRONMENT_SETUP.md` - Este arquivo

---

## Comandos Úteis

### Verificação

```bash
npm run verify:env        # Variáveis de ambiente
npm run verify:db         # Conexão com banco
npm run verify:all        # Tudo
```

### Servidor

```bash
npm run dev              # Desenvolvimento
npm run start            # Produção
npm run build            # Build para produção
```

### Gerar Secrets

```bash
# SESSION_SECRET (base64)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# JWT secrets (hexadecimal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Ver Variáveis (mascaradas)

```bash
printenv | grep -E "(DATABASE|SESSION|JWT|REPL)"
```

---

## Suporte

### Para Questões Rápidas

1. Consulte [ENVIRONMENT_STATUS.md](ENVIRONMENT_STATUS.md)
2. Execute `npm run verify:all`
3. Veja a seção Troubleshooting

### Para Configuração Detalhada

1. Siga [HOW_TO_CONFIGURE_SECRETS.md](HOW_TO_CONFIGURE_SECRETS.md)
2. Use os comandos de verificação
3. Consulte logs de erro

### Para Análise Técnica

1. Leia [ENVIRONMENT_AUDIT_REPORT.md](ENVIRONMENT_AUDIT_REPORT.md)
2. Verifique problemas identificados
3. Siga recomendações de segurança

---

## Próximos Passos

### Desenvolvimento

1. ✅ Variáveis configuradas
2. ✅ Banco conectado
3. ✅ Scripts de verificação criados
4. ⬜ Continuar desenvolvimento

### Produção

1. ✅ Variáveis obrigatórias OK
2. ⬜ Alterar NODE_ENV para production
3. ⬜ Configurar Sentry (recomendado)
4. ⬜ Corrigir SSL do banco (opcional)
5. ⬜ Executar testes em produção
6. ⬜ Deploy final

---

**Resumo:** Ambiente está pronto para desenvolvimento. Para produção, altere NODE_ENV e configure Sentry.

**Última Atualização:** 2025-12-24
**Status:** ✅ Ambiente Configurado
**Próximo Passo:** Continuar desenvolvimento ou preparar para produção
