import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Updating estoque_insumos to UPPERCASE...");
  let { data: insumos, error: errorInsumos } = await supabase.from('estoque_insumos').select('id, item');
  if (errorInsumos) {
    console.error(errorInsumos);
    return;
  }

  for (const insumo of insumos) {
    const formatted = insumo.item ? insumo.item.toUpperCase() : '';
    if (formatted !== insumo.item) {
      await supabase.from('estoque_insumos').update({ item: formatted }).eq('id', insumo.id);
    }
  }

  console.log("Updating estoque_movimentacoes to UPPERCASE...");
  let { data: movs, error: errorMovs } = await supabase.from('estoque_movimentacoes').select('id, item');
  if (errorMovs) {
    console.error(errorMovs);
    return;
  }

  for (const mov of movs) {
    const formatted = mov.item ? mov.item.toUpperCase() : '';
    if (formatted !== mov.item) {
      await supabase.from('estoque_movimentacoes').update({ item: formatted }).eq('id', mov.id);
    }
  }

  console.log("Done.");
}

run();
