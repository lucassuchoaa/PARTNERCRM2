# Sistema de Recrutamento de Parceiros por Gerentes

## Resumo das Mudanças

Implementado sistema completo para que gerentes possam recrutar parceiros que ficarão automaticamente vinculados a eles.

---

## O que foi implementado

### 1. **Banco de Dados**
- ✅ Adicionado campo `manager_slug` na tabela `users` para identificação única de gerentes
- ✅ Adicionado campo `manager_id` na tabela `partner_prospects` para rastreamento
- ✅ Criados índices para otimização de performance
- ✅ Gerados automaticamente `manager_slug` para todos os gerentes existentes

**Gerentes com slug criados:**
- Ana Costa → `ana-costa`
- Roberto Lima → `roberto-lima`
- gerente1 → `gerente1`
- lucas → `lucas`
- gerente → `gerente`

### 2. **API Backend**
Arquivo: `server/routes/partnerProspects.ts`

- ✅ Atualizado endpoint `POST /api/partner_prospects/public`
  - Aceita `referredByManagerSlug` além de `referredByPartnerSlug`
  - Vincula automaticamente o prospect ao gerente quando indicado por gerente
  - Salva o `manager_id` na tabela de prospects

- ✅ Criado endpoint `GET /api/partner_prospects/public/manager/:slug`
  - Busca informações públicas do gerente para exibir na landing page
  - Retorna: id, nome, email, empresa, manager_slug

### 3. **Componentes Frontend**

#### **ManagerRecruitmentCard** (`src/components/ui/ManagerRecruitmentCard.tsx`)
- Card de recrutamento específico para gerentes
- Exibe landing page personalizada: `#gerente/{manager_slug}`
- Mostra estatísticas de candidatos: Total, Pendentes, Aprovados, Rejeitados
- Funções de copiar e compartilhar o link
- Lista os 3 candidatos mais recentes

#### **ManagerLandingPage** (`src/components/ui/ManagerLandingPage.tsx`)
- Landing page pública para recrutamento via gerente
- URL: `#gerente/{manager_slug}`
- Exibe nome do gerente que está indicando
- Formulário de cadastro completo
- Envia dados para API com `referredByManagerSlug`
- Design responsivo e atraente

### 4. **Rotas**
Arquivo: `src/App.tsx`

- ✅ Adicionada rota `#gerente/{slug}` para landing pages de gerentes
- ✅ Importado componente `ManagerLandingPage`

### 5. **Dashboard do Gerente**
Arquivo: `src/components/ui/ManagerDashboard.tsx`

- ✅ Substituído `PartnerReferralCard` por `ManagerRecruitmentCard`
- ✅ Agora gerentes veem o card de recrutamento no dashboard principal

---

## Como Funciona

### Fluxo de Recrutamento por Gerente

```
1. Gerente acessa seu dashboard
   ↓
2. Vê o card "Recrute Novos Parceiros" com sua landing page
   ↓
3. Copia/compartilha o link: https://seu-site.com/#gerente/lucas
   ↓
4. Candidato acessa a landing page
   ↓
5. Candidato preenche formulário
   ↓
6. Sistema cria prospect vinculado ao gerente
   ↓
7. Gerente recebe notificação no dashboard (pendente)
   ↓
8. Gerente aprova o candidato
   ↓
9. Sistema cria automaticamente o parceiro vinculado ao gerente
```

### Diferenças entre Parceiro e Gerente

| Aspecto | Parceiro | Gerente |
|---------|----------|---------|
| **Slug** | `partner_slug` | `manager_slug` |
| **URL** | `#parceiro/{slug}` | `#gerente/{slug}` |
| **Cor do tema** | Roxo/Indigo | Azul |
| **Objetivo** | Recrutar outros parceiros | Recrutar parceiros para sua equipe |
| **Vinculação** | Novos parceiros ficam vinculados ao parceiro indicador | Novos parceiros ficam vinculados diretamente ao gerente |

---

## Estrutura de Arquivos Criados/Modificados

### Novos Arquivos
```
migrations/add-manager-slug.sql
src/components/ui/ManagerRecruitmentCard.tsx
src/components/ui/ManagerLandingPage.tsx
RECRUTAMENTO-GERENTES.md
```

### Arquivos Modificados
```
server/routes/partnerProspects.ts
src/App.tsx
src/components/ui/ManagerDashboard.tsx
```

---

## Como Testar

### 1. Acessar como Gerente
1. Fazer login com um usuário gerente (ex: lucas)
2. Você verá o dashboard do gerente
3. No dashboard principal, verá o card "Recrute Novos Parceiros"
4. O card mostrará seu link personalizado

### 2. Testar Landing Page
1. Copiar o link do card (ex: `#gerente/lucas`)
2. Abrir em uma aba anônima ou fazer logout
3. Acessar o link copiado
4. Verá a landing page com "Convite de [Nome do Gerente]"
5. Preencher o formulário e enviar

### 3. Verificar Aprovação
1. Voltar ao dashboard do gerente
2. Ir para "Indicações" no menu lateral
3. Verá o novo candidato com status "Pendente"
4. Clicar em "Validar" ou "Aprovar"
5. Sistema criará automaticamente o parceiro vinculado ao gerente

---

## Próximos Passos (Opcionais)

- [ ] Adicionar notificações por email quando novo candidato se cadastra
- [ ] Criar dashboard de analytics para gerentes
- [ ] Implementar sistema de gamificação para incentivar recrutamento
- [ ] Adicionar templates de mensagens para facilitar compartilhamento
- [ ] Implementar aprovação automática baseada em critérios

---

## URLs de Exemplo

Baseado nos gerentes existentes:

- **Ana Costa**: `https://seu-site.com/#gerente/ana-costa`
- **Roberto Lima**: `https://seu-site.com/#gerente/roberto-lima`
- **Lucas**: `https://seu-site.com/#gerente/lucas`
- **Gerente1**: `https://seu-site.com/#gerente/gerente1`
- **Gerente**: `https://seu-site.com/#gerente/gerente`

---

## Suporte

Para qualquer dúvida ou problema:
1. Verificar se a migration foi executada corretamente
2. Confirmar que o gerente tem `manager_slug` no banco de dados
3. Verificar se o servidor foi reiniciado após o build
4. Checar logs do console do navegador para erros

---

**Status**: ✅ Implementação Completa
**Data**: 31/12/2024
**Versão**: 1.0.0
