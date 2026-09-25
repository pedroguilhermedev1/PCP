const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const faturas = ['F-19265__CAT__Material', 'F-48359__CAT__Material', 'F-72408__CAT__Material'];
  
  const { data: movs } = await supabase
    .from('estoque_movimentacoes')
    .select('id, item, codigo, cd')
    .in('fatura_id', faturas);
    
  console.log(`Loaded ${movs.length} movs.`);
  
  const { data: insumos } = await supabase
    .from('estoque_insumos')
    .select('codigo, cd, item')
    .ilike('cd', 'FORTALEZA')
    .eq('tipo_envio', 'Principal')
    .or('excluido.is.null,excluido.eq.false');
    
  const allowed = new Set(insumos.map(i => i.codigo));
  
  let allowedCount = 0;
  for (const m of movs) {
    if (allowed.has(m.codigo)) {
      allowedCount++;
    } else {
      console.log(`Not allowed: ${m.item} - Codigo: '${m.codigo}'`);
    }
  }
  
  console.log(`Total allowed: ${allowedCount} out of ${movs.length}`);
}

main();
