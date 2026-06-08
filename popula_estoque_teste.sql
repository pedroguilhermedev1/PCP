-- Script para inserir dados de teste na tabela de estoque_insumos
-- com valores aleatórios de estoque_real (entre 10 e 50), estoque_minimo (10) e lead_time (7)

INSERT INTO public.estoque_insumos (cd, codigo, item, unidade, lead_time, estoque_minimo, estoque_real, status, categoria)
VALUES
  ('JDI-SAS', 'INS-SAS-001', 'Papel A4', 'CX', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'Papelaria'),
  ('JDI-SAS', 'INS-SAS-002', 'Caneta Azul', 'UN', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'Papelaria'),
  ('JDI-SAS', 'INS-SAS-003', 'Copo Descartável', 'PCT', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'Copa'),
  ('JDI-SAS', 'INS-SAS-004', 'Luva de Procedimento', 'CX', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'EPI'),
  
  ('JDI-SAE', 'INS-SAE-001', 'Papel A4', 'CX', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'Papelaria'),
  ('JDI-SAE', 'INS-SAE-002', 'Caneta Azul', 'UN', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'Papelaria'),
  ('JDI-SAE', 'INS-SAE-003', 'Café em Pó', 'KG', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'Copa'),
  ('JDI-SAE', 'INS-SAE-004', 'Luva de Procedimento', 'CX', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'EPI');

-- Atualiza o status caso o valor aleatório gerado tenha sido 10 (igual ao mínimo)
UPDATE public.estoque_insumos 
SET status = 'CRÍTICO' 
WHERE estoque_real <= estoque_minimo;
