-- Script de Migração V2 para Relatórios, Identificadores e Fluxo Operacional

-- 1. Faturas: Adiciona Contabilidade e Identificador Único
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS conta_contabil VARCHAR(255);
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS descricao_contabil VARCHAR(255);
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS serial_id SERIAL;

-- Adiciona a coluna do identificador FAT-XXXXXX (Pode falhar se você tiver que apagar registros conflitantes, mas geralmente funciona liso)
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS identificador VARCHAR(50) GENERATED ALWAYS AS ('FAT-' || LPAD(serial_id::text, 6, '0')) STORED;

-- 2. Tabela Oficial de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_id SERIAL,
  identificador VARCHAR(50) GENERATED ALWAYS AS ('MOV-' || LPAD(serial_id::text, 6, '0')) STORED,
  data_hora TIMESTAMP DEFAULT NOW(),
  tipo VARCHAR(50), -- 'ENTRADA' ou 'SAÍDA'
  codigo VARCHAR(100),
  item VARCHAR(255),
  cd VARCHAR(50),
  quantidade NUMERIC,
  usuario VARCHAR(100),
  observacoes TEXT,
  setor VARCHAR(100),
  status VARCHAR(50) -- 'PENDENTE', 'CONFIRMADO', 'REJEITADO'
);

ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total" ON public.estoque_movimentacoes;
CREATE POLICY "Permitir acesso total" ON public.estoque_movimentacoes FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabela de Fornecedores para suportar o Relatório
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255),
  cnpj VARCHAR(50),
  contato VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total" ON public.fornecedores;
CREATE POLICY "Permitir acesso total" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);
