import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_tables'); // Or just fetch from a known table if we have one.
  // actually, supabase JS client doesn't expose list tables easily without raw query or postgres functions.
  // Wait, I can just query the `information_schema.tables` using the supabase REST API if exposed, or let's just query a few more likely table names.
  const tables = ['sas', 'sae', 'items', 'produtos', 'materiais', 'catalogo', 'itens'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (!error) {
      console.log(`Table exists: ${t}`);
      
      const res = await supabase.from(t).select('*').limit(30);
      console.log(`Data from ${t}:`, res.data);
    }
  }
}

run();
