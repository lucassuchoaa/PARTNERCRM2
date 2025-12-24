# Gestão do Banco de Dados - Partners CRM

## Visão Geral

Este documento fornece instruções práticas para gerenciar o banco de dados PostgreSQL do Partners CRM em produção.

**Status Atual:** PRODUÇÃO ATIVA (Neon - PostgreSQL 16.11)
**Última Verificação:** 2025-12-24
**Total de Registros:** 54 registros em 13 tabelas

---

## Scripts Disponíveis

### 1. Verificação Completa do Banco

```bash
tsx verify-database.ts
```

**O que faz:**
- Lista todas as tabelas e contagem de registros
- Analisa distribuição de dados (usuários por role, prospects por status, etc.)
- Verifica integridade referencial
- Identifica CNPJs duplicados
- Compara dados atuais com expectativas
- Gera relatório completo

**Quando usar:**
- Após migrações
- Verificação semanal de rotina
- Após mudanças significativas no banco
- Troubleshooting

---

### 2. Verificação de Integridade

```bash
tsx check-integrity.ts
```

**O que faz:**
- Identifica prospects com partner_id inválido
- Identifica clients com partner_id inválido
- Lista todos os usuários disponíveis

**Quando usar:**
- Antes de correções de dados
- Após importações/migrações
- Investigação de problemas de relacionamento

---

### 3. Backup do Banco de Dados

```bash
tsx backup-database.ts
```

**O que faz:**
- Cria backup completo de todas as tabelas em JSON
- Salva backup separado das tabelas principais
- Inclui metadados (data, total de registros, etc.)
- Armazena na pasta `backups/`

**Output:**
- `backups/backup-YYYY-MM-DDTHH-MM-SS.json` (completo)
- `backups/backup-main-tables-YYYY-MM-DDTHH-MM-SS.json` (principais)

**Quando usar:**
- **SEMPRE antes de fazer mudanças no banco**
- Rotina semanal/mensal
- Antes de deploys importantes
- Antes de executar scripts de correção

---

### 4. Correção de Integridade de Dados

```bash
tsx fix-data-integrity.ts
```

**O que faz:**
- Corrige prospects com partner_id inválido (atribui ao admin)
- Adiciona tabelas de remuneração faltantes (1-10, 11-50, 51-200, 201+)
- Valida correções aplicadas

**ATENÇÃO:**
- Executa mudanças no banco de dados!
- **SEMPRE faça backup antes!**

**Quando usar:**
- Após verificar problemas com `check-integrity.ts`
- Quando relatório indicar dados inconsistentes

---

### 5. Migração do db.json

```bash
tsx migrate-from-json.ts
```

**O que faz:**
- Migra dados do arquivo `db.json` para PostgreSQL
- Verifica duplicações antes de inserir
- Gera estatísticas de migração
- Seguro para re-executar (skip duplicados)

**Quando usar:**
- Migração inicial de desenvolvimento para produção
- Resetar banco de desenvolvimento
- Importar dados de teste

---

## Fluxo de Trabalho Recomendado

### Verificação de Rotina (Semanal)

```bash
# 1. Verificar estado do banco
tsx verify-database.ts > logs/verify-$(date +%Y%m%d).log

# 2. Se houver problemas, verificar detalhes
tsx check-integrity.ts

# 3. Fazer backup antes de corrigir
tsx backup-database.ts

# 4. Corrigir problemas (se necessário)
tsx fix-data-integrity.ts

# 5. Validar correções
tsx verify-database.ts
```

### Antes de Mudanças Importantes

```bash
# 1. Backup obrigatório
tsx backup-database.ts

# 2. Verificar estado atual
tsx verify-database.ts

# 3. Executar mudanças
# ... suas mudanças aqui ...

# 4. Validar resultado
tsx verify-database.ts
```

### Troubleshooting de Problemas

```bash
# 1. Verificação completa
tsx verify-database.ts

# 2. Análise de integridade
tsx check-integrity.ts

# 3. Backup do estado atual
tsx backup-database.ts

# 4. Aplicar correções
tsx fix-data-integrity.ts

# 5. Confirmar correções
tsx check-integrity.ts
```

---

## Problemas Conhecidos (25/12/2024)

### ⚠️ Problema 1: Prospects com partner_id inválido

**Status:** IDENTIFICADO
**Severidade:** WARNING
**Afetados:** 3 registros

**Detalhes:**
- "21" (CNPJ: 21) - partner_id: 1753416259657
- "teste3103" (CNPJ: 2123132) - partner_id: 1753985298363
- "Top" (CNPJ: 1212121) - partner_id: 1753985298363

**Correção:**
```bash
tsx fix-data-integrity.ts
```

### ⚠️ Problema 2: Tabelas de remuneração incompletas

**Status:** IDENTIFICADO
**Severidade:** WARNING
**Faltando:** 3 de 4 tabelas

**Correção:**
```bash
tsx fix-data-integrity.ts
```

---

## Restauração de Backup

### Restaurar Tabela Específica

```typescript
// restore-table.ts
import * as fs from 'fs';
import { query } from './server/db';

async function restoreTable(backupFile: string, tableName: string) {
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  const tableData = backup.tables[tableName];

  console.log(`Restaurando ${tableData.length} registros em ${tableName}...`);

  // CUIDADO: Isso apaga dados existentes!
  // await query(`DELETE FROM ${tableName}`);

  // Inserir dados
  for (const row of tableData) {
    // Ajuste a query conforme schema da tabela
    await query(
      `INSERT INTO ${tableName} (...) VALUES (...)`,
      [row.field1, row.field2, ...]
    );
  }

  console.log('Restauração concluída!');
}

// Executar
restoreTable(
  './backups/backup-2025-12-24T15-20-50.json',
  'users'
);
```

### Restaurar Banco Completo (Neon)

1. Acesse https://console.neon.tech
2. Selecione seu projeto
3. Vá em "Restore"
4. Escolha data/hora do ponto de restauração
5. Confirme restauração

---

## Comandos Úteis

### Conectar ao Banco via psql

```bash
# Se tiver psql instalado
psql "$DATABASE_URL"
```

### Executar Query SQL Direta

```bash
# Via Node.js
node -e "
import { query } from './server/db.js';
const result = await query('SELECT * FROM users');
console.log(result.rows);
"
```

### Exportar Tabela Específica

```bash
# Via script
tsx -e "
import { query } from './server/db';
import * as fs from 'fs';

(async () => {
  const result = await query('SELECT * FROM users');
  fs.writeFileSync(
    'users-export.json',
    JSON.stringify(result.rows, null, 2)
  );
  console.log('Exportado:', result.rows.length, 'registros');
  process.exit(0);
})();
"
```

---

## Estrutura de Pastas

```
/home/runner/workspace/
├── backups/                           # Backups em JSON
│   ├── backup-2025-12-24T15-20-50.json
│   └── backup-main-tables-2025-12-24T15-20-50.json
├── verify-database.ts                 # Script de verificação
├── check-integrity.ts                 # Script de integridade
├── backup-database.ts                 # Script de backup
├── fix-data-integrity.ts              # Script de correção
├── migrate-from-json.ts               # Script de migração
├── database-report.json               # Relatório JSON
├── production-migration-strategy.md   # Estratégia completa
└── DATABASE-MANAGEMENT-README.md      # Este arquivo
```

---

## Variáveis de Ambiente

```bash
# .env
DATABASE_URL=postgresql://neondb_owner:***@ep-snowy-moon-ah9gkdw9.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Verificar conexão
echo $DATABASE_URL
```

---

## Recursos Adicionais

- **Neon Console:** https://console.neon.tech
- **Documentação Neon:** https://neon.tech/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/16/
- **Estratégia Completa:** `production-migration-strategy.md`
- **Relatório JSON:** `database-report.json`

---

## Contato e Suporte

Para problemas críticos de banco de dados:
1. Execute `tsx backup-database.ts` imediatamente
2. Execute `tsx verify-database.ts` e salve output
3. Documente o problema
4. Entre em contato com o time de DevOps

---

**Última Atualização:** 2025-12-24
**Versão:** 1.0
**Mantido por:** DevOps Team
