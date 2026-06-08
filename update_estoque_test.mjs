import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching insumos...');
  const { data: insumos, error } = await supabase
    .from('estoque_insumos')
    .select('*')
    .in('cd', ['JDI-SAS', 'JDI-SAE', 'SAS', 'SAE']);

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log(`Found ${insumos?.length || 0} insumos. Updating...`);

  let count = 0;
  for (const insumo of (insumos || [])) {
    const randomEstoque = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
    
    const { error: updateError } = await supabase
      .from('estoque_insumos')
      .update({
        estoque_real: randomEstoque,
        estoque_minimo: 10,
        lead_time: '7',
        status: randomEstoque <= 10 ? 'CRÍTICO' : 'OK'
      })
      .eq('id', insumo.id);

    if (updateError) {
      console.error(`Failed to update insumo ${insumo.id}:`, updateError);
    } else {
      count++;
      console.log(`Updated [${insumo.cd}] ${insumo.item}: estoque_real = ${randomEstoque}`);
    }
  }

  console.log(`Successfully updated ${count} insumos.`);
}

run();
