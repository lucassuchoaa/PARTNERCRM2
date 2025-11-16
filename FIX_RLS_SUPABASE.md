# 🔐 Como Desabilitar RLS no Supabase (Temporário para Teste)

O erro 500 em `/api/users` geralmente acontece porque o **RLS (Row Level Security)** está habilitado no Supabase e bloqueando o acesso.

---

## ⚠️ IMPORTANTE

**RLS é uma medida de segurança importante.** Este guia mostra como **desabilitar temporariamente** para teste. Em produção, você deve configurar políticas RLS adequadas.

---

## 🔧 Solução Rápida: Desabilitar RLS Temporariamente

1. No **Supabase** → **SQL Editor**
2. **New Query**
3. Cole este SQL e clique em **Run**:

```sql
-- Desabilitar RLS temporariamente para teste
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneration_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans DISABLE ROW LEVEL SECURITY;
```

4. Depois de executar, faça um **Redeploy** no Vercel
5. Teste novamente no Admin

---

## ✅ Verificar se Funcionou

Após o redeploy:
1. Vá no Admin → Usuários
2. Tente criar um usuário
3. Se funcionar, o RLS era o problema!

---

## 🔒 Solução Segura: Configurar Políticas RLS (Futuro)

Depois que tudo estiver funcionando, você pode habilitar RLS novamente e criar políticas específicas:

```sql
-- Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso com service_role (usado pelas APIs)
-- Isso permite que as APIs acessem sem problemas
CREATE POLICY "Service role can access all data"
ON public.users
FOR ALL
USING (auth.role() = 'service_role');
```

⚠️ **Nota**: A configuração de políticas RLS adequadas é mais complexa e depende das suas necessidades de segurança.

---

## 🆘 Se Ainda Não Funcionar

Depois de desabilitar o RLS e fazer o redeploy:

1. Abra o **Console do Navegador** (F12 → Console)
2. Clique na requisição `/api/users` que falhou
3. Veja a mensagem de erro que aparece agora (será mais clara)
4. Me envie essa mensagem para eu ajudar a diagnosticar

