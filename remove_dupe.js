const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: items, error } = await supabase
    .from('estoque_insumos')
    .select('id, item, codigo, cd, created_at')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching', error);
    return;
  }
  
  const dupesMap = {};
  items.forEach(i => {
    // Unique key by item name and CD
    const key = `${i.item.trim().toLowerCase()}_${i.cd}`;
    if (!dupesMap[key]) dupesMap[key] = [];
    dupesMap[key].push(i);
  });
  
  let deletedCount = 0;
  
  for (const [key, list] of Object.entries(dupesMap)) {
    if (list.length > 1) {
      // Keep the first one (oldest created_at)
      const toKeep = list[0];
      const toDelete = list.slice(1);
      
      console.log(`\nDuplicate found for: ${key}. Keeping ID: ${toKeep.id}`);
      for (const item of toDelete) {
        console.log(`- Deleting duplicate ID: ${item.id}`);
        const { error: delErr } = await supabase
          .from('estoque_insumos')
          .delete()
          .eq('id', item.id);
          
        if (delErr) {
          console.error(`Failed to delete ${item.id}:`, delErr);
        } else {
          deletedCount++;
        }
      }
    }
  }
  
  console.log(`\nDeleted ${deletedCount} duplicate records.`);
}

main();
