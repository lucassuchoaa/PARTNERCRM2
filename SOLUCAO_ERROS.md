# 🔧 Solução Rápida para Erros 500 e 404

## ⚠️ PRIORIDADE: Erros 500 (Críticos)

Estes erros indicam que as APIs existem mas estão falhando ao acessar o Supabase:

- ❌ `/api/products` - Erro 500
- ❌ `/api/users` - Erro 500  
- ❌ `/api/remuneration-tables` - Erro 500
- ❌ `/api/support-materials` - Erro 500

### 🔴 Causa Mais Provável: RLS (Row Level Security) Bloqueando Acesso

### ✅ Solução Rápida:

1. **No Supabase** → **SQL Editor** → **New Query**
2. **Cole este SQL e clique em Run:**

```sql
-- Desabilitar RLS temporariamente para teste
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneration_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans DISABLE ROW LEVEL SECURITY;
```

3. **Verifique se as variáveis de ambiente estão configuradas no Vercel:**
   - Vercel → Seu Projeto → **Settings** → **Environment Variables**
   - Deve ter:
     - ✅ `SUPABASE_URL` (com valor da URL do Supabase)
     - ✅ `SUPABASE_SERVICE_ROLE_KEY` (com a service_role key, NÃO a anon key!)

4. **Faça um Redeploy no Vercel**

5. **Teste novamente**

---

## 📋 Erros 404 (Não Críticos - Funcionalidades Ainda Não Implementadas)

Estes erros são de rotas que ainda não foram criadas. **Não quebram o sistema**, mas algumas funcionalidades não vão funcionar:

- ⚠️ `/api/analytics/web-vitals` - Analytics de performance (não crítico)
- ⚠️ `/api/managers` - Gestão de gerentes (usado no ManagerDashboard)
- ⚠️ `/api/nfe_uploads` - Upload de notas fiscais (comentado no código)
- ⚠️ `/api/uploads` - Upload de arquivos (não encontrado uso)
- ⚠️ `/api/notifications` - Notificações (usado no Dashboard)

### 🔵 O que fazer:

**Opção 1**: Ignorar por enquanto (não quebram o sistema principal)

**Opção 2**: Se precisar dessas funcionalidades, posso criar essas APIs depois de resolver os erros 500.

---

## 📊 Checklist de Verificação

### ✅ No Supabase:
- [ ] Tabelas criadas (execute SQL do `SETUP_SUPABASE.md`)
- [ ] RLS desabilitado (execute SQL acima)
- [ ] Service Role Key copiada (Settings → API → service_role key)

### ✅ No Vercel:
- [ ] Variável `SUPABASE_URL` configurada
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] Redeploy feito após configurar variáveis

### ✅ Testar:
- [ ] Admin → Usuários (criar usuário)
- [ ] Admin → Produtos (criar produto)
- [ ] Admin → Tabela de Remuneração (criar tabela)
- [ ] Admin → Material de Apoio (adicionar material)

---

## 🆘 Se Ainda Não Funcionar

1. Abra o **Console do Navegador** (F12 → Console)
2. Clique na requisição que está dando erro 500
3. Veja a mensagem de erro (agora será mais clara após as melhorias)
4. Me envie a mensagem exata do erro

---

## 📝 Notas

- **RLS**: Row Level Security é uma medida de segurança importante. Desabilitamos temporariamente para teste. Em produção, configure políticas RLS adequadas.
- **Service Role Key**: Use a `service_role` key (secret), NÃO a `anon` key. A service_role key bypassa RLS.
- **404 vs 500**: 
  - **404** = Rota não existe (não crítico)
  - **500** = Rota existe mas está falhando (crítico - precisa corrigir)

