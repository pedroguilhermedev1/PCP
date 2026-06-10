import xlsx from 'xlsx';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Apagando registros antigos de SAE e SAS...");
  await supabase.from('estoque_insumos').delete().eq('empresa', 'SAE');
  await supabase.from('estoque_insumos').delete().eq('empresa', 'SAS');

  console.log("Lendo arquivo Insumos_FOR.xlsx...");
  const buf = fs.readFileSync('Insumos_FOR.xlsx');
  const workbook = xlsx.read(buf, { type: 'buffer' });
  
  const sheetName = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'insumos');
  
  if (!sheetName) {
    console.log("Aba 'Insumos' não encontrada!");
    return;
  }
  
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`Lidas ${data.length} linhas da aba '${sheetName}'. Preparando inserção...`);

  const inserts = [];

  for (const row of data) {
    let codigo = String(row['CÓDIGO'] || '').trim();
    let item = String(row['ITEM'] || '').trim();

    if (!codigo || !item) continue;

    inserts.push({
      empresa: 'SAS',
      codigo: codigo,
      item: item,
      categoria: String(row['CATEGORIA'] || 'Geral'),
      conta_contabil: null,
      descricao_contabil: null,
      cd: 'fortaleza',
      unidade: String(row['UNIDADE'] || ''),
      lead_time: String(row['LEAD TIME'] || '7'),
      estoque_minimo: Number(row['ESTOQUE MÍNIMO']) || 0,
      estoque_real: Number(row['ESTOQUE REAL']) || 0,
      status: String(row['STATUS'] || 'OK')
    });
  }

  console.log(`Inserindo ${inserts.length} registros para SAS Fortaleza...`);

  const chunkSize = 500;
  for (let i = 0; i < inserts.length; i += chunkSize) {
    const chunk = inserts.slice(i, i + chunkSize);
    const { error } = await supabase.from('estoque_insumos').insert(chunk);

    if (error) {
      console.error("Erro na inserção do chunk", i, error);
    } else {
      console.log(`Chunk ${i} a ${i + chunk.length} inserido com sucesso!`);
    }
  }

  console.log("Finalizado com sucesso!");
}

run();
