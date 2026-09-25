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
    
  const codigosInMovs = [...new Set(movs.map(m => m.codigo))];
  
  const { data: insumos } = await supabase
    .from('estoque_insumos')
    .select('id, item, codigo, cd, excluido')
    .in('codigo', codigosInMovs);
    
  console.table(insumos.map(i => ({ item: i.item, codigo: i.codigo, excluido: i.excluido })));
  
  const excludedCodigos = insumos.filter(i => i.excluido).map(i => i.codigo);
  const activeCodigos = insumos.filter(i => !i.excluido).map(i => i.codigo);
  
  const reallyMissing = excludedCodigos.filter(c => !activeCodigos.includes(c));
  
  console.log('Codigos that only have EXCLUIDO = true:', reallyMissing);
  
  if (reallyMissing.length > 0) {
    const { data: updateData, error } = await supabase
      .from('estoque_insumos')
      .update({ excluido: false, excluido_em: null })
      .in('codigo', reallyMissing);
      
    console.log('Restored!', error);
  }
}

main();
