# 🔧 INSTRUÇÕES PARA CORRIGIR AS ROLES EM PRODUÇÃO

## 🎯 O Problema

A API em produção está retornando apenas 2 roles customizadas ao invés das 3 roles padrão do sistema.

**Causa:** O banco de dados usado em produção não tem as roles padrão, ou elas foram deletadas.

## ✅ SOLUÇÃO EM 2 PASSOS

### **PASSO 1: Aguardar Deploy (2-3 minutos)**

O deploy já foi iniciado. Aguarde 2-3 minutos para que as mudanças sejam aplicadas em produção.

---

### **PASSO 2: Executar Script de Correção**

#### **Opção A: Via Console do Navegador** (MAIS FÁCIL)

1. **Acesse a aplicação:**
   ```
   https://ff6085d4-0d5d-4b78-8bd6-63a746d65b9c-00-28twcn80pm57g.spock.replit.dev
   ```

2. **Faça login:**
   - Email: `lucasuchoa@hotmail.com`
   - Senha: `admin123`

3. **Abra o Console** (F12)

4. **Cole este código:**

```javascript
const token = localStorage.getItem('accessToken') ||
              JSON.parse(localStorage.getItem('auth_tokens') || '{}').accessToken;

fetch('/api/debug/ensure-default-roles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.clear();
  console.log('='.repeat(60));
  console.log('🔧 CORREÇÃO EXECUTADA!');
  console.log('='.repeat(60));
  console.log('');
  console.log('Resultados:');
  data.data?.results?.forEach(r => {
    console.log(`  ✅ ${r.role}: ${r.action}`);
  });
  console.log('');
  console.log('Roles atuais no banco:');
  data.data?.currentRoles?.forEach((role, i) => {
    console.log(`  ${i+1}. ${role.name} (${role.num_permissions} permissões)`);
  });
  console.log('='.repeat(60));
  console.log('');
  console.log('✅ AGORA VÁPARA: Painel Admin → Roles');
  console.log('   Clique no botão "🔄 Forçar Atualização"');
  console.log('');
})
.catch(error => {
  console.error('❌ ERRO:', error);
});
```

5. **Pressione ENTER**

6. **Resultado esperado:**
```
============================================================
🔧 CORREÇÃO EXECUTADA!
============================================================

Resultados:
  ✅ Administrador: inserted (ou updated)
  ✅ Gerente: inserted (ou updated)
  ✅ Parceiro: inserted (ou updated)

Roles atuais no banco:
  1. Administrador (27 permissões)
  2. Gerente (14 permissões)
  3. Parceiro (8 permissões)
  4. Assistente Parceiros (3 permissões)
  5. Parceiro teste (12 permissões)
============================================================

✅ AGORA VÁ PARA: Painel Admin → Roles
   Clique no botão "🔄 Forçar Atualização"
```

7. **Vá para:** Painel Admin → Aba "Roles"

8. **Clique em:** "🔄 Forçar Atualização"

9. **Resultado final esperado:**
```
DEBUG: Total de roles carregadas: 5
Roles: Administrador, Gerente, Parceiro, Assistente Parceiros, Parceiro teste
```

---

#### **Opção B: Via cURL** (Se preferir)

```bash
# Primeiro, faça login para obter o token
curl -X POST https://ff6085d4-0d5d-4b78-8bd6-63a746d65b9c-00-28twcn80pm57g.spock.replit.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lucasuchoa@hotmail.com","password":"admin123"}'

# Copie o accessToken da resposta e use abaixo:

curl -X POST https://ff6085d4-0d5d-4b78-8bd6-63a746d65b9c-00-28twcn80pm57g.spock.replit.dev/api/debug/ensure-default-roles \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

---

## 🔍 VERIFICAR SE FUNCIONOU

### **Método 1: Caixa de DEBUG**

Após executar o script e clicar em "Forçar Atualização", você deve ver:

```
DEBUG: Total de roles carregadas: 5
Roles: Administrador, Gerente, Parceiro, Assistente Parceiros, Parceiro teste
```

### **Método 2: Ver os Cards**

Você deve ver **5 cards** de roles:

```
┌─────────────┐  ┌─────────────┐  ┌──────────┐
│ 🛡️          │  │ 🛡️          │  │ 🛡️       │
│ Administr.  │  │ Gerente     │  │ Parceiro │
│ (Sistema)   │  │ (Sistema)   │  │ (Sistema)│
│ 27 perms    │  │ 14 perms    │  │ 8 perms  │
└─────────────┘  └─────────────┘  └──────────┘

┌─────────────────┐  ┌──────────────┐
│ 🛡️              │  │ 🛡️           │
│ Assist. Parc.   │  │ Parc. teste  │
│ 3 perms         │  │ 12 perms     │
└─────────────────┘  └──────────────┘
```

### **Método 3: Console Logs**

No console você deve ver:
```
[RoleManagement] Buscando roles em: /api/roles
[RoleManagement] Response status: 200
[RoleManagement] Data recebida: {success: true, data: Array(5), ...}
[RoleManagement] Total de roles: 5
```

---

## 🔍 ENDPOINT DE DEBUG ADICIONAL

Se quiser verificar qual banco está conectado:

```javascript
const token = localStorage.getItem('accessToken') ||
              JSON.parse(localStorage.getItem('auth_tokens') || '{}').accessToken;

fetch('/api/debug/db-info', {
  headers: { 'Authorization': `Bearer ${token}` },
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('Informações do Banco de Dados:');
  console.log('URL:', data.data.database.url);
  console.log('É Neon?', data.data.database.isNeon);
  console.log('Ambiente:', data.data.database.environment);
  console.log('Total de roles:', data.data.roles.total);
  console.log('Roles:', data.data.roles.list);
});
```

---

## ❓ AINDA NÃO FUNCIONOU?

Se após executar o script de correção você ainda vê apenas 2 roles:

1. **Verifique se há erros no console**
   - Abra F12 e veja se há mensagens de erro em vermelho

2. **Verifique se o token está válido**
   - Faça logout e login novamente
   - Execute o script novamente

3. **Me envie:**
   - Screenshot do resultado do script no console
   - Screenshot da caixa DEBUG
   - Screenshot dos logs `[RoleManagement]`

---

## 🎯 RESUMO

1. **Aguarde 2-3 minutos** para deploy completar
2. **Cole o script** no console (F12)
3. **Execute** pressionando ENTER
4. **Vá para** Painel Admin → Roles
5. **Clique** em "🔄 Forçar Atualização"
6. **Verifique** se aparecem 5 roles (3 do sistema + 2 customizadas)

---

**Data:** 2025-12-27
**Status:** Aguardando execução do script de correção
