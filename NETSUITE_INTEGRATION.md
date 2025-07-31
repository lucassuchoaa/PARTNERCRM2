# Integração NetSuite

Este documento descreve como configurar e usar a integração com o NetSuite para geração automática de relatórios.

## Pré-requisitos

- Conta NetSuite com privilégios de administrador
- Acesso ao módulo de integrações do NetSuite
- Conhecimento básico de OAuth 1.0

## Configuração no NetSuite

### 1. Criar uma Integração

1. Faça login na sua conta NetSuite como administrador
2. Navegue para **Setup > Integration > Manage Integrations**
3. Clique em **New** para criar uma nova integração
4. Preencha os seguintes campos:
   - **Name**: Nome da sua aplicação (ex: "Sistema de Relatórios")
   - **Description**: Descrição da integração
   - **State**: Enabled
5. Marque a opção **Token-Based Authentication**
6. Configure as permissões necessárias:
   - **REST Web Services**: Enabled
   - **RESTlets**: Enabled (se necessário)
7. Clique em **Save**
8. **IMPORTANTE**: Anote o **Consumer Key** e **Consumer Secret** gerados

### 2. Criar um Access Token

1. Navegue para **Setup > Users/Roles > Access Tokens**
2. Clique em **New** para criar um novo token
3. Preencha os campos:
   - **Application Name**: Selecione a integração criada no passo anterior
   - **User**: Selecione o usuário que será usado para as requisições
   - **Role**: Selecione uma role com as permissões necessárias
4. Clique em **Save**
5. **IMPORTANTE**: Anote o **Token ID** e **Token Secret** gerados

### 3. Configurar Permissões

Certifique-se de que o usuário/role selecionado tenha as seguintes permissões:

- **Lists > Custom Records**: View, Create, Edit
- **Reports > Financial Reports**: View, Create
- **Reports > Custom Reports**: View, Create
- **Setup > SuiteCloud Development Framework > REST Web Services**: Full
- **Documents and Files > File Cabinet**: View, Create, Edit

## Configuração da Aplicação

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as seguintes variáveis:

```bash
# NetSuite Configuration
NETSUITE_ACCOUNT_ID=your-account-id
NETSUITE_CONSUMER_KEY=your-consumer-key
NETSUITE_CONSUMER_SECRET=your-consumer-secret
NETSUITE_TOKEN_ID=your-token-id
NETSUITE_TOKEN_SECRET=your-token-secret
NETSUITE_BASE_URL=https://rest.netsuite.com
```

### 2. Como obter o Account ID

O Account ID pode ser encontrado:
1. Na URL da sua conta NetSuite (ex: `https://123456.app.netsuite.com`)
2. Em **Setup > Company > Company Information** no campo "Account ID"

## Funcionalidades Disponíveis

### 1. Geração de Relatórios

- **Relatórios Financeiros**: Balanços, DRE, fluxo de caixa
- **Relatórios Operacionais**: Vendas, compras, estoque
- **Relatórios Customizados**: Baseados em saved searches

### 2. Upload de Relatórios

- Upload automático para o File Cabinet do NetSuite
- Organização em pastas por parceiro
- Metadados incluindo data de geração e tipo

### 3. Sincronização

- Sincronização bidirecional de relatórios
- Verificação de integridade dos dados
- Log de atividades de sincronização

## Uso da Interface

### 1. Verificar Conexão

1. Acesse o painel administrativo
2. Clique na aba "NetSuite"
3. Clique em "Verificar" no status da conexão
4. Se a conexão falhar, verifique as configurações

### 2. Gerar Relatórios

1. Selecione um parceiro na lista
2. Escolha o tipo de relatório (Financeiro ou Operacional)
3. Defina o período (data inicial e final)
4. Clique em "Gerar Relatório"
5. O relatório será gerado e listado na tabela

### 3. Upload Manual

1. Clique em "Escolher arquivo" na seção de upload
2. Selecione o arquivo desejado
3. Clique em "Fazer Upload"
4. O arquivo será enviado para o NetSuite

### 4. Sincronização

1. Clique em "Sincronizar" para sincronizar todos os relatórios
2. A sincronização pode demorar alguns minutos
3. Verifique os logs para confirmar o sucesso

## Troubleshooting

### Erro de Autenticação

- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme se o token não expirou
- Verifique se o usuário tem as permissões necessárias

### Erro de Conexão

- Verifique a conectividade com a internet
- Confirme se a URL base está correta
- Verifique se o NetSuite não está em manutenção

### Erro de Permissão

- Verifique se o usuário tem acesso aos recursos necessários
- Confirme se a role tem as permissões corretas
- Verifique se a integração está habilitada

## Segurança

### Boas Práticas

1. **Nunca** commite as credenciais no código
2. Use variáveis de ambiente para todas as configurações sensíveis
3. Rotacione os tokens periodicamente
4. Use roles com permissões mínimas necessárias
5. Monitore os logs de acesso regularmente

### Auditoria

- Todos os acessos são logados no NetSuite
- Verifique regularmente os logs em **Setup > Integration > Web Services Usage Log**
- Configure alertas para atividades suspeitas

## Suporte

Para problemas relacionados à integração:

1. Verifique os logs da aplicação
2. Consulte os logs do NetSuite
3. Verifique a documentação oficial do NetSuite
4. Entre em contato com o suporte técnico se necessário

## Referências

- [NetSuite REST API Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540391670.html)
- [NetSuite Token-Based Authentication](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4247337262.html)
- [OAuth 1.0 Specification](https://tools.ietf.org/html/rfc5849)