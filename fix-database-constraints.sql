-- =============================================================================
-- FIX: Correções Críticas do Banco de Dados - Partners CRM
-- =============================================================================
-- Este arquivo corrige os problemas identificados na análise do sistema
-- Execute este SQL no banco de dados PostgreSQL
-- Data: 2025-12-21
-- =============================================================================

-- =============================================================================
-- CORREÇÃO #1: Adicionar constraint UNIQUE em clients.email
-- =============================================================================
-- Problema: Tabela clients permite emails duplicados, causando falha silenciosa
-- no ON CONFLICT (email) DO NOTHING
-- Solução: Adicionar constraint UNIQUE

-- Primeiro, remover duplicatas existentes (se houver)
-- Manter apenas o registro mais recente de cada email
WITH duplicates AS (
  SELECT id, email,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM clients
  WHERE email IS NOT NULL
)
DELETE FROM clients
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Agora adicionar a constraint UNIQUE
ALTER TABLE clients ADD CONSTRAINT unique_client_email UNIQUE (email);

-- Verificar constraint criada
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'clients'::regclass AND conname = 'unique_client_email';

-- =============================================================================
-- CORREÇÃO #2: Adicionar coluna prospect_id em clients
-- =============================================================================
-- Problema: Não há rastreamento de qual prospect originou cada cliente
-- Solução: Adicionar coluna prospect_id com FK para prospects

-- Adicionar coluna prospect_id
ALTER TABLE clients ADD COLUMN IF NOT EXISTS prospect_id INTEGER;

-- Adicionar foreign key constraint
ALTER TABLE clients ADD CONSTRAINT fk_prospect
  FOREIGN KEY (prospect_id) REFERENCES prospects(id)
  ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_clients_prospect_id ON clients(prospect_id);

-- Verificar coluna criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'prospect_id';

-- =============================================================================
-- CORREÇÃO #3: Adicionar constraint UNIQUE em prospects.cnpj
-- =============================================================================
-- Problema: Permite CNPJ duplicado em prospects, causando indicações duplicadas
-- Solução: Adicionar constraint UNIQUE

-- Primeiro, remover duplicatas existentes (se houver)
-- Manter apenas o registro mais recente de cada CNPJ
WITH duplicates AS (
  SELECT id, cnpj,
         ROW_NUMBER() OVER (PARTITION BY cnpj ORDER BY created_at DESC) as rn
  FROM prospects
  WHERE cnpj IS NOT NULL
)
DELETE FROM prospects
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Agora adicionar a constraint UNIQUE
ALTER TABLE prospects ADD CONSTRAINT unique_prospect_cnpj UNIQUE (cnpj);

-- Verificar constraint criada
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'prospects'::regclass AND conname = 'unique_prospect_cnpj';

-- =============================================================================
-- CORREÇÃO #4: Atualizar clientes existentes com prospect_id
-- =============================================================================
-- Tentar vincular clientes existentes com seus prospects de origem
-- (baseado em CNPJ ou email)

-- Por CNPJ
UPDATE clients c
SET prospect_id = p.id
FROM prospects p
WHERE c.cnpj = p.cnpj
  AND c.prospect_id IS NULL
  AND p.status = 'approved';

-- Por email (caso CNPJ não bata)
UPDATE clients c
SET prospect_id = p.id
FROM prospects p
WHERE c.email = p.email
  AND c.prospect_id IS NULL
  AND p.status = 'approved';

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================

-- Verificar todas as constraints criadas
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  pg_get_constraintdef(pgc.oid) as definition
FROM information_schema.table_constraints tc
JOIN pg_constraint pgc ON tc.constraint_name = pgc.conname
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('clients', 'prospects')
  AND tc.constraint_name IN ('unique_client_email', 'fk_prospect', 'unique_prospect_cnpj')
ORDER BY tc.table_name, tc.constraint_type;

-- Verificar índices criados
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'prospects')
  AND indexname IN ('unique_client_email', 'idx_clients_prospect_id', 'unique_prospect_cnpj')
ORDER BY tablename;

-- Estatísticas finais
SELECT 'Clients total' as tabela, COUNT(*) as total FROM clients
UNION ALL
SELECT 'Clients com prospect_id', COUNT(*) FROM clients WHERE prospect_id IS NOT NULL
UNION ALL
SELECT 'Prospects total', COUNT(*) FROM prospects
UNION ALL
SELECT 'Prospects aprovados', COUNT(*) FROM prospects WHERE status = 'approved';

-- =============================================================================
-- ✅ CORREÇÕES COMPLETAS!
-- =============================================================================
-- O banco de dados agora tem:
-- 1. ✅ Constraint UNIQUE em clients.email (evita duplicatas)
-- 2. ✅ Coluna prospect_id em clients (rastreamento de origem)
-- 3. ✅ Foreign Key de clients.prospect_id → prospects.id
-- 4. ✅ Constraint UNIQUE em prospects.cnpj (evita indicações duplicadas)
-- 5. ✅ Índices para performance
--
-- Próximo passo: Aplicar correções no código backend e frontend
-- =============================================================================
