-- Script de migração para suportar Pendências e Histórico de Passagens nos T's
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS pendencias JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS historico_passagens JSONB DEFAULT '{}'::jsonb;

-- Opcional: Adicionar campos específicos de controle do Nexa Direto se precisar
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS nexa_possui_rc BOOLEAN DEFAULT false;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS nexa_rc_numero VARCHAR(100);
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS nexa_rc_data TIMESTAMP;
