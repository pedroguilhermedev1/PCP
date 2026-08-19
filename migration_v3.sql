-- Script de Migração V3 - Evolução do Sistema PCP

-- 1. Tabela estoque_movimentacoes: Adicionar campo 'empresa'
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS empresa VARCHAR(50);

-- 2. Tabela faturas: Atualizar controle de edição e fluxo Nexa
-- O campo 'responsavel' já existe conforme database_schema.sql.

ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS editado_por VARCHAR(100);
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS data_ultima_edicao TIMESTAMP;

ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS fluxo_iniciado_por VARCHAR(20) DEFAULT 'SAP';
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS nexa_pc_numero VARCHAR(100);
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS nexa_pc_concluido BOOLEAN DEFAULT false;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS nexa_pc_data TIMESTAMP;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS nexa_pc_usuario VARCHAR(100);

-- 3. Backfill da coluna responsavel para faturas existentes
-- Vamos usar um bloco anonimo (DO) para tentar preencher com segurança.
DO $$
BEGIN
    -- Se houvesse uma coluna created_by confiavel usariamos ela. 
    -- Como não temos certeza se os dados legados têm responsavel vazio, preenchemos com 'Sistema'.
    UPDATE public.faturas 
    SET responsavel = 'Sistema' 
    WHERE responsavel IS NULL OR responsavel = '';
END $$;
