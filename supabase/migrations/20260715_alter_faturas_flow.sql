-- Alteração no fluxo Faturas 2.0 (Fase 1 Compras e Fase 2 NEXA)

-- 1. O número do documento (Nota Fiscal) não é mais obrigatório na Fase 1
ALTER TABLE public.faturas ALTER COLUMN numero_documento DROP NOT NULL;

-- 2. Adição de novas colunas para controle da Fase 2 (NEXA)
ALTER TABLE public.faturas
    ADD COLUMN IF NOT EXISTS nexa_emitiu_nf BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS nexa_anexada BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS nexa_chamado TEXT,
    ADD COLUMN IF NOT EXISTS nexa_data_envio TEXT,
    ADD COLUMN IF NOT EXISTS nexa_lancamento_concluido BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS nexa_data_conclusao_lancamento TEXT,
    ADD COLUMN IF NOT EXISTS nexa_pagamento_programado BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS nexa_data_prevista_pagamento TEXT,
    ADD COLUMN IF NOT EXISTS nexa_pagamento_realizado BOOLEAN DEFAULT false;
