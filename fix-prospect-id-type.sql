-- =============================================================================
-- FIX: Corrigir tipo de prospect_id em clients (deve ser TEXT, não INTEGER)
-- =============================================================================

-- 1. Remover o índice existente
DROP INDEX IF EXISTS idx_clients_prospect_id;

-- 2. Alterar o tipo da coluna prospect_id de INTEGER para TEXT
ALTER TABLE clients ALTER COLUMN prospect_id TYPE TEXT;

-- 3. Adicionar a constraint de foreign key (agora os tipos são compatíveis)
ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS fk_prospect;

ALTER TABLE clients
  ADD CONSTRAINT fk_prospect
    FOREIGN KEY (prospect_id) REFERENCES prospects(id)
    ON DELETE SET NULL;

-- 4. Recriar o índice
CREATE INDEX idx_clients_prospect_id ON clients(prospect_id);

-- 5. Verificar constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'clients'
  AND tc.constraint_name = 'fk_prospect';

-- ✅ PRONTO! Agora prospect_id é TEXT e compatível com prospects.id
