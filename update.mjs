import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching faturas...");
  const { data: faturas, error } = await supabase.from('faturas').select('*').order('data_emissao', { ascending: true });

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  console.log(`Found ${faturas.length} faturas. Re-assigning codes...`);

  let counter = 1;
  for (const f of faturas) {
    const code = `FAT-${String(counter).padStart(6, '0')}`;
    console.log(`Updating ${f.id} -> ${code}`);
    
    const { error: updateError } = await supabase
      .from('faturas')
      .update({ tipo_documento: code })
      .eq('id', f.id);

    if (updateError) {
      console.error(`Error updating ${f.id}:`, updateError);
    } else {
      counter++;
    }
  }
  console.log("Migration finished.");
}
run();
