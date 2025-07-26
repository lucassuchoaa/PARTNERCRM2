# Integração HubSpot - Validação de Prospects e Clientes

Esta integração permite validar dados de prospects e obter informações sobre o status de clientes diretamente da API do HubSpot.

## Funcionalidades

### ✅ Validação de Prospects
- Verificar se email já existe no HubSpot
- Verificar se empresa já está cadastrada
- Identificar se prospect já é cliente
- Buscar deals associados ao contato

### 📊 Informações Disponíveis
- Dados completos do contato
- Informações da empresa
- Histórico de deals
- Status do lifecycle (lead, prospect, customer)
- Propriedades customizadas

### 🔍 Métodos de Busca
- Busca por email
- Busca por domínio da empresa
- Pesquisa com filtros customizados
- Busca de deals associados

## Configuração

### 1. Obter Token de Acesso do HubSpot

1. Acesse sua conta HubSpot
2. Vá para **Configurações** → **Integrações** → **Chaves de API**
3. Clique em **Criar chave de API**
4. Copie o token gerado

### 2. Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
VITE_HUBSPOT_ACCESS_TOKEN=seu_token_aqui
```

### 3. Instalar Dependências

As dependências já foram instaladas:
- `@hubspot/api-client` - Cliente oficial do HubSpot
- `axios` - Para requisições HTTP adicionais

## Uso

### Serviço HubSpot

```typescript
import HubSpotService from './services/hubspot'

// Inicializar o serviço
const hubspotService = new HubSpotService({
  accessToken: import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN!
})

// Validar dados de prospect
const prospectData = {
  email: 'contato@empresa.com',
  companyName: 'Empresa Exemplo',
  contactName: 'João Silva',
  phone: '(11) 99999-9999'
}

const result = await hubspotService.validateProspectData(prospectData)
console.log(result)
```

### Componente React

```tsx
import HubSpotIntegration from './components/ui/HubSpotIntegration'

function MinhaIndicacao() {
  const prospectData = {
    email: 'contato@empresa.com',
    companyName: 'Empresa Exemplo',
    contactName: 'João Silva'
  }

  const handleValidationComplete = (result) => {
    console.log('Status do prospect:', result.status)
    // 'new' | 'existing' | 'customer'
  }

  return (
    <HubSpotIntegration
      prospectData={prospectData}
      onValidationComplete={handleValidationComplete}
    />
  )
}
```

## Estrutura de Resposta

### ValidationResult

```typescript
interface ValidationResult {
  contact: HubSpotContact | null
  company: HubSpotCompany | null
  deals: HubSpotDeal[]
  status: 'new' | 'existing' | 'customer'
  validation: {
    emailExists: boolean
    companyExists: boolean
    hasActiveDeals: boolean
    isCustomer: boolean
  }
}
```

### Status do Prospect

- **`new`**: Prospect completamente novo, não existe no HubSpot
- **`existing`**: Prospect já existe mas não é cliente
- **`customer`**: Já é cliente (possui deals fechados ou lifecycle = customer)

## Métodos Disponíveis

### HubSpotService

```typescript
// Buscar contato por email
const contact = await hubspotService.getContactByEmail('email@exemplo.com')

// Buscar empresa por domínio
const company = await hubspotService.getCompanyByDomain('exemplo.com')

// Pesquisar contatos com filtros
const contacts = await hubspotService.searchContacts({
  filterGroups: [{
    filters: [{
      propertyName: 'email',
      operator: 'EQ',
      value: 'email@exemplo.com'
    }]
  }]
})

// Buscar deals de um contato
const deals = await hubspotService.getContactDeals('contactId')

// Criar/atualizar contato
const newContact = await hubspotService.createOrUpdateContact({
  email: 'novo@exemplo.com',
  firstname: 'Nome',
  lastname: 'Sobrenome'
})

// Obter estatísticas
const stats = await hubspotService.getProspectStats()
```

## Exemplo Completo

Veja o arquivo `src/components/examples/HubSpotExample.tsx` para um exemplo completo de uso.

## Tratamento de Erros

Todos os métodos incluem tratamento de erros:

```typescript
try {
  const result = await hubspotService.validateProspectData(data)
  // Sucesso
} catch (error) {
  console.error('Erro na validação:', error.message)
  // Tratar erro
}
```

## Limitações da API

- **Rate Limits**: HubSpot tem limites de requisições por segundo
- **Propriedades**: Nem todas as propriedades podem estar disponíveis
- **Permissões**: O token deve ter as permissões necessárias

## Segurança

⚠️ **IMPORTANTE**: 
- Nunca exponha o token de acesso no frontend
- Use variáveis de ambiente para configuração
- Considere implementar um proxy no backend para produção
- O token atual é apenas para desenvolvimento

## Próximos Passos

1. **Backend Proxy**: Implementar endpoint no backend para chamadas seguras
2. **Cache**: Adicionar cache para reduzir chamadas à API
3. **Webhooks**: Configurar webhooks para atualizações em tempo real
4. **Sincronização**: Implementar sincronização bidirecional de dados

## Suporte

Para dúvidas sobre a API do HubSpot, consulte:
- [Documentação Oficial](https://developers.hubspot.com/docs/api/overview)
- [Guia de Autenticação](https://developers.hubspot.com/docs/api/private-apps)
- [Referência da API](https://developers.hubspot.com/docs/api/crm/contacts)