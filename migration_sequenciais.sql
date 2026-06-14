-- 1. Criar sequências independentes para Entradas e Saídas
CREATE SEQUENCE IF NOT EXISTS seq_entradas START 1;
CREATE SEQUENCE IF NOT EXISTS seq_saidas START 1;

-- 2. Adicionar nova coluna para identificação da movimentação
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS codigo_movimentacao VARCHAR(50);

-- 3. Preencher as movimentações antigas de ENTRADA ordenadas por data_hora
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT id FROM public.estoque_movimentacoes WHERE UPPER(tipo) = 'ENTRADA' ORDER BY data_hora ASC, serial_id ASC)
    LOOP
        UPDATE public.estoque_movimentacoes 
        SET codigo_movimentacao = 'ENT-' || LPAD(nextval('seq_entradas')::text, 6, '0')
        WHERE id = r.id;
    END LOOP;
END $$;

-- 4. Preencher as movimentações antigas de SAÍDA ordenadas por data_hora
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT id FROM public.estoque_movimentacoes WHERE UPPER(tipo) = 'SAÍDA' OR UPPER(tipo) = 'SAIDA' ORDER BY data_hora ASC, serial_id ASC)
    LOOP
        UPDATE public.estoque_movimentacoes 
        SET codigo_movimentacao = 'SAI-' || LPAD(nextval('seq_saidas')::text, 6, '0')
        WHERE id = r.id;
    END LOOP;
END $$;

-- 5. Criar a função da trigger para novas inserções
CREATE OR REPLACE FUNCTION set_codigo_movimentacao()
RETURNS TRIGGER AS $$
BEGIN
  IF UPPER(NEW.tipo) = 'ENTRADA' THEN
    NEW.codigo_movimentacao := 'ENT-' || LPAD(nextval('seq_entradas')::text, 6, '0');
  ELSIF UPPER(NEW.tipo) = 'SAÍDA' OR UPPER(NEW.tipo) = 'SAIDA' THEN
    NEW.codigo_movimentacao := 'SAI-' || LPAD(nextval('seq_saidas')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Aplicar a trigger na tabela
DROP TRIGGER IF EXISTS trg_set_codigo_movimentacao ON public.estoque_movimentacoes;
CREATE TRIGGER trg_set_codigo_movimentacao
BEFORE INSERT ON public.estoque_movimentacoes
FOR EACH ROW
EXECUTE FUNCTION set_codigo_movimentacao();
