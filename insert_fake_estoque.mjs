import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const cds = ['JDI-SAS', 'JDI-SAE'];
  
  const fakeItems = [
    { item: 'Papel A4', codigo: 'INS-001', unidade: 'CX', categoria: 'Papelaria' },
    { item: 'Caneta Azul', codigo: 'INS-002', unidade: 'UN', categoria: 'Papelaria' },
    { item: 'Copo Descartável', codigo: 'INS-003', unidade: 'PCT', categoria: 'Copa' },
    { item: 'Café em Pó', codigo: 'INS-004', unidade: 'KG', categoria: 'Copa' },
    { item: 'Luva de Procedimento', codigo: 'INS-005', unidade: 'CX', categoria: 'EPI' },
  ];

  const inserts = [];

  for (const cd of cds) {
    for (const item of fakeItems) {
      const randomEstoque = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
      inserts.push({
        cd,
        codigo: item.codigo, // It's fine to repeat code across different CDs for testing
        item: item.item,
        unidade: item.unidade,
        lead_time: '7',
        estoque_minimo: 10,
        estoque_real: randomEstoque,
        status: randomEstoque <= 10 ? 'CRÍTICO' : 'OK',
        categoria: item.categoria
      });
    }
  }

  const { data, error } = await supabase
    .from('estoque_insumos')
    .insert(inserts);

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted fake insumos:', inserts.length);
  }
}

run();
