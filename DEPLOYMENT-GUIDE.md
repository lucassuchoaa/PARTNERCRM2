# 🚀 Guia de Publicação - Partners CRM

## ❌ PROBLEMA IDENTIFICADO

Quando você clica em "Publish" no Replit, o deployment NÃO herda automaticamente os dados do banco de desenvolvimento. Isso acontece porque:

1. ✅ Dados foram migrados para o banco PostgreSQL **de desenvolvimento**
2. ❌ O deployment do Replit pode não ter acesso ao mesmo banco
3. ❌ Variáveis de ambiente (Secrets) podem não estar configuradas no deployment

---

## ✅ SOLUÇÃO - Configure o Deployment Corretamente

### PASSO 1: Verificar Replit Secrets

1. **Abra o painel de Secrets** (ícone de cadeado 🔒 na barra lateral esquerda)
2. **Verifique se existe a variável:** `DATABASE_URL`
3. **Se NÃO existir ou estiver errada:**
   - Clique em "New Secret"
   - Name: `DATABASE_URL`
   - Value: Cole a URL completa do seu banco PostgreSQL Neon
   - Formato: `postgresql://usuario:senha@host/database`

**⚠️ IMPORTANTE:** O Replit Deployment usa AUTOMATICAMENTE os Secrets configurados aqui.

---

### PASSO 2: Fazer o Deployment Corretamente

#### Opção A: Deployment do Replit (Recomendado)

1. **Clique no botão "Deploy"** (foguete 🚀) no canto superior direito
2. **OU use o menu:** Tools → Deployments → Create Deployment
3. **Aguarde o build finalizar** (pode levar 2-5 minutos)
4. **Acesse a URL do deployment** que será gerada

**O deployment vai:**
- ✅ Usar o mesmo `DATABASE_URL` dos Secrets
- ✅ Conectar ao PostgreSQL Neon com TODOS os dados migrados
- ✅ Funcionar exatamente como no desenvolvimento

---

#### Opção B: Deploy no Vercel (Alternativo)

Se preferir usar Vercel:

1. **Instale o Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Configure as variáveis de ambiente no Vercel:**
   ```bash
   vercel env add DATABASE_URL
   # Cole a URL do PostgreSQL quando solicitado
   ```

3. **Faça o deploy:**
   ```bash
   vercel --prod
   ```

---

### PASSO 3: Verificar se Funcionou

Após o deployment, acesse a URL publicada e:

1. ✅ Faça login no sistema
2. ✅ Vá em "Indicações" - devem aparecer **8 prospects**
3. ✅ Vá em "Materiais de Suporte" - devem aparecer **8 materiais**
4. ✅ Vá em "Clientes" - devem aparecer **11 clientes**

Se os dados aparecerem = **DEPLOYMENT CORRETO!** ✅

Se NÃO aparecerem = Siga o Passo 4 abaixo ⬇️

---

### PASSO 4: Se os Dados NÃO Aparecerem no Deployment

Isso significa que o deployment está usando um banco PostgreSQL DIFERENTE. Soluções:

#### 4.1. Verificar DATABASE_URL no Deployment

Execute este comando **no ambiente de deployment** (via Replit Shell após publicar):

```bash
echo $DATABASE_URL
```

**Se aparecer diferente do desenvolvimento:**
- O deployment está usando outro banco
- Você precisa migrar os dados novamente para esse banco

#### 4.2. Migrar Dados para o Banco de Produção

Se o deployment usa um banco diferente, execute:

```bash
# No terminal do Replit, com o deployment rodando:
npm run migrate-production
```

**OU execute manualmente:**

```bash
# Conecte ao banco de PRODUÇÃO
export DATABASE_URL="<URL_DO_BANCO_DE_PRODUCAO>"

# Execute a migração
npx tsx migrate-from-json.ts
```

---

## 📊 RESUMO: O Que Você Precisa Fazer AGORA

### ✅ Checklist Rápido:

- [ ] Verificar se `DATABASE_URL` está nos Replit Secrets
- [ ] Fazer o deployment via Replit (botão Deploy 🚀)
- [ ] Aguardar build finalizar (2-5 min)
- [ ] Acessar URL do deployment
- [ ] Fazer login e verificar se dados aparecem
- [ ] Se NÃO aparecer: executar migração no ambiente de produção

---

## 🔍 Detalhes Técnicos

### Ambiente de Desenvolvimento (Atual)
- **Banco:** PostgreSQL Neon via Replit Secrets
- **Dados migrados:** ✅ 16 usuários, 8 prospects, 11 clientes, 8 materiais
- **Acesso:** http://localhost:5000 (desenvolvimento local)

### Ambiente de Produção (Deployment)
- **Banco:** Deve ser o MESMO PostgreSQL Neon
- **Configuração:** Via Replit Secrets (DATABASE_URL)
- **Acesso:** URL gerada pelo Replit Deployment (ex: https://seu-app.repl.co)

### Por Que os Dados Não Aparecem?

O Replit tem 2 ambientes separados:
1. **Development** (onde você está trabalhando) → Usa Secrets
2. **Production** (após clicar Deploy) → Também usa Secrets

**MAS:** Se você configurou DATABASE_URL DEPOIS de fazer o primeiro deploy, o deployment antigo pode estar usando valores antigos ou vazios.

**SOLUÇÃO:** Faça um NOVO deployment após configurar os Secrets corretamente.

---

## 🆘 Ainda Não Funcionou?

Execute este comando para diagnóstico completo:

```bash
npx tsx migrate-from-json.ts --dry-run
```

Isso vai mostrar:
- ✅ Conexão com banco
- ✅ Quantos dados existem atualmente
- ✅ Se há problemas de acesso

---

## 📝 Notas Importantes

1. **Um Banco, Múltiplos Ambientes:** Recomendo usar o MESMO PostgreSQL Neon tanto em dev quanto em produção
2. **Secrets Compartilhados:** Replit Secrets funcionam automaticamente em dev e deployment
3. **Dados Persistentes:** Uma vez migrados para PostgreSQL Neon, os dados ficam permanentes
4. **db.json NÃO é usado:** Após migração, o arquivo db.json serve apenas como backup

---

## ✅ Teste Final

Após configurar corretamente, você deve conseguir:

1. Fazer login no deployment
2. Ver todos os 8 prospects
3. Ver todos os 8 materiais de suporte
4. Ver todos os 11 clientes
5. Criar novos registros e eles persistirem após refresh

**Se tudo funcionar = Deployment PERFEITO!** 🎉
