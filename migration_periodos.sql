-- Criação da tabela de períodos de faturas para manter histórico de fluxos (SAP/Nexa)
CREATE TABLE IF NOT EXISTS public.fatura_periodos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fatura_id TEXT NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
    etapa_nome TEXT NOT NULL,
    time_responsavel TEXT NOT NULL,
    responsavel_individual TEXT,
    data_inicio TEXT NOT NULL,
    data_termino TEXT,
    motivo_devolucao TEXT,
    descricao TEXT,
    sla_dias NUMERIC DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adicionando coluna 'origem' na tabela de faturas, caso não exista
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'SAP';

-- Habilitar RLS e criar policy genérica (ajuste para produção)
ALTER TABLE public.fatura_periodos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total a fatura_periodos"
ON public.fatura_periodos
FOR ALL
USING (true)
WITH CHECK (true);
