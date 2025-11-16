# 🔍 Como Verificar se as Tabelas Foram Criadas no Supabase

## Passo 1: Verificar se as Tabelas Existem

1. No Supabase → **Table Editor**
2. Você deve ver estas 5 tabelas na lista lateral:
   - ✅ `pricing_plans` (3 linhas - Starter, Professional, Enterprise)
   - ✅ `users`
   - ✅ `remuneration_tables`
   - ✅ `support_materials`
   - ✅ `products` (3 linhas - Folha, Consignado, Benefícios)

**Se alguma tabela não aparecer, execute o SQL novamente no SQL Editor.**

---

## Passo 2: Verificar se as Tabelas Estão Vazias ou Com Dados

### Para `users`:
- Clique na tabela `users`
- Deve mostrar os usuários existentes (ou vazia se não tiver nenhum ainda)

### Para `remuneration_tables`:
- Clique na tabela `remuneration_tables`
- Deve mostrar as tabelas de remuneração (ou vazia)

### Para `support_materials`:
- Clique na tabela `support_materials`
- Deve mostrar os materiais de apoio (ou vazia)

### Para `products`:
- Clique na tabela `products`
- **DEVE TER 3 produtos**: `folha`, `consignado`, `beneficios`

**Se a tabela `products` estiver vazia, execute este SQL no SQL Editor:**

```sql
insert into public.products (id, name, description, icon, color, is_active, "order")
values
  ('folha', 'Folha de Pagamento', 'Pagamento 100% digital', 'CreditCardIcon', 'blue', true, 1),
  ('consignado', 'Consignado', 'Crédito consignado seguro', 'BanknotesIcon', 'green', true, 2),
  ('beneficios', 'Benefícios', 'Benefícios flexíveis', 'GiftIcon', 'purple', true, 3)
on conflict (id) do nothing;
```

---

## Passo 3: Testar no Admin do Sistema

Após o **Redeploy** no Vercel, teste:

1. **Usuários**: Vá em Admin → Usuários → Clique "Adicionar Usuário"
   - Se funcionar, o usuário aparece na lista e também no Supabase (Table Editor → users)

2. **Produtos**: Vá em Admin → Produtos → Clique "Adicionar Produto"
   - Se funcionar, o produto aparece na lista e também no Supabase (Table Editor → products)

3. **Tabela de Remuneração**: Vá em Admin → Tabela de Remuneração → Clique "Nova Tabela"
   - Se funcionar, aparece na lista e também no Supabase (Table Editor → remuneration_tables)

4. **Material de Apoio**: Vá em Admin → Material de Apoio → Clique para adicionar
   - Se funcionar, aparece na lista e também no Supabase (Table Editor → support_materials)

---

## ⚠️ Se Ainda Não Funcionar

1. Abra o **Console do Navegador** (F12 → Console)
2. Tente criar um usuário ou produto no Admin
3. Procure por erros em vermelho
4. Me envie os erros que aparecerem

