import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('estoque_insumos')
    .select('*')
    .ilike('cd', '%jundiai%');

  if (error) {
    console.error('Error fetching items:', error);
    return;
  }

  console.log(`Found ${data.length} items for Jundiaí.`);
  // Group by exact item name to see if there are duplicates
  const names = data.map(d => d.item).sort();
  console.log('Items:');
  names.forEach((n, i) => console.log(`${i+1}: ${n}`));
  
  // Also check if there's any status or active column
  const statuses = [...new Set(data.map(d => d.status))];
  console.log('Distinct statuses:', statuses);
}

run();
