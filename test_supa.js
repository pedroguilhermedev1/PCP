const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('estoque_movimentacoes')
    .select('*')
    .order('data_hora', { ascending: false })
    .limit(30);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} recent movs`);
  console.table(data.map(d => ({
    tipo: d.tipo,
    item: d.item?.substring(0, 30),
    quantidade: d.quantidade,
    data_hora: d.data_hora,
    fatura_id: d.fatura_id,
    insumo_id: d.insumo_id
  })));
}

main();
