import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    if (word.length === 0) return word;
    if (['e', 'da', 'de', 'do', 'das', 'dos'].includes(word)) return word;
    if (['ltda', 's.a', 's/a', 'me', 'epp', 'sa', 's.a.', 'e.i.r.e.l.i', 'eireli'].includes(word)) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function getNomeFantasia(razaoSocial) {
  if (!razaoSocial) return '';
  const firstWord = razaoSocial.split(' ')[0];
  return toTitleCase(firstWord);
}

async function run() {
  console.log("Iniciando sincronização...");

  // 1. Fetch faturas (Faturas 1.0)
  const { data: faturas, error: faturasError } = await supabase
    .from('faturas')
    .select('id, cnpj, fornecedor')
    .is('is_sap', false);

  if (faturasError) {
    console.error("Erro ao buscar faturas (false):", faturasError);
    return;
  }
  
  const { data: faturasNull, error: faturasNullError } = await supabase
    .from('faturas')
    .select('id, cnpj, fornecedor')
    .is('is_sap', null);
    
  if (faturasNullError) {
    console.error("Erro ao buscar faturas (null):", faturasNullError);
    return;
  }

  // Filter to Materiais
  // "categoria" is stored in ID like UUID__CAT__Material
  const allFaturas = [...(faturas || []), ...(faturasNull || [])].filter(f => f.id && f.id.includes('__CAT__Material'));
  
  console.log(`Encontradas ${allFaturas.length} faturas de Materiais 1.0.`);

  // 2. Fetch existing fornecedores
  const { data: fornecedores, error: fornError } = await supabase
    .from('fornecedores')
    .select('cnpj');

  if (fornError) {
    console.error("Erro ao buscar fornecedores:", fornError);
    return;
  }

  const existingCnpjs = new Set(fornecedores.map(f => f.cnpj?.trim()));

  // 3. Extract unique missing suppliers
  const mapFaturas = new Map();
  for (const f of allFaturas) {
    const cnpj = f.cnpj?.trim();
    const fornName = f.fornecedor?.trim();
    // Use clear criteria to avoid empty strings
    if (cnpj && cnpj.length > 5 && fornName && !existingCnpjs.has(cnpj) && !mapFaturas.has(cnpj)) {
      mapFaturas.set(cnpj, fornName);
    }
  }

  const toInsert = [];
  for (const [cnpj, razaoOriginal] of mapFaturas.entries()) {
    const razaoSocial = toTitleCase(razaoOriginal);
    const nomeFantasia = getNomeFantasia(razaoOriginal);
    toInsert.push({
      cnpj,
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia,
      tipo: 'Material'
    });
  }

  console.log(`Identificados ${toInsert.length} novos fornecedores únicos a cadastrar.`);

  if (toInsert.length === 0) {
    console.log("Nenhum fornecedor novo para sincronizar.");
    return;
  }

  // 4. Insert records
  console.log("Iniciando inserção...");
  let count = 0;
  for (const item of toInsert) {
    const { error: insertError } = await supabase
      .from('fornecedores')
      .insert([item]);
      
    if (insertError) {
      console.error(`Erro ao inserir ${item.razao_social}:`, insertError);
    } else {
      console.log(`✓ Cadastrado: ${item.razao_social} (${item.cnpj})`);
      count++;
    }
  }

  console.log(`Sincronização concluída! Fornecedores cadastrados com sucesso: ${count}/${toInsert.length}`);
}

run();
