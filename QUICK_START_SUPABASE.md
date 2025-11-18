# ⚡ Supabase - Guia Rápido de 5 Minutos

## 🎯 Checklist Rápido

```
1. [ ] Executar SQL no Supabase (2 min)
2. [ ] Criar bucket de Storage (1 min)
3. [ ] Configurar variáveis no Vercel (1 min)
4. [ ] Redeploy no Vercel (1 min)
5. [ ] Testar funcionalidades (2 min)
```

---

## 1️⃣ Executar SQL (2 min)

**Supabase → SQL Editor → New Query**

Copie e cole `supabase-setup-complete.sql` → **Run**

✅ Verifica: **Table Editor** deve mostrar 5 tabelas

---

## 2️⃣ Criar Bucket (1 min)

**Supabase → Storage → Create Bucket**

- Nome: `partner-files`
- Public: ✅ **MARCAR**
- Create

✅ Verifica: Bucket `partner-files` aparece na lista

---

## 3️⃣ Variáveis Vercel (1 min)

**Vercel → Settings → Environment Variables**

Adicione 2 variáveis:

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...xxxxx
```

💡 **Obter**: Supabase → Settings → API

✅ Marcar: Production, Preview, Development

---

## 4️⃣ Redeploy (1 min)

**Vercel → Deployments → ... → Redeploy**

⏳ Aguarde ~2 minutos

---

## 5️⃣ Testar (2 min)

### ✅ Usuários
Admin → Usuários → Novo Usuário → Salvar

### ✅ Materiais
Admin → Materiais → Novo Material → Salvar

### ✅ Remuneração
Admin → Remuneração → Nova Tabela → Salvar

### ✅ Upload
Qualquer tela → Upload de arquivo

---

## 🆘 Se Algo Falhar

### Erro: "Supabase não configurado"
→ Variáveis de ambiente faltando no Vercel
→ Solução: Adicione SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

### Erro: "Table does not exist"
→ SQL não foi executado
→ Solução: Execute `supabase-setup-complete.sql` no SQL Editor

### Erro: "Bucket not found"
→ Bucket não foi criado
→ Solução: Storage → Create Bucket → partner-files (PUBLIC)

### Erro: "Permission denied"
→ RLS ainda está ativo
→ Solução: Execute no SQL Editor:
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneration_tables DISABLE ROW LEVEL SECURITY;
```

---

## 📚 Docs Completos

Para setup detalhado: **SUPABASE_SETUP_FINAL.md**

---

**Status**: ✅ Setup completo em ~5 minutos!
