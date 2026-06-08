import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: insumos, error } = await supabase
    .from('estoque_insumos')
    .select('id, cd, item');

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log(`Found ${insumos?.length || 0} insumos.`);
  console.log(insumos?.slice(0, 10)); // just print first 10
}

run();
