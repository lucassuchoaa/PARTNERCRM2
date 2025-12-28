# Debug de Autenticação

Se você está recebendo o erro "Usuário não autenticado", siga estes passos:

## 1. Verificar no Console do Navegador

Abra o Console do navegador (F12) e execute:

```javascript
// Verificar se há um usuário no localStorage
console.log('User:', localStorage.getItem('user'))
console.log('AccessToken:', localStorage.getItem('accessToken'))
console.log('RefreshToken:', localStorage.getItem('refreshToken'))

// Tentar parsear o usuário
try {
  const user = JSON.parse(localStorage.getItem('user'))
  console.log('User parsed:', user)
  console.log('User ID:', user?.id)
  console.log('User email:', user?.email)
  console.log('User role:', user?.role)
} catch (e) {
  console.error('Erro ao parsear user:', e)
}
```

## 2. Possíveis Problemas

### Problema 1: User não existe no localStorage
**Solução**: Faça login novamente

### Problema 2: User existe mas não tem campo 'id'
**Solução**: O formato do usuário está incorreto. Limpe o localStorage e faça login novamente:
```javascript
localStorage.clear()
// Depois faça login novamente
```

### Problema 3: Token expirado
**Solução**: Faça logout e login novamente

## 3. Formato Esperado do User

O objeto user deve ter no mínimo:
```javascript
{
  "id": "user_123456",
  "email": "user@example.com",
  "role": "partner",
  "name": "Nome do Usuário"
}
```

## 4. Limpar tudo e recomeçar

Se nada funcionar, execute no console:

```javascript
// Limpar tudo
localStorage.clear()
sessionStorage.clear()

// Recarregar a página
window.location.reload()

// Depois faça login novamente
```
