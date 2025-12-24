# Estratégia de Migração para Produção - Partners CRM

## Resumo Executivo

Este documento descreve a estratégia completa para garantir que os dados migrados estejam disponíveis em produção de forma segura e confiável.

**Data do Relatório:** 2025-12-24
**Banco de Dados:** PostgreSQL 16.11 (Neon)
**Status Atual:** BANCO DE PRODUÇÃO JÁ EM USO

---

## 1. Estado Atual do Banco de Dados

### Informações Gerais
- **Database URL:** `postgresql://neondb_owner:***@ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech/neondb`
- **Provider:** Neon (Serverless PostgreSQL)
- **Versão PostgreSQL:** 16.11
- **Tamanho do Banco:** 8432 kB
- **Total de Tabelas:** 13
- **Total de Registros:** 54

### Contagem de Registros por Tabela

| Tabela | Registros | Status | Observações |
|--------|-----------|--------|-------------|
| **users** | 16 | ✅ OK | Esperado: 2+, Atual: 16 usuários ativos |
| **prospects** | 8 | ✅ OK | Esperado: 8, Atual: 8 (5 aprovados, 2 rejeitados, 1 pendente) |
| **clients** | 11 | ✅ OK | Esperado: 0+, Atual: 11 clientes |
| **support_materials** | 8 | ✅ OK | Esperado: 8, Atual: 8 materiais |
| **remuneration_tables** | 1 | ⚠️ ATENÇÃO | Esperado: 4, Atual: 1 tabela |
| **pricing_plans** | 3 | ✅ OK | Tabela de planos de preços |
| **products** | 3 | ✅ OK | Produtos disponíveis |
| **roles** | 3 | ✅ OK | Admin, Manager, Partner |
| **sessions** | 1 | ✅ OK | Sessões ativas |
| **notifications** | 0 | ✅ OK | Tabela vazia (normal) |
| **nfe_uploads** | 0 | ✅ OK | Tabela vazia (normal) |
| **transactions** | 0 | ✅ OK | Tabela vazia (normal) |
| **uploads** | 0 | ✅ OK | Tabela vazia (normal) |

---

## 2. Análise de Integridade de Dados

### 2.1. Problemas Identificados

#### ⚠️ PROBLEMA 1: Prospects com partner_id inválido (3 registros)

**Descrição:** Existem 3 prospects que fazem referência a IDs de parceiros que não existem na tabela `users`.

**Detalhes:**
1. **"21"** (CNPJ: 21) - partner_id: `1753416259657` - Status: approved
2. **"teste3103"** (CNPJ: 2123132) - partner_id: `1753985298363` - Status: rejected
3. **"Top"** (CNPJ: 1212121) - partner_id: `1753985298363` - Status: pending

**Impacto:**
- Quebra de integridade referencial
- Impossível identificar qual parceiro criou a indicação
- Pode causar erros em relatórios e dashboards

**Solução Recomendada:**
```sql
-- Opção 1: Definir partner_id como NULL (orfãos)
UPDATE prospects
SET partner_id = NULL
WHERE partner_id IN ('1753416259657', '1753985298363');

-- Opção 2: Atribuir a um usuário padrão (admin)
UPDATE prospects
SET partner_id = '1'
WHERE partner_id IN ('1753416259657', '1753985298363');
```

#### ⚠️ PROBLEMA 2: Apenas 1 tabela de remuneração

**Descrição:** O sistema tem apenas 1 tabela de remuneração quando o esperado seriam 4.

**Tabela Atual:**
- Funcionários: 1-10
- Margem de Negociação: 5%
- Cashback Final: 15%

**Solução:** Inserir as tabelas de remuneração faltantes conforme o arquivo `db.json`.

### 2.2. Dados Sem Problemas

✅ **Nenhum CNPJ duplicado** em prospects
✅ **Nenhum CNPJ duplicado** em clientes
✅ **Todos os clientes** tem partner_id válido ou NULL
✅ **16 usuários** distribuídos entre: 6 admins, 5 managers, 5 partners
✅ **8 materiais de suporte** distribuídos em 3 categorias

---

## 3. Scripts Criados para Gestão do Banco

### 3.1. Script de Verificação (`verify-database.ts`)

**Localização:** `/home/runner/workspace/verify-database.ts`

**Funcionalidades:**
- Lista todas as tabelas do banco
- Conta registros em cada tabela
- Analisa detalhadamente as tabelas principais
- Verifica integridade referencial
- Identifica CNPJs duplicados
- Compara dados atuais com expectativas

**Como executar:**
```bash
tsx verify-database.ts
```

### 3.2. Script de Verificação de Integridade (`check-integrity.ts`)

**Localização:** `/home/runner/workspace/check-integrity.ts`

**Funcionalidades:**
- Identifica prospects com partner_id inválido
- Identifica clients com partner_id inválido
- Lista todos os usuários disponíveis

**Como executar:**
```bash
tsx check-integrity.ts
```

### 3.3. Script de Backup (`backup-database.ts`)

**Localização:** `/home/runner/workspace/backup-database.ts`

**Funcionalidades:**
- Faz backup completo de todas as tabelas
- Salva em formato JSON
- Cria backup separado das tabelas principais
- Inclui metadados (data, total de registros, etc.)

**Como executar:**
```bash
tsx backup-database.ts
```

**Output:**
- `backups/backup-YYYY-MM-DDTHH-MM-SS.json` - Backup completo
- `backups/backup-main-tables-YYYY-MM-DDTHH-MM-SS.json` - Tabelas principais

### 3.4. Script de Migração Original (`migrate-from-json.ts`)

**Localização:** `/home/runner/workspace/migrate-from-json.ts`

**Funcionalidades:**
- Migra dados do arquivo `db.json` para PostgreSQL
- Evita duplicações (verifica antes de inserir)
- Gera estatísticas de migração
- Suporta re-execução segura

**Como executar:**
```bash
tsx migrate-from-json.ts
```

---

## 4. Estratégia de Migração para Produção

### 4.1. Cenário Atual

✅ **O banco de produção JÁ ESTÁ CONFIGURADO e EM USO!**

- O ambiente está usando Neon (PostgreSQL serverless)
- Dados já foram migrados e estão em produção
- Aplicação está operacional com dados reais

### 4.2. Próximos Passos Recomendados

#### Passo 1: Backup Imediato
```bash
# Criar backup do estado atual
tsx backup-database.ts
```

#### Passo 2: Corrigir Problemas de Integridade
```bash
# Executar correções SQL
# Ver seção 2.1 para comandos específicos
```

#### Passo 3: Completar Tabelas de Remuneração
```bash
# Inserir tabelas faltantes
# Ver arquivo db.json para referência
```

#### Passo 4: Configurar Backups Automáticos

**Opção A: Neon Backups**
- Neon faz backups automáticos por padrão
- Configurar ponto de restauração: https://neon.tech/docs/manage/backups

**Opção B: Backup Cron Job**
```bash
# Adicionar ao cron (executar diariamente às 3h)
0 3 * * * cd /path/to/project && tsx backup-database.ts
```

#### Passo 5: Monitoramento Contínuo
```bash
# Executar verificação semanalmente
tsx verify-database.ts > logs/verify-$(date +%Y%m%d).log
```

---

## 5. Estratégia de Backup e Recuperação

### 5.1. Política de Backup

**Frequência:**
- **Diário:** Backup completo automático (via Neon)
- **Semanal:** Backup manual em JSON (via script)
- **Antes de mudanças:** Backup ad-hoc

**Retenção:**
- **Backups diários:** 7 dias
- **Backups semanais:** 4 semanas
- **Backups mensais:** 12 meses

### 5.2. Processo de Recuperação

#### Recuperação Completa (Neon)
```bash
# Via Neon Console:
# 1. Acessar console.neon.tech
# 2. Selecionar projeto
# 3. Go to "Restore" > Escolher ponto de restauração
```

#### Recuperação de Tabelas Específicas (JSON)
```typescript
// Exemplo: Restaurar tabela users
import * as fs from 'fs';
import { query } from './server/db';

const backup = JSON.parse(fs.readFileSync('backups/backup-2025-12-24.json', 'utf-8'));

// Limpar tabela (CUIDADO!)
await query('DELETE FROM users');

// Inserir dados do backup
for (const user of backup.tables.users) {
  await query(
    'INSERT INTO users (...) VALUES (...)',
    [user.id, user.email, ...]
  );
}
```

---

## 6. Checklist de Migração para Novos Ambientes

Caso precise migrar para um novo banco no futuro:

### Fase 1: Preparação
- [ ] Criar backup completo do banco atual
- [ ] Validar backup (verificar arquivo JSON)
- [ ] Documentar DATABASE_URL atual
- [ ] Testar scripts de verificação

### Fase 2: Novo Ambiente
- [ ] Provisionar novo banco PostgreSQL (Neon/Supabase/AWS RDS)
- [ ] Atualizar DATABASE_URL no `.env`
- [ ] Executar migrations (criar tabelas)
- [ ] Validar estrutura do banco

### Fase 3: Migração de Dados
- [ ] Executar `tsx migrate-from-json.ts` (se migrando do db.json)
- [ ] OU restaurar do backup JSON
- [ ] Executar `tsx verify-database.ts`
- [ ] Corrigir problemas de integridade
- [ ] Validar contagens de registros

### Fase 4: Validação
- [ ] Executar `tsx check-integrity.ts`
- [ ] Fazer login no sistema
- [ ] Testar funcionalidades principais
- [ ] Verificar dashboards e relatórios
- [ ] Confirmar dados visíveis

### Fase 5: Go-Live
- [ ] Criar backup final do banco antigo
- [ ] Atualizar DNS/variáveis de ambiente em produção
- [ ] Monitorar logs por 24h
- [ ] Configurar alertas

---

## 7. Comandos Úteis

### Conectar ao Banco
```bash
# Via psql (se disponível)
psql "postgresql://neondb_owner:***@ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Executar Query SQL
```bash
# Via script Node
tsx -e "import { query } from './server/db.js'; (async () => { const result = await query('SELECT * FROM users'); console.log(result.rows); process.exit(0); })()"
```

### Exportar Dados
```bash
# Backup completo
tsx backup-database.ts

# Exportar tabela específica
tsx -e "import { query } from './server/db.js'; import * as fs from 'fs'; (async () => { const result = await query('SELECT * FROM users'); fs.writeFileSync('users-export.json', JSON.stringify(result.rows, null, 2)); process.exit(0); })()"
```

---

## 8. Variáveis de Ambiente Críticas

```bash
# .env
DATABASE_URL=${DATABASE_URL}  # Aponta para Neon em produção

# Verificar conexão
echo $DATABASE_URL
# postgresql://neondb_owner:***@ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 9. Recomendações Finais

### Curto Prazo (Próximos 7 dias)
1. ✅ Executar backup imediato
2. ⚠️ Corrigir prospects com partner_id inválido
3. ⚠️ Adicionar tabelas de remuneração faltantes
4. ✅ Configurar backups automáticos no Neon

### Médio Prazo (Próximos 30 dias)
1. Implementar constraints de foreign key (se não existirem)
2. Adicionar índices para melhorar performance
3. Configurar monitoramento de integridade
4. Documentar procedimentos de recuperação

### Longo Prazo (Próximos 90 dias)
1. Implementar testes automatizados de integridade
2. Configurar alertas de anomalias de dados
3. Revisar política de retenção de backups
4. Planejar estratégia de disaster recovery

---

## 10. Contatos e Recursos

**Neon Console:** https://console.neon.tech
**Documentação Neon:** https://neon.tech/docs
**PostgreSQL Docs:** https://www.postgresql.org/docs/16/

**Scripts de Gestão:**
- `verify-database.ts` - Verificação completa
- `check-integrity.ts` - Integridade referencial
- `backup-database.ts` - Backup em JSON
- `migrate-from-json.ts` - Migração do db.json

---

**Última Atualização:** 2025-12-24
**Versão do Documento:** 1.0
**Status:** PRODUÇÃO ATIVA
