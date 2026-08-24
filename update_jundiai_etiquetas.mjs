import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('estoque_insumos')
    .select('id, item, cd, lead_time')
    .ilike('item', 'etiqueta%');

  if (error) {
    console.error('Error fetching items:', error);
    return;
  }

  console.log(`Found ${data.length} total items starting with "etiqueta".`);
  const jundiaiItems = data.filter(r => r.cd.toLowerCase().includes('jundiai') || r.cd.toLowerCase().includes('jdi'));
  console.log(`Of those, ${jundiaiItems.length} belong to Jundiaí (CDs: ${[...new Set(jundiaiItems.map(i => i.cd))].join(', ')})`);
  
  if (jundiaiItems.length > 0) {
    const cdVal = jundiaiItems[0].cd; // We'll just update for this exact CD value
    const { error: updateError } = await supabase
      .from('estoque_insumos')
      .update({ lead_time: '5' })
      .eq('cd', cdVal)
      .ilike('item', 'etiqueta%');

    if (updateError) {
      console.error('Error updating items:', updateError);
    } else {
      console.log(`Successfully updated lead time to 5 for ${jundiaiItems.length} items in CD = ${cdVal}`);
    }
  }
}

run();
