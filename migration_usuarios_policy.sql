-- Script para habilitar e configurar permissões na tabela usuarios_permissoes
-- Execute no SQL Editor do painel Supabase

CREATE TABLE IF NOT EXISTS public.usuarios_permissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    nome_completo TEXT,
    role TEXT NOT NULL,
    cd_slug TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS
ALTER TABLE public.usuarios_permissoes ENABLE ROW LEVEL SECURITY;

-- Remove política se já existir
DROP POLICY IF EXISTS "Permitir acesso total" ON public.usuarios_permissoes;

-- Cria política permitindo acesso total ao Supabase Client (anon)
CREATE POLICY "Permitir acesso total"
ON public.usuarios_permissoes
FOR ALL
USING (true)
WITH CHECK (true);
