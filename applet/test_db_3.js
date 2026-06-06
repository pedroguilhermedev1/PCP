const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'CREATE TABLE IF NOT EXISTS public.estoque_insumos (id UUID DEFAULT gen_random_uuid(), cd TEXT);' });
  console.log(data, error);
}
run();
