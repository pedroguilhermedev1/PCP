const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('estoque_insumos')
    .select('item, estoque_real, cd')
    .ilike('cd', 'jundiai')
    .ilike('item', '%FITA%ADESIVA%');
    
  console.log("Fitas adesivas:", data);

  const { data: d2 } = await supabase
    .from('estoque_insumos')
    .select('item, estoque_real, cd')
    .ilike('cd', 'jundiai')
    .ilike('item', '%PROFESSOR%');
  console.log("Professores:", d2);
  
  const { data: d3 } = await supabase
    .from('estoque_insumos')
    .select('item, estoque_real, cd')
    .ilike('cd', 'jundiai')
    .ilike('item', '%AVALIAÇÃO%');
  console.log("Avaliações:", d3);

  const { data: d4 } = await supabase
    .from('estoque_insumos')
    .select('item, estoque_real, cd')
    .ilike('cd', 'jundiai')
    .ilike('item', '%FITA DEMARCAÇÃO VERMELHA%');
  console.log("Demarcação Vermelha:", d4);
}

run();
