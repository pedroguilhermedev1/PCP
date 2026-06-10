import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Desfazendo importação errada: apagando registros de Jundiaí (SAS/SAE)...");
  const { error: e1 } = await supabase.from('estoque_insumos').delete().eq('cd', 'jundiai').eq('empresa', 'SAS');
  const { error: e2 } = await supabase.from('estoque_insumos').delete().eq('cd', 'jundiai').eq('empresa', 'SAE');

  if (e1) console.error("Erro SAS:", e1);
  if (e2) console.error("Erro SAE:", e2);

  console.log("Limpeza concluída.");
}

run();
