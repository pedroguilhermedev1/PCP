import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Iniciando migração de Faturas 1.0 (Materiais) para 2.0...");

  // 1. Fetch faturas (Faturas 1.0)
  const { data: faturas, error: faturasError } = await supabase
    .from('faturas')
    .select('id, cnpj, fornecedor, numero_documento')
    .is('is_sap', false);

  if (faturasError) {
    console.error("Erro ao buscar faturas (false):", faturasError);
    return;
  }
  
  const { data: faturasNull, error: faturasNullError } = await supabase
    .from('faturas')
    .select('id, cnpj, fornecedor, numero_documento')
    .is('is_sap', null);
    
  if (faturasNullError) {
    console.error("Erro ao buscar faturas (null):", faturasNullError);
    return;
  }

  // Filter to Materiais
  const allFaturas = [...(faturas || []), ...(faturasNull || [])].filter(f => f.id && f.id.includes('__CAT__Material'));
  
  console.log(`Encontradas ${allFaturas.length} faturas de Materiais na Faturas 1.0.`);

  if (allFaturas.length === 0) {
    console.log("Nenhuma fatura encontrada. Operação abortada.");
    return;
  }

  // 2. Migrate each to is_sap = true
  let successCount = 0;
  for (const f of allFaturas) {
    console.log(`Migrando [${f.fornecedor}] - NF: ${f.numero_documento || 'S/N'} - ID: ${f.id}`);
    
    const { error: updateError } = await supabase
      .from('faturas')
      .update({ is_sap: true })
      .eq('id', f.id);
      
    if (updateError) {
      console.error(`Falha ao migrar fatura ${f.id}:`, updateError);
    } else {
      successCount++;
    }
  }

  console.log(`Migração concluída com sucesso. Total migrado: ${successCount} de ${allFaturas.length}`);
}

run();
