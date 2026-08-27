import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('estoque_insumos')
    .select('id, cd')
    .or('cd.ilike.%jundiai%,cd.ilike.%jdi%');

  if (error) {
    console.error('Error fetching Jundiaí items:', error);
    return;
  }

  const cdValues = [...new Set(data.map(item => item.cd))];
  console.log(`Found ${data.length} items for Jundiaí with CD values: ${cdValues.join(', ')}`);

  if (cdValues.length > 0) {
    let updatedCount = 0;
    for (const cdVal of cdValues) {
      const { error: updateError } = await supabase
        .from('estoque_insumos')
        .update({ cmd: 10 })
        .eq('cd', cdVal);
      
      if (updateError) {
        console.error(`Error updating items for CD ${cdVal}:`, updateError);
      } else {
        const count = data.filter(i => i.cd === cdVal).length;
        updatedCount += count;
        console.log(`Updated ${count} items for CD ${cdVal}`);
      }
    }
    console.log(`Successfully updated CMD to 10 for a total of ${updatedCount} items.`);
  }
}

run();
