# 🔍 Como Diagnosticar Erro 500

O erro 500 geralmente significa que há um problema no servidor. Com as melhorias que fiz, agora você verá mensagens de erro mais claras.

---

## ✅ Passo 1: Verificar Mensagem de Erro Específica

Após o **Redeploy**, quando aparecer o erro 500:

1. Abra o **Console do Navegador** (F12 → Console)
2. Clique na requisição que falhou (aparecerá em vermelho)
3. Veja a mensagem de erro que aparece

A mensagem dirá exatamente o que está errado.

---

## 🔧 Problema Mais Comum: Variáveis de Ambiente Não Configuradas

Se a mensagem for: **"Supabase não configurado. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"**

### Solução:

1. No **Vercel** → Seu Projeto → **Settings** → **Environment Variables**
2. Verifique se existem estas duas variáveis:
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`

3. Se não existirem, adicione:
   - **Key**: `SUPABASE_URL`
   - **Value**: Sua URL do Supabase (ex: `https://xxxxx.supabase.co`)
   - **Environments**: Production, Preview, Development (marque todos)

   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Sua Service Role Key do Supabase
   - **Environments**: Production, Preview, Development (marque todos)

4. Depois de adicionar, faça um **Redeploy**

### Onde encontrar no Supabase:

1. No **Supabase** → Seu Projeto → **Settings** → **API**
2. Você verá:
   - **Project URL** → Use como `SUPABASE_URL`
   - **service_role key** (secret) → Use como `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Importante**: Use o `service_role key`, NÃO o `anon key`!

---

## 🔧 Problema 2: Tabelas Não Criadas no Supabase

Se a mensagem for: **"relation does not exist"** ou **"table does not exist"**

### Solução:

1. No **Supabase** → **SQL Editor**
2. Execute o SQL do arquivo `SETUP_SUPABASE.md` (se ainda não executou)
3. Verifique no **Table Editor** se todas as 5 tabelas aparecem:
   - ✅ `pricing_plans`
   - ✅ `users`
   - ✅ `remuneration_tables`
   - ✅ `support_materials`
   - ✅ `products`

---

## 🔧 Problema 3: Erro ao Acessar Tabela

Se a mensagem for sobre **permissões** ou **RLS (Row Level Security)**

### Solução:

No **Supabase**, desabilite temporariamente o RLS (Row Level Security) para teste:

1. **Supabase** → **Authentication** → **Policies**
2. Ou execute este SQL no **SQL Editor**:

```sql
-- Desabilitar RLS temporariamente para teste (não recomendado para produção)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneration_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans DISABLE ROW LEVEL SECURITY;
```

⚠️ **Atenção**: Isso é só para teste. Em produção, você deve configurar políticas RLS adequadas.

---

## 📝 Depois de Corrigir

1. Faça um **Redeploy** no Vercel
2. Teste novamente no Admin:
   - Criar usuário
   - Criar produto
   - Criar tabela de remuneração
   - Criar material de apoio

---

## 🆘 Se Ainda Não Funcionar

Me envie:
1. A mensagem de erro exata que aparece no Console do Navegador
2. Screenshot do erro (se possível)
3. Confirme se as variáveis de ambiente estão configuradas no Vercel

