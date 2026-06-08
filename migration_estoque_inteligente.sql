-- Adiciona as colunas para o controle inteligente de estoque com os valores padrão fornecidos
ALTER TABLE public.estoque_insumos ADD COLUMN IF NOT EXISTS cmd NUMERIC DEFAULT 10;
ALTER TABLE public.estoque_insumos ADD COLUMN IF NOT EXISTS dias_seguranca NUMERIC DEFAULT 3;

-- Se desejar, esse bloco força as tabelas existentes a ficarem com o valor 10 e 3 caso não tenham recebido o default corretamente
UPDATE public.estoque_insumos SET cmd = 10 WHERE cmd IS NULL;
UPDATE public.estoque_insumos SET dias_seguranca = 3 WHERE dias_seguranca IS NULL;
