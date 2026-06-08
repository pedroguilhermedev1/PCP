-- Ativar RLS
ALTER TABLE public.estoque_insumos ENABLE ROW LEVEL SECURITY;

-- Remove política se já existir
DROP POLICY IF EXISTS "Permitir acesso total" ON public.estoque_insumos;

-- Cria política permitindo TUDO para o Supabase Client (anon) funcionar sem bloqueio de RLS
CREATE POLICY "Permitir acesso total"
ON public.estoque_insumos
FOR ALL
USING (true)
WITH CHECK (true);
