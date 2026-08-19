import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const itemTeste = {
    codigo: 'TESTE-XPTO',
    item: 'Etiqueta XPTO',
    estoque_real: 100,
    cd: 'fortaleza', // CD Padrão
    empresa: 'SAS',
    categoria: 'Geral',
    status: 'OK',
    estoque_minimo: 10,
    lead_time: '5',
    unidade: 'UN',
    conta_contabil: '123456',
    descricao_contabil: 'Material Teste'
  };

  const { error } = await supabase.from('estoque_insumos').insert([itemTeste]);

  if (error) {
    console.error("Erro ao inserir insumo de teste:", error);
  } else {
    console.log("Insumo de teste inserido com sucesso!");
  }
}

run();
