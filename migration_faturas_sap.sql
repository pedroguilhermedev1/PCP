ALTER TABLE public.faturas
ADD COLUMN rc_sap TEXT,
ADD COLUMN data_rc_sap TEXT,
ADD COLUMN pedido_sap TEXT,
ADD COLUMN data_pedido_sap TEXT,
ADD COLUMN doc_subsequente_criado BOOLEAN DEFAULT false,
ADD COLUMN numero_doc_subsequente TEXT,
ADD COLUMN is_sap BOOLEAN DEFAULT false;
