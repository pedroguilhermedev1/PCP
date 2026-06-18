import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const nseItems = [
    { item: 'Fita adesiva transparente', codigo: 'NSE-001' },
    { item: 'Etiqueta adesiva 100x70 laranja zebra', codigo: 'NSE-002' },
    { item: 'Etiqueta adesiva 100x70 azul zebra', codigo: 'NSE-003' },
    { item: 'Etiqueta adesiva 100x70 neutra zebra', codigo: 'NSE-004' },
    { item: 'Etiqueta adesiva 150x100 Correios', codigo: 'NSE-005' },
    { item: 'Etiqueta adesiva 34x23 amarela vol', codigo: 'NSE-006' },
    { item: 'Ribbon 110x450', codigo: 'NSE-007' },
    { item: 'Ribbon 110x75', codigo: 'NSE-008' },
    { item: 'Fita adesiva personalizada', codigo: 'NSE-009' },
    { item: 'Bobina filme stretch', codigo: 'NSE-010' },
    { item: 'Papel sulfite folha A4', codigo: 'NSE-011' },
    { item: 'Película PVC termo encolhível 450x30', codigo: 'NSE-012' }
  ];

  const inserts = nseItems.map(item => ({
    cd: 'NSE',
    codigo: item.codigo,
    item: item.item,
    unidade: 'UN',
    lead_time: '7',
    estoque_minimo: 0,
    estoque_real: 0,
    status: 'CRÍTICO',
    categoria: 'Geral',
    empresa: 'NSE'
  }));

  const { data, error } = await supabase
    .from('estoque_insumos')
    .insert(inserts);

  if (error) {
    console.error('Error inserting NSE insumos:', error);
  } else {
    console.log('Successfully inserted NSE insumos:', inserts.length);
  }
}

run();
