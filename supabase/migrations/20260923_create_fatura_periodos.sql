-- Criação da tabela de históricos de tempos e pendências (SLAs)

CREATE TABLE IF NOT EXISTS public.fatura_periodos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    fatura_id TEXT NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
    origem VARCHAR(10) NOT NULL, -- 'SAP' ou 'Nexa'
    etapa_nome VARCHAR(100) NOT NULL,
    time_responsavel VARCHAR(50) NOT NULL, -- Ex: 'PCP', 'Fiscal', 'Contas a Pagar'
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data_termino TIMESTAMP WITH TIME ZONE,
    sla_dias INTEGER NOT NULL,
    motivo_transferencia TEXT, -- Caso tenha sido devolvido ou transferido (Falta de documento, etc)
    observacao_transferencia TEXT,
    usuario_transferencia VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_fatura_periodos_fatura_id ON public.fatura_periodos(fatura_id);
CREATE INDEX IF NOT EXISTS idx_fatura_periodos_time ON public.fatura_periodos(time_responsavel);

-- Habilitar RLS
ALTER TABLE public.fatura_periodos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Simplificado para permitir todas as operações para autenticados)
CREATE POLICY "Permitir leitura para todos" ON public.fatura_periodos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para todos" ON public.fatura_periodos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para todos" ON public.fatura_periodos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para todos" ON public.fatura_periodos FOR DELETE USING (true);

-- Adicionar coluna origem na tabela faturas se não existir
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS origem VARCHAR(10);
