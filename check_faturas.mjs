import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Fornecedores ---");
  const { data: fornData, error: fornError } = await supabase
    .from('fornecedores')
    .select('*')
    .or('razao_social.ilike.%cartosul%,nome_fantasia.ilike.%cartosul%,razao_social.ilike.%contabilista%,nome_fantasia.ilike.%contabilista%');
  
  if (fornError) console.error("Error fetching fornecedores:", fornError);
  else console.log(fornData);

  console.log("\n--- Faturas ---");
  const { data: fatData, error: fatError } = await supabase
    .from('faturas')
    .select('id, fornecedor, valor, rc_sap, nexa_chamado, cd')
    .or('fornecedor.ilike.%cartosul%,fornecedor.ilike.%contabilista%');
    
  if (fatError) console.error("Error fetching faturas:", fatError);
  else console.log(fatData);
}

run();
