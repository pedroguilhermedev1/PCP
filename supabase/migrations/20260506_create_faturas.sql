-- Create Faturas table
CREATE TABLE public.faturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marca TEXT NOT NULL,
    fornecedor TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    data_emissao TEXT,
    data_recebimento TEXT,
    data_vencimento TEXT,
    numero_documento TEXT NOT NULL,
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
    data_pagamento_real TEXT
);

-- Note: the 'id' uses UUID by default. So generating ids natively is possible, but currently the client might pass simple string IDs. 
-- In Supabase, if the client passes 'F-001' to UUID, it will throw an error.
-- To allow string IDs (if used for mocks) you can define ID as TEXT:
-- CREATE TABLE public.faturas (
--    id TEXT PRIMARY KEY,
--    ...
-- )
