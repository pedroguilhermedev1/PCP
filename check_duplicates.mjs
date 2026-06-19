import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  const { data: insumos, error } = await supabase.from('estoque_insumos').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  const grouped = {};
  for (const i of insumos) {
    const key = `${i.cd}_${i.item}_${i.tipo_envio || 'Principal'}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(i);
  }
  
  const duplicates = Object.values(grouped).filter(g => g.length > 1);
  console.log(`Found ${duplicates.length} items with duplicates.`);
  if (duplicates.length > 0) {
    console.log("Example duplicate:", duplicates[0]);
  }
}

checkDuplicates();
