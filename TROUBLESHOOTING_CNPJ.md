# 🔧 Troubleshooting: Erro "Unexpected token '<', '<!DOCTYPE'..."

## 📋 Descrição do Erro

```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

Este erro ocorre quando uma API retorna HTML (geralmente uma página de erro) ao invés de JSON esperado.

---

## 🔍 Causa Raiz

### Cenários Comuns:

1. **API Indisponível ou com Erro 500**
   - Servidor da API está fora do ar
   - API retorna página HTML de erro

2. **Rate Limiting**
   - Muitas requisições em curto período
   - API bloqueia e retorna HTML

3. **CORS Bloqueado**
   - Navegador bloqueia requisição
   - Retorna página de erro HTML

4. **URL Incorreta**
   - Endpoint errado
   - API retorna página 404 em HTML

5. **Manutenção da API**
   - API em manutenção
   - Retorna página de aviso

---

## ✅ Soluções Implementadas

### 1. Validação de Content-Type

**Antes:**
```typescript
const response = await fetch(url)
const data = await response.json() // ❌ Falha se retornar HTML
```

**Depois:**
```typescript
const response = await fetch(url, {
  headers: {
    'Accept': 'application/json'
  }
})

// Verificar content-type antes de fazer parse
const contentType = response.headers.get('content-type')
if (!contentType || !contentType.includes('application/json')) {
  throw new Error('API não retornou JSON válido')
}

const data = await response.json() // ✅ Seguro
```

### 2. Try-Catch em Todas as APIs

```typescript
try {
  const response = await fetch(url)
  // ... validações ...
  const data = await response.json()
  return processData(data)
} catch (error) {
  console.error('Erro na API:', error)
  throw error // Propaga para fallback
}
```

### 3. Sistema de Fallback de 3 Camadas

```typescript
// 1ª Tentativa: ReceitaWS
try {
  return await fetchFromReceitaWS(cnpj)
} catch (receitaError) {
  console.warn('ReceitaWS falhou, tentando BrasilAPI')

  // 2ª Tentativa: BrasilAPI
  try {
    return await fetchFromBrasilAPI(cnpj)
  } catch (brasilApiError) {
    console.warn('BrasilAPI falhou, tentando Speedio')

    // 3ª Tentativa: Speedio
    try {
      return await fetchFromSpeedioAPI(cnpj)
    } catch (speedioError) {
      // Todas falharam
      throw new Error('Não foi possível consultar o CNPJ')
    }
  }
}
```

### 4. Mensagens de Erro Amigáveis

**No componente Referrals.tsx:**
```typescript
catch (error: any) {
  console.error('Erro ao buscar CNPJ:', error)
  setCnpjError(
    error.message ||
    'Erro ao consultar CNPJ. Tente novamente mais tarde.'
  )
}
```

---

## 🧪 Como Testar

### 1. Teste com CNPJ Válido
```
CNPJ: 00.000.000/0001-91 (Banco do Brasil)
CNPJ: 33.000.167/0001-01 (Petrobras)
```

### 2. Teste com CNPJ Inválido
```
CNPJ: 11.111.111/1111-11
Resultado Esperado: "CNPJ inválido"
```

### 3. Teste Sem Conexão
- Desconecte da internet
- Tente buscar CNPJ
- Resultado Esperado: "Erro ao consultar CNPJ. Tente novamente mais tarde."

### 4. Verificar Fallback
- Abra DevTools (F12)
- Vá em Console
- Digite um CNPJ
- Observe os logs:
  ```
  Erro ReceitaWS: ...
  Erro BrasilAPI: ...
  Sucesso com Speedio!
  ```

---

## 🛠️ Ferramentas de Debug

### 1. Console do Navegador

```javascript
// Verificar se API está retornando JSON
fetch('https://receitaws.com.br/v1/cnpj/00000000000191')
  .then(r => r.text())
  .then(console.log)

// Se retornar "<!DOCTYPE html>" → API está retornando HTML
// Se retornar "{...}" → API está OK
```

### 2. Network Tab (DevTools)

1. Abra DevTools (F12)
2. Vá em "Network"
3. Filtre por "Fetch/XHR"
4. Digite um CNPJ
5. Clique na requisição
6. Veja a resposta:
   - **Headers**: Content-Type deve ser `application/json`
   - **Response**: Deve ser JSON, não HTML

### 3. Testes Manuais

```bash
# Testar API ReceitaWS
curl -H "Accept: application/json" \
  https://receitaws.com.br/v1/cnpj/00000000000191

# Testar API BrasilAPI
curl -H "Accept: application/json" \
  https://brasilapi.com.br/api/cnpj/v1/00000000000191

# Testar API Speedio
curl -H "Accept: application/json" \
  https://api-publica.speedio.com.br/buscarcnpj?cnpj=00000000000191
```

---

## 🚨 Quando Ainda Ocorre o Erro

### Se TODAS as 3 APIs falharem:

1. **Verifique sua conexão com internet**
2. **Aguarde alguns minutos** (pode ser rate limiting)
3. **Tente outro CNPJ**
4. **Preencha manualmente** o formulário

### Se apenas 1 ou 2 APIs falharem:
- ✅ **Normal!** O sistema de fallback está funcionando
- ✅ Dados serão buscados da API disponível

---

## 📊 Monitoramento Recomendado

### Logs Importantes:

```javascript
console.log('CNPJ:', cnpj)
console.log('Tentando ReceitaWS...')
// Se falhar:
console.warn('ReceitaWS falhou:', error)
console.log('Tentando BrasilAPI...')
// Se falhar:
console.warn('BrasilAPI falhou:', error)
console.log('Tentando Speedio...')
// Se falhar:
console.error('Todas as APIs falharam!')
```

### Métricas:
- Taxa de sucesso por API
- Tempo médio de resposta
- Quantidade de fallbacks
- APIs mais confiáveis

---

## 🔄 Alternativas Futuras

### 1. Cache Local
```typescript
// Salvar CNPJs consultados recentemente
const cachedData = localStorage.getItem(`cnpj_${cleanedCNPJ}`)
if (cachedData) {
  return JSON.parse(cachedData)
}
```

### 2. Proxy Próprio
```typescript
// Criar seu próprio endpoint que faz a busca
const response = await fetch('/api/cnpj', {
  method: 'POST',
  body: JSON.stringify({ cnpj })
})
```

### 3. API Oficial da Receita Federal
```typescript
// Quando/se disponível
const response = await fetch(
  'https://servicos.receita.fazenda.gov.br/api/cnpj/...'
)
```

---

## 📝 Checklist de Solução

Quando o erro ocorrer:

- [ ] Verificar console do navegador para logs detalhados
- [ ] Confirmar que CNPJ tem 14 dígitos
- [ ] Testar conexão com internet
- [ ] Aguardar 1-2 minutos e tentar novamente
- [ ] Testar com outro CNPJ
- [ ] Verificar Network tab no DevTools
- [ ] Se persistir, preencher manualmente

---

## 💡 Dicas de Prevenção

### Para Usuários:
1. Use CNPJs válidos e existentes
2. Não faça muitas buscas seguidas (rate limit)
3. Se der erro, aguarde alguns segundos

### Para Desenvolvedores:
1. Sempre validar content-type antes de `response.json()`
2. Implementar try-catch em todas as chamadas de API
3. Ter sistema de fallback
4. Logar erros detalhadamente
5. Mostrar mensagens amigáveis ao usuário

---

## 🎯 Status Atual

✅ **Problema Resolvido!**

Implementações:
- ✅ Validação de content-type em todas as APIs
- ✅ Try-catch robusto
- ✅ Sistema de fallback de 3 camadas
- ✅ Logs detalhados para debug
- ✅ Mensagens de erro amigáveis
- ✅ Build sem erros

**O sistema agora está muito mais robusto e resiliente a falhas de API!** 🎉

---

## 📞 Suporte

Se o problema persistir mesmo após todas as correções:

1. Verifique os logs no console (F12)
2. Teste as APIs manualmente (curl)
3. Reporte com detalhes:
   - CNPJ testado
   - Horário do erro
   - Logs do console
   - Screenshot do Network tab
