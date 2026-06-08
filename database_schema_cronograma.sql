-- Execute isso no Supabase SQL Editor para criar a tabela 'cronograma_entregas'
-- Armazena eventos de entrega de insumos por data e CD

CREATE TABLE public.cronograma_entregas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TEXT NOT NULL,          -- YYYY-MM-DD
    time TEXT NOT NULL,          -- HH:MM
    description TEXT NOT NULL,
    cd TEXT NOT NULL,             -- SAS, SAE, IS, COC, NSE, PSD, Raízes
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.cronograma_entregas ENABLE ROW LEVEL SECURITY;

-- Policy para permitir acesso total (mesma abordagem das demais tabelas do projeto)
CREATE POLICY "Permitir acesso total cronograma"
ON public.cronograma_entregas
FOR ALL
USING (true)
WITH CHECK (true);
