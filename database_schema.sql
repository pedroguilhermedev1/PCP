-- Copie e cole este script no painel SQL Editor do Supabase para criar a tabela 'faturas'

CREATE TABLE public.faturas (
    id TEXT PRIMARY KEY,
    marca TEXT NOT NULL,
    fornecedor TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    data_emissao TEXT,
    data_recebimento TEXT,
    data_vencimento TEXT,
    numero_documento TEXT,
    valor NUMERIC NOT NULL,
    centro_custo TEXT,
    filial TEXT,
    tipo_documento TEXT,
    tipo_servico TEXT,
    codigo_servico TEXT,
    heflo TEXT,
    data_abertura_heflo TEXT,
    erp TEXT,
    data_aprovacao TEXT,
    v360 TEXT,
    data_abertura_v360 TEXT,
    status_pagamento TEXT,
    responsavel TEXT,
    forma_pagamento TEXT,
    possui_encargo BOOLEAN DEFAULT false,
    valor_encargo NUMERIC,
    observacoes TEXT,
    data_pagamento_real TEXT,
    
    -- Campos Fase 2 (NEXA)
    nexa_emitiu_nf BOOLEAN DEFAULT false,
    nexa_anexada BOOLEAN DEFAULT false,
    nexa_chamado TEXT,
    nexa_data_envio TEXT,
    nexa_lancamento_concluido BOOLEAN DEFAULT false,
    nexa_data_conclusao_lancamento TEXT,
    nexa_pagamento_programado BOOLEAN DEFAULT false,
    nexa_data_prevista_pagamento TEXT,
    nexa_pagamento_realizado BOOLEAN DEFAULT false
);

-- Ativar RLS (Opcional, comente se não for usar)
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

-- Exemplo de Policy para permitir uso geral anônimo (cuidado em produção):
CREATE POLICY "Permitir acesso total"
ON public.faturas
FOR ALL
USING (true)
WITH CHECK (true);
