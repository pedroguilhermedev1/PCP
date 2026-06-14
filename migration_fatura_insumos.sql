-- Migração para adicionar suporte a insumos nas faturas e vinculá-las com movimentações

-- Adicionar o campo insumos (array de objetos) na tabela de faturas
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS insumos JSONB DEFAULT '[]'::jsonb;

-- Adicionar campo fatura_id nas movimentações de estoque para permitir a rastreabilidade (já era pedido antes)
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS fatura_id VARCHAR(255);
