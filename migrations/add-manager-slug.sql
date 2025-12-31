-- Migration: Adicionar campo manager_slug para gerentes recrutarem parceiros
-- Data: 2025-01-01

-- Criar tabela partner_prospects caso não exista
CREATE TABLE IF NOT EXISTS public.partner_prospects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  cnpj TEXT,
  referred_by_partner_id TEXT,
  referred_by_partner_name TEXT,
  manager_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  approval_notes TEXT
);

-- Criar índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_partner_prospects_email ON public.partner_prospects(email);
CREATE INDEX IF NOT EXISTS idx_partner_prospects_referred_by ON public.partner_prospects(referred_by_partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_prospects_manager_id ON public.partner_prospects(manager_id);
CREATE INDEX IF NOT EXISTS idx_partner_prospects_status ON public.partner_prospects(status);

-- Adicionar coluna manager_id caso a tabela já exista mas não tenha esse campo
ALTER TABLE public.partner_prospects
ADD COLUMN IF NOT EXISTS manager_id TEXT;

-- Adicionar coluna manager_slug na tabela users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS manager_slug text UNIQUE;

-- Criar índice para otimizar buscas por manager_slug
CREATE INDEX IF NOT EXISTS idx_users_manager_slug ON public.users(manager_slug);

-- Adicionar coluna company, cnpj e phone caso não existam (necessárias para novos parceiros)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS company text;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS cnpj text;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone text;

-- Gerar manager_slug para gerentes existentes que ainda não têm
-- Formato: nome-sobrenome-timestamp
DO $$
DECLARE
  manager_record RECORD;
  base_slug text;
  final_slug text;
  counter int;
BEGIN
  FOR manager_record IN
    SELECT id, name FROM users WHERE role = 'manager' AND manager_slug IS NULL
  LOOP
    -- Criar slug base a partir do nome
    base_slug := lower(regexp_replace(manager_record.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);

    -- Garantir que o slug seja único
    final_slug := base_slug;
    counter := 1;

    WHILE EXISTS (SELECT 1 FROM users WHERE manager_slug = final_slug) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    -- Atualizar o gerente com o slug
    UPDATE users
    SET manager_slug = final_slug
    WHERE id = manager_record.id;

    RAISE NOTICE 'Manager % recebeu slug: %', manager_record.name, final_slug;
  END LOOP;
END $$;

-- Comentário explicativo
COMMENT ON COLUMN public.users.manager_slug IS 'Slug único para landing page de recrutamento de parceiros pelo gerente';
