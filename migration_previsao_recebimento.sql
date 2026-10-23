-- Migração: Previsão de Recebimento, Entregas Parciais e Auditoria

ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS previsao_recebimento_dias_min INTEGER;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS previsao_recebimento_dias_max INTEGER;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS previsao_recebimento_data_inicio DATE;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS previsao_recebimento_data_fim DATE;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS historico_previsao JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS quantidade_prevista NUMERIC;
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS quantidade_recebida NUMERIC DEFAULT 0;
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS saldo_pendente NUMERIC;
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS previsao_dias_min INTEGER;
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS previsao_dias_max INTEGER;
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS previsao_data_inicio DATE;
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS previsao_data_fim DATE;
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS historico_entregas JSONB DEFAULT '[]'::jsonb;
