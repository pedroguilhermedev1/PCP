-- Migração para separar indicadores Principais e Complementares

-- 1. Adicionar tipo_envio no estoque de insumos
ALTER TABLE public.estoque_insumos ADD COLUMN IF NOT EXISTS tipo_envio VARCHAR(50) DEFAULT 'Principal';

-- Atualizar registros existentes que vieram antes dessa alteração para 'Principal'
UPDATE public.estoque_insumos SET tipo_envio = 'Principal' WHERE tipo_envio IS NULL;

-- 2. Adicionar tipo_envio nas movimentações
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS tipo_envio VARCHAR(50) DEFAULT 'Principal';

-- Atualizar registros existentes para 'Principal'
UPDATE public.estoque_movimentacoes SET tipo_envio = 'Principal' WHERE tipo_envio IS NULL;

-- 3. CLONAR O CATÁLOGO PARA COMPLEMENTAR (NOVIDADE)
-- Isso vai garantir que absolutamente todos os insumos apareçam tanto em Principal quanto em Complementar,
-- sem precisar cadastrar um por um.
INSERT INTO public.estoque_insumos (
  cd, empresa, codigo, item, unidade, lead_time, estoque_minimo, estoque_real, status, categoria, cmd, conta_contabil, descricao_contabil, tipo_envio
)
SELECT 
  cd, empresa, codigo, item, unidade, lead_time, estoque_minimo, estoque_real, status, categoria, cmd, conta_contabil, descricao_contabil, 'Complementar'
FROM public.estoque_insumos
WHERE tipo_envio = 'Principal';
