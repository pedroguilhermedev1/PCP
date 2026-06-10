-- Copie e cole este código no painel SQL Editor do Supabase para adicionar as novas colunas
-- da importação de insumos restantes

ALTER TABLE public.estoque_insumos
ADD COLUMN IF NOT EXISTS empresa TEXT,
ADD COLUMN IF NOT EXISTS conta_contabil TEXT,
ADD COLUMN IF NOT EXISTS descricao_contabil TEXT;
