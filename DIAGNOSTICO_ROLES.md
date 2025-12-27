# 🔍 Diagnóstico de Problema com Roles

## 📊 Situação Atual

### ✅ O que está FUNCIONANDO:

1. **Banco de Dados:** ✅
   - As 3 roles padrão estão criadas corretamente
   - Administrador (27 permissões)
   - Gerente (14 permissões)
   - Parceiro (8 permissões)

2. **API Backend:** ✅
   - Endpoint `/api/roles` retorna os dados corretamente
   - Autenticação funcionando
   - Resposta JSON válida

3. **Teste via cURL:** ✅
   - Login bem-sucedido
   - Token gerado corretamente
   - API responde com as 3 roles

### ❌ O que NÃO está funcionando:

1. **Frontend em Produção:** ❌
   - Aba "Roles" no painel admin não mostra as funções padrão
   - Apenas mostra funções criadas manualmente (se houver)
   - Funções criadas não vinculam a nada

## 🔧 Como Diagnosticar o Problema

### Opção 1: Página de Diagnóstico

1. Acesse a aplicação em produção
2. Faça login com suas credenciais
3. Navegue para: `#diagnostico-roles`
   - URL completa: `https://seu-dominio.com/#diagnostico-roles`
4. Clique no botão "Testar API de Roles"
5. Veja os resultados na tela
6. Abra o Console do navegador (F12) e veja os logs detalhados

### Opção 2: Console do Navegador

Cole este código no console (F12) enquanto estiver logado:

```javascript
// Verificar API_URL
console.log('API_URL:', window.location.origin + '/api');

// Verificar token
const token = localStorage.getItem('accessToken') ||
              JSON.parse(localStorage.getItem('auth_tokens') || '{}').accessToken;
console.log('Token:', token ? 'Presente' : 'Ausente');

// Testar API
fetch('/api/roles', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('='.repeat(50));
  console.log('RESULTADO DA API /roles');
  console.log('='.repeat(50));
  console.log('Success:', data.success);
  console.log('Total de roles:', data.data?.length || 0);
  console.log('Roles:', data.data);
  console.log('='.repeat(50));
})
.catch(error => {
  console.error('ERRO:', error);
});
```

### Opção 3: Ver Logs do Componente

Com as modificações que fiz, agora o componente `RoleManagement` tem logs detalhados.

1. Acesse o painel admin
2. Vá para a aba "Roles"
3. Abra o Console (F12)
4. Procure por logs que começam com `[RoleManagement]`

Exemplo de logs que você deve ver:
```
[RoleManagement] Buscando roles em: /api/roles
[RoleManagement] Response status: 200
[RoleManagement] Data recebida: {success: true, data: [...]}
[RoleManagement] Total de roles: 3
```

## 🐛 Possíveis Causas do Problema

### 1. **API_URL Incorreto**
- O frontend pode estar fazendo requisição para URL errada
- Verificar se `VITE_API_URL` está configurado corretamente
- Em produção, deve ser `/api` ou a URL completa do backend

### 2. **CORS / Autenticação**
- O token pode não estar sendo enviado corretamente
- Headers de autorização podem estar sendo bloqueados
- Verificar se `credentials: 'include'` está funcionando

### 3. **Cache do Browser**
- O navegador pode estar usando versão antiga do código
- Solução: Ctrl+Shift+R ou Ctrl+F5 para limpar cache

### 4. **Problema no Build**
- A versão em produção pode estar desatualizada
- Verificar se o deploy foi concluído com sucesso
- Fazer rebuild e redeploy

### 5. **Estado do React não Atualizando**
- O componente pode não estar renderizando os dados
- `setRoles(data.data)` pode não estar funcionando
- Verificar se há erro no console do React

## 🔨 Soluções Imediatas

### Solução 1: Limpar Cache e Fazer Login Novamente

```bash
# No console do navegador (F12):
localStorage.clear();
sessionStorage.clear();
# Depois, faça logout e login novamente
```

### Solução 2: Verificar Network Tab

1. Abra DevTools (F12)
2. Vá para aba "Network" / "Rede"
3. Filtre por "roles"
4. Acesse a aba Roles no admin
5. Veja se a requisição para `/api/roles` aparece
6. Clique nela e veja:
   - Status Code (deve ser 200)
   - Response (deve ter as 3 roles)
   - Headers (deve ter Authorization)

### Solução 3: Forçar Rebuild em Produção

```bash
# No terminal:
npm run build
# Fazer redeploy
```

## 📝 Informações para Debug

Quando você executar o diagnóstico, me envie:

1. **URL da aplicação em produção**
2. **Logs do console** (os que começam com `[RoleManagement]`)
3. **Response da API** `/api/roles` (da aba Network)
4. **Mensagens de erro** (se houver)
5. **Screenshots** da aba Roles e do console

## 🚀 Próximos Passos

Após executar o diagnóstico, eu posso:

1. Identificar exatamente onde está o problema
2. Criar uma correção específica
3. Testar a correção localmente
4. Fazer deploy da correção

---

**Criado em:** 2025-12-27
**Versão:** 1.0
