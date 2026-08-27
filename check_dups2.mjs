import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('estoque_insumos')
    .select('*')
    .ilike('cd', '%jundiai%')
    .order('item');

  if (error) {
    console.error(error); return;
  }
  
  if (data.length >= 2) {
    console.log("Difference between the two BOBINA SHRINK:");
    const d1 = data[0];
    const d2 = data[1];
    for (const key in d1) {
      if (d1[key] !== d2[key]) {
        console.log(`${key}: ${d1[key]} !== ${d2[key]}`);
      }
    }
  }
}
run();
