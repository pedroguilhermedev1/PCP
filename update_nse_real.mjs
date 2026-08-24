import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // First, delete existing NSE items
  const { error: deleteError } = await supabase
    .from('estoque_insumos')
    .delete()
    .eq('cd', 'NSE');

  if (deleteError) {
    console.error('Error deleting existing NSE items:', deleteError);
    return;
  }
  console.log('Deleted old NSE items.');

  const nseItems = [
    { codigo: 'CO000015', item: 'BOBINA FILME STRETCH', estoque_real: 3 },
    { codigo: 'CO000007', item: 'ETIQUETA ADESIVA 100x70 AZUL ZEBRA', estoque_real: 42 },
    { codigo: 'CO000006', item: 'ETIQUETA ADESIVA 100x70 LARANJA ZEBRA', estoque_real: 42 },
    { codigo: 'CO000008', item: 'ETIQUETA ADESIVA 100x70 NEUTRA ZEBRA', estoque_real: 111 },
    { codigo: 'CO000009', item: 'ETIQUETA ADESIVA 150x100 CORREIOS', estoque_real: 74 },
    { codigo: 'CO000010', item: 'ETIQUETA ADESIVA 34x23 AMARELA VOL', estoque_real: 9 },
    { codigo: 'CO000013', item: 'FITA ADESIVA PERSONALIZADA', estoque_real: 114 },
    { codigo: 'CO000071', item: 'FITA ADESIVA TRANSPARENTE', estoque_real: 114 },
    { codigo: 'CO000016', item: 'PAPEL SULFITE FOLHA A4', estoque_real: 25 },
    { codigo: 'CO000065', item: 'PELICULA PVC TERMO ENCOLHÍVEL 450X30', estoque_real: 0 },
    { codigo: 'CO000011', item: 'RIBBON 110x450', estoque_real: 28 },
    { codigo: 'CO000012', item: 'RIBBON 110x75', estoque_real: 0 }
  ];

  const inserts = nseItems.map(item => ({
    cd: 'NSE',
    codigo: item.codigo,
    item: item.item,
    unidade: 'UN',
    lead_time: '7',
    estoque_minimo: 0,
    estoque_real: item.estoque_real,
    status: 'CRÍTICO',
    categoria: 'Geral',
    empresa: 'NSE',
    cmd: 10,
    dias_seguranca: 3,
    tipo_envio: 'Principal'
  }));

  const { data, error } = await supabase
    .from('estoque_insumos')
    .insert(inserts);

  if (error) {
    console.error('Error inserting NSE insumos:', error);
  } else {
    console.log('Successfully inserted new NSE insumos:', inserts.length);
  }
}

run();
