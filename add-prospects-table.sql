-- =============================================================================
-- Adicionar Tabela de Prospects (Indicações)
-- Execute este SQL no seu banco de dados
-- =============================================================================

-- Criar tabela prospects
CREATE TABLE IF NOT EXISTS public.prospects (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  employees TEXT NOT NULL,
  segment TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'in-analysis', 'approved', 'rejected')),
  partner_id TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by TEXT,
  validation_notes TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_prospects_partner_id ON public.prospects(partner_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON public.prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON public.prospects(created_at);
CREATE INDEX IF NOT EXISTS idx_prospects_cnpj ON public.prospects(cnpj);

-- Adicionar comentários para documentação
COMMENT ON TABLE public.prospects IS 'Tabela de indicações de prospects feitas pelos parceiros';
COMMENT ON COLUMN public.prospects.status IS 'Status da indicação: pending (aguardando validação), validated (validado), in-analysis (em análise), approved (aprovado e movido para clientes), rejected (rejeitado)';
COMMENT ON COLUMN public.prospects.partner_id IS 'ID do parceiro que fez a indicação';
COMMENT ON COLUMN public.prospects.submitted_at IS 'Data e hora em que a indicação foi submetida';
COMMENT ON COLUMN public.prospects.validated_at IS 'Data e hora em que a indicação foi validada';
COMMENT ON COLUMN public.prospects.validated_by IS 'Nome ou ID do usuário que validou a indicação';
COMMENT ON COLUMN public.prospects.is_approved IS 'Se a indicação foi aprovada pelo administrador';

-- Desabilitar RLS para acesso total via service_role
ALTER TABLE public.prospects DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ✅ TABELA PROSPECTS CRIADA COM SUCESSO!
-- =============================================================================
-- Agora você pode:
-- 1. Criar indicações via interface
-- 2. Validar indicações como administrador
-- 3. Aprovar ou rejeitar prospects
-- 4. Mover prospects aprovados para a área de clientes
-- =============================================================================
