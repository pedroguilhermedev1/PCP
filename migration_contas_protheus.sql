CREATE TABLE IF NOT EXISTS public.contas_protheus (
    conta_protheus TEXT PRIMARY KEY,
    desc_conta_protheus TEXT NOT NULL
);

ALTER TABLE public.contas_protheus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.contas_protheus FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.contas_protheus FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.faturas
DROP COLUMN IF EXISTS conta_contabil,
DROP COLUMN IF EXISTS descricao_contabil,
ADD COLUMN IF NOT EXISTS conta_protheus VARCHAR(255),
ADD COLUMN IF NOT EXISTS desc_conta_protheus TEXT;
