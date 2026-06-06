-- Execute isso no Supabase SQL Editor

CREATE TABLE public.fornecedores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tipo TEXT NOT NULL, -- 'Material' ou 'Serviço'
    cnpj TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    contato TEXT,
    telefone TEXT,
    email TEXT,
    categoria TEXT, -- ex: "Limpeza", "Gráfica", "TI"
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissões RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total fornecedores"
ON public.fornecedores
FOR ALL
USING (true)
WITH CHECK (true);
