const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: items, error } = await supabase
    .from('estoque_insumos')
    .select('id, item, codigo, cd');
    
  if (error) {
    console.error('Error fetching', error);
    return;
  }
  
  const dupesMap = {};
  items.forEach(i => {
    const name = i.item.trim().toLowerCase();
    if (!dupesMap[name]) dupesMap[name] = [];
    dupesMap[name].push(i);
  });
  
  for (const [name, list] of Object.entries(dupesMap)) {
    if (list.length > 1) {
      console.log(`\nDuplicate found for: ${name}`);
      for (const item of list) {
        const { count } = await supabase
          .from('estoque_movimentacoes')
          .select('*', { count: 'exact', head: true })
          .eq('insumo_id', item.id);
        
        console.log(`- ID: ${item.id} | Código: ${item.codigo} | CD: ${item.cd} | Movs: ${count}`);
      }
    }
  }
}

main();
