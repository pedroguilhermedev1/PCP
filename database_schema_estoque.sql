-- Copie e cole este script no painel SQL Editor do Supabase para criar a tabela 'estoque_insumos'
-- Ela foi preparada para a importação de dados da base JDI

CREATE TABLE public.estoque_insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cd TEXT NOT NULL,
    codigo TEXT NOT NULL,
    item TEXT NOT NULL,
    unidade TEXT NOT NULL,
    lead_time TEXT,
    estoque_minimo INTEGER DEFAULT 0,
    estoque_real INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    categoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS (Opcional, comente se não for usar)
ALTER TABLE public.estoque_insumos ENABLE ROW LEVEL SECURITY;

-- Exemplo de Policy para permitir uso geral anônimo (cuidado em produção):
CREATE POLICY "Permitir acesso total"
ON public.estoque_insumos
FOR ALL
USING (true)
WITH CHECK (true);
